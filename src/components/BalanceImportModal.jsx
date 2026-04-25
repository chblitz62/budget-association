import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Check, AlertTriangle, Table, FileText } from 'lucide-react';

const CLASSE_LABELS = {
  '6': 'Charges exploitation',
  '64': 'Charges personnel (64)',
  '68': 'Dotations amortissements (68)',
  '7': 'Produits / Recettes',
  '2': 'Immobilisations',
  '4': 'Tiers (clients/fourn.)',
  '5': 'Trésorerie',
  '1': 'Capitaux',
};

const classifierCompte = (compte) => {
  if (!compte) return 'autre';
  const c = String(compte).trim();
  if (c.startsWith('64')) return 'salaires';
  if (c.startsWith('68')) return 'amortissements';
  if (c.startsWith('6'))  return 'exploitation';
  if (c.startsWith('7'))  return 'recettes';
  if (c.startsWith('2'))  return 'immobilisations';
  if (c.startsWith('4'))  return 'tiers';
  if (c.startsWith('5'))  return 'tresorerie';
  return 'autre';
};

const parseBalance = (rows) => {
  if (!rows.length) return null;

  const headers = Object.keys(rows[0]);
  const findCol = (...keys) => headers.find(h => keys.some(k => h.toLowerCase().replace(/\s/g,'').includes(k)));

  const colCompte    = findCol('compte','num','numéro','numero');
  const colIntitule  = findCol('intitulé','intitule','libellé','libelle','nom','designation','désignation');
  const colDebit     = findCol('débit','debit','mouvtd','mouvement_d','solded','totaldebit');
  const colCredit    = findCol('crédit','credit','mouvtc','mouvement_c','soldec','totalcredit');
  const colSolde     = findCol('solde','balance','montant','net');

  const entries = rows.map(row => {
    const compte   = colCompte   ? String(row[colCompte]   || '').trim() : '';
    const intitule = colIntitule ? String(row[colIntitule] || '').trim() : '';
    const debit    = parseFloat(colDebit  ? row[colDebit]  : 0) || 0;
    const credit   = parseFloat(colCredit ? row[colCredit] : 0) || 0;
    const solde    = colSolde    ? (parseFloat(row[colSolde])  || 0)
                                 : (debit - credit);
    if (!compte && !intitule) return null;
    return { compte, intitule, debit, credit, solde, categorie: classifierCompte(compte) };
  }).filter(Boolean);

  return { entries, colsDetected: { compte: colCompte, intitule: colIntitule, debit: colDebit, credit: colCredit, solde: colSolde } };
};

