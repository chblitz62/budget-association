// Provision IDR (Indemnités de Départ à la Retraite) — méthode UCP / IAS 19
//
// Différence avec l'IFC simple :
//   - L'IFC calcule l'engagement à la date de retraite (montant nominal)
//   - L'IDR actuarielle calcule la VALEUR ACTUELLE PROBABLE de l'engagement
//     pondérée par : probabilité de présence à la retraite (turn-over),
//     probabilité de survie (table mortalité), actualisation financière.
//
// Méthode des Unités de Crédit Projetées (UCP) — IAS 19 / Recommandation ANC 2013-02 :
//
//   IDR_agent = M × (a / N) × P_presence × P_survie × (1 + i)^(-n)
//
//   où :
//     M   = montant nominal IFC à la retraite (CCN 66 art. 26)
//     a   = ancienneté actuelle
//     N   = ancienneté à la retraite (a + n)
//     n   = années restantes avant retraite
//     i   = taux d'actualisation (taux IBOXX A10 ans corrigé inflation, défaut 1,5 %)
//     P_presence = (1 - turnOver)^n
//     P_survie   = ratio table TF/TH (approximé par décrément annuel)
//
// Référence : Règl. ANC 2018-06 (associations), IAS 19 (international).

import { CHARGES_PATRONALES, PRIME_SEGUR } from './constants';

// Hypothèses actuarielles par défaut (modifiables via globalParams.idrHypotheses)
const DEFAULT_HYPOTHESES = {
  tauxActualisation: 1.5,   // % — IBOXX A 10 ans corrigé inflation
  tauxTurnOver: 5,          // % — taux annuel de départ volontaire
  ageRetraite: 64,          // âge légal de départ (réforme 2023)
  tauxChargesProvision: 47, // % — charges patronales sur IFC versée (URSSAF + CHORUM + médecine)
  tauxMortalite: 0.3,       // % — décrément annuel de survie (table TF/TH simplifiée)
};

const getHypotheses = (globalParams) => ({
  ...DEFAULT_HYPOTHESES,
  ...(globalParams?.idrHypotheses || {}),
});

/**
 * Calcule la provision IDR actuarielle pour un agent.
 *
 * @param {object} agent — { salaire, etp, segur, anneeNaissance, dateEntree }
 * @param {object} hypotheses — { tauxActualisation, tauxTurnOver, ageRetraite, tauxChargesProvision, tauxMortalite }
 * @param {number} anneeRef — année de référence pour le calcul
 * @param {number} msETP — montant Ségur mensuel par ETP
 * @returns {{
 *   provisionNominale, provisionUCP, provisionAvecCharges,
 *   age, anciennete, anneesRestantes, anneesAncienneteTotale,
 *   probabilitePresence, probabiliteSurvie, coefficientActualisation,
 *   salaireBrutMensuel,
 * }|null}
 */
export const calculerIDRAgent = (agent, hypotheses, anneeRef = 2026, msETP = PRIME_SEGUR) => {
  if (!agent || !agent.anneeNaissance || !agent.dateEntree) return null;

  const age = anneeRef - agent.anneeNaissance;
  const anciennete = Math.max(0, anneeRef - agent.dateEntree);
  const anneesRestantes = Math.max(0, hypotheses.ageRetraite - age);
  const anneesAncienneteTotale = anciennete + anneesRestantes;

  if (anneesAncienneteTotale <= 0) return null;

  const etp = parseFloat(agent.etp) || 1;
  const segurMensuel = agent.segur === true ? msETP : (parseFloat(agent.segur) || 0);
  const salaireBrutMensuel = ((parseFloat(agent.salaire) || 0) + segurMensuel) * etp;

  // ── Engagement nominal IFC à la retraite (CCN 66 art. 26) ────────────
  const tranche1 = Math.min(anneesAncienneteTotale, 10);
  const tranche2 = Math.max(0, anneesAncienneteTotale - 10);
  const engagementRetraite = (salaireBrutMensuel / 4) * tranche1 + (salaireBrutMensuel / 3) * tranche2;

  // ── Engagement nominal proratisé (ancienneté actuelle / totale) ──────
  const provisionNominale = engagementRetraite * (anciennete / anneesAncienneteTotale);

  // ── Pondération actuarielle ──────────────────────────────────────────
  const probabilitePresence = Math.pow(1 - hypotheses.tauxTurnOver / 100, anneesRestantes);
  const probabiliteSurvie = Math.pow(1 - hypotheses.tauxMortalite / 100, anneesRestantes);
  const coefficientActualisation = Math.pow(1 + hypotheses.tauxActualisation / 100, -anneesRestantes);

  const provisionUCP = provisionNominale * probabilitePresence * probabiliteSurvie * coefficientActualisation;

  // ── Charges patronales sur IFC (URSSAF + CHORUM) ─────────────────────
  const provisionAvecCharges = provisionUCP * (1 + hypotheses.tauxChargesProvision / 100);

  return {
    provisionNominale: Math.round(provisionNominale),
    provisionUCP: Math.round(provisionUCP),
    provisionAvecCharges: Math.round(provisionAvecCharges),
    age, anciennete, anneesRestantes, anneesAncienneteTotale,
    probabilitePresence, probabiliteSurvie, coefficientActualisation,
    salaireBrutMensuel: Math.round(salaireBrutMensuel),
  };
};

/**
 * Calcule la provision IDR actuarielle globale.
 *
 * @param {object} direction
 * @param {Array} services
 * @param {object|null} poleSupport
 * @param {object} globalParams
 * @returns {{
 *   agents: Array,
 *   totalProvisionUCP: number,
 *   totalProvisionAvecCharges: number,
 *   totalProvisionNominale: number,
 *   hypotheses: object,
 *   anneeRef: number,
 * }}
 */
export const calculerProvisionIDR = (direction, services, poleSupport, globalParams) => {
  const anneeRef = globalParams?.anneeExercice || new Date().getFullYear();
  const hypotheses = getHypotheses(globalParams);
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;

  const tousAgents = [
    ...(direction?.personnel || []).map(p => ({ ...p, _source: 'Siège' })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p, _source: 'Pôle Support' })),
    ...(services || []).flatMap(s => (s.personnel || []).map(p => ({ ...p, _source: s.nom || 'Service' }))),
  ];

  const agents = tousAgents
    .map(a => {
      const calc = calculerIDRAgent(a, hypotheses, anneeRef, msETP);
      if (!calc) return null;
      return { ...calc, id: a.id, nom: a.titre || a.nom || '—', source: a._source };
    })
    .filter(Boolean)
    .sort((x, y) => x.anneesRestantes - y.anneesRestantes);

  const totalProvisionNominale = agents.reduce((s, a) => s + a.provisionNominale, 0);
  const totalProvisionUCP = agents.reduce((s, a) => s + a.provisionUCP, 0);
  const totalProvisionAvecCharges = agents.reduce((s, a) => s + a.provisionAvecCharges, 0);

  return {
    agents,
    totalProvisionNominale,
    totalProvisionUCP,
    totalProvisionAvecCharges,
    hypotheses,
    anneeRef,
  };
};

export const DEFAULT_IDR_HYPOTHESES = DEFAULT_HYPOTHESES;
