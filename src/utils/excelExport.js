import * as XLSX from 'xlsx';
import { COMPTES_EXPLOITATION, COMPTES_RECETTES, COMPTES_IMMO, MOIS, SITES, TAUX_CHARGE_TOTAL } from './constants';
import { calculerBudgetDirection, calculerBudgetService, calculerBudgetPoleSupport, calculerProvisions, calculerBFR, calculerSynthese3Ans } from './calculations';
import { formatEuroNumber as formatEuro } from './formatting';

// Styles pour les en-têtes (via largeur de colonnes)
const setColumnWidths = (ws, widths) => {
  ws['!cols'] = widths.map(w => ({ wch: w }));
};

// Helper : détail des charges siège (supporte ancien et nouveau format)
const getChargesSiegeDetail = (direction) => {
  if (direction.chargesSiege && Array.isArray(direction.chargesSiege)) {
    return direction.chargesSiege.map(c => ({ nom: c.nom, montant: c.montant * 12 }));
  }
  return [
    { nom: 'Loyer siège', montant: (direction.loyer || 0) * 12 },
    { nom: 'Charges siège', montant: (direction.charges || 0) * 12 },
    { nom: 'Autres charges siège', montant: (direction.autresCharges || 0) * 12 },
  ].filter(c => c.montant > 0);
};

// Créer l'onglet Compte de Résultat
const createCompteResultat = (direction, services, poleSupport = null) => {
  const budgetDir = calculerBudgetDirection(direction);
  const budgetPS = poleSupport ? calculerBudgetPoleSupport(poleSupport) : null;
  const budgetsServices = services.map(s => ({
    nom: s.nom,
    budget: calculerBudgetService(s)
  }));
  if (budgetPS) budgetsServices.push({ nom: 'Pôle Ressource', budget: budgetPS });

  const data = [];

  // Titre
  data.push(['COMPTE DE RÉSULTAT PRÉVISIONNEL']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);

  // CHARGES (classe 6)
  data.push(['CHARGES', 'Compte PCG', 'Montant (€)']);
  data.push([]);

  // 60 - Achats
  data.push(['60 - ACHATS ET CHARGES EXTERNES']);
  let totalAchats = 0;

  // Regrouper les charges d'exploitation par compte
  const chargesParCompte = {};
  budgetsServices.forEach(({ nom, budget }) => {
    (budget.exploitationDetails || []).forEach(item => {
      const compte = COMPTES_EXPLOITATION[item.nom] || '6';
      if (!chargesParCompte[compte]) {
        chargesParCompte[compte] = { libelle: item.nom, montant: 0 };
      }
      chargesParCompte[compte].montant += item.montant * 12;
    });
  });

  Object.entries(chargesParCompte).sort((a, b) => a[0].localeCompare(b[0])).forEach(([compte, { libelle, montant }]) => {
    data.push([`  ${libelle}`, compte, formatEuro(montant)]);
    totalAchats += montant;
  });

  // Charges siège (supporte les deux formats)
  const chargesSiegeDetail = getChargesSiegeDetail(direction);
  chargesSiegeDetail.forEach(c => {
    data.push([`  ${c.nom}`, '6', formatEuro(c.montant)]);
  });
  totalAchats += budgetDir.chargesSiege;

  data.push(['TOTAL ACHATS ET CHARGES EXTERNES', '', formatEuro(totalAchats)]);
  data.push([]);

  // 64 - Charges de personnel
  data.push(['64 - CHARGES DE PERSONNEL']);
  let totalPersonnel = budgetDir.salaires;
  data.push(['  Personnel Siège', '641/645', formatEuro(budgetDir.salaires)]);

  budgetsServices.forEach(({ nom, budget }) => {
    data.push([`  Personnel ${nom}`, '641/645', formatEuro(budget.salaires)]);
    totalPersonnel += budget.salaires;
  });

  data.push(['TOTAL CHARGES DE PERSONNEL', '', formatEuro(totalPersonnel)]);
  data.push([]);

  // 68 - Dotations aux amortissements
  data.push(['68 - DOTATIONS AUX AMORTISSEMENTS']);
  let totalAmort = 0;
  budgetsServices.forEach(({ nom, budget }) => {
    if ((budget.amortissements || 0) > 0) {
      data.push([`  Amortissements ${nom}`, '681', formatEuro(budget.amortissements)]);
      totalAmort += budget.amortissements;
    }
  });
  data.push(['TOTAL DOTATIONS AUX AMORTISSEMENTS', '', formatEuro(totalAmort)]);
  data.push([]);

  // 66 - Charges financières
  data.push(['66 - CHARGES FINANCIÈRES']);
  let totalInterets = 0;
  budgetsServices.forEach(({ nom, budget }) => {
    if ((budget.interets || 0) > 0) {
      data.push([`  Intérêts emprunts ${nom}`, '661', formatEuro(budget.interets)]);
      totalInterets += budget.interets;
    }
  });
  data.push(['TOTAL CHARGES FINANCIÈRES', '', formatEuro(totalInterets)]);
  data.push([]);

  const totalCharges = totalAchats + totalPersonnel + totalAmort + totalInterets;
  data.push(['TOTAL CHARGES', '', formatEuro(totalCharges)]);
  data.push([]);
  data.push([]);

  // PRODUITS (classe 7)
  data.push(['PRODUITS', 'Compte PCG', 'Montant (€)']);
  data.push([]);

  const produitsParCompte = { '70': [], '74': [], '75': [] };

  budgetsServices.forEach(({ nom, budget }) => {
    (budget.recettesDetails || []).forEach(item => {
      const compte = COMPTES_RECETTES[item.nom] || '70';
      const classe = compte.startsWith('74') ? '74' : compte.startsWith('75') ? '75' : '70';
      produitsParCompte[classe].push({
        libelle: `${item.nom} (${nom})`,
        compte,
        montant: item.montant * 12
      });
    });
  });

  let totalVentes = 0;
  data.push(['70 - VENTES ET PRESTATIONS DE SERVICES']);
  produitsParCompte['70'].forEach(({ libelle, compte, montant }) => {
    data.push([`  ${libelle}`, compte, formatEuro(montant)]);
    totalVentes += montant;
  });
  data.push(['TOTAL VENTES ET PRESTATIONS', '', formatEuro(totalVentes)]);
  data.push([]);

  let totalSubventions = 0;
  data.push(['74 - SUBVENTIONS D\'EXPLOITATION']);
  produitsParCompte['74'].forEach(({ libelle, compte, montant }) => {
    data.push([`  ${libelle}`, compte, formatEuro(montant)]);
    totalSubventions += montant;
  });
  data.push(['TOTAL SUBVENTIONS', '', formatEuro(totalSubventions)]);
  data.push([]);

  let totalAutres = 0;
  if (produitsParCompte['75'].length > 0) {
    data.push(['75 - AUTRES PRODUITS DE GESTION COURANTE']);
    produitsParCompte['75'].forEach(({ libelle, compte, montant }) => {
      data.push([`  ${libelle}`, compte, formatEuro(montant)]);
      totalAutres += montant;
    });
    data.push(['TOTAL AUTRES PRODUITS', '', formatEuro(totalAutres)]);
    data.push([]);
  }

  const totalProduits = totalVentes + totalSubventions + totalAutres;
  data.push(['TOTAL PRODUITS', '', formatEuro(totalProduits)]);
  data.push([]);
  data.push([]);

  // Résultat
  const resultat = totalProduits - totalCharges;
  data.push(['RÉSULTAT D\'EXPLOITATION', '', formatEuro(resultat)]);
  data.push([resultat >= 0 ? 'EXCÉDENT' : 'DÉFICIT', '', formatEuro(Math.abs(resultat))]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [45, 15, 15]);
  return ws;
};

