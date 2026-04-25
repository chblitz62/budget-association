import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculerBudgetDirection, calculerBudgetService, calculerBudgetPoleSupport, calculerProvisions, calculerBFR, calculerFondRoulement, calculerSynthese3Ans } from './calculations';
import { formatEuro } from './formatting';

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

export const exportToPDF = (direction, services, globalParams, poleSupport = null) => {
  try {
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

  const summary3Ans = calculerSynthese3Ans(direction, services, globalParams, poleSupport);
  autoTable(doc, {
    startY: yPos,
    head: [['', 'Année 1', 'Année 2', 'Année 3']],
    body: [
      ['Budget Total', ...summary3Ans.map(s => formatEuro(s.total))],
      ['Siège', ...summary3Ans.map(s => formatEuro(s.budgetDirection))],
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
  const chargesDetail = getChargesSiegeDetail(direction);
  autoTable(doc, {
    startY: yPos,
    body: [
      ...chargesDetail.map(c => [c.nom, formatEuro(c.montant)]),
      ['Total charges siège', formatEuro(budgetDir.chargesSiege)]
    ],
    theme: 'plain',
    styles: { fontSize: 8 }
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // Pôle Support
  if (poleSupport) {
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    const budgetPS = calculerBudgetPoleSupport(poleSupport);
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 166);
    doc.text('Pôle Ressource', 14, yPos);
    yPos += 8;
    doc.setTextColor(0);
    autoTable(doc, {
      startY: yPos,
      body: [
        ['Masse salariale', formatEuro(budgetPS.salaires)],
        ['Exploitation', formatEuro(budgetPS.exploitation)],
        ['Recettes', formatEuro(budgetPS.recettes)],
        ['Solde', formatEuro(budgetPS.solde)]
      ],
      theme: 'plain',
      styles: { fontSize: 8 },
      columnStyles: { 1: { fontStyle: 'bold' } }
    });
    yPos = doc.lastAutoTable.finalY + 15;
  }

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

  const provisions = calculerProvisions(direction, services, globalParams, poleSupport);
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

  const bfr = calculerBFR(direction, services, globalParams, poleSupport);
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

  // Vacataires
  const allVacs = services.flatMap(s => (s.vacataires || []).map(v => ({ ...v, serviceNom: s.nom })));
  if (allVacs.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text('Intervenants Vacataires', 14, yPos);
    yPos += 8;

    const moisKeys = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'];
    const CHARGES_VAC = 0.15;

    const vacRows = allVacs.map(v => {
      const heures = moisKeys.reduce((s, k) => s + (parseFloat(v.planningMensuel?.[k]) || 0), 0) || parseFloat(v.heuresAnnuelles) || 0;
      const tauxH = parseFloat(v.tauxHoraire) || 0;
      const chargesPct = parseFloat(v.charges ?? CHARGES_VAC * 100) / 100;
      const brut = heures * tauxH;
      const charge = brut * (1 + chargesPct);
      const compte = v.typeContrat === 'auto_entrepreneur' ? '604' : '621';
      return [
        v.serviceNom,
        v.nom || 'Vacataire',
        v.type || 'FI',
        v.typeContrat === 'auto_entrepreneur' ? 'AE' : v.typeContrat === 'convention' ? 'Conv.' : 'LdC',
        heures.toFixed(0) + ' h',
        formatEuro(tauxH) + '/h',
        formatEuro(charge),
        compte
      ];
    });

    const totalCout = allVacs.reduce((s, v) => {
      const heures = moisKeys.reduce((a, k) => a + (parseFloat(v.planningMensuel?.[k]) || 0), 0) || parseFloat(v.heuresAnnuelles) || 0;
      const tauxH = parseFloat(v.tauxHoraire) || 0;
      const chargesPct = parseFloat(v.charges ?? CHARGES_VAC * 100) / 100;
      return s + heures * tauxH * (1 + chargesPct);
    }, 0);

    doc.setTextColor(0);
    autoTable(doc, {
      startY: yPos,
      head: [['Service', 'Intervenant', 'Type', 'Contrat', 'Heures', 'Taux', 'Coût chargé', 'PCG']],
      body: vacRows,
      foot: [['TOTAL', '', '', '', '', '', formatEuro(totalCout), '']],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      footStyles: { fillColor: [167, 243, 208], textColor: [0, 0, 0] },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 12 },
        3: { cellWidth: 16 },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 16, halign: 'right' },
        6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 12 },
      }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Résumé par service
    const parService = services.map(s => {
      const vacs = s.vacataires || [];
      const cout = vacs.reduce((sum, v) => {
        const h = moisKeys.reduce((a, k) => a + (parseFloat(v.planningMensuel?.[k]) || 0), 0) || parseFloat(v.heuresAnnuelles) || 0;
        const t = parseFloat(v.tauxHoraire) || 0;
        const c = parseFloat(v.charges ?? CHARGES_VAC * 100) / 100;
        return sum + h * t * (1 + c);
      }, 0);
      return [s.nom, vacs.length.toString(), formatEuro(cout)];
    }).filter(r => r[1] !== '0');

    if (parService.length > 0 && yPos < 250) {
      doc.setFontSize(11);
      doc.text('Synthèse par service', 14, yPos);
      yPos += 6;
      autoTable(doc, {
        startY: yPos,
        head: [['Service', 'Nb vacataires', 'Coût total chargé']],
        body: parService,
        theme: 'plain',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [209, 250, 229] },
        columnStyles: { 2: { fontStyle: 'bold' } }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }
  }

  // Analyse FR - BFR
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
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
  } catch (err) {
    alert(`Erreur lors de l'export PDF : ${err.message}`);
  }
};

export const exportReportingFCPdf = (records, services) => {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text('Reporting Formation Continue', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 25, { align: 'center' });

    const totalHeures = records.reduce((s, r) => s + (parseFloat(r.heures) || 0), 0);
    const totalCout = records.reduce((s, r) => s + (parseFloat(r.cout) || 0), 0);
    const totalOPCO = records.reduce((s, r) => s + (parseFloat(r.financementOPCO) || 0), 0);

    autoTable(doc, {
      startY: 32,
      head: [['Stagiaire', 'Formation', 'Date début', 'Date fin', 'Heures', 'Coût (€)', 'OPCO (€)', 'Service']],
      body: records.map(r => [
        r.stagiaire,
        r.formation,
        r.dateDebut,
        r.dateFin,
        (parseFloat(r.heures) || 0).toLocaleString('fr-FR'),
        Math.round(parseFloat(r.cout) || 0).toLocaleString('fr-FR') + ' €',
        Math.round(parseFloat(r.financementOPCO) || 0).toLocaleString('fr-FR') + ' €',
        services.find(s => s.id === r.serviceId)?.nom || ''
      ]),
      foot: [[
        `TOTAL (${records.length})`, '', '', '',
        totalHeures.toLocaleString('fr-FR') + ' h',
        Math.round(totalCout).toLocaleString('fr-FR') + ' €',
        Math.round(totalOPCO).toLocaleString('fr-FR') + ' €',
        ''
      ]],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      footStyles: { fillColor: [199, 210, 254], textColor: [30, 27, 75], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 50 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 35 },
      }
    });

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`reporting_fc_${date}.pdf`);
  } catch (err) {
    alert(`Erreur lors de l'export PDF Reporting FC : ${err.message}`);
  }
};

