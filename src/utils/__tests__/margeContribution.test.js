import { describe, it, expect } from 'vitest';
import {
  calculerMargeContribution,
  recommendationContribution,
  SEUIL_LEVIER,
} from '../margeContribution';

const services = [
  {
    id: 's1', nom: 'BPJEPS',
    personnel: [{ etp: 4, salaire: 3000 }],
    recettes: [{ montant: 10000 }],
    exploitation: [{ montant: 1000 }],
    promos: { '2026': [{ effectifInitial: 20, abandons: { sept: 2 } }] },
  },
  {
    id: 's2', nom: 'DEJEPS',
    personnel: [{ etp: 2, salaire: 2800 }],
    recettes: [{ montant: 6000 }],
    exploitation: [{ montant: 500 }],
    promos: { '2026': [{ effectifInitial: 12, abandons: {} }] },
  },
];

const budgetSiege = { total: 60000 };

const getBudgetService = (s) => {
  if (s.id === 's1') return { salaires: 0, exploitation: 0, recettes: 200000, total: 100000 };
  return { salaires: 0, exploitation: 0, recettes: 60000, total: 50000 };
};

const baseParams = { cleRepartition: { type: 'etp', params: {} } };

describe('Marge de Contribution — Reporting de Contribution (Axe 6)', () => {
  it('expose SEUIL_LEVIER (30 %)', () => {
    expect(SEUIL_LEVIER).toBe(30);
  });

  it('décompose recettes − CV pour chaque service', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // s1 : ETP 4/6 → quote-part siège 40000 → coût complet 140000
    // CF = 140000 × 0.75 = 105000, CV = 35000
    // MC = 200000 − 35000 = 165000
    expect(s1.coutComplet).toBe(140000);
    expect(s1.chargesFixes).toBe(105000);
    expect(s1.chargesVariables).toBe(35000);
    expect(s1.margeContribution).toBe(165000);
  });

  it('calcule le taux de contribution = MC / R × 100', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // 165000 / 200000 = 82,5 %
    expect(s1.tauxContribution).toBe(82.5);
  });

  it('niveau success quand taux contribution ≥ 30 % (levier)', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.niveau).toBe('success');
    expect(s1.tauxContribution).toBeGreaterThanOrEqual(SEUIL_LEVIER);
  });

  it('niveau warning quand 0 < taux < 30 % (marginal)', () => {
    // Construire un cas marginal : recettes juste au-dessus des CV
    const marginal = (s) => s.id === 's1'
      ? { recettes: 40000, total: 100000 }   // CV = 35000 → MC = 5000 → taux = 12,5 %
      : { recettes: 60000, total: 50000 };
    const r = calculerMargeContribution(services, budgetSiege, marginal, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.margeContribution).toBeGreaterThan(0);
    expect(s1.tauxContribution).toBeLessThan(SEUIL_LEVIER);
    expect(s1.niveau).toBe('warning');
  });

  it('niveau danger quand recettes < CV (poids mort)', () => {
    const perte = (s) => ({ recettes: 1000, total: 200000 });
    const r = calculerMargeContribution(services, budgetSiege, perte, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.margeContribution).toBeLessThan(0);
    expect(s1.niveau).toBe('danger');
  });

  it('niveau neutral quand recettes = 0', () => {
    const sansRec = (s) => ({ recettes: 0, total: 0 });
    const r = calculerMargeContribution(services, budgetSiege, sansRec, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.recettes).toBe(0);
    expect(s1.niveau).toBe('neutral');
  });

  it('part de contribution somme à 100 % sur les services positifs', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, baseParams);
    const partsPositives = r.parService
      .filter(s => s.margeContribution > 0)
      .reduce((sum, s) => sum + s.partContribution, 0);
    expect(Math.round(partsPositives)).toBe(100);
  });

  it('les services avec MC ≤ 0 ont une part de contribution = 0', () => {
    const mixte = (s) => s.id === 's1'
      ? { recettes: 200000, total: 100000 }   // levier
      : { recettes: 1000, total: 50000 };     // poids mort (CV=12500 → MC=-11500)
    const r = calculerMargeContribution(services, budgetSiege, mixte, baseParams);
    const poidsMort = r.parService.find(x => x.margeContribution <= 0);
    expect(poidsMort.partContribution).toBe(0);
  });

  it('rang attribué par marge contribution décroissante', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, baseParams);
    const tri = [...r.parService].sort((a, b) => a.rang - b.rang);
    for (let i = 1; i < tri.length; i++) {
      expect(tri[i - 1].margeContribution).toBeGreaterThanOrEqual(tri[i].margeContribution);
    }
    // rangs uniques 1..n
    const rangs = r.parService.map(s => s.rang).sort();
    expect(rangs).toEqual([1, 2]);
  });

  it('couverture CF du service (MC ÷ CF × 100)', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, baseParams);
    const s1 = r.parService.find(x => x.id === 's1');
    // MC=165000, CF=105000 → couverture = 157,1 %
    expect(s1.couvertureCF).toBe(157.1);
  });

  it('couverture CF = null si CF = 0', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, {
      ...baseParams,
      ratioChargesFixesParService: { s1: 0 },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.chargesFixes).toBe(0);
    expect(s1.couvertureCF).toBeNull();
  });

  it('respecte un override globalParams.ratioChargesFixesParService', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, {
      ...baseParams,
      ratioChargesFixesParService: { s1: 50 },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    // CF = 70000, CV = 70000, MC = 200000 − 70000 = 130000
    expect(s1.chargesFixes).toBe(70000);
    expect(s1.chargesVariables).toBe(70000);
    expect(s1.margeContribution).toBe(130000);
  });

  it('totaux consolidés cohérents et coûts fixes couverts', () => {
    const r = calculerMargeContribution(services, budgetSiege, getBudgetService, baseParams);
    const sumMC = r.parService.reduce((s, x) => s + x.margeContribution, 0);
    expect(r.totaux.totalMargeContribution).toBe(sumMC);
    expect(r.totaux.coutsFixesCouverts).toBe(
      r.totaux.totalMargeContribution >= r.totaux.totalChargesFixes
    );
    expect(r.totaux.surplus).toBe(r.totaux.totalMargeContribution - r.totaux.totalChargesFixes);
  });

  it('coutsFixesCouverts = false quand MC consolidée < CF', () => {
    const faible = (s) => ({ recettes: 30000, total: 50000 });
    const r = calculerMargeContribution(services, budgetSiege, faible, baseParams);
    expect(r.totaux.coutsFixesCouverts).toBe(false);
    expect(r.totaux.surplus).toBeLessThan(0);
  });

  it('compte les leviers / marginaux / poids morts', () => {
    const mixte = (s) => s.id === 's1'
      ? { recettes: 200000, total: 100000 }   // levier
      : { recettes: 1000, total: 50000 };     // poids mort
    const r = calculerMargeContribution(services, budgetSiege, mixte, baseParams);
    expect(r.totaux.nbLeviers).toBe(1);
    expect(r.totaux.nbPoidsMort).toBe(1);
    expect(r.totaux.nbLeviers + r.totaux.nbMarginaux + r.totaux.nbPoidsMort)
      .toBeLessThanOrEqual(r.parService.length);
  });

  it('robustesse : services null/undefined → tableau vide', () => {
    const r = calculerMargeContribution(null, null, null, null);
    expect(r.parService).toEqual([]);
    expect(r.totaux.totalMargeContribution).toBe(0);
    expect(r.totaux.totalRecettes).toBe(0);
    expect(r.totaux.coutsFixesCouverts).toBe(true); // 0 >= 0
  });

  it('recommandations contextuelles 4 niveaux', () => {
    expect(recommendationContribution('success', 82.5, 157.1)).toMatch(/Levier/);
    expect(recommendationContribution('success', 35, 80)).toMatch(/Levier/);
    expect(recommendationContribution('warning', 12.5, null)).toMatch(/marginale/);
    expect(recommendationContribution('danger', -5, null)).toMatch(/Poids mort/);
    expect(recommendationContribution('neutral', 0, null)).toMatch(/Aucune recette/);
  });
});