// Créer l'onglet Balance Générale
const createBalance = (direction, services, poleSupport = null) => {
  const budgetDir = calculerBudgetDirection(direction);
  const budgetPS = poleSupport ? calculerBudgetPoleSupport(poleSupport) : null;
  const budgetsServices = services.map(s => ({
    nom: s.nom,
    budget: calculerBudgetService(s)
  }));

  const data = [];
  data.push(['BALANCE GÉNÉRALE']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);
  data.push(['Compte', 'Libellé', 'Débit (€)', 'Crédit (€)']);

  const comptes = {};

  // Personnel : 641 (rémunérations brutes) et 645 (charges patronales)
  comptes['641'] = { libelle: 'Rémunérations du personnel', debit: 0, credit: 0 };
  comptes['645'] = { libelle: 'Charges sociales', debit: 0, credit: 0 };

  const addSalaires = (detailsSalaires) => {
    (detailsSalaires || []).forEach(s => {
      // s.segur = montantSegur × TAUX_CHARGE_TOTAL × 12 × etp
      // segurBrut = s.segur / TAUX_CHARGE_TOTAL
      const segurBrut = s.segur / TAUX_CHARGE_TOTAL;
      comptes['641'].debit += s.brut + segurBrut;
      comptes['645'].debit += s.charges + (s.segur - segurBrut);
    });
  };

  addSalaires(budgetDir.detailsSalaires);
  if (budgetPS) addSalaires(budgetPS.detailsSalaires);
  budgetsServices.forEach(({ budget }) => addSalaires(budget.detailsSalaires));

  // Exploitation siège (supporte les deux formats)
  const chargesSiegeDetail = getChargesSiegeDetail(direction);
  chargesSiegeDetail.forEach(c => {
    if (!comptes['6']) comptes['6'] = { libelle: 'Charges siège diverses', debit: 0, credit: 0 };
    comptes['6'].debit += c.montant;
  });

  // Exploitation services + pôle support
  const allBudgets = budgetPS
    ? [...budgetsServices, { nom: 'Pôle Ressource', budget: budgetPS }]
    : budgetsServices;

  allBudgets.forEach(({ budget }) => {
    (budget.exploitationDetails || []).forEach(item => {
      const compte = COMPTES_EXPLOITATION[item.nom] || '6';
      if (!comptes[compte]) {
        comptes[compte] = { libelle: item.nom, debit: 0, credit: 0 };
      }
      comptes[compte].debit += item.montant * 12;
    });
  });

  // Amortissements
  comptes['681'] = { libelle: 'Dotations aux amortissements', debit: 0, credit: 0 };
  budgetsServices.forEach(({ budget }) => {
    comptes['681'].debit += budget.amortissements || 0;
  });

  // Intérêts
  comptes['661'] = { libelle: 'Charges d\'intérêts', debit: 0, credit: 0 };
  budgetsServices.forEach(({ budget }) => {
    comptes['661'].debit += budget.interets || 0;
  });

  // Produits (crédit)
  allBudgets.forEach(({ budget }) => {
    (budget.recettesDetails || []).forEach(item => {
      const compte = COMPTES_RECETTES[item.nom] || '706';
      if (!comptes[compte]) {
        comptes[compte] = { libelle: item.nom, debit: 0, credit: 0 };
      }
      comptes[compte].credit += item.montant * 12;
    });
  });

  // Trier et afficher
  let totalDebit = 0;
  let totalCredit = 0;

  Object.entries(comptes)
    .filter(([_, v]) => v.debit > 0 || v.credit > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([compte, { libelle, debit, credit }]) => {
      data.push([compte, libelle, formatEuro(debit), formatEuro(credit)]);
      totalDebit += debit;
      totalCredit += credit;
    });

  data.push([]);
  data.push(['', 'TOTAUX', formatEuro(totalDebit), formatEuro(totalCredit)]);
  data.push(['', 'SOLDE', '', formatEuro(totalCredit - totalDebit)]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [10, 35, 15, 15]);
  return ws;
};

