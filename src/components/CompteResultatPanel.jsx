import React, { useMemo, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { calculerCompteResultat } from '../utils/compteResultat';
import DataTable from './ui/DataTable';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';

export default function CompteResultatPanel({ darkMode, direction, services, poleSupport, globalParams, poolRH = [], planningAbsences = null, fondsDedies = [], benevoles = [] }) {
  const [expanded, setExpanded] = useState(false);
  const cr = useMemo(
    () => calculerCompteResultat(direction, services, poleSupport, globalParams, poolRH, planningAbsences, { fondsDedies, benevoles }),
    [direction, services, poleSupport, globalParams, poolRH, planningAbsences, fondsDedies, benevoles]
  );

  const cellHeader = darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700';
  const rowEven = darkMode ? 'bg-zinc-900/50' : 'bg-white';
  const rowOdd = darkMode ? 'bg-zinc-800/40' : 'bg-slate-50/70';
  const sectionRow = darkMode ? 'bg-violet-900/30 text-violet-200' : 'bg-violet-50 text-violet-700';
  const totalRow = darkMode ? 'bg-zinc-700/60 text-white' : 'bg-slate-200 text-slate-800';
  const resultRow = (positif) => positif
    ? (darkMode ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-50 text-emerald-800')
    : (darkMode ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-50 text-rose-800');

  const exporterCSV = () => {
    const lignes = [
      ['Section', 'Compte', 'Libellé', 'Charges (€)', 'Produits (€)'],
      ...cr.charges.map(c => [c.section, c.code, c.libelle, c.montant.toFixed(2), '']),
      ...cr.produits.map(p => [p.section, p.code, p.libelle, '', p.montant.toFixed(2)]),
      [],
      ['Synthèse', '', 'Total Charges', cr.totaux.totalCharges.toFixed(2), ''],
      ['Synthèse', '', 'Total Produits', '', cr.totaux.totalProduits.toFixed(2)],
      ['Synthèse', '', 'Résultat d\'exploitation', '', cr.totaux.resultatExploitation.toFixed(2)],
      ['Synthèse', '', 'Résultat financier', '', cr.totaux.resultatFinancier.toFixed(2)],
      ['Synthèse', '', 'Résultat exceptionnel', '', cr.totaux.resultatExceptionnel.toFixed(2)],
      ['Synthèse', '', 'RÉSULTAT NET', '', cr.totaux.resultatNet.toFixed(2)],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compte_resultat_${cr.annee}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-3xl border p-6 mb-6 ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}>
            <FileText size={20} className={darkMode ? 'text-indigo-300' : 'text-indigo-600'} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Compte de Résultat — {cr.annee}
            </h2>
            <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              PCG associatif (CRC 99-01 / Règl. ANC 2018-06) — Classes 60–69 / 70–79
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exporterCSV}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${darkMode ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
            title="Export CSV"
          >
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className={`p-2 rounded-xl ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Synthèse compacte (toujours visible) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className={`rounded-2xl p-3 ${darkMode ? 'bg-rose-950/30 border border-rose-700/40' : 'bg-rose-50 border border-rose-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>Total Charges</p>
          <p className={`text-xl font-black ${darkMode ? 'text-rose-100' : 'text-rose-800'}`}>{fmt(cr.totaux.totalCharges)}</p>
        </div>
        <div className={`rounded-2xl p-3 ${darkMode ? 'bg-emerald-950/30 border border-emerald-700/40' : 'bg-emerald-50 border border-emerald-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>Total Produits</p>
          <p className={`text-xl font-black ${darkMode ? 'text-emerald-100' : 'text-emerald-800'}`}>{fmt(cr.totaux.totalProduits)}</p>
        </div>
        <div className={`rounded-2xl p-3 ${darkMode ? 'bg-blue-950/30 border border-blue-700/40' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Résultat exploitation</p>
          <p className={`text-xl font-black ${cr.totaux.resultatExploitation >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-rose-300' : 'text-rose-700')}`}>
            {cr.totaux.resultatExploitation >= 0 ? '+' : ''}{fmt(cr.totaux.resultatExploitation)}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${cr.totaux.resultatNet >= 0 ? (darkMode ? 'bg-emerald-900/40 border border-emerald-600' : 'bg-emerald-100 border border-emerald-400') : (darkMode ? 'bg-rose-900/40 border border-rose-600' : 'bg-rose-100 border border-rose-400')}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>Résultat NET</p>
          <p className={`text-xl font-black ${cr.totaux.resultatNet >= 0 ? (darkMode ? 'text-emerald-200' : 'text-emerald-900') : (darkMode ? 'text-rose-200' : 'text-rose-900')}`}>
            {cr.totaux.resultatNet >= 0 ? '+' : ''}{fmt(cr.totaux.resultatNet)}
          </p>
        </div>
      </div>

      {expanded && (
        <div>
          <DataTable darkMode={darkMode} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={darkMode}>Section</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={darkMode}>Compte PCG</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={darkMode}>Libellé</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={darkMode} align="right">Charges (€)</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={darkMode} align="right">Produits (€)</DataTable.HeadCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {/* Charges Exploitation */}
              <DataTable.Row>
                <DataTable.Cell darkMode={darkMode} className={`font-black ${sectionRow}`} colSpan={5}>
                  I — Charges d'exploitation
                </DataTable.Cell>
              </DataTable.Row>
              {cr.charges.filter(c => c.section === 'Exploitation').map((c, i) => (
                <DataTable.Row key={`ce-${i}`}>
                  <DataTable.Cell darkMode={darkMode}>Exploitation</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode} mono>{c.code}</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode}>{c.libelle}</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode} align="right" mono>{fmt(c.montant)}</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode} align="right">—</DataTable.Cell>
                </DataTable.Row>
              ))}
              <DataTable.Row highlight>
                <DataTable.Cell darkMode={darkMode} bold align="right" colSpan={3} className={totalRow}>
                  Sous-total charges exploitation
                </DataTable.Cell>
                <DataTable.Cell darkMode={darkMode} mono bold align="right" className={totalRow}>
                  {fmt(cr.totaux.totalChargesExploitation)}
                </DataTable.Cell>
                <DataTable.Cell darkMode={darkMode} className={totalRow} />
              </DataTable.Row>

              {/* Produits Exploitation */}
              <DataTable.Row>
                <DataTable.Cell darkMode={darkMode} className={`font-black ${sectionRow}`} colSpan={5}>
                  II — Produits d'exploitation
                </DataTable.Cell>
              </DataTable.Row>
              {cr.produits.filter(p => p.section === 'Exploitation').map((p, i) => (
                <DataTable.Row key={`pe-${i}`}>
                  <DataTable.Cell darkMode={darkMode}>Exploitation</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode} mono>{p.code}</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode}>{p.libelle}</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode} align="right">—</DataTable.Cell>
                  <DataTable.Cell darkMode={darkMode} align="right" mono>{fmt(p.montant)}</DataTable.Cell>
                </DataTable.Row>
              ))}
              <DataTable.Row highlight>
                <DataTable.Cell darkMode={darkMode} bold align="right" colSpan={4} className={totalRow}>
                  Sous-total produits exploitation
                </DataTable.Cell>
                <DataTable.Cell darkMode={darkMode} mono bold align="right" className={totalRow}>
                  {fmt(cr.totaux.totalProduitsExploitation)}
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row level={cr.totaux.resultatExploitation >= 0 ? 'success' : 'danger'}>
                <DataTable.Cell darkMode={darkMode} bold align="right" colSpan={4} className={resultRow(cr.totaux.resultatExploitation >= 0)}>
                  RÉSULTAT D'EXPLOITATION
                </DataTable.Cell>
                <DataTable.Cell darkMode={darkMode} mono bold align="right" className={resultRow(cr.totaux.resultatExploitation >= 0)}>
                  {cr.totaux.resultatExploitation >= 0 ? '+' : ''}{fmt(cr.totaux.resultatExploitation)}
                </DataTable.Cell>
              </DataTable.Row>

              {/* Financier */}
              {(cr.charges.some(c => c.section === 'Financier') || cr.produits.some(p => p.section === 'Financier')) && (
                <>
                  <DataTable.Row>
                    <DataTable.Cell darkMode={darkMode} className={`font-black ${sectionRow}`} colSpan={5}>
                      III — Résultat financier
                    </DataTable.Cell>
                  </DataTable.Row>
                  {cr.charges.filter(c => c.section === 'Financier').map((c, i) => (
                    <DataTable.Row key={`cf-${i}`}>
                      <DataTable.Cell darkMode={darkMode}>Financier</DataTable.Cell>
                      <DataTable.Cell darkMode={darkMode} mono>{c.code}</DataTable.Cell>
                      <DataTable.Cell darkMode={darkMode}>{c.libelle}</DataTable.Cell>
                      <DataTable.Cell darkMode={darkMode} align="right" mono>{fmt(c.montant)}</DataTable.Cell>
                      <DataTable.Cell darkMode={darkMode} align="right">—</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                  <DataTable.Row level={cr.totaux.resultatFinancier >= 0 ? 'success' : 'danger'}>
                    <DataTable.Cell darkMode={darkMode} bold align="right" colSpan={4} className={resultRow(cr.totaux.resultatFinancier >= 0)}>
                      Résultat financier
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={darkMode} mono bold align="right" className={resultRow(cr.totaux.resultatFinancier >= 0)}>
                      {cr.totaux.resultatFinancier >= 0 ? '+' : ''}{fmt(cr.totaux.resultatFinancier)}
                    </DataTable.Cell>
                  </DataTable.Row>
                </>
              )}

              {/* Résultat net final */}
              <DataTable.Row level={cr.totaux.resultatNet >= 0 ? 'success' : 'danger'}>
                <DataTable.Cell darkMode={darkMode} bold align="right" colSpan={4} className={`${resultRow(cr.totaux.resultatNet >= 0)} text-base`}>
                  RÉSULTAT NET DE L'EXERCICE
                </DataTable.Cell>
                <DataTable.Cell darkMode={darkMode} mono bold align="right" className={`${resultRow(cr.totaux.resultatNet >= 0)} text-base`}>
                  {cr.totaux.resultatNet >= 0 ? '+' : ''}{fmt(cr.totaux.resultatNet)}
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable.Body>
          </DataTable>

          {/* Pied de compte de résultat — contributions volontaires en nature (classe 8) */}
          {cr.contributionsVolontaires && cr.contributionsVolontaires.compte87 > 0 && (
            <div className={`mt-4 rounded-xl p-3 border ${darkMode ? 'bg-violet-900/20 border-violet-800 text-violet-200' : 'bg-violet-50 border-violet-200 text-violet-800'}`}>
              <p className="text-xs font-bold mb-1.5">Contributions volontaires en nature (classe 8 — ANC 2018-06, sans impact sur le résultat)</p>
              <div className="text-[11px] space-y-0.5">
                {Object.values(cr.contributionsVolontaires.parCategorie || {}).filter(c => c.total > 0).map(c => (
                  <div key={c.compte} className="flex justify-between">
                    <span>{c.compte} — {c.libelle}</span>
                    <span className="font-mono">{fmt(c.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1 border-t border-current/20">
                  <span>86 Emplois = 87 Ressources</span>
                  <span className="font-mono">{fmt(cr.contributionsVolontaires.compte87)}</span>
                </div>
              </div>
            </div>
          )}

          {cr.ventilation?.nbNonClasses > 0 && (
            <p className={`mt-3 text-[10px] ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              ⚠ {cr.ventilation.nbNonClasses} ligne(s) de charge sans mot-clé reconnu, classée(s) par défaut en compte 65.
              Précisez les libellés (ex. « Loyer », « Fournitures », « Honoraires ») pour affiner la ventilation.
            </p>
          )}
          <p className={`mt-3 text-[10px] italic ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
            Présentation conforme PCG associatif (CRC 99-01, Règl. ANC 2018-06). Ventilation 60/61/62/65 établie
            ligne à ligne sur les libellés saisis. Les libellés et codes sont indicatifs ;
            l'imputation définitive relève du logiciel comptable certifié.
          </p>
        </div>
      )}
    </div>
  );
}
