// Bilan prévisionnel actif/passif équilibré (PCG associatif — CRC 99-01 / Règl. ANC 2018-06)
//
// Équation comptable fondamentale : ACTIF = PASSIF
//
// Construction à partir des modules existants :
//   - Immobilisations brutes / amortissements / nettes : calculerFondRoulement
//   - Capitaux propres : globalParams.fondRoulement[] (réserves, RAN…) + résultat de l'exercice
//   - Résultat de l'exercice : calculerResultatExercice (source unique — identique au
//     dashboard, au compte de résultat et au tableau de financement)
//   - Provisions : calculerProvisions (via la source unique)
//   - BFR (créances clients, dettes fournisseurs, dettes URSSAF) : calculerBFR
//   - FRNG = Capitaux permanents (capitaux propres + provisions + dettes financières)
//            − Immobilisations nettes  (PCG : les provisions et dettes financières à
//            plus d'un an font partie des capitaux permanents — c'est ce qui garantit
//            l'équilibre actif/passif par construction)
//   - Trésorerie = FRNG − BFR (positive → Disponibilités, négative → Découvert)
//   - Dettes financières : capital restant dû des emprunts
//
// Référence : Règl. ANC 2018-06, Plan Comptable Associatif.

import { calculerFondRoulement, calculerBFR } from './calculations';
import { calculerResultatExercice } from './resultatExercice';

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
export const calculerBilanPrevisionnel = (direction, services, poleSupport, globalParams, poolRH = [], planningAbsences = null, extras = {}) => {
  // ── Résultat de l'exercice — source unique de vérité ──────────────
  const rex = calculerResultatExercice(direction, services, poleSupport, globalParams, poolRH, planningAbsences, extras);
  const annee = rex.annee;
  const resultatExercice = rex.resultatNet;

  // ── Modules existants ──────────────────────────────────────────────
  const fr = calculerFondRoulement(direction, services, globalParams, poleSupport, resultatExercice);
  const bfrData = calculerBFR(direction, services, globalParams, poleSupport, poolRH);

  // ── ACTIF ─────────────────────────────────────────────────────────
  const immobilisationsBrutes = safe(fr.totalImmobilisations);
  const amortissementsCumules = safe(fr.totalAmortissementsCumules);
  const immobilisationsNettes = safe(fr.immobilisationsNettes);

  const stocks = safe(bfrData.stocks);
  const creancesClients = safe(bfrData.creancesClients);

  // ── PASSIF (composantes) ──────────────────────────────────────────
  const capitauxPropresManuels = safe(fr.totalCapitauxManuels);
  // Capitaux propres total = réserves + RAN (manuels) + résultat de l'exercice
  const totalCapitauxPropres = capitauxPropresManuels + resultatExercice;

  // Provisions au passif = dotations génériques + dotation IDR de l'exercice
  // (le stock IDR antérieur relève du bilan d'ouverture, non modélisé)
  const provisions = safe(rex.provisions) + safe(rex.dotationIDR);
  // Fonds dédiés (compte 19) — part non consommée des ressources affectées (ANC 2018-06)
  const fondsDedies19 = safe(rex.fondsDedies?.passif19);
  const dettesFinancieres = safe(sumFinancements([direction, poleSupport, ...(services || [])].filter(Boolean)));
  const dettesFournisseurs = safe(bfrData.dettesFournisseurs);
  const dettesURSSAF = safe(bfrData.dettesURSSAF);

  // ── TRÉSORERIE ────────────────────────────────────────────────────
  // FRNG = capitaux permanents − immobilisations nettes.
  // calculerFondRoulement ne retient que capitaux propres + résultat : on y ajoute
  // les provisions, les fonds dédiés et les dettes financières (capitaux
  // permanents au sens PCG / ANC 2018-06 — les fonds dédiés sont des
  // quasi-fonds propres inscrits en haut de bilan).
  const frng = safe(fr.fondRoulement) + provisions + fondsDedies19 + dettesFinancieres;
  // BFR exploitation = stocks + créances − (dettes fournisseurs + dettes URSSAF)
  const bfrExploitation = safe(bfrData.bfr);
  // Trésorerie nette = FRNG − BFR
  const tresorerieNette = frng - bfrExploitation;
  const disponibilites = Math.max(0, tresorerieNette);
  const decouvert = Math.max(0, -tresorerieNette);

  const totalActif = immobilisationsNettes + stocks + creancesClients + disponibilites;
  const totalPassif = totalCapitauxPropres + fondsDedies19 + provisions + dettesFinancieres + dettesFournisseurs + dettesURSSAF + decouvert;

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
      fondsDedies: fondsDedies19,
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
    frng,
    bfr: bfrExploitation,
    tresorerieNette,
  };
};
