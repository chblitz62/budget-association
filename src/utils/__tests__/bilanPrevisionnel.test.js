import { describe, it, expect } from 'vitest';
import { calculerBilanPrevisionnel } from '../bilanPrevisionnel';

const minimalDirection = {
  personnel: [
    { id: 'p1', titre: 'Directeur', salaire: 4500, etp: 1, segur: false },
  ],
  recettes: [
    { id: 'r1', nom: 'Subvention Région', montant: 5000 },
  ],
  chargesSiege: [{ id: 'c1', nom: 'Loyer', montant: 1500 }],
  investissements: {
    bienImmo: { montant: 100000, duree: 20, ageAns: 0 },
  },
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
  fondRoulement: [
    { id: 'reserves', nom: 'Réserves', montant: 50000 },
  ],
};

describe('bilanPrevisionnel — équilibre actif/passif', () => {
  it('produit la structure attendue (actif, passif, equilibre)', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    expect(b).toHaveProperty('actif');
    expect(b).toHaveProperty('passif');
    expect(b).toHaveProperty('equilibre');
    expect(b.annee).toBe(2026);
  });

  it('le bilan est équilibré (Actif = Passif, tolérance 1 €)', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    expect(b.equilibre.valide).toBe(true);
    expect(Math.abs(b.equilibre.ecart)).toBeLessThan(1);
  });

  it('immobilisations nettes = brutes − amortissements cumulés', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    expect(b.actif.immobilisationsNettes).toBeCloseTo(
      b.actif.immobilisationsBrutes - b.actif.amortissementsCumules, 1
    );
  });

  it('total capitaux propres = manuels + résultat de l\'exercice', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    expect(b.passif.totalCapitauxPropres).toBeCloseTo(
      b.passif.capitauxPropresManuels + b.passif.resultatExercice, 1
    );
  });

  it('disponibilités OU découvert (jamais les deux)', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    expect(b.actif.disponibilites > 0 ? b.passif.decouvert === 0 : true).toBe(true);
    expect(b.passif.decouvert > 0 ? b.actif.disponibilites === 0 : true).toBe(true);
  });

  it('total actif = immo nettes + stocks + créances + disponibilités', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    const sum = b.actif.immobilisationsNettes + b.actif.stocks + b.actif.creancesClients + b.actif.disponibilites;
    expect(b.actif.totalActif).toBeCloseTo(sum, 1);
  });

  it('total passif = capitaux propres + provisions + dettes + découvert', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    const sum = b.passif.totalCapitauxPropres + b.passif.provisions
              + b.passif.dettesFinancieres + b.passif.dettesFournisseurs
              + b.passif.dettesURSSAF + b.passif.decouvert;
    expect(b.passif.totalPassif).toBeCloseTo(sum, 1);
  });

  it('réserves manuelles = saisies dans globalParams.fondRoulement', () => {
    const b = calculerBilanPrevisionnel(minimalDirection, [], null, baseGlobalParams);
    expect(b.passif.capitauxPropresManuels).toBe(50000);
  });
});
