// Seuil de Rentabilité (Point Mort) par service / promo — Axe 3
//
// Calcule, à partir du coût complet par service (Axe 6 S6.3), l'effectif
// minimal nécessaire pour couvrir les charges fixes — autrement dit le
// "point mort" pédagogico-financier — et la marge de sécurité associée.
//
// Modèle métier classique du contrôle de gestion :
//
//   Charges fixes (CF)        = coût complet × ratioCF              (loyers, RH permanents, structure)
//   Charges variables (CV)    = coût complet × (1 − ratioCF)        (consommables, restauration, fluides)
//   Recette / étudiant (R)    = recettes service ÷ effectif actuel
//   CV / étudiant (cv)        = CV total ÷ effectif actuel
//   Marge sur CV / étudiant   = R − cv                              (= "m")
//   Point mort en effectif    = CF ÷ m                              (= N*)
//   Marge de sécurité         = (effectif − N*) ÷ effectif          (en %)
//
// Le ratioCF est configurable par service via
// `globalParams.ratioChargesFixesParService` (défaut RATIO_CF_DEFAULT = 75 %,
// typique des organismes de formation où la masse salariale permanente
// domine la structure de coût).

import { calculerCoutCompletParService } from './clesRepartition';
import { calculerStatsFormation } from './constants';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

// Ratio Charges Fixes / Coût Complet par défaut (75 % — RH permanent dominant)
export const RATIO_CF_DEFAULT = 75;

// Seuil de marge de sécurité au-dessus duquel l'activité est jugée "confortable"
export const SEUIL_MARGE_CONFORT = 25; // %

const ratioParService = (globalParams, serviceId) => {
  const direct = globalParams?.ratioChargesFixesParService?.[serviceId];
  if (direct === undefined || direct === null || direct === '') return RATIO_CF_DEFAULT;
  const v = safe(direct);
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
};

const niveauRentabilite = (margeSecuritePct, margeUnitaire, effectif) => {
  if (effectif <= 0) return 'neutral';
  if (margeUnitaire <= 0) return 'danger'; // pas de marge sur CV → point mort inatteignable
  if (margeSecuritePct < 0) return 'danger';
  if (margeSecuritePct < SEUIL_MARGE_CONFORT) return 'warning';
  return 'success';
};

/**
 * Calcule le seuil de rentabilité (point mort) par service.
 *
 * @param {Array} services
 * @param {object} budgetSiege — { total: number }
 * @param {Function} getBudgetService — (s) => { recettes, total, ... }
 * @param {object} globalParams — `cleRepartition` + `ratioChargesFixesParService`
 * @returns {{
 *   parService: Array<{
 *     id, nom, effectif,
 *     coutComplet, recettes, ratioCF,
 *     chargesFixes, chargesVariables,
 *     recetteParEtudiant, cvParEtudiant, margeUnitaire,
 *     pointMortEffectif, etudiantsManquants, margeSecuritePct,
 *     niveau,
 *   }>,
 *   totaux: {
 *     totalEffectif, totalCoutComplet, totalRecettes,
 *     totalChargesFixes, totalChargesVariables,
 *     pointMortConsolide, etudiantsManquantsTotal, margeSecuriteMoyennePct,
 *     nbServicesEnDanger, nbServicesEnWarning,
 *   },
 * }}
 */
