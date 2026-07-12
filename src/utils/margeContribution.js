// Reporting de Contribution — Axe 6 (Marge contributive par service)
//
// Identifie les "leviers" (services qui dégagent une marge sur coût variable
// importante et donc absorbent les charges fixes du siège) vs les "poids
// morts" (services à marge contributive faible ou négative).
//
// Modèle métier classique du contrôle de gestion (différent du point mort) :
//
//   Recettes (R)              = recettes annuelles du service
//   Charges fixes (CF)        = coût complet × ratioCF              (structure, RH permanents)
//   Charges variables (CV)    = coût complet × (1 − ratioCF)        (consommables, vacataires…)
//   Marge contribution (MC)   = R − CV                              (€/an)
//   Taux contribution (%)     = MC ÷ R × 100                        (en %)
//   Part contribution (%)     = MC ÷ ΣMC positives × 100            (poids relatif des leviers)
//   Couverture CF du service  = MC ÷ CF du service × 100            (autonomie du service)
//
// Le ratioCF est partagé avec `seuilRentabilite.js` (`globalParams.ratioChargesFixesParService`,
// défaut RATIO_CF_DEFAULT = 75 %).
//
// Lecture stratégique :
//   - Levier (taux ≥ 30 %)        : service qui finance les autres / la structure
//   - Marginal (0 % < taux < 30 %) : contribution faible, à renforcer
//   - Poids mort (taux ≤ 0)       : MC négative — le service détruit de la valeur avant CF

import { calculerCoutCompletParService } from './clesRepartition';
import { RATIO_CF_DEFAULT } from './seuilRentabilite';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

// Seuil de taux de contribution au-delà duquel le service est jugé "levier"
export const SEUIL_LEVIER = 30; // %

const ratioParService = (globalParams, serviceId) => {
  const direct = globalParams?.ratioChargesFixesParService?.[serviceId];
  if (direct === undefined || direct === null || direct === '') return RATIO_CF_DEFAULT;
  const v = safe(direct);
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
};

const niveauContribution = (recettes, margeContribution, tauxContribution) => {
  if (recettes <= 0) return 'neutral';
  if (margeContribution <= 0) return 'danger';      // poids mort
  if (tauxContribution < SEUIL_LEVIER) return 'warning'; // marginal
  return 'success';                                 // levier
};

/**
 * Calcule la marge de contribution par service.
 *
 * @param {Array} services
 * @param {object} budgetSiege — { total: number }
 * @param {Function} getBudgetService — (s) => { recettes, total, salaires, exploitation }
 * @param {object} globalParams — `cleRepartition` + `ratioChargesFixesParService`
 * @returns {{
 *   parService: Array<{
 *     id, nom,
 *     recettes, chargesFixes, chargesVariables, coutComplet,
 *     margeContribution, tauxContribution, partContribution,
 *     couvertureCF, niveau, rang,
 *   }>,
 *   totaux: {
 *     totalRecettes, totalChargesVariables, totalChargesFixes,
 *     totalMargeContribution, tauxContributionGlobal,
 *     nbLeviers, nbMarginaux, nbPoidsMort,
 *     coutsFixesCouverts, surplus,
 *   },
 * }}
 */
