import { CHARGES_PATRONALES, PRIME_SEGUR, JOURS_ANNEE } from './constants';

// Fonctions de validation des champs numériques
export const validerNombre = (valeur, min = 0, max = Infinity) => {
  const num = parseFloat(valeur);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

export const validerEntier = (valeur, min = 0, max = Infinity) => {
  const num = parseInt(valeur);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

export const validerTaux = (valeur) => validerNombre(valeur, 0, 100);
export const validerETP = (valeur) => validerNombre(valeur, 0, 100);
export const validerSalaire = (valeur) => validerEntier(valeur, 0, 50000);
export const validerMontant = (valeur) => validerEntier(valeur, 0, 10000000);
export const validerDuree = (valeur) => validerEntier(valeur, 1, 50);
export const validerJours = (valeur) => validerEntier(valeur, 0, 365);
export const validerUnites = (valeur) => validerEntier(valeur, 1, 1000);

// Calcul de mensualité de prêt
export const calculerMensualitePret = (capital, dureeAnnees, tauxAnnuel) => {
  if (tauxAnnuel === 0 || capital === 0) return 0;
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const nombreMois = dureeAnnees * 12;
  const mensualite = capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nombreMois)) / (Math.pow(1 + tauxMensuel, nombreMois) - 1);
  return mensualite;
};

// Calcul du salaire annuel
export const calculerSalaireAnnuel = (salaire, etp, segur) => {
  const salaireAnnuel = salaire * 12 * etp;
  const charges = salaireAnnuel * CHARGES_PATRONALES;
  const primeSegur = segur ? (PRIME_SEGUR * 1.42) * 12 * etp : 0;
  return {
    brut: salaireAnnuel,
    charges: charges,
    segur: primeSegur,
    total: salaireAnnuel + charges + primeSegur
  };
};

// Calcul du tableau d'amortissement détaillé par année
export const calculerTableauAmortissement = (capital, dureeAnnees, tauxAnnuel) => {
  if (capital === 0 || dureeAnnees === 0) {
    return Array(dureeAnnees).fill({ interets: 0, capitalRembourse: 0, capitalRestant: 0 });
  }

  if (tauxAnnuel === 0) {
    const remboursementAnnuel = capital / dureeAnnees;
    return Array.from({ length: dureeAnnees }, (_, i) => ({
      interets: 0,
      capitalRembourse: remboursementAnnuel,
      capitalRestant: capital - remboursementAnnuel * (i + 1)
    }));
  }

  const tauxMensuel = tauxAnnuel / 100 / 12;
  const nombreMois = dureeAnnees * 12;
  const mensualite = capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nombreMois)) / (Math.pow(1 + tauxMensuel, nombreMois) - 1);

  const tableau = [];
  let capitalRestant = capital;

  for (let annee = 0; annee < dureeAnnees; annee++) {
    let interetsAnnee = 0;
    let capitalAnnee = 0;

    for (let mois = 0; mois < 12; mois++) {
      if (capitalRestant <= 0) break;
      const interetsMois = capitalRestant * tauxMensuel;
      const capitalMois = Math.min(mensualite - interetsMois, capitalRestant);
      interetsAnnee += interetsMois;
      capitalAnnee += capitalMois;
      capitalRestant -= capitalMois;
    }

    tableau.push({
      interets: interetsAnnee,
      capitalRembourse: capitalAnnee,
      capitalRestant: Math.max(0, capitalRestant)
    });
  }

  return tableau;
};

// Calcul d'amortissement et intérêts
export const calculerAmortissementEtInterets = (investissement) => {
  const { montant, duree, taux } = investissement;
  const amortissement = montant / duree;
  const mensualite = calculerMensualitePret(montant, duree, taux);
  const coutTotal = mensualite * duree * 12;
  const coutCredit = coutTotal - montant;

  const tableauAmort = calculerTableauAmortissement(montant, duree, taux);
  const interetsAnnee1 = tableauAmort.length > 0 ? tableauAmort[0].interets : 0;

  return {
    amortissement,
    interets: interetsAnnee1,
    interetsParAnnee: tableauAmort.map(a => a.interets),
    mensualite,
    coutTotal,
    coutCredit,
    tableauAmort
  };
};

