import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, FileBarChart } from 'lucide-react';
import { calculerResteAEngager, recommendationRAE } from '../utils/resteAEngager';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Term from './ui/Term';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const pct = (n) => `${(n || 0).toFixed(1)} %`;

/**
 * <ResteAEngagerPanel /> — Suivi du Reste à Engager (Axe 9).
 *
 * Vue novice :
 *   - Hero status global (✓/⚠/✕) basé sur le taux d'engagement consolidé
 *   - 3 KPIs hero (Budget total / Engagements ouverts / RAE consolidé)
 *   - Tableau par entité avec barre de progression colorée
 *   - Recommandation contextuelle pour chaque entité en alerte
 */
export default function ResteAEngagerPanel({
  darkMode = false, direction, services, poleSupport, engagements, globalParams,
}) {
  const dm = darkMode;

  const rae = useMemo(
    () => calculerResteAEngager(direction, services, poleSupport, engagements, globalParams),
    [direction, services, poleSupport, engagements, globalParams]
  );

  const totalLevel = rae.total.niveau === 'overrun' || rae.total.niveau === 'danger'
    ? 'danger'
    : rae.total.niveau === 'warning' ? 'warning' : 'success';

  const enAlerte = rae.entites.filter(e => e.niveau === 'overrun' || e.niveau === 'danger');

  return (
    <DataPanel
      darkMode={dm}
      icon={ShieldCheck}
      title="Reste à Engager (RAE)"
      subtitle="Marge disponible pour de nouveaux engagements avant saturation budgétaire"
      level={totalLevel}
      help="Pour chaque entité, le RAE = Budget exploitation annuel − Engagements ouverts. Au-delà de 90 %, alerte ; au-delà de 100 %, dépassement à régulariser."
      collapsible
      summary={
        <>
          {/* Hero KPIs consolidés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Budget exploitation"
              value={fmt(rae.total.budget)}
              hint="Total annuel exploitation toutes entités"
            />
            <PanelStat
              darkMode={dm}
              label="Engagements ouverts"
              value={fmt(rae.total.engagements)}
              hint="Somme des engagements non soldés"
              level="warning"
            />
            <PanelStat
              darkMode={dm}
              label="Reste à Engager"
              value={fmt(rae.total.reste)}
              level={totalLevel}
              delta={pct(rae.total.taux)}
              deltaLabel="taux d'engagement"
              hint={recommendationRAE(rae.total.niveau, rae.total.taux)}
            />
          </div>

          {/* Bannière alerte si entités en danger */}
          {enAlerte.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{enAlerte.length} entité{enAlerte.length > 1 ? 's' : ''}</strong> en
                {enAlerte.some(e => e.niveau === 'overrun') ? ' dépassement budgétaire' : ' pré-saturation'}.
                Stopper les nouveaux engagements ou solliciter un avenant DAF.
              </p>
            </div>
          )}
        </>
      }
      emptyState={null}
    >
      {rae.entites.length === 0 ? (
        <p className={text.muted(dm)}>Aucune entité à analyser. Définissez vos services et postes d'exploitation.</p>
      ) : (
        <>
          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm}>Entité</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Budget</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Engagés</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">RAE</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Taux</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {rae.entites.map(e => {
                const tone = statusToken[
                  e.niveau === 'overrun' ? 'danger' : e.niveau
                ](dm);
                const Icon = e.niveau === 'overrun' || e.niveau === 'danger'
                  ? AlertTriangle
                  : e.niveau === 'warning' ? AlertCircle : CheckCircle2;
                return (
                  <DataTable.Row key={e.id} level={e.niveau === 'overrun' ? 'danger' : e.niveau}>
                    <DataTable.Cell darkMode={dm} bold>
                      <span className="inline-flex items-center gap-2">
                        {e.type === 'siege' && <span className={`text-[10px] px-1.5 py-0.5 rounded ${dm ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>Siège</span>}
                        {e.type === 'pole' && <span className={`text-[10px] px-1.5 py-0.5 rounded ${dm ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>Pôle</span>}
                        {e.nom}
                        {e.count > 0 && (
                          <span className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>· {e.count} eng.</span>
                        )}
                      </span>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(e.budget)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(e.engagements)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={tone.accent}>
                      {fmt(e.reste)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <ProgressBar taux={e.taux} niveau={e.niveau} dm={dm} />
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        darkMode={dm}
                        title={`${e.nom} — ${pct(e.taux)} engagés`}
                        description={recommendationRAE(e.niveau, e.taux)}
                        level={e.niveau === 'overrun' ? 'danger' : e.niveau}
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
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(rae.total.budget)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(rae.total.engagements)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(rae.total.reste)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="center" mono>{pct(rae.total.taux)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>
          <p className={`mt-3 text-[10px] italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            Le <Term darkMode={dm}>RAE</Term> est calculé sur le budget d'exploitation annuel (charges directes hors masse salariale).
            Saisir / mettre à jour les engagements dans la section Engagements de TabAnalyse.
            Seuils : ✓ &lt; 70 % · ⚠ 70-90 % · ✕ &gt; 90 %.
          </p>
        </>
      )}
    </DataPanel>
  );
}

// ── Sous-composant : barre de progression colorée ────────────────────
const ProgressBar = ({ taux, niveau, dm }) => {
  const widthPct = Math.min(taux, 120); // cap visuel à 120 % pour overrun
  const color = niveau === 'overrun' ? 'bg-rose-600'
    : niveau === 'danger' ? 'bg-rose-500'
    : niveau === 'warning' ? 'bg-amber-500'
    : 'bg-emerald-500';
  const trackColor = dm ? 'bg-zinc-800' : 'bg-slate-200';
  return (
    <div className="flex items-center gap-2 w-full max-w-[140px] mx-auto">
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${trackColor} relative`}>
        <div
          className={`h-full ${color} ${niveau === 'overrun' ? 'animate-pulse' : ''} transition-all`}
          style={{ width: `${widthPct}%` }}
        />
        {/* Marker à 100 % */}
        {taux > 0 && (
          <div className={`absolute top-0 bottom-0 w-px ${dm ? 'bg-zinc-500' : 'bg-slate-400'}`} style={{ left: '83.3%' }} />
        )}
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${
        niveau === 'overrun' || niveau === 'danger' ? (dm ? 'text-rose-300' : 'text-rose-600')
        : niveau === 'warning' ? (dm ? 'text-amber-300' : 'text-amber-600')
        : (dm ? 'text-emerald-300' : 'text-emerald-600')
      }`}>
        {pct(taux)}
      </span>
    </div>
  );
};
