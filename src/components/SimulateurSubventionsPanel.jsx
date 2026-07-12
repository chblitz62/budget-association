import React, { useEffect, useMemo, useState } from 'react';
import { Zap, RotateCcw, AlertTriangle, AlertCircle, CheckCircle2, Info, Download, TrendingDown } from 'lucide-react';
import {
  extraireSubventions, scenariosVides, simulerImpactTresorerie,
  niveauSimulation, recommendationSimulation,
} from '../utils/simulateurSubventions';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const fmtSign = (n) => (n >= 0 ? '+' : '') + Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const MOIS_LABELS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MOIS_LABELS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/**
 * <SimulateurSubventionsPanel /> — Stress-Test trésorerie ciblé subventions (Axe 2).
 *
 * Permet de simuler retard et coupe sur des subventions spécifiques (Région,
 * OPCO, CPOM…) et de mesurer l'impact mois par mois sur le cash. Distinct du
 * stressTest global (TopBar) qui applique un % uniforme à toutes les subventions.
 */
export default function SimulateurSubventionsPanel({
  darkMode = false,
  direction, services = [], poleSupport = null, tresorerie,
}) {
  const dm = darkMode;

  const subventions = useMemo(
    () => extraireSubventions(direction, services, poleSupport),
    [direction, services, poleSupport]
  );

  const [scenarios, setScenarios] = useState({});

  // Initialise scénarios vides quand de nouvelles subventions apparaissent
  const subIds = subventions.map(s => s.id).join('|');
  useEffect(() => {
    setScenarios(prev => {
      const next = { ...prev };
      let changed = false;
      subventions.forEach(s => {
        if (!next[s.id]) { next[s.id] = { decalageMois: 0, coupePct: 0 }; changed = true; }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subIds]);

  const result = useMemo(
    () => simulerImpactTresorerie(tresorerie?.mois, subventions, scenarios),
    [tresorerie, subventions, scenarios]
  );

  const totalDecaissements = tresorerie?.totalDecaissements || 0;
  const niveau = niveauSimulation(result.metriques, totalDecaissements);
  const reco = recommendationSimulation(niveau, result.metriques);

  // Détection des scénarios actifs
  const scenariosActifs = subventions.filter(s => {
    const sc = scenarios[s.id];
    return sc && (sc.decalageMois > 0 || sc.coupePct > 0);
  });

  const updateScenario = (id, field, value) => {
    const v = parseFloat(value) || 0;
    setScenarios(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: v },
    }));
  };

  const resetAll = () => setScenarios(scenariosVides(subventions));

  const exportCSV = () => {
    const lignes = [
      ['Stress-Test Trésorerie ciblé Subventions — comparaison avant / après'],
      [`Niveau global : ${niveau.toUpperCase()} — ${reco}`],
      [],
      ['Scénarios actifs'],
      ['Subvention', 'Source', 'Montant annuel', 'Retard (mois)', 'Coupe (%)'],
      ...scenariosActifs.map(s => [
        s.nom, s.source, s.montantAnnuel,
        scenarios[s.id]?.decalageMois ?? 0,
        scenarios[s.id]?.coupePct ?? 0,
      ]),
      [],
      ['Mois', 'Encaissements base', 'Encaissements ajustés', 'Delta', 'Solde base', 'Solde ajusté', 'Cumul base', 'Cumul ajusté'],
      ...result.moisAjustes.map(m => [
        m.nom, m.encaissementsBase, m.encaissementsAjuste, m.deltaMois,
        m.soldeBase, m.soldeAjuste, m.cumulBase, m.cumulAjuste,
      ]),
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `stress_test_subventions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputCls = `w-16 px-2 py-1 rounded-md text-xs text-right tabular-nums ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`;

  const NiveauIcon = niveau === 'danger' ? AlertTriangle
    : niveau === 'warning' ? AlertCircle
    : niveau === 'info' ? Info
    : CheckCircle2;

  return (
    <DataPanel
      darkMode={dm}
      icon={Zap}
      title="Simulateur Trésorerie — Stress-Test ciblé Subventions"
      subtitle="Anticiper l'impact d'un retard de paiement Région ou d'une coupe OPCO sur le cash mensuel"
      level={niveau === 'success' ? 'success' : niveau === 'info' ? 'info' : niveau}
      help="Pour chaque subvention identifiée, simulez un retard de paiement (en mois) et/ou une coupe (en %). Le moteur recalcule le cumul mensuel et alerte sur les ruptures de cash. Distinct du stress-test global qui s'applique uniformément à toutes les subventions."
      collapsible
      actions={
        <div className="flex items-center gap-2">
          {scenariosActifs.length > 0 && (
            <button
              onClick={resetAll}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <RotateCcw size={12} strokeWidth={1.5} /> Reset
            </button>
          )}
          <button
            onClick={exportCSV}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${dm ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <Download size={12} strokeWidth={1.5} /> CSV
          </button>
        </div>
      }
      summary={
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Subventions identifiées"
              value={subventions.length.toString()}
              hint={`${scenariosActifs.length} scénario${scenariosActifs.length > 1 ? 's' : ''} actif${scenariosActifs.length > 1 ? 's' : ''}`}
            />
            <PanelStat
              darkMode={dm}
              label="Pire mois (cumul)"
              value={result.metriques.pireMois >= 0 ? fmt(result.metriques.pireMoisCumul) : '—'}
              level={result.metriques.pireMoisCumul < 0 ? 'danger' : 'success'}
              hint={result.metriques.pireMois >= 0 ? `En ${MOIS_LABELS_LONGS[result.metriques.pireMois]}` : 'Pas de creux significatif'}
            />
            <PanelStat
              darkMode={dm}
              label="Mois en rupture"
              value={result.metriques.moisEnRupture.toString()}
              level={result.metriques.moisEnRupture > 0 ? 'danger' : 'success'}
              hint={result.metriques.moisRecovery !== null
                ? `Recovery en ${MOIS_LABELS_LONGS[result.metriques.moisRecovery]}`
                : result.metriques.moisEnRupture > 0 ? 'Aucun recovery sur l\'exercice' : 'Cumul positif toute l\'année'}
            />
            <PanelStat
              darkMode={dm}
              label="Perte sèche annuelle"
              value={fmt(result.metriques.totalCoupeAnnuelle)}
              level={result.metriques.totalCoupeAnnuelle > 0 ? 'warning' : 'success'}
              hint={`Delta annuel encaissements : ${fmtSign(result.metriques.totalEncaisseManque)}`}
            />
          </div>

          {scenariosActifs.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              niveau === 'danger' ? (dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500')
              : niveau === 'warning' ? (dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500')
              : (dm ? 'bg-indigo-950/30 border-l-indigo-500' : 'bg-indigo-50 border-l-indigo-500')
            }`}>
              <NiveauIcon size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${
                niveau === 'danger' ? (dm ? 'text-rose-300' : 'text-rose-600')
                : niveau === 'warning' ? (dm ? 'text-amber-300' : 'text-amber-600')
                : (dm ? 'text-indigo-300' : 'text-indigo-600')
              }`} />
              <p className={`text-sm ${
                niveau === 'danger' ? (dm ? 'text-rose-200' : 'text-rose-800')
                : niveau === 'warning' ? (dm ? 'text-amber-200' : 'text-amber-800')
                : (dm ? 'text-indigo-200' : 'text-indigo-800')
              }`}>
                {reco}
              </p>
            </div>
          )}
        </>
      }
    >
      {subventions.length === 0 ? (
        <p className={text.muted(dm)}>
          Aucune subvention identifiée dans vos recettes. Le moteur reconnaît les libellés contenant
          : subvention, Région, OPCO, CPOM, État, département, FSE, AGEFIPH, CAF.
        </p>
      ) : (
        <>
          {/* ─── Sélecteur de scénarios ─── */}
          <div className={`mb-4 ${surface.muted(dm)} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-bold ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
                Paramètres par subvention
              </h4>
              <HoverTip
                darkMode={dm}
                title="Comment lire le tableau"
                description="Retard : nombre de mois de décalage du paiement (0 = aucun). Coupe : pourcentage du montant qui ne sera jamais versé cette année (0 = aucune coupe). Les deux peuvent se combiner."
                level="info"
              >
                <Info size={12} strokeWidth={1.5} className={dm ? 'text-zinc-500' : 'text-slate-400'} />
              </HoverTip>
            </div>
            <DataTable darkMode={dm} variant="borderless">
              <DataTable.Head>
                <DataTable.Row>
                  <DataTable.HeadCell darkMode={dm}>Subvention</DataTable.HeadCell>
                  <DataTable.HeadCell darkMode={dm}>Source</DataTable.HeadCell>
                  <DataTable.HeadCell darkMode={dm} align="right">Montant annuel</DataTable.HeadCell>
                  <DataTable.HeadCell darkMode={dm} align="center">Retard (mois)</DataTable.HeadCell>
                  <DataTable.HeadCell darkMode={dm} align="center">Coupe (%)</DataTable.HeadCell>
                </DataTable.Row>
              </DataTable.Head>
              <DataTable.Body>
                {subventions.map(s => {
                  const sc = scenarios[s.id] || { decalageMois: 0, coupePct: 0 };
                  const actif = sc.decalageMois > 0 || sc.coupePct > 0;
                  return (
                    <DataTable.Row key={s.id} level={actif ? 'warning' : undefined}>
                      <DataTable.Cell darkMode={dm} bold>{s.nom}</DataTable.Cell>
                      <DataTable.Cell darkMode={dm}>
                        <Pill size="xs" variant="neutral" darkMode={dm}>{s.source}</Pill>
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.montantAnnuel)}</DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="center">
                        <input
                          type="number" min="0" max="12" step="1"
                          className={inputCls} value={sc.decalageMois || 0}
                          onChange={e => updateScenario(s.id, 'decalageMois', e.target.value)}
                        />
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="center">
                        <input
                          type="number" min="0" max="100" step="5"
                          className={inputCls} value={sc.coupePct || 0}
                          onChange={e => updateScenario(s.id, 'coupePct', e.target.value)}
                        />
                      </DataTable.Cell>
                    </DataTable.Row>
                  );
                })}
              </DataTable.Body>
            </DataTable>
          </div>

          {/* ─── Comparaison cash mois par mois ─── */}
          {scenariosActifs.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
                <h4 className={`text-sm font-bold ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
                  Trajectoire cumulée comparée
                </h4>
              </div>
              <DataTable darkMode={dm} variant="borderless">
                <DataTable.Head>
                  <DataTable.Row>
                    <DataTable.HeadCell darkMode={dm}>Mois</DataTable.HeadCell>
                    <DataTable.HeadCell darkMode={dm} align="right">Delta encais.</DataTable.HeadCell>
                    <DataTable.HeadCell darkMode={dm} align="right">Solde base</DataTable.HeadCell>
                    <DataTable.HeadCell darkMode={dm} align="right">Solde ajusté</DataTable.HeadCell>
                    <DataTable.HeadCell darkMode={dm} align="right">Cumul base</DataTable.HeadCell>
                    <DataTable.HeadCell darkMode={dm} align="right">Cumul ajusté</DataTable.HeadCell>
                    <DataTable.HeadCell darkMode={dm} align="center">Trajectoire</DataTable.HeadCell>
                  </DataTable.Row>
                </DataTable.Head>
                <DataTable.Body>
                  {result.moisAjustes.map((m, i) => {
                    const enRupture = m.cumulAjuste < 0;
                    const cumulBaseTone = m.cumulBase >= 0 ? 'success' : 'danger';
                    return (
                      <DataTable.Row key={i} level={enRupture ? 'danger' : undefined}>
                        <DataTable.Cell darkMode={dm} bold>{MOIS_LABELS_COURTS[i]}</DataTable.Cell>
                        <DataTable.Cell darkMode={dm} align="right" mono className={
                          m.deltaMois > 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                          : m.deltaMois < 0 ? (dm ? 'text-rose-300' : 'text-rose-700')
                          : ''
                        }>
                          {m.deltaMois !== 0 ? fmtSign(m.deltaMois) : '—'}
                        </DataTable.Cell>
                        <DataTable.Cell darkMode={dm} align="right" mono>{fmtSign(m.soldeBase)}</DataTable.Cell>
                        <DataTable.Cell darkMode={dm} align="right" mono className={m.soldeAjuste < 0 ? (dm ? 'text-rose-300' : 'text-rose-700') : ''}>
                          {fmtSign(m.soldeAjuste)}
                        </DataTable.Cell>
                        <DataTable.Cell darkMode={dm} align="right" mono className={
                          cumulBaseTone === 'success' ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')
                        }>
                          {fmtSign(m.cumulBase)}
                        </DataTable.Cell>
                        <DataTable.Cell darkMode={dm} align="right" mono bold className={
                          enRupture ? (dm ? 'text-rose-300' : 'text-rose-700') : (dm ? 'text-emerald-300' : 'text-emerald-700')
                        }>
                          {fmtSign(m.cumulAjuste)}
                        </DataTable.Cell>
                        <DataTable.Cell darkMode={dm} align="center">
                          <CumulBar baseCumul={m.cumulBase} adjCumul={m.cumulAjuste} dm={dm} />
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}
                </DataTable.Body>
              </DataTable>
            </>
          )}

          <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              Le simulateur reconnaît les recettes dont le libellé contient :
              subvention, Région, OPCO, CPOM, État, département, FSE, AGEFIPH, CAF.
              Pour qu'une recette soit ciblée, ajustez son libellé dans le service concerné.
              Les retards qui dépassent décembre sont comptés en perte sèche pour l'exercice.
            </span>
          </p>
        </>
      )}
    </DataPanel>
  );
}

// ── Mini-barre comparative cumul base vs ajusté ────────────────────────
const CumulBar = ({ baseCumul, adjCumul, dm }) => {
  const max = Math.max(Math.abs(baseCumul), Math.abs(adjCumul), 1);
  const baseW = (Math.abs(baseCumul) / max) * 100;
  const adjW = (Math.abs(adjCumul) / max) * 100;
  const baseColor = baseCumul >= 0 ? 'bg-emerald-500/60' : 'bg-rose-500/60';
  const adjColor = adjCumul >= 0 ? 'bg-emerald-500' : 'bg-rose-500';
  const trackColor = dm ? 'bg-zinc-800' : 'bg-slate-200';
  return (
    <div className="flex flex-col gap-0.5 w-[80px] mx-auto">
      <div className={`h-1 rounded-full overflow-hidden ${trackColor}`}>
        <div className={`h-full ${baseColor}`} style={{ width: `${baseW}%` }} />
      </div>
      <div className={`h-1 rounded-full overflow-hidden ${trackColor}`}>
        <div className={`h-full ${adjColor}`} style={{ width: `${adjW}%` }} />
      </div>
    </div>
  );
};
