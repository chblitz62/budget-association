// Bilan prévisionnel actif/passif équilibré (PCG associatif — CRC 99-01 / Règl. ANC 2018-06)
//
// Équation comptable fondamentale : ACTIF = PASSIF
//
// Construction à partir des modules existants :
//   - Immobilisations brutes / amortissements / nettes : calculerFondRoulement
//   - Capitaux propres : globalParams.fondRoulement[] (réserves, RAN…) + résultat de l'exercice
//   - Provisions : calculerProvisions
//   - BFR (créances clients, dettes fournisseurs, dettes URSSAF) : calculerBFR
//   - Trésorerie = Fonds de Roulement − BFR (positive → Disponibilités, négative → Découvert)
//   - Dettes financières : capital restant dû des emprunts
//
// Référence : Règl. ANC 2018-06, Plan Comptable Associatif.

import {
  calculerFondRoulement, calculerBFR, calculerProvisions,
  calculerBudgetDirection, calculerBudgetService, calculerBudgetPoleSupport,
} from './calculations';
import { PRIME_SEGUR } from './constants';

const safe = (n) => (Number.isFinite(n) ? n : 0);

const sumFinancements = (entites) => {
  let capitalRestantDu = 0;
  entites.forEach(e => {
    const invs = e?.investissements || {};
    Object.values(invs).forEach(inv => {
      if (!inv || typeof inv !== 'object') return;
      // Si l'immobilisation est financée par emprunt, on considère le capital restant dû
      // approximé à (montant × % financé). En l'absence d'info, on retient 0.
      const montant = inv.montant || 0;
      const ptgEmprunt = (inv.financementEmprunt || 0) / 100;
      const ageAns = Math.max(0, inv.ageAns || 0);
      const dureePret = inv.dureePret || inv.duree || 0;
      if (montant > 0 && ptgEmprunt > 0 && dureePret > 0) {
        const capInitial = montant * ptgEmprunt;
        const restant = Math.max(0, capInitial * (1 - ageAns / dureePret));
        capitalRestantDu += restant;
      }
    });
  });
  return capitalRestantDu;
};

/**
 * Construit le bilan prévisionnel équilibré.
 * @returns {{
 *   actif: { immobilisationsBrutes, amortissementsCumules, immobilisationsNettes, stocks, creancesClients, disponibilites, totalActif },
 *   passif: { capitauxPropresAuto, capitauxPropresManuels, resultatExercice, totalCapitauxPropres,
 *             provisions, dettesFinancieres, dettesFournisseurs, dettesURSSAF, decouvert, totalPassif },
 *   equilibre: { ecart, valide }
 * }}
 */
export const calculerBilanPrevisionnel = (direction, services, poleSupport, globalParams) => {
  const annee = globalParams?.anneeExercice || new Date().getFullYear();
  const msETP = globalParams?.montantSegurETP ?? PRIME_SEGUR;
  const bpCoeff = globalParams?.coefficientBP ?? 100;

  // ── Calcul du résultat de l'exercice (= solde global) ─────────────
  const bdDir = calculerBudgetDirection(direction, null, annee, msETP, [], null, bpCoeff);
  const bdPS  = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, annee, msETP, [], null, bpCoeff) : { total: 0, recettes: 0 };
  let recettesTotal = safe(bdDir.recettes) + safe(bdPS.recettes);
  let chargesTotal = safe(bdDir.total) + safe(bdPS.total);
  (services || []).forEach(s => {
    const b = calculerBudgetService(s, null, annee, msETP, [], null, bpCoeff);
    recettesTotal += safe(b.recettes);
    chargesTotal += safe(b.total);
  });
  const resultatExercice = recettesTotal - chargesTotal;

  // ── Modules existants ──────────────────────────────────────────────
  const fr = calculerFondRoulement(direction, services, globalParams, poleSupport, resultatExercice);
  const bfrData = calculerBFR(direction, services, globalParams, poleSupport, []);
  const prov = calculerProvisions(direction, services, globalParams, poleSupport);

  // ── ACTIF ─────────────────────────────────────────────────────────
  const immobilisationsBrutes = safe(fr.totalImmobilisations);
  const amortissementsCumules = safe(fr.totalAmortissementsCumules);
  const immobilisationsNettes = safe(fr.immobilisationsNettes);

  const stocks = safe(bfrData.stocks);
  const creancesClients = safe(bfrData.creancesClients);

  // BFR exploitation = stocks + créances − (dettes fournisseurs + dettes URSSAF)
  const bfrExploitation = safe(bfrData.bfr);
  // Trésorerie nette = FR − BFR
  const tresorerieNette = safe(fr.fondRoulement) - bfrExploitation;
  const disponibilites = Math.max(0, tresorerieNette);
  const decouvert = Math.max(0, -tresorerieNette);

  const totalActif = immobilisationsNettes + stocks + creancesClients + disponibilites;

  // ── PASSIF ────────────────────────────────────────────────────────
  const capitauxPropresManuels = safe(fr.totalCapitauxManuels);
  // Capitaux propres total = réserves + RAN (manuels) + résultat de l'exercice
  const totalCapitauxPropres = capitauxPropresManuels + resultatExercice;

  const provisions = safe(prov?.total);
  const dettesFinancieres = safe(sumFinancements([direction, poleSupport, ...(services || [])].filter(Boolean)));
  const dettesFournisseurs = safe(bfrData.dettesFournisseurs);
  const dettesURSSAF = safe(bfrData.dettesURSSAF);

  const totalPassif = totalCapitauxPropres + provisions + dettesFinancieres + dettesFournisseurs + dettesURSSAF + decouvert;

  // ── Vérification d'équilibre ──────────────────────────────────────
  const ecart = totalActif - totalPassif;

  return {
    annee,
    actif: {
      immobilisationsBrutes,
      amortissementsCumules,
      immobilisationsNettes,
      stocks,
      creancesClients,
      disponibilites,
      totalActif,
    },
    passif: {
      capitauxPropresManuels,
      resultatExercice,
      totalCapitauxPropres,
      provisions,
      dettesFinancieres,
      dettesFournisseurs,
      dettesURSSAF,
      decouvert,
      totalPassif,
    },
    equilibre: {
      ecart,
      valide: Math.abs(ecart) < 1, // tolérance arrondi
    },
  };
};
