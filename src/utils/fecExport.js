// Export FEC (Fichier des Écritures Comptables) — BOI-CF-IOR-60-40
// Format pipe-delimited UTF-8, 18 colonnes réglementaires, conforme contrôle fiscal.
//
// Spécification : Article L. 47 A I bis du LPF — fichier opposable à l'administration fiscale.
//
// Règles structurelles :
//   - 1 ligne d'en-tête + N lignes d'écritures
//   - Chaque écriture (EcritureNum) doit être équilibrée (ΣDébit = ΣCrédit)
//   - Pour chaque ligne : Debit XOR Credit > 0 (jamais les deux)
//   - Dates au format AAAAMMJJ
//   - Montants : virgule décimale (ex: "1234,56"), pas de séparateur de milliers
//
// Limitations : ce FEC est généré à partir du **budget prévisionnel**. Il sert
// d'export contrôle/audit avant intégration au logiciel comptable certifié.

import { calculerBudgetDirection, calculerBudgetService, calculerBudgetPoleSupport } from './calculations';
import { CHARGES_PATRONALES } from './constants';

const FEC_HEADERS = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
  'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib',
  'Debit', 'Credit',
  'EcritureLet', 'DateLet', 'ValidDate',
  'Montantdevise', 'Idevise',
];

const formatDate = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const j = String(dt.getDate()).padStart(2, '0');
  return `${y}${m}${j}`;
};

const formatMontant = (n) => {
  if (!Number.isFinite(n) || n === 0) return '0,00';
  return n.toFixed(2).replace('.', ',');
};

const sanitize = (s) => String(s ?? '').replace(/[|\t\r\n]/g, ' ').trim();

/**
 * Construit une écriture équilibrée à 2 lignes (débit / crédit).
 */
const ecriture = ({ num, date, journal, journalLib, libelle, piece, debit, credit, montant }) => {
  if (!Number.isFinite(montant) || montant <= 0) return [];
  const dateStr = formatDate(date);
  const validStr = formatDate(new Date());
  const base = {
    JournalCode: journal,
    JournalLib: journalLib,
    EcritureNum: String(num),
    EcritureDate: dateStr,
    CompAuxNum: '', CompAuxLib: '',
    PieceRef: piece,
    PieceDate: dateStr,
    EcritureLib: libelle,
    EcritureLet: '', DateLet: '',
    ValidDate: validStr,
    Montantdevise: '', Idevise: '',
  };
  return [
    { ...base, CompteNum: debit.compte, CompteLib: debit.lib, Debit: formatMontant(montant), Credit: '0,00' },
    { ...base, CompteNum: credit.compte, CompteLib: credit.lib, Debit: '0,00', Credit: formatMontant(montant) },
  ];
};

/**
 * Génère les lignes FEC à partir du budget prévisionnel.
 * @returns {{ lines: Array<Record<string,string>>, stats: { totalDebit, totalCredit, ecritures } }}
 */
