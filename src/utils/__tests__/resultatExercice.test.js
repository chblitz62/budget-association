import { describe, it, expect } from 'vitest';
import { calculerResultatExercice } from '../resultatExercice';
import { calculerCompteResultat } from '../compteResultat';
import { calculerBilanPrevisionnel } from '../bilanPrevisionnel';
import { calculerTableauFinancement } from '../tableauFinancement';

// ─── Générateur pseudo-aléatoire seedé (LCG) — reproductible ────────────────
const lcg = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

// ─── Configuration riche : Ségur modifié, coefficient BP ≠ 100, provisions,
//     taxe sur salaires, emprunt, Pool RH, vacataires ────────────────────────
const richDirection = {
  personnel: [
    { id: 'p1', titre: 'Directeur', salaire: 4500, etp: 1, segur: true },
    { id: 'p2', titre: 'Comptable', salaire: 2400, etp: 0.8, segur: false },
  ],
  recettes: [{ id: 'r1', nom: 'Subvention Région fonctionnement', montant: 8000 }],
  chargesSiege: [{ id: 'c1', nom: 'Loyer', montant: 1800 }],
  investissements: {
    batiment: { montant: 120000, duree: 20, ageAns: 0, financementEmprunt: 80, dureePret: 15, taux: 3 },
  },
};

const richServices = [
  {
    id: 'svc1', nom: 'Formation Initiale', tauxActivite: 100,
    personnel: [
      { id: 's1', titre: 'Formateur ES', salaire: 2600, etp: 1, segur: true, eligibleSubvention: true, tauxSubvRegion: 90 },
    ],
    vacataires: [
      { id: 'v1', nom: 'Intervenant', heuresAnnuelles: 200, tauxHoraire: 35, type: 'fi' },
    ],
    exploitation: [{ id: 'e1', nom: 'Fournitures pédagogiques', montant: 900 }],
    recettes: [{ id: 'r2', nom: 'Prestation formation continue', montant: 4000 }],
    investissements: {
      vehicule: { montant: 24000, duree: 5, ageAns: 0, financementEmprunt: 50, dureePret: 5, taux: 4 },
    },
  },
];

const richPoleSupport = {
  personnel: [{ id: 'ps1', titre: 'Agent entretien', salaire: 1900, etp: 0.5, segur: false }],
  exploitation: [{ id: 'e2', nom: 'Maintenance', montant: 300 }],
  recettes: [],
  investissements: {},
};

const richPoolRH = [
  {
    id: 'pool1', titre: 'Chargé RH mutualisé', salaire: 2800, etp: 1, segur: true, typeContrat: 'CDI',
    affectations: [
      { entityType: 'direction', pct: 40 },
      { entityType: 'service', entityId: 'svc1', pct: 60 },
    ],
  },
];

const richGlobalParams = {
  anneeExercice: 2026,
  montantSegurETP: 300,      // Ségur modifié (≠ défaut 238)
  coefficientBP: 80,         // Coefficient BP ≠ 100
  taxeSalaires: true,        // Taxe sur salaires activée
  augmentationAnnuelle: 0,
  delaiPaiementClients: 60,
  delaiPaiementFournisseurs: 30,
  delaiPaiementURSSAF: 45,
  stocksValeur: 2000,
  provisions: [
    { id: 'cp', nom: 'Congés payés', baseCalcul: 'salaires', taux: 10 },
    { id: 'gr', nom: 'Grosses réparations', baseCalcul: 'investissements', taux: 2 },
  ],
  fondRoulement: [{ id: 'res', nom: 'Réserves', montant: 80000 }],
};

const ARGS = [richDirection, richServices, richPoleSupport, richGlobalParams, richPoolRH, null];

