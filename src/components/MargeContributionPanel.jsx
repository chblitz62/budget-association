import React, { useMemo } from 'react';
import { TrendingUp, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import {
  calculerMargeContribution,
  recommendationContribution,
  SEUIL_LEVIER,
} from '../utils/margeContribution';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import Term from './ui/Term';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const fmtSigned = (n) => `${n >= 0 ? '+' : ''}${Math.round(n || 0).toLocaleString('fr-FR')} €`;
const fmtPct = (n) => (n === null || n === undefined ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(1)} %`);

/**
 * <MargeContributionPanel /> — Reporting de Contribution (Axe 6).
 *
 * Identifie les "leviers" (taux de contribution ≥ 30 %) qui financent la
 * structure et les autres filières, vs les "poids morts" (marge contributive
 * négative). Reuse du ratio CF/CV partagé avec le Seuil de Rentabilité.
 */
export default function MargeContributionPanel({
  darkMode = false, services = [], getBudgetDirection, getBudgetService,
  globalParams,
}) {
  const dm = darkMode;

  const budgetSiege = useMemo(() => {
    if (!getBudgetDirection) return { total: 0 };
    try { return getBudgetDirection(); } catch { return { total: 0 }; }
  }, [getBudgetDirection]);

  const result = useMemo(
    () => calculerMargeContribution(services, budgetSiege, getBudgetService, globalParams),
    [services, budgetSiege, getBudgetService, globalParams]
  );

  const { totaux } = result;
  const totalLevel = totaux.nbPoidsMort > 0 ? 'danger'
    : !totaux.coutsFixesCouverts ? 'warning'
    : totaux.nbMarginaux > 0 ? 'warning'
    : 'success';

  const exportCSV = () => {
    const lignes = [
      ['Reporting de Contribution — Marge contributive par service'],
      [`Seuil "levier" : ${SEUIL_LEVIER} %`],
      [`Clé de répartition siège : ${globalParams?.cleRepartition?.type || 'etp'}`],
      [],
      ['Rang', 'Service', 'Recettes', 'Charges fixes', 'Charges variables',
        'Marge contribution', 'Taux contribution (%)', 'Part contribution (%)',
        'Couverture CF du service (%)', 'Niveau'],
      ...result.parService.map(s => [
        s.rang, s.nom, s.recettes, s.chargesFixes, s.chargesVariables,
        s.margeContribution, s.tauxContribution, s.partContribution,
        s.couvertureCF ?? '—', s.niveau,
      ]),
      [],
      ['TOTAL CONSOLIDÉ', '', totaux.totalRecettes, totaux.totalChargesFixes,
        totaux.totalChargesVariables, totaux.totalMargeContribution,
        totaux.tauxContributionGlobal, '', '', ''],
      [`Surplus après absorption CF : ${totaux.surplus} €`,
        totaux.coutsFixesCouverts ? '✓ Couverture assurée' : '✕ Sous-couverture'],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `marge_contribution_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Barre de proportion : longueur relative à la marge max positive
  const margeMaxAbs = Math.max(
    1,
    ...result.parService.map(s => Math.abs(s.margeContribution || 0))
  );
  const ProgressBar = ({ value, niveau }) => {
    const pct = Math.min(100, Math.abs(value) / margeMaxAbs * 100);
    const color = niveau === 'danger' ? 'bg-rose-500'
      : niveau === 'warning' ? 'bg-amber-500'
      : niveau === 'success' ? 'bg-emerald-500'
      : 'bg-slate-300';
    return (
      <div className={`relative w-full h-1.5 rounded-full overflow-hidden ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`}>
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%`, marginLeft: value < 0 ? `${100 - pct}%` : 0 }}
        />
      </div>
    );
  };

  return (
    <DataPanel
      darkMode={dm}
      icon={TrendingUp}
      title="Reporting de Contribution — Leviers de performance"
      subtitle="Marge contributive par service : qui finance la structure ? qui détruit de la valeur ?"
      level={totalLevel}
      help={`La marge de contribution = recettes − charges variables. Elle mesure ce que le service apporte pour absorber les charges fixes du siège (loyers, RH permanents). Un service "levier" (≥ ${SEUIL_LEVIER} % de taux) finance les autres ; un "poids mort" (marge négative) détruit de la valeur même avant CF.`}
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
              label="Marge contribution consolidée"
              value={fmtSigned(totaux.totalMargeContribution)}
              hint={`${fmtPct(totaux.tauxContributionGlobal)} de taux global · ${fmt(totaux.totalRecettes)} de recettes`}
              level={totaux.totalMargeContribution > 0 ? 'success' : 'danger'}
            />
            <PanelStat
              darkMode={dm}
              label="Surplus après CF"
              value={fmtSigned(totaux.surplus)}
              hint={
                totaux.coutsFixesCouverts
                  ? `Charges fixes (${fmt(totaux.totalChargesFixes)}) couvertes`
                  : `Sous-couverture des CF (${fmt(totaux.totalChargesFixes)})`
              }
              level={totaux.coutsFixesCouverts ? 'success' : 'danger'}
            />
            <PanelStat
              darkMode={dm}
              label="Leviers / Marginaux / Poids morts"
              value={`${totaux.nbLeviers} / ${totaux.nbMarginaux} / ${totaux.nbPoidsMort}`}
              level={totaux.nbPoidsMort > 0 ? 'danger' : totaux.nbMarginaux > 0 ? 'warning' : 'success'}
              hint={
                totaux.nbPoidsMort > 0
                  ? `${totaux.nbPoidsMort} service${totaux.nbPoidsMort > 1 ? 's' : ''} à marge contributive négative`
                  : totaux.nbLeviers > 0
                    ? `${totaux.nbLeviers} levier${totaux.nbLeviers > 1 ? 's' : ''} financ${totaux.nbLeviers > 1 ? 'ent' : 'e'} la structure`
                    : 'Aucun levier identifié'
              }
            />
          </div>

          {totaux.nbPoidsMort > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbPoidsMort} service{totaux.nbPoidsMort > 1 ? 's affichent' : ' affiche'} une
                <Term darkMode={dm}> marge de contribution</Term> négative</strong> :
                les recettes ne couvrent pas les charges variables. Décision stratégique requise — restructuration
                tarifaire ou arrêt d'activité.
              </p>
            </div>
          )}

          {!totaux.coutsFixesCouverts && totaux.nbPoidsMort === 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500'
            }`}>
              <AlertCircle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
              <p className={`text-sm ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
                <strong>Sous-couverture des charges fixes consolidées</strong> ({fmt(Math.abs(totaux.surplus))} de manque).
                Les marges contributives positives ne suffisent pas à absorber les CF du siège — surveiller les services marginaux.
              </p>
            </div>
          )}
        </>
      }
    >
      {result.parService.length === 0 ? (
        <p className={text.muted(dm)}>Aucun service à analyser. Créez vos services et leurs promos pour activer le calcul.</p>
      ) : (
        <>
          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm} align="center">Rang</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Service</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Recettes</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Charges variables</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Marge contribution</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Taux</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Part</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Couvre CF service</DataTable.HeadCell>
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
                const mcColor = s.margeContribution > 0
                  ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                  : s.margeContribution < 0
                    ? (dm ? 'text-rose-300' : 'text-rose-700')
                    : (dm ? 'text-zinc-400' : 'text-slate-500');
                const isLevierTop = s.rang === 1 && s.niveau === 'success';
                return (
                  <DataTable.Row key={s.id} level={s.niveau === 'neutral' ? undefined : s.niveau}>
                    <DataTable.Cell darkMode={dm} align="center" mono>
                      {isLevierTop ? (
                        <HoverTip darkMode={dm} title="Levier #1" description="Service qui dégage la plus forte marge contributive — pilier de la structure" level="success">
                          <Trophy size={14} strokeWidth={1.5} className={dm ? 'text-amber-300' : 'text-amber-500'} />
                        </HoverTip>
                      ) : (
                        <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>#{s.rang}</span>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} bold>{s.nom}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.recettes)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.chargesVariables)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={mcColor}>
                      <div className="flex flex-col items-end gap-1">
                        <span>{fmtSigned(s.margeContribution)}</span>
                        <ProgressBar value={s.margeContribution} niveau={s.niveau} />
                      </div>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      <Pill
                        variant={s.niveau === 'danger' ? 'danger' : s.niveau === 'warning' ? 'warning' : s.niveau === 'success' ? 'success' : 'neutral'}
                        size="xs"
                        darkMode={dm}
                      >
                        {fmtPct(s.tauxContribution)}
                      </Pill>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {s.partContribution > 0 ? `${s.partContribution.toFixed(1)} %` : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {s.couvertureCF === null ? '—' : `${s.couvertureCF.toFixed(0)} %`}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        darkMode={dm}
                        title={`${s.nom} — ${
                          s.niveau === 'success' ? 'Levier'
                          : s.niveau === 'warning' ? 'Marginal'
                          : s.niveau === 'danger' ? 'Poids mort'
                          : 'Indicateur indisponible'
                        }`}
                        description={recommendationContribution(s.niveau, s.tauxContribution, s.couvertureCF)}
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
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.totalRecettes)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.totalChargesVariables)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold className={totaux.totalMargeContribution >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')}>
                  {fmtSigned(totaux.totalMargeContribution)}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(totaux.tauxContributionGlobal)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>100 %</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          {/* Synthèse pédagogique : absorption des CF consolidés */}
          <div className={`mt-4 rounded-xl p-4 ${surface.muted(dm)}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Info size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
                <span className={`text-xs font-bold uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Absorption des charges fixes consolidées
                </span>
              </div>
              <span className={`text-xs ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                {fmt(totaux.totalMargeContribution)} / {fmt(totaux.totalChargesFixes)}
              </span>
            </div>
            <div className={`relative w-full h-3 rounded-full overflow-hidden ${dm ? 'bg-zinc-800' : 'bg-slate-200'}`}>
              <div
                className={`h-full ${
                  totaux.coutsFixesCouverts
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500'
                } transition-all`}
                style={{
                  width: totaux.totalChargesFixes > 0
                    ? `${Math.min(100, Math.max(0, (totaux.totalMargeContribution / totaux.totalChargesFixes) * 100))}%`
                    : '0%',
                }}
              />
              {totaux.totalChargesFixes > 0 && (
                <div
                  className={`absolute top-0 h-full w-px ${dm ? 'bg-zinc-300' : 'bg-slate-700'}`}
                  style={{ left: '100%', transform: 'translateX(-1px)' }}
                  title="Seuil 100 % = CF couvertes"
                />
              )}
            </div>
            <p className={`mt-2 text-[11px] ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
              {totaux.coutsFixesCouverts
                ? `✓ Les marges contributives absorbent les charges fixes et dégagent ${fmt(totaux.surplus)} de surplus pour le résultat net.`
                : `⚠ Sous-couverture de ${fmt(Math.abs(totaux.surplus))} — résultat structurellement déficitaire avant ajustement.`}
            </p>
          </div>

          <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              La <Term id="marge_contribution" darkMode={dm}>marge de contribution</Term> = recettes − charges
              variables. Le <strong>taux de contribution</strong> mesure ce que chaque euro de recette laisse
              pour absorber la structure. Au-delà de {SEUIL_LEVIER} %, le service est qualifié de "levier" : il
              finance les autres filières. Le ratio CF/CV est partagé avec le panneau Seuil de Rentabilité.
            </span>
          </p>
        </>
      )}
    </DataPanel>
  );
}
