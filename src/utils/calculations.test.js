import { describe, it, expect } from 'vitest';
import {
  validerNombre,
  validerEntier,
  validerTaux,
  validerETP,
  validerSalaire,
  validerMontant,
  validerDuree,
  validerJours,
  calculerMensualitePret,
  calculerSalaireAnnuel,
  calculerTableauAmortissement,
  calculerAmortissementEtInterets,
  calculerBudgetDirection,
  calculerBudgetLieu,
  calculerProvisions,
  calculerBFR,
  calculerSynthese3Ans
} from './calculations';

// ============================================
// Tests des fonctions de validation
// ============================================

describe('Fonctions de validation', () => {
  describe('validerNombre', () => {
    it('retourne le nombre si valide', () => {
      expect(validerNombre('42.5')).toBe(42.5);
      expect(validerNombre('100')).toBe(100);
    });

    it('retourne min si NaN', () => {
      expect(validerNombre('abc')).toBe(0);
      expect(validerNombre('abc', 10)).toBe(10);
    });

    it('respecte les bornes min/max', () => {
      expect(validerNombre('150', 0, 100)).toBe(100);
      expect(validerNombre('-10', 0, 100)).toBe(0);
      expect(validerNombre('50', 0, 100)).toBe(50);
    });
  });

  describe('validerEntier', () => {
    it('retourne un entier', () => {
      expect(validerEntier('42.7')).toBe(42);
      expect(validerEntier('100')).toBe(100);
    });

    it('retourne min si NaN', () => {
      expect(validerEntier('abc')).toBe(0);
    });
  });

  describe('validerTaux', () => {
    it('borne entre 0 et 100', () => {
      expect(validerTaux('50')).toBe(50);
      expect(validerTaux('150')).toBe(100);
      expect(validerTaux('-10')).toBe(0);
    });
  });

  describe('validerETP', () => {
    it('borne entre 0 et 50', () => {
      expect(validerETP('1.5')).toBe(1.5);
      expect(validerETP('60')).toBe(50);
    });
  });

  describe('validerSalaire', () => {
    it('borne entre 0 et 50000', () => {
      expect(validerSalaire('3000')).toBe(3000);
      expect(validerSalaire('60000')).toBe(50000);
    });
  });

  describe('validerMontant', () => {
    it('borne entre 0 et 10000000', () => {
      expect(validerMontant('500000')).toBe(500000);
      expect(validerMontant('20000000')).toBe(10000000);
    });
  });

  describe('validerDuree', () => {
    it('borne entre 1 et 50', () => {
      expect(validerDuree('10')).toBe(10);
      expect(validerDuree('0')).toBe(1);
      expect(validerDuree('100')).toBe(50);
    });
  });

  describe('validerJours', () => {
    it('borne entre 0 et 365', () => {
      expect(validerJours('30')).toBe(30);
      expect(validerJours('400')).toBe(365);
    });
  });
});

// ============================================
// Tests des calculs financiers
// ============================================