const BalanceImportModal = ({ isOpen, onClose, onConfirm, darkMode }) => {
  const [parsed, setParsed] = useState(null);
  const [error, setError]   = useState('');
  const [annee, setAnnee]   = useState(new Date().getFullYear());
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const handleFile = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'string', raw: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          const result = parseBalance(rows);
          if (!result || !result.entries.length) { setError('Aucune ligne valide détectée.'); return; }
          setParsed(result);
        } catch { setError('Erreur lors de la lecture du fichier CSV.'); }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          const result = parseBalance(rows);
          if (!result || !result.entries.length) { setError('Aucune ligne valide détectée.'); return; }
          setParsed(result);
        } catch { setError('Erreur lors de la lecture du fichier Excel.'); }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e); };

  const handleConfirm = () => {
    if (!parsed) return;
    const { entries } = parsed;
    const totalCharges = entries.filter(e => ['salaires','exploitation','amortissements'].includes(e.categorie)).reduce((s, e) => s + Math.abs(e.solde), 0);
    const totalRecettes = entries.filter(e => e.categorie === 'recettes').reduce((s, e) => s + Math.abs(e.solde), 0);
    onConfirm({ annee, entries, totalCharges, totalRecettes, importedAt: new Date().toISOString(), fileName });
    onClose();
  };

  const c = darkMode;
  const bg = c ? 'bg-gray-800' : 'bg-white';
  const border = c ? 'border-gray-700' : 'border-slate-200';
  const text = c ? 'text-white' : 'text-slate-800';
  const sub = c ? 'text-gray-400' : 'text-slate-500';

  const stats = parsed ? {
    salaires:       parsed.entries.filter(e => e.categorie === 'salaires').reduce((s, e) => s + Math.abs(e.solde), 0),
    exploitation:   parsed.entries.filter(e => e.categorie === 'exploitation').reduce((s, e) => s + Math.abs(e.solde), 0),
    amortissements: parsed.entries.filter(e => e.categorie === 'amortissements').reduce((s, e) => s + Math.abs(e.solde), 0),
    recettes:       parsed.entries.filter(e => e.categorie === 'recettes').reduce((s, e) => s + Math.abs(e.solde), 0),
  } : null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print" onClick={onClose}>
      <div className={`w-full max-w-3xl rounded-3xl shadow-2xl p-6 ${bg}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${c ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Table className="text-blue-500" size={22} />
            </div>
            <div>
              <h3 className={`text-lg font-black ${text}`}>Import Balance Comptable</h3>
              <p className={`text-sm ${sub}`}>Excel ou CSV — compte, intitulé, débit, crédit, solde</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${c ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
        </div>

        {/* Année */}
        <div className="flex items-center gap-3 mb-5">
          <label className={`text-sm font-bold ${sub}`}>Exercice</label>
          <input type="number" min="2020" max="2030"
            className={`w-24 text-center font-black text-lg rounded-xl px-3 py-2 outline-none border-2 ${c ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-400'}`}
            value={annee} onChange={e => setAnnee(parseInt(e.target.value) || annee)} />
        </div>

        {/* Drop zone */}
        {!parsed && (
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors mb-4 ${c ? 'border-gray-600 hover:border-blue-500 text-gray-400' : 'border-slate-200 hover:border-blue-400 text-slate-400'}`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('balance-file-input').click()}
          >
            <Upload size={36} className="mx-auto mb-3 text-blue-400" />
            <p className="font-bold text-sm">Glissez votre balance ou cliquez pour sélectionner</p>
            <p className={`text-xs mt-1 ${sub}`}>Formats acceptés : .xlsx, .xls, .csv</p>
            <input id="balance-file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {error && (
          <div className={`flex items-center gap-2 text-sm mb-4 p-3 rounded-xl ${c ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <AlertTriangle size={16} /><span>{error}</span>
          </div>
        )}

        {/* Preview */}
        {parsed && (
          <>
            <div className={`flex items-center justify-between mb-3 p-3 rounded-xl ${c ? 'bg-gray-700/60' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                <span className={`text-sm font-bold ${text}`}>{fileName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>{parsed.entries.length} lignes</span>
              </div>
              <button onClick={() => { setParsed(null); setFileName(''); }} className={`text-xs ${c ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}>Changer de fichier</button>
            </div>

            {/* KPIs détectés */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Salaires (64)', val: stats.salaires,       bg: c ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200', txt: c ? 'text-purple-300' : 'text-purple-700' },
                { label: 'Exploitation',  val: stats.exploitation,   bg: c ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200', txt: c ? 'text-orange-300' : 'text-orange-700' },
                { label: 'Amortiss.',     val: stats.amortissements, bg: c ? 'bg-gray-700 border-gray-600'         : 'bg-slate-100 border-slate-300',  txt: c ? 'text-gray-300'   : 'text-slate-600'  },
                { label: 'Recettes (7)',  val: stats.recettes,       bg: c ? 'bg-teal-900/30 border-teal-700'     : 'bg-teal-50 border-teal-200',     txt: c ? 'text-teal-300'   : 'text-teal-700'   },
              ].map(({ label, val, bg: kbg, txt }) => (
                <div key={label} className={`rounded-2xl p-3 border ${kbg}`}>
                  <div className={`text-[10px] font-bold uppercase mb-1 ${sub}`}>{label}</div>
                  <div className={`text-lg font-black ${txt}`}>{Math.round(val).toLocaleString()} €</div>
                </div>
              ))}
            </div>

            {/* Colonnes détectées */}
            {parsed.colsDetected && (
              <div className={`text-xs mb-3 px-3 py-2 rounded-xl ${c ? 'bg-gray-700/60 text-gray-400' : 'bg-slate-50 text-slate-500'}`}>
                Colonnes détectées : {Object.entries(parsed.colsDetected).filter(([,v])=>v).map(([k,v]) => `${k}="${v}"`).join(' · ')}
              </div>
            )}

            {/* Aperçu table */}
            <div className={`rounded-2xl border overflow-hidden mb-5 max-h-48 overflow-y-auto ${border}`}>
              <table className="w-full text-xs">
                <thead className={c ? 'bg-gray-700' : 'bg-slate-100'}>
                  <tr>{['Compte','Intitulé','Débit','Crédit','Solde','Catégorie'].map(h => (
                    <th key={h} className={`px-3 py-2 text-left font-bold ${sub}`}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {parsed.entries.slice(0, 30).map((e, i) => (
                    <tr key={i} className={i % 2 === 0 ? (c ? 'bg-gray-800' : 'bg-white') : (c ? 'bg-gray-750' : 'bg-slate-50')}>
                      <td className={`px-3 py-1.5 font-mono ${text}`}>{e.compte}</td>
                      <td className={`px-3 py-1.5 ${text} max-w-[150px] truncate`}>{e.intitule}</td>
                      <td className={`px-3 py-1.5 text-right ${sub}`}>{e.debit ? e.debit.toLocaleString() : '-'}</td>
                      <td className={`px-3 py-1.5 text-right ${sub}`}>{e.credit ? e.credit.toLocaleString() : '-'}</td>
                      <td className={`px-3 py-1.5 text-right font-bold ${e.solde < 0 ? 'text-red-500' : (c ? 'text-emerald-400' : 'text-emerald-700')}`}>{e.solde.toLocaleString()}</td>
                      <td className={`px-3 py-1.5 text-xs ${sub}`}>{e.categorie}</td>
                    </tr>
                  ))}
                  {parsed.entries.length > 30 && (
                    <tr><td colSpan={6} className={`px-3 py-2 text-center text-xs italic ${sub}`}>… et {parsed.entries.length - 30} autres lignes</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <button onClick={handleConfirm} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Check size={18} /> Importer {parsed.entries.length} lignes pour {annee}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BalanceImportModal;
