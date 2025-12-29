import * as XLSX from 'xlsx';
import { COMPTES_EXPLOITATION, COMPTES_RECETTES, COMPTES_IMMO, MOIS, SITES } from './constants';
import { calculerBudgetDirection, calculerBudgetService, calculerProvisions, calculerBFR, calculerSynthese3Ans } from './calculations';

// Styles pour les en-têtes (via largeur de colonnes)
const setColumnWidths = (ws, widths) => {
  ws['!cols'] = widths.map(w => ({ wch: w }));
};

// Formater un nombre en euros
const formatEuro = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.round(val * 100) / 100;
};

// Créer l'onglet Compte de Résultat
const createCompteResultat = (direction, services) => {
  const budgetDir = calculerBudgetDirection(direction);
  const budgetsServices = services.map(s => ({
    nom: s.nom,
    budget: calculerBudgetService(s)
  }));

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
    budget.exploitationDetails.forEach(item => {
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

  // Charges siège
  const chargesSiege = budgetDir.chargesSiege;
  data.push(['  Loyer siège', '613', formatEuro(direction.loyer * 12)]);
  data.push(['  Charges siège', '614', formatEuro(direction.charges * 12)]);
  data.push(['  Autres charges siège', '6', formatEuro(direction.autresCharges * 12)]);
  totalAchats += chargesSiege;

  data.push(['TOTAL ACHATS ET CHARGES EXTERNES', '', formatEuro(totalAchats)]);
  data.push([]);

  // 64 - Charges de personnel
  data.push(['64 - CHARGES DE PERSONNEL']);
  let totalPersonnel = budgetDir.salaires;
  data.push(['  Personnel Direction', '641/645', formatEuro(budgetDir.salaires)]);

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
    if (budget.amortissements > 0) {
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
    if (budget.interets > 0) {
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

  // 70 - Ventes et prestations
  data.push(['70 - VENTES ET PRESTATIONS DE SERVICES']);
  let totalVentes = 0;

  // 74 - Subventions
  data.push(['74 - SUBVENTIONS D\'EXPLOITATION']);
  let totalSubventions = 0;

  const produitsParCompte = { '70': [], '74': [], '75': [] };

  budgetsServices.forEach(({ nom, budget }) => {
    budget.recettesDetails.forEach(item => {
      const compte = COMPTES_RECETTES[item.nom] || '70';
      const classe = compte.startsWith('74') ? '74' : compte.startsWith('75') ? '75' : '70';
      produitsParCompte[classe].push({
        libelle: `${item.nom} (${nom})`,
        compte,
        montant: item.montant * 12
      });
    });
  });

  // Réorganiser les données
  data.length -= 2; // Retirer les deux dernières lignes

  data.push(['70 - VENTES ET PRESTATIONS DE SERVICES']);
  produitsParCompte['70'].forEach(({ libelle, compte, montant }) => {
    data.push([`  ${libelle}`, compte, formatEuro(montant)]);
    totalVentes += montant;
  });
  data.push(['TOTAL VENTES ET PRESTATIONS', '', formatEuro(totalVentes)]);
  data.push([]);

  data.push(['74 - SUBVENTIONS D\'EXPLOITATION']);
  produitsParCompte['74'].forEach(({ libelle, compte, montant }) => {
    data.push([`  ${libelle}`, compte, formatEuro(montant)]);
    totalSubventions += montant;
  });
  data.push(['TOTAL SUBVENTIONS', '', formatEuro(totalSubventions)]);
  data.push([]);

  if (produitsParCompte['75'].length > 0) {
    data.push(['75 - AUTRES PRODUITS DE GESTION COURANTE']);
    let totalAutres = 0;
    produitsParCompte['75'].forEach(({ libelle, compte, montant }) => {
      data.push([`  ${libelle}`, compte, formatEuro(montant)]);
      totalAutres += montant;
    });
    data.push(['TOTAL AUTRES PRODUITS', '', formatEuro(totalAutres)]);
    data.push([]);
  }

  const totalProduits = totalVentes + totalSubventions + produitsParCompte['75'].reduce((s, p) => s + p.montant, 0);
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
const createBalance = (direction, services) => {
  const budgetDir = calculerBudgetDirection(direction);
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

  // Charges (débit)
  // Personnel
  comptes['641'] = { libelle: 'Rémunérations du personnel', debit: 0, credit: 0 };
  comptes['645'] = { libelle: 'Charges sociales', debit: 0, credit: 0 };

  budgetDir.detailsSalaires.forEach(s => {
    comptes['641'].debit += s.brut + (s.segur / 1.42);
    comptes['645'].debit += s.charges + (s.segur - s.segur / 1.42);
  });

  budgetsServices.forEach(({ budget }) => {
    budget.detailsSalaires.forEach(s => {
      comptes['641'].debit += s.brut + (s.segur / 1.42);
      comptes['645'].debit += s.charges + (s.segur - s.segur / 1.42);
    });
  });

  // Exploitation
  comptes['613'] = { libelle: 'Locations', debit: direction.loyer * 12, credit: 0 };
  comptes['614'] = { libelle: 'Charges locatives', debit: direction.charges * 12, credit: 0 };

  budgetsServices.forEach(({ budget }) => {
    budget.exploitationDetails.forEach(item => {
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
    comptes['681'].debit += budget.amortissements;
  });

  // Intérêts
  comptes['661'] = { libelle: 'Charges d\'intérêts', debit: 0, credit: 0 };
  budgetsServices.forEach(({ budget }) => {
    comptes['661'].debit += budget.interets;
  });

  // Produits (crédit)
  budgetsServices.forEach(({ budget }) => {
    budget.recettesDetails.forEach(item => {
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
const createDetailCharges = (direction, services) => {
  const budgetDir = calculerBudgetDirection(direction);

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
  data.push(['Charges siège', '', '', '', '', formatEuro(budgetDir.chargesSiege)]);
  data.push(['TOTAL DIRECTION', '', '', '', '', formatEuro(budgetDir.total)]);
  data.push([]);
  data.push([]);

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
const createBudget3Ans = (direction, services, globalParams) => {
  const synthese = calculerSynthese3Ans(direction, services, globalParams);

  const data = [];
  data.push(['BUDGET PRÉVISIONNEL SUR 3 ANS']);
  data.push(['Association AFERTES']);
  data.push([`Hypothèse d'augmentation annuelle: ${globalParams.augmentationAnnuelle}%`]);
  data.push([]);

  data.push(['', 'Année 1', 'Année 2', 'Année 3', 'Évolution']);
  data.push([]);

  // Totaux
  data.push(['BUDGET TOTAL',
    formatEuro(synthese[0].total),
    formatEuro(synthese[1].total),
    formatEuro(synthese[2].total),
    `+${((synthese[2].total / synthese[0].total - 1) * 100).toFixed(1)}%`
  ]);

  data.push(['dont Direction',
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

  // Par service
  services.forEach((service, idx) => {
    const s1 = synthese[0].detailsServices[idx];
    const s2 = synthese[1].detailsServices[idx];
    const s3 = synthese[2].detailsServices[idx];

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
const createSynthese = (direction, services, globalParams) => {
  const budgetDir = calculerBudgetDirection(direction);
  const provisions = calculerProvisions(direction, services, globalParams);
  const bfr = calculerBFR(direction, services, globalParams);

  const data = [];
  data.push(['SYNTHÈSE BUDGÉTAIRE']);
  data.push(['Association AFERTES - Exercice N']);
  data.push([]);

  // Tableau récapitulatif
  data.push(['SERVICE', 'CHARGES', 'PRODUITS', 'SOLDE', 'INDICATEUR']);
  data.push([]);

  data.push(['Direction', formatEuro(budgetDir.total), '-', formatEuro(-budgetDir.total), '']);

  let totalCharges = budgetDir.total;
  let totalProduits = 0;

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
  data.push(['Provision congés payés', formatEuro(provisions.congesPayes)]);
  data.push(['Provision grosses réparations', formatEuro(provisions.grossesReparations)]);
  data.push(['Provision créances douteuses', formatEuro(provisions.creancesDouteuses)]);
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

// Fonction principale d'export
export const exportToExcel = (direction, services, globalParams) => {
  const wb = XLSX.utils.book_new();

  // Créer tous les onglets
  const wsCompteResultat = createCompteResultat(direction, services);
  const wsBalance = createBalance(direction, services);
  const wsDetailCharges = createDetailCharges(direction, services);
  const wsDetailProduits = createDetailProduits(services);
  const wsEffectifs = createEffectifs(services);
  const wsBudget3Ans = createBudget3Ans(direction, services, globalParams);
  const wsAmortissements = createAmortissements(services);
  const wsSynthese = createSynthese(direction, services, globalParams);

  // Ajouter les onglets au classeur
  XLSX.utils.book_append_sheet(wb, wsCompteResultat, 'Compte de Résultat');
  XLSX.utils.book_append_sheet(wb, wsBalance, 'Balance Générale');
  XLSX.utils.book_append_sheet(wb, wsDetailCharges, 'Détail Charges');
  XLSX.utils.book_append_sheet(wb, wsDetailProduits, 'Détail Produits');
  XLSX.utils.book_append_sheet(wb, wsEffectifs, 'Effectifs');
  XLSX.utils.book_append_sheet(wb, wsBudget3Ans, 'Budget 3 Ans');
  XLSX.utils.book_append_sheet(wb, wsAmortissements, 'Amortissements');
  XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse');

  // Générer le fichier
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Budget_AFERTES_${date}.xlsx`);
};
