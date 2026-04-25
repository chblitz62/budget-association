/**
 * storage.js — Persistance centralisée avec validation, migrations et écriture atomique
 *
 * API publique :
 *   loadFromStorage(key, defaultValue) — charge, migre et valide ; retourne le défaut si corrompu
 *   saveAll(dataMap)                   — écriture atomique de plusieurs clés avec rollback
 *   exportData()                       — snapshot JSON téléchargeable
 *   importData(file)                   — import avec validation et migrations par clé
 *   hasStoredData()                    — détecte une session existante
 *   hardReset()                        — effacement total + rechargement
 */
import {
  defaultGlobalParams,
  defaultDirection,
  defaultPoleSupport,
  defaultServices,
} from './constants';

export const SCHEMA_VERSION = '2.3';

// ── Helpers de validation ─────────────────────────────────────────────────────
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isArr = v => Array.isArray(v);
const isAny = () => true;

// ── Migrations par clé ────────────────────────────────────────────────────────
// Idempotentes : peuvent être appelées à chaque chargement sans effet indésirable.

// Champs numériques de globalParams dont la corruption causerait des NaN en cascade
const GLOBAL_PARAMS_NUM_FIELDS = [
  'augmentationAnnuelle', 'tauxGVT', 'inflationEnergie', 'inflationLoyers', 'inflationAutres',
  'delaiPaiementClients', 'delaiPaiementFournisseurs', 'montantSegurETP', 'seuilCouverture',
  'coefficientBP', 'tauxTaxeSalaires', 'tauxTVAMoyen', 'stocksValeur', 'soldeFDOuverture',
];

const migrateGlobalParams = p => {
  if (!isObj(p)) return p;
  // Fusionne avec les valeurs par défaut pour garantir la présence de tous les champs
  const out = { ...defaultGlobalParams, ...p };
  // Coerce les champs numériques critiques — évite les NaN en cascade
  GLOBAL_PARAMS_NUM_FIELDS.forEach(f => {
    if (typeof out[f] !== 'number' || !isFinite(out[f])) out[f] = defaultGlobalParams[f];
  });
  return out;
};

const migrateDirection = d => {
  if (!isObj(d)) return d;
  // Format 1 : loyer/charges/autresCharges → chargesSiege[]
  if (!d.chargesSiege && (d.loyer !== undefined || d.charges !== undefined || d.autresCharges !== undefined)) {
    const m = { ...d, chargesSiege: [] };
    if (d.loyer)         m.chargesSiege.push({ id: 1, nom: 'Loyer',          montant: d.loyer });
    if (d.charges)       m.chargesSiege.push({ id: 2, nom: 'Charges',        montant: d.charges });
    if (d.autresCharges) m.chargesSiege.push({ id: 3, nom: 'Autres charges', montant: d.autresCharges });
    delete m.loyer; delete m.charges; delete m.autresCharges;
    return m;
  }
  // Format 2 : champs manquants → valeurs vides
  const out = { ...d };
  if (!out.exploitation)    out.exploitation    = [];
  if (!out.recettes)        out.recettes        = [];
  if (!out.repartition)     out.repartition     = {};
  if (!out.investissements) out.investissements = {
    bienImmo:    { montant: 0, duree: 25, taux: 0 },
    travaux:     { montant: 0, duree: 10, taux: 0 },
    vehicule:    { montant: 0, duree:  5, taux: 0 },
    informatique:{ montant: 0, duree:  3, taux: 0 },
    mobilier:    { montant: 0, duree: 10, taux: 0 },
  };
  return out;
};

// Sanitise chaque service du tableau : garantit que les listes sont des tableaux
// et que les champs numériques de base (id, salaires) ne sont pas des NaN.
const migrateServices = services => {
  if (!isArr(services)) return services;
  return services.map(s => {
    if (!isObj(s)) return s;
    const out = { ...s };
    if (!isArr(out.personnel))      out.personnel      = [];
    if (!isArr(out.exploitation))   out.exploitation   = [];
    if (!isArr(out.recettes))       out.recettes       = [];
    if (!isArr(out.vacataires))     out.vacataires     = [];
    if (!isObj(out.investissements)) out.investissements = {};
    if (typeof out.id !== 'number' || !isFinite(out.id)) out.id = Date.now();
    return out;
  });
};

