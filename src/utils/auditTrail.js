// Audit trail signé — chaînage SHA-256 (Phase 7 Tier 1, audit DAF 2026-04-25)
// Chaque entrée référence le hash de la précédente : modification a posteriori détectable.
//
// Format entrée : { ts, action, module, details, prevHash, hash }
//   hash = SHA-256(prevHash || ts || action || module || details)
//   prevHash de l'entrée 0 (genesis) = '0'.repeat(64)
//
// API :
//   appendSigned(prevEntry, action, module, details) → entrée signée
//   verifyChain(entries)                              → { valid, brokenAt, total }
//   migrateLegacyEntries(entries)                     → reconstruit la chaîne pour entrées non signées

const GENESIS_HASH = '0'.repeat(64);

const bytesToHex = bytes =>
  Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

const sha256Hex = async (str) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return bytesToHex(new Uint8Array(buf));
};

const computeHash = async ({ prevHash, ts, action, module, details }) =>
  sha256Hex(`${prevHash}|${ts}|${action}|${module}|${details}`);

/**
 * Crée une nouvelle entrée signée chaînée à la précédente.
 * @param {object|null} prevEntry — dernière entrée du journal (ou null pour genesis)
 * @returns {Promise<{ts,action,module,details,prevHash,hash}>}
 */
export const appendSigned = async (prevEntry, action, module = '', details = '') => {
  const ts = new Date().toISOString();
  const prevHash = prevEntry?.hash || GENESIS_HASH;
  const hash = await computeHash({ prevHash, ts, action, module, details });
  return { ts, action, module, details, prevHash, hash };
};

/**
 * Vérifie l'intégrité du journal complet.
 * @param {Array<object>} entries — journal du plus récent au plus ancien (ordre d'insertion : prepend)
 * @returns {Promise<{ valid: boolean, brokenAt: number|null, total: number, signedCount: number }>}
 */
export const verifyChain = async (entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { valid: true, brokenAt: null, total: 0, signedCount: 0 };
  }
  // Le journal est stocké en ordre inversé (plus récent en tête).
  // On vérifie depuis la plus ancienne (queue) vers la plus récente (tête).
  const ordered = [...entries].reverse();
  let prevHash = GENESIS_HASH;
  let signedCount = 0;
  for (let i = 0; i < ordered.length; i++) {
    const e = ordered[i];
    if (!e.hash || !e.prevHash) continue; // entrée legacy non signée — ignorée
    if (e.prevHash !== prevHash) {
      return { valid: false, brokenAt: ordered.length - 1 - i, total: entries.length, signedCount };
    }
    const expected = await computeHash(e);
    if (expected !== e.hash) {
      return { valid: false, brokenAt: ordered.length - 1 - i, total: entries.length, signedCount };
    }
    prevHash = e.hash;
    signedCount += 1;
  }
  return { valid: true, brokenAt: null, total: entries.length, signedCount };
};

/**
 * Reconstruit la chaîne de hash à partir d'entrées legacy non signées.
 * Conserve le contenu (ts/action/module/details) mais ajoute prevHash + hash.
 * À utiliser une seule fois lors de la migration v1 → v2 du journal.
 */
export const migrateLegacyEntries = async (entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const ordered = [...entries].reverse();
  const signed = [];
  let prevHash = GENESIS_HASH;
  for (const e of ordered) {
    const ts = e.ts || new Date().toISOString();
    const action = e.action || '';
    const module = e.module || '';
    const details = e.details || '';
    const hash = await computeHash({ prevHash, ts, action, module, details });
    signed.push({ ts, action, module, details, prevHash, hash });
    prevHash = hash;
  }
  return signed.reverse();
};
