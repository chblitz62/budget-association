import { describe, it, expect } from 'vitest';
import {
  calculerBudgetService,
  calculerPartPoolRH,
  calculerTresorerieMensuelle,
  calculerSalaireAnnuel,
  calculerIFC,
  appliquerStressTest
} from './calculations';
import { PRIME_SEGUR } from './constants';

describe('Tests de Transversalité des données', () => {

  const mockGlobalParams = {
    montantSegurETP: 238,
    augmentationAnnuelle: 2.5
  };

  const mockService = {
    id: 'serv1',
    nom: 'Service Test',
    personnel: [
      { id: 'p1', titre: 'Agent Permanent', etp: 1, salaire: 2500, segur: true, typeContrat: 'CDI' }
    ],
    exploitation: [],
    recettes: [
      { id: 'r1', nom: 'Subvention', montant: 5000 } // 60k annuel
    ],
    investissements: {}
  };

  const mockDirection = { personnel: [], exploitation: [], recettes: [] };

  it('Propagation Pool RH : impacte le budget du service destinataire', () => {
    const poolRH = [
      {
        id: 'pool1',
        titre: 'Comptable Partagé',
        etp: 1,
        salaire: 3000,
        segur: false,
        affectations: [
          { entityType: 'service', entityId: 'serv1', pct: 50 } // 50% sur le service test
        ]
      }
    ];

    // Calcul initial
    const budgetInitial = calculerBudgetService(mockService, null, 2026, 238, poolRH);
    const coutInitialPool = budgetInitial.detailsPoolRH[0].coutQuotePart;

    // Augmentation du salaire dans le Pool RH
    poolRH[0].salaire = 4000;
    const budgetFinal = calculerBudgetService(mockService, null, 2026, 238, poolRH);
    const coutFinalPool = budgetFinal.detailsPoolRH[0].coutQuotePart;

    expect(coutFinalPool).toBeGreaterThan(coutInitialPool);
    expect(budgetFinal.salaires).toBe(budgetInitial.salaires - coutInitialPool + coutFinalPool);
  });

  it('Propagation Paramètres Globaux : impact du montant Ségur sur toute la chaîne', () => {
    const poolRH = [];

    // Cas 1 : Ségur à 238€
    const budget238 = calculerBudgetService(mockService, null, 2026, 238, poolRH);

    // Cas 2 : Ségur passe à 300€ (décision gouvernementale simulée)
    const budget300 = calculerBudgetService(mockService, null, 2026, 300, poolRH);

    expect(budget300.salaires).toBeGreaterThan(budget238.salaires);

    // Vérification de la répercussion en Trésorerie
    const treso238 = calculerTresorerieMensuelle(mockDirection, [mockService], { montantSegurETP: 238 }, null, poolRH);
    const treso300 = calculerTresorerieMensuelle(mockDirection, [mockService], { montantSegurETP: 300 }, null, poolRH);

    expect(treso300.totalDecaissements).toBeGreaterThan(treso238.totalDecaissements);
  });

  it('Saisonnalité : impact d\'un recrutement tardif (poste à pourvoir)', () => {
    const serviceAvecRecrutement = {
      ...mockService,
      personnel: [
        {
          id: 'p2',
          titre: 'Nouveau Recruté',
          etp: 1,
          salaire: 2000,
          segur: false,
          estPosteAPourvoir: true,
          dateDebutPrevue: '2026-07' // Recrutement en Juillet (6 mois sur 12)
        }
      ]
    };

    const budgetSaisonnier = calculerBudgetService(serviceAvecRecrutement, null, 2026, 238, []);
    const salaireCDI_FullYear = calculerSalaireAnnuel(2000, 1, false, 'CDI').total;

    // Le coût budgété doit être environ la moitié (6/12)
    expect(budgetSaisonnier.salaires).toBeCloseTo(salaireCDI_FullYear / 2, 0);
  });

  it('Transversalité IFC : Ancienneté et Ségur', () => {
    const agentProcheRetraite = {
      id: 'retraite1',
      titre: 'Senior',
      etp: 1,
      salaire: 3000,
      segur: true,
      anneeNaissance: 1964, // 62 ans en 2026
      dateEntree: 2010      // 16 ans d'ancienneté
    };

    const direction = { personnel: [agentProcheRetraite] };
    const ifcInitial = calculerIFC(direction, [], null, 2026, 62, 10, 238);

    expect(ifcInitial.totalProvision).toBeGreaterThan(0);
    expect(ifcInitial.agents[0].anciennete).toBe(16);

    // Si on augmente le Ségur, la provision IFC doit augmenter car basée sur le brut total
    const ifcHaute = calculerIFC(direction, [], null, 2026, 62, 10, 500);
    expect(ifcHaute.totalProvision).toBeGreaterThan(ifcInitial.totalProvision);
  });

});

