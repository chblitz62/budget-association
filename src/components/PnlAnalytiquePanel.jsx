import React, { useMemo, useState } from 'react';
import {
  FileText, Download, Info, AlertTriangle, CheckCircle2, AlertCircle,
  ChevronDown, ChevronRight, Crown,
} from 'lucide-react';
import {
  calculerPnlAnalytique,
  recommendationPnl,
  LIBELLES_CLASSES,
  SEUIL_MARGE_SUCCESS,
} from '../utils/pnlAnalytique';
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
 * <PnlAnalytiquePanel /> — P&L Analytique par Service (Axe 6).
 *
 * Compte de résultat formel décliné par centre de profit (service) :
 * produits (70/74/75) ─ charges directes (60-65/68) ─ quote-part siège
 * (réallouée via la clé de répartition) ─ résultat brut + résultat net
 * + marge nette %.
 */
export default function PnlAnalytiquePanel({
  darkMode = false, services = [], getBudgetDirection, getBudgetService,
  globalParams,
}) {
  const dm = darkMode;
  const [expandedId, setExpandedId] = useState(null);

  const budgetSiege = useMemo(() => {
    if (!getBudgetDirection) return { total: 0 };
    try { return getBudgetDirection(); } catch { return { total: 0 }; }
  }, [getBudgetDirection]);

  const result = useMemo(
    () => calculerPnlAnalytique(services, budgetSiege, getBudgetService, globalParams),
    [services, budgetSiege, getBudgetService, globalParams]
  );

  const { totaux, meta } = result;
  const totalLevel = totaux.nbDeficitaires > 0 ? 'danger'
    : totaux.nbFragiles > 0 ? 'warning'
    : totaux.totalProduits > 0 ? 'success'
    : 'neutral';

  const exportCSV = () => {
    const lignes = [
      ['P&L Analytique par Service'],
      [`Clé de répartition siège : ${meta.cleRepartition}`],
      [`Coefficient BP : ${globalParams?.coefficientBP ?? 100} %`],
      [],
      ['Rang', 'Service',
        '70 Prestations', '74 Subventions', '75 Dons', 'TOTAL Produits',
        '60 Achats', '61 Services ext.', '62 Autres serv.',
        '64 Brut', '64 Charges sociales',
        '65 Autres', '68 Amortissements',
        'TOTAL Charges directes', 'Quote-part siège', 'TOTAL Charges',
        'Résultat brut', 'Résultat net', 'Marge brute (%)', 'Marge nette (%)',
        'Niveau'],
      ...result.parService.map(s => [
        s.rang, s.nom,
        s.produits.c70, s.produits.c74, s.produits.c75, s.produits.total,
        s.chargesDirectes.c60, s.chargesDirectes.c61, s.chargesDirectes.c62,
        s.chargesDirectes.c64.brut, s.chargesDirectes.c64.chargesSociales,
        s.chargesDirectes.c65, s.chargesDirectes.c68,
        s.chargesDirectes.total, s.quotePartSiege, s.totalCharges,
        s.resultatBrut, s.resultatNet, s.margeBrute, s.margeNette,
        s.niveau,
      ]),
      [],
      ['TOTAL CONSOLIDÉ', '', '', '', '', totaux.totalProduits,
        '', '', '', '', '', '', '',
        totaux.totalChargesDirectes, totaux.totalQuotePartSiege, totaux.totalCharges,
        totaux.totalResultatBrut, totaux.totalResultatNet,
        '', totaux.margeNetteGlobale, totaux.equilibre ? 'EQUILIBRE' : 'DEFICIT'],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pnl_analytique_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Petite barre signée pour la marge nette : longueur relative au max abs
  const margeMax = Math.max(1, ...result.parService.map(s => Math.abs(s.margeNette || 0)));
  const MargeBar = ({ value, niveau }) => {
    const pct = Math.min(100, Math.abs(value) / margeMax * 100);
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
      icon={FileText}
      title="P&L Analytique par Service"
      subtitle="Compte de résultat formel par centre de profit, avec quote-part de structure réallouée"
      level={totalLevel}
      help={`Pour chaque service : produits (classes PCG 70/74/75) − charges directes (60-65/68) − quote-part siège (clé "${meta.cleRepartition}"). Le résultat net analytique est ce que le service dégage après absorption de sa part de structure. Marge nette ≥ ${SEUIL_MARGE_SUCCESS} % = service durable ; négative = déficitaire après réallocation.`}
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
              label="Résultat net consolidé"
              value={fmtSigned(totaux.totalResultatNet)}
              hint={`Marge nette ${fmtPct(totaux.margeNetteGlobale)} sur ${fmt(totaux.totalProduits)} de produits`}
              level={totaux.totalResultatNet >= 0 ? 'success' : 'danger'}
            />
            <PanelStat
              darkMode={dm}
              label="Quote-part siège réallouée"
              value={fmt(totaux.totalQuotePartSiege)}
              hint={`Clé "${meta.cleRepartition}" · ${fmt(totaux.totalChargesDirectes)} de charges directes`}
              level="info"
            />
            <PanelStat
              darkMode={dm}
              label="Bénéficiaires / Fragiles / Déficitaires"
              value={`${totaux.nbBeneficiaires} / ${totaux.nbFragiles} / ${totaux.nbDeficitaires}`}
              level={totaux.nbDeficitaires > 0 ? 'danger' : totaux.nbFragiles > 0 ? 'warning' : 'success'}
              hint={
                totaux.nbDeficitaires > 0
                  ? `${totaux.nbDeficitaires} service${totaux.nbDeficitaires > 1 ? 's' : ''} en déficit après siège`
                  : totaux.nbBeneficiaires > 0
                    ? `${totaux.nbBeneficiaires} service${totaux.nbBeneficiaires > 1 ? 's bénéficiaires' : ' bénéficiaire'}`
                    : 'Aucun service rentable identifié'
              }
            />
          </div>

          {totaux.nbDeficitaires > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border-l-4 ${
              dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500'
            }`}>
              <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
              <p className={`text-sm ${dm ? 'text-rose-200' : 'text-rose-800'}`}>
                <strong>{totaux.nbDeficitaires} service{totaux.nbDeficitaires > 1 ? 's affichent' : ' affiche'} un
                résultat net analytique négatif</strong> après réallocation des frais de siège.
                Vérifier si la <Term id="marge_contribution" darkMode={dm}>marge de contribution</Term> couvre au moins
                les charges variables avant d'envisager une décision structurelle.
              </p>
            </div>
          )}
        </>
      }
    >
      {result.parService.length === 0 ? (
        <p className={text.muted(dm)}>Aucun service à analyser. Créez vos services et leurs recettes pour activer le P&L analytique.</p>
      ) : (
        <>
          <DataTable darkMode={dm} variant="borderless">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.HeadCell darkMode={dm} align="center">Rang</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm}>Service</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Produits</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Charges directes</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Quote-part siège</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Résultat brut</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Résultat net</DataTable.HeadCell>
                <DataTable.HeadCell darkMode={dm} align="right">Marge nette</DataTable.HeadCell>
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
                const netColor = s.resultatNet > 0
                  ? (dm ? 'text-emerald-300' : 'text-emerald-700')
                  : s.resultatNet < 0
                    ? (dm ? 'text-rose-300' : 'text-rose-700')
                    : (dm ? 'text-zinc-400' : 'text-slate-500');
                const isTop = s.rang === 1 && s.niveau === 'success';
                const isExpanded = expandedId === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <DataTable.Row level={s.niveau === 'neutral' ? undefined : s.niveau}>
                      <DataTable.Cell darkMode={dm} align="center" mono>
                        {isTop ? (
                          <HoverTip darkMode={dm} title="Centre de profit #1" description="Service avec le meilleur résultat net analytique" level="success">
                            <Crown size={14} strokeWidth={1.5} className={dm ? 'text-amber-300' : 'text-amber-500'} />
                          </HoverTip>
                        ) : (
                          <span className={dm ? 'text-zinc-400' : 'text-slate-500'}>#{s.rang}</span>
                        )}
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} bold>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          className="inline-flex items-center gap-1 hover:underline"
                          aria-label={isExpanded ? 'Replier le détail' : 'Déplier le détail PCG'}
                        >
                          {isExpanded
                            ? <ChevronDown size={12} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
                            : <ChevronRight size={12} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />}
                          {s.nom}
                        </button>
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.produits.total)}</DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="right" mono>{fmt(s.chargesDirectes.total)}</DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="right" mono>
                        <span className={dm ? 'text-violet-300' : 'text-violet-700'}>{fmt(s.quotePartSiege)}</span>
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="right" mono>
                        {fmtSigned(s.resultatBrut)}
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="right" mono bold className={netColor}>
                        <div className="flex flex-col items-end gap-1">
                          <span>{fmtSigned(s.resultatNet)}</span>
                          <MargeBar value={s.margeNette} niveau={s.niveau} />
                        </div>
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="right" mono>
                        <Pill
                          variant={s.niveau === 'danger' ? 'danger' : s.niveau === 'warning' ? 'warning' : s.niveau === 'success' ? 'success' : 'neutral'}
                          size="xs"
                          darkMode={dm}
                        >
                          {fmtPct(s.margeNette)}
                        </Pill>
                      </DataTable.Cell>
                      <DataTable.Cell darkMode={dm} align="center">
                        <HoverTip
                          darkMode={dm}
                          title={`${s.nom} — ${
                            s.niveau === 'success' ? 'Bénéficiaire'
                            : s.niveau === 'warning' ? 'Équilibre fragile'
                            : s.niveau === 'danger' ? 'Déficitaire'
                            : 'Indicateur indisponible'
                          }`}
                          description={recommendationPnl(s.niveau, s.margeNette, s.resultatNet)}
                          level={niveauKey}
                        >
                          <span className={`inline-flex items-center justify-center p-1 rounded-full ${tone.bg}`}>
                            <Icon size={14} strokeWidth={1.5} className={tone.accent} />
                          </span>
                        </HoverTip>
                      </DataTable.Cell>
                    </DataTable.Row>

                    {/* Drill-down ventilation PCG */}
                    {isExpanded && (
                      <DataTable.Row>
                        <DataTable.Cell darkMode={dm} colSpan={9}>
                          <div className={`rounded-xl p-4 my-1 ${surface.muted(dm)}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                  Produits (classes 70/74/75)
                                </div>
                                <ul className="space-y-1 text-xs">
                                  {[
                                    ['70', LIBELLES_CLASSES['70'], s.produits.c70],
                                    ['74', LIBELLES_CLASSES['74'], s.produits.c74],
                                    ['75', LIBELLES_CLASSES['75'], s.produits.c75],
                                  ].filter(([, , v]) => v !== 0).map(([code, lib, v]) => (
                                    <li key={code} className={`flex justify-between ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                                      <span><span className="font-mono mr-1.5 opacity-60">{code}</span>{lib}</span>
                                      <span className="font-mono tabular-nums">{fmt(v)}</span>
                                    </li>
                                  ))}
                                  {s.produits.total === 0 && (
                                    <li className={dm ? 'text-zinc-500 italic' : 'text-slate-400 italic'}>Aucun produit enregistré.</li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <div className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${dm ? 'text-rose-300' : 'text-rose-700'}`}>
                                  Charges directes (classes 60-65/68)
                                </div>
                                <ul className="space-y-1 text-xs">
                                  {[
                                    ['60', LIBELLES_CLASSES['60'], s.chargesDirectes.c60],
                                    ['61', LIBELLES_CLASSES['61'], s.chargesDirectes.c61],
                                    ['62', LIBELLES_CLASSES['62'], s.chargesDirectes.c62],
                                    ['64a', '64 — Rémunérations brutes',         s.chargesDirectes.c64.brut],
                                    ['64b', '64 — Charges sociales et fiscales', s.chargesDirectes.c64.chargesSociales],
                                    ['65', LIBELLES_CLASSES['65'], s.chargesDirectes.c65],
                                    ['68', LIBELLES_CLASSES['68'], s.chargesDirectes.c68],
                                  ].filter(([, , v]) => v !== 0).map(([key, lib, v]) => (
                                    <li key={key} className={`flex justify-between ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                                      <span><span className="font-mono mr-1.5 opacity-60">{key.replace(/[ab]$/, '')}</span>{lib}</span>
                                      <span className="font-mono tabular-nums">{fmt(v)}</span>
                                    </li>
                                  ))}
                                  <li className={`flex justify-between pt-1 mt-1 border-t ${dm ? 'border-zinc-700 text-violet-300' : 'border-slate-300 text-violet-700'}`}>
                                    <span><span className="font-mono mr-1.5 opacity-60">9</span>Quote-part siège (clé "{meta.cleRepartition}")</span>
                                    <span className="font-mono tabular-nums">{fmt(s.quotePartSiege)}</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </DataTable.Cell>
                      </DataTable.Row>
                    )}
                  </React.Fragment>
                );
              })}
            </DataTable.Body>
            <DataTable.Foot darkMode={dm}>
              <DataTable.Row highlight>
                <DataTable.Cell darkMode={dm} />
                <DataTable.Cell darkMode={dm} bold>TOTAL CONSOLIDÉ</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.totalProduits)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.totalChargesDirectes)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(totaux.totalQuotePartSiege)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtSigned(totaux.totalResultatBrut)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold className={totaux.totalResultatNet >= 0 ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-rose-300' : 'text-rose-700')}>
                  {fmtSigned(totaux.totalResultatNet)}
                </DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(totaux.margeNetteGlobale)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} />
              </DataTable.Row>
            </DataTable.Foot>
          </DataTable>

          <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              Le <Term id="pnl_analytique" darkMode={dm}>P&L analytique</Term> décompose chaque service comme un
              centre de profit autonome. Charges ventilées selon le PCG associatif (CRC 99-01) — 60 achats, 61
              services extérieurs, 62 honoraires, 64 personnel, 65 autres, 68 amortissements. La quote-part siège
              est réallouée via la clé active dans le panneau "Clés de répartition" (actuellement <strong>{meta.cleRepartition}</strong>).
              Cliquer sur un service pour voir le détail PCG.
            </span>
          </p>
        </>
      )}
    </DataPanel>
  );
}
