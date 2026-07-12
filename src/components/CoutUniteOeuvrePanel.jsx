import React, { useMemo } from 'react';
import { Calculator, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, GraduationCap } from 'lucide-react';
import { calculerCoutUniteOeuvre, recommendationCoutEtudiant, HEURES_STAGIAIRES_DEFAULT } from '../utils/coutUniteOeuvre';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Pill from './ui/Pill';
import Term from './ui/Term';
import { status as statusToken, surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const fmtH = (n) => `${(n || 0).toLocaleString('fr-FR')} h`;
const cchsFmt = (n) => `${(n || 0).toFixed(2)} €/h`;

/**
 * <CoutUniteOeuvrePanel /> — Coût de Revient par Unité d'Œuvre (Axe 6 + Axe 3 CCHS).
 *
 * Décline le coût complet par service en deux indicateurs clés :
 *   - Coût/Étudiant Complet (rapport CPOM, OPCO, Région)
 *   - CCHS (Coût Complet Horaire Stagiaire — base de la facturation FC)
 *
 * Permet la saisie inline du nombre d'heures stagiaires annuelles par service
 * (persisté dans globalParams.heuresStagiairesParService).
 */
export default function CoutUniteOeuvrePanel({
  darkMode = false, services = [], getBudgetDirection, getBudgetService,
  globalParams, setGlobalParams,
}) {
  const dm = darkMode;

  const budgetSiege = useMemo(() => {
    if (!getBudgetDirection) return { total: 0 };
    try { return getBudgetDirection(); } catch { return { total: 0 }; }
  }, [getBudgetDirection]);

  const result = useMemo(
    () => calculerCoutUniteOeuvre(services, budgetSiege, getBudgetService, globalParams),
    [services, budgetSiege, getBudgetService, globalParams]
  );

  const enAlerte = result.parService.filter(s => s.niveau === 'danger');
  const totalLevel = enAlerte.length > 0 ? 'danger'
    : result.parService.some(s => s.niveau === 'warning') ? 'warning' : 'success';

  const updateHeures = (serviceId, value) => {
    if (!setGlobalParams) return;
    const v = parseFloat(value) || 0;
    const old = globalParams?.heuresStagiairesParService || {};
    setGlobalParams({
      ...globalParams,
      heuresStagiairesParService: { ...old, [serviceId]: v },
    });
  };

  const exportCSV = () => {
    const lignes = [
      ['Coût de revient par Unité d’Œuvre — Coût/Étudiant + CCHS'],
      [`Clé de répartition : ${globalParams?.cleRepartition?.type || 'etp'}`],
      [`Budget siège réalloué : ${fmt(budgetSiege.total)}`],
      [],
      ['Service', 'Effectif', 'Heures/an', 'Heures stagiaires', 'Coût direct', 'Coût complet',
        'Coût/étud. direct', 'Coût/étud. complet', 'Recettes/étud.', 'Marge/étud.', 'CCHS €/h', 'Niveau'],
      ...result.parService.map(s => [
        s.nom, s.effectif, s.heuresAnnuelles, s.totalHeuresStagiaires,
        s.coutDirect, s.coutComplet,
        s.coutEtudiantDirect, s.coutEtudiantComplet, s.recettesEtudiant, s.margeEtudiant,
        s.cchs.toFixed(2), s.niveau,
      ]),
      [],
      ['TOTAL', result.totaux.totalEffectif, '', result.totaux.totalHeures,
        '', result.totaux.totalCoutComplet,
        '', result.totaux.coutEtudiantMoyen, result.totaux.recettesEtudiantMoyen,
        result.totaux.margeEtudiantMoyen, result.totaux.cchsConsolide.toFixed(2), ''],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cout_unite_oeuvre_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputCls = `w-20 px-2 py-1 rounded-md text-xs text-right ${dm ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`;

  return (
    <DataPanel
      darkMode={dm}
      icon={Calculator}
      title="Coût par Unité d’Œuvre (Étudiant & CCHS)"
      subtitle="Coût/étudiant et Coût Complet Horaire Stagiaire — base des dossiers CPOM, OPCO, Région"
      level={totalLevel}
      help="Pour chaque service, on divise le coût complet (charges directes + quote-part siège) par l'effectif puis par les heures dispensées. Le CCHS est le standard demandé par les financeurs publics."
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Effectif total"
              value={result.totaux.totalEffectif.toLocaleString('fr-FR')}
              hint="Stagiaires actuellement présents (initial − abandons)"
            />
            <PanelStat
              darkMode={dm}
              label="Coût/étudiant moyen"
              value={fmt(result.totaux.coutEtudiantMoyen)}
              level={totalLevel}
              hint={`Coût complet ${fmt(result.totaux.totalCoutComplet)} ÷ ${result.totaux.totalEffectif} étudiants`}
            />
            <PanelStat
              darkMode={dm}
              label="Marge/étudiant"
              value={fmt(result.totaux.margeEtudiantMoyen)}
              level={result.totaux.margeEtudiantMoyen >= 0 ? 'success' : 'danger'}
              hint={`Recettes/étud. ${fmt(result.totaux.recettesEtudiantMoyen)} − coût/étud. ${fmt(result.totaux.coutEtudiantMoyen)}`}
            />
            <PanelStat
              darkMode={dm}
              label="CCHS consolidé"
              value={cchsFmt(result.totaux.cchsConsolide)}
              level="info"
              hint={`Coût Complet Horaire Stagiaire = ${fmt(result.totaux.totalCoutComplet)} ÷ ${fmtH(result.totaux.totalHeures)}`}
            />
          </div>

          {enAlerte.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{enAlerte.length} service{enAlerte.length > 1 ? 's' : ''}</strong> en
                {' '}déficit unitaire — le coût complet par étudiant dépasse le prix de vente.
                Renégocier le tarif OPCO/Région ou rationaliser les charges directes.
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
          {/* Saisie heures stagiaires par service */}
          <div className={`mb-4 ${surface.muted(dm)} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
              <h4 className={`text-sm font-bold ${dm ? 'text-zinc-200' : 'text-slate-800'}`}>
                Heures stagiaires annuelles par service
              </h4>
              <HoverTip
                darkMode={dm}
                title="Heures de formation dispensées par stagiaire et par an"
                description={`Défaut : ${HEURES_STAGIAIRES_DEFAULT} h (formation initiale plein temps). Renseigner le volume réel CPOM ou OPCO pour un CCHS fidèle.`}
                level="info"
              >
                <Info size={12} strokeWidth={1.5} className={dm ? 'text-zinc-500' : 'text-slate-400'} />
              </HoverTip>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map(s => {
                const value = globalParams?.heuresStagiairesParService?.[s.id]
                  ?? globalParams?.cleRepartition?.params?.heuresParService?.[s.id]
                  ?? '';
                return (
                  <label key={s.id} className="flex items-center justify-between gap-2">
                    <span className={`text-xs ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>{s.nom}</span>
                    <input
                      type="number" min="0" step="50"
                      className={inputCls} value={value}
                      placeholder={String(HEURES_STAGIAIRES_DEFAULT)}
                      onChange={e => updateHeures(s.id, e.target.value)}
                      disabled={!setGlobalParams}
                    />
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
                <DataTable.HeadCell darkMode={dm} align="right">Coût complet</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Coût/étud. direct</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Coût/étud. complet</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Recettes/étud.</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Marge/étud.</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">CCHS</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {result.parService.map(s => {
                const tone = statusToken[s.niveau === 'neutral' ? 'neutral' : s.niveau](dm);
                const Icon = s.niveau === 'danger' ? AlertTriangle
                  : s.niveau === 'warning' ? AlertCircle
                  : s.niveau === 'success' ? CheckCircle2
                  : Info;
                return (
                  <DataTable.Row key={s.id} level={s.niveau === 'neutral' ? undefined : s.niveau}>
                    <DataTable.Cell darkMode={dm} bold>{s.nom}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center" mono>{s.effectif}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.coutComplet)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.coutEtudiantDirect)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(s.coutEtudiantComplet)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.recettesEtudiant)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold className={s.margeEtudiant >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')}>
                      {s.margeEtudiant >= 0 ? '+' : ''}{fmt(s.margeEtudiant)}
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      <Pill variant={s.niveau === 'neutral' ? 'neutral' : 'info'} size="xs" darkMode={dm}>
                        {cchsFmt(s.cchs)}
                      </Pill>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        darkMode={dm}
                        title={`${s.nom} — ${s.niveau === 'neutral' ? 'Indicateur indisponible' : 'Marge unitaire'}`}
                        description={recommendationCoutEtudiant(s.niveau, s.margeEtudiant)}
                        level={s.niveau === 'neutral' ? 'neutral' : s.niveau}
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
                <DataTable.Cell darkMode={dm} align="center" mono bold>{result.totaux.totalEffectif}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totaux.totalCoutComplet)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totaux.coutEtudiantMoyen)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(result.totaux.recettesEtudiantMoyen)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold className={result.totaux.margeEtudiantMoyen >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')}>
                  {result.totaux.margeEtudiantMoyen >= 0 ? '+' : ''}{fmt(result.totaux.margeEtudiantMoyen)}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{cchsFmt(result.totaux.cchsConsolide)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              Le <Term darkMode={dm}>CCHS</Term> est l’indicateur de référence pour la
              facturation des dossiers OPCO et la négociation CPOM Région. Il dépend directement
              de la clé de répartition active (modifier dans le panneau « Clés de Répartition » au-dessus).
              Heures par défaut : {HEURES_STAGIAIRES_DEFAULT} h/an (formation initiale plein temps).
            </span>
          </p>
        </>
      )}
    </DataPanel>
  );
}
