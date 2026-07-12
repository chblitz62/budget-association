import { describe, it, expect } from 'vitest';
import {
  calculerAnalyseRH,
  recommendationRH,
  SEUIL_MS_RECETTES_DANGER,
  SEUIL_MS_RECETTES_WARNING,
  SEUIL_MS_CHARGES_WARNING,
} from '../analyseRH';
import { calculerSalaireAnnuel } from '../calculations';

const services = [
  {
    id: 's1', nom: 'BPJEPS',
    personnel: [
      { etp: 2, salaire: 3000, segur: false, typeContrat: 'CDI' },
      { etp: 1, salaire: 2500, segur: false, typeContrat: 'CDI' },
    ],
    promos: { '2026': [{ effectifInitial: 20, abandons: { sept: 2 } }] }, // 18 étudiants
  },
  {
    id: 's2', nom: 'DEJEPS',
    personnel: [
      { etp: 1, salaire: 2800, segur: false, typeContrat: 'CDI' },
    ],
    promos: { '2026': [{ effectifInitial: 12, abandons: {} }] },
  },
];

const poolRH = [
  {
    id: 'a1', titre: 'Coordo polyvalente', etp: 1, salaire: 3500, segur: false,
    typeContrat: 'CDI',
    affectations: [
      { entityType: 'service', entityId: 's1', pct: 60 },
      { entityType: 'service', entityId: 's2', pct: 40 },
    ],
  },
  {
    id: 'a2', titre: 'Assistant pédago', etp: 0.5, salaire: 2200, segur: false,
    typeContrat: 'CDI',
    affectations: [
      { entityType: 'service', entityId: 's1', pct: 100 },
    ],
  },
];

const getBudgetService = (s) => {
  if (s.id === 's1') return { salaires: 0, exploitation: 0, recettes: 200000, total: 150000 };
  return { salaires: 0, exploitation: 0, recettes: 60000, total: 70000 };
};

