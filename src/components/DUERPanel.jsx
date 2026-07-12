import React, { useMemo, useState } from 'react';
import {
  ShieldAlert, Download, Plus, Trash2, AlertTriangle, AlertCircle, ChevronDown, ChevronRight,
  Calendar, Info, ListChecks,
} from 'lucide-react';
import {
  calculerDUER,
  recommendationDUER,
  newRisque,
  newPlanAction,
  niveauToVariant,
  CATEGORIES_RISQUES,
  STATUTS_PLAN,
  libelleNiveau,
  libelleStatutPlan,
  libelleCategorie,
} from '../utils/duer';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import Pill from './ui/Pill';
import HoverTip from './ui/HoverTip';
import Term from './ui/Term';
import { surface } from '../styles/tokens';

const fmtNum = (n) => Math.round(n || 0).toLocaleString('fr-FR');
const fmtMontant = (n) => fmtNum(n) + ' €';

/**
 * <DUERPanel /> — Document Unique d'Évaluation des Risques (Axe 8).
 *
 * Obligation légale Code travail art. R.4121-1 (mise à jour annuelle) et
 * L.4121-3 (évaluation par UT). Sanction pénale en cas d'absence + faute
 * inexcusable engagée en cas d'AT/MP grave.
 */
export default function DUERPanel({
  darkMode = false,
  services = [],
  poleSupport = null,
  direction = null,
  globalParams = {},
  setGlobalParams,
}) {
  const dm = darkMode;
  const [expandedRisqueId, setExpandedRisqueId] = useState(null);

  const rapport = useMemo(
    () => calculerDUER({ services, poleSupport, direction, globalParams }),
    [services, poleSupport, direction, globalParams]
  );

  // ─── Setters DUER ────────────────────────────────────────────────
  const updateDuer = (mutator) => {
    if (!setGlobalParams) return;
    const current = globalParams.duer || { dateMAJ: null, exercice: new Date().getFullYear(), risques: [] };
    const updated = mutator(current);
    setGlobalParams({ ...globalParams, duer: updated });
  };

  const setDateMAJ = (val) => updateDuer(d => ({ ...d, dateMAJ: val || null }));

  const ajouterRisque = () => {
    const unite = rapport.unitesProjet[0] || { id: 'siege', nom: 'Siège' };
    updateDuer(d => ({ ...d, risques: [...(d.risques || []), newRisque(unite.id, unite.nom)] }));
  };

  const supprimerRisque = (id) => {
    updateDuer(d => ({ ...d, risques: (d.risques || []).filter(r => r.id !== id) }));
  };

  const updateRisque = (id, champ, valeur) => {
    updateDuer(d => ({
      ...d,
      risques: (d.risques || []).map(r => {
        if (r.id !== id) return r;
        const next = { ...r, [champ]: valeur };
        // Si on change l'unité, remettre à jour le libellé display
        if (champ === 'uniteId') {
          const unite = rapport.unitesProjet.find(u => u.id === valeur);
          next.uniteNom = unite ? unite.nom : valeur;
        }
        if (champ === 'probabilite' || champ === 'gravite') {
          next[champ] = Math.max(0, Math.min(5, parseInt(valeur, 10) || 0));
        }
        return next;
      }),
    }));
  };

  const ajouterPlan = (risqueId) => {
    updateDuer(d => ({
      ...d,
      risques: (d.risques || []).map(r =>
        r.id === risqueId ? { ...r, plansAction: [...(r.plansAction || []), newPlanAction()] } : r
      ),
    }));
  };

  const supprimerPlan = (risqueId, planId) => {
    updateDuer(d => ({
      ...d,
      risques: (d.risques || []).map(r =>
        r.id === risqueId ? { ...r, plansAction: (r.plansAction || []).filter(p => p.id !== planId) } : r
      ),
    }));
  };

  const updatePlan = (risqueId, planId, champ, valeur) => {
    updateDuer(d => ({
      ...d,
      risques: (d.risques || []).map(r => {
        if (r.id !== risqueId) return r;
        return {
          ...r,
          plansAction: (r.plansAction || []).map(p => {
            if (p.id !== planId) return p;
            const next = { ...p, [champ]: valeur };
            if (champ === 'cout') next.cout = parseFloat(valeur) || 0;
            return next;
          }),
        };
      }),
    }));
  };

  // ─── Styles inputs ───────────────────────────────────────────────
  const inputBase = `px-2 py-1 rounded border text-xs ${
    dm ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-indigo-500'
       : 'bg-white border-slate-300 text-slate-700 focus:border-indigo-500'
  } focus:outline-none`;

  // ─── Export CSV ──────────────────────────────────────────────────
  const exportCSV = () => {
    const lignes = [
      ['DUER — Document Unique d\'Évaluation des Risques professionnels'],
      [`Exercice ${rapport.exercice} · Dernière MAJ : ${rapport.dateMAJ || '(jamais)'} · Couverture : ${rapport.couverture} %`],
      [`Risques : ${rapport.totalRisques} · Critiques : ${rapport.nbCritiques} · Élevés : ${rapport.nbEleves} · Plans en retard : ${rapport.plansAction.nbEnRetard}`],
      [],
      ['DÉTAIL DES RISQUES'],
      ['Unité de travail', 'Catégorie', 'Risque', 'Source du danger', 'Probabilité (1-5)', 'Gravité (1-5)', 'Score (P×G)', 'Niveau', 'Mesures de maîtrise', 'Plans (nb)', 'Plans en retard', 'Coût plans (€)'],
      ...rapport.risques.map(r => [
        r.uniteNom, libelleCategorie(r.categorie), r.libelle, r.sourceDanger,
        r.probabilite, r.gravite, r.score, libelleNiveau(r.niveau),
        r.maitrise, r.nbPlans, r.nbPlansEnRetard, r.coutTotalPlans,
      ]),
      [],
      ['PLANS D\'ACTION'],
      ['Risque', 'Unité', 'Mesure', 'Responsable', 'Échéance', 'Statut', 'Coût (€)'],
      ...rapport.plansAction.tous.map(p => [
        p.risqueLibelle, p.uniteNom, p.mesure, p.responsable, p.echeance,
        libelleStatutPlan(p.statut), p.cout,
      ]),
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `DUER_${rapport.exercice}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DataPanel
      darkMode={dm}
      icon={ShieldAlert}
      title="DUER — Évaluation des Risques Professionnels"
      subtitle={
        <>
          Obligation légale annuelle <Term id="duer" /> (Code travail art. R.4121-1) — méthode INRS par unité de travail, matrice probabilité × gravité.
        </>
      }
      level={rapport.niveauGlobal}
      help="Mise à jour annuelle obligatoire (R.4121-2) ou à chaque modification importante des conditions de travail / accident du travail. Sanction : amende 5e classe (1 500 € par UT) + faute inexcusable engagée en cas d'AT/MP grave (L.452-1 CSS). Méthode : inventaire des situations dangereuses par UT, cotation P×G, plan d'action."
      collapsible
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={ajouterRisque}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
            title="Ajouter un risque"
          >
            <Plus size={12} strokeWidth={1.5} /> Risque
          </button>
          <button
            onClick={exportCSV}
            disabled={rapport.totalRisques === 0}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
              rapport.totalRisques === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-300 text-slate-600'
                : (dm ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
            }`}
            title="Exporter le DUER en CSV"
          >
            <Download size={12} strokeWidth={1.5} /> Export CSV
          </button>
        </div>
      }
      summary={
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Risques recensés"
              value={fmtNum(rapport.totalRisques)}
              hint={`${rapport.nbCritiques} critique${rapport.nbCritiques > 1 ? 's' : ''} · ${rapport.nbEleves} élevé${rapport.nbEleves > 1 ? 's' : ''}`}
              level={rapport.nbCritiques > 0 ? 'danger' : rapport.nbEleves > 0 ? 'warning' : 'success'}
            />
            <PanelStat
              darkMode={dm}
              label="Couverture des unités"
              value={`${rapport.couverture} %`}
              hint={`${rapport.unitesEvaluees.length}/${rapport.unitesProjet.length} unités évaluées`}
              level={rapport.couverture === 100 ? 'success' : rapport.couverture > 60 ? 'warning' : 'danger'}
            />
            <PanelStat
              darkMode={dm}
              label="Plans d'action"
              value={`${rapport.plansAction.parStatut.fait}/${rapport.plansAction.tous.length}`}
              hint={
                rapport.plansAction.nbEnRetard > 0
                  ? `${rapport.plansAction.nbEnRetard} en retard ✕`
                  : `Coût total ${fmtMontant(rapport.plansAction.coutTotal)}`
              }
              level={rapport.plansAction.nbEnRetard > 0 ? 'danger' : 'neutral'}
            />
          </div>

          {/* Date MAJ */}
          <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 ${surface.muted(dm)}`}>
            <Calendar size={14} strokeWidth={1.5} className={dm ? 'text-zinc-300' : 'text-slate-700'} />
            <label className={`text-xs font-bold uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
              Dernière mise à jour
            </label>
            <input
              type="date"
              value={rapport.dateMAJ || ''}
              onChange={e => setDateMAJ(e.target.value)}
              className={`${inputBase} flex-shrink-0`}
            />
            {rapport.ageMoisMAJ !== null && (
              <span className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                ({rapport.ageMoisMAJ} mois)
              </span>
            )}
            {rapport.mAJUrgente && (
              <Pill variant="danger" size="xs" darkMode={dm}>MAJ urgente</Pill>
            )}
            {!rapport.mAJUrgente && rapport.mAJObsolete && (
              <Pill variant="warning" size="xs" darkMode={dm}>Au-delà du délai annuel</Pill>
            )}
          </div>

          {/* Bandeau alertes */}
          {rapport.alertes.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 border-l-4 ${
              rapport.alertes.some(a => a.niveau === 'danger')
                ? (dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500')
                : (dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500')
            }`}>
              <div className="flex items-start gap-2">
                {rapport.alertes.some(a => a.niveau === 'danger')
                  ? <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
                  : <AlertCircle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
                }
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-1 ${
                    rapport.alertes.some(a => a.niveau === 'danger')
                      ? (dm ? 'text-rose-200' : 'text-rose-800')
                      : (dm ? 'text-amber-200' : 'text-amber-800')
                  }`}>
                    {recommendationDUER(rapport)}
                  </p>
                  <ul className="space-y-0.5 mt-2">
                    {rapport.alertes.map((a, i) => (
                      <li key={i} className={`text-xs flex items-start gap-1.5 ${
                        a.niveau === 'danger'
                          ? (dm ? 'text-rose-300' : 'text-rose-700')
                          : (dm ? 'text-amber-300' : 'text-amber-700')
                      }`}>
                        <span className="font-bold">{a.niveau === 'danger' ? '✕' : '⚠'}</span>
                        <span>{a.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      }
    >
      {/* ─── Tableau des risques ────────────────────────────────── */}
      {rapport.totalRisques === 0 ? (
        <div className={`rounded-xl p-6 text-center ${surface.muted(dm)}`}>
          <ShieldAlert size={28} strokeWidth={1.5} className={`mx-auto mb-2 ${dm ? 'text-zinc-500' : 'text-slate-400'}`} />
          <p className={`text-sm ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            Aucun risque évalué. Cliquez sur <strong>+ Risque</strong> pour démarrer l'inventaire par unité de travail.
          </p>
        </div>
      ) : (
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm}>Unité</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Catégorie</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Risque</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">P</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">G</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">P×G</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Niveau</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Plans</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Actions</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {rapport.risques.map(r => {
              const isOpen = expandedRisqueId === r.id;
              return (
                <React.Fragment key={r.id}>
                  <DataTable.Row>
                    <DataTable.Cell darkMode={dm}>
                      <select
                        className={`${inputBase} w-full max-w-[140px]`}
                        value={r.uniteId}
                        onChange={e => updateRisque(r.id, 'uniteId', e.target.value)}
                      >
                        {rapport.unitesProjet.map(u => (
                          <option key={u.id} value={u.id}>{u.nom}</option>
                        ))}
                        {!rapport.unitesProjet.find(u => u.id === r.uniteId) && (
                          <option value={r.uniteId}>{r.uniteNom}</option>
                        )}
                      </select>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      <select
                        className={`${inputBase} w-full max-w-[160px]`}
                        value={r.categorie}
                        onChange={e => updateRisque(r.id, 'categorie', e.target.value)}
                      >
                        {CATEGORIES_RISQUES.map(c => (
                          <option key={c.code} value={c.code}>{c.libelle.split('(')[0].trim()}</option>
                        ))}
                      </select>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      <input
                        className={`${inputBase} w-full`}
                        value={r.libelle}
                        onChange={e => updateRisque(r.id, 'libelle', e.target.value)}
                        placeholder="Ex. Chute de plain-pied"
                      />
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <input
                        type="number" min="1" max="5"
                        className={`${inputBase} w-12 text-center tabular-nums`}
                        value={r.probabilite}
                        onChange={e => updateRisque(r.id, 'probabilite', e.target.value)}
                      />
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <input
                        type="number" min="1" max="5"
                        className={`${inputBase} w-12 text-center tabular-nums`}
                        value={r.gravite}
                        onChange={e => updateRisque(r.id, 'gravite', e.target.value)}
                      />
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center" mono bold>
                      {r.score}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <Pill variant={niveauToVariant(r.niveau)} size="xs" darkMode={dm}>
                        {libelleNiveau(r.niveau)}
                      </Pill>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <button
                        onClick={() => setExpandedRisqueId(isOpen ? null : r.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 mx-auto ${
                          r.alertePlanCritique
                            ? (dm ? 'bg-rose-900/40 text-rose-300' : 'bg-rose-100 text-rose-700')
                            : (dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                        }`}
                        title={r.alertePlanCritique ? 'Risque prioritaire sans plan d\'action' : 'Voir plans d\'action'}
                      >
                        {isOpen
                          ? <ChevronDown size={10} strokeWidth={1.5} />
                          : <ChevronRight size={10} strokeWidth={1.5} />}
                        {r.nbPlans}
                        {r.nbPlansEnRetard > 0 && <span className="text-rose-500">({r.nbPlansEnRetard}!)</span>}
                      </button>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip title="Supprimer le risque" description="Suppression définitive du risque et de ses plans d'action." level="danger" darkMode={dm}>
                        <button
                          onClick={() => supprimerRisque(r.id)}
                          className={`p-1 rounded ${dm ? 'hover:bg-rose-900/40 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
                        >
                          <Trash2 size={12} strokeWidth={1.5} />
                        </button>
                      </HoverTip>
                    </DataTable.Cell>
                  </DataTable.Row>

                  {isOpen && (
                    <DataTable.Row>
                      <DataTable.Cell darkMode={dm} colSpan={9}>
                        <div className={`rounded-xl p-3 ${surface.muted(dm)}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                                Source du danger
                              </label>
                              <input
                                className={`${inputBase} w-full`}
                                value={r.sourceDanger}
                                onChange={e => updateRisque(r.id, 'sourceDanger', e.target.value)}
                                placeholder="Ex. Sols glissants en hiver"
                              />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                                Mesures de maîtrise existantes
                              </label>
                              <input
                                className={`${inputBase} w-full`}
                                value={r.maitrise}
                                onChange={e => updateRisque(r.id, 'maitrise', e.target.value)}
                                placeholder="Ex. Tapis antidérapants entrée"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <h5 className={`text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                              <ListChecks size={12} strokeWidth={1.5} />
                              Plans d'action de prévention
                            </h5>
                            <button
                              onClick={() => ajouterPlan(r.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${dm ? 'bg-indigo-700 text-white hover:bg-indigo-600' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                            >
                              <Plus size={10} strokeWidth={1.5} /> Plan
                            </button>
                          </div>

                          {r.plansAction.length === 0 ? (
                            <p className={`text-xs italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                              Aucun plan d'action. {(r.niveau === 'eleve' || r.niveau === 'critique') && (
                                <span className={dm ? 'text-rose-400' : 'text-rose-600'}>Risque prioritaire — plan obligatoire.</span>
                              )}
                            </p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className={`text-left ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                                  <th className="pb-1.5 font-semibold uppercase text-[10px]">Mesure</th>
                                  <th className="pb-1.5 font-semibold uppercase text-[10px]">Responsable</th>
                                  <th className="pb-1.5 font-semibold uppercase text-[10px]">Échéance</th>
                                  <th className="pb-1.5 font-semibold uppercase text-[10px]">Statut</th>
                                  <th className="pb-1.5 font-semibold uppercase text-[10px] text-right">Coût</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody className={dm ? 'text-zinc-200' : 'text-slate-700'}>
                                {r.plansAction.map(p => {
                                  const enRetard = p.statut !== 'fait' && p.echeance && new Date(p.echeance + 'T00:00:00').getTime() < Date.now();
                                  return (
                                    <tr key={p.id} className={`border-t ${dm ? 'border-zinc-800' : 'border-slate-200'}`}>
                                      <td className="py-1.5 pr-2">
                                        <input className={`${inputBase} w-full`} value={p.mesure} onChange={e => updatePlan(r.id, p.id, 'mesure', e.target.value)} placeholder="Mesure de prévention" />
                                      </td>
                                      <td className="py-1.5 pr-2">
                                        <input className={`${inputBase} w-full max-w-[140px]`} value={p.responsable} onChange={e => updatePlan(r.id, p.id, 'responsable', e.target.value)} placeholder="DAF, RH…" />
                                      </td>
                                      <td className="py-1.5 pr-2">
                                        <input
                                          type="date"
                                          className={`${inputBase} ${enRetard ? (dm ? 'border-rose-500' : 'border-rose-400') : ''}`}
                                          value={p.echeance || ''}
                                          onChange={e => updatePlan(r.id, p.id, 'echeance', e.target.value)}
                                        />
                                      </td>
                                      <td className="py-1.5 pr-2">
                                        <select className={inputBase} value={p.statut} onChange={e => updatePlan(r.id, p.id, 'statut', e.target.value)}>
                                          {STATUTS_PLAN.map(s => <option key={s} value={s}>{libelleStatutPlan(s)}</option>)}
                                        </select>
                                      </td>
                                      <td className="py-1.5 pr-2 text-right">
                                        <input
                                          type="number" min="0" step="100"
                                          className={`${inputBase} w-20 text-right tabular-nums`}
                                          value={p.cout || 0}
                                          onChange={e => updatePlan(r.id, p.id, 'cout', e.target.value)}
                                        />
                                      </td>
                                      <td className="py-1.5">
                                        <button
                                          onClick={() => supprimerPlan(r.id, p.id)}
                                          className={`p-1 rounded ${dm ? 'hover:bg-rose-900/40 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
                                          title="Supprimer le plan"
                                        >
                                          <Trash2 size={11} strokeWidth={1.5} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </React.Fragment>
              );
            })}
          </DataTable.Body>
        </DataTable>
      )}

      <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        <span>
          Méthode INRS (Institut National de Recherche et de Sécurité). Cotation : Probabilité (1=rare → 5=très fréquent) ×
          Gravité (1=mineur → 5=mortel). Niveau : faible (1-5) · modéré (6-12) · élevé (13-19) · critique (20-25).
          Persistance via <code>globalParams.duer</code>. Référentiel CGI : Code travail R.4121-1 à R.4121-4.
        </span>
      </p>
    </DataPanel>
  );
}
