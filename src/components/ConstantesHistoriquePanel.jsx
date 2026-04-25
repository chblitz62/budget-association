import React, { useEffect, useMemo, useState } from 'react';
import { Archive, ChevronDown, ChevronUp, Plus, Calendar, AlertTriangle, Download, Trash2 } from 'lucide-react';
import {
  CONSTANTES_VERSIONNABLES,
  chargerHistorique, sauvegarderHistorique,
  ajouterEntreeHistorique, valeurALaDate, detecterIncoherences,
} from '../utils/constantsVersionRegistry';

const today = () => new Date().toISOString().slice(0, 10);

export default function ConstantesHistoriquePanel({ darkMode, dafLocked = false, appendAuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [historique, setHistorique] = useState(() => chargerHistorique());
  const [selectedKey, setSelectedKey] = useState('CHARGES_PATRONALES');
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ valeur: '', dateApplication: today(), source: '', justification: '' });
  const [dateRetro, setDateRetro] = useState(today());

  useEffect(() => {
    sauvegarderHistorique(historique);
  }, [historique]);

  const incoherences = useMemo(() => detecterIncoherences(historique), [historique]);

  const submit = () => {
    if (dafLocked) return;
    const def = CONSTANTES_VERSIONNABLES[selectedKey];
    if (!def) return;
    const valeur = def.parseValeur(draft.valeur);
    if (!Number.isFinite(valeur)) return;
    const next = ajouterEntreeHistorique(historique, selectedKey, {
      ...draft, valeur,
    });
    setHistorique(next);
    appendAuditEntry?.('Ajout entrée historique constante', 'Paramètres',
      `${def.label} → ${def.formatValeur(valeur)} (${draft.dateApplication}) — ${draft.source}`);
    setDraft({ valeur: '', dateApplication: today(), source: '', justification: '' });
    setShowAdd(false);
  };

  const supprimerEntree = (constanteKey, ts) => {
    if (dafLocked || !ts) return; // entrées par défaut sans ts ne sont pas supprimables
    if (!confirm('Supprimer cette entrée d\'historique ?')) return;
    const next = { ...historique };
    next[constanteKey] = (next[constanteKey] || []).filter(e => e.ts !== ts);
    setHistorique(next);
    appendAuditEntry?.('Suppression entrée historique constante', 'Paramètres', `${constanteKey} (ts=${ts})`);
  };

  const exportCSV = () => {
    const rows = [['Constante', 'Date application', 'Valeur', 'Source', 'Justification', 'Validé par', 'Saisi le']];
    Object.keys(historique).forEach(key => {
      const def = CONSTANTES_VERSIONNABLES[key];
      historique[key].forEach(e => {
        rows.push([
          def?.label || key,
          e.dateApplication,
          def ? def.formatValeur(e.valeur) : e.valeur,
          e.source || '',
          e.justification || '',
          e.validePar || '',
          e.ts || '(défaut)',
        ]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `historique_constantes_${today()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dm = darkMode;
  const constanteSelectionnee = CONSTANTES_VERSIONNABLES[selectedKey];
  const entriesSelectionnees = historique[selectedKey] || [];
  const valeurRetro = valeurALaDate(historique, selectedKey, dateRetro);
  const inputCls = `w-full px-3 py-2 rounded-lg text-sm ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'} ${dafLocked ? 'opacity-60 cursor-not-allowed' : ''}`;

  return (
    <div className={`rounded-3xl border p-6 mb-6 ${dm ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${dm ? 'bg-fuchsia-900/40' : 'bg-fuchsia-100'}`}>
            <Archive size={20} className={dm ? 'text-fuchsia-300' : 'text-fuchsia-600'} />
          </div>
          <div>
            <h2 className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-800'}`}>
              Historique des constantes fiscales et sociales
            </h2>
            <p className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              Audit rétroactif — quel taux était applicable à une date donnée ?
            </p>
          </div>
          {dafLocked && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${dm ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>🔒 DAF</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${dm ? 'bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-900/60' : 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100'}`}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className={`p-2 rounded-xl ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Bannière incohérences */}
      {incoherences.length > 0 && (
        <div className={`rounded-2xl p-3 mb-4 flex items-start gap-2 ${dm ? 'bg-amber-950/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle size={16} className={dm ? 'text-amber-400 mt-0.5' : 'text-amber-600 mt-0.5'} />
          <div className="flex-1">
            <p className={`text-xs font-bold ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
              {incoherences.length} incohérence(s) entre code source et historique
            </p>
            <ul className={`text-[11px] mt-1 ${dm ? 'text-amber-300' : 'text-amber-700'} list-disc ml-5`}>
              {incoherences.slice(0, 3).map(i => (
                <li key={i.constante}>
                  <strong>{i.label}</strong> — code : {CONSTANTES_VERSIONNABLES[i.constante]?.formatValeur(i.valeurCode)} ;
                  dernière entrée : {CONSTANTES_VERSIONNABLES[i.constante]?.formatValeur(i.valeurHistorique)} ({i.dateApplication})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {expanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Sélecteur constante */}
            <div className="md:col-span-1">
              <label className={`text-xs font-bold mb-1 block ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>Constante</label>
              <select value={selectedKey} onChange={e => setSelectedKey(e.target.value)} className={inputCls}>
                {Object.entries(CONSTANTES_VERSIONNABLES).map(([key, def]) => (
                  <option key={key} value={key}>{def.label}</option>
                ))}
              </select>
              <p className={`text-[11px] mt-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                Valeur courante (code) : <strong>{constanteSelectionnee?.formatValeur(constanteSelectionnee?.valeurCourante)}</strong>
              </p>
            </div>

            {/* Audit rétroactif */}
            <div className="md:col-span-2">
              <label className={`text-xs font-bold mb-1 flex items-center gap-1 ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>
                <Calendar size={12} /> Audit rétroactif — valeur à la date :
              </label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateRetro} onChange={e => setDateRetro(e.target.value)} className={inputCls} />
                <div className={`px-4 py-2 rounded-lg ${dm ? 'bg-emerald-900/40 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <p className={`text-[10px] uppercase tracking-wider ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>Valeur applicable</p>
                  <p className={`text-base font-black font-mono ${dm ? 'text-emerald-100' : 'text-emerald-900'}`}>
                    {valeurRetro ? constanteSelectionnee?.formatValeur(valeurRetro.valeur) : '—'}
                  </p>
                </div>
              </div>
              {valeurRetro && (
                <p className={`text-[11px] mt-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Application depuis le <strong>{valeurRetro.dateApplication}</strong>
                  {valeurRetro.source && <> · <em>{valeurRetro.source}</em></>}
                  {valeurRetro.justification && <> — {valeurRetro.justification}</>}
                </p>
              )}
            </div>
          </div>

          {/* Tableau historique */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={dm ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}>
                  <th className="text-left p-2">Date application</th>
                  <th className="text-right p-2">Valeur</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Justification</th>
                  <th className="text-left p-2">Saisi le</th>
                  <th className="text-center p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {entriesSelectionnees.map((e, i) => (
                  <tr key={(e.ts || '') + i} className={i % 2 === 0 ? (dm ? 'bg-zinc-900/30' : 'bg-white') : (dm ? 'bg-zinc-800/40' : 'bg-slate-50/70')}>
                    <td className={`p-2 font-mono ${dm ? 'text-zinc-200' : 'text-slate-700'}`}>{e.dateApplication}</td>
                    <td className={`p-2 text-right font-mono font-bold ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>
                      {constanteSelectionnee?.formatValeur(e.valeur)}
                    </td>
                    <td className={`p-2 ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{e.source || '—'}</td>
                    <td className={`p-2 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{e.justification || '—'}</td>
                    <td className={`p-2 text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {e.ts ? new Date(e.ts).toLocaleDateString('fr-FR') : '(défaut)'}
                    </td>
                    <td className="p-2 text-center">
                      {e.ts && !dafLocked && (
                        <button onClick={() => supprimerEntree(selectedKey, e.ts)}
                          className={`p-1 rounded hover:bg-rose-500/20 ${dm ? 'text-rose-400' : 'text-rose-600'}`}
                          title="Supprimer cette entrée">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulaire ajout */}
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} disabled={dafLocked}
              className={`mt-4 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold ${dafLocked ? 'opacity-60 cursor-not-allowed' : ''} ${dm ? 'bg-fuchsia-900/40 text-fuchsia-300 hover:bg-fuchsia-900/60' : 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100'}`}>
              <Plus size={14} /> Ajouter une nouvelle valeur historique
            </button>
          ) : (
            <div className={`mt-4 rounded-2xl p-4 ${dm ? 'bg-zinc-800/60 border border-zinc-700' : 'bg-slate-50 border border-slate-200'}`}>
              <h3 className={`text-sm font-black mb-3 ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
                Nouvelle valeur — {constanteSelectionnee?.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs">
                  <span className={dm ? 'text-zinc-300' : 'text-slate-600'}>Date application</span>
                  <input type="date" value={draft.dateApplication}
                    onChange={e => setDraft({ ...draft, dateApplication: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs">
                  <span className={dm ? 'text-zinc-300' : 'text-slate-600'}>Valeur ({constanteSelectionnee?.unite})</span>
                  <input type="text" placeholder={`ex : ${constanteSelectionnee?.formatValeur(constanteSelectionnee?.valeurCourante)}`}
                    value={draft.valeur} onChange={e => setDraft({ ...draft, valeur: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs">
                  <span className={dm ? 'text-zinc-300' : 'text-slate-600'}>Source légale</span>
                  <input type="text" placeholder="ex : Décret 2027-XX, CCN 66 art. Y"
                    value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value })} className={inputCls} />
                </label>
                <label className="text-xs">
                  <span className={dm ? 'text-zinc-300' : 'text-slate-600'}>Justification</span>
                  <input type="text" placeholder="motif de la modification"
                    value={draft.justification} onChange={e => setDraft({ ...draft, justification: e.target.value })} className={inputCls} />
                </label>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={submit} disabled={!draft.valeur || !draft.dateApplication}
                  className={`px-4 py-2 rounded-lg text-xs font-bold ${(!draft.valeur || !draft.dateApplication) ? 'opacity-60 cursor-not-allowed' : ''} ${dm ? 'bg-fuchsia-700 text-white hover:bg-fuchsia-600' : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'}`}>
                  Enregistrer
                </button>
                <button onClick={() => { setShowAdd(false); setDraft({ valeur: '', dateApplication: today(), source: '', justification: '' }); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold ${dm ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          <p className={`mt-3 text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Les entrées par défaut (issues du code source) ne sont pas supprimables. Seules les entrées custom
            peuvent l'être par la DAF. Toute modification est tracée dans le journal d'audit signé (chaîne SHA-256).
          </p>
        </>
      )}
    </div>
  );
}
