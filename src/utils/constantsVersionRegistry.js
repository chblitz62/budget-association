// Versionnement des constantes fiscales et sociales — Audit DAF Tier 3
//
// Permet de tracer l'évolution des barèmes (charges patronales, SMIC, Ségur,
// taxe salaires, etc.) avec date d'application, source légale et justification.
//
// Cas d'usage :
//   - Audit rétroactif CAC : "quel taux a été utilisé pour le calcul Q3 2024 ?"
//   - Simulation "ancienne base" : recalcul d'un budget passé avec sa réalité réglementaire
//   - Justification documentaire : retracer la chaîne de validation (qui, quand, pourquoi)
//
// Storage : assoc_constants_history (localStorage)
// Format :
//   {
//     CHARGES_PATRONALES: [
//       { valeur, dateApplication: 'YYYY-MM-DD', source, justification, validePar?, ts },
//       ...
//     ],
//     ...
//   }

import {
  CHARGES_PATRONALES, PRIME_SEGUR, SMIC_MENSUEL,
  TAUX_TAXE_SALAIRES, TAUX_TAXE_SALAIRES_T2, TAUX_TAXE_SALAIRES_T3,
  SEUIL_TAXE_SALAIRES_T2, SEUIL_TAXE_SALAIRES_T3,
  TAUX_FILLON_MAX, TAUX_CHARGES_APPRENTI,
  SEUIL_HEURES_VACATAIRE, SEUIL_RATIO_VACATAIRE,
  CHARGES_VACATAIRE,
} from './constants';

const STORAGE_KEY = 'assoc_constants_history';

