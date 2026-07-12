import React, { useMemo } from 'react';
import { Users, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import {
  calculerIndicateursRH,
  recommendationRH,
  TRANCHES_AGE,
  SEUIL_VIEILLISSEMENT_WARNING,
  SEUIL_VIEILLISSEMENT_DANGER,
  AGE_SENIOR,
} from '../utils/pyramideAges';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import Term from './ui/Term';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmtNum = (n) => Math.round(n || 0).toLocaleString('fr-FR');
const fmtPct = (n) => `${(n || 0).toFixed(1)} %`;
const fmtAns = (n) => `${(n || 0).toFixed(1)} ans`;
const fmtETP = (n) => (n || 0).toFixed(2);

/**
 * <PyramideAgesPanel /> — Pyramide des Âges & Ancienneté Moyenne (Axe 8).
 *
 * Exploite anneeNaissance + dateEntree (déjà présents pour calculerIFC/IDR) pour
 * un pilotage RH stratégique : âge moyen, ancienneté, % seniors par service,
 * détection vieillissement (transmission savoir, vague IFC concentrée).
 */
export default function PyramideAgesPanel({
  darkMode = false, direction, services = [], poleSupport, globalParams,
}) {
  const dm = darkMode;
  const anneeRef = useMemo(() => new Date().getFullYear(), []);

  const result = useMemo(
    () => calculerIndicateursRH(direction, services, poleSupport, anneeRef, globalParams || {}),
    [direction, services, poleSupport, anneeRef, globalParams]
  );

  const { parEntite, pyramideConsolidee, totaux, seuils } = result;

  const exportCSV = () => {
    const lignes = [
      [`Pyramide des Âges & Ancienneté — référence ${anneeRef}`],
      [`Seuils : vieillissement warning ≥ ${seuils.warning} % seniors | danger > ${seuils.danger} % seniors (>${AGE_SENIOR} ans)`],
      [],
      ['Pyramide consolidée'],
      ['Tranche', 'Nb agents', 'ETP', '% agents', '% ETP'],
      ...pyramideConsolidee.tranches.map(t => [t.label, t.nbAgents, t.etp, t.pctAgents, t.pctETP]),
      [],
      ['Détail par entité'],
      ['Entité', 'Type', 'Effectif', 'Âge renseigné', 'Anc. renseignée',
        'Âge moyen', 'Âge médian', 'Anc. moyenne', 'Anc. médiane',
        'Nb seniors (>55)', '% seniors', 'Niveau'],
      ...parEntite.map(e => [
        e.nom, e.type, e.nbAgents, e.nbAgeRenseigne, e.nbAncRenseigne,
        e.ageMoyen, e.ageMedian, e.ancMoyenne, e.ancMediane,
        e.nbSeniors, e.pctSeniors, e.niveau,
      ]),
      [],
      ['CONSOLIDÉ', '', totaux.nbAgents, totaux.nbAgeRenseigne, totaux.nbAncRenseigne,
        totaux.ageMoyen, totaux.ageMedian, totaux.ancMoyenne, totaux.ancMediane,
        totaux.nbSeniors, totaux.pctSeniors, totaux.niveau],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pyramide_ages_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pyramide horizontale : largeur barre relative à la tranche la plus peuplée
  const maxNb = Math.max(1, ...pyramideConsolidee.tranches.map(t => t.nbAgents));
  const PyramidBar = ({ tranche }) => {
    const widthPct = (tranche.nbAgents / maxNb) * 100;
    const isSenior = tranche.min >= AGE_SENIOR;
    const colorClass = isSenior
      ? (dm ? 'bg-amber-500/70' : 'bg-amber-400')
      : (dm ? 'bg-indigo-500/70' : 'bg-indigo-400');
    return (
      <div className="flex items-center gap-2">
        <div className={`text-[11px] font-mono w-20 text-right shrink-0 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
          {tranche.label}
        </div>
        <div className={`relative flex-1 h-5 rounded-md overflow-hidden ${dm ? 'bg-zinc-900' : 'bg-slate-100'}`}>
          <div
            className={`h-full transition-all ${colorClass}`}
            style={{ width: `${widthPct}%` }}
          />
          {tranche.nbAgents > 0 && (
            <div className="absolute inset-0 flex items-center px-2">
              <span className={`text-[10px] font-bold ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>
                {tranche.nbAgents} ag. · {fmtETP(tranche.etp)} ETP
              </span>
            </div>
          )}
        </div>
        <div className={`text-[11px] font-mono w-12 text-right shrink-0 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
          {tranche.pctAgents.toFixed(0)} %
        </div>
      </div>
    );
  };

  const totalLevel = totaux.niveau || 'neutral';
  const dataMissing = totaux.nbAgeRenseigne === 0 && totaux.nbAgents > 0;

  return (
    <DataPanel
      darkMode={dm}
      icon={Users}
      title="Pyramide des Âges & Ancienneté"
      subtitle={<>Cartographie démographique des effectifs — anticipation des départs, vague <Term id="ifc">IFC</Term> et transmission</>}
      level={totalLevel}
      help={`Pyramide construite à partir de l'année de naissance des agents (référence ${anneeRef}). Seuils : ≥ ${seuils.warning} % seniors (>${AGE_SENIOR} ans) → vieillissement, > ${seuils.danger} % → risque démographique. Les agents sans année de naissance saisie sont exclus du calcul.`}
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
              label="Âge moyen"
              value={totaux.nbAgeRenseigne > 0 ? fmtAns(totaux.ageMoyen) : '—'}
              hint={totaux.nbAgeRenseigne > 0
                ? `médiane ${fmtAns(totaux.ageMedian)} · ${totaux.nbAgeRenseigne}/${totaux.nbAgents} agents renseignés`
                : `${totaux.nbAgents} agents — année de naissance non renseignée`}
              level="info"
            />
            <PanelStat
              darkMode={dm}
              label="Ancienneté moyenne"
              value={totaux.nbAncRenseigne > 0 ? fmtAns(totaux.ancMoyenne) : '—'}
              hint={totaux.nbAncRenseigne > 0
                ? `médiane ${fmtAns(totaux.ancMediane)} · ${totaux.nbAncRenseigne}/${totaux.nbAgents} agents renseignés`
                : 'date d\'entrée non renseignée'}
              level="neutral"
            />
            <PanelStat
              darkMode={dm}
              label={`% Seniors (> ${AGE_SENIOR} ans)`}
              value={totaux.nbAgeRenseigne > 0 ? fmtPct(totaux.pctSeniors) : '—'}
              level={totalLevel}
              hint={totaux.nbAgeRenseigne > 0
                ? `${totaux.nbSeniors} agent${totaux.nbSeniors > 1 ? 's' : ''} concerné${totaux.nbSeniors > 1 ? 's' : ''} · seuil alerte ≥ ${seuils.warning} %`
                : 'données indisponibles'}
            />
          </div>

          {dataMissing && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-blue-950/30 border-l-blue-500' : 'bg-blue-50 border-l-blue-500'
            }`}>
              <Info size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-blue-300' : 'text-blue-600'}`} />
              <p className={`text-sm ${dm ? 'text-blue-200' : 'text-blue-800'}`}>
                Aucune <strong>année de naissance</strong> n'est renseignée sur les fiches agents.
                Saisir cette information dans <strong>Gestion RH → Personnel</strong> pour activer la pyramide des âges
                et le module <em>Provision IDR / IFC</em>.
              </p>
            </div>
          )}

          {totaux.nbServicesEnRisque > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbServicesEnRisque} entité{totaux.nbServicesEnRisque > 1 ? 's' : ''}</strong> {totaux.nbServicesEnRisque > 1 ? 'présentent' : 'présente'} un risque démographique élevé
                (&gt; {seuils.danger} % seniors). Anticiper la vague IFC + plan GPEC + recrutement junior structurel.
              </p>
            </div>
          )}

          {totaux.nbServicesEnAlerte > 0 && totaux.nbServicesEnRisque === 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500'
            }`}>
              <AlertCircle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
              <p className={`text-sm ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
                <strong>{totaux.nbServicesEnAlerte} entité{totaux.nbServicesEnAlerte > 1 ? 's' : ''}</strong> en vigilance démographique
                (≥ {seuils.warning} % seniors). Mettre en place un plan de transmission avant les premiers départs.
              </p>
            </div>
          )}
        </>
      }
    >
      {parEntite.length === 0 ? (
        <p className={text.muted(dm)}>Aucune entité à analyser. Renseignez du personnel dans la Direction, le Pôle Ressources ou les services pour activer la pyramide.</p>
      ) : (
        <>
          {/* Pyramide consolidée */}
          {pyramideConsolidee.nbAgentsRenseignes > 0 && (
            <div className={`rounded-xl p-4 mb-4 ${surface.muted(dm)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} strokeWidth={1.5} className={dm ? 'text-zinc-300' : 'text-slate-700'} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Pyramide consolidée — {pyramideConsolidee.nbAgentsRenseignes} agent{pyramideConsolidee.nbAgentsRenseignes > 1 ? 's' : ''} ({fmtETP(pyramideConsolidee.etpRenseigne)} ETP)
                  </span>
                </div>
                <div className={`flex items-center gap-3 text-[10px] ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-2 rounded bg-indigo-400" /> Actifs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-2 rounded bg-amber-400" /> Seniors (&gt; {AGE_SENIOR} ans)
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                {pyramideConsolidee.tranches.slice().reverse().map(t => (
                  <PyramidBar key={t.id} tranche={t} />
                ))}
              </div>
            </div>
          )}

          {/* Tableau par entité */}
          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm}>Entité</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Effectif</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Âge moyen</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Anc. moyenne</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Seniors</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">% Seniors</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {parEntite.map(e => {
                const niveauKey = e.niveau;
                const tone = statusToken[niveauKey](dm);
                const Icon = e.niveau === 'danger' ? AlertTriangle
                  : e.niveau === 'warning' ? AlertCircle
                  : e.niveau === 'success' ? CheckCircle2
                  : Info;
                const pctClass = e.niveau === 'danger'
                  ? (dm ? 'text-rose-300' : 'text-rose-700')
                  : e.niveau === 'warning'
                    ? (dm ? 'text-amber-300' : 'text-amber-700')
                    : e.niveau === 'success'
                      ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                      : (dm ? 'text-zinc-500' : 'text-slate-400');
                return (
                  <DataTable.Row key={e.id} level={e.niveau === 'neutral' ? undefined : e.niveau}>
                    <DataTable.Cell darkMode={dm} bold>
                      <div className="flex flex-col gap-0.5">
                        <span>{e.nom}</span>
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {e.nbAgeRenseigne}/{e.nbAgents} renseigné{e.nbAgeRenseigne > 1 ? 's' : ''}
                        </span>
                      </div>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center" mono>{e.nbAgents}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {e.nbAgeRenseigne > 0 ? fmtAns(e.ageMoyen) : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {e.nbAncRenseigne > 0 ? fmtAns(e.ancMoyenne) : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {e.nbAgeRenseigne > 0 ? (
                        <Pill
                          variant={e.pctSeniors > seuils.danger ? 'danger' : e.pctSeniors >= seuils.warning ? 'warning' : 'neutral'}
                          size="xs"
                          darkMode={dm}
                        >
                          {e.nbSeniors}
                        </Pill>
                      ) : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={pctClass}>
                      {e.nbAgeRenseigne > 0 ? fmtPct(e.pctSeniors) : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        darkMode={dm}
                        title={`${e.nom} — ${
                          e.niveau === 'success' ? 'Équilibre démographique'
                          : e.niveau === 'warning' ? 'Vieillissement'
                          : e.niveau === 'danger' ? 'Risque démographique'
                          : 'Indicateur indisponible'
                        }`}
                        description={recommendationRH(e.niveau, e.pctSeniors, e.ageMoyen, e.ancMoyenne, e.nbAgeRenseigne)}
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
                <DataTable.Cell darkMode={dm} bold>TOTAL CONSOLIDÉ</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="center" mono bold>{totaux.nbAgents}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>
                  {totaux.nbAgeRenseigne > 0 ? fmtAns(totaux.ageMoyen) : '—'}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>
                  {totaux.nbAncRenseigne > 0 ? fmtAns(totaux.ancMoyenne) : '—'}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>
                  {totaux.nbAgeRenseigne > 0 ? totaux.nbSeniors : '—'}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>
                  {totaux.nbAgeRenseigne > 0 ? fmtPct(totaux.pctSeniors) : '—'}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              Calcul basé sur l'année de naissance et la date d'entrée renseignées dans les fiches agents (Gestion RH).
              La part des seniors (&gt; {AGE_SENIOR} ans) anticipe la vague de provision IFC à constituer
              et oriente la stratégie de transmission. Voir aussi <strong>Provision IDR/IFC</strong>.
            </span>
          </p>
        </>
      )}
    </DataPanel>
  );
}
