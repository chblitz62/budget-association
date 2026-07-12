// Tableau de financement (PCG 532-7) — Audit DAF Tier 2, C4
//
// Présentation en deux parties :
//   I. Ressources et emplois durables (variation du fonds de roulement net global)
//   II. Variation du besoin en fonds de roulement (BFR) et de la trésorerie
//
// Référence : PCG art. 532-7, recommandé par les bailleurs et obligatoire pour
// certaines structures médico-sociales (ANAP, EPRD pluriannuel).
//
// Construction depuis le budget courant :
//   - CAF (Capacité d'AutoFinancement) = Résultat + dotations amortissements + dotations provisions
//   - Investissements = total des immobilisations brutes acquises
//   - Emprunts nouveaux et remboursements (si renseignés)
//   - Variation BFR = BFR(N) − BFR(N-1)  (estimé, ou 0 si N-1 absent)
//   - Variation trésorerie = ΔFRNG − ΔBFR

import { calculerBFR } from './calculations';
import { calculerResultatExercice } from './resultatExercice';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

const sumAmortissementsAnnuels = (entites) => {
  let total = 0;
  entites.forEach(e => {
    const invs = e?.investissements || {};
    Object.values(invs).forEach(inv => {
      if (!inv || typeof inv !== 'object') return;
      const montant = safe(inv.montant);
      const duree = safe(inv.duree);
      if (montant > 0 && duree > 0) total += montant / duree;
    });
  });
  return total;
};

const sumInvestissements = (entites) => {
  let total = 0;
  entites.forEach(e => {
    const invs = e?.investissements || {};
    Object.values(invs).forEach(inv => {
      if (!inv || typeof inv !== 'object') return;
      // On ne compte que les acquisitions de l'exercice (ageAns = 0)
      const age = safe(inv.ageAns);
      if (age === 0) total += safe(inv.montant);
    });
  });
  return total;
};

const sumEmpruntsNouveaux = (entites) => {
  let total = 0;
  entites.forEach(e => {
    const invs = e?.investissements || {};
    Object.values(invs).forEach(inv => {
      if (!inv || typeof inv !== 'object') return;
      const age = safe(inv.ageAns);
      const ptg = safe(inv.financementEmprunt);
      if (age === 0 && ptg > 0) total += safe(inv.montant) * ptg / 100;
    });
  });
  return total;
};

const sumRemboursementsCapital = (entites) => {
  // Approximation : capital initial / durée (linéaire). Le vrai chiffre est dans l'amortissement bancaire.
  let total = 0;
  entites.forEach(e => {
    const invs = e?.investissements || {};
    Object.values(invs).forEach(inv => {
      if (!inv || typeof inv !== 'object') return;
      const ptg = safe(inv.financementEmprunt);
      const dureePret = safe(inv.dureePret) || safe(inv.duree);
      if (ptg > 0 && dureePret > 0) {
        total += (safe(inv.montant) * ptg / 100) / dureePret;
      }
    });
  });
  return total;
};

/**
 * Calcule le tableau de financement PCG 532-7.
 *
 * @returns {{
 *   ressources: { caf, empruntsNouveaux, subventionsInvestissement, cessionsImmo, totalRessources },
 *   emplois:    { investissementsAcquis, remboursementsCapital, distributionResultat, totalEmplois },
 *   variationFRNG: number,
 *   variationBFR: number,
 *   variationTresorerie: number,
 *   detail: { caf: { resultat, dotAmortissements, dotProvisions } },
 * }}
 */
export const calculerTableauFinancement = (direction, services, poleSupport, globalParams, poolRH = [], planningAbsences = null, extras = {}) => {
  // ── Résultat de l'exercice — source unique de vérité ───────────
  // (identique au dashboard, au compte de résultat et au bilan prévisionnel)
  const rex = calculerResultatExercice(direction, services, poleSupport, globalParams, poolRH, planningAbsences, extras);
  const annee = rex.annee;
  const resultat = rex.resultatNet;

  // ── Dotations (dans la CAF on les rajoute car non décaissées) ───
  // Idem pour la dotation IDR et les mouvements de fonds dédiés (689/789),
  // calculatoires et sans flux de trésorerie.
  const entites = [direction, poleSupport, ...(services || [])].filter(Boolean);
  const dotAmortissements = sumAmortissementsAnnuels(entites);
  const dotProvisions = safe(rex.provisions) + safe(rex.dotationIDR);
  const dotationFondsDedies = safe(rex.fondsDedies?.dotation689);
  const repriseFondsDedies = safe(rex.fondsDedies?.reprise789);

  const caf = resultat + dotAmortissements + dotProvisions + dotationFondsDedies - repriseFondsDedies;

  // ── Ressources durables ────────────────────────────────────────
  const empruntsNouveaux = sumEmpruntsNouveaux(entites);
  const subventionsInvestissement = safe(globalParams?.subventionsInvestissementAnnuelles);
  const cessionsImmo = safe(globalParams?.cessionsImmoAnnuelles);
  const totalRessources = caf + empruntsNouveaux + subventionsInvestissement + cessionsImmo;

  // ── Emplois durables ───────────────────────────────────────────
  const investissementsAcquis = sumInvestissements(entites);
  const remboursementsCapital = sumRemboursementsCapital(entites);
  const distributionResultat = safe(globalParams?.distributionResultat); // rare en associatif
  const totalEmplois = investissementsAcquis + remboursementsCapital + distributionResultat;

  // ── Variation du FRNG ──────────────────────────────────────────
  const variationFRNG = totalRessources - totalEmplois;

  // ── Variation BFR (estimation simple : BFR N — pas d'historique) ─
  const bfrN = calculerBFR(direction, services, globalParams, poleSupport, poolRH);
  const variationBFR = safe(globalParams?.variationBFRReelle) || 0; // si renseigné ; sinon 0
  const _bfrCourant = safe(bfrN.bfr);

  // ── Variation trésorerie ───────────────────────────────────────
  const variationTresorerie = variationFRNG - variationBFR;

  return {
    annee,
    ressources: {
      caf,
      empruntsNouveaux,
      subventionsInvestissement,
      cessionsImmo,
      totalRessources,
    },
    emplois: {
      investissementsAcquis,
      remboursementsCapital,
      distributionResultat,
      totalEmplois,
    },
    variationFRNG,
    variationBFR,
    variationTresorerie,
    bfrCourant: _bfrCourant,
    detail: {
      caf: {
        resultat,
        dotAmortissements,
        dotProvisions,
        dotationFondsDedies,
        repriseFondsDedies,
      },
    },
  };
};
