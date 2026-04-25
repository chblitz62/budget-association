import { describe, it, expect } from 'vitest';
import { detecterDoubleComptage } from '../doubleComptageDetection';

describe('doubleComptageDetection — Pool RH ↔ personnel direct', () => {
  it('retourne 0 doublon si Pool RH vide', () => {
    const r = detecterDoubleComptage([], { personnel: [] }, [], null);
    expect(r.total).toBe(0);
    expect(r.doublons).toEqual([]);
  });

  it('détecte un match exact par numeroAgent (confiance haute)', () => {
    const pool = [{ id: 'a1', titre: 'Marie Dupont', numeroAgent: 'A0042', salaire: 3000, affectations: [{ pct: 30 }] }];
    const direction = { personnel: [{ id: 'd1', titre: 'Marie Dupont', numeroAgent: 'A0042', salaire: 3000, etp: 1 }] };
    const r = detecterDoubleComptage(pool, direction, [], null);
    expect(r.total).toBe(1);
    expect(r.doublons[0].matchType).toBe('numeroAgent');
    expect(r.doublons[0].confiance).toBe('haute');
  });

  it('détecte un match fuzzy par titre normalisé (confiance moyenne sans numéro)', () => {
    const pool = [{ id: 'a1', titre: 'Jean-Pierre MARTIN', salaire: 2500, affectations: [{ pct: 50 }] }];
    const services = [{ id: 's1', nom: 'Service A', personnel: [{ id: 'd1', titre: 'jean pierre martin', etp: 1 }] }];
    const r = detecterDoubleComptage(pool, null, services, null);
    expect(r.total).toBe(1);
    expect(r.doublons[0].matchType).toBe('fuzzy');
    expect(r.doublons[0].confiance).toBe('moyenne');
  });

  it('confiance basse si l\'un a un numéro et l\'autre non (même titre)', () => {
    const pool = [{ id: 'a1', titre: 'Marie Dupont', numeroAgent: 'A0042', salaire: 3000, affectations: [{ pct: 30 }] }];
    const direction = { personnel: [{ id: 'd1', titre: 'marie dupont', etp: 1 }] };
    const r = detecterDoubleComptage(pool, direction, [], null);
    expect(r.total).toBe(1);
    expect(r.doublons[0].confiance).toBe('basse');
  });

  it('aucun doublon si les noms ne correspondent pas', () => {
    const pool = [{ id: 'a1', titre: 'Marie Dupont', salaire: 3000, affectations: [{ pct: 30 }] }];
    const direction = { personnel: [{ id: 'd1', titre: 'Paul Durand', etp: 1 }] };
    const r = detecterDoubleComptage(pool, direction, [], null);
    expect(r.total).toBe(0);
  });

  it('estime un surcoût > 0 quand un doublon est détecté avec affectation Pool', () => {
    const pool = [{ id: 'a1', titre: 'X', numeroAgent: 'N1', salaire: 2000, affectations: [{ pct: 50 }] }];
    const direction = { personnel: [{ id: 'd1', titre: 'X', numeroAgent: 'N1', etp: 1 }] };
    const r = detecterDoubleComptage(pool, direction, [], null);
    expect(r.surcoutTotal).toBeGreaterThan(0);
  });

  it('détecte plusieurs doublons distincts', () => {
    const pool = [
      { id: 'a1', titre: 'Marie Dupont', numeroAgent: 'A1', salaire: 2500, affectations: [{ pct: 50 }] },
      { id: 'a2', titre: 'Paul Durand', numeroAgent: 'A2', salaire: 2800, affectations: [{ pct: 40 }] },
    ];
    const direction = { personnel: [{ id: 'd1', titre: 'Marie Dupont', numeroAgent: 'A1', etp: 1 }] };
    const services = [{ id: 's1', nom: 'Service', personnel: [{ id: 'd2', titre: 'Paul Durand', numeroAgent: 'A2', etp: 1 }] }];
    const r = detecterDoubleComptage(pool, direction, services, null);
    expect(r.total).toBe(2);
  });

  it('ignore les agents sans titre ni numéro', () => {
    const pool = [{ id: 'a1', salaire: 2500, affectations: [{ pct: 50 }] }];
    const direction = { personnel: [{ id: 'd1', titre: 'Marie Dupont', etp: 1 }] };
    const r = detecterDoubleComptage(pool, direction, [], null);
    expect(r.total).toBe(0);
  });

  it('hasNumeroAgent true si au moins un agent a un numéro', () => {
    const pool = [{ id: 'a1', titre: 'X', numeroAgent: 'N1', salaire: 2000, affectations: [] }];
    const direction = { personnel: [{ id: 'd1', titre: 'Y', etp: 1 }] };
    const r = detecterDoubleComptage(pool, direction, [], null);
    expect(r.hasNumeroAgent).toBe(true);
  });
});
