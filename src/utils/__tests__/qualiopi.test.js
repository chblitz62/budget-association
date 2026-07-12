import { describe, it, expect } from 'vitest';
import {
  calculerIndicateursQualiopi,
  recommendationIndicateur,
  recommendationQualiopi,
  SEUILS_QUALIOPI_DEFAUT,
  CODES_QUALIOPI,
} from '../qualiopi';

const makeAbandons = (overrides = {}) => ({
  janvier: 0, fevrier: 0, mars: 0, avril: 0, mai: 0, juin: 0,
  juillet: 0, aout: 0, septembre: 0, octobre: 0, novembre: 0, decembre: 0,
  ...overrides,
});

// ─── Fixtures réutilisables ───────────────────────────────────────────
const makePromo = (overrides = {}) => ({
  id: 'p1', nom: 'Promo', effectifInitial: 20, abandons: makeAbandons(),
  tauxInsertion6Mois: null,
  tauxObtentionCertif: null,
  tauxSatisfactionStagiaires: null,
  tauxSatisfactionFinanceurs: null,
  ...overrides,
});

const makeServiceWithPromos = (promos) => ({
  id: 's1', nom: 'BPJEPS',
  promos: { arras: promos },
});

describe('Indicateurs Qualiopi RNQ — Axe 10', () => {
  describe('Constantes exposées', () => {
    it('expose les 5 codes RNQ ciblés', () => {
      expect(CODES_QUALIOPI).toEqual(['I-9', 'I-23', 'I-24', 'I-30', 'I-31']);
    });

    it('définit le sens correct par indicateur', () => {
      expect(SEUILS_QUALIOPI_DEFAUT['I-9'].sens).toBe('min');     // abandon : un taux élevé est mauvais
      expect(SEUILS_QUALIOPI_DEFAUT['I-23'].sens).toBe('plus');   // insertion : un taux élevé est bon
      expect(SEUILS_QUALIOPI_DEFAUT['I-24'].sens).toBe('plus');
      expect(SEUILS_QUALIOPI_DEFAUT['I-30'].sens).toBe('plus');
      expect(SEUILS_QUALIOPI_DEFAUT['I-31'].sens).toBe('plus');
    });
  });

  describe('I-9 — taux d\'abandon (réutilise suiviPromos)', () => {
    it('calcule un taux d\'abandon pondéré par effectif', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', effectifInitial: 20, abandons: makeAbandons({ octobre: 2 }) }), // 10 %
        makePromo({ id: 'p2', effectifInitial: 30, abandons: makeAbandons({ novembre: 9 }) }), // 30 %
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      // 11 abandons sur 50 = 22 %
      expect(r.indicateurs['I-9'].valeurGlobale).toBeCloseTo(22, 1);
      expect(r.indicateurs['I-9'].niveau).toBe('danger'); // ≥ 20 %
    });

    it('niveau success si abandon < 10 %', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', effectifInitial: 50, abandons: makeAbandons({ octobre: 2 }) }), // 4 %
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-9'].niveau).toBe('success');
    });

    it('niveau warning entre 10 % et 20 %', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', effectifInitial: 20, abandons: makeAbandons({ octobre: 3 }) }), // 15 %
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-9'].niveau).toBe('warning');
    });

    it('niveau neutral si aucune promo (effectif initial = 0)', () => {
      const r = calculerIndicateursQualiopi([{ id: 's1', nom: 'X', promos: {} }], {});
      expect(r.indicateurs['I-9'].niveau).toBe('neutral');
      expect(r.indicateurs['I-9'].valeurGlobale).toBeNull();
    });
  });

  describe('I-23 / I-24 / I-30 / I-31 — indicateurs saisis', () => {
    it('agrège la satisfaction stagiaires pondérée par effectif actuel', () => {
      const services = [makeServiceWithPromos([
        // 18 stagiaires actuels (20 - 2 ab) × 90 %
        makePromo({ id: 'p1', effectifInitial: 20, abandons: makeAbandons({ octobre: 2 }), tauxSatisfactionStagiaires: 90 }),
        // 30 × 70 %
        makePromo({ id: 'p2', effectifInitial: 30, tauxSatisfactionStagiaires: 70 }),
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      // (18*90 + 30*70) / (18+30) = (1620 + 2100)/48 = 77.5
      expect(r.indicateurs['I-30'].valeurGlobale).toBeCloseTo(77.5, 1);
      expect(r.indicateurs['I-30'].niveau).toBe('warning'); // 60-80
    });

    it('niveau success quand le taux est ≥ warning seuil (sens plus)', () => {
      const services = [makeServiceWithPromos([
        makePromo({ tauxObtentionCertif: 85 }), // ≥ 80
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-24'].niveau).toBe('success');
    });

    it('niveau danger quand le taux est < danger seuil (sens plus)', () => {
      const services = [makeServiceWithPromos([
        makePromo({ tauxInsertion6Mois: 40 }), // < 50
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-23'].niveau).toBe('danger');
    });

    it('niveau neutral si aucune promo n\'a la donnée renseignée', () => {
      const services = [makeServiceWithPromos([
        makePromo({}), // tous null
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-30'].valeurGlobale).toBeNull();
      expect(r.indicateurs['I-30'].niveau).toBe('neutral');
      expect(r.indicateurs['I-30'].nbPromosRenseignees).toBe(0);
    });

    it('ignore les valeurs nulles dans la moyenne pondérée', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', effectifInitial: 10, tauxSatisfactionFinanceurs: 80 }),
        makePromo({ id: 'p2', effectifInitial: 10, tauxSatisfactionFinanceurs: null }), // ignorée
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-31'].valeurGlobale).toBe(80);
      expect(r.indicateurs['I-31'].nbPromosRenseignees).toBe(1);
    });

    it('utilise une moyenne arithmétique si tous les effectifs sont nuls', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', effectifInitial: 5, abandons: makeAbandons({ octobre: 5 }), tauxSatisfactionStagiaires: 80 }),
        makePromo({ id: 'p2', effectifInitial: 8, abandons: makeAbandons({ novembre: 8 }), tauxSatisfactionStagiaires: 60 }),
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      // effectifs actuels = 0 partout → fallback moyenne arithmétique
      expect(r.indicateurs['I-30'].valeurGlobale).toBe(70);
    });
  });

  describe('Seuils configurables', () => {
    it('respecte un seuil personnalisé via globalParams.seuilsQualiopi', () => {
      const services = [makeServiceWithPromos([
        makePromo({ tauxInsertion6Mois: 75 }),
      ])];
      const r = calculerIndicateursQualiopi(services, {
        seuilsQualiopi: { 'I-23': { warning: 90, danger: 80 } },
      });
      // 75 < 80 → danger
      expect(r.indicateurs['I-23'].niveau).toBe('danger');
    });

    it('garde-fou : pour sens "plus" warning ne peut pas être < danger', () => {
      const services = [makeServiceWithPromos([makePromo({ tauxInsertion6Mois: 60 })])];
      const r = calculerIndicateursQualiopi(services, {
        seuilsQualiopi: { 'I-23': { warning: 50, danger: 80 } }, // incohérent
      });
      // Le warning est rehaussé à danger=80 → 60 < 80 → danger
      expect(r.indicateurs['I-23'].seuils.warning).toBe(80);
    });

    it('garde-fou : pour sens "min" danger ne peut pas être < warning', () => {
      const services = [makeServiceWithPromos([
        makePromo({ effectifInitial: 20, abandons: makeAbandons({ octobre: 3 }) }), // 15 %
      ])];
      const r = calculerIndicateursQualiopi(services, {
        seuilsQualiopi: { 'I-9': { warning: 25, danger: 10 } }, // incohérent
      });
      expect(r.indicateurs['I-9'].seuils.danger).toBe(25);
    });
  });

  describe('Structure agrégée', () => {
    it('compte conformes / à surveiller / non conformes / sans données', () => {
      const services = [makeServiceWithPromos([
        makePromo({
          effectifInitial: 20, abandons: makeAbandons({ octobre: 1 }), // 5 % → I-9 success
          tauxInsertion6Mois: 75,        // success (≥70)
          tauxObtentionCertif: 70,       // warning (60-80)
          tauxSatisfactionStagiaires: 50, // danger (<60)
          tauxSatisfactionFinanceurs: null, // neutral
        }),
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.totaux.nbConformes).toBe(2);
      expect(r.totaux.nbASurveiller).toBe(1);
      expect(r.totaux.nbNonConformes).toBe(1);
      expect(r.totaux.nbSansDonnees).toBe(1);
    });

    it('calcule scoreGlobal en % d\'indicateurs conformes', () => {
      const services = [makeServiceWithPromos([
        makePromo({
          effectifInitial: 20, abandons: makeAbandons({ octobre: 1 }),
          tauxInsertion6Mois: 80, tauxObtentionCertif: 90,
          tauxSatisfactionStagiaires: 90, tauxSatisfactionFinanceurs: 80,
        }),
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.totaux.scoreGlobal).toBe(100); // 5/5 conformes
      expect(r.totaux.auditReady).toBe(true);
    });

    it('auditReady = false dès qu\'un indicateur n\'a pas de données', () => {
      const services = [makeServiceWithPromos([
        makePromo({ effectifInitial: 20, abandons: makeAbandons({ octobre: 1 }) }), // I-9 OK, autres null
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.totaux.auditReady).toBe(false);
      expect(r.totaux.nbSansDonnees).toBe(4);
    });

    it('completude = % moyenne des promos renseignées', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', tauxObtentionCertif: 80, tauxSatisfactionStagiaires: 80 }),
        makePromo({ id: 'p2' }), // tout null
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      // I-9 complétude=100 (effectifInitial>0 sur les 2), I-24=50, I-30=50, I-23=0, I-31=0
      // moyenne (100+50+50+0+0)/5 = 40
      expect(r.totaux.completude).toBe(40);
    });
  });

  describe('Alertes', () => {
    it('génère une alerte danger globale si non-conforme', () => {
      const services = [makeServiceWithPromos([
        makePromo({ tauxObtentionCertif: 30 }),
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      const dangers = r.alertes.filter(a => a.niveau === 'danger');
      expect(dangers.length).toBeGreaterThan(0);
      expect(dangers.some(a => a.indicateur === 'I-24')).toBe(true);
    });

    it('génère une alerte warning si indicateurs sans données', () => {
      const r = calculerIndicateursQualiopi([], {});
      expect(r.alertes.some(a => a.niveau === 'warning' && /sans donnée/i.test(a.message))).toBe(true);
    });
  });

  describe('Robustesse', () => {
    it('gère services null / undefined', () => {
      const r = calculerIndicateursQualiopi(null, {});
      expect(r.totaux.nbSansDonnees).toBe(5);
      expect(r.totaux.auditReady).toBe(false);
    });

    it('gère un service sans promos', () => {
      const r = calculerIndicateursQualiopi([{ id: 's1', nom: 'X' }], {});
      expect(r.indicateurs['I-9'].nbPromosTotales).toBe(0);
      expect(r.indicateurs['I-23'].nbPromosTotales).toBe(0);
    });

    it('gère structure filière conteneur (promos imbriquées)', () => {
      const services = [{
        id: 's1', nom: 'DEJEPS',
        promos: {
          lille: [{
            id: 'fil1', nom: 'Filière Animation',
            promos: [
              makePromo({ id: 'p1', effectifInitial: 10, tauxObtentionCertif: 90 }),
              makePromo({ id: 'p2', effectifInitial: 12, tauxObtentionCertif: 70 }),
            ],
          }],
        },
      }];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-24'].nbPromosTotales).toBe(2);
      expect(r.indicateurs['I-24'].valeurGlobale).toBeCloseTo((10*90 + 12*70)/22, 1);
    });

    it('gère valeurs string numériques (saisie input)', () => {
      const services = [makeServiceWithPromos([
        makePromo({ tauxInsertion6Mois: '75' }), // chaîne
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-23'].valeurGlobale).toBe(75);
    });

    it('priorité au map globalParams.qualiopiTaux[promoId] sur les champs promo', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', tauxObtentionCertif: 50 }), // valeur sur promo : 50 (danger)
      ])];
      const r = calculerIndicateursQualiopi(services, {
        qualiopiTaux: { p1: { tauxObtentionCertif: 90 } }, // override : 90 (success)
      });
      expect(r.indicateurs['I-24'].valeurGlobale).toBe(90);
      expect(r.indicateurs['I-24'].niveau).toBe('success');
    });

    it('ignore valeurs vides ou non numériques', () => {
      const services = [makeServiceWithPromos([
        makePromo({ id: 'p1', tauxInsertion6Mois: '' }),
        makePromo({ id: 'p2', tauxInsertion6Mois: 'oui' }),
        makePromo({ id: 'p3', tauxInsertion6Mois: 80 }),
      ])];
      const r = calculerIndicateursQualiopi(services, {});
      expect(r.indicateurs['I-23'].nbPromosRenseignees).toBe(1);
      expect(r.indicateurs['I-23'].valeurGlobale).toBe(80);
    });
  });

  describe('Recommandations', () => {
    it('recommandation par indicateur — niveau success', () => {
      const r = recommendationIndicateur('I-23', 'success', 80);
      expect(r).toMatch(/Conforme/);
    });

    it('recommandation par indicateur — niveau danger spécifique I-23', () => {
      const r = recommendationIndicateur('I-23', 'danger', 30);
      expect(r).toMatch(/Insertion 30/);
      expect(r).toMatch(/non-conformité/i);
    });

    it('recommandation par indicateur — niveau neutral mentionne preuve documentée', () => {
      const r = recommendationIndicateur('I-30', 'neutral', null);
      expect(r).toMatch(/preuve/i);
    });

    it('recommandation globale danger si non-conformes', () => {
      const services = [makeServiceWithPromos([
        makePromo({ tauxObtentionCertif: 40 }),
      ])];
      const result = calculerIndicateursQualiopi(services, {});
      expect(recommendationQualiopi(result)).toMatch(/non conforme/i);
    });

    it('recommandation globale audit-ready si tout conforme', () => {
      const services = [makeServiceWithPromos([
        makePromo({
          effectifInitial: 20, abandons: makeAbandons({ octobre: 1 }),
          tauxInsertion6Mois: 80, tauxObtentionCertif: 90,
          tauxSatisfactionStagiaires: 90, tauxSatisfactionFinanceurs: 80,
        }),
      ])];
      const result = calculerIndicateursQualiopi(services, {});
      expect(recommendationQualiopi(result)).toMatch(/conforme/i);
      expect(recommendationQualiopi(result)).toMatch(/✓/);
    });

    it('recommandation globale gère résultat null', () => {
      expect(recommendationQualiopi(null)).toBe('');
    });
  });
});
