import { describe, it, expect } from 'vitest';
import {
  valoriserFonds, calculerSyntheseFondsDedies,
  CATEGORIES_FONDS_DEDIES, recommendationFonds,
} from '../fondsDedies';

describe('Moteur de Fonds Dédiés — CRC 2018-06', () => {
  it('valoriserFonds calcule ressources = initial + report', () => {
    const v = valoriserFonds({ montantInitial: 50000, reportAnneePrecedente: 10000, consommeAnneeCourante: 0 });
    expect(v.ressources).toBe(60000);
    expect(v.solde).toBe(60000);
  });

  it('solde = ressources − consommé', () => {
    const v = valoriserFonds({ montantInitial: 50000, consommeAnneeCourante: 30000 });
    expect(v.solde).toBe(20000);
  });

  it('tauxConsommation calculé correctement (capé à 1)', () => {
    const v1 = valoriserFonds({ montantInitial: 100000, consommeAnneeCourante: 30000 });
    expect(v1.tauxConsommation).toBe(0.3);
    // Au-delà de 100% (anomalie de saisie), on cape
    const v2 = valoriserFonds({ montantInitial: 100000, consommeAnneeCourante: 150000 });
    expect(v2.tauxConsommation).toBe(1);
  });

  it('statut "solde" si solde proche zéro', () => {
    const v = valoriserFonds({ montantInitial: 10000, consommeAnneeCourante: 10000 });
    expect(v.statut).toBe('solde');
  });

  it('statut "echu" si dateEcheance passée', () => {
    const v = valoriserFonds({
      montantInitial: 10000, consommeAnneeCourante: 5000,
      dateEcheance: '2020-01-01',
    });
    expect(v.statut).toBe('echu');
  });

  it('statut "actif" si solde > 0 et échéance future', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const v = valoriserFonds({
      montantInitial: 10000, consommeAnneeCourante: 3000,
      dateEcheance: future.toISOString().slice(0, 10),
    });
    expect(v.statut).toBe('actif');
  });

  it('alerte true si échéance dans <60 jours et solde > 0', () => {
    const proche = new Date();
    proche.setDate(proche.getDate() + 30);
    const v = valoriserFonds({
      montantInitial: 10000, consommeAnneeCourante: 5000,
      dateEcheance: proche.toISOString().slice(0, 10),
    });
    expect(v.alerte).toBe(true);
    expect(v.joursAvantEcheance).toBeLessThanOrEqual(60);
  });

  it('alerte false si solde proche zéro même avec échéance proche', () => {
    const proche = new Date();
    proche.setDate(proche.getDate() + 10);
    const v = valoriserFonds({
      montantInitial: 10000, consommeAnneeCourante: 10000,
      dateEcheance: proche.toISOString().slice(0, 10),
    });
    expect(v.alerte).toBe(false);
  });

  it('synthèse vide retourne tous les totaux à 0', () => {
    const s = calculerSyntheseFondsDedies([]);
    expect(s.totalRessources).toBe(0);
    expect(s.totalConsomme).toBe(0);
    expect(s.totalSolde).toBe(0);
    expect(s.reportN1).toBe(0);
    expect(s.alertes).toEqual([]);
  });

  it('totaux consolidés sur plusieurs fonds', () => {
    const fonds = [
      { id: '1', montantInitial: 50000, consommeAnneeCourante: 30000 },
      { id: '2', montantInitial: 30000, consommeAnneeCourante: 10000 },
      { id: '3', montantInitial: 10000, reportAnneePrecedente: 5000, consommeAnneeCourante: 15000 },
    ];
    const s = calculerSyntheseFondsDedies(fonds);
    expect(s.totalRessources).toBe(50000 + 30000 + 10000 + 5000); // 95000
    expect(s.totalConsomme).toBe(30000 + 10000 + 15000); // 55000
    expect(s.totalSolde).toBe(95000 - 55000); // 40000
  });

  it('reportN1 = somme des soldes des fonds actifs uniquement', () => {
    const future = new Date(); future.setFullYear(future.getFullYear() + 1);
    const futureStr = future.toISOString().slice(0, 10);
    const fonds = [
      { id: '1', montantInitial: 50000, consommeAnneeCourante: 30000, dateEcheance: futureStr },  // actif, solde 20000
      { id: '2', montantInitial: 10000, consommeAnneeCourante: 10000 },                            // solde
      { id: '3', montantInitial: 5000, consommeAnneeCourante: 0, dateEcheance: '2020-01-01' },     // echu
    ];
    const s = calculerSyntheseFondsDedies(fonds);
    expect(s.reportN1).toBe(20000); // seul le fonds actif
  });

  it('compte 78 = somme des reports N-1 (réintégration en produits)', () => {
    const fonds = [
      { id: '1', montantInitial: 0, reportAnneePrecedente: 8000, consommeAnneeCourante: 5000 },
      { id: '2', montantInitial: 10000, reportAnneePrecedente: 2000, consommeAnneeCourante: 6000 },
    ];
    const s = calculerSyntheseFondsDedies(fonds);
    expect(s.compte78).toBe(10000); // 8000 + 2000
  });

  it('ventilation par catégorie comptable (194 / 195 / 197)', () => {
    const fonds = [
      { id: '1', montantInitial: 50000, consommeAnneeCourante: 20000, categorie: 'subvention_fonctionnement' },
      { id: '2', montantInitial: 10000, consommeAnneeCourante: 0, categorie: 'generosite_public' },
      { id: '3', montantInitial: 5000, consommeAnneeCourante: 0, categorie: 'legs_donations' },
    ];
    const s = calculerSyntheseFondsDedies(fonds);
    expect(s.parCategorie.subvention_fonctionnement.compte).toBe('194');
    expect(s.parCategorie.subvention_fonctionnement.total).toBe(30000); // 50000 - 20000
    expect(s.parCategorie.generosite_public.compte).toBe('195');
    expect(s.parCategorie.legs_donations.compte).toBe('197');
  });

  it('compteur statuts (actifs, echu, solde)', () => {
    const future = new Date(); future.setFullYear(future.getFullYear() + 1);
    const futureStr = future.toISOString().slice(0, 10);
    const fonds = [
      { id: '1', montantInitial: 50000, consommeAnneeCourante: 30000, dateEcheance: futureStr },  // actif
      { id: '2', montantInitial: 10000, consommeAnneeCourante: 10000 },                            // solde
      { id: '3', montantInitial: 5000, consommeAnneeCourante: 0, dateEcheance: '2020-01-01' },     // echu
    ];
    const s = calculerSyntheseFondsDedies(fonds);
    expect(s.nbActifs).toBe(1);
    expect(s.nbSolde).toBe(1);
    expect(s.nbEchu).toBe(1);
  });

  it('CATEGORIES_FONDS_DEDIES expose 3 comptes 19X', () => {
    expect(CATEGORIES_FONDS_DEDIES.length).toBe(3);
    const comptes = CATEGORIES_FONDS_DEDIES.map(c => c.compte);
    expect(comptes).toContain('194');
    expect(comptes).toContain('195');
    expect(comptes).toContain('197');
  });

  it('recommandation adaptée au statut', () => {
    expect(recommendationFonds({ statut: 'solde' })).toMatch(/intégralement consommé/);
    expect(recommendationFonds({ statut: 'echu', solde: 5000 })).toMatch(/échéance dépassée/i);
    expect(recommendationFonds({ statut: 'actif', alerte: true, joursAvantEcheance: 30 })).toMatch(/Échéance proche/);
    expect(recommendationFonds({ statut: 'actif', tauxConsommation: 0.1 })).toMatch(/Sous-consommation/);
    expect(recommendationFonds({ statut: 'actif', tauxConsommation: 0.6 })).toMatch(/consommation normale/);
  });

  it('robustesse aux valeurs invalides (null, NaN)', () => {
    const s = calculerSyntheseFondsDedies([
      { id: '1', montantInitial: null, consommeAnneeCourante: 'abc' },
      null,
      { id: '3' },
    ]);
    expect(s.totalRessources).toBe(0);
    expect(s.fonds.length).toBe(3);
  });
});
