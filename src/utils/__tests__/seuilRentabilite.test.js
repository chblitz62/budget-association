import { describe, it, expect } from 'vitest';
import {
  calculerSeuilRentabilite,
  recommendationSeuil,
  RATIO_CF_DEFAULT,
  SEUIL_MARGE_CONFORT,
} from '../seuilRentabilite';

const services = [
  {
    id: 's1', nom: 'BPJEPS',
    personnel: [{ etp: 4, salaire: 3000 }],
    recettes: [{ montant: 10000 }],
    exploitation: [{ montant: 1000 }],
    promos: { '2026': [{ effectifInitial: 20, abandons: { sept: 2 } }] }, // effectif actuel = 18
  },
  {
    id: 's2', nom: 'DEJEPS',
    personnel: [{ etp: 2, salaire: 2800 }],
    recettes: [{ montant: 6000 }],
    exploitation: [{ montant: 500 }],
    promos: { '2026': [{ effectifInitial: 12, abandons: {} }] }, // effectif actuel = 12
  },
];

const budgetSiege = { total: 60000 };

const getBudgetService = (s) => {
  if (s.id === 's1') return { salaires: 0, exploitation: 0, recettes: 144000, total: 100000 };
  return { salaires: 0, exploitation: 0, recettes: 60000, total: 50000 };
};

const baseParams = { cleRepartition: { type: 'etp', params: {} } };

