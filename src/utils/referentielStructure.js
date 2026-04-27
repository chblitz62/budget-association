// Référentiel de Structure — Axe 6 S6.2 (Dictionnaire analytique)
//
// Centralisation des unités analytiques (Lieux, Services, Filières) pour :
//   - supprimer les libellés en dur dans les composants
//   - permettre la ventilation analytique (S6.1 — futur)
//   - alimenter les listes déroulantes des engagements, fonds dédiés, etc.
//   - fournir un code unique stable (pour clés analytiques OPCO/Région)
//
// Modèle :
//   {
//     lieux: [{ id, code, libelle, adresse, actif }],
//     services: [{ id, code, libelle, type, actif }],
//     filieres: [{ id, code, libelle, niveau, certificateur, actif }],
//   }
//
// Code = identifiant court stable (ex : "ARR" pour Arras), libelle = nom complet,
// actif = booléen pour archivage soft (préserve l'historique).
//
// Storage : assoc_referentiel_structure (localStorage atomique via saveAll).

const safe = (s) => String(s ?? '').trim();
const slug = (s) => safe(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 8);

export const TYPES_SERVICE = [
  { id: 'pedagogie', label: 'Pédagogie', accent: 'indigo' },
  { id: 'restauration', label: 'Restauration', accent: 'amber' },
  { id: 'technique', label: 'Technique', accent: 'cyan' },
  { id: 'support', label: 'Support / Administration', accent: 'violet' },
  { id: 'autre', label: 'Autre', accent: 'slate' },
];

export const NIVEAUX_FILIERE = [
  { id: 'niveau3', label: 'Niveau 3 (CAP)' },
  { id: 'niveau4', label: 'Niveau 4 (Bac)' },
  { id: 'niveau5', label: 'Niveau 5 (BTS, DUT, DEUG)' },
  { id: 'niveau6', label: 'Niveau 6 (Licence)' },
  { id: 'niveau7', label: 'Niveau 7 (Master, DEES)' },
  { id: 'fc', label: 'Formation Continue (sans niveau)' },
  { id: 'autre', label: 'Autre' },
];

export const REFERENTIEL_DEFAULT = { lieux: [], services: [], filieres: [] };

/**
 * Valide qu'un référentiel chargé depuis le storage est bien structuré.
 * Renvoie le référentiel normalisé.
 */
export const normaliserReferentiel = (raw) => {
  const r = raw || {};
  return {
    lieux: Array.isArray(r.lieux) ? r.lieux.filter(Boolean) : [],
    services: Array.isArray(r.services) ? r.services.filter(Boolean) : [],
    filieres: Array.isArray(r.filieres) ? r.filieres.filter(Boolean) : [],
  };
};

/**
 * Crée une nouvelle entrée pour un type donné (lieu/service/filiere).
 * Génère un id unique et un code par défaut basé sur le libellé.
 */
export const creerEntree = (type, partial = {}) => {
  const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const libelle = safe(partial.libelle) || 'Nouveau';
  const base = {
    id,
    code: safe(partial.code) || slug(libelle),
    libelle,
    actif: partial.actif !== false,
  };
  if (type === 'lieu')    return { ...base, adresse: safe(partial.adresse) };
  if (type === 'service') return { ...base, type: partial.type || 'pedagogie' };
  if (type === 'filiere') return { ...base, niveau: partial.niveau || 'autre', certificateur: safe(partial.certificateur) };
  return base;
};

/**
 * Vérifie qu'aucun code ne soit en doublon dans une catégorie.
 * Renvoie un objet { codeId: 'duplicate' | undefined } pour signaler les conflits.
 */
export const detecterDoublonsCode = (entries = []) => {
  const codes = {};
  const conflits = {};
  entries.forEach(e => {
    const k = safe(e.code).toUpperCase();
    if (!k) return;
    if (codes[k]) conflits[e.id] = 'duplicate';
    else codes[k] = e.id;
  });
  return conflits;
};

/**
 * Synthèse pour affichage (compteurs, taux d'actif).
 */
export const calculerSyntheseReferentiel = (referentiel) => {
  const r = normaliserReferentiel(referentiel);
  const cat = (arr) => ({
    total: arr.length,
    actifs: arr.filter(e => e.actif !== false).length,
    archives: arr.filter(e => e.actif === false).length,
  });
  return {
    lieux: cat(r.lieux),
    services: cat(r.services),
    filieres: cat(r.filieres),
    total: r.lieux.length + r.services.length + r.filieres.length,
  };
};

/**
 * Helper pour récupérer une entrée par id (toutes catégories confondues).
 */
export const trouverEntree = (referentiel, id) => {
  const r = normaliserReferentiel(referentiel);
  return r.lieux.find(l => l.id === id)
    || r.services.find(s => s.id === id)
    || r.filieres.find(f => f.id === id)
    || null;
};

/**
 * Helper pour récupérer une entrée par code (catégorie ciblée).
 * @param {'lieux'|'services'|'filieres'} categorie
 */
export const trouverParCode = (referentiel, categorie, code) => {
  const r = normaliserReferentiel(referentiel);
  const list = r[categorie] || [];
  const k = safe(code).toUpperCase();
  return list.find(e => safe(e.code).toUpperCase() === k) || null;
};

/**
 * Génère des options pour <select> à partir du référentiel
 * (filtre les inactifs par défaut).
 */
export const genererOptions = (referentiel, categorie, { incluireInactifs = false } = {}) => {
  const r = normaliserReferentiel(referentiel);
  const list = r[categorie] || [];
  return list
    .filter(e => incluireInactifs || e.actif !== false)
    .map(e => ({ value: e.id, label: `${e.code} — ${e.libelle}`, code: e.code, libelle: e.libelle }));
};

export { slug as slugifyCode };