export const calculerMargeContribution = (services, budgetSiege, getBudgetService, globalParams) => {
  const cleType = globalParams?.cleRepartition?.type || 'etp';
  const cleParams = globalParams?.cleRepartition?.params || {};
  const repartition = calculerCoutCompletParService(services, budgetSiege, getBudgetService, cleType, cleParams);

  const enriched = repartition.parService.map(c => {
    const recettes = safe(c.recettesDirectes);
    const coutComplet = safe(c.coutComplet);
    const ratioCF = ratioParService(globalParams, c.id);

    const chargesFixes = coutComplet * (ratioCF / 100);
    const chargesVariables = coutComplet - chargesFixes;
    const margeContribution = recettes - chargesVariables;
    const tauxContribution = recettes > 0 ? (margeContribution / recettes) * 100 : 0;
    const couvertureCF = chargesFixes > 0 ? (margeContribution / chargesFixes) * 100 : null;
    const niveau = niveauContribution(recettes, margeContribution, tauxContribution);

    return {
      id: c.id,
      nom: c.nom,
      recettes: Math.round(recettes),
      chargesFixes: Math.round(chargesFixes),
      chargesVariables: Math.round(chargesVariables),
      coutComplet: Math.round(coutComplet),
      margeContribution: Math.round(margeContribution),
      tauxContribution: Math.round(tauxContribution * 10) / 10,
      couvertureCF: couvertureCF === null ? null : Math.round(couvertureCF * 10) / 10,
      niveau,
      // partContribution & rang remplis ci-dessous
      partContribution: 0,
      rang: 0,
    };
  });

  // Part de contribution (sur les marges positives uniquement — ce que les leviers absorbent)
  const totalMargesPositives = enriched.reduce((s, x) => s + (x.margeContribution > 0 ? x.margeContribution : 0), 0);
  enriched.forEach(s => {
    s.partContribution = totalMargesPositives > 0 && s.margeContribution > 0
      ? Math.round((s.margeContribution / totalMargesPositives) * 1000) / 10
      : 0;
  });

  // Classement par marge contribution décroissante
  const tri = [...enriched].sort((a, b) => b.margeContribution - a.margeContribution);
  tri.forEach((s, i) => { s.rang = i + 1; });

  // Re-order parService selon le rang pour un rendu naturel "leviers en tête"
  const parService = [...enriched].sort((a, b) => a.rang - b.rang);

  const totalRecettes = parService.reduce((s, x) => s + x.recettes, 0);
  const totalChargesVariables = parService.reduce((s, x) => s + x.chargesVariables, 0);
  const totalChargesFixes = parService.reduce((s, x) => s + x.chargesFixes, 0);
  const totalMargeContribution = parService.reduce((s, x) => s + x.margeContribution, 0);
  const tauxContributionGlobal = totalRecettes > 0
    ? Math.round((totalMargeContribution / totalRecettes) * 1000) / 10
    : 0;

  const nbLeviers = parService.filter(s => s.niveau === 'success').length;
  const nbMarginaux = parService.filter(s => s.niveau === 'warning').length;
  const nbPoidsMort = parService.filter(s => s.niveau === 'danger').length;

  const coutsFixesCouverts = totalMargeContribution >= totalChargesFixes;
  const surplus = totalMargeContribution - totalChargesFixes;

  return {
    parService,
    totaux: {
      totalRecettes,
      totalChargesVariables,
      totalChargesFixes,
      totalMargeContribution,
      tauxContributionGlobal,
      nbLeviers,
      nbMarginaux,
      nbPoidsMort,
      coutsFixesCouverts,
      surplus: Math.round(surplus),
    },
  };
};

/**
 * Recommandation contextuelle DAF par niveau.
 */
export const recommendationContribution = (niveau, tauxContribution, couvertureCF) => {
  if (niveau === 'success') {
    const cov = couvertureCF !== null && couvertureCF >= 100
      ? ` et couvre ${couvertureCF.toFixed(0)} % de ses propres charges fixes`
      : '';
    return `✓ Levier — taux de contribution ${tauxContribution.toFixed(1)} %${cov}. Service qui finance la structure et les autres filières.`;
  }
  if (niveau === 'warning') {
    return `⚠ Contribution marginale (${tauxContribution.toFixed(1)} %). Le service couvre ses charges variables mais peine à absorber sa quote-part de structure. Renforcer le tarif ou l'effectif.`;
  }
  if (niveau === 'danger') {
    return `✕ Poids mort — marge contributive négative. Les recettes ne couvrent même pas les charges variables. Décision stratégique : restructurer ou arrêter l'activité.`;
  }
  return 'Aucune recette enregistrée — contribution non mesurable.';
};
