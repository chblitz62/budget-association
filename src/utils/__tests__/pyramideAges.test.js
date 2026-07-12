import { describe, it, expect } from 'vitest';
import {
  calculerPyramideAges,
  calculerAncienneteMoyenne,
  calculerIndicateursRH,
  recommendationRH,
  TRANCHES_AGE,
  SEUIL_VIEILLISSEMENT_WARNING,
  SEUIL_VIEILLISSEMENT_DANGER,
  AGE_SENIOR,
} from '../pyramideAges';

const ANNEE = 2026;

const makeAgent = (overrides = {}) => ({
  id: Math.random(),
  titre: 'Agent',
  etp: 1,
  salaire: 2500,
  anneeNaissance: 0,
  dateEntree: 0,
  ...overrides,
});

describe('Pyramide des Âges & Ancienneté — Axe 8', () => {
  it('expose les seuils par défaut et l\'âge senior', () => {
    expect(SEUIL_VIEILLISSEMENT_WARNING).toBe(25);
    expect(SEUIL_VIEILLISSEMENT_DANGER).toBe(30);
    expect(AGE_SENIOR).toBe(55);
    expect(TRANCHES_AGE.length).toBe(9);
    expect(TRANCHES_AGE[0].id).toBe('t_under_25');
    expect(TRANCHES_AGE[TRANCHES_AGE.length - 1].id).toBe('t_60_plus');
  });

  it('range chaque agent dans la bonne tranche d\'âge', () => {
    const agents = [
      makeAgent({ anneeNaissance: 2003 }), // 23 ans → ≤25
      makeAgent({ anneeNaissance: 1998 }), // 28 ans → 25-29
      makeAgent({ anneeNaissance: 1985 }), // 41 ans → 40-44
      makeAgent({ anneeNaissance: 1970 }), // 56 ans → 55-59
      makeAgent({ anneeNaissance: 1962 }), // 64 ans → ≥60
    ];
    const r = calculerPyramideAges(agents, ANNEE);
    expect(r.nbAgentsRenseignes).toBe(5);
    expect(r.tranches.find(t => t.id === 't_under_25').nbAgents).toBe(1);
    expect(r.tranches.find(t => t.id === 't_25_29').nbAgents).toBe(1);
    expect(r.tranches.find(t => t.id === 't_40_44').nbAgents).toBe(1);
    expect(r.tranches.find(t => t.id === 't_55_59').nbAgents).toBe(1);
    expect(r.tranches.find(t => t.id === 't_60_plus').nbAgents).toBe(1);
  });

  it('compte ETP par tranche et calcule les pourcentages', () => {
    const agents = [
      makeAgent({ anneeNaissance: 2000, etp: 1 }),    // 26 ans → 25-29
      makeAgent({ anneeNaissance: 2000, etp: 0.5 }),  // 26 ans → 25-29
      makeAgent({ anneeNaissance: 1980, etp: 1 }),    // 46 ans → 45-49
    ];
    const r = calculerPyramideAges(agents, ANNEE);
    const tr2529 = r.tranches.find(t => t.id === 't_25_29');
    const tr4549 = r.tranches.find(t => t.id === 't_45_49');
    expect(tr2529.nbAgents).toBe(2);
    expect(tr2529.etp).toBeCloseTo(1.5, 2);
    expect(tr4549.nbAgents).toBe(1);
    expect(tr4549.etp).toBeCloseTo(1, 2);
    // ETP renseigné consolidé
    expect(r.etpRenseigne).toBeCloseTo(2.5, 2);
    // % ETP : 1.5 / 2.5 = 60 %
    expect(tr2529.pctETP).toBeCloseTo(60, 1);
    // % agents : 2 / 3 ≈ 66.7 %
    expect(tr2529.pctAgents).toBeCloseTo(66.7, 1);
  });

  it('exclut les agents sans anneeNaissance valide et les compte', () => {
    const agents = [
      makeAgent({ anneeNaissance: 1985 }), // ok
      makeAgent({ anneeNaissance: 0 }),    // non renseigné
      makeAgent({ anneeNaissance: '' }),   // non renseigné
      makeAgent({ anneeNaissance: 1500 }), // âge > 100 → exclu
      makeAgent(),                         // par défaut 0 → non renseigné
    ];
    const r = calculerPyramideAges(agents, ANNEE);
    expect(r.nbAgentsRenseignes).toBe(1);
    expect(r.nbAgentsNonRenseignes).toBe(4);
  });

  it('calcule moyenne, médiane et part de seniors', () => {
    const agents = [
      makeAgent({ anneeNaissance: 1990, dateEntree: 2010 }), // 36 ans, 16 ans anc
      makeAgent({ anneeNaissance: 1980, dateEntree: 2000 }), // 46 ans, 26 ans anc
      makeAgent({ anneeNaissance: 1970, dateEntree: 1990 }), // 56 ans, 36 ans anc → senior
      makeAgent({ anneeNaissance: 1968, dateEntree: 2018 }), // 58 ans, 8 ans anc → senior
    ];
    const stats = calculerAncienneteMoyenne(agents, ANNEE);
    expect(stats.ageMoyen).toBeCloseTo(49, 1);          // (36+46+56+58)/4 = 49
    expect(stats.ageMedian).toBeCloseTo(51, 1);          // median(36,46,56,58) = (46+56)/2 = 51
    expect(stats.ancMoyenne).toBeCloseTo(21.5, 1);       // (16+26+36+8)/4 = 21.5
    expect(stats.nbSeniors).toBe(2);
    expect(stats.pctSeniors).toBeCloseTo(50, 1);
  });

  it('attribue niveau success / warning / danger selon % seniors', () => {
    const youngTeam = Array.from({ length: 10 }, () => makeAgent({ anneeNaissance: 1990 })); // 0 % seniors
    const aging     = Array.from({ length: 10 }, (_, i) => makeAgent({ anneeNaissance: i < 3 ? 1965 : 1985 })); // 30 % seniors → warning (>=25, <=30)
    const risky     = Array.from({ length: 10 }, (_, i) => makeAgent({ anneeNaissance: i < 4 ? 1960 : 1985 })); // 40 % seniors → danger

    const services = [
      { id: 'sv1', nom: 'Jeune',     personnel: youngTeam },
      { id: 'sv2', nom: 'Moyen',     personnel: aging },
      { id: 'sv3', nom: 'Vieillissant', personnel: risky },
    ];
    const r = calculerIndicateursRH(null, services, null, ANNEE);
    const sv1 = r.parEntite.find(e => e.id === 'sv1');
    const sv2 = r.parEntite.find(e => e.id === 'sv2');
    const sv3 = r.parEntite.find(e => e.id === 'sv3');
    expect(sv1.niveau).toBe('success');
    expect(sv2.niveau).toBe('warning');
    expect(sv3.niveau).toBe('danger');
  });

  it('attribue niveau neutral si aucune donnée d\'âge', () => {
    const services = [{ id: 'sv', nom: 'Vide', personnel: [makeAgent({ anneeNaissance: 0 })] }];
    const r = calculerIndicateursRH(null, services, null, ANNEE);
    expect(r.parEntite[0].niveau).toBe('neutral');
  });

  it('inclut Direction et Pôle Support comme entités distinctes', () => {
    const direction = { personnel: [makeAgent({ anneeNaissance: 1980 })] };
    const poleSupport = { personnel: [makeAgent({ anneeNaissance: 1985 })] };
    const services = [{ id: 's1', nom: 'S', personnel: [makeAgent({ anneeNaissance: 1990 })] }];
    const r = calculerIndicateursRH(direction, services, poleSupport, ANNEE);
    const ids = r.parEntite.map(e => e.id);
    expect(ids).toContain('direction');
    expect(ids).toContain('poleSupport');
    expect(ids).toContain('s1');
    expect(r.parEntite.length).toBe(3);
  });

  it('omet Direction/Pôle si personnel vide', () => {
    const direction = { personnel: [] };
    const poleSupport = null;
    const services = [{ id: 's1', nom: 'S', personnel: [makeAgent({ anneeNaissance: 1990 })] }];
    const r = calculerIndicateursRH(direction, services, poleSupport, ANNEE);
    const ids = r.parEntite.map(e => e.id);
    expect(ids).not.toContain('direction');
    expect(ids).not.toContain('poleSupport');
    expect(ids).toEqual(['s1']);
  });

  it('trie les services par niveau danger > warning > success > neutral, puis pctSeniors décroissant', () => {
    const services = [
      { id: 'a', nom: 'A', personnel: Array.from({ length: 10 }, () => makeAgent({ anneeNaissance: 1990 })) }, // 0 % → success
      { id: 'b', nom: 'B', personnel: Array.from({ length: 10 }, (_, i) => makeAgent({ anneeNaissance: i < 5 ? 1960 : 1990 })) }, // 50 % → danger
      { id: 'c', nom: 'C', personnel: Array.from({ length: 10 }, (_, i) => makeAgent({ anneeNaissance: i < 3 ? 1965 : 1985 })) }, // 30 % → warning
    ];
    const r = calculerIndicateursRH(null, services, null, ANNEE);
    expect(r.parEntite.map(e => e.id)).toEqual(['b', 'c', 'a']);
    expect(r.totaux.nbServicesEnRisque).toBe(1);
    expect(r.totaux.nbServicesEnAlerte).toBe(1);
  });

  it('consolide la pyramide tous services confondus', () => {
    const services = [
      { id: 's1', nom: 'S1', personnel: [makeAgent({ anneeNaissance: 1990 })] },
      { id: 's2', nom: 'S2', personnel: [makeAgent({ anneeNaissance: 1965 })] },
    ];
    const r = calculerIndicateursRH(null, services, null, ANNEE);
    expect(r.pyramideConsolidee.nbAgentsRenseignes).toBe(2);
    expect(r.totaux.nbAgents).toBe(2);
    expect(r.totaux.nbAgeRenseigne).toBe(2);
    expect(r.totaux.pctSeniors).toBeCloseTo(50, 1);
    expect(r.totaux.niveau).toBe('danger');
  });

  it('supporte override des seuils via options', () => {
    const services = [
      { id: 'sv', nom: 'Test', personnel: Array.from({ length: 10 }, (_, i) => makeAgent({ anneeNaissance: i < 2 ? 1965 : 1990 })) }, // 20 %
    ];
    const standard = calculerIndicateursRH(null, services, null, ANNEE);
    expect(standard.parEntite[0].niveau).toBe('success'); // 20 % < 25 % default

    const strict = calculerIndicateursRH(null, services, null, ANNEE, {
      seuilVieillissementWarning: 15,
      seuilVieillissementDanger: 50,
    });
    expect(strict.parEntite[0].niveau).toBe('warning'); // 20 % >= 15 %
  });

  it('garde-fou : danger ne peut pas être < warning', () => {
    const services = [
      { id: 'sv', nom: 'Test', personnel: Array.from({ length: 10 }, (_, i) => makeAgent({ anneeNaissance: i < 4 ? 1965 : 1990 })) }, // 40 %
    ];
    const r = calculerIndicateursRH(null, services, null, ANNEE, {
      seuilVieillissementWarning: 30,
      seuilVieillissementDanger: 10, // invalide → ramené à 30
    });
    expect(r.seuils.danger).toBe(30);
    expect(r.seuils.warning).toBe(30);
  });

  it('gère les ancienneté manquantes indépendamment de l\'âge', () => {
    const agents = [
      makeAgent({ anneeNaissance: 1990, dateEntree: 0 }),     // âge ok, anc manquante
      makeAgent({ anneeNaissance: 0,    dateEntree: 2010 }),   // âge manquant, anc ok
    ];
    const stats = calculerAncienneteMoyenne(agents, ANNEE);
    expect(stats.nbAgeRenseigne).toBe(1);
    expect(stats.nbAncRenseigne).toBe(1);
    expect(stats.nbAgeNonRenseigne).toBe(1);
    expect(stats.nbAncNonRenseigne).toBe(1);
    expect(stats.ageMoyen).toBe(36);
    expect(stats.ancMoyenne).toBe(16);
  });

  it('robuste face à null / undefined / tableau vide', () => {
    expect(() => calculerPyramideAges(null, ANNEE)).not.toThrow();
    expect(() => calculerPyramideAges(undefined, ANNEE)).not.toThrow();
    expect(calculerPyramideAges([], ANNEE).nbAgentsRenseignes).toBe(0);
    expect(() => calculerIndicateursRH(null, null, null, ANNEE)).not.toThrow();
    expect(calculerIndicateursRH(null, null, null, ANNEE).parEntite).toEqual([]);
  });

  it('ignore les agents null/falsy dans les listes', () => {
    const agents = [
      null,
      undefined,
      makeAgent({ anneeNaissance: 1990 }),
      false,
    ];
    const r = calculerPyramideAges(agents, ANNEE);
    expect(r.nbAgentsRenseignes).toBe(1);
  });

  it('génère des recommandations contextuelles par niveau', () => {
    expect(recommendationRH('success', 10, 38, 8, 5)).toMatch(/✓.*sain/i);
    expect(recommendationRH('warning', 27, 50, 18, 10)).toMatch(/⚠.*Vieillissement/i);
    expect(recommendationRH('danger', 40, 55, 25, 10)).toMatch(/✕.*Risque/i);
    expect(recommendationRH('neutral', 0, 0, 0, 0)).toMatch(/saisir/i);
  });
});
