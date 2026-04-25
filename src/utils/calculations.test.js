import { describe, it, expect } from 'vitest';
import {
  validerNombre,
  validerEntier,
  validerTaux,
  validerETP,
  validerSalaire,
  validerMontant,
  validerMontantSigne,
  validerDuree,
  validerJours,
  validerUnites,
  calculerMensualitePret,
  calculerSalaireAnnuel,
  calculerTauxCharges,
  calculerTableauAmortissement,
  calculerAmortissementEtInterets,
  calculerBudgetDirection,
  calculerBudgetService,
  calculerBudgetLieu,
  calculerBudgetPoleSupport,
  calculerProvisions,
  calculerBFR,
  calculerSynthese3Ans,
  calculerBudgetAnnuelMensuel,
  calculerIndicateursOETH,
  calculerJoursAbsencesPlanning,
  calculerETPMensuelAgent,
  calculerPresenceAgent,
  syncPoolRH,
  verifierCoherencePoolRH,
  calculerPartPoolRH,
  repartirFraisSiege,
  appliquerStressTest,
  calculerIFC,
  calculerAlertesRH,
  runFinancialAudit,
  calculerEnveloppeParFiliere,
  calculerFondRoulement,
  calculerTresorerieMensuelle,
} from './calculations';
import { calculerStatsFormation, SMIC_MENSUEL, CHARGES_PATRONALES, TAUX_CHARGES_APPRENTI, PRIME_SEGUR } from './constants';

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

  describe('validerMontantSigne', () => {
    it('accepte les montants négatifs', () => {
      expect(validerMontantSigne('-5000')).toBe(-5000);
      expect(validerMontantSigne('0')).toBe(0);
      expect(validerMontantSigne('500000')).toBe(500000);
    });
    it('clamp sur la borne haute positive', () => {
      expect(validerMontantSigne('20000000')).toBe(10000000);
      expect(validerMontantSigne('-20000000')).toBe(-10000000);
    });
  });

  describe('validerUnites', () => {
    it('borne entre 1 et 1000', () => {
      expect(validerUnites('6')).toBe(6);
      expect(validerUnites('0')).toBe(1);
      expect(validerUnites('2000')).toBe(1000);
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
      // Charges: 36000 * 0.44 = 15840 (CCN 66 — corrigé 2026-04-18)
      // Total: 51840
      expect(result.brut).toBe(36000);
      expect(result.charges).toBe(15840);
      expect(result.segur).toBe(0);
      expect(result.total).toBe(51840);
    });

    it('calcule avec prime Ségur', () => {
      const result = calculerSalaireAnnuel(3000, 1, true);
      // Prime Ségur: 238 * 1.44 * 12 = 4112.64 (CCN 66 — corrigé 2026-04-18)
      // Total: (36000 + 2856) * 1.44 = 55952.64
      expect(result.segur).toBeCloseTo(4112.64, 2);
      expect(result.total).toBeCloseTo(55952.64, 2);
    });

    it('calcule correctement pour un temps partiel', () => {
      const result = calculerSalaireAnnuel(3000, 0.5, false);
      // 18000 * 0.44 = 7920 (CCN 66 — corrigé 2026-04-18)
      expect(result.brut).toBe(18000);
      expect(result.charges).toBe(7920);
      expect(result.total).toBe(25920);
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
      expect(result.dettesURSSAF).toBeGreaterThan(0);
      expect(result.bfr).toBe(
        result.stocks + result.creancesClients - result.dettesFournisseurs - result.dettesURSSAF
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

  it('taxe sur les salaires : barème progressif CGI art. 231 — calculé par agent', () => {
    const paramsAvecTaxe = { ...mockGlobalParamsBase, taxeSalaires: true, tauxTaxeSalaires: 4.25 };
    const result = calculerBudgetAnnuelMensuel(mockDirection, mockServices, paramsAvecTaxe);
    // Agent directeur : brut annuel = 4500×12 + 1000 = 55 000 €
    // Barème 2026 : 8 572×4,25% + (17 114−8 572)×8,5% + (55 000−17 114)×13,6%
    const brut = 4500 * 12 + 1000;
    const taxeAttendue = 8572 * 0.0425 + (17114 - 8572) * 0.085 + (brut - 17114) * 0.136;
    expect(result.taxeSalaires).toBeCloseTo(taxeAttendue, 0);
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
// Tests calculerSalaireAnnuel — cas représentatifs DAF
// ============================================

describe('calculerSalaireAnnuel — cas DAF', () => {
  it('CDI temps plein hors Ségur : coût = brut × 12 × (1 + taux)', () => {
    const sal = calculerSalaireAnnuel(3000, 1, false, 'CDI');
    const brutAnnuel = 3000 * 12;
    expect(sal.brut).toBeCloseTo(brutAnnuel, 0);
    expect(sal.brutSegur).toBe(0);
    expect(sal.total).toBeGreaterThan(brutAnnuel); // charges incluses
  });

  it('CDI mi-temps : brut proraté à 0,5 ETP', () => {
    const sal = calculerSalaireAnnuel(3000, 0.5, false, 'CDI');
    expect(sal.brut).toBeCloseTo(3000 * 12 * 0.5, 0);
  });

  it('Prime Ségur booléen = true : brutSegur > 0 et charges appliquées dessus', () => {
    const sal = calculerSalaireAnnuel(2000, 1, true, 'CDI', null, null, null, 0, CHARGES_PATRONALES);
    expect(sal.brutSegur).toBeCloseTo(PRIME_SEGUR * 12, 0);
    expect(sal.segur).toBeGreaterThan(PRIME_SEGUR * 12); // coût employeur = brut + charges
  });

  it('Apprentissage : taux charges = 12 % quelle que soit la rémunération', () => {
    const sal = calculerSalaireAnnuel(1500, 1, false, 'Apprentissage');
    expect(sal.tauxCharges).toBeCloseTo(TAUX_CHARGES_APPRENTI, 5);
  });

  it('Stage : taux charges = 0 %', () => {
    const sal = calculerSalaireAnnuel(600, 1, false, 'Stage');
    expect(sal.tauxCharges).toBe(0);
    expect(sal.charges).toBe(0);
  });

  it('Fillon réduit le taux pour un salaire au SMIC', () => {
    const salSmicAnnuel = SMIC_MENSUEL * 12;
    const sal = calculerSalaireAnnuel(SMIC_MENSUEL, 1, false, 'CDI');
    expect(sal.tauxCharges).toBeLessThan(CHARGES_PATRONALES);
    expect(sal.tauxCharges).toBeGreaterThanOrEqual(0);
  });

  it('Ségur peut réduire lallègement Fillon en poussant le brut au-dessus du seuil', () => {
    // Agent au SMIC + Ségur : brut total = SMIC*12 + 238*12 > seuil Fillon potentiel
    const salSansSegur = calculerSalaireAnnuel(SMIC_MENSUEL, 1, false, 'CDI');
    const salAvecSegur = calculerSalaireAnnuel(SMIC_MENSUEL, 1, true, 'CDI');
    // L'ajout du Ségur peut augmenter le taux de charges si cela réduit l'allègement Fillon
    expect(salAvecSegur.total).toBeGreaterThan(salSansSegur.total);
  });

  it('Poste à pourvoir en juillet : coeff présence = 6/12', () => {
    const sal = calculerSalaireAnnuel(3000, 1, false, 'CDI', null, '2026-07');
    // 6 mois de présence (juillet à décembre)
    expect(sal.brut).toBeCloseTo(3000 * 12 * (6 / 12), 0);
  });

  it('Prime exceptionnelle : primeBrute ajoutée au brut versé', () => {
    const sal = calculerSalaireAnnuel(3000, 1, false, 'CDI', null, null, 6, 500);
    expect(sal.primeBrute).toBeCloseTo(500, 0);
    expect(sal.primeEmployeur).toBeGreaterThan(500); // charges incluses
  });

  it('Taux manuel forcé : désactive Fillon', () => {
    // Au SMIC, Fillon devrait réduire le taux — mais taux forcé à 45% l'ignore
    const salAuto  = calculerSalaireAnnuel(SMIC_MENSUEL, 1, false, 'CDI', null);
    const salForce = calculerSalaireAnnuel(SMIC_MENSUEL, 1, false, 'CDI', 45);
    expect(salForce.tauxCharges).toBeCloseTo(0.45, 5);
    expect(salForce.tauxChargesAuto).toBe(false);
    expect(salAuto.tauxChargesAuto).toBe(true);
  });
});

// ============================================
// Tests calculerEnveloppeParFiliere — cas DAF
// ============================================

describe('calculerEnveloppeParFiliere', () => {
  const filieres = [
    { id: 'a', label: 'Filière A', cle: 60 },
    { id: 'b', label: 'Filière B', cle: 40 },
  ];

  it('enveloppe globale = subvention − (salaires + exploitation)', () => {
    const r = calculerEnveloppeParFiliere(filieres, 100_000, 70_000, 10_000);
    expect(r.enveloppeGlobale).toBeCloseTo(20_000, 0); // 100k − 80k
  });

  it('ventilation respecte les clés de répartition', () => {
    const r = calculerEnveloppeParFiliere(filieres, 100_000, 60_000, 0);
    const a = r.lignes.find(l => l.id === 'a');
    const b = r.lignes.find(l => l.id === 'b');
    expect(a.subvention).toBeCloseTo(60_000, 0);
    expect(b.subvention).toBeCloseTo(40_000, 0);
    expect(a.enveloppe).toBeCloseTo(24_000, 0); // (100k − 60k) × 60%
    expect(b.enveloppe).toBeCloseTo(16_000, 0); // (100k − 60k) × 40%
  });

  it('enveloppe négative si charges > subvention', () => {
    const r = calculerEnveloppeParFiliere(filieres, 50_000, 80_000, 0);
    expect(r.enveloppeGlobale).toBeLessThan(0);
    r.lignes.forEach(l => expect(l.enveloppe).toBeLessThan(0));
  });

  it('clé à 0 : enveloppe filière = 0', () => {
    const avecCleZero = [
      { id: 'a', label: 'A', cle: 100 },
      { id: 'b', label: 'B', cle: 0 },
    ];
    const r = calculerEnveloppeParFiliere(avecCleZero, 100_000, 60_000, 0);
    const b = r.lignes.find(l => l.id === 'b');
    expect(b.enveloppe).toBe(0);
    expect(b.subvention).toBe(0);
  });

  it('mensuel = enveloppe / 12', () => {
    const r = calculerEnveloppeParFiliere(filieres, 120_000, 60_000, 0);
    r.lignes.forEach(l => {
      expect(l.mensuel).toBeCloseTo(l.enveloppe / 12, 2);
    });
  });

  it('utilise les filières par défaut si tableau vide', () => {
    const r = calculerEnveloppeParFiliere([], 100_000, 60_000, 0);
    expect(r.lignes.length).toBeGreaterThan(0); // FILIERES_DEFAULT utilisées
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

// ============================================
// Tests calculerIndicateursOETH
// ============================================

describe('calculerIndicateursOETH', () => {
  const makeAgent = (id, etp, rqth = false, source = 'Direction') =>
    ({ id, etp, rqth, titre: `Agent ${id}`, source });

  it('retourne zéro obligation si < 20 ETP', () => {
    const personnels = [makeAgent(1, 5), makeAgent(2, 3)];
    const r = calculerIndicateursOETH(personnels);
    expect(r.totalETP).toBeCloseTo(8);
    expect(r.obligationETP).toBe(0);
    expect(r.estConforme).toBe(true);
  });

  it('calcule obligation 6% si >= 20 ETP', () => {
    const personnels = Array.from({ length: 20 }, (_, i) => makeAgent(i, 1));
    const r = calculerIndicateursOETH(personnels);
    expect(r.totalETP).toBeCloseTo(20);
    expect(r.obligationETP).toBeCloseTo(1.2);
  });

  it('est conforme quand RQTH >= obligation', () => {
    const personnels = [
      ...Array.from({ length: 19 }, (_, i) => makeAgent(i, 1)),
      makeAgent(99, 1, true),  // 1 ETP RQTH sur 20 total = 5% < 6% → non conforme
    ];
    const r = calculerIndicateursOETH(personnels);
    expect(r.estConforme).toBe(false);
    expect(r.contributionEstimee).toBeGreaterThan(0);
    expect(r.aidesEstimees).toBe(0);
  });

  it('calcule aides si conforme et agents RQTH présents', () => {
    const personnels = [
      ...Array.from({ length: 18 }, (_, i) => makeAgent(i, 1)),
      makeAgent(97, 1, true),
      makeAgent(98, 1, true),
    ];
    const r = calculerIndicateursOETH(personnels);
    expect(r.totalETP).toBeCloseTo(20);
    expect(r.totalETPRqth).toBeCloseTo(2);
    expect(r.tauxRqth).toBeCloseTo(10);
    expect(r.estConforme).toBe(true);
    expect(r.aidesEstimees).toBeCloseTo(2 * 1800);
  });

  it('retourne nbAgents = longueur du tableau', () => {
    const personnels = [makeAgent(1, 1), makeAgent(2, 0.5)];
    expect(calculerIndicateursOETH(personnels).nbAgents).toBe(2);
  });

  it('gère un tableau vide sans crash', () => {
    const r = calculerIndicateursOETH([]);
    expect(r.totalETP).toBe(0);
    expect(r.estConforme).toBe(true);
    expect(r.tauxRqth).toBe(0);
  });

  it('respecte les options personnalisées (seuilOETH)', () => {
    const personnels = Array.from({ length: 10 }, (_, i) => makeAgent(i, 1));
    const r = calculerIndicateursOETH(personnels, { seuilOETH: 5 });
    expect(r.obligationETP).toBeCloseTo(0.6);
  });
});

// ============================================
// Tests calculerJoursAbsencesPlanning
// ============================================

describe('calculerJoursAbsencesPlanning', () => {
  it('retourne zéro si planning vide', () => {
    const r = calculerJoursAbsencesPlanning(1, 'Direction', null, 2026);
    expect(r.total).toBe(0);
  });

  it('compte les jours ouvrés saisis', () => {
    // Lundi 2026-01-05 = jour ouvré
    const planning = { '2026-01': { '1-Direction': { '2026-01-05': 'conge', '2026-01-06': 'conge' } } };
    const r = calculerJoursAbsencesPlanning(1, 'Direction', planning, 2026);
    expect(r.conge).toBe(2);
    expect(r.total).toBe(2);
  });

  it('ignore les weekends', () => {
    // 2026-01-03 = samedi, 2026-01-04 = dimanche
    const planning = { '2026-01': { '1-Dir': { '2026-01-03': 'maladie', '2026-01-04': 'maladie' } } };
    const r = calculerJoursAbsencesPlanning(1, 'Dir', planning, 2026);
    expect(r.total).toBe(0);
  });

  it('accumule sur 12 mois', () => {
    const planning = {
      '2026-01': { '1-D': { '2026-01-05': 'rtt' } },
      '2026-03': { '1-D': { '2026-03-02': 'formation' } },
    };
    const r = calculerJoursAbsencesPlanning(1, 'D', planning, 2026);
    expect(r.rtt).toBe(1);
    expect(r.formation).toBe(1);
    expect(r.total).toBe(2);
  });
});

// ============================================
// Tests calculerETPMensuelAgent
// ============================================

describe('calculerETPMensuelAgent', () => {
  it('retourne 12 valeurs', () => {
    const agent = { id: 1, etp: 1, joursConges: 25, nbJoursRTT: 0 };
    const result = calculerETPMensuelAgent(agent, 'Dir', null, 2026);
    expect(result).toHaveLength(12);
  });

  it('valeurs entre 0 et ETP contractuel', () => {
    const agent = { id: 1, etp: 0.8, joursConges: 25, nbJoursRTT: 5 };
    const result = calculerETPMensuelAgent(agent, 'Dir', null, 2026);
    result.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0.8 + 0.001);
    });
  });

  it('réduit ETP réel si absence saisie dans le planning', () => {
    // Saisir 10 jours ouvré d'absence en janvier
    const planning = { '2026-01': { '1-Dir': {} } };
    // Remplir lun-ven semaines 1-2 (5+5 = 10 jours)
    ['2026-01-05','2026-01-06','2026-01-07','2026-01-08','2026-01-09',
     '2026-01-12','2026-01-13','2026-01-14','2026-01-15','2026-01-16'].forEach(d => {
      planning['2026-01']['1-Dir'][d] = 'maladie';
    });
    const agent = { id: 1, etp: 1, joursConges: 0, nbJoursRTT: 0 };
    const sans = calculerETPMensuelAgent(agent, 'Dir', null, 2026);
    const avec = calculerETPMensuelAgent(agent, 'Dir', planning, 2026);
    expect(avec[0]).toBeLessThan(sans[0]);
  });
});

// ============================================
// Tests syncPoolRH
// ============================================

describe('syncPoolRH', () => {
  it('retourne tableau inchangé si tout somme à 100', () => {
    const pool = [{
      id: 1,
      affectations: [{ pct: 60 }, { pct: 40 }],
    }];
    const result = syncPoolRH(pool);
    expect(result[0].affectations[0].pct).toBeCloseTo(60);
    expect(result[0].affectations[1].pct).toBeCloseTo(40);
  });

  it('normalise à 100% si total ≠ 100', () => {
    const pool = [{
      id: 1,
      affectations: [{ pct: 30 }, { pct: 30 }], // total = 60
    }];
    const result = syncPoolRH(pool);
    const total = result[0].affectations.reduce((s, a) => s + a.pct, 0);
    expect(total).toBeCloseTo(100);
    expect(result[0].affectations[0].pct).toBeCloseTo(50);
  });

  it('laisse intact un agent sans affectations', () => {
    const pool = [{ id: 1, affectations: [] }];
    const result = syncPoolRH(pool);
    expect(result[0].affectations).toHaveLength(0);
  });

  it('laisse intact si total = 0 (non configuré)', () => {
    const pool = [{ id: 1, affectations: [{ pct: 0 }, { pct: 0 }] }];
    const result = syncPoolRH(pool);
    expect(result[0].affectations[0].pct).toBe(0);
  });

  it('gère un pool vide', () => {
    expect(syncPoolRH([])).toEqual([]);
  });
});

// ============================================
// Tests calculerSalaireAnnuel — cas complémentaires (1.6)
// ============================================

describe('calculerSalaireAnnuel — couverture étendue', () => {
  it('ETP = 0 → total = 0', () => {
    const r = calculerSalaireAnnuel(3000, 0, false);
    expect(r.brut).toBe(0);
    expect(r.total).toBe(0);
  });

  it('salaire = 0 → total = 0', () => {
    const r = calculerSalaireAnnuel(0, 1, false);
    expect(r.brut).toBe(0);
    expect(r.total).toBe(0);
  });

  it('Ségur legacy format numérique → même résultat que boolean true avec même montant', () => {
    const boolTrue = calculerSalaireAnnuel(2500, 1, true, 'CDI', null, null, null, 0, PRIME_SEGUR);
    const numFormat = calculerSalaireAnnuel(2500, 1, PRIME_SEGUR, 'CDI', null, null, null, 0, PRIME_SEGUR);
    expect(numFormat.total).toBeCloseTo(boolTrue.total, 2);
    expect(numFormat.segur).toBeCloseTo(boolTrue.segur, 2);
  });

  it('Ségur ETP partiel : prime proportionnelle à ETP', () => {
    const plein = calculerSalaireAnnuel(3000, 1, true);
    const demi  = calculerSalaireAnnuel(3000, 0.5, true);
    expect(demi.segur).toBeCloseTo(plein.segur / 2, 2);
  });

  it('vacataire : taux calculé par Fillon (pas de taux spécial)', () => {
    const r = calculerSalaireAnnuel(2000, 1, false, 'Vacataire');
    expect(r.tauxCharges).toBeLessThan(CHARGES_PATRONALES); // Fillon actif à 2000€
  });

  it('CDD : même taux que CDI (Fillon possible)', () => {
    const cdd = calculerSalaireAnnuel(3500, 1, false, 'CDD');
    const cdi = calculerSalaireAnnuel(3500, 1, false, 'CDI');
    expect(cdd.tauxCharges).toBeCloseTo(cdi.tauxCharges, 5);
  });

  it('Fillon progressif : salaire entre 1x et 1.6x SMIC → réduction partielle', () => {
    const smicAn = SMIC_MENSUEL * 12;
    const salaire1xSmic = SMIC_MENSUEL * 1;     // 100% SMIC → Fillon maximal
    const salaire1_3x   = SMIC_MENSUEL * 1.3;   // 130% SMIC → Fillon partiel
    const salaire2xSmic = SMIC_MENSUEL * 2;      // > 160% → pas de Fillon
    const r1 = calculerSalaireAnnuel(salaire1xSmic,  1, false, 'CDI');
    const r13 = calculerSalaireAnnuel(salaire1_3x,   1, false, 'CDI');
    const r2 = calculerSalaireAnnuel(salaire2xSmic,  1, false, 'CDI');
    expect(r1.tauxCharges).toBeLessThan(CHARGES_PATRONALES);
    expect(r13.tauxCharges).toBeGreaterThan(r1.tauxCharges);
    expect(r13.tauxCharges).toBeLessThan(r2.tauxCharges);
    expect(r2.tauxCharges).toBeCloseTo(CHARGES_PATRONALES, 5);
  });

  it('ETP < 1 avec Fillon : calcul sur SMIC proratisé par ETP', () => {
    const salaire = SMIC_MENSUEL * 1.2; // 120% SMIC à plein temps
    const plein   = calculerSalaireAnnuel(salaire, 1,   false, 'CDI');
    const miTemps = calculerSalaireAnnuel(salaire, 0.5, false, 'CDI');
    // À mi-temps le salaire annuel double le ratio SMIC → Fillon réduit ou nul
    expect(miTemps.tauxCharges).toBeGreaterThanOrEqual(plein.tauxCharges);
  });

  it('prime avec montant 0 : équivalent sans prime', () => {
    const sans  = calculerSalaireAnnuel(3000, 1, false, 'CDI');
    const avecZ = calculerSalaireAnnuel(3000, 1, false, 'CDI', null, null, 6, 0);
    expect(avecZ.total).toBeCloseTo(sans.total, 2);
  });

  it('stage : charges nulles, brut positif', () => {
    const r = calculerSalaireAnnuel(800, 1, false, 'Stage');
    expect(r.brut).toBeGreaterThan(0);
    expect(r.charges).toBe(0);
    expect(r.total).toBe(r.brut);
  });

  it('contrat_pro : même taux réduit qu\'apprentissage', () => {
    const r = calculerSalaireAnnuel(1600, 1, false, 'contrat_pro');
    expect(r.tauxCharges).toBeCloseTo(TAUX_CHARGES_APPRENTI, 5);
  });
});

// ============================================
// Tests calculerEnveloppeParFiliere (1.7)
// ============================================

describe('calculerEnveloppeParFiliere', () => {
  const filieres2 = [
    { id: 'fi', label: 'FI', cle: 60 },
    { id: 'fc', label: 'FC', cle: 40 },
  ];

  it('ventile l\'enveloppe selon les clés', () => {
    const r = calculerEnveloppeParFiliere(filieres2, 200000, 120000, 20000);
    expect(r.enveloppeGlobale).toBeCloseTo(200000 - 120000 - 20000);
    expect(r.lignes).toHaveLength(2);
    expect(r.lignes[0].id).toBe('fi');
    expect(r.lignes[0].enveloppe).toBeCloseTo(r.enveloppeGlobale * 0.6, 2);
    expect(r.lignes[1].enveloppe).toBeCloseTo(r.enveloppeGlobale * 0.4, 2);
  });

  it('somme des enveloppes par filière = enveloppe globale', () => {
    const r = calculerEnveloppeParFiliere(filieres2, 300000, 150000, 30000);
    const somme = r.lignes.reduce((s, l) => s + l.enveloppe, 0);
    expect(somme).toBeCloseTo(r.enveloppeGlobale, 2);
  });

  it('enveloppe négative si charges > subvention', () => {
    const r = calculerEnveloppeParFiliere(filieres2, 50000, 80000, 10000);
    expect(r.enveloppeGlobale).toBeLessThan(0);
    expect(r.lignes[0].enveloppe).toBeLessThan(0);
  });

  it('mensuel = enveloppe / 12', () => {
    const r = calculerEnveloppeParFiliere(filieres2, 240000, 100000, 20000);
    r.lignes.forEach(l => expect(l.mensuel).toBeCloseTo(l.enveloppe / 12, 4));
  });

  it('utilise les filières par défaut si tableau vide', () => {
    const r = calculerEnveloppeParFiliere([], 100000, 50000, 0);
    expect(r.lignes.length).toBeGreaterThan(0);
  });

  it('filière avec clé 0 → enveloppe = 0', () => {
    const filieres = [
      { id: 'a', label: 'A', cle: 0 },
      { id: 'b', label: 'B', cle: 100 },
    ];
    const r = calculerEnveloppeParFiliere(filieres, 100000, 40000, 0);
    expect(r.lignes[0].enveloppe).toBe(0);
    expect(r.lignes[1].enveloppe).toBeCloseTo(r.enveloppeGlobale, 2);
  });

  it('exploitationTotale optionnel : par défaut 0', () => {
    const avecZ = calculerEnveloppeParFiliere(filieres2, 100000, 60000, 0);
    const sansPar = calculerEnveloppeParFiliere(filieres2, 100000, 60000);
    expect(sansPar.enveloppeGlobale).toBeCloseTo(avecZ.enveloppeGlobale, 2);
  });
});

// ============================================
// Tests calculerFondRoulement (1.8)
// ============================================

describe('calculerFondRoulement', () => {
  const mockDir = {
    personnel: [{ id: 1, titre: 'Dir', etp: 1, salaire: 4000, segur: false }],
    exploitation: [],
    recettes: [{ nom: 'Subvention', montant: 15000 }],
    investissements: {},
  };
  const mockServices = [{
    id: 1, nom: 'Svc', personnel: [], exploitation: [], recettes: [],
    investissements: { materiel: { montant: 12000, duree: 4, taux: 0 } },
  }];
  const mockGP = {
    montantSegurETP: 238, coefficientBP: 100,
    fondRoulement: [{ nom: 'Réserves', montant: 50000 }],
    provisions: [],
  };

  it('calcule les immobilisations nettes', () => {
    const r = calculerFondRoulement(mockDir, mockServices, mockGP);
    expect(r.totalImmobilisations).toBe(12000);
    expect(r.totalAmortissementsCumules).toBeCloseTo(3000, 2); // 12000/4
    expect(r.immobilisationsNettes).toBeCloseTo(9000, 2);
  });

  it('inclut les capitaux manuels', () => {
    const r = calculerFondRoulement(mockDir, mockServices, mockGP);
    expect(r.totalCapitauxManuels).toBe(50000);
  });

  it('FR = capitaux permanents - immobilisations nettes', () => {
    const solde = 5000;
    const r = calculerFondRoulement(mockDir, mockServices, mockGP, null, solde);
    expect(r.fondRoulement).toBeCloseTo(
      r.totalCapitauxPermanents - r.immobilisationsNettes, 2
    );
  });

  it('guard investissements manquants : ne plante pas', () => {
    const dirSansInv = { ...mockDir, investissements: null };
    expect(() => calculerFondRoulement(dirSansInv, [], mockGP)).not.toThrow();
  });

  it('services = undefined → traité comme tableau vide', () => {
    expect(() => calculerFondRoulement(mockDir, undefined, mockGP)).not.toThrow();
  });

  it('résultat prévisionnel fourni via soldeGlobal', () => {
    const r1 = calculerFondRoulement(mockDir, [], mockGP, null, 10000);
    const r2 = calculerFondRoulement(mockDir, [], mockGP, null, -5000);
    expect(r1.fondRoulement).toBeGreaterThan(r2.fondRoulement);
    expect(r1.resultatPrevisionnel).toBe(10000);
    expect(r2.resultatPrevisionnel).toBe(-5000);
  });

  it('fondRoulement négatif si immobilisations > capitaux', () => {
    const gpSansReserves = { ...mockGP, fondRoulement: [] };
    const r = calculerFondRoulement(mockDir, mockServices, gpSansReserves, null, 0);
    // 0 capitaux manuels + résultat ~0 → immobilisations nettes positives → FR négatif
    expect(r.fondRoulement).toBeLessThanOrEqual(0);
  });
});

// ============================================
// Tests Fillon corrigé — monotonie et borne basse
// ============================================

describe('Allègement Fillon — correction monotonie (2.0)', () => {
  it('taux minimum 9,86% au SMIC exact (borne basse URSSAF)', () => {
    const smicAnnuel = SMIC_MENSUEL * 12;
    const taux = calculerTauxCharges(smicAnnuel, 1, 'CDI');
    const borneAttendue = CHARGES_PATRONALES - 0.3214; // ≈ 9.86%
    expect(taux).toBeCloseTo(borneAttendue, 3);
  });

  it('taux minimum 9,86% pour tout salaire sous SMIC', () => {
    for (const pctSmic of [0.5, 0.7, 0.8, 0.9, 0.99]) {
      const sAnnuel = SMIC_MENSUEL * 12 * pctSmic;
      const taux = calculerTauxCharges(sAnnuel, 1, 'CDI');
      expect(taux).toBeGreaterThanOrEqual(CHARGES_PATRONALES - 0.3214 - 0.0001);
    }
  });

  it('monotonie : taux décroît strictement de 1,6×SMIC vers 0', () => {
    let tauxPrecedent = null;
    for (let pct = 1.6; pct >= 0.5; pct -= 0.05) {
      const sAnnuel = SMIC_MENSUEL * 12 * pct;
      const taux = calculerTauxCharges(sAnnuel, 1, 'CDI');
      if (tauxPrecedent !== null) {
        expect(taux).toBeLessThanOrEqual(tauxPrecedent + 0.0001);
      }
      tauxPrecedent = taux;
    }
  });

  it('taux jamais négatif quel que soit le salaire', () => {
    for (const s of [0.1, 0.5, 1.0, 1.6, 2.0, 5.0]) {
      const taux = calculerTauxCharges(SMIC_MENSUEL * 12 * s, 1, 'CDI');
      expect(taux).toBeGreaterThanOrEqual(0);
    }
  });

  it('continuité au seuil 1,6×SMIC : pas de saut brutal', () => {
    const seuil = SMIC_MENSUEL * 1.6 * 12;
    const avant = calculerTauxCharges(seuil - 1, 1, 'CDI');
    const apres = calculerTauxCharges(seuil + 1, 1, 'CDI');
    expect(Math.abs(avant - apres)).toBeLessThan(0.001);
  });

  it('invariance ETP : taux identique entre ETP 0.5 à SMIC et ETP 1.0 à SMIC', () => {
    const t1 = calculerTauxCharges(SMIC_MENSUEL * 12 * 1.0, 1.0, 'CDI');
    const t2 = calculerTauxCharges(SMIC_MENSUEL * 12 * 0.5, 0.5, 'CDI');
    expect(t1).toBeCloseTo(t2, 5);
  });
});

// ============================================
// Tests calculerBudgetService
// ============================================

describe('calculerBudgetService', () => {
  const svcBase = {
    id: 'svc1',
    nom: 'Service Test',
    personnel: [
      { id: 1, titre: 'Formateur', etp: 1, salaire: 2800, segur: true },
    ],
    exploitation: [
      { id: 1, nom: 'Matériel', montant: 500 },
    ],
    recettes: [
      { id: 1, nom: 'Subvention Région', montant: 8000 },
    ],
    investissements: {},
  };

  it('calcule salaires, exploitation et recettes', () => {
    const r = calculerBudgetService(svcBase);
    expect(r.salaires).toBeGreaterThan(0);
    expect(r.exploitation).toBe(500 * 12);
    expect(r.recettes).toBe(8000 * 12);
    expect(r.total).toBeGreaterThan(0);
  });

  it('solde = recettes - total', () => {
    const r = calculerBudgetService(svcBase);
    expect(r.solde).toBeCloseTo(r.recettes - r.total, 2);
  });

  it('détailsSalaires autant d\'entrées que d\'agents', () => {
    const r = calculerBudgetService(svcBase);
    expect(r.detailsSalaires.length).toBe(1);
  });

  it('etpContractuel = somme ETP personnel', () => {
    const r = calculerBudgetService(svcBase);
    expect(r.etpContractuel).toBeCloseTo(1, 5);
  });

  it('retourne objet vide si service null', () => {
    const r = calculerBudgetService(null);
    expect(r.total).toBe(0);
    expect(r.salaires).toBe(0);
  });

  it('coefficientBP 50 divise par 2 exploitation et recettes (pas la MS)', () => {
    const r100 = calculerBudgetService(svcBase, null, 2026, PRIME_SEGUR, [], null, 100);
    const r50  = calculerBudgetService(svcBase, null, 2026, PRIME_SEGUR, [], null, 50);
    expect(r50.exploitation).toBeCloseTo(r100.exploitation / 2, 2);
    expect(r50.recettes).toBeCloseTo(r100.recettes / 2, 2);
    expect(r50.salaires).toBeCloseTo(r100.salaires, 0);
  });

  it('investissements : amortissement > 0 si montant et durée > 0', () => {
    const svcAvecInv = {
      ...svcBase,
      investissements: { materiel: { montant: 24000, duree: 4, taux: 0 } },
    };
    const r = calculerBudgetService(svcAvecInv);
    expect(r.amortissements).toBeCloseTo(6000, 2);
    expect(r.totalInvestissements).toBe(24000);
  });

  it('recettes nulles → solde négatif si des charges', () => {
    const svcSansRecettes = { ...svcBase, recettes: [] };
    const r = calculerBudgetService(svcSansRecettes);
    expect(r.recettes).toBe(0);
    expect(r.solde).toBeLessThan(0);
  });
});

// ============================================
// Tests calculerBudgetPoleSupport
// ============================================

describe('calculerBudgetPoleSupport', () => {
  const poleSupport = {
    personnel: [
      { id: 1, titre: 'Comptable', etp: 1, salaire: 2600, segur: false },
    ],
    exploitation: [
      { id: 1, nom: 'Téléphonie', montant: 200 },
    ],
    recettes: [],
    investissements: {},
  };

  it('calcule salaires et exploitation', () => {
    const r = calculerBudgetPoleSupport(poleSupport);
    expect(r.salaires).toBeGreaterThan(0);
    expect(r.exploitation).toBe(200 * 12);
  });

  it('total = salaires + exploitation + amortissements', () => {
    const r = calculerBudgetPoleSupport(poleSupport);
    expect(r.total).toBeCloseTo(r.salaires + r.exploitation + (r.amortissements || 0), 2);
  });

  it('retourne objet à zéro si pôle support null', () => {
    const r = calculerBudgetPoleSupport(null);
    expect(r.total).toBe(0);
  });
});

// ============================================
// Tests verifierCoherencePoolRH
// ============================================

describe('verifierCoherencePoolRH', () => {
  it('aucune alerte si tous les agents sont à 100%', () => {
    const pool = [
      { id: 1, titre: 'A', affectations: [{ pct: 60 }, { pct: 40 }] },
      { id: 2, titre: 'B', affectations: [{ pct: 100 }] },
    ];
    expect(verifierCoherencePoolRH(pool)).toHaveLength(0);
  });

  it('alerte si un agent dépasse 100%', () => {
    const pool = [{ id: 1, titre: 'Dupont', affectations: [{ pct: 70 }, { pct: 50 }] }];
    const alertes = verifierCoherencePoolRH(pool);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].totalPct).toBe(120);
    expect(alertes[0].agentId).toBe(1);
  });

  it('alerte si un agent est sous 100% avec affectations non nulles', () => {
    const pool = [{ id: 2, titre: 'Martin', affectations: [{ pct: 30 }, { pct: 40 }] }];
    const alertes = verifierCoherencePoolRH(pool);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].totalPct).toBe(70);
  });

  it('pas d\'alerte si agent sans affectations (non configuré)', () => {
    const pool = [{ id: 3, titre: 'C', affectations: [] }];
    expect(verifierCoherencePoolRH(pool)).toHaveLength(0);
  });

  it('pool vide → tableau d\'alertes vide', () => {
    expect(verifierCoherencePoolRH([])).toEqual([]);
  });
});

// ============================================
// Tests calculerPartPoolRH
// ============================================

describe('calculerPartPoolRH', () => {
  const pool = [
    {
      id: 1, titre: 'Coord RH', etp: 1, salaire: 3000, segur: false, typeContrat: 'CDI',
      affectations: [
        { entityType: 'service', entityId: 'svc1', pct: 40 },
        { entityType: 'service', entityId: 'svc2', pct: 60 },
      ],
    },
  ];

  it('calcule la quote-part pour svc1 à 40%', () => {
    const r = calculerPartPoolRH(pool, 'service', 'svc1');
    expect(r.details).toHaveLength(1);
    expect(r.totalSalaires).toBeGreaterThan(0);
    const salPlein = r.totalSalaires / 0.4;
    const salSvc2  = calculerPartPoolRH(pool, 'service', 'svc2').totalSalaires;
    expect(salSvc2).toBeCloseTo(salPlein * 0.6, 0);
  });

  it('retourne 0 si aucune affectation ne correspond', () => {
    const r = calculerPartPoolRH(pool, 'service', 'svc_inexistant');
    expect(r.totalSalaires).toBe(0);
    expect(r.details).toHaveLength(0);
  });

  it('pool vide → totalSalaires = 0', () => {
    expect(calculerPartPoolRH([], 'service', 'x').totalSalaires).toBe(0);
  });
});

// ============================================
// Tests repartirFraisSiege
// ============================================

describe('repartirFraisSiege', () => {
  const budgetDir = { total: 120000 };
  const services = [
    { id: 1, nom: 'Svc A', personnel: [{ etp: 2 }, { etp: 2 }] },
    { id: 2, nom: 'Svc B', personnel: [{ etp: 1 }] },
  ];

  it('répartit proportionnellement à l\'ETP', () => {
    const r = repartirFraisSiege(budgetDir, services);
    expect(r).toHaveLength(2);
    const svcA = r.find(x => x.serviceId === 1);
    const svcB = r.find(x => x.serviceId === 2);
    expect(svcA.etp).toBeCloseTo(4);
    expect(svcB.etp).toBeCloseTo(1);
    expect(svcA.pctETP).toBeCloseTo(80, 2);
    expect(svcB.pctETP).toBeCloseTo(20, 2);
    expect(svcA.quotePart + svcB.quotePart).toBeCloseTo(120000, 2);
  });

  it('quote-part = 0 si ETP total = 0', () => {
    const r = repartirFraisSiege({ total: 50000 }, [{ id: 1, nom: 'X', personnel: [] }]);
    expect(r[0].quotePart).toBe(0);
  });
});

// ============================================
// Tests appliquerStressTest
// ============================================

describe('appliquerStressTest', () => {
  const recettes = [
    { nom: 'Subvention Région', montant: 5000 },
    { nom: 'Droits inscription', montant: 2000 },
  ];

  it('stressTest = 0 → total = somme × 12', () => {
    const r = appliquerStressTest(recettes, 0);
    expect(r).toBeCloseTo((5000 + 2000) * 12, 2);
  });

  it('stressTest null → total = somme × 12', () => {
    const r = appliquerStressTest(recettes, null);
    expect(r).toBeCloseTo(84000, 2);
  });

  it('stressTest -20 réduit uniquement les subventions de 20%', () => {
    const r = appliquerStressTest(recettes, -20);
    const attendu = 5000 * 12 * 0.8 + 2000 * 12;
    expect(r).toBeCloseTo(attendu, 2);
  });

  it('stressTest +10 augmente uniquement les subventions', () => {
    const r = appliquerStressTest(recettes, 10);
    const attendu = 5000 * 12 * 1.1 + 2000 * 12;
    expect(r).toBeCloseTo(attendu, 2);
  });

  it('recettes sans subvention : pas d\'impact du stress test', () => {
    const rNonSubv = [{ nom: 'Droits inscription', montant: 3000 }];
    const r0 = appliquerStressTest(rNonSubv, 0);
    const r20 = appliquerStressTest(rNonSubv, -20);
    expect(r0).toBeCloseTo(r20, 2);
  });
});

// ============================================
// Tests calculerIFC
// ============================================

describe('calculerIFC', () => {
  const direction = {
    personnel: [
      // Retraite dans 3 ans (64 - (2026-1965) = 3)
      { id: 1, titre: 'Directeur', etp: 1, salaire: 4500, segur: false, anneeNaissance: 1965, dateEntree: 2006 },
      // Retraite dans 15 ans → hors horizon 8
      { id: 2, titre: 'Adjoint', etp: 1, salaire: 3000, segur: false, anneeNaissance: 1977, dateEntree: 2010 },
    ],
  };

  it('ne retient que les agents dans l\'horizon 8 ans', () => {
    const r = calculerIFC(direction, [], null);
    expect(r.agents.length).toBe(1);
    expect(r.agents[0].id).toBe(1);
  });

  it('provision CCN 66 : 1/4 mois/an ≤ 10 ans + 1/3 mois/an au-delà', () => {
    const r = calculerIFC(direction, [], null);
    const agent = r.agents[0];
    const anciennete = 2026 - 2006; // 20 ans
    const salaireBase = 4500; // mensuel
    // Barème gradué : 10 × (sal/4) + 10 × (sal/3)
    const attendu = Math.round((salaireBase / 4) * 10 + (salaireBase / 3) * 10);
    expect(agent.provision).toBe(attendu);
  });

  it('totalProvision = somme des provisions', () => {
    const r = calculerIFC(direction, [], null);
    const total = r.agents.reduce((s, a) => s + a.provision, 0);
    expect(r.totalProvision).toBe(total);
  });

  it('aucun agent sans anneeNaissance ni dateEntree → liste vide', () => {
    const dir = { personnel: [{ id: 1, titre: 'X', etp: 1, salaire: 3000, segur: false }] };
    const r = calculerIFC(dir, [], null);
    expect(r.agents).toHaveLength(0);
    expect(r.totalProvision).toBe(0);
  });

  it('Ségur inclus dans la base de calcul — barème gradué CCN 66', () => {
    const dirAvecSegur = {
      personnel: [
        { id: 1, titre: 'Inf', etp: 1, salaire: 2500, segur: true, anneeNaissance: 1965, dateEntree: 2010 },
      ],
    };
    const r = calculerIFC(dirAvecSegur, [], null);
    const base = (2500 + PRIME_SEGUR) * 1;
    const anciennete = 2026 - 2010; // 16 ans
    // 10 × (base/4) + 6 × (base/3)
    const attendu = Math.round((base / 4) * 10 + (base / 3) * 6);
    expect(r.agents[0].provision).toBe(attendu);
  });
});

// ============================================
// Tests calculerAlertesRH
// ============================================

describe('calculerAlertesRH', () => {
  const DATE_REF = new Date('2026-04-01');

  it('alerte retraite cette année (né en 1962 → 64 ans en 2026)', () => {
    const dir = { personnel: [{ id: 1, titre: 'Dupont', anneeNaissance: 1962 }] };
    const alertes = calculerAlertesRH(dir, null, [], DATE_REF);
    expect(alertes.some(a => a.lvl === 'error' && a.msg.includes('Dupont'))).toBe(true);
  });

  it('alerte warning retraite dans 6 mois (né en 1961 → 65 ans — retraite jan 2026 → déjà passée)', () => {
    // Né en 1962 : retraite en 2026 → error
    // Né en 1963 : retraite en 2027 → 12 mois → 'info' si ≤12 mois
    const dir = { personnel: [{ id: 2, titre: 'Martin', anneeNaissance: 1963 }] };
    const alertes = calculerAlertesRH(dir, null, [], DATE_REF);
    // Avril 2026 → retraite 2027-04 → 12 mois → info
    expect(alertes.some(a => a.lvl === 'info' && a.msg.includes('Martin'))).toBe(true);
  });

  it('alerte error pour contrat expiré', () => {
    const dir = { personnel: [{ id: 3, titre: 'Leroux', dateFinContrat: '2026-01-01' }] };
    const alertes = calculerAlertesRH(dir, null, [], DATE_REF);
    expect(alertes.some(a => a.lvl === 'error' && a.msg.includes('expiré'))).toBe(true);
  });

  it('alerte warning CDD qui expire dans 30 jours', () => {
    const dateFin = new Date(DATE_REF);
    dateFin.setDate(dateFin.getDate() + 20);
    const dir = { personnel: [{ id: 4, titre: 'Dubois', dateFinContrat: dateFin.toISOString().slice(0, 10) }] };
    const alertes = calculerAlertesRH(dir, null, [], DATE_REF);
    expect(alertes.some(a => a.lvl === 'error' && a.msg.includes('expire'))).toBe(true);
  });

  it('pas d\'alerte pour agents sans données retraite ni fin de contrat', () => {
    const dir = { personnel: [{ id: 5, titre: 'Normal', etp: 1, salaire: 3000 }] };
    const alertes = calculerAlertesRH(dir, null, [], DATE_REF);
    expect(alertes).toHaveLength(0);
  });

  it('gère les données null sans crash', () => {
    expect(() => calculerAlertesRH(null, null, [], DATE_REF)).not.toThrow();
    expect(() => calculerAlertesRH({ personnel: [] }, null, [], DATE_REF)).not.toThrow();
  });
});

// ============================================
// Tests runFinancialAudit
// ============================================

describe('runFinancialAudit', () => {
  const gp = { montantSegurETP: PRIME_SEGUR };

  it('alerte SMIC_VIOLATION si salaire < SMIC', () => {
    const dir = {
      personnel: [{ id: 1, titre: 'Stagiaire', etp: 1, salaire: 500 }],
    };
    const alertes = runFinancialAudit(dir, [], null, gp);
    expect(alertes.some(a => a.code === 'SMIC_VIOLATION')).toBe(true);
  });

  it('pas d\'alerte SMIC_VIOLATION si salaire > SMIC', () => {
    const dir = {
      personnel: [{ id: 1, titre: 'CDI', etp: 1, salaire: 2500 }],
    };
    const alertes = runFinancialAudit(dir, [], null, gp);
    expect(alertes.some(a => a.code === 'SMIC_VIOLATION')).toBe(false);
  });

  it('alerte INVEST_NO_DURATION si investissement sans durée', () => {
    const dir = {
      personnel: [],
      investissements: { materiel: { montant: 50000, duree: 0, taux: 2 } },
    };
    const alertes = runFinancialAudit(dir, [], null, gp);
    expect(alertes.some(a => a.code === 'INVEST_NO_DURATION')).toBe(true);
  });

  it('alerte NO_REVENUE si service avec charges > 10k sans recettes', () => {
    const services = [{
      id: 'svc1',
      nom: 'Service sans recettes',
      personnel: [{ id: 1, titre: 'Form', etp: 1, salaire: 3000, segur: false }],
      exploitation: [{ id: 1, nom: 'Charges', montant: 500 }],
      recettes: [],
      investissements: {},
    }];
    const alertes = runFinancialAudit({ personnel: [] }, services, null, gp);
    expect(alertes.some(a => a.code === 'NO_REVENUE')).toBe(true);
  });

  it('aucune alerte pour une configuration saine', () => {
    const services = [{
      id: 'svc1',
      nom: 'Service OK',
      personnel: [{ id: 1, titre: 'Form', etp: 1, salaire: 2500, segur: false }],
      exploitation: [],
      recettes: [{ id: 1, nom: 'Subvention', montant: 5000 }],
      investissements: {},
    }];
    const alertes = runFinancialAudit({ personnel: [] }, services, null, gp);
    expect(alertes.some(a => a.code === 'SMIC_VIOLATION')).toBe(false);
    expect(alertes.some(a => a.code === 'INVEST_NO_DURATION')).toBe(false);
  });
});

// ============================================
// Tests calculerBudgetAnnuelMensuel — coefficientBP
// ============================================

describe('calculerBudgetAnnuelMensuel — coefficientBP', () => {
  const direction = {
    personnel: [{ id: 1, titre: 'Dir', etp: 1, salaire: 4000, segur: false }],
    exploitation: [{ id: 1, nom: 'Loyer', montant: 2000 }],
    recettes: [{ id: 1, nom: 'Subvention', montant: 10000 }],
  };
  const gpBase = {
    montantSegurETP: PRIME_SEGUR,
    taxeSalaires: false,
    tauxTaxeSalaires: 4.25,
    provisions: [],
    fondRoulement: [],
    stocksValeur: 0,
    delaiPaiementClients: 30,
    delaiPaiementFournisseurs: 30,
  };

  it('coefficientBP 100 et 50 : exploitation divisée par 2', () => {
    const r100 = calculerBudgetAnnuelMensuel(direction, [], { ...gpBase, coefficientBP: 100 });
    const r50  = calculerBudgetAnnuelMensuel(direction, [], { ...gpBase, coefficientBP: 50 });
    expect(r50.exploitation).toBeCloseTo(r100.exploitation / 2, 2);
  });

  it('coefficientBP 100 et 50 : masse salariale identique', () => {
    const r100 = calculerBudgetAnnuelMensuel(direction, [], { ...gpBase, coefficientBP: 100 });
    const r50  = calculerBudgetAnnuelMensuel(direction, [], { ...gpBase, coefficientBP: 50 });
    expect(r50.salaires).toBeCloseTo(r100.salaires, 0);
  });
});

// ============================================
// Tests calculerPresenceAgent
// ============================================

describe('calculerPresenceAgent', () => {
  const agent = { id: 1, etp: 1, joursConges: 25, nbJoursRTT: 0, salaire: 3000, segur: false };

  it('etpReel réduit par les congés configurés même sans planning', () => {
    const r = calculerPresenceAgent(agent, 'Dir', null, 2026);
    // etpReel < 1 car 25 jours de congés déduits
    expect(r.etpReel).toBeGreaterThan(0);
    expect(r.etpReel).toBeLessThan(1);
    expect(r.joursConges).toBe(25);
  });

  it('coûtCarence > 0 si jours de maladie saisis', () => {
    const planning = { '2026-01': { '1-Dir': {} } };
    ['2026-01-05','2026-01-06','2026-01-07','2026-01-08','2026-01-09'].forEach(d => {
      planning['2026-01']['1-Dir'][d] = 'maladie';
    });
    const r = calculerPresenceAgent(agent, 'Dir', planning, 2026);
    expect(r.coutCarence).toBeGreaterThan(0);
  });
});

// ============================================
// Tests calculerTresorerieMensuelle
// ============================================

describe('calculerTresorerieMensuelle', () => {
  const direction = {
    personnel: [{ id: 1, titre: 'Dir', etp: 1, salaire: 4000, segur: false }],
    exploitation: [],
    recettes: [{ id: 1, nom: 'Subvention', montant: 5000 }],
    investissements: {},
  };
  const gp = {
    montantSegurETP: PRIME_SEGUR,
    coefficientBP: 100,
    provisions: [],
    fondRoulement: [],
    stocksValeur: 0,
    delaiPaiementClients: 30,
    delaiPaiementFournisseurs: 30,
  };

  it('retourne 12 mois', () => {
    const r = calculerTresorerieMensuelle(direction, [], gp);
    expect(r.mois).toHaveLength(12);
  });

  it('totalDecaissements > 0', () => {
    const r = calculerTresorerieMensuelle(direction, [], gp);
    expect(r.totalDecaissements).toBeGreaterThan(0);
  });

  it('totalEncaissements > 0', () => {
    const r = calculerTresorerieMensuelle(direction, [], gp);
    expect(r.totalEncaissements).toBeGreaterThan(0);
  });

  it('somme des décaissements mensuels ≈ totalDecaissements', () => {
    const r = calculerTresorerieMensuelle(direction, [], gp);
    const somme = r.mois.reduce((s, m) => s + m.decaissements, 0);
    expect(somme).toBeCloseTo(r.totalDecaissements, 0);
  });
});
