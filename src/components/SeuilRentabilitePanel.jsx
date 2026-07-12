import React, { useMemo } from 'react';
import { Target, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, Sliders } from 'lucide-react';
import {
  calculerSeuilRentabilite,
  recommendationSeuil,
  RATIO_CF_DEFAULT,
  SEUIL_MARGE_CONFORT,
} from '../utils/seuilRentabilite';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import Term from './ui/Term';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const fmtPct = (n) => (n === null || n === undefined ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(1)} %`);
const fmtEff = (n) => (n === null || n === undefined ? '—' : n.toLocaleString('fr-FR'));

/**
 * <SeuilRentabilitePanel /> — Point Mort par filière (Axe 3).
 *
 * Modélise la décomposition coût fixe / coût variable du coût complet par
 * service, calcule l'effectif minimal pour atteindre l'équilibre (point mort)
 * et la marge de sécurité associée. Permet la saisie inline du ratio CF/CV
 * par service (persisté dans globalParams.ratioChargesFixesParService).
 */
export default function SeuilRentabilitePanel({
  darkMode = false, services = [], getBudgetDirection, getBudgetService,
  globalParams, setGlobalParams,
}) {
  const dm = darkMode;

  const budgetSiege = useMemo(() => {
    if (!getBudgetDirection) return { total: 0 };
    try { return getBudgetDirection(); } catch { return { total: 0 }; }
  }, [getBudgetDirection]);

  const result = useMemo(
    () => calculerSeuilRentabilite(services, budgetSiege, getBudgetService, globalParams),
    [services, budgetSiege, getBudgetService, globalParams]
  );

  const { totaux } = result;
  const totalLevel = totaux.nbServicesEnDanger > 0 ? 'danger'
    : totaux.nbServicesEnWarning > 0 ? 'warning' : 'success';

  const updateRatio = (serviceId, value) => {
    if (!setGlobalParams) return;
    let v = parseFloat(value);
    if (!Number.isFinite(v)) v = RATIO_CF_DEFAULT;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    const old = globalParams?.ratioChargesFixesParService || {};
    setGlobalParams({
      ...globalParams,
      ratioChargesFixesParService: { ...old, [serviceId]: v },
    });
  };

  const exportCSV = () => {
    const lignes = [
      ['Seuil de Rentabilité — Point Mort par filière'],
      [`Ratio CF par défaut : ${RATIO_CF_DEFAULT} %`],
      [`Clé de répartition siège : ${globalParams?.cleRepartition?.type || 'etp'}`],
      [],
      ['Service', 'Effectif', 'Recettes', 'Coût complet', 'Ratio CF (%)',
        'Charges fixes', 'Charges variables', 'Recette/étud.', 'CV/étud.', 'Marge unitaire',
        'Point mort (étud.)', 'Étud. manquants', 'Marge sécurité (%)', 'Niveau'],
      ...result.parService.map(s => [
        s.nom, s.effectif, s.recettes, s.coutComplet, s.ratioCF,
        s.chargesFixes, s.chargesVariables,
        s.recetteParEtudiant, s.cvParEtudiant, s.margeUnitaire,
        s.pointMortEffectif ?? '—',
        s.etudiantsManquants ?? '—',
        s.margeSecuritePct ?? '—',
        s.niveau,
      ]),
      [],
      ['TOTAL CONSOLIDÉ', totaux.totalEffectif, totaux.totalRecettes, totaux.totalCoutComplet, '',
        totaux.totalChargesFixes, totaux.totalChargesVariables, '', '', '',
        totaux.pointMortConsolide ?? '—',
        totaux.etudiantsManquantsTotal ?? '—',
        totaux.margeSecuriteMoyennePct ?? '—', ''],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `seuil_rentabilite_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputCls = `w-16 px-2 py-1 rounded-md text-xs text-right ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`;

  return (
    <DataPanel
      darkMode={dm}
      icon={Target}
      title="Seuil de Rentabilité (Point Mort) par filière"
      subtitle="Effectif minimal nécessaire pour couvrir les charges fixes — alerte automatique sous le seuil"
      level={totalLevel}
      help="On décompose le coût complet en charges fixes (structure, RH permanents) et variables (consommables, restauration). L'effectif minimum d'équilibre est CF ÷ marge unitaire sur coût variable. Sous ce seuil, la promo est en perte structurelle."
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
              label="Point mort consolidé"
              value={fmtEff(totaux.pointMortConsolide)}
              hint={
                totaux.pointMortConsolide !== null
                  ? `Effectif global d'équilibre — actuellement ${totaux.totalEffectif} étud.`
                  : 'Marge unitaire globale ≤ 0 — point mort inatteignable'
              }
              level={totaux.pointMortConsolide === null ? 'danger' : 'info'}
            />
            <PanelStat
              darkMode={dm}
              label="Marge de sécurité moyenne"
              value={fmtPct(totaux.margeSecuriteMoyennePct)}
              level={
                totaux.margeSecuriteMoyennePct === null ? 'danger'
                : totaux.margeSecuriteMoyennePct < 0 ? 'danger'
                : totaux.margeSecuriteMoyennePct < SEUIL_MARGE_CONFORT ? 'warning'
                : 'success'
              }
              hint={`Cible ≥ ${SEUIL_MARGE_CONFORT} % pour absorber un aléa de recrutement`}
            />
            <PanelStat
              darkMode={dm}
              label="Filières sous le seuil"
              value={`${totaux.nbServicesEnDanger} / ${result.parService.length}`}
              level={totaux.nbServicesEnDanger > 0 ? 'danger' : totaux.nbServicesEnWarning > 0 ? 'warning' : 'success'}
              hint={
                totaux.nbServicesEnDanger > 0
                  ? `${totaux.nbServicesEnDanger} en perte structurelle`
                  : totaux.nbServicesEnWarning > 0
                    ? `${totaux.nbServicesEnWarning} en marge fragile`
                    : 'Toutes les filières sécurisées'
              }
            />
          </div>

          {totaux.nbServicesEnDanger > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbServicesEnDanger} filière{totaux.nbServicesEnDanger > 1 ? 's sont' : ' est'}</strong> sous le
                <Term darkMode={dm}> point mort</Term> :{' '}
                {totaux.etudiantsManquantsTotal !== null && totaux.etudiantsManquantsTotal > 0
                  ? `il manque ${totaux.etudiantsManquantsTotal} étudiant${totaux.etudiantsManquantsTotal > 1 ? 's' : ''} consolidé${totaux.etudiantsManquantsTotal > 1 ? 's' : ''} pour atteindre l'équilibre.`
                  : 'la marge unitaire est insuffisante pour absorber les charges fixes.'}
                {' '}Renégocier le tarif OPCO/Région ou rationaliser les charges directes.
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
          {/* Saisie ratio CF par service */}
          <div className={`mb-4 ${surface.muted(dm)} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Sliders size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
              <h4 className={`text-sm font-bold ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
                Ratio Charges Fixes / Coût Complet (%) par service
              </h4>
              <HoverTip
                darkMode={dm}
                title="Part des charges fixes dans le coût complet"
                description={`Défaut : ${RATIO_CF_DEFAULT} % (typique organismes de formation : RH permanent + structure dominent). Ajuster selon votre réalité (ex. 90 % si forte structure permanente, 50 % si recours massif vacataires + consommables).`}
                level="info"
              >
                <Info size={12} strokeWidth={1.5} className={dm ? 'text-zinc-500' : 'text-slate-400'} />
              </HoverTip>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map(s => {
                const value = globalParams?.ratioChargesFixesParService?.[s.id] ?? '';
                return (
                  <label key={s.id} className="flex items-center justify-between gap-2">
                    <span className={`text-xs ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{s.nom}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min="0" max="100" step="5"
                        className={inputCls} value={value}
                        placeholder={String(RATIO_CF_DEFAULT)}
                        onChange={e => updateRatio(s.id, e.target.value)}
                        disabled={!setGlobalParams}
                      />
                      <span className={`text-xs ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>%</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm}>Service</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Effectif</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Recette/étud.</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Charges fixes</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Marge unitaire</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Point mort</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Marge sécurité</DataTable.HeadCell>
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
                const msColor = s.margeSecuritePct === null
                  ? (dm ? 'text-zinc-500' : 'text-slate-400')
                  : s.margeSecuritePct < 0
                    ? (dm ? 'text-rose-300' : 'text-rose-700')
                    : s.margeSecuritePct < SEUIL_MARGE_CONFORT
                      ? (dm ? 'text-amber-300' : 'text-amber-700')
                      : (dm ? 'text-emerald-300' : 'text-emerald-700');
                return (
                  <DataTable.Row key={s.id} level={s.niveau === 'neutral' ? undefined : s.niveau}>
                    <DataTable.Cell darkMode={dm} bold>{s.nom}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center" mono>{s.effectif}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.recetteParEtudiant)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {fmt(s.chargesFixes)}
                      <span className={`ml-1 text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>({s.ratioCF}%)</span>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={s.margeUnitaire > 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')}>
                      {s.margeUnitaire >= 0 ? '+' : ''}{fmt(s.margeUnitaire)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center" mono>
                      <Pill variant={s.niveau === 'danger' ? 'danger' : s.niveau === 'warning' ? 'warning' : 'info'} size="xs" darkMode={dm}>
                        {fmtEff(s.pointMortEffectif)}
                      </Pill>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={msColor}>
                      {fmtPct(s.margeSecuritePct)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        darkMode={dm}
                        title={`${s.nom} — ${s.niveau === 'neutral' ? 'Indicateur indisponible' : 'Marge de sécurité'}`}
                        description={recommendationSeuil(s.niveau, s.etudiantsManquants, s.margeSecuritePct)}
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
                <DataTable.Cell darkMode={dm} align="center" mono bold>{totaux.totalEffectif}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.totalChargesFixes)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
                <DataTable.Cell darkMode={dm} align="center" mono bold>{fmtEff(totaux.pointMortConsolide)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(totaux.margeSecuriteMoyennePct)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              Le <Term darkMode={dm}>point mort</Term> est calculé en effectif (CF ÷ marge sur coût variable par étudiant).
              La <Term id="marge_securite" darkMode={dm}>marge de sécurité</Term> mesure la résilience de la promo face à un
              recrutement décevant : ≥ {SEUIL_MARGE_CONFORT} % = confort, &lt; 0 = perte structurelle. Le ratio CF/CV est
              ajustable par service ci-dessus.
            </span>
          </p>
        </>
      )}
    </DataPanel>
  );
}
