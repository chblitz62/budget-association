// Moteur de Fonds Dédiés — CRC 2018-06 (Axe 7)
//
// Référence : Règlement ANC 2018-06 — Comptes 19 (passif) et 78 (produits).
//
//   Compte 194 — Fonds dédiés sur subventions de fonctionnement (passif)
//   Compte 195 — Fonds dédiés sur autres ressources liées à la générosité du public
//   Compte 197 — Fonds reportés liés aux legs et donations
//   Compte 78  — Reprises sur amortissements, dépréciations et provisions (produits)
//   Compte 689 — Engagements à réaliser (charges) — vire en 19 le solde non consommé
//
// Mécanisme :
//   1. À la clôture N : la fraction non consommée d'une ressource affectée → Débit 689 / Crédit 194
//      (sortie du compte de résultat, comptabilisée au passif)
//   2. À l'ouverture N+1 : la part consommée sur N+1 → Débit 194 / Crédit 78
//      (réintégrée en produits au prorata de la consommation)
//
// Modèle métier :
//   { id, nom, financeur, projet, montantInitial, dateReception, dateEcheance,
//     consommeAnneeCourante, reportAnneePrecedente, categorie }
//
// Calculs :
//   - solde = montantInitial + reportAnneePrecedente - consommeAnneeCourante
//   - tauxConsommation = consommeAnneeCourante / (montantInitial + reportAnneePrecedente)
//   - statut : 'actif' | 'echu' | 'solde' | 'a_reporter' (si non solde et fin exercice)
//   - alerte : true si dateEcheance < +60 jours

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

const CATEGORIES = {
  subvention_fonctionnement: { compte: '194', libelle: 'Subventions de fonctionnement' },
  generosite_public:         { compte: '195', libelle: 'Générosité du public' },
  legs_donations:            { compte: '197', libelle: 'Legs et donations' },
};

const joursAvantEcheance = (dateEcheance) => {
  if (!dateEcheance) return null;
  const ech = new Date(dateEcheance);
  if (Number.isNaN(ech.getTime())) return null;
  const now = new Date();
  return Math.floor((ech - now) / (1000 * 60 * 60 * 24));
};

const determineStatut = (fonds, solde) => {
  if (solde <= 0.01) return 'solde';
  const jours = joursAvantEcheance(fonds.dateEcheance);
  if (jours != null && jours < 0) return 'echu';
  return 'actif';
};

/**
 * Valorise un fonds individuel.
 * @param {object} fonds — { montantInitial, reportAnneePrecedente, consommeAnneeCourante, dateEcheance, categorie }
 * @returns {{ ressources, consomme, solde, tauxConsommation, statut, joursAvantEcheance, alerte, categorie }}
 */
export const valoriserFonds = (fonds) => {
  const f = fonds || {};
  const montantInitial = safe(f.montantInitial);
  const report = safe(f.reportAnneePrecedente);
  const consomme = safe(f.consommeAnneeCourante);
  const ressources = montantInitial + report;
  const solde = ressources - consomme;
  const tauxConsommation = ressources > 0 ? Math.min(1, consomme / ressources) : 0;
  const statut = determineStatut(f, solde);
  const jours = joursAvantEcheance(f.dateEcheance);
  const alerte = jours != null && jours >= 0 && jours <= 60 && solde > 0.01;
  const categorie = f.categorie || 'subvention_fonctionnement';

  return {
    ressources, consomme, solde, tauxConsommation, statut,
    joursAvantEcheance: jours, alerte, categorie,
  };
};

/**
 * Synthèse globale des fonds dédiés.
 *
 * @param {Array} fondsDedies
 * @returns {{
 *   fonds: Array<{ ...input, ...valorisation }>,
 *   totalRessources, totalConsomme, totalSolde,
 *   reportN1: number, // total à reporter en N+1 (compte 19 passif)
 *   compte689, compte78,
 *   parCategorie: { [cat]: { compte, libelle, total, count } },
 *   alertes: Array, // fonds avec alerte=true
 *   nbActifs, nbEchu, nbSolde,
 * }}
 */
export const calculerSyntheseFondsDedies = (fondsDedies = []) => {
  if (!Array.isArray(fondsDedies)) fondsDedies = [];

  const fonds = fondsDedies.map(raw => {
    const f = raw || {};
    const v = valoriserFonds(f);
    return {
      id: f.id || Math.random().toString(36).slice(2),
      nom: f.nom || 'Fonds sans nom',
      financeur: f.financeur || '',
      projet: f.projet || '',
      montantInitial: safe(f.montantInitial),
      reportAnneePrecedente: safe(f.reportAnneePrecedente),
      consommeAnneeCourante: safe(f.consommeAnneeCourante),
      dateReception: f.dateReception || '',
      dateEcheance: f.dateEcheance || '',
      ...v,
    };
  });

  const totalRessources = fonds.reduce((s, f) => s + f.ressources, 0);
  const totalConsomme = fonds.reduce((s, f) => s + f.consomme, 0);
  const totalSolde = fonds.reduce((s, f) => s + f.solde, 0);
  const reportN1 = fonds.filter(f => f.statut === 'actif').reduce((s, f) => s + f.solde, 0);

  // Ventilation par catégorie comptable (compte 19 ventilé)
  const parCategorie = {};
  Object.keys(CATEGORIES).forEach(catId => {
    const items = fonds.filter(f => f.categorie === catId && f.solde > 0);
    parCategorie[catId] = {
      ...CATEGORIES[catId],
      total: items.reduce((s, f) => s + f.solde, 0),
      count: items.length,
    };
  });

  const alertes = fonds.filter(f => f.alerte || f.statut === 'echu');
  const nbActifs = fonds.filter(f => f.statut === 'actif').length;
  const nbEchu = fonds.filter(f => f.statut === 'echu').length;
  const nbSolde = fonds.filter(f => f.statut === 'solde').length;

  return {
    fonds,
    totalRessources, totalConsomme, totalSolde,
    reportN1,
    // Compte 689 (charges) = solde transféré vers compte 19 (passif)
    compte689: reportN1,
    // Compte 78 (produits) = reports N-1 réintégrés sur l'exercice courant (somme des reportAnneePrecedente)
    compte78: fonds.reduce((s, f) => s + f.reportAnneePrecedente, 0),
    parCategorie,
    alertes,
    nbActifs, nbEchu, nbSolde,
  };
};

export const CATEGORIES_FONDS_DEDIES = Object.entries(CATEGORIES).map(([id, c]) => ({ id, ...c }));

/**
 * Recommandation contextuelle pour un fonds individuel.
 */
export const recommendationFonds = (fonds) => {
  if (fonds.statut === 'solde') return '✓ Fonds intégralement consommé. Aucun report en N+1.';
  if (fonds.statut === 'echu') return `✕ Date d'échéance dépassée. Solde de ${Math.round(fonds.solde).toLocaleString('fr-FR')} € à régulariser : remboursement financeur ou avenant.`;
  if (fonds.alerte) return `⚠ Échéance proche (${fonds.joursAvantEcheance} j). Accélérer la consommation ou demander prorogation au financeur.`;
  if (fonds.tauxConsommation < 0.3) return `🟡 Sous-consommation (${Math.round(fonds.tauxConsommation * 100)} %). Vérifier que le projet avance conformément au calendrier.`;
  return `✓ Fonds en cours de consommation normale (${Math.round(fonds.tauxConsommation * 100)} %).`;
};