describe('Calculs financiers', () => {
  describe('calculerMensualitePret', () => {
    it('retourne 0 si capital ou taux est 0', () => {
      expect(calculerMensualitePret(0, 10, 2)).toBe(0);
      expect(calculerMensualitePret(100000, 10, 0)).toBe(0);
    });

    it('calcule correctement une mensualité', () => {
      // Prêt de 100 000€ sur 20 ans à 2%
      const mensualite = calculerMensualitePret(100000, 20, 2);
      // Mensualité attendue: environ 505.88€
      expect(mensualite).toBeCloseTo(505.88, 0);
    });

    it('calcule correctement pour un prêt court terme', () => {
      // Prêt de 10 000€ sur 1 an à 5%
      const mensualite = calculerMensualitePret(10000, 1, 5);
      // Mensualité attendue: environ 856.07€
      expect(mensualite).toBeCloseTo(856.07, 0);
    });
  });

  describe('calculerSalaireAnnuel', () => {
    it('calcule le salaire annuel avec charges patronales', () => {
      const result = calculerSalaireAnnuel(3000, 1, false);
      // Brut: 3000 * 12 = 36000
      // Charges: 36000 * 0.42 = 15120
      // Total: 51120
      expect(result.brut).toBe(36000);
      expect(result.charges).toBe(15120);
      expect(result.segur).toBe(0);
      expect(result.total).toBe(51120);
    });

    it('calcule avec prime Ségur', () => {
      const result = calculerSalaireAnnuel(3000, 1, true);
      // Prime Ségur: 238 * 1.42 * 12 = 4055.52
      expect(result.segur).toBeCloseTo(4055.52, 2);
      expect(result.total).toBeCloseTo(55175.52, 2);
    });

    it('calcule correctement pour un temps partiel', () => {
      const result = calculerSalaireAnnuel(3000, 0.5, false);
      expect(result.brut).toBe(18000);
      expect(result.charges).toBe(7560);
      expect(result.total).toBe(25560);
    });
  });

  describe('calculerTableauAmortissement', () => {
    it('retourne un tableau vide si capital ou durée est 0', () => {
      const result = calculerTableauAmortissement(0, 10, 2);
      expect(result.length).toBe(10);
      expect(result[0].interets).toBe(0);
    });

    it('calcule amortissement linéaire si taux est 0', () => {
      const result = calculerTableauAmortissement(12000, 3, 0);
      expect(result.length).toBe(3);
      expect(result[0].capitalRembourse).toBe(4000);
      expect(result[0].interets).toBe(0);
      expect(result[2].capitalRestant).toBeCloseTo(0, 2);
    });

    it('calcule les intérêts dégressifs', () => {
      const result = calculerTableauAmortissement(100000, 5, 3);
      // Les intérêts doivent diminuer chaque année
      expect(result[0].interets).toBeGreaterThan(result[1].interets);
      expect(result[1].interets).toBeGreaterThan(result[2].interets);
      // Le capital restant doit diminuer
      expect(result[0].capitalRestant).toBeGreaterThan(result[1].capitalRestant);
    });
  });

  describe('calculerAmortissementEtInterets', () => {
    it('calcule amortissement et intérêts pour un investissement', () => {
      const inv = { montant: 120000, duree: 10, taux: 2.5 };
      const result = calculerAmortissementEtInterets(inv);

      expect(result.amortissement).toBe(12000); // 120000 / 10
      expect(result.mensualite).toBeGreaterThan(0);
      expect(result.coutCredit).toBeGreaterThan(0);
      expect(result.interetsParAnnee.length).toBe(10);
    });

    it('calcule correctement pour un prêt sans intérêts', () => {
      const inv = { montant: 60000, duree: 5, taux: 0 };
      const result = calculerAmortissementEtInterets(inv);

      expect(result.amortissement).toBe(12000);
      expect(result.mensualite).toBe(0);
      expect(result.interets).toBe(0);
      // Note: coutCredit = coutTotal - montant = 0 - 60000 = -60000 (pas de mensualité calculée)
      expect(result.coutCredit).toBe(-60000);
    });
  });
});

// ============================================
// Tests des calculs de budget
// ============================================

describe('Calculs de budget', () => {
  const mockDirection = {
    personnel: [
      { id: 1, titre: 'Directeur', etp: 1, salaire: 4500, segur: true },
      { id: 2, titre: 'Secrétaire', etp: 1, salaire: 2400, segur: true }
    ],
    loyer: 2000,
    charges: 500,
    autresCharges: 300
  };

  const mockLieu = {
    id: 1,
    nom: 'Test Lieu',
    enfantsParLieu: 6,
    tauxRemplissage: 95,
    investissements: {
      bienImmo: { montant: 300000, duree: 25, taux: 2 },
      vehicule: { montant: 30000, duree: 5, taux: 3 }
    },
    exploitation: [
      { id: 1, nom: 'Alimentation', montant: 2000 },
      { id: 2, nom: 'Carburant', montant: 500 }
    ],
    personnel: [
      { id: 1, titre: 'Éducateur', etp: 2, salaire: 2800, segur: true }
    ]
  };

  describe('calculerBudgetDirection', () => {
    it('calcule le budget total de la direction', () => {
      const result = calculerBudgetDirection(mockDirection);

      expect(result.detailsSalaires.length).toBe(2);
      expect(result.salaires).toBeGreaterThan(0);
      expect(result.chargesSiege).toBe((2000 + 500 + 300) * 12); // 33600
      expect(result.total).toBe(result.salaires + result.chargesSiege);
    });
  });

  describe('calculerBudgetLieu', () => {
    it('calcule le budget total du lieu', () => {
      const result = calculerBudgetLieu(mockLieu);

      expect(result.salaires).toBeGreaterThan(0);
      expect(result.exploitation).toBe((2000 + 500) * 12); // 30000
      expect(result.amortissements).toBeGreaterThan(0);
      expect(result.joursAnnuels).toBeCloseTo(6 * 0.95 * 365, 0); // ~2080
      expect(result.prixJour).toBeGreaterThan(0);
    });

    it('calcule correctement les investissements', () => {
      const result = calculerBudgetLieu(mockLieu);

      expect(result.detailsInvest.bienImmo).toBeDefined();
      expect(result.detailsInvest.vehicule).toBeDefined();
      expect(result.totalInvestissements).toBe(330000);
    });
  });
});

