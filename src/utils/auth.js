// Utilitaires d'authentification — PBKDF2 avec sel aléatoire
// Format de stockage : "pbkdf2:<saltHex>:<hashHex>"

const APP_PASSWORD_KEY = 'budget_custom_password_hash';
const DAF_PASSWORD_KEY = 'budget_daf_password_hash';

const hexToBytes = hex => new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
const bytesToHex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

const derivePBKDF2 = async (password, saltBytes) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 100_000 },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
};

// SHA-256 brut — utilisé uniquement pour migrer les anciens hachages
const sha256Hex = async (password) => {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return bytesToHex(new Uint8Array(buffer));
};

// Hache et stocke un mot de passe sous forme PBKDF2
export const storePassword = async (password) => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePBKDF2(password, saltBytes);
  localStorage.setItem(APP_PASSWORD_KEY, `pbkdf2:${bytesToHex(saltBytes)}:${hash}`);
  localStorage.removeItem('budget_custom_password');
};

// ── Mot de passe DAF (verrouillage institutionnel) ────────────────
export const storeDafPassword = async (password) => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePBKDF2(password, saltBytes);
  localStorage.setItem(DAF_PASSWORD_KEY, `pbkdf2:${bytesToHex(saltBytes)}:${hash}`);
};

export const checkDafPassword = async (typed) => {
  const stored = localStorage.getItem(DAF_PASSWORD_KEY);
  if (!stored?.startsWith('pbkdf2:')) return false;
  const [, saltHex, hash] = stored.split(':');
  return await derivePBKDF2(typed, hexToBytes(saltHex)) === hash;
};

export const hasDafPassword = () => {
  return !!localStorage.getItem(DAF_PASSWORD_KEY);
};

export const clearDafPassword = () => {
  localStorage.removeItem(DAF_PASSWORD_KEY);
};

// Vérifie le mot de passe — gère PBKDF2, migration SHA-256 et migration clair
export const checkPassword = async (typed, defaultPassword) => {
  const stored = localStorage.getItem(APP_PASSWORD_KEY);

  if (stored?.startsWith('pbkdf2:')) {
    const [, saltHex, hash] = stored.split(':');
    return await derivePBKDF2(typed, hexToBytes(saltHex)) === hash;
  }

  if (stored) {
    // Legacy SHA-256 sans sel → vérifie puis migre en PBKDF2
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

  // Fallback mot de passe par défaut — stocké en PBKDF2 dès la première utilisation
  if (typed === defaultPassword) {
    await storePassword(typed);
    return true;
  }
  return false;
};