describe('resultatExercice — source unique de vérité', () => {
  it('inclut provisions et taxe sur salaires dans les charges totales', () => {
    const rex = calculerResultatExercice(...ARGS);
    expect(rex.provisions).toBeGreaterThan(0);
    expect(rex.taxeSalaires).toBeGreaterThan(0);
    expect(rex.chargesTotales).toBeCloseTo(rex.chargesBudgetaires + rex.provisions + rex.taxeSalaires, 6);
    expect(rex.resultatNet).toBeCloseTo(rex.produits - rex.chargesTotales, 6);
  });

  it('décompose la masse salariale en brut réel + charges sociales (somme exacte)', () => {
    const rex = calculerResultatExercice(...ARGS);
    expect(rex.detail.remunerationsBrutes).toBeGreaterThan(0);
    expect(rex.detail.chargesSociales).toBeGreaterThan(0);
    expect(rex.detail.remunerationsBrutes + rex.detail.chargesSociales).toBeCloseTo(rex.detail.totalSalaires, 4);
  });

  it('applique le Ségur et le coefficient BP modifiés (sensibilité)', () => {
    const base = calculerResultatExercice(...ARGS);
    const segurDouble = calculerResultatExercice(richDirection, richServices, richPoleSupport,
      { ...richGlobalParams, montantSegurETP: 600 }, richPoolRH, null);
    const bp100 = calculerResultatExercice(richDirection, richServices, richPoleSupport,
      { ...richGlobalParams, coefficientBP: 100 }, richPoolRH, null);
    expect(segurDouble.chargesTotales).toBeGreaterThan(base.chargesTotales);
    expect(bp100.produits).toBeGreaterThan(base.produits);
  });
});

describe('réconciliation des 4 états financiers', () => {
  it('compte de résultat : resultatNet identique à la source unique', () => {
    const rex = calculerResultatExercice(...ARGS);
    const cr = calculerCompteResultat(...ARGS);
    expect(cr.totaux.resultatNet).toBeCloseTo(rex.resultatNet, 4);
    expect(Math.abs(cr.coherence.ecart)).toBeLessThan(0.01);
  });

  it('compte de résultat : totaux charges et produits égaux à la source unique', () => {
    const rex = calculerResultatExercice(...ARGS);
    const cr = calculerCompteResultat(...ARGS);
    expect(cr.totaux.totalCharges).toBeCloseTo(rex.chargesTotales, 4);
    expect(cr.totaux.totalProduits).toBeCloseTo(rex.produits, 4);
  });

  it('compte de résultat : la taxe sur salaires (compte 63) est non nulle quand activée', () => {
    const cr = calculerCompteResultat(...ARGS);
    const ligne63 = cr.charges.find(c => c.code === '63');
    expect(ligne63).toBeDefined();
    expect(ligne63.montant).toBeGreaterThan(0);
  });

  it('bilan prévisionnel : resultatExercice identique à la source unique', () => {
    const rex = calculerResultatExercice(...ARGS);
    const bilan = calculerBilanPrevisionnel(...ARGS);
    expect(bilan.passif.resultatExercice).toBeCloseTo(rex.resultatNet, 4);
  });

  it('tableau de financement : résultat de la CAF identique à la source unique', () => {
    const rex = calculerResultatExercice(...ARGS);
    const tf = calculerTableauFinancement(...ARGS);
    expect(tf.detail.caf.resultat).toBeCloseTo(rex.resultatNet, 4);
    expect(tf.detail.caf.dotProvisions).toBeCloseTo(rex.provisions, 4);
  });

  it('le CR réagit au Ségur et au coefficient BP (plus de divergence de paramétrage)', () => {
    const cr1 = calculerCompteResultat(...ARGS);
    const cr2 = calculerCompteResultat(richDirection, richServices, richPoleSupport,
      { ...richGlobalParams, montantSegurETP: 600, coefficientBP: 100 }, richPoolRH, null);
    expect(cr2.totaux.totalCharges).not.toBeCloseTo(cr1.totaux.totalCharges, 0);
    expect(cr2.totaux.totalProduits).not.toBeCloseTo(cr1.totaux.totalProduits, 0);
  });
});

