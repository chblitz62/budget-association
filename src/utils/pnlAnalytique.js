// P&L Analytique par Service — Axe 6
//
// Synthèse formelle "Compte de Résultat" déclinée par service (= centre de
// profit), au format PCG associatif (CRC 99-01 / Règl. ANC 2018-06) :
//
//   PRODUITS                 Charges
//   ─────────────────        ─────────────────
//   70 Prestations FC        60 Achats (énergie, fournitures)
//   74 Subventions           61 Services extérieurs (loyer, entretien)
//   75 Dons, mécénat         62 Autres services ext. (honoraires)
//                            64 Personnel (brut + charges sociales)
//                            65 Autres charges de gestion
//                            68 Amortissements
//                            ─────────────────
//                            + Quote-part siège (réallouée via cleRepartition)
//
//   Résultat analytique brut = Produits − Charges directes
//   Résultat analytique net  = Brut − Quote-part siège
//   Marge nette %            = Résultat net / Produits × 100
//
// Ventilation 60/61/62/65 : à défaut de comptabilité analytique réelle, on
// reprend la clé du compteResultat global (35/30/20/15) sur le poste
// "exploitation". Volontairement aligné pour cohérence consolidée.

import { CHARGES_PATRONALES } from './constants';
import { calculerCoutCompletParService } from './clesRepartition';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

// Seuils de qualification du service
export const SEUIL_MARGE_SUCCESS = 5;   // % — service à l'équilibre durable
export const SEUIL_MARGE_DANGER  = 0;   // % — sous ce seuil, déficitaire

// Pondération exploitation → classes PCG (cohérent avec compteResultat.js)
const VENTILATION_EXPLOITATION = {
  '60': 0.35, // Achats (énergie, fournitures, matières)
  '61': 0.30, // Services extérieurs (loyers, entretien, assurances)
  '62': 0.20, // Autres services extérieurs (honoraires, communication)
  '65': 0.15, // Autres charges de gestion courante
};

// Reconnaissance des recettes par nature (mêmes regex que compteResultat.js)
const isSubvention = (r) => /subv|cer|région|departement|département|commune|état|opco|fse|agefiph|cpom/i.test(r?.nom || '');
const isDonation   = (r) => /don|mécén|mecenat|mécénat|legs/i.test(r?.nom || '');
const isFC         = (r) => /fc|formation continue|cifa|prestation/i.test(r?.nom || '');

const niveauMarge = (recettes, margeNette) => {
  if (recettes <= 0) return 'neutral';
  if (margeNette < SEUIL_MARGE_DANGER) return 'danger';
  if (margeNette < SEUIL_MARGE_SUCCESS) return 'warning';
  return 'success';
};

/**
 * Ventile les recettes brutes (somme mensuelle saisie × 12 × bpFrac) par
 * classe PCG (70/74/75) à partir des regex de libellé.
 */
const ventilerRecettes = (recettes, coefficientBP) => {
  const bpFrac = (safe(coefficientBP) || 100) / 100;
  let c70 = 0, c74 = 0, c75 = 0;
  (recettes || []).forEach(r => {
    const annuel = safe(r?.montant) * 12 * bpFrac;
    if (isSubvention(r))      c74 += annuel;
    else if (isDonation(r))   c75 += annuel;
    else if (isFC(r))         c70 += annuel;
    else                      c70 += annuel; // fallback : prestation
  });
  return { c70, c74, c75, total: c70 + c74 + c75 };
};

/**
 * Décompose le total salaires en brut + charges sociales selon CHARGES_PATRONALES.
 * Le getter renvoie déjà le total chargé.
 */
const decomposerSalaires = (salairesTotal) => {
  const total = safe(salairesTotal);
  const brut = total / (1 + CHARGES_PATRONALES);
  return { brut, chargesSociales: total - brut, total };
};

/**
 * Construit le P&L analytique d'UN service (charges directes uniquement).
 * Ne calcule pas la quote-part siège (ajoutée ensuite par calculerPnlAnalytique).
 */
