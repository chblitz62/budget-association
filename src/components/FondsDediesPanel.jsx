import React, { useMemo, useState } from 'react';
import {
  PiggyBank, Plus, Trash2, AlertTriangle, AlertCircle, CheckCircle2, Download, Equal, Wallet,
} from 'lucide-react';
import {
  calculerSyntheseFondsDedies, CATEGORIES_FONDS_DEDIES, recommendationFonds,
} from '../utils/fondsDedies';
import DataPanel, { PanelStat, EmptyState } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import Button from './ui/Button';
import HoverTip from './ui/HoverTip';
import { surface, status as statusToken, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const pct = (n) => `${Math.round((n || 0) * 100)} %`;

/**
 * <FondsDediesPanel /> — CRC 2018-06 reports de subventions non consommées.
 *
 * - Saisie CRUD fonds (nom, financeur, projet, montants, échéance)
 * - Statut auto : actif / échu / soldé + alerte échéance proche
 * - Visualisation équilibre 689 (charges) ↔ 19 (passif) ↔ 78 (produits N+1)
 * - Recommandations contextuelles par fonds
 * - Export CSV pour annexe
 */
export default function FondsDediesPanel({
  darkMode = false, fondsDedies = [], setFondsDedies, appendAuditEntry,
}) {
  const dm = darkMode;
  const [editingId, setEditingId] = useState(null);

  const synth = useMemo(() => calculerSyntheseFondsDedies(fondsDedies), [fondsDedies]);

  const ajouter = () => {
    if (!setFondsDedies) return;
    const id = `fd_${Date.now()}`;
    const newFonds = {
      id, nom: 'Nouveau fonds', financeur: '', projet: '',
      montantInitial: 0, reportAnneePrecedente: 0, consommeAnneeCourante: 0,
      dateReception: '', dateEcheance: '',
      categorie: 'subvention_fonctionnement',
    };
    setFondsDedies([...(fondsDedies || []), newFonds]);
    setEditingId(id);
    appendAuditEntry?.('Création fonds dédié', 'Analyse', newFonds.nom);
  };

  const supprimer = (id) => {
    if (!setFondsDedies) return;
    if (!confirm('Supprimer ce fonds dédié ?')) return;
    setFondsDedies((fondsDedies || []).filter(f => f.id !== id));
    appendAuditEntry?.('Suppression fonds dédié', 'Analyse', `id=${id}`);
  };

  const update = (id, field, value) => {
    if (!setFondsDedies) return;
    setFondsDedies((fondsDedies || []).map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const exportCSV = () => {
    const lignes = [
      ['Nom', 'Financeur', 'Projet', 'Catégorie', 'Compte', 'Montant initial', 'Report N-1',
        'Consommé N', 'Solde', 'Statut', 'Échéance', 'Taux conso'],
      ...synth.fonds.map(f => {
        const cat = CATEGORIES_FONDS_DEDIES.find(c => c.id === f.categorie);
        return [
          f.nom, f.financeur, f.projet, cat?.libelle, cat?.compte,
          f.montantInitial.toFixed(2), f.reportAnneePrecedente.toFixed(2),
          f.consommeAnneeCourante.toFixed(2), f.solde.toFixed(2),
          f.statut, f.dateEcheance, pct(f.tauxConsommation),
        ];
      }),
      [],
      ['Compte 689 (charges) — solde transféré N+1', '', '', '', '', '', '', '', synth.compte689.toFixed(2)],
      ['Compte 78 (produits) — reports N-1 réintégrés', '', '', '', '', '', '', '', synth.compte78.toFixed(2)],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fonds_dedies_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputCls = `w-full px-2 py-1 rounded-md text-xs ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`;

  const niveauGlobal = synth.alertes.length > 0 ? 'warning' : 'success';

  const statutMeta = (statut) => ({
    actif: { label: 'Actif',    icon: CheckCircle2, level: 'info'    },
    echu:  { label: 'Échu',     icon: AlertTriangle, level: 'danger'  },
    solde: { label: 'Soldé',    icon: CheckCircle2, level: 'success' },
  }[statut] || { label: '?', icon: AlertCircle, level: 'neutral' });

  return (
    <DataPanel
      darkMode={dm}
      icon={PiggyBank}
      title="Fonds dédiés"
      subtitle="Reports de ressources affectées non consommées — CRC 2018-06 — comptes 19 / 689 / 78"
      level={niveauGlobal}
      help="Selon le CRC 2018-06, les ressources affectées non utilisées dans l'exercice doivent être inscrites au passif (compte 19). Le solde transféré transite par le 689 (charges) et sera repris en 78 (produits) lors de la consommation N+1."
      collapsible
      actions={
        <>
          <Button variant="ghost" size="sm" leftIcon={Download} darkMode={dm} onClick={exportCSV}>
            CSV
          </Button>
          {setFondsDedies && (
            <Button variant="primary" size="sm" leftIcon={Plus} darkMode={dm} onClick={ajouter}>
              Ajouter
            </Button>
          )}
        </>
      }
      summary={
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Ressources totales"
              value={fmt(synth.totalRessources)}
              hint="Subventions et legs reçus + reports N-1"
            />
            <PanelStat
              darkMode={dm}
              label="Consommé exercice"
              value={fmt(synth.totalConsomme)}
              hint={`Taux global : ${synth.totalRessources > 0 ? Math.round((synth.totalConsomme / synth.totalRessources) * 100) : 0} %`}
              level="info"
            />
            <PanelStat
              darkMode={dm}
              label="À reporter en N+1"
              value={fmt(synth.reportN1)}
              level={niveauGlobal}
              hint="Solde non consommé des fonds actifs — transit par compte 689 vers compte 19 (passif)"
            />
          </div>

          {synth.alertes.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
              <p className={`text-sm ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
                <strong>{synth.alertes.length} fonds</strong> en alerte —
                échéance proche ou dépassée. Vérifier les conditions d'utilisation auprès des financeurs
                pour éviter le remboursement.
              </p>
            </div>
          )}
        </>
      }
    >
      {(!fondsDedies || fondsDedies.length === 0) ? (
        <EmptyState
          darkMode={dm}
          icon={PiggyBank}
          title="Aucun fonds dédié enregistré"
          description="Saisissez les subventions affectées (Région, OPCO, mécénat) avec leur projet et leur date d'échéance pour suivre les reports CRC 2018-06."
          action={setFondsDedies && (
            <Button variant="primary" size="md" leftIcon={Plus} darkMode={dm} onClick={ajouter}>
              Créer le premier fonds
            </Button>
          )}
        />
      ) : (
        <>
          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm}>Nom / Financeur</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Compte</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Initial</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Report N-1</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Consommé</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Solde</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Conso.</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Échéance</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center" />
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {synth.fonds.map(f => {
                const isEditing = editingId === f.id;
                const raw = fondsDedies.find(x => x.id === f.id) || f;
                const cat = CATEGORIES_FONDS_DEDIES.find(c => c.id === f.categorie);
                const sm = statutMeta(f.statut);
                const tone = statusToken[sm.level](dm);
                const Icon = sm.icon;
                return (
                  <DataTable.Row key={f.id} level={sm.level === 'danger' ? 'danger' : null}>
                    {/* Nom + Financeur + Projet */}
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <div className="space-y-1">
                          <input className={inputCls} value={raw.nom || ''} onChange={e => update(f.id, 'nom', e.target.value)} placeholder="Nom" />
                          <input className={inputCls} value={raw.financeur || ''} onChange={e => update(f.id, 'financeur', e.target.value)} placeholder="Financeur" />
                          <input className={inputCls} value={raw.projet || ''} onChange={e => update(f.id, 'projet', e.target.value)} placeholder="Projet" />
                        </div>
                      ) : (
                        <button onClick={() => setEditingId(f.id)} className="text-left">
                          <div className={`font-semibold ${dm ? 'text-zinc-100' : 'text-slate-900'} hover:underline`}>{f.nom}</div>
                          {f.financeur && <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>{f.financeur}</div>}
                          {f.projet && <div className={`text-[10px] ${dm ? 'text-indigo-400' : 'text-indigo-600'}`}>📁 {f.projet}</div>}
                        </button>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <select className={inputCls} value={raw.categorie || 'subvention_fonctionnement'}
                          onChange={e => update(f.id, 'categorie', e.target.value)}>
                          {CATEGORIES_FONDS_DEDIES.map(c => (
                            <option key={c.id} value={c.id}>{c.libelle} ({c.compte})</option>
                          ))}
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
                        <input type="number" min="0" className={`${inputCls} text-right w-24`}
                          value={raw.montantInitial || 0} onChange={e => update(f.id, 'montantInitial', parseFloat(e.target.value) || 0)} />
                      ) : fmt(f.montantInitial)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {isEditing ? (
                        <input type="number" min="0" className={`${inputCls} text-right w-24`}
                          value={raw.reportAnneePrecedente || 0} onChange={e => update(f.id, 'reportAnneePrecedente', parseFloat(e.target.value) || 0)} />
                      ) : fmt(f.reportAnneePrecedente)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {isEditing ? (
                        <input type="number" min="0" className={`${inputCls} text-right w-24`}
                          value={raw.consommeAnneeCourante || 0} onChange={e => update(f.id, 'consommeAnneeCourante', parseFloat(e.target.value) || 0)} />
                      ) : fmt(f.consommeAnneeCourante)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={f.solde > 0 ? (dm ? 'text-amber-300' : 'text-amber-700') : (dm ? 'text-emerald-300' : 'text-emerald-700')}>
                      {fmt(f.solde)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <ProgressMini taux={f.tauxConsommation} dm={dm} />
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      {isEditing ? (
                        <input type="date" className={inputCls} value={raw.dateEcheance || ''} onChange={e => update(f.id, 'dateEcheance', e.target.value)} />
                      ) : (
                        <span className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {f.dateEcheance || '—'}
                          {f.alerte && f.joursAvantEcheance != null && (
                            <span className={`ml-1 text-[10px] font-bold ${dm ? 'text-amber-400' : 'text-amber-600'}`}>
                              ({f.joursAvantEcheance}j)
                            </span>
                          )}
                        </span>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        darkMode={dm}
                        title={`${sm.label}`}
                        description={recommendationFonds(f)}
                        level={sm.level === 'danger' ? 'danger' : sm.level === 'success' ? 'success' : 'info'}
                      >
                        <span className={`inline-flex items-center justify-center p-1 rounded-full ${tone.bg}`}>
                          <Icon size={13} strokeWidth={1.5} className={tone.accent} />
                        </span>
                      </HoverTip>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      {setFondsDedies && (
                        <button onClick={() => supprimer(f.id)}
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
                <DataTable.Cell darkMode={dm} bold colSpan={2}>TOTAL</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>
                  {fmt(synth.fonds.reduce((s, f) => s + f.montantInitial, 0))}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>
                  {fmt(synth.compte78)}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(synth.totalConsomme)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(synth.totalSolde)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} colSpan={4} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          {/* Schéma comptable 689 → 19 → 78 */}
          <div className={`mt-6 ${surface.muted(dm)} rounded-xl p-4`}>
            <h4 className={`text-sm font-bold mb-3 ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
              Schéma comptable de clôture (CRC 2018-06)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className={`rounded-lg p-3 border ${dm ? 'bg-zinc-900/40 border-zinc-700' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-rose-300' : 'text-rose-600'}`}>Compte 689 — Charges</div>
                <p className={`text-base font-bold tabular-nums ${dm ? 'text-rose-300' : 'text-rose-700'}`}>{fmt(synth.compte689)}</p>
                <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>Engagements à réaliser sur ressources affectées (sortie résultat)</p>
              </div>
              <div className={`rounded-lg p-3 border-2 ${dm ? 'bg-violet-950/40 border-violet-700' : 'bg-violet-50 border-violet-300'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-violet-300' : 'text-violet-700'}`}>Compte 19 — Passif Bilan</div>
                <p className={`text-base font-bold tabular-nums ${dm ? 'text-violet-200' : 'text-violet-800'}`}>{fmt(synth.reportN1)}</p>
                <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>Fonds dédiés au passif (ventilés 194/195/197)</p>
              </div>
              <div className={`rounded-lg p-3 border ${dm ? 'bg-zinc-900/40 border-zinc-700' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-emerald-300' : 'text-emerald-600'}`}>Compte 78 — Produits N+1</div>
                <p className={`text-base font-bold tabular-nums ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>{fmt(synth.compte78)}</p>
                <p className={`text-[10px] mt-1 ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>Reports N-1 réintégrés sur l'exercice courant</p>
              </div>
            </div>

            {/* Ventilation par compte 19X */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {CATEGORIES_FONDS_DEDIES.map(cat => {
                const data = synth.parCategorie[cat.id];
                if (data.total === 0) return null;
                return (
                  <div key={cat.id} className={`flex items-center justify-between px-3 py-2 rounded ${dm ? 'bg-zinc-800/40' : 'bg-white'}`}>
                    <span className={`font-mono ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{cat.compte}</span>
                    <span className={`flex-1 ml-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>{cat.libelle}</span>
                    <span className={`tabular-nums font-bold ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>{fmt(data.total)}</span>
                  </div>
                );
              })}
            </div>
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

// ── Sous-composant : mini barre de progression consommation ──────────
const ProgressMini = ({ taux, dm }) => {
  const widthPct = Math.min(taux * 100, 100);
  const color = taux >= 0.95 ? 'bg-emerald-500'
    : taux >= 0.5 ? 'bg-indigo-500'
    : taux >= 0.2 ? 'bg-amber-500'
    : 'bg-slate-400';
  return (
    <div className="flex items-center gap-1.5 max-w-[80px] mx-auto">
      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${dm ? 'bg-zinc-800' : 'bg-slate-200'}`}>
        <div className={`h-full ${color} transition-all`} style={{ width: `${widthPct}%` }} />
      </div>
      <span className={`text-[10px] tabular-nums ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
        {Math.round(taux * 100)}%
      </span>
    </div>
  );
};
