import { describe, it, expect } from 'vitest';
import { calculerTableauFinancement } from '../tableauFinancement';

const dir = {
  personnel: [{ id: 'p1', titre: 'Dir', salaire: 4500, etp: 1, segur: false }],
  recettes: [{ id: 'r1', nom: 'Subv', montant: 5000 }],
  chargesSiege: [{ id: 'c1', nom: 'Loyer', montant: 1500 }],
  investissements: {
    bienImmo: { montant: 100000, duree: 20, ageAns: 0, financementEmprunt: 60, dureePret: 15 },
  },
};

const baseParams = {
  anneeExercice: 2026,
  augmentationAnnuelle: 0, tauxGVT: 0,
  inflationEnergie: 0, inflationLoyers: 0, inflationAutres: 0,
  delaiPaiementClients: 30, delaiPaiementFournisseurs: 30, delaiPaiementURSSAF: 45,
  montantSegurETP: 238, seuilCouverture: 90, coefficientBP: 100,
  provisions: [],
};

describe('tableauFinancement — PCG 532-7', () => {
  it('produit la structure attendue (ressources, emplois, variations)', () => {
    const t = calculerTableauFinancement(dir, [], null, baseParams);
    expect(t).toHaveProperty('ressources');
    expect(t).toHaveProperty('emplois');
    expect(t).toHaveProperty('variationFRNG');
    expect(t).toHaveProperty('variationBFR');
    expect(t).toHaveProperty('variationTresorerie');
  });

  it('CAF = résultat + dotations amortissements + dotations provisions', () => {
    const t = calculerTableauFinancement(dir, [], null, baseParams);
    const calcul = t.detail.caf.resultat + t.detail.caf.dotAmortissements + t.detail.caf.dotProvisions;
    expect(t.ressources.caf).toBeCloseTo(calcul, 1);
  });

  it('investissements acquis ne comptent que les actifs ageAns=0', () => {
    const t = calculerTableauFinancement(dir, [], null, baseParams);
    // Notre dir a 1 immo de 100k€ avec ageAns=0
    expect(t.emplois.investissementsAcquis).toBeCloseTo(100000, 1);
  });

  it('emprunts nouveaux = somme(montant × % financement) sur immos ageAns=0', () => {
    const t = calculerTableauFinancement(dir, [], null, baseParams);
    expect(t.ressources.empruntsNouveaux).toBeCloseTo(60000, 1); // 100k × 60 %
  });

  it('remboursements capital = capital emprunté / durée prêt (linéaire)', () => {
    const t = calculerTableauFinancement(dir, [], null, baseParams);
    expect(t.emplois.remboursementsCapital).toBeCloseTo(60000 / 15, 1);
  });

  it('variation FRNG = ressources − emplois', () => {
    const t = calculerTableauFinancement(dir, [], null, baseParams);
    expect(t.variationFRNG).toBeCloseTo(t.ressources.totalRessources - t.emplois.totalEmplois, 1);
  });

  it('variation trésorerie = ΔFRNG − ΔBFR', () => {
    const t = calculerTableauFinancement(dir, [], null, baseParams);
    expect(t.variationTresorerie).toBeCloseTo(t.variationFRNG - t.variationBFR, 1);
  });

  it('subventions d\'investissement et cessions remontent depuis globalParams', () => {
    const params = { ...baseParams, subventionsInvestissementAnnuelles: 25000, cessionsImmoAnnuelles: 8000 };
    const t = calculerTableauFinancement(dir, [], null, params);
    expect(t.ressources.subventionsInvestissement).toBe(25000);
    expect(t.ressources.cessionsImmo).toBe(8000);
  });

  it('total ressources inclut CAF + emprunts + subv invest + cessions', () => {
    const params = { ...baseParams, subventionsInvestissementAnnuelles: 5000 };
    const t = calculerTableauFinancement(dir, [], null, params);
    const expected = t.ressources.caf + t.ressources.empruntsNouveaux + 5000 + t.ressources.cessionsImmo;
    expect(t.ressources.totalRessources).toBeCloseTo(expected, 1);
  });
});
