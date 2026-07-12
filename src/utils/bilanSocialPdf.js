// Export PDF du Bilan Social annuel — Axe 8
// Format normalisé pour CSE / AG (art. L.2312-28).

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmtNum = (n) => (n === null || n === undefined ? '—' : Math.round(n || 0).toLocaleString('fr-FR'));
const fmtEur = (n) => (n === null || n === undefined ? '—' : Math.round(n || 0).toLocaleString('fr-FR') + ' €');
const fmtPct = (n) => (n === null || n === undefined ? '—' : `${Math.round(n * 10) / 10} %`);

const COULEURS = {
  primaire: [79, 70, 229],   // indigo-600
  texte:    [30, 41, 59],    // slate-800
  doux:     [100, 116, 139], // slate-500
  succes:   [16, 185, 129],  // emerald-500
  alerte:   [245, 158, 11],  // amber-500
  danger:   [225, 29, 72],   // rose-600
};

const setHeaderBlock = (doc, titre, sousTitre, yPos) => {
  doc.setFontSize(13);
  doc.setTextColor(...COULEURS.primaire);
  doc.setFont(undefined, 'bold');
  doc.text(titre, 14, yPos);
  if (sousTitre) {
    doc.setFontSize(9);
    doc.setTextColor(...COULEURS.doux);
    doc.setFont(undefined, 'normal');
    doc.text(sousTitre, 14, yPos + 5);
    return yPos + 12;
  }
  return yPos + 8;
};

const ensureSpace = (doc, yPos, neededHeight = 30) => {
  const pageH = doc.internal.pageSize.getHeight();
  if (yPos + neededHeight > pageH - 20) {
    doc.addPage();
    return 20;
  }
  return yPos;
};

const couleurNiveau = (n) => {
  if (n === 'success') return COULEURS.succes;
  if (n === 'warning') return COULEURS.alerte;
  if (n === 'danger') return COULEURS.danger;
  return COULEURS.doux;
};

/**
 * Génère et télécharge le PDF du Bilan Social.
 *
 * @param {object} bilan — résultat de genererBilanSocial(...)
 * @param {string} raisonSociale — pour le titre (depuis globalParams.bpfIdentite)
 */
