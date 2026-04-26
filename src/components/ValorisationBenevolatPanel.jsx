import React, { useMemo, useState } from 'react';
import { Heart, Plus, Trash2, Equal, Download } from 'lucide-react';
import {
  calculerSyntheseBenevolat, QUALIFICATIONS, CATEGORIES_COMPTABLES_LIST,
} from '../utils/valorisationBenevolat';
import DataPanel, { PanelStat, EmptyState } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import Button from './ui/Button';
import HoverTip from './ui/HoverTip';
import Term from './ui/Term';
import { surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';

/**
 * <ValorisationBenevolatPanel /> — Compta Classe 8 (CRC 2018-06).
 *
 * - Saisie CRUD bénévoles (nom, rôle, heures, qualification, catégorie comptable, taux custom)
 * - Calcul automatique de la valorisation par contribution
 * - Synthèse comptes 86/87 + équilibre comptable obligatoire
 * - Ventilation par compte 87 (871/872/875)
 * - Export CSV pour annexe AG
 */
export default function ValorisationBenevolatPanel({
  darkMode = false, benevoles = [], setBenevoles, appendAuditEntry,
}) {
  const dm = darkMode;
  const [editingId, setEditingId] = useState(null);

  const synth = useMemo(() => calculerSyntheseBenevolat(benevoles), [benevoles]);

  const ajouter = () => {
    if (!setBenevoles) return;
    const id = `ben_${Date.now()}`;
    const newBen = {
      id, nom: 'Nouveau bénévole', role: '', heures: 0,
      qualification: 'standard', categorie: 'benevolat', tauxHoraireCustom: null,
    };
    setBenevoles([...(benevoles || []), newBen]);
    setEditingId(id);
    appendAuditEntry?.('Ajout bénévole', 'Analyse', newBen.nom);
  };

  const supprimer = (id) => {
    if (!setBenevoles) return;
    if (!confirm('Supprimer ce bénévole ?')) return;
    setBenevoles((benevoles || []).filter(b => b.id !== id));
    appendAuditEntry?.('Suppression bénévole', 'Analyse', `id=${id}`);
  };

  const update = (id, field, value) => {
    if (!setBenevoles) return;
    setBenevoles((benevoles || []).map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const exportCSV = () => {
    const lignes = [
      ['Nom', 'Rôle', 'Catégorie', 'Compte', 'Heures', 'Qualification', 'Taux €/h', 'Valorisation €'],
      ...synth.contributions.map(c => {
        const cat = CATEGORIES_COMPTABLES_LIST.find(x => x.id === c.categorie);
        return [c.nom, c.role, cat?.libelle, cat?.compte, c.heures, c.qualification,
          c.tauxAppliqué.toFixed(2), c.valorisation.toFixed(2)];
      }),
      [],
      ['TOTAL HEURES', synth.totalHeures, '', '', '', '', '', synth.totalValorisation.toFixed(2)],
      ['Compte 86 (charges)', '', '', '', '', '', '', synth.compte86.toFixed(2)],
      ['Compte 87 (produits)', '', '', '', '', '', '', synth.compte87.toFixed(2)],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `benevolat_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputCls = `w-full px-2 py-1 rounded-md text-xs ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`;

  return (
    <DataPanel
      darkMode={dm}
      icon={Heart}
      title="Valorisation du bénévolat"
      subtitle="Contributions volontaires en nature — CRC 2018-06 — comptes 86/87"
      level="info"
      help="Selon le règl. ANC 2018-06, les associations valorisent leurs heures bénévoles en classe 8. Compte 86 (emplois) = Compte 87 (produits) — équilibre obligatoire (neutralité du résultat). Valorisation par défaut au SMIC chargé."
      collapsible
      actions={
        <>
          <Button variant="ghost" size="sm" leftIcon={Download} darkMode={dm} onClick={exportCSV}>
            CSV
          </Button>
          {setBenevoles && (
            <Button variant="primary" size="sm" leftIcon={Plus} darkMode={dm} onClick={ajouter}>
              Ajouter
            </Button>
          )}
        </>
      }
      summary={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PanelStat
            darkMode={dm}
            label="Heures bénévoles"
            value={Math.round(synth.totalHeures).toLocaleString('fr-FR')}
            unit="h"
            level="info"
            hint={`Taux horaire moyen appliqué : ${synth.tauxMoyen.toFixed(2)} €/h`}
          />
          <PanelStat
            darkMode={dm}
            label="Valorisation totale"
            value={fmt(synth.totalValorisation)}
            level="success"
            hint={`Compte 86 = Compte 87 = ${fmt(synth.totalValorisation)} (équilibre comptable obligatoire CRC 2018-06)`}
          />
          <PanelStat
            darkMode={dm}
            label="Taux horaire base"
            value={synth.tauxHoraireBase.toFixed(2)}
            unit="€/h"
            hint="SMIC horaire × (1 + charges patronales). Coefficient 1× standard, 2× professionnel, 3× expert."
          />
        </div>
      }
    >
      {(!benevoles || benevoles.length === 0) ? (
        <EmptyState
          darkMode={dm}
          icon={Heart}
          title="Aucun bénévole valorisé"
          description="Ajoutez vos contributeurs volontaires pour les inscrire en compte 87 (produits) et 86 (emplois) selon le règlement CRC 2018-06."
          action={setBenevoles && (
            <Button variant="primary" size="md" leftIcon={Plus} darkMode={dm} onClick={ajouter}>
              Ajouter le premier bénévole
            </Button>
          )}
        />
      ) : (
        <>
          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm}>Nom</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Rôle</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Catégorie</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Heures</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Qualification</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Taux €/h</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Valorisation</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center" />
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {synth.contributions.map((c) => {
                const isEditing = editingId === c.id;
                const ben = benevoles.find(b => b.id === c.id);
                const cat = CATEGORIES_COMPTABLES_LIST.find(x => x.id === c.categorie);
                return (
                  <DataTable.Row key={c.id}>
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <input className={inputCls} value={ben?.nom || ''} onChange={e => update(c.id, 'nom', e.target.value)} />
                      ) : (
                        <button onClick={() => setEditingId(c.id)} className={`text-left hover:underline ${dm ? 'text-zinc-200' : 'text-slate-800'} font-semibold`}>
                          {c.nom}
                        </button>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <input className={inputCls} value={ben?.role || ''} onChange={e => update(c.id, 'role', e.target.value)} placeholder="ex : Président" />
                      ) : <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>{c.role || '—'}</span>}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <select className={inputCls} value={ben?.categorie || 'benevolat'} onChange={e => update(c.id, 'categorie', e.target.value)}>
                          {CATEGORIES_COMPTABLES_LIST.map(o => <option key={o.id} value={o.id}>{o.libelle} ({o.compte})</option>)}
                        </select>
                      ) : (
                        <HoverTip darkMode={dm} content={`Compte ${cat?.compte} — ${cat?.libelle}`}>
                          <span className={`text-xs px-2 py-0.5 rounded ${dm ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            {cat?.compte || '—'}
                          </span>
                        </HoverTip>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {isEditing ? (
                        <input type="number" min="0" className={`${inputCls} text-right w-20`}
                          value={ben?.heures || 0} onChange={e => update(c.id, 'heures', parseFloat(e.target.value) || 0)} />
                      ) : c.heures}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <select className={inputCls} value={ben?.qualification || 'standard'} onChange={e => update(c.id, 'qualification', e.target.value)}>
                          {QUALIFICATIONS.map(q => <option key={q.id} value={q.id}>{q.label} (×{q.coef})</option>)}
                        </select>
                      ) : (
                        <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>
                          {QUALIFICATIONS.find(q => q.id === c.qualification)?.label || 'Standard'}
                        </span>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{c.tauxAppliqué.toFixed(2)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={dm ? 'text-emerald-300' : 'text-emerald-700'}>
                      {fmt(c.valorisation)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      {setBenevoles && (
                        <button onClick={() => supprimer(c.id)}
                          className={`p-1 rounded hover:bg-rose-500/20 ${dm ? 'text-rose-400' : 'text-rose-500'}`}
                          aria-label="Supprimer">
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      )}
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable.Body>
            <DataTable.Foot darkMode={dm}>
              <DataTable.Row highlight>
                <DataTable.Cell darkMode={dm} bold colSpan={3}>TOTAL</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{Math.round(synth.totalHeures)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} colSpan={2} />
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(synth.totalValorisation)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          {/* Ventilation comptable + équilibre */}
          <div className={`mt-6 ${surface.muted(dm)} rounded-xl p-4`}>
            <h4 className={`text-sm font-bold mb-3 ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
              Ventilation comptable
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {CATEGORIES_COMPTABLES_LIST.map(cat => {
                const data = synth.parCategorie[cat.id];
                return (
                  <div key={cat.id} className={`rounded-lg p-3 border ${dm ? 'bg-zinc-900/40 border-zinc-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {cat.libelle}
                      </span>
                      <span className={`text-[10px] font-mono ${dm ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        {cat.compte}
                      </span>
                    </div>
                    <p className={`text-base font-bold tabular-nums ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {fmt(data.total)}
                    </p>
                    <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {data.count} contribution{data.count > 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Équilibre 86 = 87 */}
            <div className={`flex items-center justify-center gap-3 py-3 rounded-lg ${dm ? 'bg-emerald-950/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className="text-center">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>Compte 86 (Charges)</div>
                <div className={`text-xl font-bold tabular-nums ${dm ? 'text-emerald-200' : 'text-emerald-800'}`}>{fmt(synth.compte86)}</div>
              </div>
              <Equal size={20} strokeWidth={1.5} className={dm ? 'text-emerald-400' : 'text-emerald-600'} />
              <div className="text-center">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>Compte 87 (Produits)</div>
                <div className={`text-xl font-bold tabular-nums ${dm ? 'text-emerald-200' : 'text-emerald-800'}`}>{fmt(synth.compte87)}</div>
              </div>
            </div>
            <p className={`mt-2 text-[10px] italic text-center ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
              Équilibre comptable obligatoire (CRC 2018-06) : neutralité sur le résultat de l'exercice.
              Apparaît au pied du compte de résultat (annexe) pour <Term darkMode={dm}>AG</Term> ou Conseil d'Administration.
            </p>
          </div>

          {editingId && (
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" darkMode={dm} onClick={() => setEditingId(null)}>
                Terminer l'édition
              </Button>
            </div>
          )}
        </>
      )}
    </DataPanel>
  );
}
