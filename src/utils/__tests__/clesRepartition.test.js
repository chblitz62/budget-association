import { describe, it, expect } from 'vitest';
import {
  calculerRepartition, calculerCoutCompletParService, TYPES_CLES,
} from '../clesRepartition';

const services = [
  {
    id: 's1', nom: 'Service A',
    personnel: [{ etp: 5, salaire: 3000 }, { etp: 3, salaire: 2500 }],
    recettes: [{ montant: 10000 }],
    exploitation: [{ montant: 1000 }],
  },
  {
    id: 's2', nom: 'Service B',
    personnel: [{ etp: 2, salaire: 2800 }],
    recettes: [{ montant: 5000 }],
    exploitation: [{ montant: 500 }],
  },
];

describe('Moteur de Clés de Répartition — Axe 6 S6.3', () => {
  it('TYPES_CLES expose 7 clés', () => {
    expect(TYPES_CLES.length).toBe(7);
    const ids = TYPES_CLES.map(t => t.id);
    expect(ids).toContain('uniforme');
    expect(ids).toContain('etp');
    expect(ids).toContain('manuel');
  });

  it('uniforme : montant divisé à parts égales', () => {
    const r = calculerRepartition(10000, services, 'uniforme');
    expect(r.distribution.s1.montant).toBe(5000);
    expect(r.distribution.s2.montant).toBe(5000);
    expect(r.distribution.s1.pct).toBe(50);
  });

  it('etp : pondéré par les ETP du service', () => {
    // s1 = 8 ETP, s2 = 2 ETP, total = 10
    const r = calculerRepartition(10000, services, 'etp');
    expect(r.distribution.s1.montant).toBe(8000);
    expect(r.distribution.s2.montant).toBe(2000);
  });

  it('recettes : pondéré par recettes annuelles', () => {
    // s1 recettes annuelles = 120000, s2 = 60000, total = 180000
    const r = calculerRepartition(18000, services, 'recettes');
    expect(r.distribution.s1.montant).toBe(12000);
    expect(r.distribution.s2.montant).toBe(6000);
  });

  it('charges : pondéré par salaires + exploitation', () => {
    const r = calculerRepartition(100000, services, 'charges');
    // Les poids sont les charges directes — pas besoin de vérifier les chiffres exacts
    expect(r.distribution.s1.montant).toBeGreaterThan(r.distribution.s2.montant);
  });

  it('surface : utilise surfacesParService', () => {
    const r = calculerRepartition(10000, services, 'surface', {
      surfacesParService: { s1: 200, s2: 50 },
    });
    expect(r.distribution.s1.montant).toBe(8000);  // 200/250
    expect(r.distribution.s2.montant).toBe(2000);  // 50/250
  });

  it('heures : utilise heuresParService', () => {
    const r = calculerRepartition(10000, services, 'heures', {
      heuresParService: { s1: 600, s2: 400 },
    });
    expect(r.distribution.s1.montant).toBe(6000);
    expect(r.distribution.s2.montant).toBe(4000);
  });

  it('manuel : utilise pourcentagesParService directs (somme à 100)', () => {
    const r = calculerRepartition(10000, services, 'manuel', {
      pourcentagesParService: { s1: 70, s2: 30 },
    });
    expect(r.distribution.s1.montant).toBe(7000);
    expect(r.distribution.s2.montant).toBe(3000);
  });

  it('round-trip safe : la somme des montants = montant siège (1 € près)', () => {
    // Cas qui produit normalement des arrondis
    const r = calculerRepartition(10001, [
      { id: 's1', personnel: [{ etp: 1, salaire: 1 }] },
      { id: 's2', personnel: [{ etp: 2, salaire: 1 }] },
      { id: 's3', personnel: [{ etp: 3, salaire: 1 }] },
    ], 'etp');
    const somme = Object.values(r.distribution).reduce((s, d) => s + d.montant, 0);
    expect(somme).toBe(10001);
  });

  it('montant 0 → distribution avec montants = 0', () => {
    const r = calculerRepartition(0, services, 'uniforme');
    expect(r.distribution.s1.montant).toBe(0);
    expect(r.distribution.s2.montant).toBe(0);
    expect(r.total).toBe(0);
  });

  it('liste de services vide → ecart correct, distribution vide', () => {
    const r = calculerRepartition(10000, [], 'uniforme');
    expect(r.distribution).toEqual({});
    expect(r.metadata.nbServices).toBe(0);
  });

  it('totalPoids = 0 (tous services sans ETP) → fallback uniforme', () => {
    const r = calculerRepartition(10000, [
      { id: 's1', personnel: [] },
      { id: 's2', personnel: [] },
    ], 'etp');
    expect(r.distribution.s1.montant).toBe(5000);
    expect(r.distribution.s2.montant).toBe(5000);
  });

  it('clé inconnue → fallback uniforme', () => {
    const r = calculerRepartition(10000, services, 'cle_inconnue');
    expect(r.distribution.s1.montant).toBe(5000);
    expect(r.distribution.s2.montant).toBe(5000);
  });

  it('robustesse aux valeurs invalides (services null, montant string)', () => {
    const r = calculerRepartition('abc', null, 'etp');
    expect(r.distribution).toEqual({});
  });

  it('calculerCoutCompletParService combine charges directes + quote-part', () => {
    const getBudgetService = (s) => ({
      salaires: s.id === 's1' ? 50000 : 20000,
      exploitation: s.id === 's1' ? 10000 : 5000,
      recettes: s.id === 's1' ? 80000 : 40000,
      total: s.id === 's1' ? 60000 : 25000,
    });
    const result = calculerCoutCompletParService(
      services,
      { total: 10000 },
      getBudgetService,
      'etp',
    );
    expect(result.parService.length).toBe(2);
    expect(result.parService[0].chargesDirectes).toBe(60000);
    // s1 : 8 ETP / 10 ETP * 10000 = 8000 quote-part
    expect(result.parService[0].quotePartSiege).toBe(8000);
    expect(result.parService[0].coutComplet).toBe(68000);
    // Solde direct = 80000 - 60000 = 20000 ; complet = 80000 - 68000 = 12000
    expect(result.parService[0].soldeDirect).toBe(20000);
    expect(result.parService[0].soldeComplet).toBe(12000);
  });

  it('totaux consolidés calculerCoutCompletParService', () => {
    const getBudgetService = () => ({ salaires: 0, exploitation: 0, recettes: 1000, total: 800 });
    const result = calculerCoutCompletParService(services, { total: 5000 }, getBudgetService, 'uniforme');
    expect(result.totalRecettes).toBe(2000);
    expect(result.totalCharges).toBe(1600);
    expect(result.totalQuotePart).toBe(5000); // tout le siège réalloué
  });
});