describe('Seuil de Rentabilité — Axe 3 (Point Mort par filière)', () => {
  it('expose les constantes RATIO_CF_DEFAULT (75 %) et SEUIL_MARGE_CONFORT (25 %)', () => {
    expect(RATIO_CF_DEFAULT).toBe(75);
    expect(SEUIL_MARGE_CONFORT).toBe(25);
  });

  it('décompose CF/CV selon le ratio par défaut (75 %)', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // Quote-part siège ETP : 4/6 × 60000 = 40000 → coût complet = 100000 + 40000 = 140000
    expect(s1.coutComplet).toBe(140000);
    expect(s1.ratioCF).toBe(75);
    expect(s1.chargesFixes).toBe(140000 * 0.75);
    expect(s1.chargesVariables).toBe(140000 * 0.25);
  });

  it('calcule le point mort en effectif : N* = CF / (R − cv)', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // R = 144000/18 = 8000, cv = 35000/18 ≈ 1944, m ≈ 6056, CF = 105000
    // N* = ceil(105000/6056) = 18
    expect(s1.recetteParEtudiant).toBe(8000);
    expect(s1.pointMortEffectif).toBe(Math.ceil(105000 / (8000 - 35000 / 18)));
  });

  it('calcule la marge de sécurité (%) et étudiants manquants', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // Effectif 18, point mort 18 → marge sécurité ≈ 0 % (équilibre tout juste)
    expect(s1.etudiantsManquants).toBe(0);
    expect(Math.abs(s1.margeSecuritePct)).toBeLessThan(SEUIL_MARGE_CONFORT);
  });

  it('niveau success quand marge sécurité ≥ 25 %', () => {
    // s2 : recettes 60000, charges 50000 + (2/6)*60000=20000 = 70000
    // CF=52500, CV=17500, R=5000/étud, cv=17500/12≈1458, m≈3542, N*=15 → manque 3 étudiants → danger
    // Pour avoir success, je cherche un cas opulent : recettes plus élevées
    const generous = (s) => s.id === 's1'
      ? { recettes: 360000, total: 100000 } // R = 360000/18 = 20000
      : { recettes: 60000, total: 50000 };
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, baseParams);
    const r2 = calculerSeuilRentabilite(services, budgetSiege, generous, baseParams);
    const s1Riche = r2.parService.find(x => x.id === 's1');
    expect(s1Riche.niveau).toBe('success');
    expect(s1Riche.margeSecuritePct).toBeGreaterThanOrEqual(SEUIL_MARGE_CONFORT);
  });

  it('niveau danger quand effectif < point mort', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, baseParams);
    const s2 = r.parService.find(x => x.id === 's2');
    // s2 : ms négative attendue (point mort > 12)
    expect(s2.niveau).toBe('danger');
    expect(s2.etudiantsManquants).toBeGreaterThan(0);
  });

  it('niveau danger si marge unitaire ≤ 0 (cv > recette)', () => {
    const noMarge = (s) => ({ recettes: 100, total: 200000 });
    const r = calculerSeuilRentabilite(services, budgetSiege, noMarge, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.margeUnitaire).toBeLessThanOrEqual(0);
    expect(s1.pointMortEffectif).toBeNull();
    expect(s1.niveau).toBe('danger');
  });

  it('niveau neutral quand effectif = 0', () => {
    const sansEffectif = [{ ...services[0], promos: { '2026': [{ effectifInitial: 0, abandons: {} }] } }];
    const r = calculerSeuilRentabilite(sansEffectif, budgetSiege, getBudgetService, baseParams);
    expect(r.parService[0].effectif).toBe(0);
    expect(r.parService[0].niveau).toBe('neutral');
    expect(r.parService[0].margeSecuritePct).toBeNull();
  });

  it('respecte un override globalParams.ratioChargesFixesParService', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, {
      ...baseParams,
      ratioChargesFixesParService: { s1: 50 },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.ratioCF).toBe(50);
    expect(s1.chargesFixes).toBe(140000 * 0.5);
    expect(s1.chargesVariables).toBe(140000 * 0.5);
    // s2 garde le défaut
    const s2 = r.parService.find(x => x.id === 's2');
    expect(s2.ratioCF).toBe(RATIO_CF_DEFAULT);
  });

  it('clamp ratioCF dans [0, 100]', () => {
    const rNeg = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, {
      ...baseParams,
      ratioChargesFixesParService: { s1: -10, s2: 250 },
    });
    expect(rNeg.parService.find(x => x.id === 's1').ratioCF).toBe(0);
    expect(rNeg.parService.find(x => x.id === 's2').ratioCF).toBe(100);
  });

  it('ratioCF = 0 → toutes les charges sont variables, point mort = 0 si m > 0', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, {
      ...baseParams,
      ratioChargesFixesParService: { s1: 0 },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.chargesFixes).toBe(0);
    expect(s1.pointMortEffectif).toBe(0);
  });

  it('totaux consolidés cohérents', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, baseParams);
    const sumEff = r.parService.reduce((s, x) => s + x.effectif, 0);
    const sumCF = r.parService.reduce((s, x) => s + x.chargesFixes, 0);
    expect(r.totaux.totalEffectif).toBe(sumEff);
    expect(r.totaux.totalChargesFixes).toBe(sumCF);
    expect(r.totaux.nbServicesEnDanger).toBe(r.parService.filter(s => s.niveau === 'danger').length);
  });

  it('compte les services en alerte (danger / warning)', () => {
    const r = calculerSeuilRentabilite(services, budgetSiege, getBudgetService, baseParams);
    expect(r.totaux.nbServicesEnDanger).toBeGreaterThanOrEqual(0);
    expect(r.totaux.nbServicesEnWarning).toBeGreaterThanOrEqual(0);
  });

  it('robustesse : services null/undefined → tableau vide', () => {
    const r = calculerSeuilRentabilite(null, null, null, null);
    expect(r.parService).toEqual([]);
    expect(r.totaux.totalEffectif).toBe(0);
    expect(r.totaux.pointMortConsolide).toBeNull();
  });

  it('recommandations contextuelles 4 niveaux', () => {
    expect(recommendationSeuil('success', 0, 35.2)).toMatch(/confortable/);
    expect(recommendationSeuil('warning', 0, 12.5)).toMatch(/fragile/);
    expect(recommendationSeuil('danger', 5, -10)).toMatch(/manque 5 étudiants/);
    expect(recommendationSeuil('danger', 0, -10)).toMatch(/négative ou nulle/);
    expect(recommendationSeuil('neutral', null, null)).toMatch(/Aucun étudiant/);
  });
});
