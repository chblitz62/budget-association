import React, { useMemo } from 'react';
import {
  ClipboardCheck, Download, AlertTriangle, AlertCircle, Users, BadgeEuro,
  TrendingUp, Activity, ShieldCheck, GraduationCap, ShieldAlert, Info,
} from 'lucide-react';
import {
  genererBilanSocial,
  recommendationBilanSocial,
  mettreAJourAccidents,
} from '../utils/bilanSocial';
import { exporterBilanSocialPDF } from '../utils/bilanSocialPdf';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import Pill from './ui/Pill';
import HoverTip from './ui/HoverTip';
import Term from './ui/Term';
import { surface } from '../styles/tokens';

const fmtNum = (n) => (n === null || n === undefined ? '—' : Math.round(n || 0).toLocaleString('fr-FR'));
const fmtEur = (n) => (n === null || n === undefined ? '—' : Math.round(n || 0).toLocaleString('fr-FR') + ' €');
const fmtPct = (n) => (n === null || n === undefined ? '—' : `${Math.round(n * 10) / 10} %`);

const niveauVariant = (n) => n === 'success' ? 'success' : n === 'warning' ? 'warning' : n === 'danger' ? 'danger' : 'neutral';

/**
 * <BilanSocialPanel /> — Bilan Social annuel (Axe 8).
 *
 * Synthèse normalisée 7 sections (effectifs, rémunérations, pyramide,
 * parité/turn-over, OETH, formation, conditions de travail) destinée
 * au CSE et à l'AG (art. L.2312-28). Export PDF normalisé.
 */
