import React, { useMemo, useState } from 'react';
import {
  Award, Download, AlertTriangle, AlertCircle, CheckCircle2, ShieldCheck,
  ChevronDown, ChevronRight, Info,
} from 'lucide-react';
import {
  calculerIndicateursQualiopi,
  recommendationIndicateur,
  recommendationQualiopi,
  CODES_QUALIOPI,
} from '../utils/qualiopi';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import Pill from './ui/Pill';
import HoverTip from './ui/HoverTip';
import Term from './ui/Term';
import { surface } from '../styles/tokens';

const fmtPct = (n) =>
  n === null || n === undefined ? '—' : `${Math.round(n * 10) / 10} %`;

const niveauVariant = (n) =>
  n === 'success' ? 'success' : n === 'warning' ? 'warning' : n === 'danger' ? 'danger' : 'neutral';

const niveauLabel = (n) =>
  n === 'success' ? 'Conforme'
  : n === 'warning' ? 'À surveiller'
  : n === 'danger' ? 'Non conforme'
  : 'Sans donnée';

/**
 * <QualiopiPanel /> — Indicateurs Qualiopi opposables (RNQ) — Axe 10.
 *
 * Audit Qualiopi triennal — la non-conformité entraîne la perte des
 * financements CPF/OPCO/Région. Couvre 5 indicateurs RNQ mesurables :
 * I-9, I-23, I-24, I-30, I-31.
 *
 * Persistance : globalParams.qualiopiTaux[promoId][champ] et
 *               globalParams.seuilsQualiopi[code].
 */
