import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculerBudgetDirection, calculerBudgetService, calculerProvisions, calculerBFR, calculerFondRoulement, calculerSynthese3Ans } from './calculations';

const formatEuro = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return '0 €';
  return Math.round(val).toLocaleString('fr-FR') + ' €';
};

export const exportToPDF = (direction, services, globalParams) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Titre
  doc.setFontSize(20);
  doc.setTextColor(20, 184, 166); // teal
  doc.text('Budget Association - AFERTES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Synthèse 3 ans
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Synthèse sur 3 ans', 14, yPos);
  yPos += 8;

  const summary3Ans = calculerSynthese3Ans(direction, services, globalParams);
  autoTable(doc, {
    startY: yPos,
    head: [['', 'Année 1', 'Année 2', 'Année 3']],
    body: [
      ['Budget Total', ...summary3Ans.map(s => formatEuro(s.total))],
      ['Direction', ...summary3Ans.map(s => formatEuro(s.budgetDirection))],
      ['Amortissements', ...summary3Ans.map(s => formatEuro(s.amortissements))],
      ['Intérêts', ...summary3Ans.map(s => formatEuro(s.interets))]
    ],
    theme: 'striped',
    headStyles: { fillColor: [20, 184, 166] },
    styles: { fontSize: 9 }
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // Direction
  doc.setFontSize(14);
  doc.text('Direction & Siège', 14, yPos);
  yPos += 8;

  const budgetDir = calculerBudgetDirection(direction);
  autoTable(doc, {
    startY: yPos,
    head: [['Poste', 'ETP', 'Salaire mensuel', 'Coût annuel']],
    body: direction.personnel.map(p => [
      p.titre,
      p.etp.toString(),
      formatEuro(p.salaire),
      formatEuro(budgetDir.detailsSalaires.find(d => d.titre === p.titre)?.total || 0)
    ]),
    foot: [['Total masse salariale', '', '', formatEuro(budgetDir.salaires)]],
    theme: 'striped',
    headStyles: { fillColor: [20, 184, 166] },
    footStyles: { fillColor: [229, 231, 235] },
    styles: { fontSize: 8 }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Charges siège
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Loyer', formatEuro(direction.loyer * 12)],
      ['Charges', formatEuro(direction.charges * 12)],
      ['Autres charges', formatEuro(direction.autresCharges * 12)],
      ['Total charges siège', formatEuro(budgetDir.chargesSiege)]
    ],
    theme: 'plain',
    styles: { fontSize: 8 }
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // Services
  services.forEach((service, idx) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    const bs = calculerBudgetService(service);

    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246); // purple
    doc.text(service.nom, 14, yPos);
    yPos += 8;

    doc.setTextColor(0);

    // Résumé service
    autoTable(doc, {
      startY: yPos,
      body: [
        ['Masse salariale', formatEuro(bs.salaires)],
        ['Exploitation', formatEuro(bs.exploitation)],
        ['Amortissements', formatEuro(bs.amortissements)],
        ['Recettes', formatEuro(bs.recettes)],
        ['Solde', formatEuro(bs.solde)]
      ],
      theme: 'plain',
      styles: { fontSize: 8 },
      columnStyles: { 1: { fontStyle: 'bold' } }
    });
    yPos = doc.lastAutoTable.finalY + 10;
  });

  // Nouvelle page pour provisions et BFR
  doc.addPage();
  yPos = 20;

  // Provisions
  doc.setFontSize(14);
  doc.setTextColor(249, 115, 22); // orange
  doc.text('Provisions pour risque', 14, yPos);
  yPos += 8;

  const provisions = calculerProvisions(direction, services, globalParams);
  doc.setTextColor(0);
  autoTable(doc, {
    startY: yPos,
    head: [['Provision', 'Base de calcul', 'Taux', 'Montant']],
    body: provisions.details.filter(p => p.montant > 0).map(p => [
      p.nom,
      p.baseCalcul === 'salaires' ? 'Masse salariale' :
        p.baseCalcul === 'investissements' ? 'Investissements' : 'Chiffre d\'affaires',
      `${p.taux}%`,
      formatEuro(p.montant)
    ]),
    foot: [['TOTAL', '', '', formatEuro(provisions.total)]],
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
    footStyles: { fillColor: [254, 215, 170], textColor: [0, 0, 0] },
    styles: { fontSize: 8 }
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // BFR avec méthode de calcul
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246); // blue
  doc.text('Besoin en Fonds de Roulement (BFR)', 14, yPos);
  yPos += 8;

  const bfr = calculerBFR(direction, services, globalParams);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.text('Méthode de calcul:', 14, yPos);
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('BFR = Stocks + Créances clients - Dettes fournisseurs', 14, yPos);
  yPos += 4;
  doc.text(`Créances clients = (CA annuel / 365) × délai paiement clients (${globalParams.delaiPaiementClients} jours)`, 14, yPos);
  yPos += 4;
  doc.text(`Dettes fournisseurs = (Achats / 365) × délai paiement fournisseurs (${globalParams.delaiPaiementFournisseurs} jours)`, 14, yPos);
  yPos += 8;

  doc.setTextColor(0);
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Stocks', formatEuro(bfr.stocks)],
      ['Créances clients', `+ ${formatEuro(bfr.creancesClients)}`],
      ['Dettes fournisseurs', `- ${formatEuro(bfr.dettesFournisseurs)}`],
      ['BFR', formatEuro(bfr.bfr)],
      ['BFR en jours de CA', `${Math.round(bfr.bfrEnJours)} jours`]
    ],
    theme: 'plain',
    styles: { fontSize: 8 },
    columnStyles: { 1: { fontStyle: 'bold' } }
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // Fonds de roulement avec méthode de calcul
  doc.setFontSize(14);
  doc.setTextColor(168, 85, 247); // purple
  doc.text('Fonds de Roulement (FR)', 14, yPos);
  yPos += 8;

  const fr = calculerFondRoulement(direction, services, globalParams);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.text('Méthode de calcul:', 14, yPos);
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Fonds de Roulement = Capitaux permanents - Immobilisations nettes', 14, yPos);
  yPos += 4;
  doc.text('Capitaux permanents = Réserves + Report à nouveau + Subventions d\'investissement + ...', 14, yPos);
  yPos += 4;
  doc.text('Immobilisations nettes = Valeur brute des immobilisations - Amortissements cumulés', 14, yPos);
  yPos += 8;

  doc.setTextColor(0);
  autoTable(doc, {
    startY: yPos,
    head: [['Élément', 'Montant']],
    body: [
      ...fr.details.map(item => [item.nom, formatEuro(item.montant)]),
      ['Total Capitaux permanents', formatEuro(fr.totalCapitauxPermanents)],
      ['Immobilisations brutes', formatEuro(fr.totalImmobilisations)],
      ['Amortissements cumulés', `- ${formatEuro(fr.totalAmortissementsCumules)}`],
      ['Immobilisations nettes', formatEuro(fr.immobilisationsNettes)],
      ['FONDS DE ROULEMENT', formatEuro(fr.fondRoulement)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [168, 85, 247] },
    styles: { fontSize: 8 }
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // Analyse FR - BFR
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Analyse FR - BFR', 14, yPos);
  yPos += 8;

  const tresorerie = fr.fondRoulement - bfr.bfr;
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Fonds de Roulement (FR)', formatEuro(fr.fondRoulement)],
      ['Besoin en Fonds de Roulement (BFR)', formatEuro(bfr.bfr)],
      ['Trésorerie nette (FR - BFR)', formatEuro(tresorerie)]
    ],
    theme: 'plain',
    styles: { fontSize: 9 },
    columnStyles: { 1: { fontStyle: 'bold' } }
  });

  // Sauvegarde
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`Budget_AFERTES_${date}.pdf`);
};