export const genererLignesFEC = (direction, services, poleSupport, globalParams) => {
  const annee = globalParams?.anneeExercice || new Date().getFullYear();
  const dateCloture = new Date(annee, 11, 31); // 31/12 de l'exercice
  const journal = 'BUDG';
  const journalLib = 'Journal du budget prévisionnel';
  const lines = [];
  let num = 1;

  const bdDir = calculerBudgetDirection(direction, null, annee);
  const bdPS  = poleSupport ? calculerBudgetPoleSupport(poleSupport, null, annee) : null;
  const bdSvcs = (services || []).map(s => ({ nom: s.nom || 'Service', budget: calculerBudgetService(s, null, annee) }));

  const pushSalaires = (entite, salairesAnnuels) => {
    if (!salairesAnnuels || salairesAnnuels <= 0) return;
    // Décomposition salaires bruts / charges patronales selon CHARGES_PATRONALES (44 %)
    // salairesAnnuels (issu des calculs) = brut + charges patronales
    const tauxCP = CHARGES_PATRONALES;
    const brut = salairesAnnuels / (1 + tauxCP);
    const cp = salairesAnnuels - brut;
    lines.push(...ecriture({
      num: num++, date: dateCloture, journal, journalLib,
      libelle: `Rémunérations brutes — ${entite}`,
      piece: `BUDG-${annee}-SAL`,
      debit:  { compte: '641000', lib: 'Rémunérations du personnel' },
      credit: { compte: '421000', lib: 'Personnel - Rémunérations dues' },
      montant: brut,
    }));
    lines.push(...ecriture({
      num: num++, date: dateCloture, journal, journalLib,
      libelle: `Charges sociales patronales — ${entite}`,
      piece: `BUDG-${annee}-CP`,
      debit:  { compte: '645000', lib: 'Charges de sécurité sociale et de prévoyance' },
      credit: { compte: '431000', lib: 'Sécurité sociale' },
      montant: cp,
    }));
  };

  const pushExploitation = (entite, exploitation) => {
    if (!exploitation || exploitation <= 0) return;
    lines.push(...ecriture({
      num: num++, date: dateCloture, journal, journalLib,
      libelle: `Charges externes — ${entite}`,
      piece: `BUDG-${annee}-EXP`,
      debit:  { compte: '606000', lib: 'Achats non stockés (énergie, fournitures, etc.)' },
      credit: { compte: '401000', lib: 'Fournisseurs' },
      montant: exploitation,
    }));
  };

  const pushAmortissements = (entite, amortissements) => {
    if (!amortissements || amortissements <= 0) return;
    lines.push(...ecriture({
      num: num++, date: dateCloture, journal, journalLib,
      libelle: `Dotations aux amortissements — ${entite}`,
      piece: `BUDG-${annee}-AMO`,
      debit:  { compte: '681100', lib: 'Dotations aux amortissements sur immobilisations' },
      credit: { compte: '281000', lib: 'Amortissements des immobilisations' },
      montant: amortissements,
    }));
  };

  const pushRecettes = (entite, recettes) => {
    if (!recettes || recettes <= 0) return;
    lines.push(...ecriture({
      num: num++, date: dateCloture, journal, journalLib,
      libelle: `Produits — ${entite}`,
      piece: `BUDG-${annee}-REC`,
      debit:  { compte: '411000', lib: 'Clients (subventions, droits d\'inscription, OPCO)' },
      credit: { compte: '706000', lib: 'Prestations de services' },
      montant: recettes,
    }));
  };

  // Direction / Siège
  pushSalaires('Siège', bdDir.salaires);
  pushExploitation('Siège', bdDir.chargesSiege || 0);
  pushAmortissements('Siège', bdDir.amortissements || 0);
  pushRecettes('Siège', bdDir.recettes || 0);

  // Pôle Support
  if (bdPS) {
    pushSalaires('Pôle Support', bdPS.salaires);
    pushExploitation('Pôle Support', bdPS.exploitation || 0);
    pushAmortissements('Pôle Support', bdPS.amortissements || 0);
    pushRecettes('Pôle Support', bdPS.recettes || 0);
  }

  // Services
  bdSvcs.forEach(({ nom, budget }) => {
    pushSalaires(nom, budget.salaires);
    pushExploitation(nom, budget.exploitation || 0);
    pushAmortissements(nom, budget.amortissements || 0);
    pushRecettes(nom, budget.recettes || 0);
  });

  // Sanitize all string fields
  const finalLines = lines.map(l => {
    const o = {};
    FEC_HEADERS.forEach(h => { o[h] = sanitize(l[h]); });
    return o;
  });

  // Stats
  const totalDebit = finalLines.reduce((s, l) => s + parseFloat(l.Debit.replace(',', '.')), 0);
  const totalCredit = finalLines.reduce((s, l) => s + parseFloat(l.Credit.replace(',', '.')), 0);
  const ecritures = new Set(finalLines.map(l => l.EcritureNum)).size;

  return { lines: finalLines, stats: { totalDebit, totalCredit, ecritures } };
};

/**
 * Sérialise les lignes FEC au format pipe-delimited UTF-8 (BOI-CF-IOR-60-40).
 */
export const serialiserFEC = (lines) => {
  const headerRow = FEC_HEADERS.join('|');
  const dataRows = lines.map(l => FEC_HEADERS.map(h => l[h] ?? '').join('|'));
  return [headerRow, ...dataRows].join('\r\n');
};

/**
 * Déclenche le téléchargement du FEC.
 * Nom : SIREN_FEC_AAAAMMJJ.txt (convention administration)
 */
export const exportFEC = (direction, services, poleSupport, globalParams) => {
  const { lines, stats } = genererLignesFEC(direction, services, poleSupport, globalParams);
  const content = serialiserFEC(lines);
  // BOM UTF-8 pour reconnaissance Windows / Excel
  const blob = new Blob(['﻿' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const siren = (globalParams?.siren || '000000000').replace(/\D/g, '').padStart(9, '0').slice(0, 9);
  const annee = globalParams?.anneeExercice || new Date().getFullYear();
  a.href = url;
  a.download = `${siren}FEC${annee}1231.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return stats;
};
