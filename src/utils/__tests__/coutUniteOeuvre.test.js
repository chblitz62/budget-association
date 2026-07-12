import { describe, it, expect } from 'vitest';
import {
  calculerCoutUniteOeuvre, recommendationCoutEtudiant, HEURES_STAGIAIRES_DEFAULT,
} from '../coutUniteOeuvre';

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
  if (s.id === 's1') return { salaires: 0, exploitation: 0, recettes: 120000, total: 100000 };
  return { salaires: 0, exploitation: 0, recettes: 72000, total: 50000 };
};

describe('Coût par Unité d’Œuvre — Axe 6 + Axe 3 CCHS', () => {
  it('expose une constante HEURES_STAGIAIRES_DEFAULT à 1500 h', () => {
    expect(HEURES_STAGIAIRES_DEFAULT).toBe(1500);
  });

  it('calcule un coût/étudiant cohérent : coût complet ÷ effectif actuel', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, {
      cleRepartition: { type: 'etp', params: {} },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    // s1 effectif actuel = 20 - 2 = 18
    expect(s1.effectif).toBe(18);
    // s1 quote-part = 4/6 * 60000 = 40000 ; coût complet = 100000 + 40000 = 140000
    expect(s1.coutComplet).toBe(140000);
    // coût/étudiant = 140000 / 18 ≈ 7778
    expect(s1.coutEtudiantComplet).toBe(Math.round(140000 / 18));
  });

  it('CCHS = coût complet ÷ (effectif × heures/an)', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, {
      cleRepartition: { type: 'etp', params: {} },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    // Effectif 18 × 1500 h = 27 000 h ; CCHS = 140000 / 27000 ≈ 5,19 €/h
    expect(s1.totalHeuresStagiaires).toBe(18 * 1500);
    expect(s1.cchs).toBeCloseTo(140000 / 27000, 1);
  });

  it('respecte un override globalParams.heuresStagiairesParService', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, {
      cleRepartition: { type: 'etp', params: {} },
      heuresStagiairesParService: { s1: 1200 },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.heuresAnnuelles).toBe(1200);
    expect(s1.totalHeuresStagiaires).toBe(18 * 1200);
  });

  it('utilise heuresParService de cleRepartition.params si pas d’override direct', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, {
      cleRepartition: { type: 'heures', params: { heuresParService: { s1: 800 } } },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    expect(s1.heuresAnnuelles).toBe(800);
  });

  it('niveau success quand marge unitaire ≥ 5 % des recettes/étudiant', () => {
    // recettes/étudiant >> coût/étudiant → marge confortable
    const r = calculerCoutUniteOeuvre(services, { total: 0 }, getBudgetService, {
      cleRepartition: { type: 'etp', params: {} },
    });
    const s2 = r.parService.find(x => x.id === 's2');
    // s2 : coût direct 50000 / 12 effectifs ≈ 4167 ; recettes 72000/12 = 6000 → marge 1833 (>5%)
    expect(s2.niveau).toBe('success');
  });

  it('niveau danger quand le coût complet dépasse les recettes', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, {
      cleRepartition: { type: 'etp', params: {} },
    });
    const s1 = r.parService.find(x => x.id === 's1');
    // s1 : recettes 120000/18 ≈ 6667 ; coût complet 140000/18 ≈ 7778 → déficit
    expect(s1.niveau).toBe('danger');
    expect(s1.margeEtudiant).toBeLessThan(0);
  });

  it('renvoie niveau neutral si l’effectif est nul', () => {
    const sansEffectif = [{ id: 'x', nom: 'Vide', personnel: [{ etp: 1, salaire: 1 }], recettes: [], exploitation: [] }];
    const r = calculerCoutUniteOeuvre(sansEffectif, { total: 1000 },
      () => ({ salaires: 0, exploitation: 0, recettes: 0, total: 1000 }),
      { cleRepartition: { type: 'etp', params: {} } },
    );
    const x = r.parService[0];
    expect(x.effectif).toBe(0);
    expect(x.cchs).toBe(0);
    expect(x.coutEtudiantComplet).toBe(0);
    expect(x.niveau).toBe('neutral');
  });

  it('totaux consolidés : moyennes pondérées par effectif', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, {
      cleRepartition: { type: 'etp', params: {} },
    });
    // Effectifs : 18 + 12 = 30 ; Coût complet : 140000 + (50000 + 20000) = 210000
    expect(r.totaux.totalEffectif).toBe(30);
    expect(r.totaux.totalCoutComplet).toBe(140000 + 70000);
    expect(r.totaux.coutEtudiantMoyen).toBe(Math.round(210000 / 30));
  });

  it('CCHS consolidé = coût complet total ÷ heures totales', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, {
      cleRepartition: { type: 'etp', params: {} },
    });
    const totalHeures = (18 + 12) * 1500;
    expect(r.totaux.totalHeures).toBe(totalHeures);
    expect(r.totaux.cchsConsolide).toBeCloseTo(210000 / totalHeures, 1);
  });

  it('robustesse aux valeurs invalides (services null)', () => {
    const r = calculerCoutUniteOeuvre(null, null, null, null);
    expect(r.parService).toEqual([]);
    expect(r.totaux.totalEffectif).toBe(0);
    expect(r.totaux.cchsConsolide).toBe(0);
  });

  it('recommandations contextuelles par niveau', () => {
    expect(recommendationCoutEtudiant('success', 1500)).toMatch(/confortable/);
    expect(recommendationCoutEtudiant('warning', 200)).toMatch(/fragile/);
    expect(recommendationCoutEtudiant('danger', -800)).toMatch(/Déficit|déficit/);
    expect(recommendationCoutEtudiant('neutral', 0)).toMatch(/indisponible|Aucune/);
  });

  it('utilise par défaut la clé etp si globalParams absent', () => {
    const r = calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, undefined);
    expect(r.parService.length).toBe(2);
    expect(r.totaux.totalEffectif).toBe(30);
  });
});
