import { describe, it, expect } from 'vitest';
import {
  calculerPnlAnalytique,
  recommendationPnl,
  SEUIL_MARGE_SUCCESS,
  SEUIL_MARGE_DANGER,
  LIBELLES_CLASSES,
} from '../pnlAnalytique';
import { CHARGES_PATRONALES } from '../constants';

// Données de test minimales : 2 services avec 1 ETP chacun pour garder une
// répartition équitable du siège (50/50 sur clé ETP).
const services = [
  {
    id: 's1', nom: 'BPJEPS',
    personnel: [{ etp: 1, salaire: 0 }], // ETP utilisé pour la clé répartition
    recettes: [
      { nom: 'Subvention Région',  montant: 8000 },   // → 74
      { nom: 'Frais inscription',  montant: 2000 },   // → 70
      { nom: 'Don entreprise XYZ', montant: 500 },    // → 75
    ],
  },
  {
    id: 's2', nom: 'DEJEPS',
    personnel: [{ etp: 1, salaire: 0 }],
    recettes: [
      { nom: 'Subvention OPCO',    montant: 5000 },   // → 74
      { nom: 'FC entreprise',      montant: 1000 },   // → 70
    ],
  },
];

const budgetSiege = { total: 60000 };

// Getter qui fournit la décomposition attendue par le module
const getBudgetService = (s) => {
  if (s.id === 's1') {
    return { salaires: 72000, exploitation: 20000, amortissements: 8000, total: 100000, recettes: 0 };
  }
  return     { salaires: 36000, exploitation: 10000, amortissements: 4000, total: 50000, recettes: 0 };
};

const baseParams = { cleRepartition: { type: 'etp', params: {} }, coefficientBP: 100 };