// ── Constantes versionnables avec historique légal de référence ─────────
export const CONSTANTES_VERSIONNABLES = {
  CHARGES_PATRONALES: {
    label: 'Charges patronales globales',
    unite: '%',
    formatValeur: (v) => `${(v * 100).toFixed(2)} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()) / 100,
    valeurCourante: CHARGES_PATRONALES,
    historique: [
      { valeur: 0.42, dateApplication: '2020-01-01', source: 'CCN 66 v2020', justification: 'Taux générique avant intégration prévoyance' },
      { valeur: 0.44, dateApplication: '2026-04-18', source: 'Audit CAC AFERTES', justification: 'Inclusion CHORUM/OCIRP (3,5 %) + médecine du travail (0,5 %)' },
    ],
  },
  SMIC_MENSUEL: {
    label: 'SMIC mensuel brut (35 h)',
    unite: '€',
    formatValeur: (v) => `${v.toFixed(2)} €`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('€', '').trim()),
    valeurCourante: SMIC_MENSUEL,
    historique: [
      { valeur: 1709.28, dateApplication: '2024-01-01', source: 'Décret 2023-1216', justification: 'Revalorisation +1,13 %' },
      { valeur: 1766.92, dateApplication: '2024-11-01', source: 'Décret 2024-952', justification: 'Revalorisation +2 %' },
      { valeur: 1801.80, dateApplication: '2025-01-01', source: 'Décret 2024-1211', justification: 'Revalorisation +1,97 %' },
      { valeur: 1841.45, dateApplication: '2025-11-01', source: 'Décret 2025-XXXX', justification: 'Revalorisation +2,2 %' },
    ],
  },
  PRIME_SEGUR: {
    label: 'Prime Ségur médico-social',
    unite: '€/ETP/mois',
    formatValeur: (v) => `${v.toFixed(0)} €/ETP/mois`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('€', '').trim()),
    valeurCourante: PRIME_SEGUR,
    historique: [
      { valeur: 183, dateApplication: '2022-04-01', source: 'Décret 2022-728', justification: 'Création prime Ségur médico-social' },
      { valeur: 238, dateApplication: '2026-01-01', source: 'Accord de branche 2025', justification: 'Revalorisation négociée' },
    ],
  },
  TAUX_TAXE_SALAIRES: {
    label: 'Taxe salaires — Tranche 1',
    unite: '%',
    formatValeur: (v) => `${(v * 100).toFixed(2)} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()) / 100,
    valeurCourante: TAUX_TAXE_SALAIRES,
    historique: [
      { valeur: 0.0425, dateApplication: '2020-01-01', source: 'CGI Art. 231', justification: 'Taux normal taxe sur salaires (associations non assujetties TVA)' },
    ],
  },
  TAUX_TAXE_SALAIRES_T2: {
    label: 'Taxe salaires — Tranche 2 (8 572-17 114 €)',
    unite: '%',
    formatValeur: (v) => `${(v * 100).toFixed(2)} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()) / 100,
    valeurCourante: TAUX_TAXE_SALAIRES_T2,
    historique: [
      { valeur: 0.085, dateApplication: '2020-01-01', source: 'CGI Art. 231 al.2', justification: 'Tranche intermédiaire' },
    ],
  },
  TAUX_TAXE_SALAIRES_T3: {
    label: 'Taxe salaires — Tranche 3 (> 17 114 €)',
    unite: '%',
    formatValeur: (v) => `${(v * 100).toFixed(2)} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()) / 100,
    valeurCourante: TAUX_TAXE_SALAIRES_T3,
    historique: [
      { valeur: 0.136, dateApplication: '2020-01-01', source: 'CGI Art. 231 al.3', justification: 'Tranche supérieure' },
    ],
  },
  SEUIL_TAXE_SALAIRES_T2: {
    label: 'Seuil tranche 2 taxe salaires',
    unite: '€',
    formatValeur: (v) => `${v.toLocaleString('fr-FR')} €`,
    parseValeur: (s) => parseInt(String(s).replace(/[^0-9]/g, ''), 10),
    valeurCourante: SEUIL_TAXE_SALAIRES_T2,
    historique: [
      { valeur: 8572, dateApplication: '2026-01-01', source: 'CGI Art. 231', justification: 'Indexation barème 2026' },
    ],
  },
  SEUIL_TAXE_SALAIRES_T3: {
    label: 'Seuil tranche 3 taxe salaires',
    unite: '€',
    formatValeur: (v) => `${v.toLocaleString('fr-FR')} €`,
    parseValeur: (s) => parseInt(String(s).replace(/[^0-9]/g, ''), 10),
    valeurCourante: SEUIL_TAXE_SALAIRES_T3,
    historique: [
      { valeur: 17114, dateApplication: '2026-01-01', source: 'CGI Art. 231', justification: 'Indexation barème 2026' },
    ],
  },
  TAUX_FILLON_MAX: {
    label: 'Réduction Fillon — taux max',
    unite: '%',
    formatValeur: (v) => `${(v * 100).toFixed(2)} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()) / 100,
    valeurCourante: TAUX_FILLON_MAX,
    historique: [
      { valeur: 0.3214, dateApplication: '2024-01-01', source: 'Loi de finances 2024', justification: 'Taux maximal applicable au SMIC' },
    ],
  },
  TAUX_CHARGES_APPRENTI: {
    label: 'Charges patronales apprenti / pro',
    unite: '%',
    formatValeur: (v) => `${(v * 100).toFixed(2)} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()) / 100,
    valeurCourante: TAUX_CHARGES_APPRENTI,
    historique: [
      { valeur: 0.12, dateApplication: '2024-01-01', source: 'CSS Art. L.6243-2', justification: 'Cotisations réduites alternance' },
    ],
  },
  SEUIL_HEURES_VACATAIRE: {
    label: 'Seuil heures vacataire/an',
    unite: 'h/an',
    formatValeur: (v) => `${v} h/an`,
    parseValeur: (s) => parseInt(String(s).replace(/[^0-9]/g, ''), 10),
    valeurCourante: SEUIL_HEURES_VACATAIRE,
    historique: [
      { valeur: 450, dateApplication: '2020-01-01', source: 'Code du travail Art. L.1242-2', justification: 'Seuil de requalification URSSAF' },
    ],
  },
  SEUIL_RATIO_VACATAIRE: {
    label: 'Ratio MS vacataire — alerte',
    unite: '%',
    formatValeur: (v) => `${v} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()),
    valeurCourante: SEUIL_RATIO_VACATAIRE,
    historique: [
      { valeur: 30, dateApplication: '2026-04-25', source: 'Politique interne AFERTES', justification: 'Seuil d\'alerte de dépendance vacataire' },
    ],
  },
  CHARGES_VACATAIRE: {
    label: 'Charges patronales vacataires',
    unite: '%',
    formatValeur: (v) => `${v} %`,
    parseValeur: (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim()),
    valeurCourante: CHARGES_VACATAIRE,
    historique: [
      { valeur: 15, dateApplication: '2024-01-01', source: 'URSSAF — barème vacation', justification: 'Cotisations réduites' },
    ],
  },
};

// ── Helpers de stockage ──────────────────────────────────────────────
export const chargerHistorique = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const out = {};
    Object.keys(CONSTANTES_VERSIONNABLES).forEach(key => {
      const def = CONSTANTES_VERSIONNABLES[key].historique;
      const stored = Array.isArray(raw[key]) ? raw[key] : [];
      // Fusion : entrées défaut + entrées custom (dédupliquées par date+valeur)
      const seen = new Set();
      const merged = [...def, ...stored]
        .filter(e => {
          const sig = `${e.dateApplication}_${e.valeur}`;
          if (seen.has(sig)) return false;
          seen.add(sig);
          return true;
        })
        .sort((a, b) => a.dateApplication.localeCompare(b.dateApplication));
      out[key] = merged;
    });
    return out;
  } catch {
    const out = {};
    Object.keys(CONSTANTES_VERSIONNABLES).forEach(key => { out[key] = [...CONSTANTES_VERSIONNABLES[key].historique]; });
    return out;
  }
};

export const sauvegarderHistorique = (historique) => {
  // On ne stocke que les entrées custom (différentes des entrées par défaut)
  const customOnly = {};
  Object.keys(historique).forEach(key => {
    const def = CONSTANTES_VERSIONNABLES[key]?.historique || [];
    const defSet = new Set(def.map(e => `${e.dateApplication}_${e.valeur}`));
    const custom = (historique[key] || []).filter(e => !defSet.has(`${e.dateApplication}_${e.valeur}`));
    if (custom.length > 0) customOnly[key] = custom;
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly)); } catch { /* quota */ }
};

/**
 * Ajoute une entrée à l'historique d'une constante.
 */
export const ajouterEntreeHistorique = (historique, constanteKey, entree) => {
  if (!CONSTANTES_VERSIONNABLES[constanteKey]) return historique;
  const newEntry = {
    valeur: entree.valeur,
    dateApplication: entree.dateApplication,
    source: entree.source || '',
    justification: entree.justification || '',
    validePar: entree.validePar || '',
    ts: new Date().toISOString(),
  };
  const next = { ...historique };
  next[constanteKey] = [...(next[constanteKey] || []), newEntry]
    .sort((a, b) => a.dateApplication.localeCompare(b.dateApplication));
  return next;
};

/**
 * Retourne la valeur d'une constante à une date donnée (rétroactif).
 * @param {object} historique — objet retourné par chargerHistorique
 * @param {string} constanteKey
 * @param {string|Date} date — date de référence (YYYY-MM-DD ou Date)
 * @returns {{ valeur, source, justification, dateApplication } | null}
 */
export const valeurALaDate = (historique, constanteKey, date) => {
  const entries = historique?.[constanteKey] || [];
  if (entries.length === 0) return null;
  const d = (date instanceof Date) ? date.toISOString().slice(0, 10) : String(date);
  // Dernière entrée dont dateApplication <= d
  const applicable = entries
    .filter(e => e.dateApplication <= d)
    .sort((a, b) => b.dateApplication.localeCompare(a.dateApplication))[0];
  return applicable || entries[0]; // fallback : 1re entrée connue
};

/**
 * Compare la valeur courante (constants.js) à la dernière entrée historique.
 * Renvoie un avertissement si elles divergent (incohérence à régulariser).
 */
export const detecterIncoherences = (historique) => {
  const incoherences = [];
  Object.keys(CONSTANTES_VERSIONNABLES).forEach(key => {
    const def = CONSTANTES_VERSIONNABLES[key];
    const last = (historique?.[key] || []).slice(-1)[0];
    if (!last) return;
    const ecart = Math.abs((last.valeur || 0) - (def.valeurCourante || 0));
    const seuil = Math.abs(def.valeurCourante || 1) * 0.001; // tolérance 0,1 %
    if (ecart > seuil) {
      incoherences.push({
        constante: key,
        label: def.label,
        valeurCode: def.valeurCourante,
        valeurHistorique: last.valeur,
        dateApplication: last.dateApplication,
      });
    }
  });
  return incoherences;
};
