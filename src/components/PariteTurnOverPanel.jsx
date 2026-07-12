import React, { useMemo } from 'react';
import { Users2, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, ArrowDownUp } from 'lucide-react';
import {
  calculerIndicateursPariteTurnOver,
  recommendationParite,
  recommendationTurnOver,
  SEUIL_PARITE_EQUILIBRE,
  SEUIL_PARITE_DESEQUILIBRE,
  SEUIL_TURNOVER_WARNING,
  SEUIL_TURNOVER_DANGER,
} from '../utils/pariteTurnOver';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmtPct = (n) => `${(n || 0).toFixed(1)} %`;
const fmtNum = (n) => Math.round(n || 0).toLocaleString('fr-FR');

/**
 * <PariteTurnOverPanel /> — Parité H/F & Turn-over (Axe 8).
 *
 * Synthèse de deux indicateurs RH stratégiques :
 *  - Parité H/F : effectif et ETP par genre, index simplifié (genre minoritaire)
 *  - Turn-over : entrées/sorties de l'année / effectif moyen, niveau APEC
 */
export default function PariteTurnOverPanel({
  darkMode = false,
  direction,
  services = [],
  poleSupport,
  poolRH = [],
  globalParams,
}) {
  const dm = darkMode;
  const anneeRef = useMemo(() => new Date().getFullYear(), []);

  const result = useMemo(
    () => calculerIndicateursPariteTurnOver(direction, services, poleSupport, poolRH, anneeRef, globalParams || {}),
    [direction, services, poleSupport, poolRH, anneeRef, globalParams]
  );

  const { parEntite, pariteConsolidee, turnOverConsolide, totaux, seuilsParite, seuilsTurnOver } = result;

  // Niveau global = pire des deux
  const order = { danger: 0, warning: 1, success: 2, neutral: 3 };
  const levelConso = order[pariteConsolidee.niveau] < order[turnOverConsolide.niveau]
    ? pariteConsolidee.niveau
    : turnOverConsolide.niveau;

  const exportCSV = () => {
    const lignes = [
      [`Parité H/F & Turn-over — référence ${anneeRef}`],
      [`Seuils parité : équilibre ≥ ${seuilsParite.equilibre} % du genre minoritaire | déséquilibre ${seuilsParite.desequilibre}-${seuilsParite.equilibre} %`],
      [`Seuils turn-over : warning ≥ ${seuilsTurnOver.warning} % | danger > ${seuilsTurnOver.danger} %`],
      [],
      ['Entité', 'Type', 'Nb agents',
        'Nb H', 'Nb F', 'Nb non renseigné',
        '% H', '% F', 'Index parité',
        'Niveau parité',
        'Effectif moyen', 'Entrées', 'Sorties',
        'Taux entrée %', 'Taux sortie %', 'Turn-over %',
        'Niveau turn-over'],
      ...parEntite.map(e => [
        e.nom, e.type, e.nbAgents,
        e.parite.nbH, e.parite.nbF, e.parite.nbNonRenseigne,
        e.parite.pctH, e.parite.pctF, e.parite.indexParite,
        e.parite.niveau,
        e.turnOver.effectifMoyen, e.turnOver.entrees, e.turnOver.sorties,
        e.turnOver.tauxEntree, e.turnOver.tauxSortie, e.turnOver.turnOver,
        e.turnOver.niveau,
      ]),
      [],
      ['CONSOLIDÉ', '', totaux.nbAgents,
        pariteConsolidee.nbH, pariteConsolidee.nbF, pariteConsolidee.nbNonRenseigne,
        pariteConsolidee.pctH, pariteConsolidee.pctF, pariteConsolidee.indexParite,
        pariteConsolidee.niveau,
        turnOverConsolide.effectifMoyen, turnOverConsolide.entrees, turnOverConsolide.sorties,
        turnOverConsolide.tauxEntree, turnOverConsolide.tauxSortie, turnOverConsolide.turnOver,
        turnOverConsolide.niveau],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `parite_turnover_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Barre stack H/F consolidée
  const ParitéBar = ({ pctH, pctF, height = 'h-3' }) => {
    const total = pctH + pctF;
    if (total === 0) return <div className={`${height} rounded-md ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`} />;
    return (
      <div className={`relative w-full ${height} rounded-md overflow-hidden flex ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`}>
        <div className={`h-full transition-all ${dm ? 'bg-blue-500' : 'bg-blue-400'}`} style={{ width: `${pctH}%` }} />
        <div className={`h-full transition-all ${dm ? 'bg-pink-500' : 'bg-pink-400'}`} style={{ width: `${pctF}%` }} />
      </div>
    );
  };

  const dataMissing = pariteConsolidee.nbRenseignes === 0
    && turnOverConsolide.nbDateEntreeRenseignee === 0
    && totaux.nbAgents > 0;

  return (
    <DataPanel
      darkMode={dm}
      icon={Users2}
      title="Parité H/F & Turn-over"
      subtitle={`Indicateurs Performance Sociale ${anneeRef} — index parité (genre minoritaire) + turn-over annuel`}
      level={levelConso}
      help={`Parité : index = % du genre minoritaire (50 = parité parfaite). Seuils ≥ ${seuilsParite.equilibre} % équilibre, ${seuilsParite.desequilibre}-${seuilsParite.equilibre} % vigilance, < ${seuilsParite.desequilibre} % très déséquilibré. Turn-over (norme APEC) = (entrées + sorties)/2 / effectif moyen ; > ${seuilsTurnOver.danger} % critique. Les agents sans genre/date renseignés sont exclus du calcul.`}
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
              label="Index parité (genre minoritaire)"
              value={pariteConsolidee.nbRenseignes >= 3 ? fmtPct(pariteConsolidee.indexParite) : '—'}
              level={pariteConsolidee.niveau}
              hint={pariteConsolidee.nbRenseignes >= 3
                ? `${pariteConsolidee.nbH} H / ${pariteConsolidee.nbF} F · cible ≥ ${seuilsParite.equilibre} %`
                : `${pariteConsolidee.nbRenseignes} agent${pariteConsolidee.nbRenseignes > 1 ? 's' : ''} renseigné${pariteConsolidee.nbRenseignes > 1 ? 's' : ''} — saisir le genre dans Pool RH`}
            />
            <PanelStat
              darkMode={dm}
              label="Turn-over annuel"
              value={turnOverConsolide.niveau !== 'neutral' ? fmtPct(turnOverConsolide.turnOver) : '—'}
              level={turnOverConsolide.niveau}
              hint={turnOverConsolide.niveau !== 'neutral'
                ? `${turnOverConsolide.entrees} entrée${turnOverConsolide.entrees > 1 ? 's' : ''} / ${turnOverConsolide.sorties} sortie${turnOverConsolide.sorties > 1 ? 's' : ''} · effectif moyen ${turnOverConsolide.effectifMoyen}`
                : 'saisir année d\'entrée/sortie dans Pool RH'}
            />
            <PanelStat
              darkMode={dm}
              label="Effectif consolidé"
              value={fmtNum(totaux.nbAgents)}
              hint={`${pariteConsolidee.nbRenseignes} avec genre · ${turnOverConsolide.nbDateEntreeRenseignee} avec date d'entrée`}
              level="info"
            />
          </div>

          {/* Barre H/F consolidée */}
          {pariteConsolidee.nbRenseignes >= 3 && (
            <div className={`rounded-xl p-3 mb-4 ${surface.muted(dm)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Répartition H/F consolidée
                </span>
                <div className={`flex items-center gap-3 text-[10px] ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-2 rounded bg-blue-400" /> H {fmtPct(pariteConsolidee.pctH)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-2 rounded bg-pink-400" /> F {fmtPct(pariteConsolidee.pctF)}
                  </span>
                </div>
              </div>
              <ParitéBar pctH={pariteConsolidee.pctH} pctF={pariteConsolidee.pctF} height="h-4" />
            </div>
          )}

          {dataMissing && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-blue-950/30 border-l-blue-500' : 'bg-blue-50 border-l-blue-500'
            }`}>
              <Info size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-blue-300' : 'text-blue-600'}`} />
              <p className={`text-sm ${dm ? 'text-blue-200' : 'text-blue-800'}`}>
                Aucun agent ne dispose de <strong>genre</strong> ou <strong>date d'entrée</strong> saisis.
                Renseigner ces champs dans <strong>Pool RH</strong> (sélecteur genre + années entrée/sortie) pour activer
                les indicateurs parité et turn-over.
              </p>
            </div>
          )}

          {totaux.nbServicesParitéDanger > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbServicesParitéDanger} entité{totaux.nbServicesParitéDanger > 1 ? 's' : ''}</strong> en
                déséquilibre marqué (index &lt; {seuilsParite.desequilibre} %). Risque non-conformité loi Rixain (30 % cadres dirigeants 2027).
              </p>
            </div>
          )}

          {totaux.nbServicesTurnOverDanger > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <ArrowDownUp size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbServicesTurnOverDanger} entité{totaux.nbServicesTurnOverDanger > 1 ? 's' : ''}</strong> avec un turn-over critique
                (&gt; {seuilsTurnOver.danger} %). Coût caché significatif — audit climat social + plan de fidélisation à engager.
              </p>
            </div>
          )}
        </>
      }
    >
      {parEntite.length === 0 ? (
        <p className={text.muted(dm)}>Aucune entité à analyser. Renseignez du personnel dans la Direction, le Pôle Ressources, les services ou le Pool RH pour activer les indicateurs.</p>
      ) : (
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm}>Entité</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Effectif</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Parité H/F</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Index</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Entrées</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Sorties</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Turn-over</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {parEntite.map(e => {
              const tonePar = statusToken[e.parite.niveau](dm);
              const toneTo  = statusToken[e.turnOver.niveau](dm);
              const IconPar = e.parite.niveau === 'danger' ? AlertTriangle
                : e.parite.niveau === 'warning' ? AlertCircle
                : e.parite.niveau === 'success' ? CheckCircle2
                : Info;
              const IconTo  = e.turnOver.niveau === 'danger' ? AlertTriangle
                : e.turnOver.niveau === 'warning' ? AlertCircle
                : e.turnOver.niveau === 'success' ? CheckCircle2
                : Info;
              const idxClass = e.parite.niveau === 'danger'
                ? (dm ? 'text-rose-300' : 'text-rose-700')
                : e.parite.niveau === 'warning'
                  ? (dm ? 'text-amber-300' : 'text-amber-700')
                  : e.parite.niveau === 'success'
                    ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                    : (dm ? 'text-zinc-500' : 'text-slate-400');
              const toClass = e.turnOver.niveau === 'danger'
                ? (dm ? 'text-rose-300' : 'text-rose-700')
                : e.turnOver.niveau === 'warning'
                  ? (dm ? 'text-amber-300' : 'text-amber-700')
                  : e.turnOver.niveau === 'success'
                    ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                    : (dm ? 'text-zinc-500' : 'text-slate-400');
              return (
                <DataTable.Row key={e.id} level={e.turnOver.niveau === 'neutral' ? undefined : e.turnOver.niveau}>
                  <DataTable.Cell darkMode={dm} bold>
                    <div className="flex flex-col gap-0.5">
                      <span>{e.nom}</span>
                      <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {e.parite.nbRenseignes} avec genre · {e.turnOver.nbDateEntreeRenseignee} avec date entrée
                      </span>
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="center" mono>{e.nbAgents}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm}>
                    {e.parite.nbRenseignes >= 3 ? (
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        <ParitéBar pctH={e.parite.pctH} pctF={e.parite.pctF} />
                        <span className={`text-[10px] font-mono ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {e.parite.nbH} H · {e.parite.nbF} F
                        </span>
                      </div>
                    ) : (
                      <span className={`text-[11px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>échantillon &lt; 3</span>
                    )}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold className={idxClass}>
                    {e.parite.nbRenseignes >= 3 ? fmtPct(e.parite.indexParite) : '—'}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="center">
                    <HoverTip
                      darkMode={dm}
                      title={`${e.nom} — Parité`}
                      description={recommendationParite(e.parite.niveau, e.parite.indexParite, e.parite.genreMajoritaire, e.parite.nbRenseignes)}
                      level={e.parite.niveau}
                    >
                      <span className={`inline-flex items-center justify-center p-1 rounded-full ${tonePar.bg}`}>
                        <IconPar size={14} strokeWidth={1.5} className={tonePar.accent} />
                      </span>
                    </HoverTip>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>
                    {e.turnOver.niveau !== 'neutral' ? (
                      <Pill variant={e.turnOver.entrees > 0 ? 'info' : 'neutral'} size="xs" darkMode={dm}>
                        +{e.turnOver.entrees}
                      </Pill>
                    ) : '—'}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>
                    {e.turnOver.niveau !== 'neutral' ? (
                      <Pill variant={e.turnOver.sorties > 0 ? 'warning' : 'neutral'} size="xs" darkMode={dm}>
                        −{e.turnOver.sorties}
                      </Pill>
                    ) : '—'}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold className={toClass}>
                    {e.turnOver.niveau !== 'neutral' ? fmtPct(e.turnOver.turnOver) : '—'}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="center">
                    <HoverTip
                      darkMode={dm}
                      title={`${e.nom} — Turn-over`}
                      description={recommendationTurnOver(e.turnOver.niveau, e.turnOver.turnOver, e.turnOver.entrees, e.turnOver.sorties, e.turnOver.effectifMoyen)}
                      level={e.turnOver.niveau}
                    >
                      <span className={`inline-flex items-center justify-center p-1 rounded-full ${toneTo.bg}`}>
                        <IconTo size={14} strokeWidth={1.5} className={toneTo.accent} />
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
              <DataTable.Cell darkMode={dm}>
                {pariteConsolidee.nbRenseignes >= 3
                  ? <ParitéBar pctH={pariteConsolidee.pctH} pctF={pariteConsolidee.pctF} />
                  : '—'}
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>
                {pariteConsolidee.nbRenseignes >= 3 ? fmtPct(pariteConsolidee.indexParite) : '—'}
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} />
              <DataTable.Cell darkMode={dm} align="right" mono bold>
                {turnOverConsolide.niveau !== 'neutral' ? `+${turnOverConsolide.entrees}` : '—'}
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>
                {turnOverConsolide.niveau !== 'neutral' ? `−${turnOverConsolide.sorties}` : '—'}
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>
                {turnOverConsolide.niveau !== 'neutral' ? fmtPct(turnOverConsolide.turnOver) : '—'}
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} />
            </DataTable.Row>
          </DataTable.Foot>
        </DataTable>
      )}

      <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        <span>
          Index parité = % du genre minoritaire (50 % = parité parfaite). Turn-over = (entrées + sorties) / 2 ÷ effectif moyen
          (norme APEC). Sources : champs <code>genre</code>, <code>dateEntree</code>, <code>dateSortie</code> des fiches agents.
        </span>
      </p>
    </DataPanel>
  );
}