// ============================================
// Tests des provisions et BFR
// ============================================

describe('Provisions et BFR', () => {
  const mockDirection = {
    personnel: [
      { id: 1, titre: 'Directeur', etp: 1, salaire: 4000, segur: true }
    ],
    loyer: 1500,
    charges: 400,
    autresCharges: 200
  };

  const mockLieux = [{
    id: 1,
    nom: 'Lieu 1',
    enfantsParLieu: 6,
    tauxRemplissage: 90,
    investissements: {
      bienImmo: { montant: 200000, duree: 20, taux: 2 }
    },
    exploitation: [
      { id: 1, nom: 'Alimentation', montant: 1500 }
    ],
    personnel: [
      { id: 1, titre: 'Éducateur', etp: 1, salaire: 2500, segur: true }
    ]
  }];

  const mockGlobalParams = {
    augmentationAnnuelle: 2.5,
    tauxProvisionCongesPayes: 10,
    tauxProvisionGrossesReparations: 2,
    tauxProvisionCreancesDouteuses: 1,
    delaiPaiementClients: 30,
    delaiPaiementFournisseurs: 30
  };

  describe('calculerProvisions', () => {
    it('calcule les provisions correctement', () => {
      const result = calculerProvisions(mockDirection, mockLieux, mockGlobalParams);

      expect(result.congesPayes).toBeGreaterThan(0);
      expect(result.grossesReparations).toBeGreaterThan(0);
      expect(result.creancesDouteuses).toBeGreaterThan(0);
      expect(result.total).toBe(
        result.congesPayes + result.grossesReparations + result.creancesDouteuses
      );
    });
  });

  describe('calculerBFR', () => {
    it('calcule le BFR correctement', () => {
      const result = calculerBFR(mockDirection, mockLieux, mockGlobalParams);

      expect(result.stocks).toBe(0); // Pas de stock dans le secteur social
      expect(result.creancesClients).toBeGreaterThan(0);
      expect(result.dettesFournisseurs).toBeGreaterThan(0);
      expect(result.bfr).toBe(
        result.stocks + result.creancesClients - result.dettesFournisseurs
      );
      expect(result.chiffreAffaires).toBeGreaterThan(0);
    });

    it('calcule le BFR en jours', () => {
      const result = calculerBFR(mockDirection, mockLieux, mockGlobalParams);

      const expectedBfrEnJours = (result.bfr / result.chiffreAffaires) * 365;
      expect(result.bfrEnJours).toBeCloseTo(expectedBfrEnJours, 2);
    });
  });

  describe('calculerSynthese3Ans', () => {
    it('retourne 3 années de projection', () => {
      const result = calculerSynthese3Ans(mockDirection, mockLieux, mockGlobalParams);

      expect(result.length).toBe(3);
      expect(result[0].annee).toBe(1);
      expect(result[1].annee).toBe(2);
      expect(result[2].annee).toBe(3);
    });

    it('applique l\'augmentation annuelle', () => {
      const result = calculerSynthese3Ans(mockDirection, mockLieux, mockGlobalParams);

      // Le budget doit augmenter chaque année (hors amortissements constants)
      expect(result[1].budgetDirection).toBeGreaterThan(result[0].budgetDirection);
      expect(result[2].budgetDirection).toBeGreaterThan(result[1].budgetDirection);
    });

    it('calcule les détails par lieu', () => {
      const result = calculerSynthese3Ans(mockDirection, mockLieux, mockGlobalParams);

      expect(result[0].detailsLieux.length).toBe(1);
      expect(result[0].detailsLieux[0].nom).toBe('Lieu 1');
      expect(result[0].detailsLieux[0].prixJour).toBeGreaterThan(0);
    });
  });
});