export default function BilanSocialPanel({
  darkMode = false,
  direction = null,
  services = [],
  poleSupport = null,
  poolRH = [],
  globalParams = {},
  setGlobalParams,
  statsFormation = null,
}) {
  const dm = darkMode;
  const anneeRef = useMemo(() => new Date().getFullYear(), []);

  const bilan = useMemo(
    () => genererBilanSocial({ direction, services, poleSupport, poolRH, globalParams, statsFormation, anneeRef }),
    [direction, services, poleSupport, poolRH, globalParams, statsFormation, anneeRef]
  );

  const setAT = (champ, valeur) => {
    if (!setGlobalParams) return;
    const v = champ === 'observations' ? valeur : (parseFloat(valeur) || 0);
    setGlobalParams(mettreAJourAccidents(globalParams, { [champ]: v }));
  };

  const at = bilan.sections.conditionsTravail.securite;
  const inputClass = `px-2 py-1 rounded border text-xs text-right tabular-nums ${
    dm ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-indigo-500'
       : 'bg-white border-slate-300 text-slate-700 focus:border-indigo-500'
  } focus:outline-none`;
  const labelClass = `block text-[10px] font-bold uppercase tracking-wide mb-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`;

  const exportPDF = () => {
    const raisonSociale = globalParams?.bpfIdentite?.raisonSociale || 'AFERTES';
    exporterBilanSocialPDF(bilan, raisonSociale);
  };

  return (
    <DataPanel
      darkMode={dm}
      icon={ClipboardCheck}
      title={`Bilan Social ${bilan.exercice}`}
      subtitle={
        <>
          Synthèse RH normalisée <Term id="bilan_social" /> (art. L.2312-28) — 7 sections agrégées : effectifs, rémunérations, pyramide, parité, OETH, formation, conditions de travail.
        </>
      }
      level={bilan.niveauGlobal}
      help="Le Bilan Social est obligatoire dans les entreprises de 300 ETP et plus (art. L.2312-28). En deçà, il reste une bonne pratique forte demandée par le CSE en présence et par l'AG annuelle des associations. Il consolide les indicateurs RH calculés ailleurs dans l'outil et ajoute la saisie des accidents du travail (calcul des taux de fréquence et de gravité INRS)."
      collapsible
      actions={
        <button
          onClick={exportPDF}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
          title="Exporter le Bilan Social en PDF normalisé"
        >
          <Download size={12} strokeWidth={1.5} /> Export PDF
        </button>
      }
      summary={
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Niveau global"
              value={
                <Pill variant={niveauVariant(bilan.niveauGlobal)} size="sm" darkMode={dm}>
                  {bilan.niveauGlobal === 'success' ? 'Conforme' : bilan.niveauGlobal === 'warning' ? 'Vigilance' : 'Critique'}
                </Pill>
              }
              hint={`${bilan.alertes.length} alerte${bilan.alertes.length > 1 ? 's' : ''} identifiée${bilan.alertes.length > 1 ? 's' : ''}`}
              level={bilan.niveauGlobal}
            />
            <PanelStat
              darkMode={dm}
              label="Complétude"
              value={`${bilan.completude} %`}
              hint={`${bilan.sectionsRenseignees}/${bilan.sectionsTotal} sections renseignées`}
              level={bilan.completude >= 80 ? 'success' : bilan.completude >= 50 ? 'warning' : 'danger'}
            />
            <PanelStat
              darkMode={dm}
              label="Effectif fin d'année"
              value={fmtNum(bilan.sections.effectifs.presentsFinAnnee)}
              hint={`${fmtNum(bilan.sections.effectifs.totalETP)} ETP · ${bilan.sections.effectifs.parGenre.F}F / ${bilan.sections.effectifs.parGenre.H}H`}
              level="info"
            />
          </div>

          {bilan.alertes.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 border-l-4 ${
              bilan.alertes.some(a => a.niveau === 'danger')
                ? (dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500')
                : (dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500')
            }`}>
              <div className="flex items-start gap-2">
                {bilan.alertes.some(a => a.niveau === 'danger')
                  ? <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
                  : <AlertCircle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
                }
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-1 ${
                    bilan.alertes.some(a => a.niveau === 'danger')
                      ? (dm ? 'text-rose-200' : 'text-rose-800')
                      : (dm ? 'text-amber-200' : 'text-amber-800')
                  }`}>
                    {recommendationBilanSocial(bilan)}
                  </p>
                  <ul className="space-y-0.5 mt-2">
                    {bilan.alertes.map((a, i) => (
                      <li key={i} className={`text-xs flex items-start gap-1.5 ${
                        a.niveau === 'danger'
                          ? (dm ? 'text-rose-300' : 'text-rose-700')
                          : (dm ? 'text-amber-300' : 'text-amber-700')
                      }`}>
                        <span className="font-bold">{a.niveau === 'danger' ? '✕' : '⚠'}</span>
                        <span><strong>[{a.section}]</strong> {a.message}</span>
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
      {/* ─── Synthèse compacte des 7 sections ───────────────────── */}
      <div className="mb-4">
        <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
          Synthèse — 7 sections du Bilan Social
        </h4>
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm}>Section</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Indicateur clé</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Valeur</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="center">Statut</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><Users size={11} strokeWidth={1.5} /> 1. Effectifs</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>Présents fin d'année (ETP)</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtNum(bilan.sections.effectifs.presentsFinAnnee)} ({fmtNum(bilan.sections.effectifs.totalETP)} ETP)</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={bilan.sectionsCompletes.effectifs ? 'success' : 'neutral'} size="xs" darkMode={dm}>
                  {bilan.sectionsCompletes.effectifs ? 'OK' : '—'}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><BadgeEuro size={11} strokeWidth={1.5} /> 2. Rémunérations</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>Coût employeur annuel</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtEur(bilan.sections.remunerations.coutEmployeur)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={bilan.sectionsCompletes.remunerations ? 'success' : 'neutral'} size="xs" darkMode={dm}>
                  {bilan.sectionsCompletes.remunerations ? 'OK' : '—'}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><TrendingUp size={11} strokeWidth={1.5} /> 3. Pyramide & ancienneté</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>% seniors {'>'} 55 ans</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(bilan.sections.pyramide.totaux.pctSeniors)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={niveauVariant(bilan.sections.pyramide.totaux.niveau)} size="xs" darkMode={dm}>
                  {bilan.sections.pyramide.totaux.niveau}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><Activity size={11} strokeWidth={1.5} /> 4. Parité H/F</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>Index parité (% genre min.)</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(bilan.sections.pariteTurnOver.pariteConsolidee.indexParite)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={niveauVariant(bilan.sections.pariteTurnOver.pariteConsolidee.niveau)} size="xs" darkMode={dm}>
                  {bilan.sections.pariteTurnOver.pariteConsolidee.niveau}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><Activity size={11} strokeWidth={1.5} /> 4bis. Turn-over</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>Turn-over global (APEC)</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(bilan.sections.pariteTurnOver.turnOverConsolide.turnOver)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={niveauVariant(bilan.sections.pariteTurnOver.turnOverConsolide.niveau)} size="xs" darkMode={dm}>
                  {bilan.sections.pariteTurnOver.turnOverConsolide.niveau}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><ShieldCheck size={11} strokeWidth={1.5} /> 5. OETH</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>Taux RQTH (obligation 6 %)</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtPct(bilan.sections.oeth.tauxRqth)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={bilan.sections.oeth.estConforme ? 'success' : 'warning'} size="xs" darkMode={dm}>
                  {bilan.sections.oeth.estConforme ? 'Conforme' : 'Non conforme'}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><GraduationCap size={11} strokeWidth={1.5} /> 6. Formation</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>Effectif stagiaires accompagnés</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtNum(bilan.sections.formation.effectifTotal)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={bilan.sectionsCompletes.formation ? 'success' : 'neutral'} size="xs" darkMode={dm}>
                  {bilan.sectionsCompletes.formation ? 'OK' : '—'}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell darkMode={dm}><span className="flex items-center gap-1.5"><ShieldAlert size={11} strokeWidth={1.5} /> 7. Conditions de travail</span></DataTable.Cell>
              <DataTable.Cell darkMode={dm}>DUER + sinistralité (TF/TG INRS)</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>
                {bilan.sections.conditionsTravail.duer.totalRisques} risques · TF {at.tauxFrequence === null ? '—' : at.tauxFrequence}
              </DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="center">
                <Pill variant={niveauVariant(bilan.sections.conditionsTravail.duer.niveauGlobal)} size="xs" darkMode={dm}>
                  {bilan.sections.conditionsTravail.duer.niveauGlobal}
                </Pill>
              </DataTable.Cell>
            </DataTable.Row>
          </DataTable.Body>
        </DataTable>
      </div>

      {/* ─── Saisie complémentaire AT/MP ───────────────────────── */}
      <div className={`rounded-xl p-4 ${surface.muted(dm)}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
            <ShieldAlert size={12} strokeWidth={1.5} />
            Accidents du travail & Maladies professionnelles (saisie obligatoire)
          </h4>
          <HoverTip
            title="Taux de fréquence (TF) et de gravité (TG)"
            description="Indicateurs INRS/CNAM. TF = (AT avec arrêt × 1 000 000) / heures travaillées. TG = (jours d'arrêt × 1 000) / heures travaillées. Référence sectorielle TF ≈ 20 (tous secteurs)."
            level="info"
            darkMode={dm}
          >
            <Info size={12} strokeWidth={1.5} className={dm ? 'text-zinc-400' : 'text-slate-500'} />
          </HoverTip>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>AT avec arrêt</label>
            <input type="number" min="0" step="1"
              className={`${inputClass} w-full`}
              value={at.accidentsAvecArret || 0}
              onChange={e => setAT('accidentsAvecArret', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>AT sans arrêt</label>
            <input type="number" min="0" step="1"
              className={`${inputClass} w-full`}
              value={at.accidentsSansArret || 0}
              onChange={e => setAT('accidentsSansArret', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Jours d'arrêt AT</label>
            <input type="number" min="0" step="1"
              className={`${inputClass} w-full`}
              value={at.joursArretAT || 0}
              onChange={e => setAT('joursArretAT', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Maladies professionnelles</label>
            <input type="number" min="0" step="1"
              className={`${inputClass} w-full`}
              value={at.maladiesProfessionnelles || 0}
              onChange={e => setAT('maladiesProfessionnelles', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Heures travaillées (référence)</label>
            <input type="number" min="0" step="1000"
              className={`${inputClass} w-full`}
              value={at.heuresTravailles || 0}
              onChange={e => setAT('heuresTravailles', e.target.value)} />
          </div>
          <div className="md:col-span-3 grid grid-cols-2 gap-3 mt-2">
            <div className={`rounded-lg px-3 py-2 ${dm ? 'bg-zinc-800/60' : 'bg-white'}`}>
              <span className={`block text-[10px] uppercase ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Taux de fréquence (TF)</span>
              <span className={`text-lg font-bold tabular-nums ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>
                {at.tauxFrequence === null ? '—' : at.tauxFrequence}
              </span>
              {at.tauxFrequence !== null && (
                <Pill variant={niveauVariant(at.niveauTF)} size="xs" darkMode={dm} className="ml-2">{at.niveauTF}</Pill>
              )}
            </div>
            <div className={`rounded-lg px-3 py-2 ${dm ? 'bg-zinc-800/60' : 'bg-white'}`}>
              <span className={`block text-[10px] uppercase ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Taux de gravité (TG)</span>
              <span className={`text-lg font-bold tabular-nums ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>
                {at.tauxGravite === null ? '—' : at.tauxGravite}
              </span>
              {at.tauxGravite !== null && (
                <Pill variant={niveauVariant(at.niveauTG)} size="xs" darkMode={dm} className="ml-2">{at.niveauTG}</Pill>
              )}
            </div>
          </div>
          <div className="md:col-span-3">
            <label className={labelClass}>Observations</label>
            <textarea rows="2"
              className={`${inputClass} w-full text-left`}
              value={at.observations || ''}
              onChange={e => setAT('observations', e.target.value)}
              placeholder="Contexte, plans d'action engagés, suites données…" />
          </div>
        </div>
      </div>

      <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        <span>
          Module agrégateur — chaîne les modules RH livrés (Pyramide âges, Parité H/F, Turn-over, OETH, DUER, Formation, Masse salariale).
          AT/MP saisis manuellement (persistance <code>globalParams.bilanSocial.accidents</code>). Référence : Code travail art. L.2312-28
          (CSE {'>'} 50 ETP, obligation {'>'} 300 ETP), pratique recommandée pour AG association.
        </span>
      </p>
    </DataPanel>
  );
}
