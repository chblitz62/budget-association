import { describe, it, expect } from 'vitest';
import {
  analyserPromos,
  recommendationPromo,
  SEUIL_ABANDON_WARNING_DEFAULT,
  SEUIL_ABANDON_DANGER_DEFAULT,
} from '../suiviPromos';

const makeAbandons = (totalParMois = {}) => ({
  janvier: 0, fevrier: 0, mars: 0, avril: 0, mai: 0, juin: 0,
  juillet: 0, aout: 0, septembre: 0, octobre: 0, novembre: 0, decembre: 0,
  ...totalParMois,
});

const services = [
  // Service 1 : structure plate (promos directes)
  {
    id: 's1', nom: 'BPJEPS',
    promos: {
      arras: [
        { id: 'p1', nom: 'Promo 2025-2026', effectifInitial: 20, abandons: makeAbandons({ septembre: 1, novembre: 1 }), type: 'standard' },
        { id: 'p2', nom: 'Promo 2026-2027', effectifInitial: 18, abandons: makeAbandons(), type: 'standard' },
      ],
    },
  },
  // Service 2 : structure filière (conteneur)
  {
    id: 's2', nom: 'DEJEPS',
    promos: {
      lille: [
        {
          id: 'fil1', nom: 'Filière Animation',
          promos: [
            { id: 'p3', nom: 'Promo Anim 2026', effectifInitial: 15, abandons: makeAbandons({ octobre: 4 }), type: 'standard' }, // 26,7 % → danger
            { id: 'p4', nom: 'Promo Anim 2027', effectifInitial: 12, abandons: makeAbandons({ novembre: 2 }), type: 'standard' }, // 16,7 % → warning
          ],
        },
      ],
    },
  },
];