const construirePnlService = (service, b, coefficientBP) => {
  const recettesAg = ventilerRecettes(service?.recettes, coefficientBP);
  const sal = decomposerSalaires(b?.salaires);
  const exploitation = safe(b?.exploitation);
  const amortissements = safe(b?.amortissements);

  // Ventilation des charges
  const c60 = exploitation * VENTILATION_EXPLOITATION['60'];
  const c61 = exploitation * VENTILATION_EXPLOITATION['61'];
  const c62 = exploitation * VENTILATION_EXPLOITATION['62'];
  const c65 = exploitation * VENTILATION_EXPLOITATION['65'];
  const c64Brut  = sal.brut;
  const c64Soc   = sal.chargesSociales;
  const c68      = amortissements;

  const totalChargesDirectes = c60 + c61 + c62 + c64Brut + c64Soc + c65 + c68;
  const totalProduits = recettesAg.total;
  const resultatBrut = totalProduits - totalChargesDirectes;

  return {
    produits: { c70: recettesAg.c70, c74: recettesAg.c74, c75: recettesAg.c75, total: totalProduits },
    charges: {
      c60, c61, c62,
      c64: { brut: c64Brut, chargesSociales: c64Soc, total: c64Brut + c64Soc },
      c65, c68,
      totalDirectes: totalChargesDirectes,
    },
    resultatBrut,
    margeBrute: totalProduits > 0 ? (resultatBrut / totalProduits) * 100 : 0,
  };
};

/**
 * Calcule le P&L Analytique consolidé pour tous les services.
 *
 * @param {Array}    services
 * @param {object}   budgetSiege — { total: number } à réallouer
 * @param {Function} getBudgetService — (s) => { salaires, exploitation, recettes, amortissements, total }
 * @param {object}   globalParams — { cleRepartition: { type, params }, coefficientBP }
 * @returns {{
 *   parService: Array<{
 *     id, nom, rang,
 *     produits: { c70, c74, c75, total },
 *     chargesDirectes: { c60, c61, c62, c64: { brut, chargesSociales, total }, c65, c68, total },
 *     quotePartSiege, totalCharges,
 *     resultatBrut, resultatNet,
 *     margeBrute, margeNette,
 *     niveau,
 *   }>,
 *   totaux: {
 *     totalProduits, totalChargesDirectes, totalQuotePartSiege, totalCharges,
 *     totalResultatBrut, totalResultatNet,
 *     margeNetteGlobale,
 *     nbBeneficiaires, nbFragiles, nbDeficitaires,
 *     equilibre,
 *   },
 *   meta: { cleRepartition },
 * }}
 */
