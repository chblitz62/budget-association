import React, { useMemo } from 'react';
import { Users, GraduationCap, Calendar, AlertTriangle, UserCheck, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import PlanningAbsences from '../PlanningAbsences';
import HelpIcon from '../ui/HelpIcon';
import {
  calculerPresenceEquipe,
  calculerETPReelParMoisParService,
  calculerStatsVacataires,
  calculerSalaireAnnuel,
  calculerIndicateursOETH,
} from '../../utils/calculations';
import { CHARGES_PATRONALES, CHARGES_VACATAIRE, SEUIL_RATIO_VACATAIRE, JOURS_OUVRES_AN, PRIME_SEGUR } from '../../utils/constants';

export default function TabRH({
  darkMode,
  direction,
  poleSupport,
  services,
  poolRH,
  planningAbsences,
  setPlanningAbsences,
  globalParams,
  msETP,
  focusedAgentId,
  navigateToBudgetAgent,
  getBudgetDirection,
  getBudgetPoleSupport,
  getBudgetService,
  donneesN1,
  setDonneesN1,
  setShowImportN1,
}) {
  const pool = poolRH || [];
  const roleLabel = { direction: 'Siège', formateur: 'Formateur', administratif: 'Administratif', technique: 'Technique', documentation: 'Documentation', autre: 'Autre' };

  const tousPersonnels = useMemo(() => [
    ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Ressources' })),
    ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
    ...pool.map(p => ({ ...p, source: 'Pool RH', isPoolRH: true })),
  ], [direction, poleSupport, services, pool]);

  const oethIndicateurs = useMemo(
    () => calculerIndicateursOETH(tousPersonnels),
    [tousPersonnels]
  );

  const etpReelData = useMemo(() => {
    const result = calculerETPReelParMoisParService(services, direction, poleSupport, planningAbsences, 2026, pool);
    return { ...result, lignesActives: result.lignes.filter(l => l.etp > 0) };
  }, [services, direction, poleSupport, planningAbsences, pool]);

  return (
    <>
      {/* ═══ PILOTAGE MASSE SALARIALE ═══ */}
      {(() => {
        const tousP = [
          ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction', couleur: 'slate' })),
          ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Ressources', couleur: 'cyan' })),
          ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom, couleur: 'teal' }))),
          ...pool.map(p => ({ ...p, source: 'Pool RH', couleur: 'purple', isPoolRH: true })),
        ];
        const agentsMS = calculerPresenceEquipe(tousP, planningAbsences, 2026);
        const total = tousP.reduce((acc, p) => {
          const segurResolu = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
          const s = calculerSalaireAnnuel(p.salaire, p.etp, segurResolu);
          return acc + s.total;
        }, 0);
        const totalETPReelMS = agentsMS.reduce((s, a) => s + a.presence.etpReel, 0);
        const MOIS_VAC_RH = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
        const tousVacataires = services.flatMap(s => (s.vacataires || []).map(v => {
          const planMois = v.planningMensuel;
          const heuresMensuelles = MOIS_VAC_RH.map(m => parseFloat(planMois?.[m]) || 0);
          const heures = heuresMensuelles.reduce((s, h) => s + h, 0) || (parseFloat(v.heuresAnnuelles) || 0);
          const tauxH = parseFloat(v.tauxHoraire) || 0;
          const charges = parseFloat(v.tauxCharges ?? CHARGES_VACATAIRE) / 100;
          return { ...v, serviceNom: s.nom, coutCharge: heures * tauxH * (1 + charges) };
        })).filter(v => v.coutCharge > 0);
        const totalVacataires = tousVacataires.reduce((s, v) => s + v.coutCharge, 0);
        const parRole = {};
        tousP.forEach(p => {
          const r = p.role || 'autre';
          const segurResolu = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
          const s = calculerSalaireAnnuel(p.salaire, p.etp, segurResolu);
          parRole[r] = (parRole[r] || 0) + s.total;
        });

        return (
          <div id="masse-salariale" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-slate-50 to-teal-50 border-teal-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <Users className={darkMode ? 'text-teal-400' : 'text-teal-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pilotage Masse Salariale</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{tousP.length} agents · {tousP.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP total</span>
                </div>
              </div>
              <div className="flex items-end gap-4">
                {(() => {
                  const nbSegur = tousP.filter(p => !!p.segur).length;
                  const totalSegurAnnuel = tousP.reduce((s, p) => {
                    if (!p.segur) return s;
                    const montant = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
                    return s + montant * 12 * (parseFloat(p.etp) || 0) * (1 + CHARGES_PATRONALES);
                  }, 0);
                  return nbSegur > 0 ? (
                    <div className={`text-right`}>
                      <div className={`text-xs font-bold mb-0.5 flex items-center justify-end gap-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        Prime Ségur ({nbSegur} agents)
                        <HelpIcon darkMode={darkMode} position="left" content="Prime Ségur Médico-Social : supplément brut mensuel soumis aux charges patronales (×1,42). Montant affiché = coût employeur total (brut + charges)." />
                      </div>
                      <div className={`text-lg font-black ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{Math.round(totalSegurAnnuel).toLocaleString()} €/an</div>
                      <div className={`text-xs ${darkMode ? 'text-blue-500' : 'text-blue-400'}`}>{msETP} €/ETP/mois · coût employeur</div>
                    </div>
                  ) : null;
                })()}
                <div className={`text-right`}>
                  <div className={`text-xs font-bold mb-0.5 flex items-center justify-end gap-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    Masse salariale totale
                    <HelpIcon darkMode={darkMode} position="left" content="Coût employeur total = salaire brut × 12 × ETP + prime Ségur, le tout majoré des charges patronales (42%). Inclut Siège, Pôle Ressource et tous les services." />
                  </div>
                  <div className={`text-2xl font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{Math.round(total).toLocaleString()} €/an</div>
                </div>
              </div>
            </div>

            {/* Répartition par rôle */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(parRole).sort((a, b) => b[1] - a[1]).map(([role, montant]) => {
                const pct = total > 0 ? Math.round(montant / total * 100) : 0;
                const ROLE_BADGE = {
                  direction:    darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700',
                  formateur:    darkMode ? 'bg-teal-900/40 text-teal-300'     : 'bg-teal-100 text-teal-700',
                  administratif:darkMode ? 'bg-blue-900/40 text-blue-300'     : 'bg-blue-100 text-blue-700',
                  technique:    darkMode ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700',
                  documentation:darkMode ? 'bg-amber-900/40 text-amber-300'   : 'bg-amber-100 text-amber-700',
                  responsable:  darkMode ? 'bg-cyan-900/40 text-cyan-300'     : 'bg-cyan-100 text-cyan-700',
                };
                const badgeCls = ROLE_BADGE[role] || (darkMode ? 'bg-slate-900/40 text-slate-300' : 'bg-slate-100 text-slate-700');
                return (
                  <div key={role} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${badgeCls}`}>
                    {roleLabel[role] || role} · {pct}% · {Math.round(montant/1000)}k€
                  </div>
                );
              })}
            </div>

            {/* Barre de décomposition */}
            <div className="flex rounded-full overflow-hidden h-3 mb-5">
              {Object.entries(parRole).sort((a, b) => b[1] - a[1]).map(([role, montant]) => {
                const pct = total > 0 ? (montant / total) * 100 : 0;
                const colors = { direction: '#8b5cf6', formateur: '#14b8a6', administratif: '#3b82f6', technique: '#f97316', documentation: '#f59e0b', autre: '#94a3b8' };
                return <div key={role} style={{ width: `${pct}%`, background: colors[role] || '#94a3b8' }} title={`${roleLabel[role]||role}: ${Math.round(montant).toLocaleString()} €`} />;
              })}
            </div>

            {/* Tableau détaillé */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} uppercase font-black`}>
                    <th className="text-left pb-2 pl-1">Agent</th>
                    <th className="text-left pb-2">Service</th>
                    <th className="text-left pb-2">Rôle</th>
                    <th className="text-right pb-2">ETP</th>
                    <th className="text-right pb-2 text-teal-500" title="ETP réel calculé depuis le planning absences">ETP réel</th>
                    <th className="text-right pb-2">Sal. brut/mois</th>
                    <th className="text-right pb-2">Ségur</th>
                    <th className="text-right pb-2">Charges</th>
                    <th className="text-right pb-2 pr-1">Coût total/an</th>
                  </tr>
                </thead>
                <tbody>
                  {agentsMS.map((p, idx) => {
                    const segurResolu = p.segur === true ? msETP : (parseFloat(p.segur) || 0);
                    const s = calculerSalaireAnnuel(p.salaire, p.etp, segurResolu);
                    const isDir = p.source === 'Direction';
                    const etpReel = p.presence.etpReel;
                    const etpDelta = parseFloat(p.etp) - etpReel;
                    return (
                      <tr key={idx} id={`agent-rh-${p.id}`} className={`border-t transition-all duration-700 ${focusedAgentId === p.id ? (darkMode ? 'bg-yellow-900/40' : 'bg-yellow-50') : (darkMode ? 'border-gray-700' : 'border-slate-100')} ${p.isPoolRH ? (darkMode ? 'bg-purple-900/10' : 'bg-purple-50/40') : isDir ? (darkMode ? 'bg-violet-900/10' : 'bg-violet-50/50') : ''}`}>
                        <td className={`py-1.5 pl-1 font-bold max-w-[180px]`}>
                          {p.isPoolRH ? (
                            <span className={`flex items-center gap-1.5 font-bold truncate max-w-full ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${darkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>Pool</span>
                              <span className="truncate">{p.titre || <span className="italic opacity-50">Sans nom</span>}</span>
                            </span>
                          ) : (
                            <button onClick={() => navigateToBudgetAgent(p.id)} className={`group/link flex items-center gap-1 text-left font-bold truncate max-w-full ${darkMode ? 'text-white hover:text-teal-300' : 'text-slate-800 hover:text-teal-600'} transition-colors`} title={`Voir ${p.titre} dans Budget`}>
                              <span className="truncate">{p.titre}</span>
                              <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 shrink-0 transition-opacity" />
                            </button>
                          )}
                        </td>
                        <td className={`py-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} max-w-[120px] truncate`} title={p.source}>{p.source}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                            {roleLabel[p.role] || p.role || '—'}
                          </span>
                          {p.rqth && <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-bold ${darkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>RQTH</span>}
                        </td>
                        <td className={`py-1.5 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.etp}</td>
                        <td className={`py-1.5 text-right font-bold ${etpDelta > 0.05 ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-teal-400' : 'text-teal-600')}`} title={etpDelta > 0.05 ? `Absences : -${etpDelta.toFixed(2)} ETP` : 'Présence nominale'}>
                          {etpReel.toFixed(2)}
                          {etpDelta > 0.05 && <span className="ml-1 text-xs opacity-70">(-{etpDelta.toFixed(2)})</span>}
                        </td>
                        <td className={`py-1.5 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{p.salaire.toLocaleString()} €</td>
                        <td className={`py-1.5 text-right ${p.segur ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                          {(() => { const m = p.segur === true ? (globalParams.montantSegurETP ?? PRIME_SEGUR) : (parseFloat(p.segur) || 0); return m > 0 ? `+${m.toLocaleString()} €/m` : '—'; })()}
                        </td>
                        <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{Math.round(s.charges).toLocaleString()} €</td>
                        <td className={`py-1.5 text-right pr-1 font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{Math.round(s.total).toLocaleString()} €</td>
                      </tr>
                    );
                  })}
                </tbody>
                {tousVacataires.length > 0 && (
                  <tbody>
                    <tr className={`border-t-2 ${darkMode ? 'border-purple-800' : 'border-purple-200'}`}>
                      <td colSpan={9} className={`py-1.5 pl-1 text-xs font-black uppercase ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                        <GraduationCap size={12} className="inline mr-1" /> Vacataires pédagogiques
                      </td>
                    </tr>
                    {tousVacataires.map((v, idx) => (
                      <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700 bg-purple-900/10' : 'border-purple-100 bg-purple-50/40'}`}>
                        <td className={`py-1.5 pl-1 font-bold ${darkMode ? 'text-purple-200' : 'text-purple-800'} max-w-[180px] truncate`} title={v.nom}>{v.nom}</td>
                        <td className={`py-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} max-w-[120px] truncate`}>{v.serviceNom}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-black ${v.type === 'fi' ? (darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700') : v.type === 'fc' ? (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700')}`}>
                            {v.type === 'fi' ? 'FI' : v.type === 'fc' ? 'FC' : `Mixte ${v.pctFI}%FI`}
                          </span>
                        </td>
                        <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{parseFloat(v.heuresAnnuelles) || 0}h</td>
                        <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>—</td>
                        <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{parseFloat(v.tauxHoraire) || 0} €/h</td>
                        <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>+{v.tauxCharges ?? CHARGES_VACATAIRE}%</td>
                        <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>—</td>
                        <td className={`py-1.5 text-right pr-1 font-black ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{Math.round(v.coutCharge).toLocaleString()} €</td>
                      </tr>
                    ))}
                  </tbody>
                )}
                <tfoot>
                  <tr className={`border-t-2 font-black ${darkMode ? 'border-teal-700 bg-teal-900/20' : 'border-teal-300 bg-teal-50'}`}>
                    <td colSpan={3} className={`py-2 pl-1 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                    <td className={`py-2 text-right text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{tousP.reduce((s, p) => s + p.etp, 0).toFixed(1)}</td>
                    <td className={`py-2 text-right text-sm font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{totalETPReelMS.toFixed(1)}</td>
                    <td colSpan={3} />
                    <td className={`py-2 text-right pr-1 text-base ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{Math.round(total + totalVacataires).toLocaleString()} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ═══ TABLEAU TRANSVERSAL PRÉSENCE / ABSENCES ═══ */}
      {(() => {
        const ANNEE = 2026;
        const tousAgents = [
          ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
          ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Ressources' })),
          ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
          ...pool.map(p => ({ ...p, source: 'Pool RH', isPoolRH: true })),
        ];
        const agentsAvecPresence = calculerPresenceEquipe(tousAgents, planningAbsences, ANNEE);
        const totalETPContrat = agentsAvecPresence.reduce((s, a) => s + parseFloat(a.etp), 0);
        const totalETPReel    = agentsAvecPresence.reduce((s, a) => s + a.presence.etpReel, 0);
        const totalMaladie    = agentsAvecPresence.reduce((s, a) => s + a.presence.joursMaladiePlanning, 0);
        const totalCongesP    = agentsAvecPresence.reduce((s, a) => s + a.presence.joursCongesPlanning, 0);
        const totalRTTP       = agentsAvecPresence.reduce((s, a) => s + a.presence.joursRTTPlanning, 0);
        const totalFormationP = agentsAvecPresence.reduce((s, a) => s + a.presence.joursFormationPlanning, 0);
        const tauxPresenceMoyen = totalETPContrat > 0 ? (totalETPReel / totalETPContrat) * 100 : 100;

        return (
          <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <Calendar className={darkMode ? 'text-teal-400' : 'text-teal-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Synthèse Présence / Absences</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                    Transversalité RH ↔ Budget · Année {ANNEE} · Base {JOURS_OUVRES_AN} jours ouvrés
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'ETP contrat', val: totalETPContrat.toFixed(1), color: darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700' },
                  { label: 'ETP réel', val: totalETPReel.toFixed(1), color: darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-700' },
                  { label: 'Taux présence', val: `${tauxPresenceMoyen.toFixed(1)}%`, color: tauxPresenceMoyen >= 95 ? (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700') },
                  { label: 'J. maladie (plan.)', val: totalMaladie, color: darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700' },
                ].map((k, i) => (
                  <div key={i} className={`px-3 py-2 rounded-2xl text-center ${k.color}`}>
                    <div className="text-xs font-bold opacity-75">{k.label}</div>
                    <div className="text-xl font-black">{k.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} uppercase font-black text-[11px]`}>
                    <th className="text-left pb-2 pl-1">Agent</th>
                    <th className="text-left pb-2">Service</th>
                    <th className="text-right pb-2">ETP contrat</th>
                    <th className="text-right pb-2" title="Congés payés configurés">CP prévu</th>
                    <th className="text-right pb-2" title="RTT configurés">RTT prévu</th>
                    <th className="text-right pb-2 text-blue-500" title="Congés pris dans le planning">CP réel</th>
                    <th className="text-right pb-2 text-purple-500" title="RTT pris dans le planning">RTT réel</th>
                    <th className="text-right pb-2 text-red-500" title="Maladie/Arrêt dans le planning">Maladie</th>
                    <th className="text-right pb-2 text-green-500" title="Formation dans le planning">Formation</th>
                    <th className="text-right pb-2">Présence eff.</th>
                    <th className="text-right pb-2">ETP réel</th>
                    <th className="text-right pb-2 pr-1 text-red-500" title="Coût carence maladie à charge employeur (j1-j3 non remboursés SS)">Coût carence</th>
                  </tr>
                </thead>
                <tbody>
                  {agentsAvecPresence.map((a, idx) => {
                    const pr = a.presence;
                    const ecartCP   = pr.joursCongesPlanning - pr.joursConges;
                    const ecartRTT  = pr.joursRTTPlanning - pr.nbJoursRTT;
                    const alertCP   = Math.abs(ecartCP) > 2;
                    const alertMal  = pr.joursMaladiePlanning > 10;
                    return (
                      <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'} ${idx % 2 === 0 ? '' : darkMode ? 'bg-gray-700/20' : 'bg-slate-50/50'}`}>
                        <td className={`py-1.5 pl-1 font-bold ${darkMode ? 'text-white' : 'text-slate-800'} max-w-[160px] truncate`} title={a.titre}>{a.titre}</td>
                        <td className={`py-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} max-w-[120px] truncate`}>{a.source}</td>
                        <td className={`py-1.5 text-right font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{parseFloat(a.etp).toFixed(2)}</td>
                        <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{pr.joursConges}j</td>
                        <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{pr.nbJoursRTT > 0 ? `${pr.nbJoursRTT}j` : '—'}</td>
                        <td className={`py-1.5 text-right font-bold ${alertCP ? 'text-amber-500' : (darkMode ? 'text-blue-400' : 'text-blue-600')}`}>
                          {pr.joursCongesPlanning > 0 ? `${pr.joursCongesPlanning}j` : '—'}
                          {alertCP && <span className="ml-1 text-amber-400" title={`Écart: ${ecartCP > 0 ? '+' : ''}${ecartCP}j`}>⚠</span>}
                        </td>
                        <td className={`py-1.5 text-right font-bold ${ecartRTT > 2 ? 'text-amber-500' : (darkMode ? 'text-purple-400' : 'text-purple-600')}`}>
                          {pr.joursRTTPlanning > 0 ? `${pr.joursRTTPlanning}j` : '—'}
                        </td>
                        <td className={`py-1.5 text-right font-bold ${alertMal ? 'text-red-500' : (pr.joursMaladiePlanning > 0 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-gray-600' : 'text-slate-300'))}`}>
                          {pr.joursMaladiePlanning > 0 ? `${pr.joursMaladiePlanning}j` : '—'}
                          {alertMal && <span className="ml-1" title="Absentéisme élevé (>10j)">⚠</span>}
                        </td>
                        <td className={`py-1.5 text-right ${pr.joursFormationPlanning > 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                          {pr.joursFormationPlanning > 0 ? `${pr.joursFormationPlanning}j` : '—'}
                        </td>
                        <td className={`py-1.5 text-right font-bold ${pr.tauxPresence < 0.9 ? 'text-amber-500' : (darkMode ? 'text-teal-300' : 'text-teal-700')}`}>
                          {pr.joursPresence}j <span className="text-xs opacity-60">({(pr.tauxPresence*100).toFixed(0)}%)</span>
                        </td>
                        <td className={`py-1.5 text-right font-black ${pr.etpReel < parseFloat(a.etp) * 0.9 ? 'text-amber-500' : (darkMode ? 'text-teal-200' : 'text-teal-800')}`}>
                          {pr.etpReel.toFixed(2)}
                        </td>
                        <td className={`py-1.5 text-right pr-1 font-bold ${pr.coutCarence > 0 ? 'text-red-500' : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                          {pr.coutCarence > 0 ? `${Math.round(pr.coutCarence).toLocaleString()} €` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {(() => {
                    const totalCarence = agentsAvecPresence.reduce((s, a) => s + a.presence.coutCarence, 0);
                    return (
                      <tr className={`border-t-2 font-black ${darkMode ? 'border-teal-700 bg-teal-900/20' : 'border-teal-300 bg-teal-50'}`}>
                        <td colSpan={2} className={`py-2 pl-1 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                        <td className={`py-2 text-right text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{totalETPContrat.toFixed(1)}</td>
                        <td colSpan={2} />
                        <td className={`py-2 text-right ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{totalCongesP > 0 ? `${totalCongesP}j` : '—'}</td>
                        <td className={`py-2 text-right ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{totalRTTP > 0 ? `${totalRTTP}j` : '—'}</td>
                        <td className={`py-2 text-right ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{totalMaladie > 0 ? `${totalMaladie}j` : '—'}</td>
                        <td className={`py-2 text-right ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{totalFormationP > 0 ? `${totalFormationP}j` : '—'}</td>
                        <td className={`py-2 text-right ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{tauxPresenceMoyen.toFixed(1)}%</td>
                        <td className={`py-2 text-right text-base ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{totalETPReel.toFixed(1)}</td>
                        <td className={`py-2 text-right pr-1 text-base font-black ${totalCarence > 0 ? 'text-red-500' : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                          {totalCarence > 0 ? `${Math.round(totalCarence).toLocaleString()} €` : '—'}
                        </td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>

            {/* Synthèse impact budgétaire des absences */}
            {(() => {
              const totalCarence = agentsAvecPresence.reduce((s, a) => s + a.presence.coutCarence, 0);
              const totalJoursAbs = totalMaladie + totalCongesP + totalRTTP;
              const impactETP = totalETPContrat - totalETPReel;
              if (totalJoursAbs === 0 && totalCarence === 0) return null;
              return (
                <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                  <div className={`text-xs font-black uppercase mb-3 flex items-center gap-2 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                    🔗 Impact budgétaire des absences (synchronisé dans Budget & Subvention)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Coût carence maladie', val: `${Math.round(totalCarence).toLocaleString()} €`, sub: 'Ajouté au budget employeur', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50', txt: darkMode ? 'text-red-400' : 'text-red-700' },
                      { label: 'Perte ETP effective', val: `-${impactETP.toFixed(2)} ETP`, sub: 'vs ETP contractuel', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50', txt: darkMode ? 'text-amber-400' : 'text-amber-700' },
                      { label: 'J. maladie/arrêt', val: `${totalMaladie} j`, sub: 'Saisis dans Planning', bg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50', txt: darkMode ? 'text-orange-400' : 'text-orange-700' },
                      { label: 'Taux présence moyen', val: `${tauxPresenceMoyen.toFixed(1)}%`, sub: impactETP > 0.5 ? '⚠ Sous 95% recommandé' : '✓ Nominal', bg: tauxPresenceMoyen >= 95 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-amber-900/30' : 'bg-amber-50'), txt: tauxPresenceMoyen >= 95 ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : (darkMode ? 'text-amber-400' : 'text-amber-700') },
                    ].map(k => (
                      <div key={k.label} className={`p-3 rounded-xl text-center ${k.bg}`}>
                        <div className={`text-[10px] font-bold uppercase mb-1 ${k.txt}`}>{k.label}</div>
                        <div className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{k.val}</div>
                        <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Légende */}
            <div className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              <span className="font-bold">Légende : </span>
              CP prévu/réel = congés payés configurés vs. saisis dans le planning ·
              RTT prévu/réel = idem pour RTT ·
              Présence eff. = {JOURS_OUVRES_AN}j - CP configurés - RTT configurés - Maladie (planning) ·
              ETP réel = ETP contrat × taux présence · Coût carence = j1-j3 maladie à charge employeur ·
              <span className="text-amber-500"> ⚠</span> = écart &gt; 2j ou maladie &gt; 10j
            </div>
          </div>
        );
      })()}

      {/* ═══ TABLEAU DE BORD VACATAIRES ═══ */}
      {(() => {
        const stats = calculerStatsVacataires(services, msETP);
        if (stats.totalVacataires === 0) return null;
        const totalMassePerm = services.reduce((s, srv) => {
          const b = getBudgetService(srv);
          return s + b.salairesPersonnelPermanent;
        }, 0);
        const ratioGlobal = (totalMassePerm + stats.totalCout) > 0 ? stats.totalCout / (totalMassePerm + stats.totalCout) * 100 : 0;
        const coutHoraireGlobal = stats.totalHeures > 0 ? stats.totalCout / stats.totalHeures : 0;

        return (
          <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <GraduationCap className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Tableau de bord Vacataires</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.totalVacataires} intervenant{stats.totalVacataires > 1 ? 's' : ''} · Analyse FC / FI · Contrôle budgétaire</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Coût total', val: `${Math.round(stats.totalCout).toLocaleString()} €`, color: darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700' },
                  { label: 'Part FI', val: `${Math.round(stats.totalFI).toLocaleString()} €`, color: darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700' },
                  { label: 'Part FC', val: `${Math.round(stats.totalFC).toLocaleString()} €`, color: darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700' },
                  { label: 'Heures/an', val: `${Math.round(stats.totalHeures)} h`, color: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700' },
                  { label: 'Ratio / MS', val: `${ratioGlobal.toFixed(1)}%`, color: ratioGlobal > SEUIL_RATIO_VACATAIRE ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') },
                  { label: '€/heure moy.', val: `${Math.round(coutHoraireGlobal)} €`, color: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700' },
                ].map((k, i) => (
                  <div key={i} className={`px-3 py-2 rounded-2xl text-center ${k.color}`}>
                    <div className="text-xs font-bold opacity-75">{k.label}</div>
                    <div className="text-lg font-black">{k.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertes */}
            {stats.alertes.length > 0 && (
              <div className="mb-4 space-y-1">
                {stats.alertes.map((a, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-bold ${a.type === 'contrat' ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-50 border border-red-200 text-red-700') : a.type === 'heures' ? (darkMode ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-50 border border-orange-200 text-orange-700') : (darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 border border-amber-200 text-amber-700')}`}>
                    <AlertTriangle size={12} />
                    <span className="font-black">{a.service}{a.nom ? ` · ${a.nom}` : ''} :</span> {a.msg}
                  </div>
                ))}
              </div>
            )}

            {/* Planning mensuel coût global */}
            <div className={`mb-5 p-3 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/70 border border-purple-100'}`}>
              <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Coût mensuel global vacataires</div>
              <div className="flex gap-1 h-12 items-end">
                {stats.coutMensuelTotal.map((c, i) => {
                  const max = Math.max(...stats.coutMensuelTotal, 1);
                  const pct = (c / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className={`w-full rounded-t ${darkMode ? 'bg-purple-600' : 'bg-purple-400'}`} style={{ height: `${pct}%`, minHeight: c > 0 ? '2px' : '0' }} title={`${stats.moisCourts[i]} : ${Math.round(c).toLocaleString()} €`} />
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{stats.moisCourts[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tableau par service */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} uppercase font-black text-[11px]`}>
                    <th className="text-left pb-2 pl-1">Service</th>
                    <th className="text-left pb-2">Intervenant</th>
                    <th className="text-left pb-2">Contrat</th>
                    <th className="text-right pb-2">Heures</th>
                    <th className="text-right pb-2">€/h</th>
                    <th className="text-right pb-2">Coût chargé</th>
                    <th className="text-right pb-2 text-amber-500">FI (€)</th>
                    <th className="text-right pb-2 text-blue-500">FC (€)</th>
                    <th className="text-right pb-2">Ratio</th>
                    <th className="text-right pb-2 pr-1">Alerte</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.parService.map(ps => ps.vacataires.map((v, vi) => (
                    <tr key={`${ps.service}-${vi}`} className={`border-t ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                      <td className={`py-1.5 pl-1 font-bold max-w-[120px] truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{vi === 0 ? ps.service : ''}</td>
                      <td className={`py-1.5 font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{v.nom}</td>
                      <td className={`py-1.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${v.type === 'fi' ? (darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700') : v.type === 'fc' ? (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700')}`}>{v.type.toUpperCase()}</span>
                        {' '}
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{v.typeContrat === 'auto_entrepreneur' ? 'AE' : v.typeContrat === 'convention' ? 'Conv.' : v.typeContrat === 'intervention' ? 'Interv.' : '?'}</span>
                      </td>
                      <td className={`py-1.5 text-right font-bold ${v.depasse ? 'text-red-500' : (darkMode ? 'text-gray-300' : 'text-slate-700')}`}>{v.heures}h</td>
                      <td className={`py-1.5 text-right ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{v.tauxHoraire}€</td>
                      <td className={`py-1.5 text-right font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{Math.round(v.coutCharge).toLocaleString()} €</td>
                      <td className={`py-1.5 text-right ${v.coutFI > 0 ? (darkMode ? 'text-amber-400' : 'text-amber-700') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>{v.coutFI > 0 ? `${Math.round(v.coutFI).toLocaleString()} €` : '—'}</td>
                      <td className={`py-1.5 text-right ${v.coutFC > 0 ? (darkMode ? 'text-blue-400' : 'text-blue-700') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>{v.coutFC > 0 ? `${Math.round(v.coutFC).toLocaleString()} €` : '—'}</td>
                      <td className={`py-1.5 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{vi === 0 ? `${ps.ratioVacataires.toFixed(0)}%` : ''}</td>
                      <td className="py-1.5 text-right pr-1">
                        {v.depasse && <span className="text-red-500 font-black">⚠h</span>}
                        {v.contratExpire && <span className="text-red-500 font-black ml-1">⚠exp.</span>}
                        {!v.dateFin && <span className={`text-amber-500 ml-1`}>⚠∅</span>}
                      </td>
                    </tr>
                  )))}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 font-black ${darkMode ? 'border-purple-700 bg-purple-900/20' : 'border-purple-300 bg-purple-50'}`}>
                    <td colSpan={3} className={`py-2 pl-1 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL ({stats.totalVacataires} intervenants)</td>
                    <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{Math.round(stats.totalHeures)}h</td>
                    <td />
                    <td className={`py-2 text-right text-base ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>{Math.round(stats.totalCout).toLocaleString()} €</td>
                    <td className={`py-2 text-right ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{Math.round(stats.totalFI).toLocaleString()} €</td>
                    <td className={`py-2 text-right ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{Math.round(stats.totalFC).toLocaleString()} €</td>
                    <td className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{ratioGlobal.toFixed(1)}%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Coût par étudiant par service */}
            {stats.parService.some(ps => ps.coutParEtudiant) && (
              <div className={`mt-4 pt-4 border-t flex flex-wrap gap-3 ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
                <span className={`text-xs font-black uppercase self-center ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Coût vacataires / étudiant :</span>
                {stats.parService.filter(ps => ps.coutParEtudiant).map(ps => (
                  <div key={ps.service} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white border border-purple-200 text-slate-700'}`}>
                    {ps.service} · {Math.round(ps.coutParEtudiant.coutVacatairesParEtudiant).toLocaleString()} €/étud.
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ PYRAMIDE DES ÂGES ═══ */}
      {(() => {
        const ANNEE = 2026;
        const tousP = [
          ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
          ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Ressources' })),
          ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
          ...pool.map(p => ({ ...p, source: 'Pool RH', isPoolRH: true })),
        ];
        const avecAge = tousP.filter(p => p.anneeNaissance > 0);

        if (avecAge.length === 0) {
          return (
            <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Users className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pyramide des âges</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Renseignez les années de naissance sur les fiches personnel pour afficher la pyramide</span>
                </div>
              </div>
            </div>
          );
        }

        const TRANCHES = [
          { label: '< 30 ans',  min: 0,  max: 29  },
          { label: '30–39 ans', min: 30, max: 39  },
          { label: '40–49 ans', min: 40, max: 49  },
          { label: '50–54 ans', min: 50, max: 54  },
          { label: '55–59 ans', min: 55, max: 59  },
          { label: '60 ans +',  min: 60, max: 999 },
        ];
        const COLORS = ['#6366f1','#14b8a6','#3b82f6','#f59e0b','#f97316','#ef4444'];

        const ageCounts = TRANCHES.map(t => ({
          ...t,
          agents: avecAge.filter(p => {
            const age = ANNEE - p.anneeNaissance;
            return age >= t.min && age <= t.max;
          }),
        }));

        const ages = avecAge.map(p => ANNEE - p.anneeNaissance);
        const ageMoyen = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
        const seniors = avecAge.filter(p => (ANNEE - p.anneeNaissance) >= 55);
        const retraite5ans = avecAge.filter(p => (ANNEE - p.anneeNaissance) >= 57);
        const retraite10ans = avecAge.filter(p => (ANNEE - p.anneeNaissance) >= 52);
        const maxCount = Math.max(...ageCounts.map(t => t.agents.length), 1);

        return (
          <div id="pyramide-ages" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <Users className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pyramide des âges</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {avecAge.length}/{tousP.length} agents renseignés · Projection {ANNEE}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                  <div className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Âge moyen</div>
                  <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{ageMoyen} ans</div>
                </div>
                <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-orange-900/40' : 'bg-orange-100'}`}>
                  <div className={`text-xs font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>≥ 55 ans (séniors)</div>
                  <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{seniors.length}</div>
                </div>
                <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-red-900/40' : 'bg-red-100'}`}>
                  <div className={`text-xs font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Retraite ~5 ans</div>
                  <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{retraite5ans.length}</div>
                </div>
                <div className={`text-center px-4 py-2 rounded-2xl ${darkMode ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
                  <div className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Retraite ~10 ans</div>
                  <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{retraite10ans.length}</div>
                </div>
              </div>
            </div>

            {/* Graphique recharts */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={ageCounts.map((t, i) => ({ label: t.label, count: t.agents.length, color: COLORS[i] }))}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke={darkMode ? '#9ca3af' : '#64748b'} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={80} stroke={darkMode ? '#9ca3af' : '#64748b'} tick={{ fontSize: 12, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', fontSize: 13 }}
                  formatter={(v) => [`${v} agent${v > 1 ? 's' : ''}`, 'Effectif']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 12, fontWeight: 700, fill: darkMode ? '#d1d5db' : '#475569' }}>
                  {ageCounts.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Détail agents par tranche */}
            <div className="space-y-2 mt-4 mb-5">
              {ageCounts.filter(t => t.agents.length > 0).map((t, i) => (
                <div key={t.label} className="flex items-center gap-2 flex-wrap">
                  <span className="w-24 text-xs font-bold text-right flex-shrink-0" style={{ color: COLORS[ageCounts.indexOf(t)] }}>{t.label}</span>
                  <div className="flex flex-wrap gap-1">
                    {t.agents.map(p => (
                      <span key={p.id + p.source} className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white border text-slate-500'}`}>
                        {p.titre}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Alerte séniors */}
            {seniors.length > 0 && (
              <div className={`p-3 rounded-xl text-sm ${darkMode ? 'bg-orange-900/30 border border-orange-700 text-orange-300' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
                <AlertTriangle size={14} className="inline mr-1" />
                <strong>{seniors.length} agent{seniors.length > 1 ? 's' : ''} ≥ 55 ans</strong> — anticipez les recrutements et transferts de compétences.
                {retraite5ans.length > 0 && <span className="ml-2 font-bold">Départs retraite estimés d'ici 5 ans : {retraite5ans.length}</span>}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ RQTH / AGEFIPH ═══ */}
      {(() => {
        const {
          totalETP, totalETPRqth, obligationETP,
          contributionEstimee: contribution, aidesEstimees,
          estConforme, tauxRqth, agentsRqth: rqthPersonnels, nbAgents,
        } = oethIndicateurs;
        const SEUIL_OETH = 20;
        const fmt = n => Math.round(n).toLocaleString('fr-FR');

        return (
          <div id="rqth-agefiph" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-orange-900' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <UserCheck className={darkMode ? 'text-orange-400' : 'text-orange-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>RQTH & OETH</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    Obligation Emploi Travailleurs Handicapés · AGEFIPH
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm ${
                totalETP < SEUIL_OETH
                  ? darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'
                  : estConforme
                    ? darkMode ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : darkMode ? 'bg-red-900/40 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {totalETP < SEUIL_OETH ? '— Non soumis (< 20 ETP)' : estConforme ? '✓ Conforme OETH' : '⚠ Non conforme OETH'}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Effectif total (ETP)', val: totalETP.toFixed(1), sub: `${nbAgents} agents`, color: darkMode ? 'text-slate-300' : 'text-slate-700', bg: darkMode ? 'bg-gray-700' : 'bg-white' },
                { label: 'ETP RQTH', val: totalETPRqth.toFixed(1), sub: `${rqthPersonnels.length} agents · ${tauxRqth.toFixed(1)}%`, color: darkMode ? 'text-orange-300' : 'text-orange-700', bg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50' },
                { label: totalETP >= SEUIL_OETH ? 'Obligation OETH (6%)' : 'Obligation OETH', val: totalETP >= SEUIL_OETH ? obligationETP.toFixed(1) + ' ETP' : 'Non applicable', sub: totalETP >= SEUIL_OETH ? `Seuil ≥ ${SEUIL_OETH} ETP` : `Effectif < ${SEUIL_OETH} ETP`, color: darkMode ? 'text-blue-300' : 'text-blue-700', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
                estConforme
                  ? { label: 'Aides AGEFIPH estimées', val: aidesEstimees > 0 ? fmt(aidesEstimees) + ' €/an' : '—', sub: '~1 800 €/ETP RQTH', color: darkMode ? 'text-emerald-300' : 'text-emerald-700', bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50' }
                  : { label: 'Contribution AGEFIPH', val: contribution > 0 ? fmt(contribution) + ' €/an' : '—', sub: 'Estimation (coeff. 400)', color: darkMode ? 'text-red-300' : 'text-red-700', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50' },
              ].map((k, i) => (
                <div key={i} className={`p-3 rounded-2xl ${k.bg}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                  <div className={`text-lg font-black ${k.color}`}>{k.val}</div>
                  <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</div>
                </div>
              ))}
            </div>

            {totalETP >= SEUIL_OETH && (
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Taux RQTH actuel : <strong className={darkMode ? 'text-orange-300' : 'text-orange-700'}>{tauxRqth.toFixed(1)}%</strong></span>
                  <span className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Objectif OETH : 6%</span>
                </div>
                <div className={`w-full h-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} overflow-hidden relative`}>
                  <div className={`h-full rounded-full transition-all ${tauxRqth >= 6 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, tauxRqth / 6 * 100)}%` }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-blue-500" style={{ left: '100%', transform: 'translateX(-1px)' }} title="Objectif 6%" />
                </div>
                <div className={`text-xs mt-1 ${tauxRqth >= 6 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-orange-400' : 'text-orange-600')} font-bold`}>
                  {tauxRqth >= 6 ? `Excédent : +${(totalETPRqth - obligationETP).toFixed(1)} ETP` : `Manque : ${(obligationETP - totalETPRqth).toFixed(1)} ETP pour atteindre l'objectif`}
                </div>
              </div>
            )}

            {rqthPersonnels.length > 0 ? (
              <div>
                <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Agents RQTH</div>
                <div className="flex flex-wrap gap-2">
                  {rqthPersonnels.map(p => (
                    <div key={p.id + p.source} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-orange-900/30 border border-orange-700 text-orange-300' : 'bg-orange-100 border border-orange-200 text-orange-800'}`}>
                      <UserCheck size={12} />
                      {p.titre}
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>({p.source} · {p.etp} ETP)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className={`text-sm text-center py-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Aucun agent RQTH déclaré — cochez la case RQTH sur les fiches personnel pour les déclarer.
              </p>
            )}
          </div>
        );
      })()}

      {/* PLANNING DES ABSENCES */}
      <PlanningAbsences
        direction={direction}
        poleSupport={poleSupport}
        services={services}
        poolRH={pool}
        planningAbsences={planningAbsences}
        setPlanningAbsences={setPlanningAbsences}
        darkMode={darkMode}
      />

      {/* TABLEAU ETP RÉEL PAR MOIS PAR SERVICE */}
      {etpReelData.lignesActives.length > 0 && (() => {
        const { lignesActives, total, totalContractuel, moisLabels } = etpReelData;
        return (
          <div className={`rounded-3xl shadow-lg border-2 p-6 mb-8 ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200'}`}>
            <div className="flex items-center gap-3 mb-5">
              <div>
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>ETP réel par mois</h2>
                <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  Présence effective après congés, RTT et arrêts — ETP contractuel total : {totalContractuel.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className={`text-left px-3 py-2 font-bold sticky left-0 min-w-[160px] ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-teal-50 text-slate-600'}`}>Service</th>
                    <th className={`px-2 py-2 text-center font-bold ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-teal-50 text-slate-500'}`}>ETP<br/>contrat</th>
                    {moisLabels.map(m => (
                      <th key={m} className={`px-2 py-2 text-center font-bold w-14 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-teal-50 text-slate-500'}`}>{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lignesActives.map((ligne, idx) => {
                    const maxETP = ligne.etp;
                    return (
                      <tr key={ligne.nom} className={idx % 2 === 0 ? (darkMode ? 'bg-gray-800/50' : 'bg-white/60') : (darkMode ? 'bg-gray-700/30' : 'bg-teal-50/40')}>
                        <td className={`px-3 py-1.5 font-bold sticky left-0 ${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-700' : 'bg-teal-50/60')} ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {ligne.nom}
                        </td>
                        <td className={`px-2 py-1.5 text-center font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {ligne.etp.toFixed(2)}
                        </td>
                        {ligne.mensuel.map((etp, m) => {
                          const pct = maxETP > 0 ? etp / maxETP : 1;
                          const color = pct >= 0.95
                            ? (darkMode ? 'text-emerald-400' : 'text-emerald-700')
                            : pct >= 0.80
                            ? (darkMode ? 'text-yellow-400' : 'text-yellow-700')
                            : (darkMode ? 'text-red-400' : 'text-red-600');
                          return (
                            <td key={m} className={`px-1 py-1.5 text-center font-bold ${color}`}>
                              {etp.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 ${darkMode ? 'border-teal-700 bg-gray-700' : 'border-teal-300 bg-teal-100'}`}>
                    <td className={`px-3 py-2 font-black sticky left-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-teal-100 text-slate-800'}`}>Total</td>
                    <td className={`px-2 py-2 text-center font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{totalContractuel.toFixed(2)}</td>
                    {total.map((t, m) => (
                      <td key={m} className={`px-1 py-2 text-center font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{t.toFixed(2)}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className={`text-xs mt-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              Vert ≥ 95 % de l'ETP contractuel · Jaune ≥ 80 % · Rouge &lt; 80 %
            </p>
          </div>
        );
      })()}
    </>
  );
}