export const exporterBilanSocialPDF = (bilan, raisonSociale = 'AFERTES') => {
  if (!bilan) return;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // ─── Page de garde ───────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor(...COULEURS.primaire);
  doc.setFont(undefined, 'bold');
  doc.text(`Bilan Social ${bilan.exercice}`, pageW / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(13);
  doc.setTextColor(...COULEURS.texte);
  doc.setFont(undefined, 'normal');
  doc.text(raisonSociale, pageW / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(...COULEURS.doux);
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} — synthèse art. L.2312-28 (CSE / AG)`, pageW / 2, y, { align: 'center' });
  y += 15;

  // Synthèse en bandeau
  const couleurGlobale = couleurNiveau(bilan.niveauGlobal);
  doc.setDrawColor(...couleurGlobale);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageW - 28, 24, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(...COULEURS.texte);
  doc.setFont(undefined, 'bold');
  doc.text(`Niveau global : ${bilan.niveauGlobal.toUpperCase()}`, 18, y + 8);
  doc.setFont(undefined, 'normal');
  doc.text(`Complétude : ${bilan.completude} % (${bilan.sectionsRenseignees}/${bilan.sectionsTotal} sections)`, 18, y + 14);
  doc.text(`Alertes : ${bilan.alertes.length}`, 18, y + 20);
  y += 30;

  // ─── Section 1 — Effectifs ───────────────────────────────────────
  y = setHeaderBlock(doc, '1. Effectifs au 31/12', 'Périmètre consolidé Direction + Services + Pôle + Pool RH', y);
  const eff = bilan.sections.effectifs;
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: COULEURS.primaire, textColor: 255 },
    bodyStyles: { fontSize: 9 },
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Total agents', fmtNum(eff.totalAgents)],
      ['Total ETP', fmtNum(eff.totalETP)],
      ['Présents fin année', fmtNum(eff.presentsFinAnnee)],
      ['Femmes', fmtNum(eff.parGenre.F)],
      ['Hommes', fmtNum(eff.parGenre.H)],
      ['Genre non renseigné', fmtNum(eff.parGenre.NR)],
      ...eff.parContrat.map(c => [`Type ${c.type}`, `${fmtNum(c.nb)} agents · ${fmtNum(c.etp)} ETP`]),
    ],
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Section 2 — Rémunérations ───────────────────────────────────
  y = ensureSpace(doc, y, 50);
  y = setHeaderBlock(doc, '2. Rémunérations', 'Masse salariale brute + charges patronales + coût employeur (annuel)', y);
  const rem = bilan.sections.remunerations;
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: COULEURS.primaire, textColor: 255 },
    bodyStyles: { fontSize: 9 },
    head: [['Indicateur', 'Montant']],
    body: [
      ['Brut annuel', fmtEur(rem.brutAnnuel)],
      ['Charges patronales', fmtEur(rem.chargesPatronales)],
      ['Coût employeur total', fmtEur(rem.coutEmployeur)],
      ['Taux de charges effectif', fmtPct(rem.tauxChargesEffectif)],
      ['Salaire moyen annuel ETP', fmtEur(rem.salaireMoyenAnnuelETP)],
    ],
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Section 3 — Pyramide des âges ───────────────────────────────
  y = ensureSpace(doc, y, 50);
  y = setHeaderBlock(doc, '3. Pyramide des âges & ancienneté', 'Détection vieillissement (>55 ans) — risque démographique', y);
  const pyr = bilan.sections.pyramide;
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: COULEURS.primaire, textColor: 255 },
    bodyStyles: { fontSize: 9 },
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Âge moyen', `${fmtNum(pyr.totaux.ageMoyen)} ans`],
      ['Ancienneté moyenne', `${fmtNum(pyr.totaux.ancMoyenne)} ans`],
      ['% seniors > 55 ans', fmtPct(pyr.totaux.pctSeniors)],
      ['Niveau démographique', pyr.totaux.niveau.toUpperCase()],
      ['Services en risque', `${fmtNum(pyr.totaux.nbServicesEnRisque)} / Services en alerte : ${fmtNum(pyr.totaux.nbServicesEnAlerte)}`],
    ],
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Section 4 — Parité H/F & Turn-over ──────────────────────────
  y = ensureSpace(doc, y, 60);
  y = setHeaderBlock(doc, '4. Parité H/F & Turn-over', 'Loi Rixain (parité 30 % cadres dirigeants) + norme APEC (turn-over)', y);
  const ptr = bilan.sections.pariteTurnOver;
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: COULEURS.primaire, textColor: 255 },
    bodyStyles: { fontSize: 9 },
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Index parité (% genre minoritaire)', fmtPct(ptr.pariteConsolidee.indexParite)],
      ['Niveau parité', ptr.pariteConsolidee.niveau.toUpperCase()],
      ['Genre majoritaire', ptr.pariteConsolidee.genreMajoritaire || '—'],
      ['Turn-over global', fmtPct(ptr.turnOverConsolide.turnOver)],
      ['Niveau turn-over', ptr.turnOverConsolide.niveau.toUpperCase()],
      ['Entrées année', fmtNum(ptr.turnOverConsolide.entrees)],
      ['Sorties année', fmtNum(ptr.turnOverConsolide.sorties)],
      ['Effectif moyen', fmtNum(ptr.turnOverConsolide.effectifMoyen)],
    ],
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Section 5 — OETH ────────────────────────────────────────────
  y = ensureSpace(doc, y, 50);
  y = setHeaderBlock(doc, '5. OETH — Travailleurs handicapés', 'Obligation art. L.5212-2 (≥ 6 % de l\'effectif si ≥ 20 ETP)', y);
  const oeth = bilan.sections.oeth;
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: COULEURS.primaire, textColor: 255 },
    bodyStyles: { fontSize: 9 },
    head: [['Indicateur', 'Valeur']],
    body: [
      ['ETP total', fmtNum(oeth.totalETP)],
      ['ETP RQTH', fmtNum(oeth.totalETPRqth)],
      ['Taux RQTH', fmtPct(oeth.tauxRqth)],
      ['Obligation ETP (6 %)', fmtNum(oeth.obligationETP)],
      ['Conformité', oeth.estConforme ? 'CONFORME' : 'NON CONFORME'],
      ['Contribution AGEFIPH estimée', fmtEur(oeth.contributionEstimee)],
      ['Aides emploi durable estimées', fmtEur(oeth.aidesEstimees)],
    ],
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Section 6 — Formation ───────────────────────────────────────
  y = ensureSpace(doc, y, 40);
  y = setHeaderBlock(doc, '6. Formation', 'Effort de formation et accompagnement des stagiaires', y);
  const form = bilan.sections.formation;
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: COULEURS.primaire, textColor: 255 },
    bodyStyles: { fontSize: 9 },
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Effectif stagiaires', fmtNum(form.effectifTotal)],
      ['Enveloppe formation prévue', fmtEur(form.enveloppeFormation)],
      ['Dépense formation réalisée', fmtEur(form.depenseRealiseeFormation)],
    ],
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Section 7 — Conditions de travail (DUER + Sécurité) ─────────
  y = ensureSpace(doc, y, 80);
  y = setHeaderBlock(doc, '7. Conditions d\'hygiène, sécurité et travail', 'DUER (R.4121-1) + Accidents du travail (taux INRS)', y);
  const ct = bilan.sections.conditionsTravail;
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: COULEURS.primaire, textColor: 255 },
    bodyStyles: { fontSize: 9 },
    head: [['Indicateur', 'Valeur']],
    body: [
      ['DUER — Risques recensés', fmtNum(ct.duer.totalRisques)],
      ['DUER — Risques critiques', fmtNum(ct.duer.nbCritiques)],
      ['DUER — Plans d\'action en retard', fmtNum(ct.duer.plansAction.nbEnRetard)],
      ['DUER — Couverture des unités', fmtPct(ct.duer.couverture)],
      ['DUER — Date dernière MAJ', ct.duer.dateMAJ || 'JAMAIS'],
      ['AT avec arrêt', fmtNum(ct.securite.accidentsAvecArret)],
      ['AT sans arrêt', fmtNum(ct.securite.accidentsSansArret)],
      ['Jours d\'arrêt AT', fmtNum(ct.securite.joursArretAT)],
      ['Maladies professionnelles', fmtNum(ct.securite.maladiesProfessionnelles)],
      ['Heures travaillées (référence)', fmtNum(ct.securite.heuresTravailles)],
      ['Taux de fréquence (TF) — INRS', ct.securite.tauxFrequence === null ? '—' : `${ct.securite.tauxFrequence} (niveau ${ct.securite.niveauTF})`],
      ['Taux de gravité (TG) — INRS', ct.securite.tauxGravite === null ? '—' : `${ct.securite.tauxGravite} (niveau ${ct.securite.niveauTG})`],
    ],
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── Alertes ─────────────────────────────────────────────────────
  if (bilan.alertes.length > 0) {
    y = ensureSpace(doc, y, 30);
    y = setHeaderBlock(doc, 'Points de vigilance', `${bilan.alertes.length} alerte(s) à traiter avant présentation`, y);
    autoTable(doc, {
      startY: y,
      theme: 'plain',
      bodyStyles: { fontSize: 9 },
      head: [['Niveau', 'Section', 'Message']],
      headStyles: { fillColor: [241, 245, 249], textColor: COULEURS.texte },
      body: bilan.alertes.map(a => [
        a.niveau === 'danger' ? '✕' : '⚠',
        a.section || '',
        a.message,
      ]),
      margin: { left: 14, right: 14 },
    });
  }

  // ─── Pied de page ────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COULEURS.doux);
    doc.text(
      `Bilan Social ${bilan.exercice} — ${raisonSociale} — page ${i}/${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`BilanSocial_${raisonSociale.replace(/[^a-z0-9]/gi, '_')}_${bilan.exercice}.pdf`);
};
