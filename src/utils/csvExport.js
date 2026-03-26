/**
 * Export comptable au format CSV Sage / Cegid
 * Colonnes : CodeJournal | Date | CompteGeneral | Libelle | Debit | Credit
 */

// Mapping mots-clés → numéros de compte PCG
const MAPPING_COMPTES = [
  { mots: ['loyer', 'location', 'bail'],                        compte: '6130' },
  { mots: ['énergie', 'electricité', 'électricité', 'gaz'],     compte: '6060' },
  { mots: ['carburant', 'fuel', 'essence'],                     compte: '6061' },
  { mots: ['transport', 'déplacement', 'deplacement'],          compte: '6240' },
  { mots: ['assurance'],                                        compte: '6160' },
  { mots: ['téléphonie', 'telephonie', 'internet', 'telecom'],  compte: '6260' },
  { mots: ['fourniture', 'consommable', 'papeterie'],           compte: '6064' },
  { mots: ['entretien', 'maintenance', 'réparation'],           compte: '6150' },
  { mots: ['banque', 'frais bancaire', 'agios'],                compte: '6270' },
  { mots: ['documentation', 'abonnement', 'revue'],             compte: '6181' },
  { mots: ['formation', 'stage'],                               compte: '6330' },
  { mots: ['honoraire', 'expertise', 'conseil'],                compte: '6220' },
  { mots: ['communication', 'publicité', 'marketing'],          compte: '6230' },
  { mots: ['informatique', 'logiciel', 'licence'],              compte: '6183' },
  { mots: ['alimentation', 'repas', 'restauration'],            compte: '6010' },
];

const COMPTE_EXPLOITATION_DEFAUT = '6150';
const COMPTE_RECETTE_DEFAUT = '7060';

function getCompteExploitation(libelle) {
  const l = (libelle || '').toLowerCase();
  const match = MAPPING_COMPTES.find(m => m.mots.some(mot => l.includes(mot)));
  return match ? match.compte : COMPTE_EXPLOITATION_DEFAUT;
}

function getCompteRecette(libelle) {
  const l = (libelle || '').toLowerCase();
  if (l.includes('subvention') || l.includes('région') || l.includes('état') || l.includes('département') || l.includes('cpom')) return '7400';
  if (l.includes('opco') || l.includes('formation continue')) return '7470';
  if (l.includes('taxe apprentissage')) return '7411';
  if (l.includes('inscription') || l.includes('scolarité') || l.includes('frais')) return '7060';
  if (l.includes('prestation')) return '7066';
  return COMPTE_RECETTE_DEFAUT;
}

function ligne(journal, date, compte, libelle, debit, credit) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const fmt = (n) => n > 0 ? n.toFixed(2) : '';
  return [journal, date, compte, esc(libelle), fmt(debit), fmt(credit)].join(';');
}

/**
 * Génère le contenu CSV du budget prévisionnel
 * @param {object} direction
 * @param {Array}  services
 * @param {object} poleSupport
 * @param {number} annee  ex: 2026
 * @param {Function} getBudgetService
 * @param {Function} getBudgetDirection
 * @param {Function} getBudgetPoleSupport
 * @returns {string} contenu CSV
 */
export function genererCSVComptable(direction, services, poleSupport, annee = 2026, getBudgetService, getBudgetDirection, getBudgetPoleSupport) {
  const DATE = `31/12/${annee}`;
  const JL = 'OD'; // journal opérations diverses

  const rows = [];
  rows.push(['CodeJournal', 'Date', 'CompteGeneral', 'Libelle', 'Debit', 'Credit'].join(';'));

  // ── Salaires & charges patronales ──────────────────────────────
  const addSalaires = (personnel, source) => {
    (personnel || []).forEach(p => {
      const brut = (p.salaire || 0) * (p.etp || 1) * 12;
      const charges = Math.round(brut * 0.42);
      if (brut > 0) {
        rows.push(ligne(JL, DATE, '6411', `Salaires bruts — ${p.titre || p.nom || source}`, Math.round(brut), 0));
        rows.push(ligne(JL, DATE, '6451', `Charges patronales — ${p.titre || p.nom || source}`, charges, 0));
      }
    });
  };
  addSalaires(direction.personnel, 'Siège');
  addSalaires(poleSupport?.personnel, 'Pôle Support');
  services.forEach(s => addSalaires(s.personnel, s.nom));

  // ── Exploitation ───────────────────────────────────────────────
  const addExploitation = (lignes, source) => {
    (lignes || []).forEach(l => {
      const montant = Math.round((l.montant || 0) * 12);
      if (montant > 0) {
        const compte = getCompteExploitation(l.nom);
        rows.push(ligne(JL, DATE, compte, `${l.nom || 'Charge'} — ${source}`, montant, 0));
      }
    });
  };
  addExploitation(direction.chargesSiege, 'Siège');
  addExploitation(poleSupport?.exploitation, 'Pôle Support');
  services.forEach(s => addExploitation(s.exploitation, s.nom));

  // ── Recettes ───────────────────────────────────────────────────
  const addRecettes = (recettes, source) => {
    (recettes || []).forEach(r => {
      const montant = Math.round((r.montant || 0) * 12);
      if (montant > 0) {
        const compte = getCompteRecette(r.nom);
        rows.push(ligne(JL, DATE, compte, `${r.nom || 'Recette'} — ${source}`, 0, montant));
      }
    });
  };
  services.forEach(s => addRecettes(s.recettes, s.nom));
  addRecettes(poleSupport?.recettes, 'Pôle Support');

  // ── Amortissements ─────────────────────────────────────────────
  services.forEach(s => {
    const b = getBudgetService(s);
    if (b.amortissements > 0) {
      rows.push(ligne(JL, DATE, '6811', `Dotation amortissements — ${s.nom}`, Math.round(b.amortissements), 0));
    }
  });

  return rows.join('\n');
}

export function telechargerCSVComptable(csvContent, annee = 2026) {
  const bom = '\uFEFF'; // BOM UTF-8 pour Excel français
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget_comptable_${annee}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
