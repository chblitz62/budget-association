import { describe, it, expect } from 'vitest';
import { calculerCompteResultat } from '../compteResultat';

const minimalDirection = {
  personnel: [
    { id: 'p1', titre: 'Directeur', salaire: 4500, etp: 1, segur: false, anneeNaissance: 1975, dateEntree: 2010 },
  ],
  recettes: [
    { id: 'r1', nom: 'Subvention Région', montant: 2000 },
    { id: 'r2', nom: 'Droits d\'inscription FC', montant: 1500 },
  ],
  chargesSiege: [{ id: 'c1', nom: 'Loyer', montant: 1500 }],
  investissements: {},
};

const baseGlobalParams = {
  anneeExercice: 2026,
  augmentationAnnuelle: 0,
  tauxGVT: 0,
  inflationEnergie: 0,
  inflationLoyers: 0,
  inflationAutres: 0,
  delaiPaiementClients: 30,
  delaiPaiementFournisseurs: 30,
  delaiPaiementURSSAF: 45,
  montantSegurETP: 238,
  seuilCouverture: 90,
  coefficientBP: 100,
  provisions: [],
};

describe('compteResultat — PCG associatif (CRC 99-01)', () => {
  it('produit la structure attendue (charges, produits, totaux)', () => {
    const cr = calculerCompteResultat(minimalDirection, [], null, baseGlobalParams);
    expect(cr).toHaveProperty('charges');
    expect(cr).toHaveProperty('produits');
    expect(cr).toHaveProperty('totaux');
    expect(cr.annee).toBe(2026);
  });

  it('décompose les salaires en rémunérations brutes (compte 64) + charges sociales', () => {
    const cr = calculerCompteResultat(minimalDirection, [], null, baseGlobalParams);
    const remunerations = cr.charges.find(c => /Rémunérations brutes/.test(c.libelle));
    const cs = cr.charges.find(c => /Charges sociales/.test(c.libelle));
    expect(remunerations).toBeDefined();
    expect(cs).toBeDefined();
    expect(remunerations.code).toBe('64');
    expect(cs.code).toBe('64');
  });

  it('classifie les subventions en compte 74', () => {
    const cr = calculerCompteResultat(minimalDirection, [], null, baseGlobalParams);
    const subv = cr.produits.find(p => p.code === '74');
    expect(subv).toBeDefined();
    expect(subv.montant).toBeGreaterThan(0);
  });

  it('résultat net = produits − charges (cohérence comptable)', () => {
    const cr = calculerCompteResultat(minimalDirection, [], null, baseGlobalParams);
    const ecart = (cr.totaux.totalProduits - cr.totaux.totalCharges) - cr.totaux.resultatNet;
    expect(Math.abs(ecart)).toBeLessThan(1);
  });

  it('résultat exploitation + financier = résultat courant', () => {
    const cr = calculerCompteResultat(minimalDirection, [], null, baseGlobalParams);
    const calcule = cr.totaux.resultatExploitation + cr.totaux.resultatFinancier;
    expect(Math.abs(calcule - cr.totaux.resultatCourant)).toBeLessThan(0.01);
  });

  it('utilise les codes PCG normés (classe 6 pour charges, classe 7 pour produits)', () => {
    const cr = calculerCompteResultat(minimalDirection, [], null, baseGlobalParams);
    cr.charges.forEach(c => {
      // codes à 2 chiffres (60-68) ou sous-comptes (689)
      expect(c.code).toMatch(/^6\d{1,2}$/);
    });
    cr.produits.forEach(p => {
      expect(p.code).toMatch(/^7\d{1,2}$/);
    });
  });
});