export const calculerSeuilRentabilite = (services, budgetSiege, getBudgetService, globalParams) => {
  const cleType = globalParams?.cleRepartition?.type || 'etp';
  const cleParams = globalParams?.cleRepartition?.params || {};
  const repartition = calculerCoutCompletParService(services, budgetSiege, getBudgetService, cleType, cleParams);

  const parService = repartition.parService.map(c => {
    const service = (services || []).find(s => s.id === c.id);
    const stats = service ? calculerStatsFormation(service) : { effectifActuel: 0 };
    const effectif = stats.effectifActuel || 0;

    const coutComplet = safe(c.coutComplet);
    const recettes = safe(c.recettesDirectes);
    const ratioCF = ratioParService(globalParams, c.id);

    const chargesFixes = coutComplet * (ratioCF / 100);
    const chargesVariables = coutComplet - chargesFixes;

    const recetteParEtudiant = effectif > 0 ? recettes / effectif : 0;
    const cvParEtudiant = effectif > 0 ? chargesVariables / effectif : 0;
    const margeUnitaire = recetteParEtudiant - cvParEtudiant;

    const pointMortEffectif = margeUnitaire > 0 ? Math.ceil(chargesFixes / margeUnitaire) : null;
    const etudiantsManquants = pointMortEffectif !== null
      ? Math.max(0, pointMortEffectif - effectif)
      : null;
    const margeSecuritePct = (effectif > 0 && pointMortEffectif !== null)
      ? ((effectif - pointMortEffectif) / effectif) * 100
      : null;

    const niveau = niveauRentabilite(
      margeSecuritePct === null ? -100 : margeSecuritePct,
      margeUnitaire,
      effectif,
    );

    return {
      id: c.id,
      nom: c.nom,
      effectif,
      coutComplet: Math.round(coutComplet),
      recettes: Math.round(recettes),
      ratioCF,
      chargesFixes: Math.round(chargesFixes),
      chargesVariables: Math.round(chargesVariables),
      recetteParEtudiant: Math.round(recetteParEtudiant),
      cvParEtudiant: Math.round(cvParEtudiant),
      margeUnitaire: Math.round(margeUnitaire),
      pointMortEffectif,
      etudiantsManquants,
      margeSecuritePct: margeSecuritePct === null ? null : Math.round(margeSecuritePct * 10) / 10,
      niveau,
    };
  });

  const totalEffectif = parService.reduce((s, x) => s + x.effectif, 0);
  const totalCoutComplet = parService.reduce((s, x) => s + x.coutComplet, 0);
  const totalRecettes = parService.reduce((s, x) => s + x.recettes, 0);
  const totalChargesFixes = parService.reduce((s, x) => s + x.chargesFixes, 0);
  const totalChargesVariables = parService.reduce((s, x) => s + x.chargesVariables, 0);

  const recetteEtudConso = totalEffectif > 0 ? totalRecettes / totalEffectif : 0;
  const cvEtudConso = totalEffectif > 0 ? totalChargesVariables / totalEffectif : 0;
  const margeConso = recetteEtudConso - cvEtudConso;
  const pointMortConsolide = margeConso > 0 ? Math.ceil(totalChargesFixes / margeConso) : null;
  const etudiantsManquantsTotal = pointMortConsolide !== null
    ? Math.max(0, pointMortConsolide - totalEffectif)
    : null;
  const margeSecuriteMoyennePct = (totalEffectif > 0 && pointMortConsolide !== null)
    ? Math.round(((totalEffectif - pointMortConsolide) / totalEffectif) * 1000) / 10
    : null;

  const nbServicesEnDanger = parService.filter(s => s.niveau === 'danger').length;
  const nbServicesEnWarning = parService.filter(s => s.niveau === 'warning').length;

  return {
    parService,
    totaux: {
      totalEffectif,
      totalCoutComplet: Math.round(totalCoutComplet),
      totalRecettes: Math.round(totalRecettes),
      totalChargesFixes: Math.round(totalChargesFixes),
      totalChargesVariables: Math.round(totalChargesVariables),
      pointMortConsolide,
      etudiantsManquantsTotal,
      margeSecuriteMoyennePct,
      nbServicesEnDanger,
      nbServicesEnWarning,
    },
  };
};

/**
 * Recommandation contextuelle DAF par niveau.
 */
export const recommendationSeuil = (niveau, etudiantsManquants, margeSecuritePct) => {
  if (niveau === 'success') {
    return `✓ Marge de sécurité confortable (+${margeSecuritePct?.toFixed(1)} %). L'activité absorbe une baisse d'effectif sans risque.`;
  }
  if (niveau === 'warning') {
    return `⚠ Marge de sécurité fragile (+${margeSecuritePct?.toFixed(1)} %). Une baisse modérée d'effectif basculerait la promo en perte. Verrouiller le recrutement.`;
  }
  if (niveau === 'danger') {
    if (etudiantsManquants && etudiantsManquants > 0) {
      return `✕ Sous le point mort : il manque ${etudiantsManquants} étudiant${etudiantsManquants > 1 ? 's' : ''} pour couvrir les charges fixes. Revoir le ratio CF/CV ou le tarif de vente.`;
    }
    return `✕ Marge unitaire négative ou nulle : aucun nombre d'étudiants ne permettra l'équilibre. Modèle économique à reconsidérer.`;
  }
  return 'Aucun étudiant inscrit — calcul indisponible.';
};