export const exportFicheService = (service, globalParams) => {
  try {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('fr-FR');
    let y = 18;

    const budget = calculerBudgetService(service, globalParams);
    const fmt = (v) => Math.round(v || 0).toLocaleString('fr-FR') + ' €';

    // ── En-tête ────────────────────────────────────────────────────────
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(service.nom || 'Service', pw / 2, 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Fiche synthèse · Généré le ${date}`, pw / 2, 22, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 36;

    // ── KPIs ───────────────────────────────────────────────────────────
    const kpis = [
      { label: 'ETP',          value: (service.personnel || []).reduce((s, p) => s + (parseFloat(p.etp) || 0), 0).toFixed(1) },
      { label: 'Masse sal.',   value: fmt(budget.salaires) },
      { label: 'Charges tot.', value: fmt(budget.total) },
      { label: 'Recettes',     value: fmt(budget.recettes) },
      { label: 'Solde',        value: fmt(budget.recettes - budget.total) },
    ];
    const kw = (pw - 28) / kpis.length;
    kpis.forEach((k, i) => {
      const x = 14 + i * kw;
      const soldeColor = k.label === 'Solde' ? ((budget.recettes - budget.total) >= 0 ? [16, 185, 129] : [239, 68, 68]) : [20, 184, 166];
      doc.setFillColor(...(k.label === 'Solde' ? soldeColor : [241, 253, 252]));
      doc.roundedRect(x, y, kw - 3, 20, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(k.label, x + (kw - 3) / 2, y + 6, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(k.label === 'Solde' ? 255 : 20, k.label === 'Solde' ? 255 : 80, k.label === 'Solde' ? 255 : 80);
      doc.text(k.value, x + (kw - 3) / 2, y + 14, { align: 'center' });
      doc.setFont(undefined, 'normal');
    });
    doc.setTextColor(0, 0, 0);
    y += 28;

    // ── Personnel ──────────────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Personnel', 14, y);
    doc.setFont(undefined, 'normal');
    y += 4;
    const personnel = (service.personnel || []);
    if (personnel.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Poste', 'ETP', 'Salaire mensuel', 'Rôle']],
        body: personnel.map(p => [
          p.titre || '—',
          (parseFloat(p.etp) || 0).toFixed(2),
          fmt(parseFloat(p.salaire) || 0),
          p.role || '—',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [20, 184, 166], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(8); doc.setTextColor(140); doc.text('Aucun personnel', 14, y + 4); y += 12;
      doc.setTextColor(0);
    }

    // ── Charges d'exploitation ─────────────────────────────────────────
    const exploitation = (service.exploitation || []).filter(e => (parseFloat(e.montant) || 0) > 0);
    if (exploitation.length > 0) {
      doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text('Charges d\'exploitation', 14, y); doc.setFont(undefined, 'normal'); y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Poste', 'Mensuel', 'Annuel']],
        body: exploitation.map(e => [e.nom || '—', fmt(parseFloat(e.montant) || 0), fmt((parseFloat(e.montant) || 0) * 12)]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // ── Recettes ───────────────────────────────────────────────────────
    const recettes = (service.recettes || []).filter(r => (parseFloat(r.montant) || 0) > 0);
    if (recettes.length > 0) {
      doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text('Recettes', 14, y); doc.setFont(undefined, 'normal'); y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Source', 'Mensuel', 'Annuel']],
        body: recettes.map(r => [r.nom || '—', fmt(parseFloat(r.montant) || 0), fmt((parseFloat(r.montant) || 0) * 12)]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // ── Pied de page ───────────────────────────────────────────────────
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(7); doc.setTextColor(160);
    doc.text(`AFERTES — ${service.nom} — ${date}`, pw / 2, ph - 8, { align: 'center' });

    doc.save(`fiche_${(service.nom || 'service').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    alert(`Erreur export fiche service : ${err.message}`);
  }
};

export const exportRapportFilieresPDF = ({ filieres = [], lignes = [], consoParFiliere = {}, enveloppeGlobale = 0, actions = [] }) => {
  try {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('fr-FR');
    let y = 18;
    const fmtE = (v) => Math.round(v || 0).toLocaleString('fr-FR') + ' €';

    // ── En-tête ────────────────────────────────────────────────────────
    doc.setFillColor(124, 58, 237); // violet
    doc.rect(0, 0, pw, 28, 'F');
    doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold');
    doc.text('Rapport DAF — Enveloppes par filière', pw / 2, 13, { align: 'center' });
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text(`Généré le ${date} · AFERTES`, pw / 2, 22, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 36;

    // ── KPI global ─────────────────────────────────────────────────────
    const totalConso = Object.values(consoParFiliere).reduce((s, v) => s + (v || 0), 0);
    const kpis = [
      { label: 'Enveloppe globale', value: fmtE(enveloppeGlobale), ok: enveloppeGlobale >= 0 },
      { label: 'Plan d\'actions',   value: fmtE(totalConso) },
      { label: 'Reste disponible',  value: fmtE(enveloppeGlobale - totalConso), ok: (enveloppeGlobale - totalConso) >= 0 },
      { label: 'Nb actions',        value: actions.filter(a => a.statut !== 'annule').length + ' actions' },
    ];
    const kw = (pw - 28) / kpis.length;
    kpis.forEach((k, i) => {
      const x = 14 + i * kw;
      const color = k.ok === false ? [239, 68, 68] : k.ok === true ? [16, 185, 129] : [124, 58, 237];
      doc.setFillColor(248, 246, 255);
      doc.roundedRect(x, y, kw - 3, 18, 2, 2, 'F');
      doc.setFontSize(7); doc.setTextColor(100); doc.text(k.label, x + (kw-3)/2, y + 6, { align: 'center' });
      doc.setFontSize(9); doc.setFont(undefined, 'bold');
      doc.setTextColor(...color);
      doc.text(k.value, x + (kw-3)/2, y + 13, { align: 'center' });
      doc.setFont(undefined, 'normal');
    });
    doc.setTextColor(0, 0, 0);
    y += 26;

    // ── Tableau synthèse par filière ───────────────────────────────────
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Synthèse par filière', 14, y);
    doc.setFont(undefined, 'normal');
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Filière', 'Clé %', 'Subvention', 'Charges', 'Enveloppe', 'Conso.', 'Reste', 'Statut']],
      body: lignes.map(l => {
        const conso = consoParFiliere[l.id] || 0;
        const reste = l.enveloppe - conso;
        return [
          l.label,
          l.cle + '%',
          fmtE(l.subvention),
          fmtE(l.charges),
          fmtE(l.enveloppe),
          fmtE(conso),
          fmtE(reste),
          reste >= 0 ? '✓' : '⚠',
        ];
      }),
      foot: [[
        'TOTAL', '100%',
        fmtE(lignes.reduce((s, l) => s + l.subvention, 0)),
        fmtE(lignes.reduce((s, l) => s + l.charges, 0)),
        fmtE(enveloppeGlobale),
        fmtE(totalConso),
        fmtE(enveloppeGlobale - totalConso),
        '',
      ]],
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], fontSize: 8 },
      footStyles: { fillColor: [245, 243, 255], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' },
        4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const v = data.cell.raw;
          if (v === '⚠') data.cell.styles.textColor = [239, 68, 68];
          else data.cell.styles.textColor = [16, 185, 129];
        }
        if (data.section === 'body' && data.column.index === 6) {
          const v = parseFloat(String(data.cell.raw).replace(/\s/g,'').replace(/€/,'').replace(/\./,'').replace(',','.'));
          if (v < 0) data.cell.styles.textColor = [239, 68, 68];
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    // ── Plan d'actions par filière ─────────────────────────────────────
    if (actions.filter(a => a.statut !== 'annule').length > 0) {
      doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text('Plan d\'actions', 14, y); doc.setFont(undefined, 'normal'); y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Action', 'Filière', 'Coût', 'Statut']],
        body: actions.filter(a => a.statut !== 'annule').map(a => {
          const fil = filieres.find(f => f.id === a.filiereId);
          return [a.nom || '—', fil?.label || '—', fmtE(parseFloat(a.cout) || 0), a.statut || '—'];
        }),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: { 2: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
    }

    // ── Pied ────────────────────────────────────────────────────────────
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(7); doc.setTextColor(160);
    doc.text(`AFERTES — Rapport filières — ${date}`, pw / 2, ph - 8, { align: 'center' });

    doc.save(`rapport_filieres_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    alert(`Erreur export rapport filières : ${err.message}`);
  }
};

/**
 * Note de Synthèse Narrative — export PDF du rapport stratégique.
 * @param {{ rapport: object, radarSante: object, kpiGlobaux: object, nomAssociation?: string }} opts
 */
export const exportSyntheseNarrative = ({ rapport, radarSante, kpiGlobaux, nomAssociation = 'AFERTES' }) => {
  try {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const date = rapport?.date || new Date().toLocaleDateString('fr-FR');

    // ── En-tête ──────────────────────────────────────────────────────────
    doc.setFillColor(109, 40, 217); // violet-700
    doc.rect(0, 0, pw, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Note de Synthèse Stratégique', pw / 2, 16, { align: 'center' });
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text(`${nomAssociation} — Budget ${new Date().getFullYear()} — ${date}`, pw / 2, 27, { align: 'center' });

    let y = 48;

    // ── Score global ─────────────────────────────────────────────────────
    if (rapport?.scoreGlobal !== undefined) {
      const score = rapport.scoreGlobal;
      const scoreColor = score >= 70 ? [16, 185, 129] : score >= 50 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(...scoreColor);
      doc.roundedRect(14, y, pw - 28, 14, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(`Score de santé financière : ${score}/100`, pw / 2, y + 9, { align: 'center' });
      y += 22;
    }

    // ── KPIs clés ────────────────────────────────────────────────────────
    if (kpiGlobaux) {
      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Recettes prévisionnelles', `${Math.round(kpiGlobaux.totalRecettes || 0).toLocaleString('fr-FR')} €`],
          ['Charges prévisionnelles',  `${Math.round(kpiGlobaux.totalCharges  || 0).toLocaleString('fr-FR')} €`],
          ['Solde prévisionnel',        `${Math.round(kpiGlobaux.soldeGlobal  || 0).toLocaleString('fr-FR')} €`],
          ['Taux de couverture',        `${(kpiGlobaux.tauxCouverture || 0).toFixed(1)}%`],
          ['ETP total',                 `${(kpiGlobaux.totalETP || 0).toFixed(1)}`],
        ],
        headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── Section Points de vigilance ──────────────────────────────────────
    if (rapport?.vigilance?.length) {
      doc.setFillColor(254, 226, 226);
      doc.rect(14, y, pw - 28, 8, 'F');
      doc.setTextColor(153, 27, 27); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('Points de vigilance', 18, y + 5.5);
      y += 12;
      doc.setTextColor(60, 60, 60); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      rapport.vigilance.forEach(v => {
        const lines = doc.splitTextToSize(`• ${v}`, pw - 28);
        doc.text(lines, 18, y);
        y += lines.length * 5 + 2;
      });
      y += 4;
    }

    // ── Section Opportunités ─────────────────────────────────────────────
    if (rapport?.opportunites?.length) {
      doc.setFillColor(209, 250, 229);
      doc.rect(14, y, pw - 28, 8, 'F');
      doc.setTextColor(6, 78, 59); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text("Opportunités d'optimisation", 18, y + 5.5);
      y += 12;
      doc.setTextColor(60, 60, 60); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      rapport.opportunites.forEach(v => {
        const lines = doc.splitTextToSize(`• ${v}`, pw - 28);
        doc.text(lines, 18, y);
        y += lines.length * 5 + 2;
      });
      y += 4;
    }

    // ── Prévision d'atterrissage ─────────────────────────────────────────
    if (rapport?.prevision) {
      doc.setFillColor(219, 234, 254);
      doc.rect(14, y, pw - 28, 8, 'F');
      doc.setTextColor(29, 78, 216); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text("Prévision d'atterrissage", 18, y + 5.5);
      y += 12;
      doc.setTextColor(60, 60, 60); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(rapport.prevision, pw - 28);
      doc.text(lines, 18, y);
    }

    // ── Pied ─────────────────────────────────────────────────────────────
    doc.setFontSize(7); doc.setTextColor(160);
    doc.text(`${nomAssociation} — Note de synthèse confidentielle — ${date}`, pw / 2, ph - 8, { align: 'center' });

    doc.save(`synthese_narrative_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    alert(`Erreur export synthèse : ${err.message}`);
  }
};
