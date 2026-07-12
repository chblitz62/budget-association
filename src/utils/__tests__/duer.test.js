import { describe, it, expect } from 'vitest';
import {
  calculerDUER,
  recommendationDUER,
  niveauCriticite,
  niveauToVariant,
  newRisque,
  newPlanAction,
  CATEGORIES_RISQUES,
  CODES_CATEGORIES,
  STATUTS_PLAN,
  libelleCategorie,
  libelleNiveau,
  libelleStatutPlan,
} from '../duer';

const REF_DATE = new Date('2026-05-05T00:00:00');

const isoDate = (offsetDays = 0) => {
  const d = new Date(REF_DATE);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const isoDateMonths = (offsetMonths = 0) => {
  const d = new Date(REF_DATE);
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toISOString().slice(0, 10);
};

const makeRisque = (overrides = {}) => ({
  id: 'r1',
  uniteId: 'siege',
  uniteNom: 'Siège',
  categorie: 'physique',
  libelle: 'Risque test',
  sourceDanger: 'Source',
  probabilite: 2,
  gravite: 2,
  maitrise: '',
  plansAction: [],
  ...overrides,
});

const makePlan = (overrides = {}) => ({
  id: 'pa1',
  mesure: 'Mesure test',
  responsable: 'DAF',
  echeance: isoDate(30),
  statut: 'a-faire',
  cout: 0,
  ...overrides,
});

describe('DUER — Document Unique d\'Évaluation des Risques (Axe 8)', () => {
  describe('Constantes & helpers', () => {
    it('expose 8 catégories INRS', () => {
      expect(CATEGORIES_RISQUES.length).toBe(8);
      expect(CODES_CATEGORIES).toContain('psychosocial');
      expect(CODES_CATEGORIES).toContain('ergonomique');
    });

    it('expose les 3 statuts plan d\'action', () => {
      expect(STATUTS_PLAN).toEqual(['a-faire', 'en-cours', 'fait']);
    });

    it('libelleCategorie / libelleNiveau / libelleStatutPlan retournent un libellé lisible', () => {
      expect(libelleCategorie('psychosocial')).toMatch(/psychosociaux/i);
      expect(libelleNiveau('critique')).toBe('Critique');
      expect(libelleStatutPlan('a-faire')).toBe('À faire');
    });
  });

  describe('Matrice criticité 5×5 (méthode INRS)', () => {
    it('niveau faible pour score 1-5', () => {
      expect(niveauCriticite(1)).toBe('faible');   // 1×1
      expect(niveauCriticite(5)).toBe('faible');   // 5×1 ou 1×5
    });

    it('niveau modéré pour score 6-12', () => {
      expect(niveauCriticite(6)).toBe('modere');   // 2×3
      expect(niveauCriticite(12)).toBe('modere');  // 3×4 ou 4×3
    });

    it('niveau élevé pour score 13-19', () => {
      expect(niveauCriticite(13)).toBe('eleve');
      expect(niveauCriticite(15)).toBe('eleve');   // 3×5 ou 5×3
      expect(niveauCriticite(19)).toBe('eleve');
    });

    it('niveau critique pour score 20-25', () => {
      expect(niveauCriticite(20)).toBe('critique'); // 4×5 ou 5×4
      expect(niveauCriticite(25)).toBe('critique'); // 5×5
    });

    it('niveau neutre pour score 0', () => {
      expect(niveauCriticite(0)).toBe('neutre');
    });

    it('mapping niveau → variant', () => {
      expect(niveauToVariant('faible')).toBe('success');
      expect(niveauToVariant('modere')).toBe('warning');
      expect(niveauToVariant('eleve')).toBe('danger');
      expect(niveauToVariant('critique')).toBe('danger');
      expect(niveauToVariant('neutre')).toBe('neutral');
    });
  });

  describe('Évaluation enrichie d\'un risque', () => {
    it('calcule score = probabilite × gravite', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({ probabilite: 4, gravite: 5 })] } },
        refDate: REF_DATE,
      });
      expect(r.risques[0].score).toBe(20);
      expect(r.risques[0].niveau).toBe('critique');
    });

    it('clamp probabilite et gravite à [0,5]', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({ probabilite: 99, gravite: -1 })] } },
        refDate: REF_DATE,
      });
      expect(r.risques[0].probabilite).toBe(5);
      expect(r.risques[0].gravite).toBe(0);
      expect(r.risques[0].score).toBe(0);
    });

    it('détecte risque prioritaire sans plan d\'action', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({ probabilite: 4, gravite: 4 })] } }, // 16 = élevé
        refDate: REF_DATE,
      });
      expect(r.risques[0].alertePlanCritique).toBe(true);
      expect(r.risquesPrioritairesSansPlan.length).toBe(1);
    });

    it('compte les plans d\'action ouverts vs faits', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({
          plansAction: [
            makePlan({ id: 'p1', statut: 'fait' }),
            makePlan({ id: 'p2', statut: 'en-cours' }),
            makePlan({ id: 'p3', statut: 'a-faire' }),
          ],
        })] } },
        refDate: REF_DATE,
      });
      const risque = r.risques[0];
      expect(risque.nbPlans).toBe(3);
      expect(risque.nbPlansOuverts).toBe(2);
    });
  });

  describe('Plans d\'action en retard', () => {
    it('détecte un plan en retard (échéance passée + non fait)', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({
          plansAction: [makePlan({ echeance: isoDate(-10), statut: 'a-faire' })],
        })] } },
        refDate: REF_DATE,
      });
      expect(r.plansAction.nbEnRetard).toBe(1);
    });

    it('ignore un plan en retard mais déjà fait', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({
          plansAction: [makePlan({ echeance: isoDate(-10), statut: 'fait' })],
        })] } },
        refDate: REF_DATE,
      });
      expect(r.plansAction.nbEnRetard).toBe(0);
    });

    it('ignore un plan sans échéance', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({
          plansAction: [makePlan({ echeance: '', statut: 'a-faire' })],
        })] } },
        refDate: REF_DATE,
      });
      expect(r.plansAction.nbEnRetard).toBe(0);
    });

    it('agrège le coût total des plans', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({
          plansAction: [makePlan({ id: 'p1', cout: 1000 }), makePlan({ id: 'p2', cout: 2500 })],
        })] } },
        refDate: REF_DATE,
      });
      expect(r.plansAction.coutTotal).toBe(3500);
    });
  });

  describe('Date de mise à jour', () => {
    it('mAJObsolete = false si MAJ < 12 mois', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-6), risques: [] } },
        refDate: REF_DATE,
      });
      expect(r.mAJObsolete).toBe(false);
      expect(r.mAJUrgente).toBe(false);
    });

    it('mAJObsolete = true si MAJ entre 12 et 18 mois', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-15), risques: [] } },
        refDate: REF_DATE,
      });
      expect(r.mAJObsolete).toBe(true);
      expect(r.mAJUrgente).toBe(false);
    });

    it('mAJUrgente = true si MAJ > 18 mois', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-24), risques: [] } },
        refDate: REF_DATE,
      });
      expect(r.mAJUrgente).toBe(true);
    });

    it('mAJUrgente = true si dateMAJ null', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: null, risques: [] } },
        refDate: REF_DATE,
      });
      expect(r.mAJUrgente).toBe(true);
      expect(r.ageMoisMAJ).toBeNull();
    });
  });

  describe('Couverture des unités de travail', () => {
    it('100 % si tous les services + siège + pôle ont au moins un risque', () => {
      const services = [{ id: 's1', nom: 'BPJEPS' }, { id: 's2', nom: 'DEJEPS' }];
      const r = calculerDUER({
        services,
        poleSupport: { nom: 'Pôle Support' },
        direction: { nom: 'Direction' },
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [
          makeRisque({ id: 'r1', uniteId: 'siege' }),
          makeRisque({ id: 'r2', uniteId: 'pole-support' }),
          makeRisque({ id: 'r3', uniteId: 's1' }),
          makeRisque({ id: 'r4', uniteId: 's2' }),
        ]}},
        refDate: REF_DATE,
      });
      expect(r.couverture).toBe(100);
      expect(r.unitesNonEvaluees.length).toBe(0);
    });

    it('liste les unités sans risque évalué', () => {
      const services = [{ id: 's1', nom: 'BPJEPS' }, { id: 's2', nom: 'DEJEPS' }];
      const r = calculerDUER({
        services,
        direction: { nom: 'Direction' },
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({ uniteId: 's1' })] } },
        refDate: REF_DATE,
      });
      expect(r.couverture).toBe(round1Approx(100 / 3));
      expect(r.unitesNonEvaluees.map(u => u.id).sort()).toEqual(['s2', 'siege']);
    });
  });

  describe('Agrégations', () => {
    it('compte par catégorie', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [
          makeRisque({ id: 'r1', categorie: 'physique' }),
          makeRisque({ id: 'r2', categorie: 'physique' }),
          makeRisque({ id: 'r3', categorie: 'psychosocial' }),
        ]}},
        refDate: REF_DATE,
      });
      expect(r.parCategorie.physique.nb).toBe(2);
      expect(r.parCategorie.psychosocial.nb).toBe(1);
      expect(r.parCategorie.ergonomique.nb).toBe(0);
    });

    it('compte par niveau', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [
          makeRisque({ id: 'r1', probabilite: 1, gravite: 1 }), // 1 = faible
          makeRisque({ id: 'r2', probabilite: 3, gravite: 3 }), // 9 = modéré
          makeRisque({ id: 'r3', probabilite: 4, gravite: 4 }), // 16 = élevé
          makeRisque({ id: 'r4', probabilite: 5, gravite: 5 }), // 25 = critique
        ]}},
        refDate: REF_DATE,
      });
      expect(r.parNiveau.faible).toBe(1);
      expect(r.parNiveau.modere).toBe(1);
      expect(r.parNiveau.eleve).toBe(1);
      expect(r.parNiveau.critique).toBe(1);
    });

    it('calcule la criticité moyenne', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [
          makeRisque({ id: 'r1', probabilite: 2, gravite: 2 }), // 4
          makeRisque({ id: 'r2', probabilite: 4, gravite: 5 }), // 20
        ]}},
        refDate: REF_DATE,
      });
      expect(r.criticiteMoyenne).toBe(12); // (4+20)/2 = 12
    });

    it('tri par criticité décroissante', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [
          makeRisque({ id: 'low', probabilite: 1, gravite: 1 }),
          makeRisque({ id: 'high', probabilite: 5, gravite: 5 }),
          makeRisque({ id: 'med', probabilite: 3, gravite: 3 }),
        ]}},
        refDate: REF_DATE,
      });
      expect(r.risques.map(x => x.id)).toEqual(['high', 'med', 'low']);
    });
  });

  describe('Niveau global & alertes', () => {
    it('niveau global success si tout est OK', () => {
      const r = calculerDUER({
        services: [{ id: 's1', nom: 'BPJEPS' }],
        globalParams: { duer: { dateMAJ: isoDateMonths(-3), risques: [
          makeRisque({ id: 'r1', uniteId: 's1', probabilite: 1, gravite: 2 }), // faible
        ]}},
        refDate: REF_DATE,
      });
      expect(r.niveauGlobal).toBe('success');
      expect(r.alertes.length).toBe(0);
    });

    it('niveau global danger si MAJ urgente', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: null, risques: [] } },
        refDate: REF_DATE,
      });
      expect(r.niveauGlobal).toBe('danger');
      expect(r.alertes.some(a => a.niveau === 'danger' && /jamais/i.test(a.message))).toBe(true);
    });

    it('niveau global danger si plans en retard', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [makeRisque({
          plansAction: [makePlan({ echeance: isoDate(-30), statut: 'a-faire' })],
        })] } },
        refDate: REF_DATE,
      });
      expect(r.niveauGlobal).toBe('danger');
    });

    it('niveau global warning si MAJ obsolète sans autre alerte critique', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-14), risques: [makeRisque({ probabilite: 1, gravite: 1 })] } },
        refDate: REF_DATE,
      });
      expect(r.niveauGlobal).toBe('warning');
    });
  });

  describe('Robustesse', () => {
    it('gère globalParams sans clé duer', () => {
      const r = calculerDUER({ globalParams: {}, refDate: REF_DATE });
      expect(r.totalRisques).toBe(0);
      expect(r.mAJUrgente).toBe(true);
    });

    it('gère un risque sans plansAction (undefined)', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: isoDateMonths(-1), risques: [{ id: 'r1', uniteId: 'siege', categorie: 'physique', probabilite: 2, gravite: 3 }] } },
        refDate: REF_DATE,
      });
      expect(r.risques[0].nbPlans).toBe(0);
      expect(r.plansAction.nbEnRetard).toBe(0);
    });

    it('gère une dateMAJ invalide comme MAJ urgente', () => {
      const r = calculerDUER({
        globalParams: { duer: { dateMAJ: 'foobar', risques: [] } },
        refDate: REF_DATE,
      });
      expect(r.mAJUrgente).toBe(true);
      expect(r.ageMoisMAJ).toBeNull();
    });
  });

  describe('Helpers UI (newRisque / newPlanAction)', () => {
    it('newRisque génère un risque vierge avec id unique', () => {
      const a = newRisque('s1', 'BPJEPS');
      const b = newRisque('s1', 'BPJEPS');
      expect(a.id).not.toBe(b.id);
      expect(a.uniteId).toBe('s1');
      expect(a.uniteNom).toBe('BPJEPS');
      expect(a.probabilite).toBe(1);
    });

    it('newPlanAction génère un plan vierge avec id unique', () => {
      const a = newPlanAction();
      expect(a.id).toMatch(/^pa-/);
      expect(a.statut).toBe('a-faire');
    });
  });

  describe('Recommandations', () => {
    it('recommendation critique si MAJ urgente', () => {
      const r = calculerDUER({ globalParams: { duer: { dateMAJ: null, risques: [] } }, refDate: REF_DATE });
      expect(recommendationDUER(r)).toMatch(/✕/);
      expect(recommendationDUER(r)).toMatch(/obsolète/i);
    });

    it('recommendation success si tout OK', () => {
      const r = calculerDUER({
        services: [{ id: 's1', nom: 'BPJEPS' }],
        globalParams: { duer: { dateMAJ: isoDateMonths(-3), risques: [
          makeRisque({ id: 'r1', uniteId: 's1', probabilite: 1, gravite: 2 }),
        ]}},
        refDate: REF_DATE,
      });
      expect(recommendationDUER(r)).toMatch(/✓/);
    });

    it('recommendation gère rapport null', () => {
      expect(recommendationDUER(null)).toBe('');
    });
  });
});

// petit helper local
function round1Approx(n) { return Math.round(n * 10) / 10; }
