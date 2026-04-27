import React, { useMemo, useState } from 'react';
import { Split, Settings, Download, AlertCircle, Info } from 'lucide-react';
import {
  calculerRepartition, calculerCoutCompletParService, TYPES_CLES,
} from '../utils/clesRepartition';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import { surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const pct = (n) => `${(n || 0).toFixed(1)} %`;

/**
 * <ClesRepartitionPanel /> — S6.3 Réallocation overhead siège → services.
 *
 * Affiche pour chaque service :
 *   - Charges directes (depuis budget)
 *   - Recettes directes
 *   - Quote-part siège (calculée selon clé)
 *   - Coût complet (charges + quote-part)
 *   - Solde direct vs solde complet (impact de la réallocation visible)
 *
 * Permet de tester plusieurs clés sans persister (la clé reste paramétrable
 * via globalParams.cleRepartition pour la consolidation finale).
 */
export default function ClesRepartitionPanel({
  darkMode = false, services = [], getBudgetDirection, getBudgetService,
  globalParams, setGlobalParams,
}) {
  const dm = darkMode;
  const [showParams, setShowParams] = useState(false);

  const cleActive = globalParams?.cleRepartition?.type || 'etp';
  const params = globalParams?.cleRepartition?.params || {};

  // Budget siège à réallouer (charges directes du Siège)
  const budgetSiege = useMemo(() => {
    if (!getBudgetDirection) return { total: 0 };
    try { return getBudgetDirection(); } catch { return { total: 0 }; }
  }, [getBudgetDirection]);

  const result = useMemo(
    () => calculerCoutCompletParService(services, budgetSiege, getBudgetService, cleActive, params),
    [services, budgetSiege, getBudgetService, cleActive, params]
  );

  const updateCle = (type) => {
    if (!setGlobalParams) return;
    setGlobalParams({
      ...globalParams,
      cleRepartition: { type, params: globalParams?.cleRepartition?.params || {} },
    });
  };

  const updateParam = (paramKey, serviceId, value) => {
    if (!setGlobalParams) return;
    const v = parseFloat(value) || 0;
    const oldParams = globalParams?.cleRepartition?.params || {};
    const oldMap = oldParams[paramKey] || {};
    setGlobalParams({
      ...globalParams,
      cleRepartition: {
        type: cleActive,
        params: { ...oldParams, [paramKey]: { ...oldMap, [serviceId]: v } },
      },
    });
  };

  const exportCSV = () => {
    const cleLabel = TYPES_CLES.find(t => t.id === cleActive)?.label || cleActive;
    const lignes = [
      [`Clé de répartition appliquée : ${cleLabel}`],
      [`Budget siège réalloué : ${fmt(budgetSiege.total)}`],
      [],
      ['Service', 'Charges directes', 'Recettes', 'Quote-part siège', 'Coût complet', 'Solde direct', 'Solde complet', 'Marge directe %'],
      ...result.parService.map(s => [
        s.nom, s.chargesDirectes, s.recettesDirectes, s.quotePartSiege,
        s.coutComplet, s.soldeDirect, s.soldeComplet, s.marge.toFixed(1),
      ]),
      [],
      ['TOTAL', result.totalCharges, result.totalRecettes, result.totalQuotePart,
        result.totalCharges + result.totalQuotePart, '', '', ''],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cles_repartition_${cleActive}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cleMeta = TYPES_CLES.find(t => t.id === cleActive);
  const inputCls = `w-20 px-2 py-1 rounded-md text-xs text-right ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`;

  // Détection : la clé manuel doit-elle afficher un avertissement si la somme ≠ 100 ?
  const sommePctManuel = cleActive === 'manuel'
    ? Object.values(params.pourcentagesParService || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    : null;
  const manuelDeviation = sommePctManuel != null && Math.abs(sommePctManuel - 100) > 0.5;

  return (
    <DataPanel
      darkMode={dm}
      icon={Split}
      title="Clés de Répartition (Coût Complet)"
      subtitle="Réallocation des charges siège vers les services pour obtenir le coût complet par centre opérationnel"
      level="info"
      help="Le siège (direction, support, fonctions transversales) supporte des charges qui bénéficient à tous les services. La clé de répartition permet de leur allouer une quote-part équitable et d'obtenir le coût complet par service."
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
              label="Budget siège à répartir"
              value={fmt(budgetSiege.total)}
              hint="Total des charges du Siège qui seront réalloués sur les services"
            />
            <PanelStat
              darkMode={dm}
              label="Clé active"
              value={cleMeta?.label.split(' (')[0] || '—'}
              level="info"
              hint={cleMeta?.hint}
            />
            <PanelStat
              darkMode={dm}
              label="Coût complet total"
              value={fmt(result.totalCharges + result.totalQuotePart)}
              hint={`${fmt(result.totalCharges)} de charges directes + ${fmt(result.totalQuotePart)} de quote-part siège`}
            />
          </div>

          {/* Sélecteur de clé */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
            {TYPES_CLES.map(t => (
              <HoverTip key={t.id} darkMode={dm} content={t.hint} delay={500}>
                <button
                  onClick={() => updateCle(t.id)}
                  disabled={!setGlobalParams}
                  className={`w-full text-left px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    cleActive === t.id
                      ? (dm ? 'bg-indigo-900/40 border-indigo-600 text-indigo-200' : 'bg-indigo-50 border-indigo-400 text-indigo-800')
                      : (dm ? 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400 hover:border-zinc-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')
                  }`}
                >
                  {t.label.split(' (')[0]}
                </button>
              </HoverTip>
            ))}
          </div>

          {manuelDeviation && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500'}`}>
              <AlertCircle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
              <p className={`text-sm ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
                Somme actuelle : <strong>{sommePctManuel.toFixed(1)} %</strong>. Ajustez les pourcentages pour atteindre 100 %.
              </p>
            </div>
          )}
        </>
      }
    >
      {/* Inputs custom selon clé */}
      {(cleActive === 'surface' || cleActive === 'heures' || cleActive === 'manuel') && (
        <div className={`mb-4 ${surface.muted(dm)} rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Settings size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
            <h4 className={`text-sm font-bold ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
              {cleActive === 'surface' && 'Surfaces par service (m²)'}
              {cleActive === 'heures' && 'Heures stagiaires par service'}
              {cleActive === 'manuel' && 'Pourcentages de répartition (somme = 100 %)'}
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {services.map(s => {
              const paramKey = cleActive === 'surface' ? 'surfacesParService'
                : cleActive === 'heures' ? 'heuresParService'
                : 'pourcentagesParService';
              const value = params[paramKey]?.[s.id] || 0;
              return (
                <label key={s.id} className="flex items-center justify-between gap-2">
                  <span className={`text-xs ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{s.nom}</span>
                  <input
                    type="number" min="0" step={cleActive === 'manuel' ? '0.1' : '1'}
                    className={inputCls} value={value}
                    onChange={e => updateParam(paramKey, s.id, e.target.value)}
                    disabled={!setGlobalParams}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Tableau de résultat */}
      {services.length === 0 ? (
        <p className={text.muted(dm)}>Aucun service à analyser. Créez vos services dans l'onglet Budget.</p>
      ) : (
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm}>Service</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Charges directes</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Recettes</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Quote-part siège</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Coût complet</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Solde direct</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Solde complet</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">% Quote-part</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {result.parService.map(s => {
              const dispo = result.repartition.distribution[s.id];
              const niveauDirect = s.soldeDirect >= 0 ? 'success' : 'danger';
              const niveauComplet = s.soldeComplet >= 0 ? 'success' : 'danger';
              return (
                <DataTable.Row key={s.id}>
                  <DataTable.Cell darkMode={dm} bold>{s.nom}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.chargesDirectes)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.recettesDirectes)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono className={dm ? 'text-violet-300' : 'text-violet-700'}>
                    +{fmt(s.quotePartSiege)}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(s.coutComplet)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono className={niveauDirect === 'success' ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')}>
                    {s.soldeDirect >= 0 ? '+' : ''}{fmt(s.soldeDirect)}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold className={niveauComplet === 'success' ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')}>
                    {s.soldeComplet >= 0 ? '+' : ''}{fmt(s.soldeComplet)}
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="center">
                    <Pill variant="info" size="xs" darkMode={dm}>{pct(dispo?.pct || 0)}</Pill>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable.Body>
          <DataTable.Foot darkMode={dm}>
            <DataTable.Row highlight>
              <DataTable.Cell darkMode={dm} bold>TOTAL</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totalCharges)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totalRecettes)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totalQuotePart)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totalCharges + result.totalQuotePart)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totalRecettes - result.totalCharges)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totalRecettes - result.totalCharges - result.totalQuotePart)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} />
            </DataTable.Row>
          </DataTable.Foot>
        </DataTable>
      )}

      <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        <span>
          Le <strong>coût complet</strong> est utilisé pour mesurer la rentabilité réelle d'un service en intégrant
          la quote-part de structure (siège, support administratif, fonctions transversales). Méthode standard CCN 66 :
          répartition par ETP. La clé de répartition est persistée dans <code>globalParams.cleRepartition</code>.
        </span>
      </p>
    </DataPanel>
  );
}
