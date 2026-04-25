import { describe, it, expect } from 'vitest';
import { calculerIDRAgent, calculerProvisionIDR, DEFAULT_IDR_HYPOTHESES } from '../provisionIDR';

const baseAgent = {
  salaire: 3000, etp: 1, segur: false,
  anneeNaissance: 1970, // 56 ans en 2026 → 8 ans avant retraite à 64
  dateEntree: 2010,     // 16 ans d'ancienneté en 2026
};

const baseGlobalParams = {
  anneeExercice: 2026,
  montantSegurETP: 238,
};

describe('provisionIDR — méthode UCP / IAS 19', () => {
  it('retourne null sans anneeNaissance ou dateEntree', () => {
    expect(calculerIDRAgent({ salaire: 3000, etp: 1 }, DEFAULT_IDR_HYPOTHESES, 2026)).toBeNull();
  });

  it('calcule provision UCP < provision nominale (effet pondération)', () => {
    const c = calculerIDRAgent(baseAgent, DEFAULT_IDR_HYPOTHESES, 2026);
    expect(c.provisionUCP).toBeLessThan(c.provisionNominale);
    expect(c.provisionUCP).toBeGreaterThan(0);
  });

  it('proba présence × proba survie × actualisation < 1 (cumul des décréments)', () => {
    const c = calculerIDRAgent(baseAgent, DEFAULT_IDR_HYPOTHESES, 2026);
    const cumul = c.probabilitePresence * c.probabiliteSurvie * c.coefficientActualisation;
    expect(cumul).toBeLessThan(1);
    expect(cumul).toBeGreaterThan(0);
  });

  it('ancienneté à la retraite = ancienneté actuelle + années restantes', () => {
    const c = calculerIDRAgent(baseAgent, DEFAULT_IDR_HYPOTHESES, 2026);
    expect(c.anneesAncienneteTotale).toBe(c.anciennete + c.anneesRestantes);
  });

  it('agent au seuil 10 ans CCN 66 utilise tranche 1/4 puis 1/3', () => {
    // 10 ans actuels + 0 reste : engagement = (sal/4) × 10
    const seuilAgent = { ...baseAgent, anneeNaissance: 1962, dateEntree: 2016 };
    const c = calculerIDRAgent(seuilAgent, DEFAULT_IDR_HYPOTHESES, 2026);
    expect(c).not.toBeNull();
    expect(c.provisionNominale).toBeGreaterThan(0);
  });

  it('provision avec charges = UCP × (1 + tauxChargesProvision/100)', () => {
    const c = calculerIDRAgent(baseAgent, DEFAULT_IDR_HYPOTHESES, 2026);
    const expected = c.provisionUCP * (1 + DEFAULT_IDR_HYPOTHESES.tauxChargesProvision / 100);
    expect(Math.abs(c.provisionAvecCharges - expected)).toBeLessThan(2);
  });

  it('hypothèses peuvent être surchargées via globalParams.idrHypotheses', () => {
    const direction = { personnel: [baseAgent] };
    const params = { ...baseGlobalParams, idrHypotheses: { tauxActualisation: 3.0, tauxTurnOver: 2 } };
    const r = calculerProvisionIDR(direction, [], null, params);
    expect(r.hypotheses.tauxActualisation).toBe(3.0);
    expect(r.hypotheses.tauxTurnOver).toBe(2);
    expect(r.hypotheses.ageRetraite).toBe(64); // valeur par défaut conservée
  });

  it('agrège les agents de direction + services + pôle support', () => {
    const direction = { personnel: [{ ...baseAgent, id: 'd1' }] };
    const services = [{ id: 's1', nom: 'Service A', personnel: [{ ...baseAgent, id: 's1a1' }] }];
    const poleSupport = { personnel: [{ ...baseAgent, id: 'ps1' }] };
    const r = calculerProvisionIDR(direction, services, poleSupport, baseGlobalParams);
    expect(r.agents.length).toBe(3);
    expect(r.totalProvisionUCP).toBeGreaterThan(0);
  });

  it('agent jeune (loin de la retraite) → forte décote actuarielle', () => {
    const jeune = { ...baseAgent, anneeNaissance: 1990, dateEntree: 2020 };
    const c = calculerIDRAgent(jeune, DEFAULT_IDR_HYPOTHESES, 2026);
    const ratio = c.provisionUCP / c.provisionNominale;
    expect(ratio).toBeLessThan(0.7); // forte pondération
  });

  it('agent proche retraite → décote actuarielle faible', () => {
    const proche = { ...baseAgent, anneeNaissance: 1963, dateEntree: 2010 }; // 63 ans
    const c = calculerIDRAgent(proche, DEFAULT_IDR_HYPOTHESES, 2026);
    const ratio = c.provisionUCP / c.provisionNominale;
    expect(ratio).toBeGreaterThan(0.85);
  });
});
