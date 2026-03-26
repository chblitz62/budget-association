/**
 * storage.js — Gestion centralisée de la persistance
 * Fonctions : exportData, importData, hasStoredData, hardReset
 */

// Toutes les clés localStorage gérées par l'application
export const STORAGE_KEYS = [
  'assoc_globalParams',
  'assoc_direction',
  'assoc_services',
  'assoc_pole_support',
  'assoc_pool_rh',
  'assoc_enveloppe_formation',
  'assoc_abonnements',
  'assoc_reporting_fc',
  'assoc_donnees_n1',
  'assoc_planning_absences',
  'assoc_pilotage_sites',
  'assoc_direction_position',
  'assoc_pole_support_position',
  'assoc_darkMode',
  'assoc_active_tab',
  'budget_sidebar_open',
  'daf_taux',
  'daf_formations',
  'daf_transversal',
  'daf_recherche',
  'daf_budget_link',
];

/**
 * Retourne true si au moins une clé métier est présente dans localStorage.
 */
export const hasStoredData = () =>
  ['assoc_services', 'assoc_direction', 'assoc_globalParams'].some(
    k => localStorage.getItem(k) !== null
  );

/**
 * Agrège toutes les clés en un objet JSON et déclenche le téléchargement.
 */
export const exportData = () => {
  const snapshot = {
    version: '2.2',
    type: 'budget-association',
    date: new Date().toISOString(),
  };
  STORAGE_KEYS.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) snapshot[key] = JSON.parse(raw);
    } catch { /* ignore clés corrompues */ }
  });

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `budget_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

/**
 * Lit un fichier JSON, valide sa structure et écrase le localStorage.
 * Retourne une Promise. Rejette avec un message d'erreur lisible si invalide.
 */
export const importData = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.onload = (e) => {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch {
        reject(new Error('Fichier JSON invalide — impossible de le parser'));
        return;
      }

      // Validation minimale : doit contenir au moins les services ou la direction
      const hasServices  = data['assoc_services']  != null || data['services']  != null;
      const hasDirection = data['assoc_direction']  != null || data['direction'] != null;
      if (!hasServices && !hasDirection) {
        reject(new Error('Fichier de sauvegarde invalide — clés "assoc_services" et "assoc_direction" manquantes'));
        return;
      }

      // Écriture : support des deux formats (nouveau assoc_* et ancien sans préfixe)
      STORAGE_KEYS.forEach(key => {
        const shortKey = key.replace('assoc_', '');
        const val = data[key] ?? data[shortKey];
        if (val !== null && val !== undefined) {
          localStorage.setItem(key, JSON.stringify(val));
        }
      });

      resolve();
    };
    reader.readAsText(file);
  });

/**
 * Suppression totale : vide le localStorage et recharge l'application.
 */
export const hardReset = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/';
};
