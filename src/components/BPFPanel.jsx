import React, { useMemo } from 'react';
import { FileText, Download, Info, AlertTriangle, CheckCircle2, AlertCircle, Building2, Users, Clock } from 'lucide-react';
import { genererBPF, recommendationBPF } from '../utils/bpf';
import DataPanel, { PanelStat } from './ui/DataPanel';
import DataTable from './ui/DataTable';
import HoverTip from './ui/HoverTip';
import Term from './ui/Term';
import { surface, text } from '../styles/tokens';

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const fmtNum = (n) => Math.round(n || 0).toLocaleString('fr-FR');

/**
 * <BPFPanel /> — Bilan Pédagogique et Financier (CERFA 10443) — Axe 10.
 *
 * Génère le BPF formaté pour transmission DREETS. **Obligation légale annuelle**
 * de tout OF déclaré (art. L.6352-11) — non transmission = retrait NDA.
 */
export default function BPFPanel({
  darkMode = false,
  direction,
  services = [],
  poleSupport,
  poolRH = [],
  globalParams,
  setGlobalParams,
}) {
  const dm = darkMode;
  const anneeRef = useMemo(() => new Date().getFullYear(), []);

  const bpf = useMemo(
    () => genererBPF(direction, services, poleSupport, poolRH, globalParams || {}, anneeRef),
    [direction, services, poleSupport, poolRH, globalParams, anneeRef]
  );

  const setIdentite = (key, value) => {
    if (!setGlobalParams) return;
    setGlobalParams({
      ...globalParams,
      bpfIdentite: { ...(globalParams?.bpfIdentite || {}), [key]: value },
    });
  };

  const totalLevel = bpf.alertes.some(a => a.niveau === 'danger') ? 'danger'
    : bpf.alertes.some(a => a.niveau === 'warning') ? 'warning'
    : bpf.isValide ? 'success' : 'neutral';

  const exportCSV = () => {
    const lignes = [
      [`BPF — Bilan Pédagogique et Financier (CERFA 10443) — Exercice ${bpf.identite.anneeExercice}`],
      [`Transmission obligatoire DREETS avant le 30 avril ${bpf.identite.anneeExercice + 1} via bilanpedagogique.travail-emploi.gouv.fr`],
      [],
      ['CADRE A — Identification de l\'OF'],
      ['NDA', bpf.identite.nda],
      ['SIRET', bpf.identite.siret],
      ['Raison sociale', bpf.identite.raisonSociale],
      ['Statut juridique', bpf.identite.statutJuridique],
      [],
      ['CADRE B1 — PRODUITS par origine de financement (€ HT, 12 mois)'],
      ['Code', 'Libellé', 'Montant (€)'],
      ...Object.values(bpf.cadreB1.produits).map(p => [p.code, p.libelle, p.montant]),
      ['B13', 'Total Pouvoirs publics (B131+B132+B133+B134)', bpf.cadreB1.totalB13],
      ['', 'TOTAL PRODUITS', bpf.cadreB1.totalProduits],
      [],
      ['CADRE B2 — CHARGES (€ HT, 12 mois)'],
      ['Code', 'Libellé', 'Montant (€)'],
      ...Object.values(bpf.cadreB2.charges).map(c => [c.code, c.libelle, c.montant]),
      ['', 'TOTAL CHARGES', bpf.cadreB2.totalCharges],
      [],
      ['CADRE C — Stagiaires & Heures-stagiaires par origine'],
      ['Code', 'Origine', 'Nb stagiaires', 'Heures-stagiaires'],
      ...Object.entries(bpf.cadreC.stagiairesParOrigine).map(([code, nb]) => [
        code, bpf.cadreB1.produits[code].libelle, nb, bpf.cadreC.heuresParOrigine[code],
      ]),
      ['', 'TOTAL', bpf.cadreC.totalNbStagiaires, bpf.cadreC.totalHeuresStagiaires],
      ['', 'Heures moyennes / stagiaire', '', bpf.cadreC.heuresMoyennesParStagiaire],
    ];
    const csv = lignes.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nom = bpf.identite.nda
      ? `BPF_${bpf.identite.nda.replace(/[^a-z0-9]/gi, '_')}_${bpf.identite.anneeExercice}.csv`
      : `BPF_${bpf.identite.anneeExercice}.csv`;
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Styles input
  const inputClass = `w-full px-3 py-1.5 rounded-lg border text-sm ${
    dm ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-700 focus:border-indigo-500'
  } focus:outline-none transition-colors`;
  const labelClass = `block text-[11px] font-medium mb-1 uppercase tracking-wide ${dm ? 'text-zinc-400' : 'text-slate-600'}`;

  return (
    <DataPanel
      darkMode={dm}
      icon={FileText}
      title="BPF — Bilan Pédagogique et Financier (CERFA 10443)"
      subtitle={<>Obligation légale annuelle de tout OF — transmission DREETS avant le 30 avril {bpf.identite.anneeExercice + 1}</>}
      level={totalLevel}
      help={`Exercice ${bpf.identite.anneeExercice}. Cadre A : identification ; Cadre B1 : produits par origine (B11 entreprises, B12 OPCO, B131 Région, B132 France Travail, B133 État, B134 collectivités, B14 particuliers, B15 OF, B16 CPF/apprentissage) ; Cadre B2 : charges (B21 sous-traitance, B22 salaires formateurs internes, B23 charges sociales, B24 autres) ; Cadre C : stagiaires et heures-stagiaires. Classification automatique par regex sur les libellés. Non-transmission = retrait du NDA (Code travail art. L.6352-11).`}
      collapsible
      actions={
        <button
          onClick={exportCSV}
          disabled={!bpf.isValide}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-opacity ${
            bpf.isValide
              ? (dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500')
              : 'opacity-40 cursor-not-allowed bg-slate-300 text-slate-600'
          }`}
          title={bpf.isValide ? 'Exporter le BPF en CSV' : 'Compléter l\'identification de l\'OF avant export'}
        >
          <Download size={12} strokeWidth={1.5} /> Export CERFA
        </button>
      }
      summary={
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PanelStat
              darkMode={dm}
              label="Total Produits formation"
              value={fmt(bpf.cadreB1.totalProduits)}
              hint={`${Object.values(bpf.cadreB1.produits).filter(p => p.montant > 0).length} origines · exercice ${bpf.identite.anneeExercice}`}
              level="info"
            />
            <PanelStat
              darkMode={dm}
              label="Total Charges formation"
              value={fmt(bpf.cadreB2.totalCharges)}
              hint={`${bpf.cadreB2.charges.B22.nbFormateurs} formateur${bpf.cadreB2.charges.B22.nbFormateurs > 1 ? 's' : ''} interne${bpf.cadreB2.charges.B22.nbFormateurs > 1 ? 's' : ''}`}
              level="neutral"
            />
            <PanelStat
              darkMode={dm}
              label="Heures-stagiaires"
              value={fmtNum(bpf.cadreC.totalHeuresStagiaires)}
              hint={`${bpf.cadreC.totalNbStagiaires} stagiaires · ${bpf.cadreC.heuresMoyennesParStagiaire} h/stagiaire`}
              level={totalLevel}
            />
          </div>

          {/* Bandeau d'alertes */}
          {bpf.alertes.length > 0 && (
            <div className={`rounded-xl px-4 py-3 mb-4 border-l-4 ${
              bpf.alertes.some(a => a.niveau === 'danger')
                ? (dm ? 'bg-rose-950/30 border-l-rose-500' : 'bg-rose-50 border-l-rose-500')
                : (dm ? 'bg-amber-950/30 border-l-amber-500' : 'bg-amber-50 border-l-amber-500')
            }`}>
              <div className="flex items-start gap-2">
                {bpf.alertes.some(a => a.niveau === 'danger')
                  ? <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-rose-300' : 'text-rose-600'}`} />
                  : <AlertCircle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${dm ? 'text-amber-300' : 'text-amber-600'}`} />
                }
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-1 ${
                    bpf.alertes.some(a => a.niveau === 'danger')
                      ? (dm ? 'text-rose-200' : 'text-rose-800')
                      : (dm ? 'text-amber-200' : 'text-amber-800')
                  }`}>
                    {recommendationBPF(bpf)}
                  </p>
                  <ul className="space-y-0.5 mt-2">
                    {bpf.alertes.map((a, i) => (
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
      {/* ─── Cadre A — Identification ────────────────────────────── */}
      <div className={`rounded-xl p-4 mb-4 ${surface.muted(dm)}`}>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} strokeWidth={1.5} className={dm ? 'text-zinc-300' : 'text-slate-700'} />
          <span className={`text-xs font-bold uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
            Cadre A — Identification de l'organisme de formation
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>NDA — Numéro de Déclaration d'Activité</label>
            <input
              className={inputClass}
              type="text"
              value={bpf.identite.nda || ''}
              onChange={e => setIdentite('nda', e.target.value)}
              placeholder="ex. 32-59-12345-59"
            />
          </div>
          <div>
            <label className={labelClass}>SIRET</label>
            <input
              className={inputClass}
              type="text"
              maxLength="14"
              value={bpf.identite.siret || ''}
              onChange={e => setIdentite('siret', e.target.value.replace(/\D/g, ''))}
              placeholder="14 chiffres"
            />
          </div>
          <div>
            <label className={labelClass}>Raison sociale</label>
            <input
              className={inputClass}
              type="text"
              value={bpf.identite.raisonSociale || ''}
              onChange={e => setIdentite('raisonSociale', e.target.value)}
              placeholder="ex. AFERTES"
            />
          </div>
          <div>
            <label className={labelClass}>Statut juridique</label>
            <select
              className={inputClass}
              value={bpf.identite.statutJuridique}
              onChange={e => setIdentite('statutJuridique', e.target.value)}
            >
              <option>Association loi 1901</option>
              <option>Association loi 1908 (Alsace-Moselle)</option>
              <option>Fondation</option>
              <option>SARL</option>
              <option>SA</option>
              <option>SAS</option>
              <option>Autre</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Adresse du siège</label>
            <input
              className={inputClass}
              type="text"
              value={bpf.identite.adresse || ''}
              onChange={e => setIdentite('adresse', e.target.value)}
              placeholder="N°, rue, code postal, ville"
            />
          </div>
        </div>
      </div>

      {/* ─── Cadre B1 — Produits ───────────────────────────────── */}
      <div className="mb-4">
        <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
          Cadre B1 — Produits par origine de financement (12 mois HT)
        </h4>
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm} align="center">Code</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Origine</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Montant</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">% du total</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {Object.values(bpf.cadreB1.produits).filter(p => p.montant > 0).map(p => {
              const pct = bpf.cadreB1.totalProduits > 0 ? (p.montant / bpf.cadreB1.totalProduits) * 100 : 0;
              return (
                <DataTable.Row key={p.code}>
                  <DataTable.Cell darkMode={dm} align="center" mono bold>{p.code}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm}>
                    <div className="flex flex-col gap-0.5">
                      <span>{p.libelle}</span>
                      {p.lignes.length > 0 && (
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {p.lignes.length} ligne{p.lignes.length > 1 ? 's' : ''} : {p.lignes.slice(0, 2).map(l => l.nom).join(', ')}{p.lignes.length > 2 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(p.montant)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{pct.toFixed(1)} %</DataTable.Cell>
                </DataTable.Row>
              );
            })}
            {bpf.cadreB1.totalB13 > 0 && (
              <DataTable.Row>
                <DataTable.Cell darkMode={dm} align="center" mono bold>B13</DataTable.Cell>
                <DataTable.Cell darkMode={dm} bold>↳ Sous-total Pouvoirs publics (B131+B132+B133+B134)</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(bpf.cadreB1.totalB13)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono>
                  {bpf.cadreB1.totalProduits > 0 ? ((bpf.cadreB1.totalB13 / bpf.cadreB1.totalProduits) * 100).toFixed(1) : 0} %
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable.Body>
          <DataTable.Foot darkMode={dm}>
            <DataTable.Row highlight>
              <DataTable.Cell darkMode={dm} />
              <DataTable.Cell darkMode={dm} bold>TOTAL PRODUITS</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(bpf.cadreB1.totalProduits)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>100 %</DataTable.Cell>
            </DataTable.Row>
          </DataTable.Foot>
        </DataTable>
      </div>

      {/* ─── Cadre B2 — Charges ─────────────────────────────────── */}
      <div className="mb-4">
        <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
          Cadre B2 — Charges de l'activité formation
        </h4>
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm} align="center">Code</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Nature</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Montant</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">% du total</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {Object.values(bpf.cadreB2.charges).map(c => {
              const pct = bpf.cadreB2.totalCharges > 0 ? (c.montant / bpf.cadreB2.totalCharges) * 100 : 0;
              return (
                <DataTable.Row key={c.code}>
                  <DataTable.Cell darkMode={dm} align="center" mono bold>{c.code}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm}>
                    <div className="flex flex-col gap-0.5">
                      <span>{c.libelle}</span>
                      {c.code === 'B22' && c.nbFormateurs > 0 && (
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {c.nbFormateurs} formateur{c.nbFormateurs > 1 ? 's' : ''} interne{c.nbFormateurs > 1 ? 's' : ''} (rôle "formateur" + Pool RH)
                        </span>
                      )}
                      {c.code === 'B23' && bpf.cadreB2.tauxChargesEffectif > 0 && (
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          Taux effectif {bpf.cadreB2.tauxChargesEffectif} % du brut
                        </span>
                      )}
                      {c.lignes && c.lignes.length > 0 && (
                        <span className={`text-[10px] font-normal ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {c.lignes.length} ligne{c.lignes.length > 1 ? 's' : ''} détectée{c.lignes.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(c.montant)}</DataTable.Cell>
                  <DataTable.Cell darkMode={dm} align="right" mono>{pct.toFixed(1)} %</DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable.Body>
          <DataTable.Foot darkMode={dm}>
            <DataTable.Row highlight>
              <DataTable.Cell darkMode={dm} />
              <DataTable.Cell darkMode={dm} bold>TOTAL CHARGES</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmt(bpf.cadreB2.totalCharges)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>100 %</DataTable.Cell>
            </DataTable.Row>
          </DataTable.Foot>
        </DataTable>
      </div>

      {/* ─── Cadre C — Stagiaires & Heures ──────────────────────── */}
      <div className="mb-2">
        <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-2 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
          <Clock size={12} strokeWidth={1.5} />
          Cadre C — Stagiaires et heures-stagiaires par origine
        </h4>
        <div className={`rounded-xl p-3 mb-3 grid grid-cols-3 gap-3 ${surface.muted(dm)}`}>
          <div>
            <span className={`text-[10px] uppercase tracking-wide block ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Total stagiaires</span>
            <span className={`text-lg font-bold tabular-nums ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>{fmtNum(bpf.cadreC.totalNbStagiaires)}</span>
          </div>
          <div>
            <span className={`text-[10px] uppercase tracking-wide block ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Heures-stagiaires</span>
            <span className={`text-lg font-bold tabular-nums ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>{fmtNum(bpf.cadreC.totalHeuresStagiaires)}</span>
          </div>
          <div>
            <span className={`text-[10px] uppercase tracking-wide block ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Heures moyennes / stagiaire</span>
            <span className={`text-lg font-bold tabular-nums ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>{bpf.cadreC.heuresMoyennesParStagiaire} h</span>
          </div>
        </div>
        <DataTable darkMode={dm} variant="borderless">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.HeadCell darkMode={dm} align="center">Code</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm}>Origine</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Stagiaires</DataTable.HeadCell>
              <DataTable.HeadCell darkMode={dm} align="right">Heures-stagiaires</DataTable.HeadCell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {Object.entries(bpf.cadreC.stagiairesParOrigine).filter(([, n]) => n > 0).map(([code, nb]) => (
              <DataTable.Row key={code}>
                <DataTable.Cell darkMode={dm} align="center" mono bold>{code}</DataTable.Cell>
                <DataTable.Cell darkMode={dm}>{bpf.cadreB1.produits[code].libelle}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono>{fmtNum(nb)}</DataTable.Cell>
                <DataTable.Cell darkMode={dm} align="right" mono>{fmtNum(bpf.cadreC.heuresParOrigine[code])}</DataTable.Cell>
              </DataTable.Row>
            ))}
            {bpf.cadreC.totalNbStagiaires === 0 && (
              <DataTable.Row>
                <DataTable.Cell darkMode={dm} colSpan={4} align="center">
                  <span className={`text-xs italic ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Aucun stagiaire détecté — vérifier les effectifs des promos dans les services
                  </span>
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable.Body>
          <DataTable.Foot darkMode={dm}>
            <DataTable.Row highlight>
              <DataTable.Cell darkMode={dm} />
              <DataTable.Cell darkMode={dm} bold>TOTAL</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtNum(bpf.cadreC.totalNbStagiaires)}</DataTable.Cell>
              <DataTable.Cell darkMode={dm} align="right" mono bold>{fmtNum(bpf.cadreC.totalHeuresStagiaires)}</DataTable.Cell>
            </DataTable.Row>
          </DataTable.Foot>
        </DataTable>
      </div>

      <p className={`mt-3 text-[10px] italic flex items-start gap-1.5 ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
        <Info size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        <span>
          Classification automatique des produits par regex sur les libellés (OPCO/Région/France Travail/État/CPF/etc.).
          Heures-stagiaires = effectif actuel × heures stagiaires/an (paramétrable par service via le module CCHS).
          Ventilation Cadre C par origine au prorata des produits. Soumission via <strong>bilanpedagogique.travail-emploi.gouv.fr</strong>.
        </span>
      </p>
    </DataPanel>
  );
}
