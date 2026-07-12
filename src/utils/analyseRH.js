// Analyse RH par Centre de Coût — Axe 6 (Pilotage Analytique Multidimensionnel)
//
// Pour chaque service opérationnel, ventile la masse salariale entre :
//   - personnel interne (rattaché directement au service)
//   - quote-part Pool RH (agents mutualisés répartis via `affectations`)
//
// et calcule les indicateurs de pilotage RH :
//
//   MS totale (€/an)         = Σ salaire chargé interne + quote-part Pool RH
//   ETP total                = ETP internes + ETP affectés depuis le pool
//   Coût moyen / ETP         = MS totale ÷ ETP total
//   Coût RH / étudiant       = MS totale ÷ effectif actuel
//   Ratio MS / charges       = MS totale ÷ charges directes du service       (en %)
//   Ratio MS / recettes      = MS totale ÷ recettes du service               (en %)
//
// Seuils métier (organismes de formation, CCN 66 / CCN 51) :
//   Ratio MS/charges > 80 %  → ⚠ structure RH-intensive (peu de marge sur consommables)
//   Ratio MS/recettes > 90 % → ✕ MS dépasse 90 % des recettes — modèle non viable
//   Ratio MS/recettes 70-90 % → ⚠ tension RH, peu de marge sur les autres charges
//   Ratio MS/recettes ≤ 70 % → ✓ structure RH soutenable

import {
  calculerSalaireAnnuel,
  calculerPartPoolRH,
} from './calculations';
import {
  PRIME_SEGUR,
  CHARGES_PATRONALES,
  calculerStatsFormation,
} from './constants';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

// Seuils sémantiques (pourcentages)
export const SEUIL_MS_RECETTES_DANGER = 90;
export const SEUIL_MS_RECETTES_WARNING = 70;
export const SEUIL_MS_CHARGES_WARNING = 80;

const niveauRH = (ratioMSRecettes, ratioMSCharges, recettes) => {
  if (recettes <= 0) return 'neutral';
  if (ratioMSRecettes > SEUIL_MS_RECETTES_DANGER) return 'danger';
  if (ratioMSRecettes >= SEUIL_MS_RECETTES_WARNING) return 'warning';
  if (ratioMSCharges > SEUIL_MS_CHARGES_WARNING) return 'warning';
  return 'success';
};

/**
 * Cumule le salaire annuel chargé du personnel interne d'un service.
 */
const calculerMSInterne = (personnel, montantSegurETP, tauxChargesBase) => {
  let total = 0;
  let etp = 0;
  (personnel || []).forEach(p => {
    const sal = calculerSalaireAnnuel(
      p.salaire,
      p.etp,
      p.segur === true ? montantSegurETP : safe(p.segur),
      p.typeContrat,
      p.tauxChargesManuel,
      p.estPosteAPourvoir ? p.dateDebutPrevue : null,
      p.moisPrime,
      p.montantPrime,
      tauxChargesBase
    );
    total += sal.total;
    etp += safe(p.etp);
  });
  return { total, etp };
};

/**
 * Cumule la quote-part Pool RH affectée à un service donné.
 * @returns { total: number, etp: number, agents: number }
 */
const calculerMSPool = (poolRH, serviceId, montantSegurETP) => {
  const part = calculerPartPoolRH(poolRH || [], 'service', serviceId, montantSegurETP);
  const etp = (part.details || []).reduce((s, d) => s + safe(d.etpEffectif), 0);
  return { total: part.totalSalaires, etp, agents: (part.details || []).length };
};

/**
 * Analyse RH par centre de coût (service).
 *
 * @param {Array} services
 * @param {Array} poolRH
 * @param {Function} getBudgetService — (s) => { recettes, total, salaires, exploitation }
 * @param {object} globalParams — `montantSegurETP`, `tauxChargesBase` (optionnels)
 * @returns {{
 *   parService: Array<{
 *     id, nom, effectif,
 *     msInterne, msPool, msTotal,
 *     etpInterne, etpPool, etpTotal, agentsPool,
 *     coutMoyenETP, coutRHParEtudiant,
 *     chargesDirectes, recettes,
 *     ratioMSCharges, ratioMSRecettes,
 *     partMSConsolidee,
 *     niveau, rang,
 *   }>,
 *   totaux: {
 *     totalMS, totalMSInterne, totalMSPool,
 *     totalETP, totalETPInterne, totalETPPool,
 *     totalEffectif, totalCharges, totalRecettes,
 *     coutMoyenETPGlobal, ratioMSChargesGlobal, ratioMSRecettesGlobal,
 *     nbServicesEnDanger, nbServicesEnWarning,
 *   },
 * }}
 */