// Garantit que chaque agent pool a eligibleSubvention et tauxSubvRegion
const migratePoolRH = agents => {
  if (!isArr(agents)) return agents;
  return agents.map(a => {
    if (!isObj(a)) return a;
    const out = { ...a };
    if (!isArr(out.affectations))                     out.affectations = [];
    if (typeof out.eligibleSubvention !== 'boolean')  out.eligibleSubvention = false;
    if (typeof out.tauxSubvRegion !== 'number')       out.tauxSubvRegion = 100;
    return out;
  });
};

const migrateFormation = f => {
  if (!isObj(f)) return f;
  const out = { ...f };
  if (!isArr(out.actions))         out.actions = [];
  if (typeof out.budget !== 'number') out.budget = 0;
  return out;
};

// ── Schéma de stockage ────────────────────────────────────────────────────────
// Chaque entrée : { defaultValue, validate, migrate?, uiOnly? }
// uiOnly : préférence UI — exportée dans le snapshot mais non requise pour valider un import métier.

export const STORAGE_SCHEMA = {
  // ── Données métier ──────────────────────────────────────────────────────────
  assoc_globalParams:        { defaultValue: defaultGlobalParams,        validate: v => isObj(v) && typeof v.montantSegurETP === 'number' && typeof v.coefficientBP === 'number', migrate: migrateGlobalParams },
  assoc_direction:           { defaultValue: defaultDirection,           validate: v => isObj(v) && isArr(v.personnel ?? []),  migrate: migrateDirection },
  assoc_services:            { defaultValue: defaultServices,            validate: v => isArr(v) && v.every(s => isObj(s) && typeof s.id === 'number'), migrate: migrateServices },
  assoc_pole_support:        { defaultValue: defaultPoleSupport,         validate: v => isObj(v) && isArr(v.personnel ?? []) },
  assoc_pool_rh:             { defaultValue: [],                         validate: isArr, migrate: migratePoolRH },
  assoc_planning_absences:   { defaultValue: {},                         validate: isObj },
  assoc_enveloppe_formation: { defaultValue: { budget: 0, actions: [] }, validate: v => isObj(v) && isArr(v.actions), migrate: migrateFormation },
  assoc_reporting_fc:        { defaultValue: [],                         validate: isArr },
  assoc_donnees_n1:          { defaultValue: null,                       validate: isAny },
  assoc_benevoles:           { defaultValue: [],                         validate: isArr },
  assoc_repartition_temps:   { defaultValue: {},                         validate: isObj },
  assoc_pilotage_sites:      { defaultValue: null,                       validate: isAny },
  assoc_abonnements:         { defaultValue: null,                       validate: isAny },

  // ── Préférences UI ──────────────────────────────────────────────────────────
  assoc_darkMode:             { defaultValue: false,        validate: v => typeof v === 'boolean', uiOnly: true },
  assoc_direction_position:   { defaultValue: 0,            validate: v => typeof v === 'number',  uiOnly: true },
  assoc_pole_support_position:{ defaultValue: 1,            validate: v => typeof v === 'number',  uiOnly: true },
  assoc_active_tab:           { defaultValue: 'dashboard',  validate: v => typeof v === 'string',  uiOnly: true },
  assoc_show_tooltips:        { defaultValue: true,         validate: isAny,                       uiOnly: true },
  budget_sidebar_open:        { defaultValue: true,         validate: isAny,                       uiOnly: true },
  daf_sub:                    { defaultValue: 'subvention', validate: v => typeof v === 'string',  uiOnly: true },
  daf_taux:                   { defaultValue: null,         validate: isAny,                       uiOnly: true },
  daf_formations:             { defaultValue: null,         validate: isAny,                       uiOnly: true },
  daf_transversal:            { defaultValue: null,         validate: isAny,                       uiOnly: true },
  daf_recherche:              { defaultValue: null,         validate: isAny,                       uiOnly: true },
  daf_budget_link:            { defaultValue: null,         validate: isAny,                       uiOnly: true },
  daf_service_links:          { defaultValue: {},           validate: isAny,                       uiOnly: true },

  // ── Données métier — composants autonomes ───────────────────────────────────
  subv_taux:          { defaultValue: {},  validate: isObj },
  subv_eligibilite:   { defaultValue: {},  validate: isObj },
  subv_lignes_manuel: { defaultValue: [],  validate: isArr },
  ventilation_bp:     { defaultValue: null, validate: isAny },
  budget_snapshot_v0: { defaultValue: null, validate: isAny },
  assoc_balance_comptable:  { defaultValue: null, validate: isAny },
  assoc_rolling_forecast:   { defaultValue: null, validate: isAny },
  assoc_engagements:        { defaultValue: [],   validate: isArr },
  assoc_audit_trail:        { defaultValue: [],   validate: isArr },
};

