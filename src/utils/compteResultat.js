// Compte de Résultat formel — PCG associatif (CRC 99-01 / Règl. ANC 2018-06)
// Présentation en classes 6/7 structurée : exploitation, financier, exceptionnel, résultat net.
//
// Référence : ANC 2018-06 (associations & fondations), classes PCG 60–69 / 70–79.
// Format : structure normative attendue par les financeurs (CAC, bailleurs, conseil départemental).
//
// RÉCONCILIATION : le résultat net de ce compte de résultat est par construction
// identique à celui du dashboard, du bilan prévisionnel et du tableau de
// financement — tous consomment calculerResultatExercice (source unique).

import { calculerResultatExercice } from './resultatExercice';

/**
 * Construit le compte de résultat formel à partir du budget prévisionnel.
 * @returns {{ charges: Array, produits: Array, totaux: object }}
 */
export const calculerCompteResultat = (direction, services, poleSupport, globalParams, poolRH = [], planningAbsences = null) => {
  const rex = calculerResultatExercice(direction, services, poleSupport, globalParams, poolRH, planningAbsences);
  const { annee, budgets, detail } = rex;
  const bdSvcs = budgets.services;

  // ── CHARGES (classes 60–68) ──────────────────────────────────────────
  // Décomposition brut / charges sociales sur les bruts réels agent par agent
  // (Fillon inclus) — plus de taux plat forfaitaire.
  const remunerationsBrutes = detail.remunerationsBrutes;
  const chargesSociales = detail.chargesSociales;
  const coutCarenceMaladie = detail.coutCarenceMaladie;

  const totalAchatsServices = detail.exploitation;
  const totalAmortissements = detail.amortissements;
  const totalInterets = detail.interets;
  const totalProvisions = rex.provisions;
  const taxeSalaires = rex.taxeSalaires;

  const charges = [
    { code: '60', libelle: 'Achats (énergie, fournitures, matières)', montant: totalAchatsServices * 0.35, section: 'Exploitation' },
    { code: '61', libelle: 'Services extérieurs (loyers, entretien, assurances)', montant: totalAchatsServices * 0.30, section: 'Exploitation' },
    { code: '62', libelle: 'Autres services extérieurs (honoraires, communication)', montant: totalAchatsServices * 0.20, section: 'Exploitation' },
    { code: '63', libelle: 'Impôts, taxes et versements assimilés', montant: taxeSalaires, section: 'Exploitation' },
    { code: '64', libelle: 'Charges de personnel — Rémunérations brutes', montant: remunerationsBrutes, section: 'Exploitation' },
    { code: '64', libelle: 'Charges de personnel — Charges sociales et fiscales', montant: chargesSociales, section: 'Exploitation' },
    { code: '64', libelle: 'Charges de personnel — Coût de carence maladie', montant: coutCarenceMaladie, section: 'Exploitation' },
    { code: '65', libelle: 'Autres charges de gestion courante', montant: totalAchatsServices * 0.15, section: 'Exploitation' },
    { code: '66', libelle: 'Charges financières (intérêts d\'emprunts)', montant: totalInterets, section: 'Financier' },
    { code: '67', libelle: 'Charges exceptionnelles', montant: 0, section: 'Exceptionnel' },
    { code: '68', libelle: 'Dotations aux amortissements', montant: totalAmortissements, section: 'Exploitation' },
    { code: '68', libelle: 'Dotations aux provisions', montant: totalProvisions, section: 'Exploitation' },
  ].filter(l => l.montant !== 0);

  const totalChargesExploitation = charges.filter(c => c.section === 'Exploitation').reduce((s, c) => s + c.montant, 0);
  const totalChargesFinancieres = charges.filter(c => c.section === 'Financier').reduce((s, c) => s + c.montant, 0);
  const totalChargesExceptionnelles = charges.filter(c => c.section === 'Exceptionnel').reduce((s, c) => s + c.montant, 0);
  const totalCharges = totalChargesExploitation + totalChargesFinancieres + totalChargesExceptionnelles;

  // ── PRODUITS (classes 70–78) ─────────────────────────────────────────
  const totalRecettes = rex.produits;

  // Ventilation : on tente de classer par nature à partir des libellés
  const allRecettes = [
    ...(direction?.recettes || []),
    ...(poleSupport?.recettes || []),
    ...(services || []).flatMap(s => s.recettes || []),
  ];
  const bpFrac = (globalParams?.coefficientBP ?? 100) / 100;
  const sumByType = (predicate) =>
    allRecettes.filter(predicate).reduce((s, r) => s + ((parseFloat(r.montant) || 0) * 12 * bpFrac), 0);

  const isSubvention = (r) => /subv|cer|région|département|commune|état|opco/i.test(r.nom || '');
  const isDonation = (r) => /don|mécén|mécénat|legs/i.test(r.nom || '');
  const isFC = (r) => /fc|formation continue|cifa|prestation/i.test(r.nom || '');

  // Subvention Région calculée sur les agents éligibles : classée en 74 (absente des lignes de recettes explicites)
  const subventionRegionAgents = bdSvcs.reduce((s, b) => s + (b.subventionRegionAgents || 0), 0) * bpFrac;
  const totalSubventions = sumByType(isSubvention) + subventionRegionAgents;
  const totalDons = sumByType((r) => isDonation(r) && !isSubvention(r));
  const totalFC = sumByType((r) => isFC(r) && !isSubvention(r) && !isDonation(r));
  const totalAutresProduits = totalRecettes - totalSubventions - totalDons - totalFC;

  const produits = [
    { code: '70', libelle: 'Ventes de produits et prestations (FC, droits inscription)', montant: totalFC + Math.max(0, totalAutresProduits), section: 'Exploitation' },
    { code: '74', libelle: 'Subventions d\'exploitation', montant: totalSubventions, section: 'Exploitation' },
    { code: '75', libelle: 'Dons, mécénat et autres produits de gestion', montant: totalDons, section: 'Exploitation' },
    { code: '76', libelle: 'Produits financiers', montant: 0, section: 'Financier' },
    { code: '77', libelle: 'Produits exceptionnels', montant: 0, section: 'Exceptionnel' },
    { code: '78', libelle: 'Reprises sur amortissements et provisions', montant: 0, section: 'Exploitation' },
  ].filter(l => l.montant !== 0);

  const totalProduitsExploitation = produits.filter(p => p.section === 'Exploitation').reduce((s, p) => s + p.montant, 0);
  const totalProduitsFinanciers = produits.filter(p => p.section === 'Financier').reduce((s, p) => s + p.montant, 0);
  const totalProduitsExceptionnels = produits.filter(p => p.section === 'Exceptionnel').reduce((s, p) => s + p.montant, 0);
  const totalProduits = totalProduitsExploitation + totalProduitsFinanciers + totalProduitsExceptionnels;

  // ── SOLDES INTERMÉDIAIRES ────────────────────────────────────────────
  const resultatExploitation = totalProduitsExploitation - totalChargesExploitation;
  const resultatFinancier = totalProduitsFinanciers - totalChargesFinancieres;
  const resultatCourant = resultatExploitation + resultatFinancier;
  const resultatExceptionnel = totalProduitsExceptionnels - totalChargesExceptionnelles;
  const resultatNet = resultatCourant + resultatExceptionnel;

  return {
    annee,
    charges, produits,
    totaux: {
      totalChargesExploitation, totalChargesFinancieres, totalChargesExceptionnelles, totalCharges,
      totalProduitsExploitation, totalProduitsFinanciers, totalProduitsExceptionnels, totalProduits,
      resultatExploitation, resultatFinancier, resultatCourant, resultatExceptionnel, resultatNet,
    },
    // Réconciliation avec la source unique (doit être ~0)
    coherence: {
      resultatReference: rex.resultatNet,
      ecart: resultatNet - rex.resultatNet,
    },
  };
};