export default function QualiopiPanel({
  darkMode = false,
  services = [],
  globalParams = {},
  setGlobalParams,
}) {
  const dm = darkMode;
  const [expanded, setExpanded] = useState(null); // code de l'indicateur déplié

  const result = useMemo(
    () => calculerIndicateursQualiopi(services, globalParams || {}),
    [services, globalParams]
  );

  const { indicateurs, totaux, alertes } = result;
  const totalLevel = totaux.nbNonConformes > 0 ? 'danger'
    : !totaux.auditReady ? 'warning'
    : totaux.nbASurveiller > 0 ? 'warning'
    : 'success';

  const setTaux = (promoId, champ, valeur) => {
    if (!setGlobalParams) return;
    const map = { ...(globalParams.qualiopiTaux || {}) };
    const promo = { ...(map[promoId] || {}) };
    if (valeur === '' || valeur === null) {
      delete promo[champ];
    } else {
      const n = parseFloat(valeur);
      promo[champ] = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : valeur;
    }
    if (Object.keys(promo).length === 0) {
      delete map[promoId];
    } else {
      map[promoId] = promo;
    }
    setGlobalParams({ ...globalParams, qualiopiTaux: map });
  };

  const inputClass = `w-20 px-2 py-1 rounded border text-xs text-right tabular-nums ${
    dm ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-indigo-500'
       : 'bg-white border-slate-300 text-slate-700 focus:border-indigo-500'
  } focus:outline-none`;

  const exportCSV = () => {
    const lignes = [
      ['Indicateurs Qualiopi opposables (Référentiel National Qualité)'],
      [`Audit-ready : ${totaux.auditReady ? 'OUI' : 'NON'} · Score conformité : ${totaux.scoreGlobal} % · Complétude données : ${totaux.completude} %`],
      [],
      ['SYNTHÈSE PAR INDICATEUR'],
      ['Code', 'Indicateur', 'Valeur globale (%)', 'Niveau', 'Promos renseignées', 'Promos totales', 'Complétude (%)'],
      ...CODES_QUALIOPI.map(code => {
        const ind = indicateurs[code];
        return [code, ind.libelle, ind.valeurGlobale ?? '', niveauLabel(ind.niveau), ind.nbPromosRenseignees, ind.nbPromosTotales, ind.dataCompleteness];
      }),
      [],
      ['DÉTAIL PAR PROMO'],
      ['Code', 'Service', 'Promo', 'Effectif initial', 'Effectif actuel', 'Valeur (%)', 'Niveau'],
      ...CODES_QUALIOPI.flatMap(code =>
        indicateurs[code].parPromo.map(p =>
          [code, p.serviceNom, p.promoNom, p.effectifInitial, p.effectifActuel, p.valeur ?? '', niveauLabel(p.niveau)]
        )
      ),
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Qualiopi_RNQ_${new Date().getFullYear()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Champs saisissables par indicateur (autres que I-9 calculé automatiquement)
  const champParCode = {
    'I-23': 'tauxInsertion6Mois',
    'I-24': 'tauxObtentionCertif',
    'I-30': 'tauxSatisfactionStagiaires',
    'I-31': 'tauxSatisfactionFinanceurs',
  };

  return (
    <DataPanel
      darkMode={dm}
      icon={Award}
      title="Indicateurs Qualiopi opposables (RNQ)"
      subtitle={
        <>
          Audit triennal Qualiopi — 5 indicateurs <Term id="qualiopi" /> (I-9 abandon, I-23 insertion 6 mois, I-24 certification, I-30 satisfaction stagiaires, I-31 satisfaction financeurs).
        </>
      }
      level={totalLevel}
      help="L'auditeur Qualiopi exige une preuve documentée pour chaque indicateur RNQ : enquêtes signées, attestations, registres nominatifs. Saisir les taux au fil de l'eau évite la course aux preuves en J-30 de l'audit. Les seuils par défaut sont des références sectorielles DGEFP/Carif-Oref ; à ajuster par décision du référent qualité."
      collapsible
      actions={
        <button
          onClick={exportCSV}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
            dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
          title="Exporter le tableau Qualiopi (preuve auditable)"
        >
          <Download size={12} strokeWidth={1.5} /> Export RNQ
        </button>
      }
      summary={
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Score conformité"
              value={`${totaux.scoreGlobal} %`}
              hint={`${totaux.nbConformes}/${CODES_QUALIOPI.length} indicateurs au-dessus du seuil`}
              level={totalLevel}
            />
            <PanelStat
              darkMode={dm}
              label="Complétude données"
              value={`${totaux.completude} %`}
              hint={totaux.auditReady ? 'Audit-ready ✓' : `${totaux.nbSansDonnees} indicateur(s) sans donnée`}
              level={totaux.auditReady ? 'success' : 'warning'}
            />
            <PanelStat
              darkMode={dm}
              label="Répartition"
              value={
                <span className="flex items-center gap-2 text-base">
                  <span className="text-emerald-500">{totaux.nbConformes}✓</span>
                  <span className="text-amber-500">{totaux.nbASurveiller}⚠</span>
                  <span className="text-rose-500">{totaux.nbNonConformes}✕</span>
                  <span className="text-slate-400">{totaux.nbSansDonnees}∅</span>
                </span>
              }
              hint="Conformes / À surveiller / Non conformes / Sans donnée"
              level="neutral"
            />
          </div>

          {alertes.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 border-l-4 ${
              alertes.some(a => a.niveau === 'danger')
                ? (dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500')
                : (dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500')
            }`}>
              <div className="flex items-start gap-2">
                {alertes.some(a => a.niveau === 'danger')
                  ? <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
                  : <AlertCircle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
                }
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-1 ${
                    alertes.some(a => a.niveau === 'danger')
                      ? (dm ? 'text-rose-200' : 'text-rose-800')
                      : (dm ? 'text-amber-200' : 'text-amber-800')
                  }`}>
                    {recommendationQualiopi(result)}
                  </p>
                  <ul className="space-y-0.5 mt-2">
                    {alertes.map((a, i) => (
                      <li key={i} className={`text-xs flex items-start gap-1.5 ${
                        a.niveau === 'danger'
                          ? (dm ? 'text-rose-300' : 'text-rose-700')
                          : (dm ? 'text-amber-300' : 'text-amber-700')
                      }`}>
                        <span className="font-bold">{a.niveau === 'danger' ? '✕' : '⚠'}</span>
                        <span>{a.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      }
    >
      {/* ─── Synthèse par indicateur ────────────────────────────── */}
      <div className="mb-4">
        <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
          <ShieldCheck size={12} strokeWidth={1.5} />
          Synthèse — 5 indicateurs RNQ opposables
        </h4>
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm} align="center">Code</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Indicateur</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Valeur globale</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Complétude</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Détail</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {CODES_QUALIOPI.map(code => {
              const ind = indicateurs[code];
              const isOpen = expanded === code;
              return (
                <React.Fragment key={code}>
                  <DataTable.Row>
                    <DataTable.Cell darkMode={dm} align="center" mono bold>{code}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm}>
                      <div className="flex flex-col gap-0.5">
                        <span>{ind.libelle}</span>
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {ind.seuils.sens === 'min'
                            ? `Seuils MAX : warning ≥ ${ind.seuils.warning} %, danger ≥ ${ind.seuils.danger} %`
                            : `Seuils MIN : warning ≥ ${ind.seuils.warning} %, danger < ${ind.seuils.danger} %`}
                        </span>
                      </div>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(ind.valeurGlobale)}</DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <HoverTip
                        title={`${code} — ${niveauLabel(ind.niveau)}`}
                        description={recommendationIndicateur(code, ind.niveau, ind.valeurGlobale)}
                        level={ind.niveau}
                        darkMode={dm}
                      >
                        <Pill variant={niveauVariant(ind.niveau)} size="xs" darkMode={dm}>
                          {niveauLabel(ind.niveau)}
                        </Pill>
                      </HoverTip>
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="right" mono>
                      {ind.nbPromosRenseignees}/{ind.nbPromosTotales} ({ind.dataCompleteness} %)
                    </DataTable.Cell>
                    <DataTable.Cell darkMode={dm} align="center">
                      <button
                        onClick={() => setExpanded(isOpen ? null : code)}
                        className={`p-1 rounded transition-colors ${dm ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'}`}
                        title={isOpen ? 'Masquer le détail' : 'Voir / saisir le détail par promo'}
                      >
                        {isOpen
                          ? <ChevronDown size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
                          : <ChevronRight size={14} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />}
                      </button>
                    </DataTable.Cell>
                  </DataTable.Row>

                  {isOpen && (
                    <DataTable.Row>
                      <DataTable.Cell darkMode={dm} colSpan={6}>
                        <div className={`rounded-xl p-3 ${surface.muted(dm)}`}>
                          {ind.parPromo.length === 0 ? (
                            <p className={`text-xs italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                              Aucune promo détectée pour cet indicateur.
                            </p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className={`text-left ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                                  <th className="pb-2 font-semibold uppercase text-[10px] tracking-wide">Service</th>
                                  <th className="pb-2 font-semibold uppercase text-[10px] tracking-wide">Promo</th>
                                  <th className="pb-2 font-semibold uppercase text-[10px] tracking-wide text-right">Effectif</th>
                                  <th className="pb-2 font-semibold uppercase text-[10px] tracking-wide text-right">
                                    {code === 'I-9' ? "Taux d'abandon (auto)" : 'Taux saisi (%)'}
                                  </th>
                                  <th className="pb-2 font-semibold uppercase text-[10px] tracking-wide text-center">Niveau</th>
                                </tr>
                              </thead>
                              <tbody className={dm ? 'text-zinc-200' : 'text-slate-700'}>
                                {ind.parPromo.map(p => (
                                  <tr key={`${code}-${p.promoId}`} className={`border-t ${dm ? 'border-zinc-800' : 'border-slate-200'}`}>
                                    <td className="py-1.5 pr-2">{p.serviceNom}</td>
                                    <td className="py-1.5 pr-2">{p.promoNom}{p.filiereNom ? ` · ${p.filiereNom}` : ''}</td>
                                    <td className="py-1.5 pr-2 text-right tabular-nums">{p.effectifActuel}/{p.effectifInitial}</td>
                                    <td className="py-1.5 pr-2 text-right tabular-nums">
                                      {code === 'I-9' ? (
                                        <span className="font-bold">{fmtPct(p.valeur)}</span>
                                      ) : (
                                        <input
                                          className={inputClass}
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="1"
                                          value={p.valeur ?? ''}
                                          onChange={e => setTaux(p.promoId, champParCode[code], e.target.value)}
                                          placeholder="—"
                                        />
                                      )}
                                    </td>
                                    <td className="py-1.5 text-center">
                                      <Pill variant={niveauVariant(p.niveau)} size="xs" darkMode={dm}>
                                        {niveauLabel(p.niveau)}
                                      </Pill>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {code !== 'I-9' && (
                            <p className={`mt-2 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                              <Info size={10} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                              <span>
                                Saisir le taux constaté lors du bilan de la promo. Conserver la preuve documentée
                                (questionnaire signé, attestation employeur, PV jury) — l'auditeur Qualiopi en exige la consultation.
                              </span>
                            </p>
                          )}
                        </div>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </React.Fragment>
              );
            })}
          </DataTable.Body>
        </DataTable>
      </div>

      <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        <span>
          I-9 (abandon) calculé automatiquement depuis les abandons saisis par mois. I-23 / I-24 / I-30 / I-31 saisis manuellement
          par promo (extension douce — aucune migration). Persistance via <code>globalParams.qualiopiTaux</code>.
          Audit triennal : référence Code travail art. L.6316-1 (RNQ) et arrêté du 6 juin 2019.
        </span>
      </p>
    </DataPanel>
  );
}
