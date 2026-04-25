// Utilitaires d'authentification — PBKDF2 avec sel aléatoire
// Format de stockage v2 : "pbkdf2v2:<saltHex>:<hashHex>" (600k itérations, OWASP 2023)
// Format de stockage v1 : "pbkdf2:<saltHex>:<hashHex>"   (100k itérations, legacy — migré au login)

const APP_PASSWORD_KEY = 'budget_custom_password_hash';
const DAF_PASSWORD_KEY = 'budget_daf_password_hash';

const PBKDF2_ITERATIONS_V2 = 600_000;
const PBKDF2_ITERATIONS_V1 = 100_000;

const hexToBytes = hex => new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
const bytesToHex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

const derivePBKDF2 = async (password, saltBytes, iterations = PBKDF2_ITERATIONS_V2) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
};

// SHA-256 brut — utilisé uniquement pour migrer les anciens hachages (legacy < pbkdf2)
const sha256Hex = async (password) => {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return bytesToHex(new Uint8Array(buffer));
};

// Hache et stocke un mot de passe en PBKDF2 v2 (600k itérations)
export const storePassword = async (password) => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePBKDF2(password, saltBytes, PBKDF2_ITERATIONS_V2);
  localStorage.setItem(APP_PASSWORD_KEY, `pbkdf2v2:${bytesToHex(saltBytes)}:${hash}`);
  localStorage.removeItem('budget_custom_password');
};

// ── Mot de passe DAF (verrouillage institutionnel) ────────────────
export const storeDafPassword = async (password) => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePBKDF2(password, saltBytes, PBKDF2_ITERATIONS_V2);
  localStorage.setItem(DAF_PASSWORD_KEY, `pbkdf2v2:${bytesToHex(saltBytes)}:${hash}`);
};

export const checkDafPassword = async (typed) => {
  const stored = localStorage.getItem(DAF_PASSWORD_KEY);
  if (!stored) return false;

  if (stored.startsWith('pbkdf2v2:')) {
    const [, saltHex, hash] = stored.split(':');
    return await derivePBKDF2(typed, hexToBytes(saltHex), PBKDF2_ITERATIONS_V2) === hash;
  }
  if (stored.startsWith('pbkdf2:')) {
    const [, saltHex, hash] = stored.split(':');
    const ok = await derivePBKDF2(typed, hexToBytes(saltHex), PBKDF2_ITERATIONS_V1) === hash;
    if (ok) await storeDafPassword(typed); // migration douce v1 → v2
    return ok;
  }
  return false;
};

export const hasDafPassword = () => {
  return !!localStorage.getItem(DAF_PASSWORD_KEY);
};

export const clearDafPassword = () => {
  localStorage.removeItem(DAF_PASSWORD_KEY);
};

// Vérifie le mot de passe — gère pbkdf2v2 (current), pbkdf2 v1 (legacy), SHA-256 (legacy), clair (legacy)
export const checkPassword = async (typed, defaultPassword) => {
  const stored = localStorage.getItem(APP_PASSWORD_KEY);

  if (stored?.startsWith('pbkdf2v2:')) {
    const [, saltHex, hash] = stored.split(':');
    return await derivePBKDF2(typed, hexToBytes(saltHex), PBKDF2_ITERATIONS_V2) === hash;
  }

  if (stored?.startsWith('pbkdf2:')) {
    const [, saltHex, hash] = stored.split(':');
    if (await derivePBKDF2(typed, hexToBytes(saltHex), PBKDF2_ITERATIONS_V1) === hash) {
      await storePassword(typed); // migration douce v1 → v2
      return true;
    }
    return false;
  }

  if (stored) {
    if (await sha256Hex(typed) === stored) {
      await storePassword(typed);
      return true;
    }
    return false;
  }

  const oldClear = localStorage.getItem('budget_custom_password');
  if (oldClear) {
    if (typed === oldClear) {
      await storePassword(typed);
      return true;
    }
    return false;
  }

  if (typed === defaultPassword) {
    await storePassword(typed);
    return true;
  }
  return false;
};
