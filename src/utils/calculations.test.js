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
  calculerTauxCharges,
  calculerTableauAmortissement,
  calculerAmortissementEtInterets,
  calculerBudgetDirection,
  calculerBudgetLieu,
  calculerProvisions,
  calculerBFR,
  calculerSynthese3Ans,
  calculerBudgetAnnuelMensuel,
} from './calculations';
import { calculerStatsFormation, SMIC_MENSUEL, CHARGES_PATRONALES, TAUX_CHARGES_APPRENTI } from './constants';

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
    it('borne entre 0 et 100', () => {
      expect(validerETP('1.5')).toBe(1.5);
      expect(validerETP('150')).toBe(100);
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

    it('applique tauxChargesManuel en priorité sur Fillon', () => {
      // Salaire bas → Fillon s'appliquerait normalement, mais tauxChargesManuel = 20 l'écrase
      const basSmicSalaire = SMIC_MENSUEL * 0.9; // sous le SMIC → Fillon maximal normalement
      const avecFillon = calculerSalaireAnnuel(basSmicSalaire, 1, false, 'CDI');
      const avecManuel = calculerSalaireAnnuel(basSmicSalaire, 1, false, 'CDI', 20);
      expect(avecManuel.tauxCharges).toBeCloseTo(0.20, 5);
      expect(avecManuel.tauxChargesAuto).toBe(false);
      expect(avecFillon.tauxChargesAuto).toBe(true);
      expect(avecFillon.tauxCharges).toBeLessThan(avecManuel.tauxCharges);
    });

    it('apprentissage : taux de charges réduit (~12%)', () => {
      const result = calculerSalaireAnnuel(1500, 1, false, 'Apprentissage');
      expect(result.tauxCharges).toBeCloseTo(TAUX_CHARGES_APPRENTI, 5);
    });

    it('stage : taux de charges 0%', () => {
      const result = calculerSalaireAnnuel(600, 1, false, 'Stage');
      expect(result.tauxCharges).toBe(0);
      expect(result.charges).toBe(0);
    });

    it('prime ponctuelle : augmente le total annuel du coût employeur prime', () => {
      // Sans prime
      const sansPrime = calculerSalaireAnnuel(3000, 1, false, 'CDI', null, null, null, 0);
      // Avec prime de 500 € bruts en juin (mois 6)
      const avecPrime = calculerSalaireAnnuel(3000, 1, false, 'CDI', null, null, 6, 500);
      // primeBrute = 500 * 1 ETP = 500
      expect(avecPrime.primeBrute).toBeCloseTo(500, 2);
      // primeEmployeur = 500 * (1 + tauxCharges)
      expect(avecPrime.primeEmployeur).toBeGreaterThan(500);
      expect(avecPrime.moisPrime).toBe(6);
      // Le total inclut la prime
      expect(avecPrime.total).toBeCloseTo(sansPrime.total + avecPrime.primeEmployeur, 2);
    });

    it('prime sans moisPrime défini : prime nulle', () => {
      const result = calculerSalaireAnnuel(3000, 1, false, 'CDI', null, null, null, 1000);
      expect(result.primeBrute).toBe(0);
      expect(result.primeEmployeur).toBe(0);
      expect(result.total).toBeCloseTo(calculerSalaireAnnuel(3000, 1, false).total, 2);
    });

    it('prime proratisée par ETP', () => {
      const plein = calculerSalaireAnnuel(3000, 1, false, 'CDI', null, null, 12, 600);
      const miTemps = calculerSalaireAnnuel(3000, 0.5, false, 'CDI', null, null, 12, 600);
      expect(miTemps.primeBrute).toBeCloseTo(plein.primeBrute / 2, 2);
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
    unites: 6,
    tauxActivite: 95,
    investissements: {
      bienImmo: { montant: 300000, duree: 25, taux: 2 },
      vehicule: { montant: 30000, duree: 5, taux: 3 }
    },
    exploitation: [
      { id: 1, nom: 'Alimentation', montant: 2000 },
      { id: 2, nom: 'Carburant', montant: 500 }
    ],
    recettes: [
      { id: 1, nom: 'Subvention', montant: 8000 }
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
      expect(result.unitesAnnuelles).toBeCloseTo(6 * 0.95 * 365, 0); // ~2080
      expect(result.coutUnite).toBeGreaterThan(0);
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
    unites: 6,
    tauxActivite: 90,
    investissements: {
      bienImmo: { montant: 200000, duree: 20, taux: 2 }
    },
    exploitation: [
      { id: 1, nom: 'Alimentation', montant: 1500 }
    ],
    recettes: [
      { id: 1, nom: 'Subvention', montant: 5000 }
    ],
    personnel: [
      { id: 1, titre: 'Éducateur', etp: 1, salaire: 2500, segur: true }
    ]
  }];

  const mockGlobalParams = {
    augmentationAnnuelle: 2.5,
    provisions: [
      { id: 'conges', nom: 'Congés payés', baseCalcul: 'salaires', taux: 10 },
      { id: 'reparations', nom: 'Grosses réparations', baseCalcul: 'investissements', taux: 2 },
      { id: 'creances', nom: 'Créances douteuses', baseCalcul: 'chiffre_affaires', taux: 1 }
    ],
    fondRoulement: [],
    stocksValeur: 0,
    delaiPaiementClients: 30,
    delaiPaiementFournisseurs: 30
  };

  describe('calculerProvisions', () => {
    it('calcule les provisions correctement', () => {
      const result = calculerProvisions(mockDirection, mockLieux, mockGlobalParams);

      // Nouvelle structure avec details
      expect(result.details).toBeDefined();
      expect(result.details.length).toBe(3);
      expect(result.details[0].nom).toBe('Congés payés');
      expect(result.details[0].montant).toBeGreaterThan(0);
      expect(result.total).toBe(
        result.details.reduce((sum, p) => sum + p.montant, 0)
      );
    });
  });

  describe('calculerBFR', () => {
    it('calcule le BFR correctement', () => {
      const result = calculerBFR(mockDirection, mockLieux, mockGlobalParams);

      expect(result.stocks).toBe(0); // stocksValeur = 0 dans mockGlobalParams
      expect(result.creancesClients).toBeGreaterThanOrEqual(0);
      expect(result.dettesFournisseurs).toBeGreaterThan(0);
      expect(result.bfr).toBe(
        result.stocks + result.creancesClients - result.dettesFournisseurs
      );
      // chiffreAffaires = recettes des services (5000 * 12 = 60000)
      expect(result.chiffreAffaires).toBe(60000);
    });

    it('calcule le BFR en jours', () => {
      const result = calculerBFR(mockDirection, mockLieux, mockGlobalParams);

      if (result.chiffreAffaires > 0) {
        const expectedBfrEnJours = (result.bfr / result.chiffreAffaires) * 365;
        expect(result.bfrEnJours).toBeCloseTo(expectedBfrEnJours, 2);
      } else {
        expect(result.bfrEnJours).toBe(0);
      }
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

    it('calcule les détails par service', () => {
      const result = calculerSynthese3Ans(mockDirection, mockLieux, mockGlobalParams);

      expect(result[0].detailsServices.length).toBe(1);
      expect(result[0].detailsServices[0].nom).toBe('Lieu 1');
      expect(result[0].detailsServices[0].coutUnite).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================
// Tests saisonnalité des primes & taxe sur les salaires
// ============================================

describe('Saisonnalité des primes et taxe sur les salaires', () => {
  const mockDirection = {
    personnel: [
      { id: 1, titre: 'Directeur', etp: 1, salaire: 4500, segur: false, moisPrime: 6, montantPrime: 1000 },
    ],
    exploitation: [],
    recettes: [],
  };
  const mockServices = [];
  const mockGlobalParamsBase = {
    montantSegurETP: 238,
    taxeSalaires: false,
    tauxTaxeSalaires: 4.25,
    provisions: [],
    fondRoulement: [],
    stocksValeur: 0,
    delaiPaiementClients: 30,
    delaiPaiementFournisseurs: 30,
  };

  it('calculerBudgetAnnuelMensuel : pic de prime visible en mois 6 (juin)', () => {
    const result = calculerBudgetAnnuelMensuel(mockDirection, mockServices, mockGlobalParamsBase);
    const moisJuin = result.mois[5]; // index 5 = juin
    const moisJanv = result.mois[0];
    // Juin doit avoir un salaire mensuel plus élevé (prime employeur)
    expect(moisJuin.salaires).toBeGreaterThan(moisJanv.salaires);
  });

  it('calculerBudgetAnnuelMensuel : somme mensuelle des salaires = total annuel salaires', () => {
    const result = calculerBudgetAnnuelMensuel(mockDirection, mockServices, mockGlobalParamsBase);
    const sommeMensuelle = result.mois.reduce((s, m) => s + m.salaires, 0);
    expect(sommeMensuelle).toBeCloseTo(result.salaires, 0);
  });

  it('taxe sur les salaires : inactive par défaut — taxeSalaires = 0', () => {
    const result = calculerBudgetAnnuelMensuel(mockDirection, mockServices, mockGlobalParamsBase);
    expect(result.taxeSalaires).toBe(0);
  });

  it('taxe sur les salaires : active à 4,25 % — taxeSalaires > 0 et cohérent', () => {
    const paramsAvecTaxe = { ...mockGlobalParamsBase, taxeSalaires: true, tauxTaxeSalaires: 4.25 };
    const result = calculerBudgetAnnuelMensuel(mockDirection, mockServices, paramsAvecTaxe);
    expect(result.taxeSalaires).toBeCloseTo(result.salaires * 0.0425, 0);
    expect(result.totalAnnuel).toBeGreaterThan(result.salaires + result.exploitation);
  });

  it('taxe sur les salaires : impacte uniformément chaque mois (taxeSalaires/12)', () => {
    const paramsAvecTaxe = { ...mockGlobalParamsBase, taxeSalaires: true, tauxTaxeSalaires: 4.25 };
    const result = calculerBudgetAnnuelMensuel(mockDirection, mockServices, paramsAvecTaxe);
    const taxeMensuelle = result.taxeSalaires / 12;
    result.mois.forEach(m => {
      expect(m.taxeSalaires).toBeCloseTo(taxeMensuelle, 2);
    });
  });
});

// ============================================
// Tests allègement Fillon
// ============================================

describe('Allègement Fillon (calculerTauxCharges)', () => {
  it('applique le taux plein 42% pour les hauts salaires', () => {
    // Salaire > 1.6 × SMIC → pas d'allègement
    const salaire = SMIC_MENSUEL * 12 * 2; // 200% du SMIC annuel
    const taux = calculerTauxCharges(salaire, 1, 'CDI');
    expect(taux).toBeCloseTo(CHARGES_PATRONALES, 5);
  });

  it('réduit le taux pour les bas salaires (< 1.6 SMIC)', () => {
    const salaireBasSmic = SMIC_MENSUEL * 12 * 1.0; // 100% du SMIC
    const taux = calculerTauxCharges(salaireBasSmic, 1, 'CDI');
    expect(taux).toBeLessThan(CHARGES_PATRONALES);
    expect(taux).toBeGreaterThanOrEqual(0);
  });

  it('taux est 0 pour un stage', () => {
    expect(calculerTauxCharges(2000, 1, 'Stage')).toBe(0);
    expect(calculerTauxCharges(2000, 1, 'Stagiaire')).toBe(0);
  });

  it('taux réduit pour apprentissage et contrat pro', () => {
    expect(calculerTauxCharges(1600, 1, 'Apprentissage')).toBeCloseTo(TAUX_CHARGES_APPRENTI, 5);
    expect(calculerTauxCharges(1600, 1, 'contrat_pro')).toBeCloseTo(TAUX_CHARGES_APPRENTI, 5);
  });

  it('taux non négatif même pour salaire très bas', () => {
    const taux = calculerTauxCharges(100, 1, 'CDI');
    expect(taux).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// Tests calculerStatsFormation (transversalité)
// ============================================

describe('calculerStatsFormation', () => {
  it('retourne les unités si pas de promos', () => {
    const service = { unites: 15 };
    const result = calculerStatsFormation(service);
    expect(result.totalEtudiants).toBe(15);
    expect(result.totalAbandons).toBe(0);
    expect(result.effectifActuel).toBe(15);
  });

  it('compte les étudiants en structure plate (promos directes)', () => {
    const service = {
      promos: {
        annee1: [
          { effectifInitial: 20, abandons: { janvier: 1, fevrier: 2 } },
          { effectifInitial: 15, abandons: {} },
        ]
      }
    };
    const result = calculerStatsFormation(service);
    expect(result.totalEtudiants).toBe(35);
    expect(result.totalAbandons).toBe(3);
    expect(result.effectifActuel).toBe(32);
  });

  it('compte les étudiants en structure filière (promos imbriquées)', () => {
    const service = {
      promos: {
        annee1: [
          {
            promos: [
              { effectifInitial: 10, abandons: { janvier: 1 } },
              { effectifInitial: 12, abandons: {} },
            ]
          }
        ]
      }
    };
    const result = calculerStatsFormation(service);
    expect(result.totalEtudiants).toBe(22);
    expect(result.totalAbandons).toBe(1);
    expect(result.effectifActuel).toBe(21);
  });

  it('ignore les items null ou malformés sans planter', () => {
    const service = {
      promos: {
        annee1: [null, undefined, { effectifInitial: 5, abandons: {} }]
      }
    };
    expect(() => calculerStatsFormation(service)).not.toThrow();
    const result = calculerStatsFormation(service);
    expect(result.totalEtudiants).toBe(5);
  });

  it('gère les abandons manquants ou null', () => {
    const service = {
      promos: {
        annee1: [
          { effectifInitial: 10 },
          { effectifInitial: 8, abandons: { janvier: null, fevrier: undefined } },
        ]
      }
    };
    expect(() => calculerStatsFormation(service)).not.toThrow();
    const result = calculerStatsFormation(service);
    expect(result.totalEtudiants).toBe(18);
    expect(result.totalAbandons).toBe(0);
  });
});
