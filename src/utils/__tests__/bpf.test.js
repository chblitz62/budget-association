import { describe, it, expect } from 'vitest';
import {
  genererBPF,
  classifierRecette,
  estChargeSousTraitance,
  recommendationBPF,
} from '../bpf';

const ANNEE = 2026;

const baseGlobalParams = {
  coefficientBP: 100,
  montantSegurETP: 238,
  bpfIdentite: {
    nda: '32-59-12345-59',
    siret: '12345678901234',
    raisonSociale: 'AFERTES',
    statutJuridique: 'Association loi 1901',
  },
  heuresStagiairesParService: { 's1': 1500 },
};

const makeFormateur = (overrides = {}) => ({
  id: Math.random(), titre: 'Formateur', salaire: 3000, etp: 1, segur: false,
  role: 'formateur', typeContrat: 'CDI', tauxChargesManuel: 44,
  ...overrides,
});

const makeService = (overrides = {}) => ({
  id: 's1', nom: 'BPJEPS', personnel: [], recettes: [], exploitation: [], promos: {},
  ...overrides,
});

describe('BPF (CERFA 10443) — Axe 10', () => {
  describe('classifierRecette()', () => {
    it('classe les OPCO en B12', () => {
      expect(classifierRecette('OPCO Santé')).toBe('B12');
      expect(classifierRecette('Constructys 2026')).toBe('B12');
      expect(classifierRecette('AKTO formation')).toBe('B12');
      expect(classifierRecette('Uniformation')).toBe('B12');
    });

    it('classe la Région en B131', () => {
      expect(classifierRecette('Subvention Région Hauts-de-France')).toBe('B131');
      expect(classifierRecette('Conseil Régional')).toBe('B131');
    });

    it('classe France Travail / Pôle Emploi en B132', () => {
      expect(classifierRecette('France Travail AIF')).toBe('B132');
      expect(classifierRecette('Pôle Emploi AFPR')).toBe('B132');
    });

    it('classe État / DGEFP / FSE+ en B133', () => {
      expect(classifierRecette('État - PIC 2026')).toBe('B133');
      expect(classifierRecette('DGEFP convention')).toBe('B133');
      expect(classifierRecette('FSE+ cofinancement')).toBe('B133');
    });

    it('classe départements/communes en B134', () => {
      expect(classifierRecette('Département du Nord')).toBe('B134');
      expect(classifierRecette('Métropole européenne de Lille')).toBe('B134');
    });

    it('classe CPF / apprentissage / contrat pro en B16', () => {
      expect(classifierRecette('CPF individuel')).toBe('B16');
      expect(classifierRecette('Contrat d\'apprentissage')).toBe('B16');
      expect(classifierRecette('Professionnalisation 2026')).toBe('B16');
    });

    it('classe les particuliers en B14', () => {
      expect(classifierRecette('Particulier auto-financement')).toBe('B14');
    });

    it('classe en B11 (entreprises) par défaut', () => {
      expect(classifierRecette('Convention entreprise XYZ')).toBe('B11');
      expect(classifierRecette('Formation continue Entreprise A')).toBe('B11');
      expect(classifierRecette('Inscription FC')).toBe('B11');
      // Libellé indéterminé → fallback B11
      expect(classifierRecette('Libellé inconnu')).toBe('B11');
    });
  });

  describe('estChargeSousTraitance()', () => {
    it('détecte les vacataires et intervenants externes', () => {
      expect(estChargeSousTraitance('Vacataires formation')).toBe(true);
      expect(estChargeSousTraitance('Honoraire formateur externe')).toBe(true);
      expect(estChargeSousTraitance('Sous-traitance pédagogique')).toBe(true);
    });

    it('ignore la sous-traitance entrante (recette déguisée)', () => {
      expect(estChargeSousTraitance('Sous-traitance entrante OF partenaire')).toBe(false);
    });

    it('ignore les charges normales', () => {
      expect(estChargeSousTraitance('Loyer locaux')).toBe(false);
      expect(estChargeSousTraitance('Fournitures bureau')).toBe(false);
    });
  });

  describe('genererBPF()', () => {
    const direction = { recettes: [], exploitation: [], personnel: [] };
    const poleSupport = { recettes: [], exploitation: [], personnel: [] };

    it('expose l\'identité de l\'OF saisie dans globalParams', () => {
      const bpf = genererBPF(direction, [], poleSupport, [], baseGlobalParams, ANNEE);
      expect(bpf.identite.nda).toBe('32-59-12345-59');
      expect(bpf.identite.siret).toBe('12345678901234');
      expect(bpf.identite.raisonSociale).toBe('AFERTES');
      expect(bpf.identite.anneeExercice).toBe(ANNEE);
    });

    it('ventile les produits par origine (B11/B12/B131/B132)', () => {
      const services = [makeService({
        recettes: [
          { id: 1, nom: 'OPCO Santé',                   montant: 5000 },  // B12
          { id: 2, nom: 'Subvention Région HdF',         montant: 8000 },  // B131
          { id: 3, nom: 'France Travail AIF',            montant: 2000 },  // B132
          { id: 4, nom: 'Convention entreprise Auchan',  montant: 3000 },  // B11
        ],
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], baseGlobalParams, ANNEE);
      expect(bpf.cadreB1.produits.B12.montant).toBe(60000);  // 5000 × 12
      expect(bpf.cadreB1.produits.B131.montant).toBe(96000);
      expect(bpf.cadreB1.produits.B132.montant).toBe(24000);
      expect(bpf.cadreB1.produits.B11.montant).toBe(36000);
      expect(bpf.cadreB1.totalProduits).toBe(216000);
      // B13 = somme des B131..B134
      expect(bpf.cadreB1.totalB13).toBe(120000); // 96000 + 24000
    });

    it('applique le coefficient BP global aux recettes', () => {
      const services = [makeService({
        recettes: [{ id: 1, nom: 'OPCO', montant: 1000 }],
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], { ...baseGlobalParams, coefficientBP: 80 }, ANNEE);
      expect(bpf.cadreB1.produits.B12.montant).toBeCloseTo(9600, 0); // 1000 × 12 × 0.80
    });

    it('décompose les charges en B21 sous-traitance, B22 salaires, B23 charges, B24 autres', () => {
      const services = [makeService({
        personnel: [makeFormateur({ salaire: 3000, etp: 1 })],
        exploitation: [
          { id: 1, nom: 'Vacataires intervenants',       montant: 1000 },  // B21
          { id: 2, nom: 'Loyer locaux',                  montant: 500 },   // B24
          { id: 3, nom: 'Honoraire formateur externe',   montant: 800 },   // B21
          { id: 4, nom: 'Fournitures pédagogiques',      montant: 200 },   // B24
        ],
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], baseGlobalParams, ANNEE);
      expect(bpf.cadreB2.charges.B21.montant).toBe(21600); // (1000+800)*12
      expect(bpf.cadreB2.charges.B22.montant).toBeGreaterThan(30000); // Brut formateur ≈ 36k
      expect(bpf.cadreB2.charges.B23.montant).toBeGreaterThan(0); // Charges patronales
      expect(bpf.cadreB2.charges.B24.montant).toBe(8400); // (500+200)*12
    });

    it('compte les formateurs internes uniquement (rôle formateur)', () => {
      const services = [makeService({
        personnel: [
          makeFormateur({ salaire: 3000 }),
          makeFormateur({ salaire: 2800 }),
          { id: 99, titre: 'Secrétaire', salaire: 2500, etp: 1, role: 'administratif', typeContrat: 'CDI' },
        ],
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], baseGlobalParams, ANNEE);
      expect(bpf.cadreB2.charges.B22.nbFormateurs).toBe(2);
    });

    it('calcule les heures-stagiaires depuis les promos', () => {
      const services = [makeService({
        promos: {
          arras: [
            { id: 'p1', nom: 'Promo 2026', effectifInitial: 20, abandons: { septembre: 2 }, type: 'standard' },
            { id: 'p2', nom: 'Promo 2027', effectifInitial: 15, abandons: {}, type: 'standard' },
          ],
        },
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], baseGlobalParams, ANNEE);
      // p1 actuel = 18, p2 actuel = 15 → 33 stagiaires × 1500 h = 49 500 h
      expect(bpf.cadreC.totalNbStagiaires).toBe(33);
      expect(bpf.cadreC.totalHeuresStagiaires).toBe(49500);
      expect(bpf.cadreC.heuresMoyennesParStagiaire).toBe(1500);
    });

    it('utilise les heures par défaut si service non configuré', () => {
      const services = [{
        id: 's_unknown', nom: 'X', personnel: [], recettes: [], exploitation: [],
        promos: { arras: [{ id: 'p', nom: 'P', effectifInitial: 10, abandons: {}, type: 'standard' }] },
      }];
      const params = { ...baseGlobalParams, heuresStagiairesParService: {}, heuresStagiairesDefaut: 800 };
      const bpf = genererBPF(direction, services, poleSupport, [], params, ANNEE);
      expect(bpf.cadreC.totalHeuresStagiaires).toBe(8000); // 10 × 800
    });

    it('aplatit les promos en structure filière (conteneur)', () => {
      const services = [makeService({
        promos: {
          arras: [
            { id: 'fil1', nom: 'Filière X', promos: [
              { id: 'p1', nom: 'Promo A', effectifInitial: 12, abandons: {}, type: 'standard' },
              { id: 'p2', nom: 'Promo B', effectifInitial: 8,  abandons: {}, type: 'standard' },
            ]},
          ],
        },
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], baseGlobalParams, ANNEE);
      expect(bpf.cadreC.totalNbStagiaires).toBe(20);
    });

    it('ventile les stagiaires/heures par origine au prorata des recettes', () => {
      const services = [makeService({
        recettes: [
          { id: 1, nom: 'OPCO',   montant: 5000 }, // 50 % du total (60k)
          { id: 2, nom: 'Région', montant: 5000 }, // 50 %
        ],
        promos: { arras: [{ id: 'p', nom: 'P', effectifInitial: 100, abandons: {}, type: 'standard' }] },
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], baseGlobalParams, ANNEE);
      expect(bpf.cadreC.stagiairesParOrigine.B12).toBe(50);
      expect(bpf.cadreC.stagiairesParOrigine.B131).toBe(50);
      expect(bpf.cadreC.heuresParOrigine.B12).toBe(75000); // 100 × 1500 × 0.5
      expect(bpf.cadreC.heuresParOrigine.B131).toBe(75000);
    });

    it('génère des alertes si NDA/SIRET/raison sociale manquants', () => {
      const params = { ...baseGlobalParams, bpfIdentite: {} };
      const services = [makeService({
        recettes: [{ id: 1, nom: 'OPCO', montant: 1000 }],
        personnel: [makeFormateur()],
        promos: { arras: [{ id: 'p', nom: 'P', effectifInitial: 10, abandons: {}, type: 'standard' }] },
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], params, ANNEE);
      const dangers = bpf.alertes.filter(a => a.niveau === 'danger');
      expect(dangers.length).toBe(3);
      expect(dangers.some(a => /NDA/i.test(a.message))).toBe(true);
      expect(dangers.some(a => /SIRET/i.test(a.message))).toBe(true);
      expect(bpf.isValide).toBe(false);
    });

    it('isValide = true quand identité complète et données cohérentes', () => {
      const services = [makeService({
        recettes: [{ id: 1, nom: 'OPCO', montant: 5000 }],
        personnel: [makeFormateur()],
        promos: { arras: [{ id: 'p', nom: 'P', effectifInitial: 20, abandons: {}, type: 'standard' }] },
      })];
      const bpf = genererBPF(direction, services, poleSupport, [], baseGlobalParams, ANNEE);
      expect(bpf.isValide).toBe(true);
    });

    it('robuste face à entrées vides ou null', () => {
      expect(() => genererBPF(null, null, null, null, {}, ANNEE)).not.toThrow();
      const bpf = genererBPF(null, [], null, [], {}, ANNEE);
      expect(bpf.cadreB1.totalProduits).toBe(0);
      expect(bpf.cadreB2.totalCharges).toBe(0);
      expect(bpf.cadreC.totalNbStagiaires).toBe(0);
    });

    it('inclut les recettes Direction et Pôle Support', () => {
      const dirWithRecettes = { recettes: [{ id: 1, nom: 'Subvention État DGEFP', montant: 2000 }] };
      const psWithRecettes  = { recettes: [{ id: 1, nom: 'OPCO', montant: 1000 }] };
      const bpf = genererBPF(dirWithRecettes, [], psWithRecettes, [], baseGlobalParams, ANNEE);
      expect(bpf.cadreB1.produits.B133.montant).toBe(24000); // État → B133
      expect(bpf.cadreB1.produits.B12.montant).toBe(12000);  // OPCO → B12
    });

    it('inclut les formateurs du Pool RH dans B22', () => {
      const poolRH = [makeFormateur({ salaire: 3500, etp: 1 })];
      const bpf = genererBPF(direction, [], poleSupport, poolRH, baseGlobalParams, ANNEE);
      expect(bpf.cadreB2.charges.B22.nbFormateurs).toBe(1);
      expect(bpf.cadreB2.charges.B22.montant).toBeGreaterThan(40000);
    });
  });

  describe('recommendationBPF()', () => {
    it('alerte sur erreurs bloquantes (NDA manquant)', () => {
      const bpf = genererBPF(null, [], null, [], { bpfIdentite: {} }, ANNEE);
      const r = recommendationBPF(bpf);
      expect(r).toMatch(/✕.*bloquante/i);
      expect(r).toMatch(/L\.6352-11/);
    });

    it('signale les warnings de cohérence', () => {
      const params = baseGlobalParams; // identité OK mais aucune donnée → warnings
      const bpf = genererBPF(null, [], null, [], params, ANNEE);
      const r = recommendationBPF(bpf);
      expect(r).toMatch(/⚠.*cohérence/i);
    });

    it('confirme la validité quand tout est OK', () => {
      const services = [makeService({
        recettes: [{ id: 1, nom: 'OPCO', montant: 5000 }],
        personnel: [makeFormateur()],
        promos: { arras: [{ id: 'p', nom: 'P', effectifInitial: 20, abandons: {}, type: 'standard' }] },
      })];
      const bpf = genererBPF({ recettes: [], personnel: [], exploitation: [] }, services, { recettes: [], personnel: [], exploitation: [] }, [], baseGlobalParams, ANNEE);
      const r = recommendationBPF(bpf);
      expect(r).toMatch(/✓.*prêt/i);
      expect(r).toMatch(/30 avril/);
    });
  });
});