describe('P&L Analytique par Service — Axe 6', () => {
  it('expose les seuils de marge et les libellés des classes PCG', () => {
    expect(SEUIL_MARGE_SUCCESS).toBe(5);
    expect(SEUIL_MARGE_DANGER).toBe(0);
    expect(LIBELLES_CLASSES['70']).toMatch(/Prestations|inscription/);
    expect(LIBELLES_CLASSES['64']).toMatch(/Personnel/);
    expect(LIBELLES_CLASSES['74']).toMatch(/Subventions/);
  });

  it('ventile les produits par classe PCG (70/74/75) selon les libellés', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // Subvention 8000 × 12 = 96000 (74) ; Frais 2000 × 12 = 24000 (70) ; Don 500 × 12 = 6000 (75)
    expect(s1.produits.c74).toBe(96000);
    expect(s1.produits.c70).toBe(24000);
    expect(s1.produits.c75).toBe(6000);
    expect(s1.produits.total).toBe(126000);
  });

  it('décompose les charges directes en classes 60/61/62/65 (35/30/20/15) + 64 + 68', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // exploitation 20000 → 60=7000 / 61=6000 / 62=4000 / 65=3000
    expect(s1.chargesDirectes.c60).toBe(7000);
    expect(s1.chargesDirectes.c61).toBe(6000);
    expect(s1.chargesDirectes.c62).toBe(4000);
    expect(s1.chargesDirectes.c65).toBe(3000);
    expect(s1.chargesDirectes.c68).toBe(8000);
    // total des 4 sous-classes = exploitation
    expect(s1.chargesDirectes.c60 + s1.chargesDirectes.c61 + s1.chargesDirectes.c62 + s1.chargesDirectes.c65).toBe(20000);
  });

  it('décompose le 64 (personnel) en brut + charges sociales selon CHARGES_PATRONALES', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // 72000 / 1.44 = 50000 brut, 22000 charges sociales
    const expectedBrut = Math.round(72000 / (1 + CHARGES_PATRONALES));
    expect(s1.chargesDirectes.c64.brut).toBe(expectedBrut);
    expect(s1.chargesDirectes.c64.chargesSociales).toBe(72000 - expectedBrut);
    expect(s1.chargesDirectes.c64.total).toBe(72000);
  });

  it('total des charges directes = somme exacte des classes', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    const sum = s1.chargesDirectes.c60 + s1.chargesDirectes.c61 + s1.chargesDirectes.c62
      + s1.chargesDirectes.c64.total + s1.chargesDirectes.c65 + s1.chargesDirectes.c68;
    // Tolérance 1 € pour arrondis brut/sociales
    expect(Math.abs(s1.chargesDirectes.total - sum)).toBeLessThanOrEqual(1);
  });

  it('quote-part siège réallouée via la clé ETP (round-trip à 1 € près)', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const sumQuoteParts = r.parService.reduce((s, x) => s + x.quotePartSiege, 0);
    // Budget siège 60000 réparti sur 2 ETP égaux → 30000 chacun
    expect(sumQuoteParts).toBe(60000);
    expect(r.parService[0].quotePartSiege + r.parService[1].quotePartSiege).toBe(60000);
  });

  it('résultat brut = produits − charges directes (avant siège)', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // 126000 − 100000 = 26000
    expect(s1.resultatBrut).toBe(26000);
  });

  it('résultat net = résultat brut − quote-part siège', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // 26000 − 30000 = −4000
    expect(s1.resultatNet).toBe(s1.resultatBrut - s1.quotePartSiege);
    expect(s1.resultatNet).toBe(-4000);
  });

  it('marge nette % = résultat net / produits × 100', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // -4000 / 126000 = -3.17 %
    expect(s1.margeNette).toBeCloseTo(-3.2, 1);
  });

  it('niveau success quand marge nette ≥ 5 %', () => {
    // Service très rentable
    const richeGetter = (s) => s.id === 's1'
      ? { salaires: 0, exploitation: 0, amortissements: 0, total: 50000, recettes: 0 }
      : { salaires: 0, exploitation: 0, amortissements: 0, total: 30000, recettes: 0 };
    const r = calculerPnlAnalytique(services, budgetSiege, richeGetter, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.margeNette).toBeGreaterThanOrEqual(SEUIL_MARGE_SUCCESS);
    expect(s1.niveau).toBe('success');
  });

  it('niveau warning quand 0 ≤ marge nette < 5 %', () => {
    // Service quasi à l'équilibre — produits 126000, quote-part 30000,
    // charges directes 94000 → résultat net = 2000 → marge ~ 1,6 %
    const proche = (s) => s.id === 's1'
      ? { salaires: 80000, exploitation: 10000, amortissements: 4000, total: 94000, recettes: 0 }
      : { salaires: 30000, exploitation: 0,     amortissements: 0,    total: 30000, recettes: 0 };
    const r = calculerPnlAnalytique(services, budgetSiege, proche, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.resultatNet).toBeGreaterThanOrEqual(0);
    expect(s1.margeNette).toBeLessThan(SEUIL_MARGE_SUCCESS);
    expect(s1.niveau).toBe('warning');
  });

  it('niveau danger quand résultat net < 0', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.resultatNet).toBeLessThan(0);
    expect(s1.niveau).toBe('danger');
  });

  it('niveau neutral quand recettes = 0', () => {
    const sansRecettes = [
      { id: 's1', nom: 'Vide', personnel: [{ etp: 1 }], recettes: [] },
    ];
    const r = calculerPnlAnalytique(sansRecettes, budgetSiege, () => ({ salaires: 0, exploitation: 0, amortissements: 0, total: 0 }), baseParams);
    expect(r.parService[0].produits.total).toBe(0);
    expect(r.parService[0].niveau).toBe('neutral');
  });

  it('rang attribué par résultat net décroissant', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const tri = [...r.parService].sort((a, b) => a.rang - b.rang);
    for (let i = 1; i < tri.length; i++) {
      expect(tri[i - 1].resultatNet).toBeGreaterThanOrEqual(tri[i].resultatNet);
    }
    const rangs = r.parService.map(s => s.rang).sort();
    expect(rangs).toEqual([1, 2]);
  });

  it('totaux consolidés cohérents (somme par service)', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    const sumProd = r.parService.reduce((s, x) => s + x.produits.total, 0);
    const sumCharges = r.parService.reduce((s, x) => s + x.totalCharges, 0);
    const sumNet = r.parService.reduce((s, x) => s + x.resultatNet, 0);
    expect(r.totaux.totalProduits).toBe(sumProd);
    expect(r.totaux.totalCharges).toBe(sumCharges);
    expect(r.totaux.totalResultatNet).toBe(sumNet);
    expect(r.totaux.equilibre).toBe(r.totaux.totalResultatNet >= 0);
  });

  it('compte les bénéficiaires / fragiles / déficitaires', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, baseParams);
    expect(r.totaux.nbBeneficiaires + r.totaux.nbFragiles + r.totaux.nbDeficitaires)
      .toBeLessThanOrEqual(r.parService.length);
  });

  it('respecte un override de la clé de répartition (uniforme)', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, {
      ...baseParams,
      cleRepartition: { type: 'uniforme', params: {} },
    });
    // Avec 2 services en uniforme : 30000 chacun
    r.parService.forEach(s => expect(s.quotePartSiege).toBe(30000));
    expect(r.meta.cleRepartition).toBe('uniforme');
  });

  it('applique le coefficient BP aux recettes', () => {
    const r = calculerPnlAnalytique(services, budgetSiege, getBudgetService, {
      ...baseParams,
      coefficientBP: 50, // demi-budget → recettes /2
    });
    const s1 = r.parService.find(x => x.id === 's1');
    // 8000 × 12 × 0.5 = 48000 (74)
    expect(s1.produits.c74).toBe(48000);
    expect(s1.produits.total).toBe(63000);
  });

  it('robustesse : services null/undefined → tableau vide et totaux nuls', () => {
    const r = calculerPnlAnalytique(null, null, null, null);
    expect(r.parService).toEqual([]);
    expect(r.totaux.totalProduits).toBe(0);
    expect(r.totaux.totalResultatNet).toBe(0);
    expect(r.totaux.equilibre).toBe(true); // 0 >= 0
  });

  it('recommandations contextuelles 4 niveaux', () => {
    expect(recommendationPnl('success', 12.5, 50000)).toMatch(/bénéficiaire/i);
    expect(recommendationPnl('warning', 2.3, 1500)).toMatch(/fragile|équilibre/i);
    expect(recommendationPnl('danger', -8.0, -10000)).toMatch(/déficitaire/i);
    expect(recommendationPnl('neutral', 0, 0)).toMatch(/Aucune recette/i);
  });
});
