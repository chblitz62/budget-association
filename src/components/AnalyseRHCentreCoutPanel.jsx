import React, { useMemo } from 'react';
import { Users, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, Crown } from 'lucide-react';
import {
  calculerAnalyseRH,
  recommendationRH,
  SEUIL_MS_RECETTES_DANGER,
  SEUIL_MS_RECETTES_WARNING,
  SEUIL_MS_CHARGES_WARNING,
} from '../utils/analyseRH';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const fmtPct = (n) => `${(n || 0).toFixed(1)} %`;
const fmtETP = (n) => (n || 0).toFixed(2);

/**
 * <AnalyseRHCentreCoutPanel /> — Analyse RH par Centre de Coût (Axe 6).
 *
 * Pour chaque service : MS interne + quote-part Pool RH affectée, ETP total,
 * coût moyen / ETP, coût RH / étudiant, ratio MS/charges, ratio MS/recettes.
 * Détecte les services RH-intensifs ou en tension structurelle.
 */
export default function AnalyseRHCentreCoutPanel({
  darkMode = false, services = [], poolRH = [], getBudgetService, globalParams,
}) {
  const dm = darkMode;

  const result = useMemo(
    () => calculerAnalyseRH(services, poolRH, getBudgetService, globalParams),
    [services, poolRH, getBudgetService, globalParams]
  );

  const { totaux } = result;
  const totalLevel = totaux.nbServicesEnDanger > 0 ? 'danger'
    : totaux.nbServicesEnWarning > 0 ? 'warning'
    : totaux.totalMS > 0 ? 'success' : 'neutral';

  const exportCSV = () => {
    const lignes = [
      ['Analyse RH par Centre de Coût — Pilotage analytique'],
      [`Seuils : MS/recettes danger > ${SEUIL_MS_RECETTES_DANGER} % | warning ≥ ${SEUIL_MS_RECETTES_WARNING} % | MS/charges warning > ${SEUIL_MS_CHARGES_WARNING} %`],
      [],
      ['Rang', 'Service', 'Effectif', 'ETP interne', 'ETP Pool RH', 'ETP total',
        'MS interne', 'MS Pool RH', 'MS totale', 'Part MS (%)',
        'Coût moyen/ETP', 'Coût RH/étud.',
        'Charges directes', 'Recettes',
        'Ratio MS/Charges (%)', 'Ratio MS/Recettes (%)', 'Niveau'],
      ...result.parService.map(s => [
        s.rang, s.nom, s.effectif, s.etpInterne, s.etpPool, s.etpTotal,
        s.msInterne, s.msPool, s.msTotal, s.partMSConsolidee,
        s.coutMoyenETP, s.coutRHParEtudiant,
        s.chargesDirectes, s.recettes,
        s.ratioMSCharges, s.ratioMSRecettes, s.niveau,
      ]),
      [],
      ['TOTAL CONSOLIDÉ', '', totaux.totalEffectif, totaux.totalETPInterne, totaux.totalETPPool, totaux.totalETP,
        totaux.totalMSInterne, totaux.totalMSPool, totaux.totalMS, '100',
        totaux.coutMoyenETPGlobal, '',
        totaux.totalCharges, totaux.totalRecettes,
        totaux.ratioMSChargesGlobal, totaux.ratioMSRecettesGlobal, ''],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analyse_rh_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Stacked bar interne / pool, échelle relative à la MS la plus élevée
  const msMax = Math.max(1, ...result.parService.map(s => s.msTotal));
  const StackedMSBar = ({ interne, pool }) => {
    const totalPct = ((interne + pool) / msMax) * 100;
    const internePart = (interne + pool) > 0 ? (interne / (interne + pool)) * totalPct : 0;
    const poolPart = totalPct - internePart;
    return (
      <div className={`relative w-full h-1.5 rounded-full overflow-hidden flex ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`}>
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${internePart}%` }} />
        <div className="h-full bg-violet-400 transition-all" style={{ width: `${poolPart}%` }} />
      </div>
    );
  };

  return (
    <DataPanel
      darkMode={dm}
      icon={Users}
      title="Analyse RH par Centre de Coût"
      subtitle="Masse salariale par service (interne + Pool RH affecté) — détection des dérives RH"
      level={totalLevel}
      help={`MS = personnel interne + quote-part Pool RH (selon les % d'affectation). Seuils : MS/recettes ≤ ${SEUIL_MS_RECETTES_WARNING} % = soutenable, ${SEUIL_MS_RECETTES_WARNING}-${SEUIL_MS_RECETTES_DANGER} % = tension, > ${SEUIL_MS_RECETTES_DANGER} % = critique. MS/charges > ${SEUIL_MS_CHARGES_WARNING} % = service RH-intensif (peu de leviers sur consommables).`}
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
              label="MS consolidée services"
              value={fmt(totaux.totalMS)}
              hint={`${fmt(totaux.totalMSInterne)} interne + ${fmt(totaux.totalMSPool)} Pool RH · ${fmtETP(totaux.totalETP)} ETP`}
              level="info"
            />
            <PanelStat
              darkMode={dm}
              label="Coût moyen / ETP"
              value={fmt(totaux.coutMoyenETPGlobal)}
              hint={`${fmtETP(totaux.totalETPInterne)} ETP internes + ${fmtETP(totaux.totalETPPool)} ETP Pool RH affectés`}
              level="neutral"
            />
            <PanelStat
              darkMode={dm}
              label="Ratio MS / Recettes"
              value={fmtPct(totaux.ratioMSRecettesGlobal)}
              level={
                totaux.ratioMSRecettesGlobal > SEUIL_MS_RECETTES_DANGER ? 'danger'
                : totaux.ratioMSRecettesGlobal >= SEUIL_MS_RECETTES_WARNING ? 'warning'
                : totaux.ratioMSRecettesGlobal > 0 ? 'success' : 'neutral'
              }
              hint={`Cible ≤ ${SEUIL_MS_RECETTES_WARNING} % · charges fixes : ${fmtPct(totaux.ratioMSChargesGlobal)} de la MS dans les charges directes`}
            />
          </div>

          {totaux.nbServicesEnDanger > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbServicesEnDanger} service{totaux.nbServicesEnDanger > 1 ? 's' : ''}</strong> {totaux.nbServicesEnDanger > 1 ? 'présentent' : 'présente'} une masse salariale
                supérieure à {SEUIL_MS_RECETTES_DANGER} % des recettes. Modèle économique non viable —
                arbitrer entre mix vacataires/permanents et négociation tarifaire OPCO/CPOM.
              </p>
            </div>
          )}
        </>
      }
    >
      {result.parService.length === 0 ? (
        <p className={text.muted(dm)}>Aucun service à analyser. Créez vos services et leur personnel pour activer le calcul.</p>
      ) : (
        <>
          <div className={`mb-3 flex items-center gap-3 text-[11px] ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full bg-indigo-500" /> MS interne
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-1.5 rounded-full bg-violet-400" /> MS Pool RH affecté
            </span>
          </div>

          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm} align="center">Rang</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Service</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">ETP</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">MS totale</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Coût/ETP</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Coût RH/étud.</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">MS/Charges</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">MS/Recettes</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {result.parService.map(s => {
                const niveauKey = s.niveau === 'neutral' ? 'neutral' : s.niveau;
                const tone = statusToken[niveauKey](dm);
                const Icon = s.niveau === 'danger' ? AlertTriangle
                  : s.niveau === 'warning' ? AlertCircle
                  : s.niveau === 'success' ? CheckCircle2
                  : Info;
                const ratioRColor = s.ratioMSRecettes > SEUIL_MS_RECETTES_DANGER
                  ? (dm ? 'text-rose-300' : 'text-rose-700')
                  : s.ratioMSRecettes >= SEUIL_MS_RECETTES_WARNING
                    ? (dm ? 'text-amber-300' : 'text-amber-700')
                    : s.ratioMSRecettes > 0
                      ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                      : (dm ? 'text-zinc-500' : 'text-slate-400');
                const isTopRH = s.rang === 1;
                return (
                  <DataTable.Row key={s.id} level={s.niveau === 'neutral' ? undefined : s.niveau}>
                    <DataTable.Cell darkMode={dm} align="center" mono>
                      {isTopRH ? (
                        <HoverTip darkMode={dm} title="Service le plus chargé en MS" description="Plus forte masse salariale absolue de la consolidation — pivot RH" level="info">
                          <Crown size={14} strokeWidth={1.5} className={dm ? 'text-violet-300' : 'text-violet-500'} />
                        </HoverTip>
                      ) : (
                        <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>#{s.rang}</span>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} bold>
                      <div className="flex flex-col gap-0.5">
                        <span>{s.nom}</span>
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {fmtETP(s.etpInterne)} interne
                          {s.etpPool > 0 && ` + ${fmtETP(s.etpPool)} Pool (${s.agentsPool} ag.)`}
                        </span>
                      </div>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center" mono>{fmtETP(s.etpTotal)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold>
                      <div className="flex flex-col items-end gap-1">
                        <span>{fmt(s.msTotal)}</span>
                        <StackedMSBar interne={s.msInterne} pool={s.msPool} />
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {s.partMSConsolidee.toFixed(1)} % du total
                        </span>
                      </div>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.coutMoyenETP)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {s.effectif > 0 ? fmt(s.coutRHParEtudiant) : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      <Pill
                        variant={s.ratioMSCharges > SEUIL_MS_CHARGES_WARNING ? 'warning' : 'neutral'}
                        size="xs"
                        darkMode={dm}
                      >
                        {fmtPct(s.ratioMSCharges)}
                      </Pill>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={ratioRColor}>
                      {s.recettes > 0 ? fmtPct(s.ratioMSRecettes) : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        darkMode={dm}
                        title={`${s.nom} — ${
                          s.niveau === 'success' ? 'Structure RH soutenable'
                          : s.niveau === 'warning' ? 'Tension RH'
                          : s.niveau === 'danger' ? 'MS critique'
                          : 'Indicateur indisponible'
                        }`}
                        description={recommendationRH(s.niveau, s.ratioMSRecettes, s.ratioMSCharges)}
                        level={niveauKey}
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
                <DataTable.Cell darkMode={dm} />
                <DataTable.Cell darkMode={dm} bold>TOTAL CONSOLIDÉ</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="center" mono bold>{fmtETP(totaux.totalETP)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.totalMS)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.coutMoyenETPGlobal)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>
                  {totaux.totalEffectif > 0 ? fmt(Math.round(totaux.totalMS / totaux.totalEffectif)) : '—'}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(totaux.ratioMSChargesGlobal)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(totaux.ratioMSRecettesGlobal)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          {/* Synthèse pédagogique : ventilation interne vs pool */}
          {totaux.totalMSPool > 0 && (
            <div className={`mt-4 rounded-xl p-4 ${surface.muted(dm)}`}>
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
                <span className={`text-xs font-bold uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Mutualisation Pool RH
                </span>
              </div>
              <p className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-600'}`}>
                {fmtPct((totaux.totalMSPool / totaux.totalMS) * 100)} de la MS provient du Pool RH mutualisé
                ({fmt(totaux.totalMSPool)} sur {fmt(totaux.totalMS)}). Ce levier réduit les doublons RH entre
                services. Vérifier les affectations dans <strong>Gestion RH → Pool RH</strong> en cas de double-comptage.
              </p>
            </div>
          )}

          <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              Coût moyen/ETP = MS ÷ ETP (taux moyen de la grille du service, charges patronales incluses).
              Ratio MS/Recettes mesure la viabilité du modèle économique : sous {SEUIL_MS_RECETTES_WARNING} %
              = soutenable, {SEUIL_MS_RECETTES_WARNING}-{SEUIL_MS_RECETTES_DANGER} % = tension structurelle,
              au-delà = arbitrage stratégique requis. Les données Pool RH sont normalisées à 100 % par agent
              (anti double-comptage).
            </span>
          </p>
        </>
      )}
    </DataPanel>
  );
}
