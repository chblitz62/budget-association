import { describe, it, expect, beforeEach } from 'vitest';
import {
  chargerHistorique, sauvegarderHistorique,
  ajouterEntreeHistorique, valeurALaDate, detecterIncoherences,
  CONSTANTES_VERSIONNABLES,
} from '../constantsVersionRegistry';

describe('constantsVersionRegistry — versionnement fiscal/social', () => {
  beforeEach(() => { localStorage.clear(); });

  it('expose les constantes versionnables clés', () => {
    expect(CONSTANTES_VERSIONNABLES.CHARGES_PATRONALES).toBeDefined();
    expect(CONSTANTES_VERSIONNABLES.SMIC_MENSUEL).toBeDefined();
    expect(CONSTANTES_VERSIONNABLES.PRIME_SEGUR).toBeDefined();
    expect(CONSTANTES_VERSIONNABLES.TAUX_TAXE_SALAIRES).toBeDefined();
  });

  it('chargerHistorique retourne les entrées par défaut quand storage vide', () => {
    const h = chargerHistorique();
    expect(h.CHARGES_PATRONALES.length).toBeGreaterThan(0);
    expect(h.SMIC_MENSUEL.length).toBeGreaterThan(0);
  });

  it('historique trié chronologiquement', () => {
    const h = chargerHistorique();
    const dates = h.SMIC_MENSUEL.map(e => e.dateApplication);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it('valeurALaDate retourne le SMIC en vigueur à une date', () => {
    const h = chargerHistorique();
    const e1 = valeurALaDate(h, 'SMIC_MENSUEL', '2024-06-15');
    expect(e1.valeur).toBe(1709.28); // SMIC janv. 2024
    const e2 = valeurALaDate(h, 'SMIC_MENSUEL', '2024-12-15');
    expect(e2.valeur).toBe(1766.92); // SMIC nov. 2024
    const e3 = valeurALaDate(h, 'SMIC_MENSUEL', '2026-04-25');
    expect(e3.valeur).toBe(1841.45); // SMIC nov. 2025
  });

  it('valeurALaDate retourne la première entrée si date antérieure à toute application', () => {
    const h = chargerHistorique();
    const e = valeurALaDate(h, 'SMIC_MENSUEL', '2000-01-01');
    expect(e).toBeDefined();
  });

  it('ajouterEntreeHistorique insère une entrée et trie', () => {
    let h = chargerHistorique();
    h = ajouterEntreeHistorique(h, 'CHARGES_PATRONALES', {
      valeur: 0.45, dateApplication: '2027-01-01',
      source: 'CCN 66 Avenant 2027', justification: 'Hausse prévoyance',
    });
    const last = h.CHARGES_PATRONALES.slice(-1)[0];
    expect(last.valeur).toBe(0.45);
    expect(last.dateApplication).toBe('2027-01-01');
  });

  it('sauvegarder + recharger conserve les entrées custom', () => {
    let h = chargerHistorique();
    h = ajouterEntreeHistorique(h, 'PRIME_SEGUR', {
      valeur: 250, dateApplication: '2027-01-01',
      source: 'Test', justification: 'Test',
    });
    sauvegarderHistorique(h);
    const reloaded = chargerHistorique();
    const found = reloaded.PRIME_SEGUR.find(e => e.dateApplication === '2027-01-01');
    expect(found?.valeur).toBe(250);
  });

  it('sauvegarderHistorique ne stocke pas les entrées par défaut (dédup)', () => {
    const h = chargerHistorique();
    sauvegarderHistorique(h);
    const stored = JSON.parse(localStorage.getItem('assoc_constants_history') || '{}');
    // Aucune entrée custom ajoutée → stored peut être vide
    expect(Object.keys(stored).length).toBe(0);
  });

  it('detecterIncoherences renvoie [] quand valeurs courantes alignées sur dernière entrée', () => {
    const h = chargerHistorique();
    const inco = detecterIncoherences(h);
    // SMIC_MENSUEL constants.js = 1841.45 et dernière entrée historique = 1841.45 → cohérent
    expect(inco.find(i => i.constante === 'SMIC_MENSUEL')).toBeUndefined();
  });

  it('detecterIncoherences signale une divergence si dernière entrée diffère de la constante code', () => {
    let h = chargerHistorique();
    h = ajouterEntreeHistorique(h, 'CHARGES_PATRONALES', {
      valeur: 0.50, dateApplication: '2027-01-01',
      source: 'Test', justification: 'Divergence',
    });
    const inco = detecterIncoherences(h);
    const cp = inco.find(i => i.constante === 'CHARGES_PATRONALES');
    expect(cp).toBeDefined();
    expect(cp.valeurHistorique).toBe(0.50);
  });

  it('formatValeur affiche correctement les pourcentages et les € ', () => {
    expect(CONSTANTES_VERSIONNABLES.CHARGES_PATRONALES.formatValeur(0.44)).toBe('44.00 %');
    expect(CONSTANTES_VERSIONNABLES.PRIME_SEGUR.formatValeur(238)).toBe('238 €/ETP/mois');
    expect(CONSTANTES_VERSIONNABLES.SMIC_MENSUEL.formatValeur(1841.45)).toBe('1841.45 €');
  });

  it('parseValeur convertit "44 %" → 0.44', () => {
    expect(CONSTANTES_VERSIONNABLES.CHARGES_PATRONALES.parseValeur('44 %')).toBe(0.44);
    expect(CONSTANTES_VERSIONNABLES.CHARGES_PATRONALES.parseValeur('44,5%')).toBeCloseTo(0.445, 4);
  });
});