export const STORAGE_KEYS = Object.keys(STORAGE_SCHEMA);

// ── Détection du contexte Electron ───────────────────────────────────────────
// window.electronAPI est injecté par preload.cjs uniquement dans Electron.
// En mode navigateur (dev / démo web), on retombe sur le localStorage.
const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;

// ── loadFromStorage ───────────────────────────────────────────────────────────
// Priorité de lecture :
//   1. Electron → données préchargées depuis data.json (window.electronAPI.initialData)
//   2. Navigateur → localStorage
// Dans les deux cas : migration + validation avant retour.
export const loadFromStorage = (key, defaultValue) => {
  const schema   = STORAGE_SCHEMA[key];
  const fallback = defaultValue !== undefined ? defaultValue : (schema?.defaultValue ?? null);
  try {
    // Source : fichier (Electron) ou localStorage (navigateur)
    let parsed;
    if (isElectron()) {
      const fileData = window.electronAPI.initialData;
      if (!fileData || !(key in fileData)) return fallback;
      parsed = fileData[key];
    } else {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      parsed = JSON.parse(raw);
    }

    if (schema?.migrate) parsed = schema.migrate(parsed);
    if (schema?.validate && !schema.validate(parsed)) {
      console.warn(`[storage] Donnée corrompue pour "${key}" — valeur par défaut utilisée.`);
      return fallback;
    }
    return parsed;
  } catch (e) {
    console.warn(`[storage] Impossible de lire "${key}" — valeur par défaut utilisée.`, e);
    return fallback;
  }
};

