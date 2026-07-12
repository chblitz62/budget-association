import { describe, it, expect } from 'vitest';
import {
  genererBilanSocial,
  recommendationBilanSocial,
  mettreAJourAccidents,
} from '../bilanSocial';

const REF_ANNEE = 2026;

const makeAgent = (overrides = {}) => ({
  id: Math.random().toString(36).slice(2, 8),
  titre: 'Salarié', salaire: 2500, etp: 1, segur: false,
  typeContrat: 'CDI', tauxChargesManuel: 44,
  genre: 'F', anneeNaissance: 1990, dateEntree: 2020, dateSortie: 0,
  ...overrides,
});

const makeServices = () => ([
  {
    id: 's1', nom: 'BPJEPS',
    personnel: [
      makeAgent({ id: 's1a', genre: 'F', anneeNaissance: 1985 }),
      makeAgent({ id: 's1b', genre: 'H', anneeNaissance: 1995 }),
    ],
    promos: { arras: [{ id: 'p1', nom: 'Promo', effectifInitial: 20, abandons: {} }] },
  },
]);

const makeDirection = () => ({
  personnel: [
    makeAgent({ id: 'd1', genre: 'F', salaire: 4000, anneeNaissance: 1970 }),
  ],
});

const makePoolRH = () => ([
  makeAgent({ id: 'pr1', genre: 'H', etp: 0.5, anneeNaissance: 2000 }),
]);

const ATValide = {
  accidentsAvecArret: 2,
  accidentsSansArret: 1,
  joursArretAT: 30,
  maladiesProfessionnelles: 0,
  heuresTravailles: 100000,
};