describe('Suivi des Quotas par Promo — Axe 3', () => {
  it('expose les seuils par défaut', () => {
    expect(SEUIL_ABANDON_WARNING_DEFAULT).toBe(10);
    expect(SEUIL_ABANDON_DANGER_DEFAULT).toBe(20);
  });

  it('aplatit promos plates ET filières conteneur', () => {
    const r = analyserPromos(services, {});
    // 2 promos plates (s1) + 2 promos en filière (s2) = 4
    expect(r.parPromo.length).toBe(4);
    const ids = r.parPromo.map(p => p.id).sort();
    expect(ids).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('attribue serviceNom + siteKey + filiereNom', () => {
    const r = analyserPromos(services, {});
    const p1 = r.parPromo.find(x => x.id === 'p1');
    const p3 = r.parPromo.find(x => x.id === 'p3');
    expect(p1.serviceNom).toBe('BPJEPS');
    expect(p1.siteKey).toBe('arras');
    expect(p1.filiereNom).toBeNull();
    expect(p3.filiereNom).toBe('Filière Animation');
    expect(p3.siteKey).toBe('lille');
  });

  it('calcule total abandons + effectif actuel + taux', () => {
    const r = analyserPromos(services, {});
    const p1 = r.parPromo.find(x => x.id === 'p1');
    // 20 initial − (1 sept + 1 nov) = 18, taux 10 %
    expect(p1.effectifInitial).toBe(20);
    expect(p1.totalAbandons).toBe(2);
    expect(p1.effectifActuel).toBe(18);
    expect(p1.tauxAbandon).toBe(10);
    expect(p1.tauxRetention).toBe(90);
  });

  it('niveau success quand taux abandon < warning (10 %)', () => {
    const r = analyserPromos(services, {});
    const p2 = r.parPromo.find(x => x.id === 'p2'); // 0 abandons → 0 %
    expect(p2.niveau).toBe('success');
  });

  it('niveau warning quand warning ≤ taux < danger (10-20 %)', () => {
    const r = analyserPromos(services, {});
    const p1 = r.parPromo.find(x => x.id === 'p1'); // 10 %
    const p4 = r.parPromo.find(x => x.id === 'p4'); // 16,7 %
    expect(p1.niveau).toBe('warning');
    expect(p4.niveau).toBe('warning');
  });

  it('niveau danger quand taux ≥ danger (≥ 20 %) avec alerteRupture', () => {
    const r = analyserPromos(services, {});
    const p3 = r.parPromo.find(x => x.id === 'p3'); // 26,7 %
    expect(p3.niveau).toBe('danger');
    expect(p3.alerteRupture).toBe(true);
  });

  it('niveau neutral quand effectif initial = 0', () => {
    const svc = [{ id: 'sX', nom: 'Vide', promos: { lille: [{ id: 'pX', nom: 'Pro', effectifInitial: 0, abandons: makeAbandons() }] } }];
    const r = analyserPromos(svc, {});
    expect(r.parPromo[0].niveau).toBe('neutral');
    expect(r.parPromo[0].alerteRupture).toBe(false);
  });

  it('totaux consolidés cohérents', () => {
    const r = analyserPromos(services, {});
    const sumInit = r.parPromo.reduce((s, p) => s + p.effectifInitial, 0);
    const sumAbandons = r.parPromo.reduce((s, p) => s + p.totalAbandons, 0);
    expect(r.totaux.totalEffectifInitial).toBe(sumInit);
    expect(r.totaux.totalAbandons).toBe(sumAbandons);
    expect(r.totaux.totalEffectifActuel).toBe(sumInit - sumAbandons);
    expect(r.totaux.nbPromos).toBe(4);
  });

  it('compte promos saines / alertes / critiques', () => {
    const r = analyserPromos(services, {});
    // p2 saine, p1+p4 warning, p3 danger
    expect(r.totaux.nbSaines).toBe(1);
    expect(r.totaux.nbAlertes).toBe(2);
    expect(r.totaux.nbCritiques).toBe(1);
    expect(r.totaux.nbSaines + r.totaux.nbAlertes + r.totaux.nbCritiques).toBe(r.totaux.nbPromos);
  });

  it('tri : promos critiques en tête, puis par taux décroissant', () => {
    const r = analyserPromos(services, {});
    expect(r.parPromo[0].niveau).toBe('danger');
    // À l'intérieur d'un même niveau : taux décroissant
    const warnings = r.parPromo.filter(p => p.niveau === 'warning');
    for (let i = 1; i < warnings.length; i++) {
      expect(warnings[i - 1].tauxAbandon).toBeGreaterThanOrEqual(warnings[i].tauxAbandon);
    }
  });

  it('respecte un override globalParams.seuilAbandonWarning / Danger', () => {
    // Seuils plus stricts : warning à 5 %, danger à 15 %
    const r = analyserPromos(services, { seuilAbandonWarning: 5, seuilAbandonDanger: 15 });
    const p1 = r.parPromo.find(x => x.id === 'p1'); // 10 % → était warning (10-15), reste warning
    const p4 = r.parPromo.find(x => x.id === 'p4'); // 16,7 % → était warning, devient danger
    expect(p1.niveau).toBe('warning');
    expect(p4.niveau).toBe('danger');
    expect(r.seuils.warning).toBe(5);
    expect(r.seuils.danger).toBe(15);
  });

  it('garde-fou : danger forcé ≥ warning', () => {
    const r = analyserPromos(services, { seuilAbandonWarning: 30, seuilAbandonDanger: 5 });
    expect(r.seuils.danger).toBeGreaterThanOrEqual(r.seuils.warning);
  });

  it('robustesse : services null/undefined → tableau vide', () => {
    const r = analyserPromos(null, null);
    expect(r.parPromo).toEqual([]);
    expect(r.totaux.nbPromos).toBe(0);
    expect(r.totaux.totalEffectifInitial).toBe(0);
    expect(r.totaux.tauxAbandonGlobal).toBe(0);
  });

  it('robustesse : service sans promos → ignoré', () => {
    const svc = [{ id: 'sZ', nom: 'Sans promo' }];
    const r = analyserPromos(svc, {});
    expect(r.parPromo).toEqual([]);
  });

  it('recommandations contextuelles 4 niveaux', () => {
    expect(recommendationPromo('success', 5, 18, 20)).toMatch(/saine/i);
    expect(recommendationPromo('warning', 12, 17, 20)).toMatch(/Vigilance|tutorat/i);
    expect(recommendationPromo('danger', 30, 14, 20)).toMatch(/Rupture/i);
    expect(recommendationPromo('neutral', 0, 0, 0)).toMatch(/non démarrée/i);
  });
});
