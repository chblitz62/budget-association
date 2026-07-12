// Résultat de l'exercice — SOURCE UNIQUE DE VÉRITÉ
//
// Ce module définit LA formule du résultat net prévisionnel, consommée par :
//   - le dashboard (BudgetContext.kpiGlobaux)
//   - le compte de résultat formel (compteResultat.js)
//   - le bilan prévisionnel (bilanPrevisionnel.js)
//   - le tableau de financement (tableauFinancement.js)
//
// Définition retenue (audit DAF juillet 2026) :
//   Résultat net = Produits − (Charges budgétaires + Dotations aux provisions + Taxe sur salaires)
//   où Charges budgétaires = Σ entités (salaires + exploitation + amortissements + intérêts + carence maladie)
//
// Tous les paramètres globaux (Ségur, coefficient BP, taux de charges patronales,
// TVA, Pool RH, planning d'absences) sont appliqués ici une seule fois, à
// l'identique pour tous les états — c'est ce qui garantit leur réconciliation.

import {
  calculerBudgetDirection, calculerBudgetService, calculerBudgetPoleSupport,
  calculerProvisions, calculerTaxeSalairesProgressif,
} from './calculations';
import { PRIME_SEGUR, CHARGES_PATRONALES } from './constants';

const safe = (n) => (Number.isFinite(n) ? n : 0);

// Brut versé (salaire + Ségur + primes) d'une liste de détails de salaires
const _sumBrut = (details) =>
  (details || []).reduce((s, d) => s + safe(d.brut) + safe(d.brutSegur) + safe(d.primeBrute), 0);

// Taxe sur salaires — barème progressif CGI art. 231, calculé par agent (jamais sur l'agrégat)
const _sumTaxeProgressif = (details) =>
  (details || []).reduce((s, d) => {
    const brut = safe(d.brut) + safe(d.brutSegur) + safe(d.primeBrute);
    return s + calculerTaxeSalairesProgressif(brut);
  }, 0);

/**
 * Calcule le résultat net de l'exercice et ses composantes.
 *
 * @param {Object}      direction
 * @param {Array}       services
 * @param {Object|null} poleSupport
 * @param {Object}      globalParams - { anneeExercice, montantSegurETP, coefficientBP,
 *                                       tauxChargesPatronales, gestionTVA, tauxTVAMoyen,
 *                                       taxeSalaires, provisions, ... }
 * @param {Array}       poolRH
 * @param {Object|null} planningAbsences
 * @returns {{
 *   annee: number,
 *   produits: number,               Recettes totales (explicites + subventions Région agents), coefficient BP appliqué
 *   chargesBudgetaires: number,     Σ entités .total (salaires + exploitation + amort + intérêts + carence)
 *   provisions: number,             Dotations aux provisions (calculerProvisions)
 *   taxeSalaires: number,           Taxe sur salaires CGI 231 (0 si non activée)
 *   chargesTotales: number,         chargesBudgetaires + provisions + taxeSalaires
 *   resultatNet: number,            produits − chargesTotales
 *   detail: {
 *     totalSalaires: number,        Masse salariale chargée (permanents + vacataires + Pool RH)
 *     remunerationsBrutes: number,  Brut versé (base compte 641)
 *     chargesSociales: number,      totalSalaires − remunerationsBrutes (base compte 645)
 *     coutCarenceMaladie: number,
 *     exploitation: number,
 *     amortissements: number,
 *     interets: number,
 *   },
 *   budgets: { direction: Object, poleSupport: Object|null, services: Array }
 * }}
 */
export const calculerResultatExercice = (direction, services, poleSupport, globalParams, poolRH = [], planningAbsences = null) => {
  const annee = globalParams?.anneeExercice || 2026;
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const coeffBP = globalParams?.coefficientBP ?? 100;
  const tvaParams = globalParams?.gestionTVA
    ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 }
    : null;
  const tauxChargesBase = (globalParams?.tauxChargesPatronales ?? (CHARGES_PATRONALES * 100)) / 100;

  const bdDir = calculerBudgetDirection(direction, planningAbsences, annee, msETP, poolRH, tvaParams, coeffBP, tauxChargesBase);
  const bdPS = poleSupport
    ? calculerBudgetPoleSupport(poleSupport, planningAbsences, annee, msETP, poolRH, tvaParams, coeffBP, tauxChargesBase)
    : null;
  const bdSvcs = (services || []).map(s =>
    calculerBudgetService(s, planningAbsences, annee, msETP, poolRH, tvaParams, coeffBP, tauxChargesBase));

  const entites = [bdDir, ...(bdPS ? [bdPS] : []), ...bdSvcs];
  const sum = (key) => entites.reduce((s, b) => s + safe(b[key]), 0);

  const produits = sum('recettes');
  const chargesBudgetaires = sum('total');
  const totalSalaires = sum('salaires');
  const coutCarenceMaladie = sum('coutCarenceMaladie');
  const exploitation = sum('exploitation');
  const amortissements = sum('amortissements');
  const interets = sum('interets');

  // Brut versé réel (Fillon inclus agent par agent) — remplace la décomposition au taux plat
  const remunerationsBrutes = entites.reduce((s, b) =>
    s + _sumBrut(b.detailsSalaires) + _sumBrut(b.detailsPoolRH)
      + (b.detailsVacataires || []).reduce((sv, v) => sv + safe(v.coutBrut), 0), 0);
  const chargesSociales = totalSalaires - remunerationsBrutes;

  const taxeSalaires = globalParams?.taxeSalaires === true
    ? entites.reduce((s, b) => s + _sumTaxeProgressif(b.detailsSalaires) + _sumTaxeProgressif(b.detailsPoolRH), 0)
    : 0;

  const provisions = safe(calculerProvisions(direction, services, globalParams, poleSupport, poolRH)?.total);

  const chargesTotales = chargesBudgetaires + provisions + taxeSalaires;
  const resultatNet = produits - chargesTotales;

  return {
    annee,
    produits,
    chargesBudgetaires,
    provisions,
    taxeSalaires,
    chargesTotales,
    resultatNet,
    detail: {
      totalSalaires,
      remunerationsBrutes,
      chargesSociales,
      coutCarenceMaladie,
      exploitation,
      amortissements,
      interets,
    },
    budgets: { direction: bdDir, poleSupport: bdPS, services: bdSvcs },
  };
};