// ── saveAll ───────────────────────────────────────────────────────────────────
// 1. Écriture localStorage (synchrone) — retrocompat navigateur + backup local
// Sauvegarde synchrone — à utiliser UNIQUEMENT dans beforeunload pour garantir
// l'écriture fichier avant que le processus Electron ne se ferme.
export const saveAllSync = dataMap => {
  try {
    for (const [key, value] of Object.entries(dataMap)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch { /* ignore les erreurs de quota en beforeunload */ }
  if (isElectron()) {
    window.electronAPI.saveDataSync(dataMap);
  }
};

// 2. Écriture fichier data.json via Electron IPC (async, non-bloquant)
//    En cas d'échec fichier, localStorage reste cohérent.
export const saveAll = dataMap => {
  // ── Étape 1 : localStorage (synchrone, avec rollback en cas de quota) ──────
  const written  = [];
  const previous = {};
  try {
    for (const [key, value] of Object.entries(dataMap)) {
      previous[key] = localStorage.getItem(key);
      localStorage.setItem(key, JSON.stringify(value));
      written.push(key);
    }
  } catch (err) {
    for (const key of written) {
      try {
        if (previous[key] === null) localStorage.removeItem(key);
        else localStorage.setItem(key, previous[key]);
      } catch { /* ignore les erreurs de rollback */ }
    }
    console.error('[storage] Échec saveAll — rollback effectué :', err);
    if (isElectron()) window.appToast?.('Espace disque insuffisant — sauvegarde échouée', 'error');
    throw err;
  }

  // ── Étape 2 : fichier Electron (async, fire-and-forget) ───────────────────
  if (isElectron()) {
    window.electronAPI.saveData(dataMap)
      .then(() => {
        window.dispatchEvent(new CustomEvent('storage-file-saved', {
          detail: { ts: Date.now() }
        }));
      })
      .catch(e => console.warn('[storage] Electron file save failed:', e));
  }
};

// ── hasStoredData ─────────────────────────────────────────────────────────────
export const hasStoredData = () => {
  if (isElectron()) {
    const d = window.electronAPI.initialData;
    return !!(d?.assoc_services || d?.assoc_direction || d?.assoc_globalParams);
  }
  return ['assoc_services', 'assoc_direction', 'assoc_globalParams'].some(
    k => localStorage.getItem(k) !== null
  );
};

// ── exportData ────────────────────────────────────────────────────────────────
export const exportData = () => {
  const snapshot = {
    version: SCHEMA_VERSION,
    type: 'budget-association',
    date: new Date().toISOString(),
  };

  if (isElectron()) {
    // Source unique de vérité en Electron : initialData (état au démarrage)
    // + localStorage pour les modifications depuis le lancement
    const fileData = window.electronAPI.initialData || {};
    STORAGE_KEYS.forEach(key => {
      // localStorage a priorité car il reflète l'état courant de la session
      try {
        const raw = localStorage.getItem(key);
        snapshot[key] = raw !== null ? JSON.parse(raw) : fileData[key];
        if (snapshot[key] === undefined) delete snapshot[key];
      } catch (e) { console.warn(`[storage] Clé "${key}" illisible dans l'export`, e); }
    });
  } else {
    STORAGE_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) snapshot[key] = JSON.parse(raw);
      } catch (e) { console.warn(`[storage] Clé "${key}" corrompue, exclue de l'export`, e); }
    });
  }

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `budget_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

// ── importData ────────────────────────────────────────────────────────────────
// Lit un fichier JSON, valide sa structure, applique les migrations par clé,
// puis écrit le tout de manière atomique via saveAll().
// Retourne une Promise<{ warnings: string[] }>.
export const importData = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.onload = e => {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch {
        reject(new Error('Fichier JSON invalide — impossible de le parser'));
        return;
      }

      // Validation minimale : doit contenir au moins services ou direction
      const hasServices  = data['assoc_services']  != null || data['services']  != null;
      const hasDirection = data['assoc_direction']  != null || data['direction'] != null;
      if (!hasServices && !hasDirection) {
        reject(new Error('Fichier invalide — clés "assoc_services" et "assoc_direction" manquantes'));
        return;
      }

      // Construction du batch : migration + validation par clé
      const batch = {};
      const warnings = [];

      for (const [key, schema] of Object.entries(STORAGE_SCHEMA)) {
        // Support des deux formats : assoc_xxx (nouveau) et xxx sans préfixe (ancien)
        const shortKey = key.replace('assoc_', '');
        let val = data[key] ?? data[shortKey];
        if (val === undefined || val === null) continue;

        if (schema.migrate) {
          try { val = schema.migrate(val); }
          catch { /* garde la valeur brute si la migration échoue */ }
        }

        if (!schema.validate(val)) {
          warnings.push(`"${key}" ignoré — structure invalide après migration`);
          continue;
        }

        batch[key] = val;
      }

      if (warnings.length > 0) {
        console.warn('[storage] Import — clés ignorées :', warnings.join(', '));
      }

      try {
        saveAll(batch);
        resolve({ warnings });
      } catch (err) {
        reject(new Error(`Erreur lors de l'écriture : ${err.message}`));
      }
    };
    reader.readAsText(file);
  });

// ── hardReset ─────────────────────────────────────────────────────────────────
export const hardReset = () => {
  localStorage.clear();
  sessionStorage.clear();
  if (isElectron()) {
    // Écrase data.json avec un objet vide avant de recharger
    window.electronAPI.saveData({ _reset: true, _resetAt: new Date().toISOString() })
      .finally(() => { window.location.href = '/'; });
  } else {
    window.location.href = '/';
  }
};