describe('Analyse RH par Centre de Coût — Axe 6', () => {
  it('expose les seuils sémantiques (90 % danger, 70 % warning, 80 % charges)', () => {
    expect(SEUIL_MS_RECETTES_DANGER).toBe(90);
    expect(SEUIL_MS_RECETTES_WARNING).toBe(70);
    expect(SEUIL_MS_CHARGES_WARNING).toBe(80);
  });

  it('décompose MS interne + quote-part Pool RH par service', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const s1 = r.parService.find(x => x.id === 's1');
    // MS interne attendue = somme calculerSalaireAnnuel pour chaque membre du personnel
    const msInterneAttendue =
      calculerSalaireAnnuel(3000, 2, 0, 'CDI').total +
      calculerSalaireAnnuel(2500, 1, 0, 'CDI').total;
    expect(s1.msInterne).toBe(Math.round(msInterneAttendue));
    // MS pool attendue = a1 affecté à 60 % + a2 affecté à 100 % de son ETP
    const msPoolAttendue =
      calculerSalaireAnnuel(3500, 1 * 0.6, 0, 'CDI').total +
      calculerSalaireAnnuel(2200, 0.5 * 1.0, 0, 'CDI').total;
    expect(s1.msPool).toBe(Math.round(msPoolAttendue));
    expect(s1.msTotal).toBe(s1.msInterne + s1.msPool);
  });

  it('cumule les ETP internes + ETP Pool RH affectés', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const s1 = r.parService.find(x => x.id === 's1');
    // ETP interne : 2 + 1 = 3 ; ETP pool : 1 × 0.6 + 0.5 × 1.0 = 1.1
    expect(s1.etpInterne).toBe(3);
    expect(s1.etpPool).toBeCloseTo(1.1, 2);
    expect(s1.etpTotal).toBeCloseTo(4.1, 2);
    expect(s1.agentsPool).toBe(2);
  });

  it('calcule le coût moyen par ETP et le coût RH par étudiant', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.coutMoyenETP).toBe(Math.round(s1.msTotal / s1.etpTotal));
    expect(s1.coutRHParEtudiant).toBe(Math.round(s1.msTotal / s1.effectif));
  });

  it('calcule les ratios MS / charges et MS / recettes (en %)', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const s1 = r.parService.find(x => x.id === 's1');
    // charges 150000, recettes 200000
    expect(s1.ratioMSCharges).toBe(Math.round((s1.msTotal / 150000) * 1000) / 10);
    expect(s1.ratioMSRecettes).toBe(Math.round((s1.msTotal / 200000) * 1000) / 10);
  });

  it('niveau danger quand MS / recettes > 90 %', () => {
    const ms_critique = (s) => ({ recettes: 100000, total: 200000 });
    const r = calculerAnalyseRH(services, poolRH, ms_critique);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.ratioMSRecettes).toBeGreaterThan(SEUIL_MS_RECETTES_DANGER);
    expect(s1.niveau).toBe('danger');
  });

  it('niveau warning quand MS / recettes entre 70 et 90 %', () => {
    // Service avec MS environ 80 % des recettes
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const s1 = r.parService.find(x => x.id === 's1');
    // Construire un cas où le ratio est exactement dans la zone warning
    // s1.msTotal ≈ 202176 / recettes 250000 = 80,87 %
    const customRec = (s) => s.id === 's1'
      ? { recettes: 250000, total: 230000 }
      : { recettes: 60000, total: 70000 };
    const r2 = calculerAnalyseRH(services, poolRH, customRec);
    const s1Mod = r2.parService.find(x => x.id === 's1');
    expect(s1Mod.ratioMSRecettes).toBeGreaterThanOrEqual(SEUIL_MS_RECETTES_WARNING);
    expect(s1Mod.ratioMSRecettes).toBeLessThanOrEqual(SEUIL_MS_RECETTES_DANGER);
    expect(s1Mod.niveau).toBe('warning');
  });

  it('niveau warning quand MS / charges > 80 % (même si MS/recettes confortable)', () => {
    const recetteForte = (s) => s.id === 's1'
      ? { recettes: 1000000, total: 200000 }    // ratio recettes faible mais charges 200k
      : { recettes: 60000, total: 70000 };
    const r = calculerAnalyseRH(services, poolRH, recetteForte);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.ratioMSRecettes).toBeLessThan(SEUIL_MS_RECETTES_WARNING);
    expect(s1.ratioMSCharges).toBeGreaterThan(SEUIL_MS_CHARGES_WARNING);
    expect(s1.niveau).toBe('warning');
  });

  it('niveau success quand MS soutenable', () => {
    const aise = (s) => ({ recettes: 1000000, total: 800000 });
    const r = calculerAnalyseRH(services, poolRH, aise);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.niveau).toBe('success');
  });

  it('niveau neutral quand recettes = 0', () => {
    const sansRec = (s) => ({ recettes: 0, total: 100000 });
    const r = calculerAnalyseRH(services, poolRH, sansRec);
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.recettes).toBe(0);
    expect(s1.niveau).toBe('neutral');
  });

  it('part MS consolidée somme à 100 %', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const sum = r.parService.reduce((s, x) => s + x.partMSConsolidee, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it('rang attribué par MS totale décroissante (#1 = service le plus lourd en RH)', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const tri = [...r.parService].sort((a, b) => a.rang - b.rang);
    for (let i = 1; i < tri.length; i++) {
      expect(tri[i - 1].msTotal).toBeGreaterThanOrEqual(tri[i].msTotal);
    }
    const rangs = r.parService.map(s => s.rang).sort();
    expect(rangs).toEqual([1, 2]);
  });

  it('totaux consolidés cohérents (somme MS, ETP, effectif)', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    const sumMS = r.parService.reduce((s, x) => s + x.msTotal, 0);
    const sumETP = r.parService.reduce((s, x) => s + x.etpTotal, 0);
    expect(r.totaux.totalMS).toBe(sumMS);
    expect(r.totaux.totalETP).toBeCloseTo(sumETP, 2);
    expect(r.totaux.totalMSInterne + r.totaux.totalMSPool).toBe(r.totaux.totalMS);
  });

  it('coût moyen ETP global et ratios consolidés', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    expect(r.totaux.coutMoyenETPGlobal).toBe(Math.round(r.totaux.totalMS / r.totaux.totalETP));
    expect(r.totaux.ratioMSRecettesGlobal).toBe(
      Math.round((r.totaux.totalMS / r.totaux.totalRecettes) * 1000) / 10
    );
  });

  it('compte les services en alerte (danger / warning)', () => {
    const r = calculerAnalyseRH(services, poolRH, getBudgetService);
    expect(r.totaux.nbServicesEnDanger).toBe(r.parService.filter(s => s.niveau === 'danger').length);
    expect(r.totaux.nbServicesEnWarning).toBe(r.parService.filter(s => s.niveau === 'warning').length);
  });

  it('Pool RH avec affectation > 100 % normalisé (anti double-comptage)', () => {
    const poolBuggy = [{
      id: 'agX', titre: 'Saturé', etp: 1, salaire: 3000, segur: false, typeContrat: 'CDI',
      affectations: [
        { entityType: 'service', entityId: 's1', pct: 80 },
        { entityType: 'service', entityId: 's2', pct: 80 },
      ], // total 160 % → normalisé à 100 %
    }];
    const r = calculerAnalyseRH(services, poolBuggy, getBudgetService);
    const s1 = r.parService.find(x => x.id === 's1');
    const s2 = r.parService.find(x => x.id === 's2');
    // pct effectif s1 = 80 × (100/160) = 50, s2 idem 50 → ETP cumulé = 1 (pas 1.6)
    expect(s1.etpPool + s2.etpPool).toBeCloseTo(1, 2);
  });

  it('Pool RH vide ou null → MS pool = 0', () => {
    const r1 = calculerAnalyseRH(services, [], getBudgetService);
    const r2 = calculerAnalyseRH(services, null, getBudgetService);
    expect(r1.parService.every(s => s.msPool === 0)).toBe(true);
    expect(r2.parService.every(s => s.msPool === 0)).toBe(true);
  });

  it('robustesse : services null/undefined → tableau vide', () => {
    const r = calculerAnalyseRH(null, null, null, null);
    expect(r.parService).toEqual([]);
    expect(r.totaux.totalMS).toBe(0);
    expect(r.totaux.totalETP).toBe(0);
    expect(r.totaux.coutMoyenETPGlobal).toBe(0);
  });

  it('respecte un override globalParams.tauxChargesBase', () => {
    const tauxAlt = 0.5;
    const r = calculerAnalyseRH(services, [], getBudgetService, { tauxChargesBase: tauxAlt });
    const s1 = r.parService.find(x => x.id === 's1');
    const attendu =
      calculerSalaireAnnuel(3000, 2, 0, 'CDI', null, null, null, 0, tauxAlt).total +
      calculerSalaireAnnuel(2500, 1, 0, 'CDI', null, null, null, 0, tauxAlt).total;
    expect(s1.msInterne).toBe(Math.round(attendu));
  });

  it('recommandations contextuelles 4 niveaux', () => {
    expect(recommendationRH('success', 50, 65)).toMatch(/soutenable/);
    expect(recommendationRH('warning', 75, 60)).toMatch(/Tension RH/);
    expect(recommendationRH('warning', 50, 85)).toMatch(/RH-intensif/);
    expect(recommendationRH('danger', 95, 80)).toMatch(/MS critique/);
    expect(recommendationRH('neutral', 0, 0)).toMatch(/Aucune recette/);
  });
});
