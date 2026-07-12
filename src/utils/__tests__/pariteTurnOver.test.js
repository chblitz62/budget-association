import { describe, it, expect } from 'vitest';
import {
  calculerPariteHF,
  calculerTurnOver,
  calculerIndicateursPariteTurnOver,
  recommendationParite,
  recommendationTurnOver,
  SEUIL_PARITE_EQUILIBRE,
  SEUIL_PARITE_DESEQUILIBRE,
  SEUIL_TURNOVER_WARNING,
  SEUIL_TURNOVER_DANGER,
  ECHANTILLON_MIN_PARITE,
} from '../pariteTurnOver';

const ANNEE = 2026;

const makeAgent = (overrides = {}) => ({
  id: Math.random(),
  titre: 'Agent',
  etp: 1,
  genre: '',
  dateEntree: 0,
  dateSortie: 0,
  ...overrides,
});

describe('Parité H/F & Turn-over — Axe 8', () => {
  it('expose les seuils par défaut', () => {
    expect(SEUIL_PARITE_EQUILIBRE).toBe(45);
    expect(SEUIL_PARITE_DESEQUILIBRE).toBe(30);
    expect(SEUIL_TURNOVER_WARNING).toBe(10);
    expect(SEUIL_TURNOVER_DANGER).toBe(15);
    expect(ECHANTILLON_MIN_PARITE).toBe(3);
  });

  it('décompte H/F et calcule les pourcentages', () => {
    const agents = [
      makeAgent({ genre: 'H', etp: 1 }),
      makeAgent({ genre: 'H', etp: 0.8 }),
      makeAgent({ genre: 'F', etp: 1 }),
      makeAgent({ genre: 'F', etp: 0.5 }),
      makeAgent({ genre: 'F', etp: 1 }),
    ];
    const r = calculerPariteHF(agents, ANNEE);
    expect(r.nbH).toBe(2);
    expect(r.nbF).toBe(3);
    expect(r.nbRenseignes).toBe(5);
    expect(r.pctH).toBe(40);
    expect(r.pctF).toBe(60);
    expect(r.etpH).toBeCloseTo(1.8, 2);
    expect(r.etpF).toBeCloseTo(2.5, 2);
    expect(r.indexParite).toBe(40);
    expect(r.genreMajoritaire).toBe('F');
  });

  it('exclut les agents non actifs sur l\'année (entrée future ou sortis avant)', () => {
    const agents = [
      makeAgent({ genre: 'H', dateEntree: ANNEE + 1 }),    // pas encore entré
      makeAgent({ genre: 'F', dateSortie: ANNEE - 2 }),    // sorti
      makeAgent({ genre: 'H', dateEntree: 2020 }),         // actif
      makeAgent({ genre: 'F', dateEntree: 2018, dateSortie: ANNEE }), // actif sur ANNEE (sort en cours d'année)
    ];
    const r = calculerPariteHF(agents, ANNEE);
    expect(r.nbRenseignes).toBe(2);
    expect(r.nbH).toBe(1);
    expect(r.nbF).toBe(1);
  });

  it('compte les agents sans genre dans nbNonRenseigne', () => {
    const agents = [
      makeAgent({ genre: 'H' }),
      makeAgent({ genre: '' }),
      makeAgent({ genre: 'F' }),
      makeAgent(),
    ];
    const r = calculerPariteHF(agents, ANNEE);
    expect(r.nbNonRenseigne).toBe(2);
    expect(r.nbRenseignes).toBe(2);
  });

  it('attribue niveau success / warning / danger / neutral selon index parité', () => {
    // 5 H + 4 F → minoritaire = 4/9 ≈ 44.4 % → warning
    const tied = [
      ...Array.from({ length: 5 }, () => makeAgent({ genre: 'H' })),
      ...Array.from({ length: 4 }, () => makeAgent({ genre: 'F' })),
    ];
    expect(calculerPariteHF(tied, ANNEE).niveau).toBe('warning');

    // 9 H + 1 F → 10 % → danger
    const skewed = [
      ...Array.from({ length: 9 }, () => makeAgent({ genre: 'H' })),
      makeAgent({ genre: 'F' }),
    ];
    expect(calculerPariteHF(skewed, ANNEE).niveau).toBe('danger');

    // 5 H + 5 F → 50 % → success
    const balanced = [
      ...Array.from({ length: 5 }, () => makeAgent({ genre: 'H' })),
      ...Array.from({ length: 5 }, () => makeAgent({ genre: 'F' })),
    ];
    expect(calculerPariteHF(balanced, ANNEE).niveau).toBe('success');

    // 2 agents seulement → neutral (échantillon trop petit)
    const tiny = [makeAgent({ genre: 'H' }), makeAgent({ genre: 'F' })];
    expect(calculerPariteHF(tiny, ANNEE).niveau).toBe('neutral');
  });

  it('robuste face à liste vide ou null', () => {
    expect(() => calculerPariteHF(null, ANNEE)).not.toThrow();
    expect(calculerPariteHF([], ANNEE).nbRenseignes).toBe(0);
    expect(calculerPariteHF([null, undefined], ANNEE).nbRenseignes).toBe(0);
  });

  it('calcule les entrées et sorties de l\'année', () => {
    const agents = [
      makeAgent({ dateEntree: 2020, dateSortie: 0 }),                    // continue
      makeAgent({ dateEntree: ANNEE, dateSortie: 0 }),                    // entrée de l'année
      makeAgent({ dateEntree: 2018, dateSortie: ANNEE }),                 // sortie de l'année
      makeAgent({ dateEntree: ANNEE, dateSortie: ANNEE }),                // entrée + sortie même année
      makeAgent({ dateEntree: 2010, dateSortie: 2020 }),                  // sorti il y a longtemps (exclu)
    ];
    const r = calculerTurnOver(agents, ANNEE);
    expect(r.entrees).toBe(2);
    expect(r.sorties).toBe(2);
  });

  it('calcule le turn-over selon (entrées+sorties)/2/effectifMoyen', () => {
    const agents = [
      makeAgent({ dateEntree: 2018 }),    // present continu
      makeAgent({ dateEntree: 2018 }),
      makeAgent({ dateEntree: 2018 }),
      makeAgent({ dateEntree: 2018 }),
      makeAgent({ dateEntree: 2018 }),
      makeAgent({ dateEntree: 2018 }),
      makeAgent({ dateEntree: 2018 }),
      makeAgent({ dateEntree: 2018 }),    // 8 stables
      makeAgent({ dateEntree: ANNEE }),    // 1 entrée
      makeAgent({ dateEntree: 2018, dateSortie: ANNEE }),  // 1 sortie
    ];
    const r = calculerTurnOver(agents, ANNEE);
    // 31/12/N-1 : 8 stables + 1 sortant (encore là) = 9
    // 31/12/N   : 8 stables + 1 entrée = 9 (sortant n'est plus présent)
    // moyen = 9
    expect(r.effectifDebut).toBe(9);
    expect(r.effectifFin).toBe(9);
    expect(r.effectifMoyen).toBe(9);
    expect(r.entrees).toBe(1);
    expect(r.sorties).toBe(1);
    // turn-over = (1+1)/2/9 = 11.1 %
    expect(r.turnOver).toBeCloseTo(11.1, 1);
    expect(r.tauxEntree).toBeCloseTo(11.1, 1);
    expect(r.tauxSortie).toBeCloseTo(11.1, 1);
  });

  it('attribue niveau turn-over success / warning / danger', () => {
    // 10 stables → turnOver 0 % → success
    const stable = Array.from({ length: 10 }, () => makeAgent({ dateEntree: 2018 }));
    expect(calculerTurnOver(stable, ANNEE).niveau).toBe('success');

    // 10 stables + 1 entrée + 1 sortie → ≈ 9-10 % → warning ou success selon arrondi
    const moving = [
      ...Array.from({ length: 10 }, () => makeAgent({ dateEntree: 2018 })),
      makeAgent({ dateEntree: ANNEE }),
      makeAgent({ dateEntree: 2018, dateSortie: ANNEE }),
    ];
    const moving_r = calculerTurnOver(moving, ANNEE);
    // début=11, fin=11 (10 stables + 1 sortant + 1 entrée -1 sortant) → moyen=11
    // turn=(1+1)/2/11 ≈ 9.1 % → success
    expect(moving_r.niveau).toBe('success');

    // 5 stables + 2 entrées + 2 sorties → turn ≈ 33 % → danger
    const heavy = [
      ...Array.from({ length: 5 }, () => makeAgent({ dateEntree: 2018 })),
      makeAgent({ dateEntree: ANNEE }),
      makeAgent({ dateEntree: ANNEE }),
      makeAgent({ dateEntree: 2018, dateSortie: ANNEE }),
      makeAgent({ dateEntree: 2018, dateSortie: ANNEE }),
    ];
    expect(calculerTurnOver(heavy, ANNEE).niveau).toBe('danger');
  });

  it('niveau neutral si effectif < 1 ou aucune date renseignée', () => {
    expect(calculerTurnOver([], ANNEE).niveau).toBe('neutral');
    const noDate = [makeAgent(), makeAgent()];
    expect(calculerTurnOver(noDate, ANNEE).niveau).toBe('neutral');
  });

  it('agrège par entité (Direction/Pôle/services/poolRH) avec consolidation', () => {
    const direction   = { personnel: [makeAgent({ genre: 'H', dateEntree: 2018 })] };
    const poleSupport = { personnel: [makeAgent({ genre: 'F', dateEntree: 2018 })] };
    const services    = [
      { id: 's1', nom: 'BPJEPS', personnel: [
        makeAgent({ genre: 'H', dateEntree: 2018 }),
        makeAgent({ genre: 'F', dateEntree: 2018 }),
        makeAgent({ genre: 'F', dateEntree: ANNEE }),
      ] },
    ];
    const poolRH = [makeAgent({ genre: 'H', dateEntree: 2020 })];

    const r = calculerIndicateursPariteTurnOver(direction, services, poleSupport, poolRH, ANNEE);
    expect(r.parEntite.map(e => e.id)).toEqual(expect.arrayContaining(['direction', 'poleSupport', 's1', 'poolRH']));
    expect(r.parEntite.length).toBe(4);
    // Consolidé : 3 H + 3 F = 6 renseignés
    expect(r.pariteConsolidee.nbRenseignes).toBe(6);
    expect(r.pariteConsolidee.indexParite).toBe(50);
    expect(r.pariteConsolidee.niveau).toBe('success');
    // Turn-over consolidé : 1 entrée sur 6 actifs
    expect(r.turnOverConsolide.entrees).toBe(1);
    expect(r.totaux.nbAgents).toBe(6);
  });

  it('omet entités sans personnel', () => {
    const r = calculerIndicateursPariteTurnOver(null, [{ id: 's', nom: 'S', personnel: [makeAgent({ genre: 'H' })] }], { personnel: [] }, [], ANNEE);
    expect(r.parEntite.map(e => e.id)).toEqual(['s']);
  });

  it('supporte override des seuils', () => {
    const services = [
      { id: 'sv', nom: 'Test', personnel: [
        ...Array.from({ length: 7 }, () => makeAgent({ genre: 'H' })),
        ...Array.from({ length: 3 }, () => makeAgent({ genre: 'F' })),
      ] },
    ];
    const standard = calculerIndicateursPariteTurnOver(null, services, null, [], ANNEE);
    expect(standard.parEntite[0].parite.niveau).toBe('warning'); // 30 % >= 30 désequilibre

    const strict = calculerIndicateursPariteTurnOver(null, services, null, [], ANNEE, {
      seuilPariteEquilibre: 60,
      seuilPariteDesequilibre: 35,
    });
    expect(strict.parEntite[0].parite.niveau).toBe('danger'); // 30 % < 35
  });

  it('garde-fou seuils incohérents', () => {
    const services = [{ id: 'sv', nom: 'Test', personnel: [makeAgent({ genre: 'H' })] }];
    const r = calculerIndicateursPariteTurnOver(null, services, null, [], ANNEE, {
      seuilPariteEquilibre: 30,
      seuilPariteDesequilibre: 50, // invalide
      seuilTurnOverWarning: 20,
      seuilTurnOverDanger: 5,       // invalide
    });
    expect(r.seuilsParite.desequilibre).toBe(30);
    expect(r.seuilsTurnOver.danger).toBe(20);
  });

  it('génère des recommandations contextuelles parité', () => {
    expect(recommendationParite('success', 50, null, 10)).toMatch(/✓.*Parité respectée/i);
    expect(recommendationParite('warning', 40, 'H', 10)).toMatch(/⚠.*masculine/i);
    expect(recommendationParite('danger', 15, 'F', 10)).toMatch(/✕.*féminine/i);
    expect(recommendationParite('neutral', 0, null, 1)).toMatch(/saisir le genre/i);
  });

  it('génère des recommandations contextuelles turn-over', () => {
    expect(recommendationTurnOver('success', 5, 1, 1, 20)).toMatch(/✓.*stable/i);
    expect(recommendationTurnOver('warning', 12, 3, 2, 20)).toMatch(/⚠.*élevé/i);
    expect(recommendationTurnOver('danger', 22, 5, 4, 20)).toMatch(/✕.*critique/i);
    expect(recommendationTurnOver('neutral', 0, 0, 0, 0)).toMatch(/insuffisantes/i);
  });
});
