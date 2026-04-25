import { describe, it, expect } from 'vitest';
import { calculerSyntheseTVA, TAUX_TVA_USUELS } from '../tvaMultiTaux';

const baseParams = { coefficientBP: 100, tauxTVAMoyen: 20 };

describe('tvaMultiTaux — multi-taux différenciée', () => {
  it('expose 4 taux usuels (0, 5.5, 10, 20)', () => {
    expect(TAUX_TVA_USUELS.map(t => t.taux)).toEqual([0, 5.5, 10, 20]);
  });

  it('association 100 % FC exonérée → coefficient déduction = 0, aucune TVA déductible', () => {
    const dir = {
      recettes: [{ nom: 'OPCO', montant: 1000, tauxTVA: 0, tvaCollectee: false }],
      chargesSiege: [{ nom: 'Loyer', montant: 500, tauxTVA: 20, saisieType: 'HT', tvaRecuperable: true }],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    expect(r.coefficientDeduction).toBe(0);
    expect(r.totalTVADeductible).toBe(0);
  });

  it('100 % activité 20 % → coefficient déduction = 1, TVA déductible intégrale', () => {
    const dir = {
      recettes: [{ nom: 'Prestation', montant: 1000, tauxTVA: 20 }],
      chargesSiege: [{ nom: 'Loyer', montant: 500, tauxTVA: 20, saisieType: 'HT' }],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    expect(r.coefficientDeduction).toBeCloseTo(1, 3);
    // Charge HT 500/mois × 12 = 6000 ; TVA 20 % = 1200 (entièrement déductible)
    expect(r.totalTVADeductible).toBeCloseTo(1200, 1);
  });

  it('mixte 50/50 → coefficient déduction = 0,5', () => {
    const dir = {
      recettes: [
        { nom: 'OPCO exonéré', montant: 1000, tauxTVA: 0 },
        { nom: 'Prestation 20 %', montant: 1000, tauxTVA: 20 },
      ],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    expect(r.coefficientDeduction).toBeCloseTo(0.5, 3);
  });

  it('TVA collectée par taux : 1000 €/mois × 12 × 5,5 % = 660 €', () => {
    const dir = {
      recettes: [{ nom: 'Vente livre', montant: 1000, tauxTVA: 5.5 }],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    const entry = r.parTaux.find(e => e.taux === 5.5);
    expect(entry.tvaCollectee).toBeCloseTo(660, 1);
  });

  it('saisieType TTC convertit correctement en HT', () => {
    const dir = {
      recettes: [{ nom: 'P1', montant: 1000, tauxTVA: 20 }],
      chargesSiege: [{ nom: 'C1', montant: 1200, tauxTVA: 20, saisieType: 'TTC', tvaRecuperable: true }],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    // 1200 TTC → 1000 HT, 200 TVA, ×12 mois = 2400 TVA déductible
    expect(r.totalTVADeductible).toBeCloseTo(2400, 1);
  });

  it('charge avec tvaRecuperable=false n\'apparaît pas en déductible', () => {
    const dir = {
      recettes: [{ nom: 'P1', montant: 1000, tauxTVA: 20 }],
      chargesSiege: [{ nom: 'Frais', montant: 500, tauxTVA: 20, saisieType: 'HT', tvaRecuperable: false }],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    expect(r.totalTVADeductible).toBe(0);
  });

  it('solde = collectée − déductible ; statut "aReverser" si > 0', () => {
    const dir = {
      recettes: [{ nom: 'P1', montant: 5000, tauxTVA: 20 }],
      chargesSiege: [{ nom: 'C1', montant: 100, tauxTVA: 20, saisieType: 'HT', tvaRecuperable: true }],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    expect(r.statut).toBe('aReverser');
    expect(r.soldeTVA).toBeCloseTo(r.totalTVACollectee - r.totalTVADeductible, 1);
  });

  it('crédit de TVA si déductible > collectée', () => {
    const dir = {
      recettes: [{ nom: 'P1', montant: 100, tauxTVA: 20 }],
      chargesSiege: [{ nom: 'C1', montant: 5000, tauxTVA: 20, saisieType: 'HT', tvaRecuperable: true }],
    };
    const r = calculerSyntheseTVA(dir, [], null, baseParams);
    expect(r.statut).toBe('creditTVA');
    expect(r.soldeTVA).toBeLessThan(0);
  });

  it('agrège les recettes/charges de direction + services + pôle support', () => {
    const dir = { recettes: [{ nom: 'A', montant: 100, tauxTVA: 20 }] };
    const ps = { recettes: [{ nom: 'B', montant: 100, tauxTVA: 10 }] };
    const svcs = [{ id: 's1', nom: 'X', recettes: [{ nom: 'C', montant: 100, tauxTVA: 5.5 }] }];
    const r = calculerSyntheseTVA(dir, svcs, ps, baseParams);
    expect(r.parTaux.find(t => t.taux === 20).recettesHT).toBeCloseTo(1200, 1);
    expect(r.parTaux.find(t => t.taux === 10).recettesHT).toBeCloseTo(1200, 1);
    expect(r.parTaux.find(t => t.taux === 5.5).recettesHT).toBeCloseTo(1200, 1);
  });
});