// Calcul du budget Direction
export const calculerBudgetDirection = (direction) => {
  const detailsSalaires = direction.personnel.map(p => ({
    titre: p.titre,
    ...calculerSalaireAnnuel(p.salaire, p.etp, p.segur)
  }));

  const totalSalaires = detailsSalaires.reduce((sum, s) => sum + s.total, 0);
  const chargesSiege = (direction.loyer + direction.charges + direction.autresCharges) * 12;

  return {
    salaires: totalSalaires,
    detailsSalaires,
    chargesSiege,
    total: totalSalaires + chargesSiege
  };
};

// Calcul du budget Service (remplace calculerBudgetLieu)
export const calculerBudgetService = (service) => {
  const detailsSalaires = service.personnel.map(p => ({
    titre: p.titre,
    etp: p.etp,
    salaire: p.salaire,
    segur: p.segur,
    ...calculerSalaireAnnuel(p.salaire, p.etp, p.segur)
  }));

  const salaires = detailsSalaires.reduce((sum, s) => sum + s.total, 0);
  const exploitation = service.exploitation.reduce((sum, item) => sum + item.montant * 12, 0);

  let amortissements = 0;
  let interets = 0;
  let totalInvestissements = 0;
  const detailsInvest = {};
  const interetsParAnnee = [0, 0, 0];

  Object.entries(service.investissements).forEach(([key, inv]) => {
    const calc = calculerAmortissementEtInterets(inv);
    amortissements += calc.amortissement;
    interets += calc.interets;
    totalInvestissements += inv.montant;
    detailsInvest[key] = calc;

    for (let i = 0; i < 3; i++) {
      if (calc.interetsParAnnee && calc.interetsParAnnee[i] !== undefined) {
        interetsParAnnee[i] += calc.interetsParAnnee[i];
      }
    }
  });

  // Utilise unites et tauxActivite au lieu de enfantsParLieu et tauxRemplissage
  const unitesAnnuelles = service.unites * (service.tauxActivite / 100) * JOURS_ANNEE;
  const totalAvantAmort = salaires + exploitation + interets;
  const total = totalAvantAmort + amortissements;
  const coutUnite = unitesAnnuelles > 0 ? total / unitesAnnuelles : 0;

  return {
    salaires,
    detailsSalaires,
    exploitation,
    exploitationDetails: service.exploitation,
    amortissements,
    interets,
    interetsParAnnee,
    detailsInvest,
    unitesAnnuelles,
    total,
    coutUnite,
    totalInvestissements
  };
};

// Alias pour compatibilité
export const calculerBudgetLieu = calculerBudgetService;

// Calcul des provisions
export const calculerProvisions = (direction, services, globalParams) => {
  const budgetDir = calculerBudgetDirection(direction);
  let totalSalaires = budgetDir.salaires;
  let totalInvestissements = 0;
  let chiffreAffaires = 0;

  services.forEach(s => {
    const bService = calculerBudgetService(s);
    totalSalaires += bService.salaires;
    totalInvestissements += bService.totalInvestissements;
    chiffreAffaires += bService.total;
  });

  const provisionCongesPayes = totalSalaires * (globalParams.tauxProvisionCongesPayes / 100);
  const provisionGrossesReparations = totalInvestissements * (globalParams.tauxProvisionGrossesReparations / 100);
  const provisionCreancesDouteuses = chiffreAffaires * (globalParams.tauxProvisionCreancesDouteuses / 100);

  return {
    congesPayes: provisionCongesPayes,
    grossesReparations: provisionGrossesReparations,
    creancesDouteuses: provisionCreancesDouteuses,
    total: provisionCongesPayes + provisionGrossesReparations + provisionCreancesDouteuses
  };
};

// Calcul du BFR
export const calculerBFR = (direction, services, globalParams) => {
  let chiffreAffaires = 0;
  let achatsExploitation = 0;

  const budgetDir = calculerBudgetDirection(direction);
  achatsExploitation += budgetDir.chargesSiege;

  services.forEach(s => {
    const bService = calculerBudgetService(s);
    chiffreAffaires += bService.total;
    achatsExploitation += bService.exploitation;
  });

  const stocks = 0;
  const creancesClients = (chiffreAffaires / 365) * globalParams.delaiPaiementClients;
  const dettesFournisseurs = (achatsExploitation / 365) * globalParams.delaiPaiementFournisseurs;
  const bfr = stocks + creancesClients - dettesFournisseurs;
  const bfrEnJours = chiffreAffaires > 0 ? (bfr / chiffreAffaires) * 365 : 0;

  return {
    stocks,
    creancesClients,
    dettesFournisseurs,
    bfr,
    bfrEnJours,
    chiffreAffaires
  };
};

