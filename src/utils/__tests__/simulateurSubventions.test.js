import { describe, it, expect } from 'vitest';
import {
  extraireSubventions, scenariosVides, simulerImpactTresorerie,
  niveauSimulation, recommendationSimulation, estSubvention,
} from '../simulateurSubventions';

const direction = {
  recettes: [
    { nom: 'Subvention Région Hauts-de-France', montant: 10000 },
    { nom: 'Frais d\'inscription', montant: 2000 }, // pas une subvention
  ],
};

const services = [
  {
    id: 's1', nom: 'BPJEPS',
    recettes: [
      { nom: 'OPCO Santé', montant: 5000, moisPaiement: 2 }, // 100% en mars
      { nom: 'Frais de scolarité', montant: 4000 }, // pas une subvention
    ],
  },
  {
    id: 's2', nom: 'DEJEPS',
    recettes: [
      { nom: 'CPOM ARS', montant: 3000 }, // uniforme par défaut
    ],
  },
];

const tresoMois = Array.from({ length: 12 }, (_, i) => ({
  nom: `M${i+1}`,
  encaissements: 20000,
  decaissements: 19000,
  solde: 1000,
  soldeCumule: 1000 * (i + 1),
}));

describe('Simulateur Stress-Test Subventions — Axe 2', () => {
  it('estSubvention détecte les mots-clés courants', () => {
    expect(estSubvention('Subvention Région')).toBe(true);
    expect(estSubvention('OPCO Santé')).toBe(true);
    expect(estSubvention('CPOM ARS')).toBe(true);
    expect(estSubvention('Frais d\'inscription')).toBe(false);
    expect(estSubvention('')).toBe(false);
    expect(estSubvention(null)).toBe(false);
  });

  it('extraireSubventions filtre correctement et stable l\'id', () => {
    const subs = extraireSubventions(direction, services, null);
    expect(subs.length).toBe(3); // Région + OPCO + CPOM (pas frais)
    const ids = subs.map(s => s.id);
    expect(ids).toContain('direction::Subvention Région Hauts-de-France');
    expect(ids).toContain('s1::OPCO Santé');
    expect(ids).toContain('s2::CPOM ARS');
  });

  it('extraireSubventions calcule montant annuel correct', () => {
    const subs = extraireSubventions(direction, services, null);
    const region = subs.find(s => s.nom === 'Subvention Région Hauts-de-France');
    expect(region.montantAnnuel).toBe(10000 * 12);
  });

  it('extraireSubventions respecte moisPaiement (100 % sur 1 mois)', () => {
    const subs = extraireSubventions(null, services, null);
    const opco = subs.find(s => s.nom === 'OPCO Santé');
    expect(opco.distribution[2]).toBe(1); // mars
    expect(opco.distribution[0]).toBe(0);
  });

  it('scenariosVides initialise toutes les subventions à 0', () => {
    const subs = extraireSubventions(direction, services, null);
    const sc = scenariosVides(subs);
    expect(Object.keys(sc).length).toBe(3);
    Object.values(sc).forEach(s => {
      expect(s.decalageMois).toBe(0);
      expect(s.coupePct).toBe(0);
    });
  });

  it('simulation sans scénario actif → impact nul', () => {
    const subs = extraireSubventions(direction, services, null);
    const result = simulerImpactTresorerie(tresoMois, subs, scenariosVides(subs));
    result.moisAjustes.forEach(m => {
      expect(m.deltaMois).toBe(0);
      expect(m.soldeAjuste).toBe(m.soldeBase);
    });
    expect(result.metriques.moisEnRupture).toBe(0);
    expect(result.metriques.totalCoupeAnnuelle).toBe(0);
  });

  it('coupe de 100 % sur OPCO mars → encaissement perdu en mars', () => {
    const subs = extraireSubventions(null, services, null);
    const opcoId = subs.find(s => s.nom === 'OPCO Santé').id;
    const result = simulerImpactTresorerie(tresoMois, subs, {
      [opcoId]: { decalageMois: 0, coupePct: 100 },
    });
    expect(result.moisAjustes[2].deltaMois).toBe(-60000); // 5000 × 12 perdu
    expect(result.metriques.totalCoupeAnnuelle).toBe(60000);
  });

  it('décalage 3 mois sur OPCO mars → encaissement glissé en juin', () => {
    const subs = extraireSubventions(null, services, null);
    const opcoId = subs.find(s => s.nom === 'OPCO Santé').id;
    const result = simulerImpactTresorerie(tresoMois, subs, {
      [opcoId]: { decalageMois: 3, coupePct: 0 },
    });
    expect(result.moisAjustes[2].deltaMois).toBe(-60000); // mars perd
    expect(result.moisAjustes[5].deltaMois).toBe(60000);  // juin gagne
    expect(result.metriques.totalCoupeAnnuelle).toBe(0);  // pas de coupe
    expect(result.metriques.totalEncaisseManque).toBe(0); // total annuel inchangé
  });

  it('décalage hors année → recette perdue sur l\'exercice', () => {
    const subs = extraireSubventions(null, services, null);
    const opcoId = subs.find(s => s.nom === 'OPCO Santé').id;
    // Décalage 12 mois → la recette de mars (i=2) tomberait en mars N+1, perdue
    const result = simulerImpactTresorerie(tresoMois, subs, {
      [opcoId]: { decalageMois: 12, coupePct: 0 },
    });
    expect(result.metriques.totalCoupeAnnuelle).toBe(60000);
  });

  it('rupture de cash : forte coupe → cumul négatif → niveau danger', () => {
    // Coupe 100 % de la Région + OPCO → perte de 120000 + 60000 = 180000
    // Mais tresoMois cumul atteint 12000 max → cumul ajusté largement négatif
    const subs = extraireSubventions(direction, services, null);
    const sc = {};
    subs.forEach(s => { sc[s.id] = { decalageMois: 0, coupePct: 100 }; });
    const result = simulerImpactTresorerie(tresoMois, subs, sc);
    expect(result.metriques.moisEnRupture).toBeGreaterThan(0);
    expect(result.metriques.pireMoisCumul).toBeLessThan(0);
    expect(niveauSimulation(result.metriques, 19000 * 12)).toBe('danger');
  });

  it('moisRecovery : cumul redevient positif après une coupe ponctuelle', () => {
    // Coupe 100 % uniquement sur OPCO mars (60k perdu) ; le solde mensuel +1000 met du temps à recouvrir
    const subs = extraireSubventions(null, services, null);
    const opcoId = subs.find(s => s.nom === 'OPCO Santé').id;
    const result = simulerImpactTresorerie(tresoMois, subs, {
      [opcoId]: { decalageMois: 0, coupePct: 100 },
    });
    // Cumul base : +1000 chaque mois ; cumul ajusté : +1000 × 3 = 3000 puis chute à -57000 en mars
    // Recovery quand cumul retourne ≥ 0 → besoin de ~57 mois → null sur l'année
    expect(result.metriques.moisEnRupture).toBeGreaterThan(0);
    expect(result.metriques.moisRecovery).toBeNull();
  });

  it('niveauSimulation : warning quand perte > 5 % décaissements sans rupture', () => {
    // Petite coupe : 10 % de OPCO → 6000 perdu sur 228000 décaissements (2,6 %) → info
    expect(niveauSimulation({ moisEnRupture: 0, totalCoupeAnnuelle: 6000, totalEncaisseManque: -6000 }, 228000)).toBe('info');
    // Coupe ≈ 10 % décaissements → warning
    expect(niveauSimulation({ moisEnRupture: 0, totalCoupeAnnuelle: 25000, totalEncaisseManque: -25000 }, 228000)).toBe('warning');
    expect(niveauSimulation({ moisEnRupture: 0, totalCoupeAnnuelle: 0, totalEncaisseManque: 0 }, 228000)).toBe('success');
  });

  it('robustesse aux entrées null', () => {
    expect(extraireSubventions(null, null, null)).toEqual([]);
    const r = simulerImpactTresorerie(null, [], {});
    expect(r.moisAjustes).toEqual([]);
    expect(r.metriques.moisEnRupture).toBe(0);
  });

  it('recommendationSimulation : message contextuel par niveau', () => {
    expect(recommendationSimulation('danger', { moisEnRupture: 3, pireMois: 5, pireMoisCumul: -50000, moisRecovery: 10 })).toMatch(/Rupture/);
    expect(recommendationSimulation('warning', { totalCoupeAnnuelle: 25000 })).toMatch(/perte/);
    expect(recommendationSimulation('info', { totalEncaisseManque: -5000 })).toMatch(/Impact/);
    expect(recommendationSimulation('success', {})).toMatch(/Aucun impact/);
  });
});