export const calculerAnalyseRH = (services, poolRH, getBudgetService, globalParams = null) => {
  const montantSegurETP = safe(globalParams?.montantSegurETP) || PRIME_SEGUR;
  const tauxChargesBase = globalParams?.tauxChargesBase ?? CHARGES_PATRONALES;

  const list = (services || []).filter(s => s && s.id);

  const enriched = list.map(s => {
    const interne = calculerMSInterne(s.personnel, montantSegurETP, tauxChargesBase);
    const pool = calculerMSPool(poolRH, s.id, montantSegurETP);
    const stats = calculerStatsFormation(s);
    const effectif = safe(stats.effectifActuel);

    const budget = getBudgetService ? getBudgetService(s) : { total: 0, recettes: 0 };
    const chargesDirectes = safe(budget.total);
    const recettes = safe(budget.recettes);

    const msTotal = interne.total + pool.total;
    const etpTotal = interne.etp + pool.etp;

    const coutMoyenETP = etpTotal > 0 ? msTotal / etpTotal : 0;
    const coutRHParEtudiant = effectif > 0 ? msTotal / effectif : 0;
    const ratioMSCharges = chargesDirectes > 0 ? (msTotal / chargesDirectes) * 100 : 0;
    const ratioMSRecettes = recettes > 0 ? (msTotal / recettes) * 100 : 0;
    const niveau = niveauRH(ratioMSRecettes, ratioMSCharges, recettes);

    return {
      id: s.id,
      nom: s.nom || 'Service',
      effectif,
      msInterne: Math.round(interne.total),
      msPool: Math.round(pool.total),
      msTotal: Math.round(msTotal),
      etpInterne: Math.round(interne.etp * 100) / 100,
      etpPool: Math.round(pool.etp * 100) / 100,
      etpTotal: Math.round(etpTotal * 100) / 100,
      agentsPool: pool.agents,
      coutMoyenETP: Math.round(coutMoyenETP),
      coutRHParEtudiant: Math.round(coutRHParEtudiant),
      chargesDirectes: Math.round(chargesDirectes),
      recettes: Math.round(recettes),
      ratioMSCharges: Math.round(ratioMSCharges * 10) / 10,
      ratioMSRecettes: Math.round(ratioMSRecettes * 10) / 10,
      partMSConsolidee: 0,
      niveau,
      rang: 0,
    };
  });

  const totalMS = enriched.reduce((s, x) => s + x.msTotal, 0);
  enriched.forEach(s => {
    s.partMSConsolidee = totalMS > 0
      ? Math.round((s.msTotal / totalMS) * 1000) / 10
      : 0;
  });

  // Classement par MS décroissante (le service "le plus lourd" en RH = #1)
  const tri = [...enriched].sort((a, b) => b.msTotal - a.msTotal);
  tri.forEach((s, i) => { s.rang = i + 1; });

  const parService = [...enriched].sort((a, b) => a.rang - b.rang);

  const totalMSInterne = parService.reduce((s, x) => s + x.msInterne, 0);
  const totalMSPool = parService.reduce((s, x) => s + x.msPool, 0);
  const totalETP = parService.reduce((s, x) => s + x.etpTotal, 0);
  const totalETPInterne = parService.reduce((s, x) => s + x.etpInterne, 0);
  const totalETPPool = parService.reduce((s, x) => s + x.etpPool, 0);
  const totalEffectif = parService.reduce((s, x) => s + x.effectif, 0);
  const totalCharges = parService.reduce((s, x) => s + x.chargesDirectes, 0);
  const totalRecettes = parService.reduce((s, x) => s + x.recettes, 0);

  const coutMoyenETPGlobal = totalETP > 0 ? Math.round(totalMS / totalETP) : 0;
  const ratioMSChargesGlobal = totalCharges > 0
    ? Math.round((totalMS / totalCharges) * 1000) / 10
    : 0;
  const ratioMSRecettesGlobal = totalRecettes > 0
    ? Math.round((totalMS / totalRecettes) * 1000) / 10
    : 0;

  const nbServicesEnDanger = parService.filter(s => s.niveau === 'danger').length;
  const nbServicesEnWarning = parService.filter(s => s.niveau === 'warning').length;

  return {
    parService,
    totaux: {
      totalMS,
      totalMSInterne,
      totalMSPool,
      totalETP: Math.round(totalETP * 100) / 100,
      totalETPInterne: Math.round(totalETPInterne * 100) / 100,
      totalETPPool: Math.round(totalETPPool * 100) / 100,
      totalEffectif,
      totalCharges,
      totalRecettes,
      coutMoyenETPGlobal,
      ratioMSChargesGlobal,
      ratioMSRecettesGlobal,
      nbServicesEnDanger,
      nbServicesEnWarning,
    },
  };
};

/**
 * Recommandation contextuelle DAF par niveau RH.
 */
export const recommendationRH = (niveau, ratioMSRecettes, ratioMSCharges) => {
  if (niveau === 'success') {
    return `✓ Structure RH soutenable (${ratioMSRecettes.toFixed(1)} % MS/recettes). Marge confortable pour les autres charges et la rémunération de la structure.`;
  }
  if (niveau === 'warning') {
    if (ratioMSRecettes >= SEUIL_MS_RECETTES_WARNING) {
      return `⚠ Tension RH — la masse salariale absorbe ${ratioMSRecettes.toFixed(1)} % des recettes. Peu de marge pour les autres charges. Surveiller les recrutements et privilégier la mutualisation Pool RH.`;
    }
    return `⚠ Service RH-intensif — la MS représente ${ratioMSCharges.toFixed(1)} % des charges directes. Peu de leviers sur les consommables — l'optimisation passe par les ETP.`;
  }
  if (niveau === 'danger') {
    return `✕ MS critique — ${ratioMSRecettes.toFixed(1)} % des recettes consommées par la masse salariale. Modèle non viable : revoir le mix vacataires/permanents ou renégocier le tarif OPCO.`;
  }
  return 'Aucune recette — ratio non mesurable.';
};