describe('bilan prévisionnel — équilibre actif/passif garanti', () => {
  it('est équilibré AVEC provisions et emprunts (cas historiquement déséquilibré)', () => {
    const bilan = calculerBilanPrevisionnel(...ARGS);
    expect(bilan.passif.provisions).toBeGreaterThan(0);
    expect(bilan.passif.dettesFinancieres).toBeGreaterThan(0);
    expect(Math.abs(bilan.equilibre.ecart)).toBeLessThan(1);
    expect(bilan.equilibre.valide).toBe(true);
  });

  it('reste équilibré sur 25 configurations pseudo-aléatoires (seed fixe)', () => {
    const rand = lcg(20260712);
    for (let i = 0; i < 25; i++) {
      const dir = {
        personnel: [{ id: 'p1', titre: 'Dir', salaire: 2000 + Math.round(rand() * 4000), etp: 0.5 + rand(), segur: rand() > 0.5 }],
        recettes: [{ id: 'r1', nom: 'Subvention Région', montant: Math.round(rand() * 20000) }],
        chargesSiege: [{ id: 'c1', nom: 'Loyer', montant: Math.round(rand() * 3000) }],
        investissements: rand() > 0.3 ? {
          immo: {
            montant: Math.round(rand() * 200000), duree: 5 + Math.round(rand() * 20),
            ageAns: Math.round(rand() * 3),
            financementEmprunt: Math.round(rand() * 100),
            dureePret: 5 + Math.round(rand() * 15), taux: rand() * 5,
          },
        } : {},
      };
      const svcs = [{
        id: 'svc1', nom: 'Service A', tauxActivite: 100,
        personnel: [{ id: 's1', titre: 'Formateur', salaire: 2000 + Math.round(rand() * 2000), etp: 1, segur: rand() > 0.5, eligibleSubvention: rand() > 0.5 }],
        exploitation: [{ id: 'e1', nom: 'Fournitures', montant: Math.round(rand() * 2000) }],
        recettes: [{ id: 'r2', nom: 'Prestation FC', montant: Math.round(rand() * 10000) }],
        investissements: {},
      }];
      const gp = {
        ...richGlobalParams,
        coefficientBP: 60 + Math.round(rand() * 40),
        montantSegurETP: Math.round(rand() * 400),
        taxeSalaires: rand() > 0.5,
        stocksValeur: Math.round(rand() * 5000),
        provisions: rand() > 0.3
          ? [{ id: 'cp', nom: 'CP', baseCalcul: 'salaires', taux: rand() * 15 }]
          : [],
        fondRoulement: [{ id: 'res', nom: 'Réserves', montant: Math.round(rand() * 150000) - 20000 }],
      };
      const bilan = calculerBilanPrevisionnel(dir, svcs, null, gp, [], null);
      expect(Math.abs(bilan.equilibre.ecart), `config #${i} déséquilibrée (écart ${bilan.equilibre.ecart})`).toBeLessThan(1);
      // Actif et passif recalculés depuis leurs composantes
      const sumActif = bilan.actif.immobilisationsNettes + bilan.actif.stocks + bilan.actif.creancesClients + bilan.actif.disponibilites;
      const sumPassif = bilan.passif.totalCapitauxPropres + bilan.passif.provisions + bilan.passif.dettesFinancieres
        + bilan.passif.dettesFournisseurs + bilan.passif.dettesURSSAF + bilan.passif.decouvert;
      expect(bilan.actif.totalActif).toBeCloseTo(sumActif, 4);
      expect(bilan.passif.totalPassif).toBeCloseTo(sumPassif, 4);
    }
  });

  it('la trésorerie découle du FRNG : trésorerie nette = FRNG − BFR', () => {
    const bilan = calculerBilanPrevisionnel(...ARGS);
    expect(bilan.tresorerieNette).toBeCloseTo(bilan.frng - bilan.bfr, 4);
    expect(bilan.actif.disponibilites - bilan.passif.decouvert).toBeCloseTo(bilan.tresorerieNette, 4);
  });
});