// Créer l'onglet Détail Charges
const createDetailCharges = (direction, services, poleSupport = null) => {
  const budgetDir = calculerBudgetDirection(direction);
  const budgetPS = poleSupport ? calculerBudgetPoleSupport(poleSupport) : null;

  const data = [];
  data.push(['DÉTAIL DES CHARGES PAR SERVICE']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);

  // Direction
  data.push(['DIRECTION']);
  data.push(['Poste', 'ETP', 'Salaire brut', 'Charges', 'Prime Ségur', 'Coût total']);
  budgetDir.detailsSalaires.forEach(s => {
    data.push([s.titre, '', formatEuro(s.brut), formatEuro(s.charges), formatEuro(s.segur), formatEuro(s.total)]);
  });
  data.push(['TOTAL SALAIRES DIRECTION', '', '', '', '', formatEuro(budgetDir.salaires)]);
  data.push([]);

  const chargesSiegeDetail = getChargesSiegeDetail(direction);
  chargesSiegeDetail.forEach(c => {
    data.push([c.nom, '', '', '', '', formatEuro(c.montant)]);
  });
  data.push(['Charges siège (total)', '', '', '', '', formatEuro(budgetDir.chargesSiege)]);
  data.push(['TOTAL DIRECTION', '', '', '', '', formatEuro(budgetDir.total)]);
  data.push([]);
  data.push([]);

  // Pôle Support
  if (budgetPS) {
    data.push(['PÔLE SUPPORT']);
    data.push(['Poste', 'ETP', 'Salaire brut', 'Charges', 'Prime Ségur', 'Coût total']);
    budgetPS.detailsSalaires.forEach(s => {
      data.push([s.titre, '', formatEuro(s.brut), formatEuro(s.charges), formatEuro(s.segur), formatEuro(s.total)]);
    });
    data.push(['TOTAL SALAIRES PÔLE SUPPORT', '', '', '', '', formatEuro(budgetPS.salaires)]);
    data.push([]);
    if ((budgetPS.exploitationDetails || []).length > 0) {
      data.push(['CHARGES EXPLOITATION PÔLE SUPPORT']);
      budgetPS.exploitationDetails.forEach(item => {
        data.push([item.nom, '', '', '', '', formatEuro(item.montant * 12)]);
      });
      data.push(['TOTAL EXPLOITATION PÔLE SUPPORT', '', '', '', '', formatEuro(budgetPS.exploitation)]);
    }
    data.push(['TOTAL PÔLE SUPPORT', '', '', '', '', formatEuro(budgetPS.total)]);
    data.push([]);
    data.push([]);
  }

  // Services
  services.forEach(service => {
    const budget = calculerBudgetService(service);

    data.push([service.nom.toUpperCase()]);
    data.push([]);

    // Personnel
    data.push(['MASSE SALARIALE']);
    data.push(['Poste', 'ETP', 'Salaire brut', 'Charges', 'Prime Ségur', 'Coût total']);
    budget.detailsSalaires.forEach(s => {
      data.push([s.titre, s.etp, formatEuro(s.brut), formatEuro(s.charges), formatEuro(s.segur), formatEuro(s.total)]);
    });
    data.push(['TOTAL MASSE SALARIALE', '', '', '', '', formatEuro(budget.salaires)]);
    data.push([]);

    // Exploitation
    data.push(['CHARGES D\'EXPLOITATION']);
    data.push(['Nature', 'Compte PCG', 'Montant mensuel', 'Montant annuel']);
    budget.exploitationDetails.forEach(item => {
      const compte = COMPTES_EXPLOITATION[item.nom] || '';
      data.push([item.nom, compte, formatEuro(item.montant), formatEuro(item.montant * 12)]);
    });
    data.push(['TOTAL EXPLOITATION', '', '', formatEuro(budget.exploitation)]);
    data.push([]);

    // Amortissements
    if (budget.amortissements > 0) {
      data.push(['DOTATIONS AUX AMORTISSEMENTS']);
      data.push(['Type', 'Compte PCG', 'Montant', 'Durée', 'Dotation annuelle']);
      Object.entries(service.investissements).forEach(([key, inv]) => {
        if (inv.montant > 0) {
          const compteInfo = COMPTES_IMMO[key] || { compte: '2', libelle: key };
          data.push([compteInfo.libelle, compteInfo.compte, formatEuro(inv.montant), `${inv.duree} ans`, formatEuro(inv.montant / inv.duree)]);
        }
      });
      data.push(['TOTAL AMORTISSEMENTS', '', '', '', formatEuro(budget.amortissements)]);
      data.push([]);
    }

    // Intérêts
    if (budget.interets > 0) {
      data.push(['CHARGES FINANCIÈRES']);
      data.push(['Intérêts des emprunts', '661', '', '', formatEuro(budget.interets)]);
      data.push([]);
    }

    data.push(['TOTAL CHARGES ' + service.nom.toUpperCase(), '', '', '', '', formatEuro(budget.total)]);
    data.push([]);
    data.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [30, 12, 15, 15, 15, 15]);
  return ws;
};

// Créer l'onglet Détail Produits
const createDetailProduits = (services) => {
  const data = [];
  data.push(['DÉTAIL DES PRODUITS PAR SERVICE']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);

  let totalGeneral = 0;

  services.forEach(service => {
    const budget = calculerBudgetService(service);

    data.push([service.nom.toUpperCase()]);
    data.push(['Nature', 'Compte PCG', 'Montant mensuel', 'Montant annuel']);

    budget.recettesDetails.forEach(item => {
      const compte = COMPTES_RECETTES[item.nom] || '70';
      data.push([item.nom, compte, formatEuro(item.montant), formatEuro(item.montant * 12)]);
    });

    data.push(['TOTAL ' + service.nom.toUpperCase(), '', '', formatEuro(budget.recettes)]);
    totalGeneral += budget.recettes;
    data.push([]);
    data.push([]);
  });

  data.push(['TOTAL GÉNÉRAL DES PRODUITS', '', '', formatEuro(totalGeneral)]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [35, 12, 18, 18]);
  return ws;
};

// Créer l'onglet Effectifs
const createEffectifs = (services) => {
  const data = [];
  data.push(['TABLEAU DES EFFECTIFS ÉTUDIANTS']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);

  const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const moisKeys = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

  services.forEach(service => {
    if (!service.promos) return;

    data.push([service.nom.toUpperCase()]);
    data.push([]);

    Object.entries(service.promos).forEach(([site, promos]) => {
      data.push([`Site de ${site}`]);
      data.push(['Promotion', 'Effectif initial', ...moisCourts, 'Total abandons', 'Effectif actuel', 'Taux rétention']);

      let totalInitial = 0;
      let totalAbandons = 0;

      promos.forEach(promo => {
        const abandonsParMois = moisKeys.map(m => promo.abandons[m] || 0);
        const totalAbandonPromo = abandonsParMois.reduce((s, v) => s + v, 0);
        const effectifActuel = promo.effectifInitial - totalAbandonPromo;
        const tauxRetention = promo.effectifInitial > 0 ? ((effectifActuel / promo.effectifInitial) * 100).toFixed(1) + '%' : '0%';

        data.push([
          promo.nom,
          promo.effectifInitial,
          ...abandonsParMois,
          totalAbandonPromo,
          effectifActuel,
          tauxRetention
        ]);

        totalInitial += promo.effectifInitial;
        totalAbandons += totalAbandonPromo;
      });

      const tauxGlobal = totalInitial > 0 ? (((totalInitial - totalAbandons) / totalInitial) * 100).toFixed(1) + '%' : '0%';
      data.push(['TOTAL ' + site.toUpperCase(), totalInitial, ...Array(12).fill(''), totalAbandons, totalInitial - totalAbandons, tauxGlobal]);
      data.push([]);
    });

    data.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [20, 12, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 12, 12, 12]);
  return ws;
};

// Créer l'onglet Budget 3 ans
const createBudget3Ans = (direction, services, globalParams, poleSupport = null) => {
  const synthese = calculerSynthese3Ans(direction, services, globalParams, poleSupport);

  const data = [];
  data.push(['BUDGET PRÉVISIONNEL SUR 3 ANS']);
  data.push(['Association AFERTES']);
  data.push([`Hypothèse d'augmentation annuelle: ${globalParams.augmentationAnnuelle}%`]);
  data.push([]);

  data.push(['', 'Année 1', 'Année 2', 'Année 3', 'Évolution']);
  data.push([]);

  const evo = synthese[0].total > 0
    ? `+${((synthese[2].total / synthese[0].total - 1) * 100).toFixed(1)}%`
    : '-';

  data.push(['BUDGET TOTAL',
    formatEuro(synthese[0].total),
    formatEuro(synthese[1].total),
    formatEuro(synthese[2].total),
    evo
  ]);

  data.push(['dont Siège',
    formatEuro(synthese[0].budgetDirection),
    formatEuro(synthese[1].budgetDirection),
    formatEuro(synthese[2].budgetDirection),
    ''
  ]);

  data.push(['dont Amortissements',
    formatEuro(synthese[0].amortissements),
    formatEuro(synthese[1].amortissements),
    formatEuro(synthese[2].amortissements),
    ''
  ]);

  data.push(['dont Intérêts',
    formatEuro(synthese[0].interets),
    formatEuro(synthese[1].interets),
    formatEuro(synthese[2].interets),
    ''
  ]);

  data.push([]);
  data.push(['DÉTAIL PAR SERVICE']);
  data.push([]);

  services.forEach((service, idx) => {
    const s1 = synthese[0].detailsServices[idx];
    const s2 = synthese[1].detailsServices[idx];
    const s3 = synthese[2].detailsServices[idx];
    if (!s1) return;

    data.push([service.nom]);
    data.push(['  Budget total', formatEuro(s1.budget), formatEuro(s2.budget), formatEuro(s3.budget), '']);
    data.push(['  Part siège allouée', formatEuro(s1.partSiege), formatEuro(s2.partSiege), formatEuro(s3.partSiege), '']);
    data.push(['  Unités (jours-étudiants)', Math.round(s1.unites), Math.round(s2.unites), Math.round(s3.unites), '']);
    data.push(['  Coût par unité', formatEuro(s1.coutUnite), formatEuro(s2.coutUnite), formatEuro(s3.coutUnite), '']);
    data.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [25, 15, 15, 15, 12]);
  return ws;
};

// Créer l'onglet Amortissements
const createAmortissements = (services) => {
  const data = [];
  data.push(['TABLEAU DES AMORTISSEMENTS']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);

  data.push(['Service', 'Nature', 'Compte', 'Valeur brute', 'Durée', 'Taux', 'Dot. annuelle', 'Intérêts A1', 'Intérêts A2', 'Intérêts A3']);

  let totalValeur = 0;
  let totalDotation = 0;

  services.forEach(service => {
    Object.entries(service.investissements).forEach(([key, inv]) => {
      if (inv.montant > 0) {
        const compteInfo = COMPTES_IMMO[key] || { compte: '2', libelle: key };
        const dotation = inv.montant / inv.duree;
        const budget = calculerBudgetService(service);
        const interets = budget.detailsInvest[key]?.interetsParAnnee || [0, 0, 0];

        data.push([
          service.nom,
          compteInfo.libelle,
          compteInfo.compte,
          formatEuro(inv.montant),
          `${inv.duree} ans`,
          `${(100 / inv.duree).toFixed(2)}%`,
          formatEuro(dotation),
          formatEuro(interets[0]),
          formatEuro(interets[1]),
          formatEuro(interets[2])
        ]);

        totalValeur += inv.montant;
        totalDotation += dotation;
      }
    });
  });

  data.push([]);
  data.push(['TOTAUX', '', '', formatEuro(totalValeur), '', '', formatEuro(totalDotation), '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [20, 25, 10, 12, 10, 10, 12, 12, 12, 12]);
  return ws;
};

// Créer l'onglet Synthèse
const createSynthese = (direction, services, globalParams, poleSupport = null) => {
  const budgetDir = calculerBudgetDirection(direction);
  const budgetPS = poleSupport ? calculerBudgetPoleSupport(poleSupport) : null;
  const provisions = calculerProvisions(direction, services, globalParams, poleSupport);
  const bfr = calculerBFR(direction, services, globalParams, poleSupport);

  const data = [];
  data.push(['SYNTHÈSE BUDGÉTAIRE']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);

  data.push(['SERVICE', 'CHARGES', 'PRODUITS', 'SOLDE', 'INDICATEUR']);
  data.push([]);

  data.push(['Siège', formatEuro(budgetDir.total), '-', formatEuro(-budgetDir.total), '']);

  let totalCharges = budgetDir.total;
  let totalProduits = 0;

  if (budgetPS) {
    data.push(['Pôle Ressource', formatEuro(budgetPS.total), formatEuro(budgetPS.recettes || 0), formatEuro((budgetPS.recettes || 0) - budgetPS.total), '']);
    totalCharges += budgetPS.total;
    totalProduits += budgetPS.recettes || 0;
  }

  services.forEach(service => {
    const budget = calculerBudgetService(service);
    const indicateur = budget.solde >= 0 ? 'EXCÉDENT' : 'DÉFICIT';
    data.push([service.nom, formatEuro(budget.total), formatEuro(budget.recettes), formatEuro(budget.solde), indicateur]);
    totalCharges += budget.total;
    totalProduits += budget.recettes;
  });

  data.push([]);
  const soldeGlobal = totalProduits - totalCharges;
  data.push(['TOTAL', formatEuro(totalCharges), formatEuro(totalProduits), formatEuro(soldeGlobal), soldeGlobal >= 0 ? 'EXCÉDENT' : 'DÉFICIT']);

  data.push([]);
  data.push([]);

  // Provisions
  data.push(['PROVISIONS RECOMMANDÉES']);
  if (provisions.details && provisions.details.length > 0) {
    provisions.details.forEach(prov => {
      if (prov.montant > 0) {
        data.push([prov.nom, formatEuro(prov.montant), `${prov.taux}% sur ${prov.baseCalcul}`]);
      }
    });
  }
  data.push(['TOTAL PROVISIONS', formatEuro(provisions.total)]);

  data.push([]);
  data.push([]);

  // BFR
  data.push(['BESOIN EN FONDS DE ROULEMENT']);
  data.push(['Créances clients', formatEuro(bfr.creancesClients)]);
  data.push(['Dettes fournisseurs', formatEuro(bfr.dettesFournisseurs)]);
  data.push(['BFR', formatEuro(bfr.bfr)]);
  data.push(['BFR en jours de CA', `${bfr.bfrEnJours.toFixed(1)} jours`]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [30, 15, 15, 15, 12]);
  return ws;
};

// Créer l'onglet Vacataires
const createVacataires = (services) => {
  const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const moisKeys = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'];
  const CHARGES_VAC = 0.15;

  const data = [];
  data.push(['TABLEAU DES INTERVENANTS VACATAIRES']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([`Compte PCG : 621 – Personnel extérieur (conventions) / 604 – Achats (auto-entrepreneur)`]);
  data.push([]);

  // En-tête détail
  data.push([
    'Service', 'Intervenant', 'Type', 'Contrat', 'SIRET', 'Date début', 'Date fin',
    'Taux horaire', 'Heures/an', 'Charges %', 'Coût brut', 'Coût chargé',
    'Part FI (€)', 'Part FC (€)', 'Compte PCG',
    ...moisCourts
  ]);

  let grandTotalHeures = 0;
  let grandTotalBrut = 0;
  let grandTotalCharge = 0;
  let grandTotalFI = 0;
  let grandTotalFC = 0;

  services.forEach(service => {
    const vacs = service.vacataires || [];
    if (vacs.length === 0) return;

    let stHeures = 0, stBrut = 0, stCharge = 0, stFI = 0, stFC = 0;

    vacs.forEach(v => {
      const heuresMois = moisKeys.map(k => parseFloat(v.planningMensuel?.[k]) || 0);
      const heures = heuresMois.reduce((s, h) => s + h, 0) || parseFloat(v.heuresAnnuelles) || 0;
      const tauxH = parseFloat(v.tauxHoraire) || 0;
      const chargesPct = parseFloat(v.charges ?? CHARGES_VAC * 100) / 100;
      const brut = heures * tauxH;
      const charge = brut * (1 + chargesPct);
      const ratioFI = v.type === 'FC' ? 0 : v.type === 'FI' ? 1 : 0.5;
      const fi = charge * ratioFI;
      const fc = charge * (1 - ratioFI);
      const compte = (v.typeContrat === 'auto_entrepreneur') ? '604' : '621';

      data.push([
        service.nom,
        v.nom || 'Vacataire',
        v.type || 'FI',
        v.typeContrat === 'convention' ? 'Convention' :
          v.typeContrat === 'auto_entrepreneur' ? 'Auto-entrepreneur' :
          v.typeContrat === 'intervention' ? 'Lettre de commande' : 'Autre',
        v.siret || '',
        v.dateDebut || '',
        v.dateFin || '',
        formatEuro(tauxH),
        heures.toFixed(1),
        `${Math.round(chargesPct * 100)}%`,
        formatEuro(brut),
        formatEuro(charge),
        formatEuro(fi),
        formatEuro(fc),
        compte,
        ...heuresMois.map(h => h > 0 ? h.toFixed(1) : '')
      ]);

      stHeures += heures; stBrut += brut; stCharge += charge; stFI += fi; stFC += fc;
    });

    data.push([
      `SOUS-TOTAL ${service.nom.toUpperCase()}`, '', '', '', '', '', '',
      '', stHeures.toFixed(1), '', formatEuro(stBrut), formatEuro(stCharge),
      formatEuro(stFI), formatEuro(stFC), '',
      ...Array(12).fill('')
    ]);
    data.push([]);

    grandTotalHeures += stHeures;
    grandTotalBrut += stBrut;
    grandTotalCharge += stCharge;
    grandTotalFI += stFI;
    grandTotalFC += stFC;
  });

  data.push([
    'TOTAL GÉNÉRAL', '', '', '', '', '', '',
    '', grandTotalHeures.toFixed(1), '', formatEuro(grandTotalBrut), formatEuro(grandTotalCharge),
    formatEuro(grandTotalFI), formatEuro(grandTotalFC), '',
    ...Array(12).fill('')
  ]);

  data.push([]);
  data.push([]);

  // Planning mensuel récapitulatif par service
  data.push(['PLANNING MENSUEL CONSOLIDÉ (heures)']);
  data.push(['Service', ...moisCourts, 'Total']);

  services.forEach(service => {
    const vacs = service.vacataires || [];
    if (vacs.length === 0) return;
    const moisTotaux = moisKeys.map(k =>
      vacs.reduce((s, v) => s + (parseFloat(v.planningMensuel?.[k]) || 0), 0)
    );
    const total = moisTotaux.reduce((s, h) => s + h, 0);
    data.push([service.nom, ...moisTotaux.map(h => h > 0 ? h.toFixed(1) : ''), total.toFixed(1)]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [22, 20, 8, 18, 14, 12, 12, 12, 10, 10, 12, 12, 12, 12, 8,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
  return ws;
};

// Fonction principale d'export
export const exportToExcel = (direction, services, globalParams, poleSupport = null) => {
  try {
    const wb = XLSX.utils.book_new();

    const wsCompteResultat = createCompteResultat(direction, services, poleSupport);
    const wsBalance = createBalance(direction, services, poleSupport);
    const wsDetailCharges = createDetailCharges(direction, services, poleSupport);
    const wsDetailProduits = createDetailProduits(services);
    const wsEffectifs = createEffectifs(services);
    const wsBudget3Ans = createBudget3Ans(direction, services, globalParams, poleSupport);
    const wsAmortissements = createAmortissements(services);
    const wsSynthese = createSynthese(direction, services, globalParams, poleSupport);

    XLSX.utils.book_append_sheet(wb, wsCompteResultat, 'Compte de Résultat');
    XLSX.utils.book_append_sheet(wb, wsBalance, 'Balance Générale');
    XLSX.utils.book_append_sheet(wb, wsDetailCharges, 'Détail Charges');
    XLSX.utils.book_append_sheet(wb, wsDetailProduits, 'Détail Produits');
    XLSX.utils.book_append_sheet(wb, wsEffectifs, 'Effectifs');
    XLSX.utils.book_append_sheet(wb, wsBudget3Ans, 'Budget 3 Ans');
    XLSX.utils.book_append_sheet(wb, wsAmortissements, 'Amortissements');
    XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse');

    const wsVacataires = createVacataires(services);
    XLSX.utils.book_append_sheet(wb, wsVacataires, 'Vacataires');

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Budget_AFERTES_${date}.xlsx`);
    try { localStorage.setItem('lastExcelExportDate', Date.now().toString()); } catch (_) {}
    window.dispatchEvent(new CustomEvent('storage-excel-export', { detail: { ts: Date.now() } }));
  } catch (err) {
    alert(`Erreur lors de l'export Excel : ${err.message}`);
  }
};

/**
 * Export EPRD/ERRD — État Prévisionnel des Recettes et Dépenses (organisme de formation)
 * Si balanceComptable est fournie, ajoute un onglet ERRD et un onglet Écarts.
 */
export const exportEPRD = (direction, services, poleSupport, globalParams, balanceComptable = null) => {
  try {
    const annee = globalParams?.anneeExercice || new Date().getFullYear();
    const assoc = globalParams?.nomAssociation || 'AFERTES';
    const wb = XLSX.utils.book_new();

    const bdDir = calculerBudgetDirection(direction, null, annee);
    const bdPS  = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, annee) : null;
    const bdSvcs = services.map(s => ({ nom: s.nom, budget: calculerBudgetService(s, null, annee) }));

    // ── EPRD ──────────────────────────────────────────────────────────
    const eprd = [];
    eprd.push([`ÉTAT PRÉVISIONNEL DES RECETTES ET DES DÉPENSES — ${annee}`]);
    eprd.push([assoc]);
    eprd.push([`Édité le : ${new Date().toLocaleDateString('fr-FR')}`]);
    eprd.push([]);

    // Colonnes : section | service | poste | compte | prévisionnel
    eprd.push(['Section', 'Entité', 'Poste', 'Compte PCG', `Prévisionnel ${annee} (€)`]);

    const ligneEPRD = (section, entite, poste, compte, montant) =>
      [section, entite, poste, compte, montant ? formatEuro(montant) : ''];

    let totCharges = 0, totRecettes = 0;

    // ── CHARGES ──────────────────────────────────────────────────────
    eprd.push(['--- CHARGES ---', '', '', '', '']);

    const addChargesEntite = (section, nom, bd) => {
      if (!bd) return;
      eprd.push(ligneEPRD(section, nom, 'Salaires et charges sociales', '64', bd.salaires));
      totCharges += bd.salaires;
      const exploit = bd.exploitation ?? bd.chargesSiege ?? 0;
      if (exploit) {
        eprd.push(ligneEPRD(section, nom, 'Charges d\'exploitation', '60-65', exploit));
        totCharges += exploit;
      }
      if (bd.amortissements) {
        eprd.push(ligneEPRD(section, nom, 'Dotations aux amortissements', '68', bd.amortissements));
        totCharges += bd.amortissements;
      }
      if (bd.interets) {
        eprd.push(ligneEPRD(section, nom, 'Charges financières (intérêts)', '66', bd.interets));
        totCharges += bd.interets;
      }
    };

    addChargesEntite('Gestion', 'Direction / Siège', bdDir);
    if (bdPS) addChargesEntite('Gestion', 'Pôle Ressource', bdPS);
    bdSvcs.forEach(({ nom, budget }) => {
      const section = nom.toLowerCase().includes('fc') || nom.toLowerCase().includes('continue') ? 'FC' : 'FI';
      addChargesEntite(section, nom, budget);
    });

    eprd.push([]);
    eprd.push(['', 'TOTAL CHARGES', '', '', formatEuro(totCharges)]);
    eprd.push([]);

    // ── PRODUITS ──────────────────────────────────────────────────────
    eprd.push(['--- PRODUITS ---', '', '', '', '']);

    const addRecettesEntite = (section, nom, bd) => {
      if (!bd) return;
      const recettes = bd.recettes ?? 0;
      if (recettes) {
        eprd.push(ligneEPRD(section, nom, 'Prestations / Subventions', '70-74', recettes));
        totRecettes += recettes;
      }
      if (bd.subventionRegionAgents) {
        eprd.push(ligneEPRD(section, nom, 'Subvention Région (agents éligibles)', '74', bd.subventionRegionAgents));
        totRecettes += bd.subventionRegionAgents;
      }
    };

    addRecettesEntite('Gestion', 'Direction / Siège', bdDir);
    if (bdPS) addRecettesEntite('Gestion', 'Pôle Ressource', bdPS);
    bdSvcs.forEach(({ nom, budget }) => {
      const section = nom.toLowerCase().includes('fc') || nom.toLowerCase().includes('continue') ? 'FC' : 'FI';
      addRecettesEntite(section, nom, budget);
    });

    eprd.push([]);
    eprd.push(['', 'TOTAL PRODUITS', '', '', formatEuro(totRecettes)]);
    eprd.push([]);

    const solde = totRecettes - totCharges;
    eprd.push(['', 'RÉSULTAT PRÉVISIONNEL', '', '', formatEuro(solde)]);
    eprd.push(['', solde >= 0 ? '→ EXCÉDENT PRÉVISIONNEL' : '→ DÉFICIT PRÉVISIONNEL', '', '', '']);

    // Récapitulatif par section
    eprd.push([]);
    eprd.push(['RÉCAPITULATIF PAR SECTION']);
    eprd.push(['Section', 'Charges', 'Produits', 'Résultat', '']);
    const sections = {};
    bdSvcs.forEach(({ nom, budget }) => {
      const sec = nom.toLowerCase().includes('fc') || nom.toLowerCase().includes('continue') ? 'FC' : 'FI';
      if (!sections[sec]) sections[sec] = { charges: 0, produits: 0 };
      sections[sec].charges  += budget.total ?? 0;
      sections[sec].produits += (budget.recettes ?? 0) + (budget.subventionRegionAgents ?? 0);
    });
    sections['Gestion'] = {
      charges:  bdDir.total + (bdPS?.total ?? 0),
      produits: (bdDir.recettes ?? 0) + (bdPS?.recettes ?? 0),
    };
    Object.entries(sections).forEach(([sec, { charges, produits }]) => {
      eprd.push([sec, formatEuro(charges), formatEuro(produits), formatEuro(produits - charges), '']);
    });

    const wsEPRD = XLSX.utils.aoa_to_sheet(eprd);
    setColumnWidths(wsEPRD, [12, 25, 30, 12, 18]);
    XLSX.utils.book_append_sheet(wb, wsEPRD, `EPRD ${annee}`);

    // ── ERRD (si balance comptable disponible) ────────────────────────
    if (balanceComptable?.entries?.length) {
      const errd = [];
      errd.push([`ÉTAT RÉALISÉ DES RECETTES ET DES DÉPENSES — ${balanceComptable.annee}`]);
      errd.push([assoc]);
      errd.push([`Source : ${balanceComptable.fileName || 'Balance comptable importée'} — ${new Date(balanceComptable.importedAt).toLocaleDateString('fr-FR')}`]);
      errd.push([]);

      errd.push(['Compte', 'Intitulé', 'Débit', 'Crédit', 'Solde', 'Catégorie']);
      balanceComptable.entries.forEach(e => {
        errd.push([e.compte, e.intitule, formatEuro(e.debit), formatEuro(e.credit), formatEuro(e.solde), e.categorie]);
      });
      errd.push([]);
      errd.push(['', 'TOTAL CHARGES RÉALISÉES', '', '', formatEuro(balanceComptable.totalCharges), '']);
      errd.push(['', 'TOTAL PRODUITS RÉALISÉS',  '', '', formatEuro(balanceComptable.totalRecettes), '']);
      errd.push(['', 'RÉSULTAT RÉALISÉ',          '', '', formatEuro(balanceComptable.totalRecettes - balanceComptable.totalCharges), '']);

      const wsERRD = XLSX.utils.aoa_to_sheet(errd);
      setColumnWidths(wsERRD, [12, 35, 14, 14, 14, 14]);
      XLSX.utils.book_append_sheet(wb, wsERRD, `ERRD ${balanceComptable.annee}`);

      // ── Écarts EPRD vs ERRD ─────────────────────────────────────────
      const ecarts = [];
      ecarts.push(['COMPARAISON EPRD / ERRD']);
      ecarts.push([assoc]);
      ecarts.push([]);
      ecarts.push(['Poste', `EPRD ${annee} (€)`, `ERRD ${balanceComptable.annee} (€)`, 'Écart (€)', 'Écart (%)']);

      const rows = [
        { label: 'Charges personnel (64)',   previsionnel: bdSvcs.reduce((s, { budget: b }) => s + b.salaires, 0) + bdDir.salaires + (bdPS?.salaires ?? 0),         realise: (balanceComptable.entries || []).filter(e => e.categorie === 'salaires').reduce((s, e) => s + Math.abs(e.solde), 0) },
        { label: 'Charges exploitation',     previsionnel: bdSvcs.reduce((s, { budget: b }) => s + (b.exploitation ?? 0), 0) + bdDir.chargesSiege + (bdPS?.exploitation ?? 0), realise: (balanceComptable.entries || []).filter(e => e.categorie === 'exploitation').reduce((s, e) => s + Math.abs(e.solde), 0) },
        { label: 'Amortissements (68)',       previsionnel: bdSvcs.reduce((s, { budget: b }) => s + (b.amortissements ?? 0), 0), realise: (balanceComptable.entries || []).filter(e => e.categorie === 'amortissements').reduce((s, e) => s + Math.abs(e.solde), 0) },
        { label: 'Total charges',             previsionnel: totCharges, realise: balanceComptable.totalCharges },
        { label: 'Produits / recettes (7)',   previsionnel: totRecettes, realise: balanceComptable.totalRecettes },
        { label: 'Résultat',                  previsionnel: solde, realise: balanceComptable.totalRecettes - balanceComptable.totalCharges },
      ];

      rows.forEach(({ label, previsionnel, realise }) => {
        const ecart = realise - previsionnel;
        const ecartPct = previsionnel !== 0 ? `${(ecart / Math.abs(previsionnel) * 100).toFixed(1)}%` : 'N/A';
        ecarts.push([label, formatEuro(previsionnel), formatEuro(realise), formatEuro(ecart), ecartPct]);
      });

      const wsEcarts = XLSX.utils.aoa_to_sheet(ecarts);
      setColumnWidths(wsEcarts, [30, 18, 18, 18, 10]);
      XLSX.utils.book_append_sheet(wb, wsEcarts, 'Écarts EPRD-ERRD');
    }

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `EPRD_${assoc}_${annee}_${date}.xlsx`);
  } catch (err) {
    alert(`Erreur lors de l'export EPRD : ${err.message}`);
  }
};

export const exportReportingFC = (records, services) => {
  try {
    const wb = XLSX.utils.book_new();
    const headers = ['Stagiaire', 'Formation', 'Date début', 'Date fin', 'Heures', 'Coût (€)', 'Financement OPCO (€)', 'Service'];
    const rows = records.map(r => [
      r.stagiaire,
      r.formation,
      r.dateDebut,
      r.dateFin,
      r.heures,
      r.cout,
      r.financementOPCO,
      services.find(s => s.id === r.serviceId)?.nom || ''
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((_, i) => ({ wch: i < 2 ? 25 : 15 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Reporting FC');
    XLSX.writeFile(wb, `reporting_fc_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err) {
    alert(`Erreur lors de l'export Reporting FC : ${err.message}`);
  }
};