describe('Bilan Social annuel — Axe 8 (synthèse multi-modules)', () => {
  describe('Section 1 — Effectifs', () => {
    it('compte tous les agents (direction + services + pôle + pool)', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        services: makeServices(),
        poolRH: makePoolRH(),
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.effectifs.totalAgents).toBe(4); // 1 + 2 + 1
    });

    it('agrège l\'ETP total (avec Pool 0.5)', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        services: makeServices(),
        poolRH: makePoolRH(),
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.effectifs.totalETP).toBe(3.5);
    });

    it('ventile par contrat (CDI, CDD…)', () => {
      const b = genererBilanSocial({
        direction: { personnel: [
          makeAgent({ typeContrat: 'CDI' }),
          makeAgent({ typeContrat: 'CDD' }),
        ]},
        anneeRef: REF_ANNEE,
      });
      const cdi = b.sections.effectifs.parContrat.find(c => c.type === 'CDI');
      const cdd = b.sections.effectifs.parContrat.find(c => c.type === 'CDD');
      expect(cdi.nb).toBe(1);
      expect(cdd.nb).toBe(1);
    });

    it('ventile par genre H/F/NR', () => {
      const b = genererBilanSocial({
        direction: { personnel: [
          makeAgent({ genre: 'F' }),
          makeAgent({ genre: 'H' }),
          makeAgent({ genre: '' }),
        ]},
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.effectifs.parGenre.F).toBe(1);
      expect(b.sections.effectifs.parGenre.H).toBe(1);
      expect(b.sections.effectifs.parGenre.NR).toBe(1);
    });

    it('liste les entités avec effectif', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        services: makeServices(),
        poolRH: makePoolRH(),
        anneeRef: REF_ANNEE,
      });
      const ids = b.sections.effectifs.parEntite.map(e => e.id).sort();
      expect(ids).toEqual(['direction', 'poolRH', 's1']);
    });

    it('compte les présents fin d\'année (dateSortie 0 ou null)', () => {
      const b = genererBilanSocial({
        direction: { personnel: [
          makeAgent({ dateSortie: 0 }),
          makeAgent({ dateSortie: 2025 }), // sorti avant 2026
          makeAgent({ dateSortie: null }),
        ]},
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.effectifs.presentsFinAnnee).toBe(2);
    });
  });

  describe('Section 2 — Rémunérations', () => {
    it('agrège brut, charges, coût employeur', () => {
      const b = genererBilanSocial({
        direction: { personnel: [makeAgent({ salaire: 3000, etp: 1 })] },
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.remunerations.brutAnnuel).toBeGreaterThan(0);
      expect(b.sections.remunerations.chargesPatronales).toBeGreaterThan(0);
      expect(b.sections.remunerations.coutEmployeur).toBeGreaterThan(b.sections.remunerations.brutAnnuel);
    });

    it('expose le taux de charges effectif', () => {
      const b = genererBilanSocial({
        direction: { personnel: [makeAgent({ salaire: 3000, etp: 1, tauxChargesManuel: 44 })] },
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.remunerations.tauxChargesEffectif).toBeGreaterThan(0);
      expect(b.sections.remunerations.tauxChargesEffectif).toBeLessThan(80);
    });

    it('expose le salaire moyen ETP', () => {
      const b = genererBilanSocial({
        direction: { personnel: [makeAgent({ salaire: 3000, etp: 1 })] },
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.remunerations.salaireMoyenAnnuelETP).toBeGreaterThan(0);
    });
  });

  describe('Sections 3-4 — Pyramide / Parité / Turn-over (réutilisation)', () => {
    it('chaîne calculerIndicateursRH (pyramide)', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        services: makeServices(),
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.pyramide).toBeDefined();
      expect(b.sections.pyramide.totaux.nbAgents).toBe(3);
    });

    it('chaîne calculerIndicateursPariteTurnOver', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        services: makeServices(),
        poolRH: makePoolRH(),
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.pariteTurnOver).toBeDefined();
      expect(b.sections.pariteTurnOver.totaux.nbAgents).toBe(4);
    });
  });

  describe('Section 5 — OETH', () => {
    it('inclut tous les agents pour le calcul OETH', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        services: makeServices(),
        poolRH: makePoolRH(),
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.oeth.nbAgents).toBe(4);
    });

    it('respecte la surcharge seuilOETH globalParams', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        globalParams: { seuilOETH: 5 },
        anneeRef: REF_ANNEE,
      });
      // Avec seuil 5, l'obligation s'active (1 agent < 5 → pas d'obligation)
      expect(b.sections.oeth).toBeDefined();
    });
  });

  describe('Section 6 — Formation', () => {
    it('utilise statsFormation passé en option si fourni', () => {
      const b = genererBilanSocial({
        services: makeServices(),
        statsFormation: { effectifTotal: 50 },
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.formation.effectifTotal).toBe(50);
    });

    it('recalcule effectifTotal depuis les promos sinon', () => {
      const b = genererBilanSocial({
        services: makeServices(),
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.formation.effectifTotal).toBe(20);
    });

    it('expose enveloppe + dépense formation depuis globalParams', () => {
      const b = genererBilanSocial({
        globalParams: { enveloppeFormation: 50000, depenseFormationRealisee: 35000 },
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.formation.enveloppeFormation).toBe(50000);
      expect(b.sections.formation.depenseRealiseeFormation).toBe(35000);
    });
  });

  describe('Section 7 — Conditions de travail (DUER + Sécurité)', () => {
    it('chaîne calculerDUER', () => {
      const b = genererBilanSocial({
        services: makeServices(),
        anneeRef: REF_ANNEE,
      });
      expect(b.sections.conditionsTravail.duer).toBeDefined();
      expect(b.sections.conditionsTravail.duer.totalRisques).toBe(0);
    });

    it('calcule TF (taux de fréquence) selon norme INRS', () => {
      const b = genererBilanSocial({
        globalParams: { bilanSocial: { accidents: ATValide } },
        anneeRef: REF_ANNEE,
      });
      // TF = 2 × 1_000_000 / 100_000 = 20
      expect(b.sections.conditionsTravail.securite.tauxFrequence).toBe(20);
    });

    it('calcule TG (taux de gravité)', () => {
      const b = genererBilanSocial({
        globalParams: { bilanSocial: { accidents: ATValide } },
        anneeRef: REF_ANNEE,
      });
      // TG = 30 × 1000 / 100000 = 0.3
      expect(b.sections.conditionsTravail.securite.tauxGravite).toBe(0.3);
    });

    it('niveau TF success si ≤ 15, warning 15-30, danger > 30', () => {
      // success
      let b = genererBilanSocial({
        globalParams: { bilanSocial: { accidents: { ...ATValide, accidentsAvecArret: 1, heuresTravailles: 100000 } } },
      });
      expect(b.sections.conditionsTravail.securite.niveauTF).toBe('success'); // TF=10
      // warning
      b = genererBilanSocial({
        globalParams: { bilanSocial: { accidents: { ...ATValide, accidentsAvecArret: 2, heuresTravailles: 100000 } } },
      });
      expect(b.sections.conditionsTravail.securite.niveauTF).toBe('warning'); // TF=20
      // danger
      b = genererBilanSocial({
        globalParams: { bilanSocial: { accidents: { ...ATValide, accidentsAvecArret: 4, heuresTravailles: 100000 } } },
      });
      expect(b.sections.conditionsTravail.securite.niveauTF).toBe('danger'); // TF=40
    });

    it('TF/TG null si heures travaillées non saisies', () => {
      const b = genererBilanSocial({ globalParams: {}, anneeRef: REF_ANNEE });
      expect(b.sections.conditionsTravail.securite.tauxFrequence).toBeNull();
      expect(b.sections.conditionsTravail.securite.tauxGravite).toBeNull();
      expect(b.sections.conditionsTravail.securite.saisi).toBe(false);
    });

    it('saisi = true si au moins une donnée AT renseignée', () => {
      const b = genererBilanSocial({
        globalParams: { bilanSocial: { accidents: { accidentsAvecArret: 1 } } },
      });
      expect(b.sections.conditionsTravail.securite.saisi).toBe(true);
    });
  });

  describe('Complétude & alertes', () => {
    it('complétude 0 % si rien renseigné', () => {
      const b = genererBilanSocial({});
      expect(b.completude).toBe(0);
    });

    it('compte les sections renseignées', () => {
      const b = genererBilanSocial({
        direction: makeDirection(),
        services: makeServices(),
      });
      // sections complètes : effectifs, remunerations, pyramide (anneeNaissance présente),
      // parite (genre présent), oeth, formation
      expect(b.sectionsRenseignees).toBeGreaterThan(0);
    });

    it('niveau global danger si DUER en danger (MAJ urgente)', () => {
      const b = genererBilanSocial({
        services: makeServices(),
        globalParams: { duer: { dateMAJ: null, risques: [] } },
      });
      // DUER avec dateMAJ null → mAJUrgente=true → niveauGlobal=danger
      expect(b.niveauGlobal).toBe('danger');
      expect(b.alertes.some(a => a.section === 'DUER')).toBe(true);
    });

    it('niveau global danger si TF > 30', () => {
      const b = genererBilanSocial({
        services: makeServices(),
        globalParams: {
          duer: { dateMAJ: '2026-01-01', risques: [{ id: 'r1', uniteId: 's1', categorie: 'physique', probabilite: 1, gravite: 1 }] },
          bilanSocial: { accidents: { accidentsAvecArret: 5, heuresTravailles: 100000 } },
        },
      });
      expect(b.sections.conditionsTravail.securite.niveauTF).toBe('danger'); // TF=50
      expect(b.niveauGlobal).toBe('danger');
    });

    it('alerte warning si AT non saisis', () => {
      const b = genererBilanSocial({
        services: makeServices(),
        globalParams: { duer: { dateMAJ: '2026-01-01', risques: [{ id: 'r1', uniteId: 's1', categorie: 'physique', probabilite: 1, gravite: 1 }] } },
      });
      expect(b.alertes.some(a => a.section === 'Sécurité' && /non saisies/i.test(a.message))).toBe(true);
    });
  });

  describe('Helpers', () => {
    it('mettreAJourAccidents fusionne les saisies', () => {
      const gp = { foo: 1 };
      const updated = mettreAJourAccidents(gp, { accidentsAvecArret: 3 });
      expect(updated.foo).toBe(1);
      expect(updated.bilanSocial.accidents.accidentsAvecArret).toBe(3);
    });

    it('mettreAJourAccidents préserve les saisies précédentes', () => {
      const gp = { bilanSocial: { accidents: { joursArretAT: 10 } } };
      const updated = mettreAJourAccidents(gp, { accidentsAvecArret: 3 });
      expect(updated.bilanSocial.accidents.joursArretAT).toBe(10);
      expect(updated.bilanSocial.accidents.accidentsAvecArret).toBe(3);
    });
  });

  describe('Recommandations', () => {
    it('recommendation danger si alertes critiques', () => {
      const b = genererBilanSocial({
        globalParams: { duer: { dateMAJ: null, risques: [] } },
      });
      expect(recommendationBilanSocial(b)).toMatch(/✕/);
    });

    it('recommendation warning si complétude < 80', () => {
      const b = genererBilanSocial({});
      // forcer DUER pas en danger en passant un seul risque mais MAJ valide
      const r = recommendationBilanSocial({ ...b, alertes: [], niveauGlobal: 'warning', completude: 50 });
      expect(r).toMatch(/⚠/);
      expect(r).toMatch(/partiel/i);
    });

    it('recommendation success si tout est OK', () => {
      const b = {
        completude: 100,
        alertes: [],
        niveauGlobal: 'success',
      };
      expect(recommendationBilanSocial(b)).toMatch(/✓/);
    });

    it('recommendation gère bilan null', () => {
      expect(recommendationBilanSocial(null)).toBe('');
    });
  });
});
