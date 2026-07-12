import React, { useMemo } from 'react';
import {
  Users, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, TrendingDown,
} from 'lucide-react';
import {
  analyserPromos,
  recommendationPromo,
  SEUIL_ABANDON_WARNING_DEFAULT,
  SEUIL_ABANDON_DANGER_DEFAULT,
} from '../utils/suiviPromos';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmtPct = (n) => `${n.toFixed(1)} %`;
const fmtInt = (n) => Math.round(n || 0).toLocaleString('fr-FR');

/**
 * <SuiviPromosPanel /> — Suivi des Quotas & Rupture de Charge par promo (Axe 3).
 *
 * Décline le seuil de rentabilité par filière en suivi à la maille promo
 * individuelle. Identifie en amont les promos qui décrochent (rupture de
 * charge probable) avec un classement automatique critiques → alertes → saines.
 */
export default function SuiviPromosPanel({
  darkMode = false, services = [], globalParams, setGlobalParams,
}) {
  const dm = darkMode;

  const result = useMemo(
    () => analyserPromos(services, globalParams),
    [services, globalParams]
  );

  const { totaux, seuils } = result;
  const totalLevel = totaux.nbCritiques > 0 ? 'danger'
    : totaux.nbAlertes > 0 ? 'warning'
    : totaux.nbPromos > 0 ? 'success'
    : 'neutral';

  const exportCSV = () => {
    const lignes = [
      ['Suivi des Quotas par Promo'],
      [`Seuils — Warning : ${seuils.warning} % · Danger : ${seuils.danger} %`],
      [],
      ['Service', 'Site', 'Filière', 'Promo', 'Type',
        'Effectif initial', 'Abandons', 'Effectif actuel',
        'Taux abandon (%)', 'Taux rétention (%)', 'Niveau'],
      ...result.parPromo.map(p => [
        p.serviceNom, p.siteKey, p.filiereNom || '—', p.promoNom, p.type,
        p.effectifInitial, p.totalAbandons, p.effectifActuel,
        p.tauxAbandon, p.tauxRetention, p.niveau,
      ]),
      [],
      ['TOTAL CONSOLIDÉ', '', '', '', '',
        totaux.totalEffectifInitial, totaux.totalAbandons, totaux.totalEffectifActuel,
        totaux.tauxAbandonGlobal, totaux.tauxRetentionGlobal,
        `${totaux.nbCritiques} critiques · ${totaux.nbAlertes} alertes · ${totaux.nbSaines} saines`],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `suivi_promos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Barre relative au taux danger (visualisation)
  const TauxBar = ({ taux, niveau }) => {
    const pct = Math.min(100, taux * 100 / Math.max(seuils.danger * 1.5, 30));
    const color = niveau === 'danger' ? 'bg-rose-500'
      : niveau === 'warning' ? 'bg-amber-500'
      : niveau === 'success' ? 'bg-emerald-500'
      : 'bg-slate-300';
    return (
      <div className={`relative w-full h-1.5 rounded-full overflow-hidden ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`}>
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  const updateSeuil = (key, valeur) => {
    if (!setGlobalParams) return;
    const v = Math.max(0, Math.min(100, parseFloat(valeur) || 0));
    setGlobalParams(prev => ({ ...prev, [key]: v }));
  };

  return (
    <DataPanel
      darkMode={dm}
      icon={Users}
      title="Suivi des Quotas par Promo"
      subtitle="Détection en amont des promos qui décrochent — rupture de charge probable"
      level={totalLevel}
      help={`Pour chaque promo individuelle : taux d'abandon = abandons cumulés / effectif initial. Niveau warning ≥ ${seuils.warning} % · danger ≥ ${seuils.danger} %. Une promo "danger" est en risque de rupture de charge — recettes amputées et coût/étudiant qui explose. Le tri place automatiquement les critiques en tête.`}
      collapsible
      actions={
        <button
          onClick={exportCSV}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          <Download size={12} strokeWidth={1.5} /> CSV
        </button>
      }
      summary={
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Taux d'abandon global"
              value={fmtPct(totaux.tauxAbandonGlobal)}
              hint={`${fmtInt(totaux.totalAbandons)} abandons sur ${fmtInt(totaux.totalEffectifInitial)} étudiants initiaux`}
              level={totaux.tauxAbandonGlobal >= seuils.danger ? 'danger'
                : totaux.tauxAbandonGlobal >= seuils.warning ? 'warning'
                : totaux.totalEffectifInitial > 0 ? 'success' : 'neutral'}
            />
            <PanelStat
              darkMode={dm}
              label="Promos critiques / alertes / saines"
              value={`${totaux.nbCritiques} / ${totaux.nbAlertes} / ${totaux.nbSaines}`}
              level={totaux.nbCritiques > 0 ? 'danger' : totaux.nbAlertes > 0 ? 'warning' : 'success'}
              hint={
                totaux.nbCritiques > 0
                  ? `${totaux.nbCritiques} promo${totaux.nbCritiques > 1 ? 's en' : ' en'} rupture de charge`
                  : totaux.nbAlertes > 0
                    ? `${totaux.nbAlertes} promo${totaux.nbAlertes > 1 ? 's à surveiller' : ' à surveiller'}`
                    : `${totaux.nbPromos} promo${totaux.nbPromos > 1 ? 's' : ''} suivie${totaux.nbPromos > 1 ? 's' : ''}`
              }
            />
            <PanelStat
              darkMode={dm}
              label="Effectif actuel cumulé"
              value={fmtInt(totaux.totalEffectifActuel)}
              hint={`Rétention ${fmtPct(totaux.tauxRetentionGlobal)} sur ${fmtInt(totaux.nbPromos)} promo${totaux.nbPromos > 1 ? 's' : ''}`}
              level="info"
            />
          </div>

          {totaux.nbCritiques > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbCritiques} promo{totaux.nbCritiques > 1 ? 's affichent' : ' affiche'} un taux
                d'abandon ≥ {seuils.danger} %</strong> — risque de rupture de charge. Mettre en place un audit
                pédagogique et un plan de remédiation (tutorat individualisé, entretiens d'abandon).
              </p>
            </div>
          )}

          {/* Réglage des seuils */}
          {setGlobalParams && (
            <div className={`rounded-xl p-3 mb-4 flex flex-wrap items-center gap-4 ${surface.muted(dm)}`}>
              <div className="flex items-center gap-2 text-xs">
                <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>Seuil vigilance :</span>
                <input
                  type="number" min="0" max="100" step="1"
                  value={seuils.warning}
                  onChange={e => updateSeuil('seuilAbandonWarning', e.target.value)}
                  className={`w-16 px-2 py-1 rounded text-xs font-mono ${dm ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'} border`}
                  aria-label="Seuil vigilance abandons"
                />
                <span className={dm ? 'text-zinc-500' : 'text-slate-400'}>%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>Seuil rupture :</span>
                <input
                  type="number" min="0" max="100" step="1"
                  value={seuils.danger}
                  onChange={e => updateSeuil('seuilAbandonDanger', e.target.value)}
                  className={`w-16 px-2 py-1 rounded text-xs font-mono ${dm ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'} border`}
                  aria-label="Seuil rupture abandons"
                />
                <span className={dm ? 'text-zinc-500' : 'text-slate-400'}>%</span>
              </div>
              <span className={`text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                Défaut : {SEUIL_ABANDON_WARNING_DEFAULT} % / {SEUIL_ABANDON_DANGER_DEFAULT} %
              </span>
            </div>
          )}
        </>
      }
    >
      {result.parPromo.length === 0 ? (
        <p className={text.muted(dm)}>Aucune promo enregistrée. Créez vos services et leurs promos dans l'onglet Budget pour activer le suivi.</p>
      ) : (
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm}>Service / Site</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Promo</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Initial</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Abandons</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Actuel</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Taux abandon</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {result.parPromo.map(p => {
              const tone = statusToken[p.niveau](dm);
              const Icon = p.niveau === 'danger' ? AlertTriangle
                : p.niveau === 'warning' ? AlertCircle
                : p.niveau === 'success' ? CheckCircle2
                : Info;
              const tauxColor = p.niveau === 'danger' ? (dm ? 'text-rose-300' : 'text-rose-700')
                : p.niveau === 'warning' ? (dm ? 'text-amber-300' : 'text-amber-700')
                : p.niveau === 'success' ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                : (dm ? 'text-zinc-400' : 'text-slate-500');
              return (
                <DataTable.Row key={p.id} level={p.niveau === 'neutral' ? undefined : p.niveau}>
                  <DataTable.Cell darkMode={dm}>
                    <div className="flex flex-col">
                      <span className="font-bold">{p.serviceNom}</span>
                      <span className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {p.siteKey}{p.filiereNom ? ` · ${p.filiereNom}` : ''}
                      </span>
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm}>
                    <div className="flex items-center gap-1.5">
                      {p.alerteRupture && <TrendingDown size={12} strokeWidth={1.5} className={dm ? 'text-rose-300' : 'text-rose-600'} />}
                      <span>{p.promoNom}</span>
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{fmtInt(p.effectifInitial)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>
                    <span className={p.totalAbandons > 0 ? (dm ? 'text-rose-300' : 'text-rose-600') : ''}>
                      {p.totalAbandons > 0 ? `−${p.totalAbandons}` : '0'}
                    </span>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtInt(p.effectifActuel)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>
                    <div className="flex flex-col items-end gap-1">
                      <Pill
                        variant={p.niveau === 'danger' ? 'danger' : p.niveau === 'warning' ? 'warning' : p.niveau === 'success' ? 'success' : 'neutral'}
                        size="xs"
                        darkMode={dm}
                      >
                        <span className={tauxColor}>{fmtPct(p.tauxAbandon)}</span>
                      </Pill>
                      <TauxBar taux={p.tauxAbandon} niveau={p.niveau} />
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="center">
                    <HoverTip
                      darkMode={dm}
                      title={`${p.serviceNom} — ${p.promoNom}`}
                      description={recommendationPromo(p.niveau, p.tauxAbandon, p.effectifActuel, p.effectifInitial)}
                      level={p.niveau}
                    >
                      <span className={`inline-flex items-center justify-center p-1 rounded-full ${tone.bg}`}>
                        <Icon size={14} strokeWidth={1.5} className={tone.accent} />
                      </span>
                    </HoverTip>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable.Body>
          <DataTable.Foot darkMode={dm}>
            <DataTable.Row highlight>
              <DataTable.Cell darkMode={dm} bold>TOTAL CONSOLIDÉ</DataTable.Cell>
              <DataTable.Cell darkMode={dm}>
                <span className={`text-[10px] ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {totaux.nbPromos} promo{totaux.nbPromos > 1 ? 's' : ''}
                </span>
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtInt(totaux.totalEffectifInitial)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>
                <span className={totaux.totalAbandons > 0 ? (dm ? 'text-rose-300' : 'text-rose-700') : ''}>
                  {totaux.totalAbandons > 0 ? `−${totaux.totalAbandons}` : '0'}
                </span>
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtInt(totaux.totalEffectifActuel)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(totaux.tauxAbandonGlobal)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} />
            </DataTable.Row>
          </DataTable.Foot>
        </DataTable>
      )}
    </DataPanel>
  );
}