// Calcul synthèse 3 ans
export const calculerSynthese3Ans = (direction, services, globalParams) => {
  return [1, 2, 3].map(annee => {
    const indexAnnee = annee - 1;
    const augmentation = Math.pow(1 + globalParams.augmentationAnnuelle / 100, indexAnnee);
    const budgetDir = calculerBudgetDirection(direction);
    const budgetDirAjuste = (budgetDir.salaires + budgetDir.chargesSiege) * augmentation;

    let totalUnitesGlobal = 0;
    services.forEach(s => {
      const unitesService = s.unites * (s.tauxActivite / 100) * JOURS_ANNEE;
      totalUnitesGlobal += unitesService;
    });

    let totalGlobal = budgetDirAjuste;
    let totalUnites = 0;
    let amortTotal = 0;
    let interetsTotal = 0;
    let detailsServices = [];

    services.forEach(s => {
      const bService = calculerBudgetService(s);
      const budgetServiceAjuste = (bService.salaires + bService.exploitation) * augmentation;
      const interetsAnnee = bService.interetsParAnnee[indexAnnee] || 0;
      const proportionService = totalUnitesGlobal > 0 ? bService.unitesAnnuelles / totalUnitesGlobal : 0;
      const partSiege = budgetDirAjuste * proportionService;
      const budgetServiceTotal = budgetServiceAjuste + bService.amortissements + interetsAnnee + partSiege;

      totalGlobal += budgetServiceAjuste + bService.amortissements + interetsAnnee;
      totalUnites += bService.unitesAnnuelles;
      amortTotal += bService.amortissements;
      interetsTotal += interetsAnnee;

      detailsServices.push({
        nom: s.nom,
        budget: budgetServiceTotal,
        budgetSansAllocSiege: budgetServiceAjuste + bService.amortissements + interetsAnnee,
        partSiege: partSiege,
        proportionService: proportionService * 100,
        unites: bService.unitesAnnuelles,
        coutUnite: bService.unitesAnnuelles > 0 ? budgetServiceTotal / bService.unitesAnnuelles : 0,
        coutUniteSansAllocSiege: bService.unitesAnnuelles > 0 ? (budgetServiceAjuste + bService.amortissements + interetsAnnee) / bService.unitesAnnuelles : 0
      });
    });

    return {
      annee,
      total: totalGlobal,
      coutUnite: totalUnites > 0 ? totalGlobal / totalUnites : 0,
      amortissements: amortTotal,
      interets: interetsTotal,
      unites: totalUnites,
      budgetDirection: budgetDirAjuste,
      detailsServices
    };
  });
};

// Calcul budget annuel détaillé par mois
export const calculerBudgetAnnuelMensuel = (direction, services, globalParams) => {
  const budgetDir = calculerBudgetDirection(direction);

  let totalSalaires = budgetDir.salaires;
  let totalExploitation = budgetDir.chargesSiege;
  let totalAmortissements = 0;
  let totalInterets = 0;

  services.forEach(s => {
    const bService = calculerBudgetService(s);
    totalSalaires += bService.salaires;
    totalExploitation += bService.exploitation;
    totalAmortissements += bService.amortissements;
    totalInterets += bService.interets;
  });

  const total = totalSalaires + totalExploitation + totalAmortissements + totalInterets;

  // Répartition mensuelle (simplifiée - uniforme)
  const mois = [];
  for (let i = 0; i < 12; i++) {
    mois.push({
      mois: i + 1,
      salaires: totalSalaires / 12,
      exploitation: totalExploitation / 12,
      amortissements: totalAmortissements / 12,
      interets: totalInterets / 12,
      total: total / 12
    });
  }

  return {
    totalAnnuel: total,
    salaires: totalSalaires,
    exploitation: totalExploitation,
    amortissements: totalAmortissements,
    interets: totalInterets,
    mois
  };
};

// Fonction pour charger depuis localStorage
export const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};