describe('Stress Test — Simulateur d\'aléas subventions', () => {

  const recettes = [
    { id: 'r1', nom: 'Subvention Région',       montant: 10000 }, // 120 000 €/an — subvention
    { id: 'r2', nom: 'Subvention État',          montant: 5000  }, // 60 000 €/an  — subvention
    { id: 'r3', nom: 'Frais de scolarité',       montant: 3000  }, // 36 000 €/an  — pédagogique (non touché)
    { id: 'r4', nom: 'Droits d\'inscription',    montant: 1000  }, // 12 000 €/an  — pédagogique (non touché)
    { id: 'r5', nom: 'OPCO financement',         montant: 2000  }, // 24 000 €/an  — subvention
  ];

  const totalAnnuel      = (10000 + 5000 + 3000 + 1000 + 2000) * 12; // 252 000
  const subventionsAnnuel = (10000 + 5000 + 2000) * 12;               // 204 000
  const pedagogiquesAnnuel = (3000 + 1000) * 12;                      //  48 000

  it('stressTest = 0 : renvoie la somme annuelle sans modification', () => {
    const result = appliquerStressTest(recettes, 0);
    expect(result).toBe(totalAnnuel);
  });

  it('stressTest = null : équivalent à 0', () => {
    const result = appliquerStressTest(recettes, null);
    expect(result).toBe(totalAnnuel);
  });

  it('stressTest = -20 : réduit les subventions de 20%, laisse les recettes pédagogiques intactes', () => {
    const result = appliquerStressTest(recettes, -20);
    const expected = subventionsAnnuel * 0.80 + pedagogiquesAnnuel;
    expect(result).toBeCloseTo(expected, 0);
  });

  it('stressTest = +20 : augmente les subventions de 20%, laisse les recettes pédagogiques intactes', () => {
    const result = appliquerStressTest(recettes, 20);
    const expected = subventionsAnnuel * 1.20 + pedagogiquesAnnuel;
    expect(result).toBeCloseTo(expected, 0);
  });

  it('stressTest = -20 : résultat inférieur à stressTest = 0', () => {
    const base    = appliquerStressTest(recettes, 0);
    const stresse = appliquerStressTest(recettes, -20);
    expect(stresse).toBeLessThan(base);
    // L'impact en € doit être exactement 20% des subventions
    expect(base - stresse).toBeCloseTo(subventionsAnnuel * 0.20, 0);
  });

  it('stressTest = +10 : impact proportionnel et symétrique à -10', () => {
    const base = appliquerStressTest(recettes, 0);
    const plus  = appliquerStressTest(recettes, 10);
    const minus = appliquerStressTest(recettes, -10);
    expect(plus - base).toBeCloseTo(base - minus, 0);
  });

  it('liste sans subvention : stressTest n\'a aucun effet', () => {
    const recettesPures = [
      { id: 'x1', nom: 'Frais de scolarité', montant: 5000 },
      { id: 'x2', nom: 'Droits d\'inscription', montant: 2000 },
    ];
    const base  = appliquerStressTest(recettesPures, 0);
    const stresse = appliquerStressTest(recettesPures, -20);
    expect(stresse).toBe(base);
  });

  it('liste 100% subventions : stressTest -20 réduit tout de 20%', () => {
    const toutSubv = [
      { id: 's1', nom: 'Subvention CPOM', montant: 8000 },
      { id: 's2', nom: 'Subvention département', montant: 4000 },
    ];
    const base   = appliquerStressTest(toutSubv, 0);
    const stresse = appliquerStressTest(toutSubv, -20);
    expect(stresse).toBeCloseTo(base * 0.80, 0);
  });

  it('recettes vides : renvoie 0 quelle que soit la valeur du stress', () => {
    expect(appliquerStressTest([], 0)).toBe(0);
    expect(appliquerStressTest([], -20)).toBe(0);
    expect(appliquerStressTest([], 20)).toBe(0);
  });

  it('détection par mots-clés : "région", "opco", "cpom", "département" sont bien des subventions', () => {
    const mockedKeywords = [
      { id: 'k1', nom: 'Financement Région',    montant: 1000 },
      { id: 'k2', nom: 'Aide OPCO 2025',        montant: 1000 },
      { id: 'k3', nom: 'CPOM ARS',              montant: 1000 },
      { id: 'k4', nom: 'Aide du Département',   montant: 1000 },
      { id: 'k5', nom: 'Recette pédagogique',   montant: 1000 }, // pas une subvention
    ];
    const base   = appliquerStressTest(mockedKeywords, 0);   // 5 × 12 000 = 60 000
    const stresse = appliquerStressTest(mockedKeywords, -50); // 4 subv × 12 000 × 0,5 + 12 000 péda
    const subvAnnuel = 4 * 1000 * 12;
    const pedaAnnuel = 1 * 1000 * 12;
    expect(stresse).toBeCloseTo(subvAnnuel * 0.50 + pedaAnnuel, 0);
  });

});