export const calculerPnlAnalytique = (services, budgetSiege, getBudgetService, globalParams) => {
  const list = (services || []).filter(s => s && s.id);
  if (list.length === 0) {
    return {
      parService: [],
      totaux: {
        totalProduits: 0, totalChargesDirectes: 0, totalQuotePartSiege: 0, totalCharges: 0,
        totalResultatBrut: 0, totalResultatNet: 0,
        margeNetteGlobale: 0,
        nbBeneficiaires: 0, nbFragiles: 0, nbDeficitaires: 0,
        equilibre: true,
      },
      meta: { cleRepartition: globalParams?.cleRepartition?.type || 'etp' },
    };
  }

  const cleType = globalParams?.cleRepartition?.type || 'etp';
  const cleParams = globalParams?.cleRepartition?.params || {};
  const coefficientBP = globalParams?.coefficientBP ?? 100;

  // Réutilise la mécanique de réallocation du siège (round-trip safe)
  const repartition = calculerCoutCompletParService(services, budgetSiege, getBudgetService, cleType, cleParams);
  const quotePartParService = new Map(repartition.parService.map(r => [r.id, r.quotePartSiege]));

  const enriched = list.map(s => {
    const b = getBudgetService ? getBudgetService(s) : { salaires: 0, exploitation: 0, recettes: [], amortissements: 0, total: 0 };
    const directes = construirePnlService(s, b, coefficientBP);
    const quotePartSiege = safe(quotePartParService.get(s.id));
    const totalCharges = directes.charges.totalDirectes + quotePartSiege;
    const resultatNet = directes.produits.total - totalCharges;
    const margeNette = directes.produits.total > 0 ? (resultatNet / directes.produits.total) * 100 : 0;
    const niveau = niveauMarge(directes.produits.total, margeNette);

    return {
      id: s.id,
      nom: s.nom || 'Service',
      produits: {
        c70: Math.round(directes.produits.c70),
        c74: Math.round(directes.produits.c74),
        c75: Math.round(directes.produits.c75),
        total: Math.round(directes.produits.total),
      },
      chargesDirectes: {
        c60: Math.round(directes.charges.c60),
        c61: Math.round(directes.charges.c61),
        c62: Math.round(directes.charges.c62),
        c64: {
          brut: Math.round(directes.charges.c64.brut),
          chargesSociales: Math.round(directes.charges.c64.chargesSociales),
          total: Math.round(directes.charges.c64.total),
        },
        c65: Math.round(directes.charges.c65),
        c68: Math.round(directes.charges.c68),
        total: Math.round(directes.charges.totalDirectes),
      },
      quotePartSiege: Math.round(quotePartSiege),
      totalCharges: Math.round(totalCharges),
      resultatBrut: Math.round(directes.resultatBrut),
      resultatNet: Math.round(resultatNet),
      margeBrute: Math.round(directes.margeBrute * 10) / 10,
      margeNette: Math.round(margeNette * 10) / 10,
      niveau,
      rang: 0, // rempli après tri
    };
  });

  // Classement par résultat net décroissant
  const tri = [...enriched].sort((a, b) => b.resultatNet - a.resultatNet);
  tri.forEach((s, i) => { s.rang = i + 1; });
  const parService = [...enriched].sort((a, b) => a.rang - b.rang);

  const totalProduits = parService.reduce((s, x) => s + x.produits.total, 0);
  const totalChargesDirectes = parService.reduce((s, x) => s + x.chargesDirectes.total, 0);
  const totalQuotePartSiege = parService.reduce((s, x) => s + x.quotePartSiege, 0);
  const totalCharges = totalChargesDirectes + totalQuotePartSiege;
  const totalResultatBrut = parService.reduce((s, x) => s + x.resultatBrut, 0);
  const totalResultatNet = parService.reduce((s, x) => s + x.resultatNet, 0);
  const margeNetteGlobale = totalProduits > 0 ? Math.round((totalResultatNet / totalProduits) * 1000) / 10 : 0;

  const nbBeneficiaires = parService.filter(s => s.niveau === 'success').length;
  const nbFragiles = parService.filter(s => s.niveau === 'warning').length;
  const nbDeficitaires = parService.filter(s => s.niveau === 'danger').length;

  return {
    parService,
    totaux: {
      totalProduits,
      totalChargesDirectes,
      totalQuotePartSiege,
      totalCharges,
      totalResultatBrut,
      totalResultatNet,
      margeNetteGlobale,
      nbBeneficiaires,
      nbFragiles,
      nbDeficitaires,
      equilibre: totalResultatNet >= 0,
    },
    meta: { cleRepartition: cleType },
  };
};

/**
 * Recommandation contextuelle DAF par niveau.
 */
export const recommendationPnl = (niveau, margeNette, resultatNet) => {
  if (niveau === 'success') {
    return `✓ Service bénéficiaire — marge nette ${margeNette.toFixed(1)} %, résultat net ${Math.round(resultatNet).toLocaleString('fr-FR')} €. Centre de profit autonome qui couvre ses charges directes ET sa quote-part de structure.`;
  }
  if (niveau === 'warning') {
    return `⚠ Service à l'équilibre fragile (marge nette ${margeNette.toFixed(1)} %). Couvre ses coûts mais sans réserve. Optimiser le ratio charges/recettes ou renforcer le tarif.`;
  }
  if (niveau === 'danger') {
    return `✕ Service déficitaire après réallocation siège (résultat net ${Math.round(resultatNet).toLocaleString('fr-FR')} €). Décision stratégique requise : restructuration tarifaire, mutualisation des moyens, ou révision du périmètre.`;
  }
  return 'Aucune recette enregistrée — P&L analytique non significatif.';
};

/**
 * Libellés réutilisables pour la ligne par classe PCG.
 */
export const LIBELLES_CLASSES = {
  '60': 'Achats (énergie, fournitures)',
  '61': 'Services extérieurs (loyer, entretien)',
  '62': 'Autres services ext. (honoraires)',
  '64': 'Personnel (brut + charges sociales)',
  '65': 'Autres charges de gestion',
  '68': 'Dotations aux amortissements',
  '70': 'Prestations FC, droits inscription',
  '74': 'Subventions d\'exploitation',
  '75': 'Dons, mécénat',
};
