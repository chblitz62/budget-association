// Compte de Résultat formel — PCG associatif (CRC 99-01 / Règl. ANC 2018-06)
// Présentation en classes 6/7 structurée : exploitation, financier, exceptionnel, résultat net.
//
// Référence : ANC 2018-06 (associations & fondations), classes PCG 60–69 / 70–79.
// Format : structure normative attendue par les financeurs (CAC, bailleurs, conseil départemental).

import { calculerBudgetDirection, calculerBudgetService, calculerBudgetPoleSupport, calculerProvisions } from './calculations';
import { CHARGES_PATRONALES } from './constants';

/**
 * Construit le compte de résultat formel à partir du budget prévisionnel.
 * @returns {{ charges: Array, produits: Array, totaux: object }}
 */
export const calculerCompteResultat = (direction, services, poleSupport, globalParams) => {
  const annee = globalParams?.anneeExercice || new Date().getFullYear();

  const bdDir = calculerBudgetDirection(direction, null, annee);
  const bdPS  = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, annee) : null;
  const bdSvcs = (services || []).map(s => calculerBudgetService(s, null, annee));

  const sumBy = (key) => {
    const dir = bdDir[key] || 0;
    const ps = bdPS?.[key] || 0;
    const svc = bdSvcs.reduce((s, b) => s + (b[key] || 0), 0);
    return dir + ps + svc;
  };

  // ── CHARGES (classes 60–68) ──────────────────────────────────────────
  const totalSalaires = sumBy('salaires');
  // Décomposition brut / charges patronales (les calculs renvoient déjà le total chargé)
  const tauxCP = CHARGES_PATRONALES;
  const remunerationsBrutes = totalSalaires / (1 + tauxCP);
  const chargesSociales = totalSalaires - remunerationsBrutes;

  const chargesExploitationDir = bdDir.chargesSiege || 0;
  const chargesExploitationPS = bdPS?.exploitation || 0;
  const chargesExploitationSvc = bdSvcs.reduce((s, b) => s + (b.exploitation || 0), 0);
  const totalAchatsServices = chargesExploitationDir + chargesExploitationPS + chargesExploitationSvc;

  const totalAmortissements = sumBy('amortissements');
  const totalInterets = bdDir.interets || 0;

  // Provisions
  const prov = calculerProvisions(direction, services, globalParams, poleSupport);
  const totalProvisions = prov?.total || 0;

  // Taxe sur salaires (si activée)
  const taxeSalaires = globalParams?.taxeSalaires
    ? (sumBy('taxeSalairesAnnuelle') || 0)
    : 0;

  const charges = [
    { code: '60', libelle: 'Achats (énergie, fournitures, matières)', montant: totalAchatsServices * 0.35, section: 'Exploitation' },
    { code: '61', libelle: 'Services extérieurs (loyers, entretien, assurances)', montant: totalAchatsServices * 0.30, section: 'Exploitation' },
    { code: '62', libelle: 'Autres services extérieurs (honoraires, communication)', montant: totalAchatsServices * 0.20, section: 'Exploitation' },
    { code: '63', libelle: 'Impôts, taxes et versements assimilés', montant: taxeSalaires, section: 'Exploitation' },
    { code: '64', libelle: 'Charges de personnel — Rémunérations brutes', montant: remunerationsBrutes, section: 'Exploitation' },
    { code: '64', libelle: 'Charges de personnel — Charges sociales et fiscales', montant: chargesSociales, section: 'Exploitation' },
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
  const totalRecettes = sumBy('recettes');

  // Ventilation : on tente de classer par nature à partir des libellés
  const allRecettes = [
    ...(direction?.recettes || []),
    ...(poleSupport?.recettes || []),
    ...services.flatMap(s => s.recettes || []),
  ];
  const bpFrac = (globalParams?.coefficientBP ?? 100) / 100;
  const sumByType = (predicate) =>
    allRecettes.filter(predicate).reduce((s, r) => s + ((parseFloat(r.montant) || 0) * 12 * bpFrac), 0);

  const isSubvention = (r) => /subv|cer|région|département|commune|état|opco/i.test(r.nom || '');
  const isDonation = (r) => /don|mécén|mécénat|legs/i.test(r.nom || '');
  const isFC = (r) => /fc|formation continue|cifa|prestation/i.test(r.nom || '');

  const totalSubventions = sumByType(isSubvention);
  const totalDons = sumByType(isDonation);
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
  };
};
