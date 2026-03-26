/**
 * TabTresorerie — Trésorerie mensuelle prévisionnelle
 * Décompose les décaissements : Salaires | Exploitation saisonnalisée | Annuités emprunts
 * Les dotations aux amortissements (charges comptables non décaissées) sont exclues.
 */
import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

const fmt  = (v) => Math.round(v).toLocaleString('fr-FR') + ' €';
const fmtK = (v) => { const k = v / 1000; return (k >= 0 ? '+' : '') + k.toFixed(1) + 'k'; };

function HelpPopover({ darkMode, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className={`p-0.5 rounded-full transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <div className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl shadow-xl text-[11px] leading-relaxed
          ${darkMode ? 'bg-zinc-800 border border-zinc-600 text-gray-300' : 'bg-white border border-slate-200 text-slate-700'}`}>
          {children}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${darkMode ? 'border-t-zinc-800' : 'border-t-white'}`} />
        </div>
      )}
    </span>
  );
}

export default function TabTresorerie({ tresorerie, darkMode }) {
  const [showDetail, setShowDetail] = useState(false);
  const [chartMode, setChartMode] = useState('cumul'); // 'cumul' | 'decompose'

  if (!tresorerie) return null;
  const { mois, totalEncaissements, totalDecaissements, alertesMois, _debug } = tresorerie;
  const { totalSalairesAnnuels = 0, totalInteretsAnnuels = 0, capitalRembourseAnnuel = 0 } = _debug || {};

  const chargesFixesParMois = (totalSalairesAnnuels + totalInteretsAnnuels + capitalRembourseAnnuel) / 12;
  const annuitesParMois     = (totalInteretsAnnuels + capitalRembourseAnnuel) / 12;
  const salairesParMois     = totalSalairesAnnuels / 12;

  const soldeAnnuel  = totalEncaissements - totalDecaissements;
  const hasAlertes   = alertesMois.length > 0;
  const hasEmprunts  = annuitesParMois > 0;

  const chartData = mois.map((m, i) => {
    const exploitationMois = m.decaissements - chargesFixesParMois;
    return {
      name: m.nom,
      soldeCumule:  Math.round(m.soldeCumule),
      solde:        Math.round(m.solde),
      encaissements: Math.round(m.encaissements),
      salaires:      Math.round(salairesParMois),
      exploitation:  Math.round(Math.max(0, exploitationMois)),
      annuites:      Math.round(annuitesParMois),
    };
  });

  const totalAnnuites     = (totalInteretsAnnuels + capitalRembourseAnnuel);
  const totalExploitation = totalDecaissements - totalSalairesAnnuels - totalAnnuites;

  return (
    <div className={`rounded-3xl border shadow-md p-6 mb-8 ${darkMode ? 'bg-gray-800/40 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h2 className={`text-xl font-black flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500"><TrendingUp size={22} /></div>
          Trésorerie réelle — 12 mois
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setChartMode(v => v === 'cumul' ? 'decompose' : 'cumul')}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
              chartMode === 'decompose'
                ? 'bg-cyan-500 text-white'
                : darkMode ? 'bg-zinc-700 text-gray-300 hover:bg-zinc-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {chartMode === 'cumul' ? 'Vue décomposée' : 'Vue cumulée'}
          </button>
          <div className={`px-4 py-2 rounded-2xl font-black text-sm ${
            soldeAnnuel >= 0
              ? darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
              : darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-700'
          }`}>
            Solde annuel : {soldeAnnuel >= 0 ? '+' : ''}{Math.round(soldeAnnuel).toLocaleString()} €
          </div>
        </div>
      </div>

      {/* ── KPIs décomposition ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Encaissements', val: totalEncaissements, color: 'emerald' },
          { label: 'Salaires & charges', val: totalSalairesAnnuels, color: 'blue', sub: `${salairesParMois > 0 ? Math.round(salairesParMois / 1000) + 'k/mois' : '—'}` },
          { label: 'Exploitation', val: Math.max(0, totalExploitation), color: 'amber', sub: 'saisonnalisée' },
          { label: hasEmprunts ? 'Annuités emprunts' : 'Emprunts', val: totalAnnuites, color: hasEmprunts ? 'rose' : 'slate',
            help: true, sub: hasEmprunts ? `Capital + intérêts` : 'Aucun emprunt' },
        ].map((k, i) => (
          <div key={i} className={`rounded-xl p-3 ${darkMode ? 'bg-zinc-700/60' : 'bg-slate-50 border border-slate-100'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              {k.label}
              {k.help && (
                <HelpPopover darkMode={darkMode}>
                  <strong className="block mb-1">Annuités d'emprunt (flux de trésorerie)</strong>
                  <p>= Capital remboursé + Intérêts financiers</p>
                  <p className="mt-1 text-amber-500 font-bold">≠ Dotation aux amortissements</p>
                  <p className="mt-1">Les amortissements sont une charge <em>comptable</em> (étalement du coût d'un investissement). Ils <strong>ne sortent pas de la trésorerie</strong> — contrairement au remboursement d'emprunt qui, lui, est un flux réel décaissé.</p>
                </HelpPopover>
              )}
            </div>
            <div className={`text-lg font-black tabular-nums mt-1 ${
              k.color === 'emerald' ? 'text-emerald-500' :
              k.color === 'blue'    ? darkMode ? 'text-blue-300' : 'text-blue-700' :
              k.color === 'amber'   ? 'text-amber-500' :
              k.color === 'rose'    ? 'text-rose-500' :
              darkMode ? 'text-gray-400' : 'text-slate-400'
            }`}>
              {k.val > 0 ? `${Math.round(k.val / 1000)}k €` : '—'}
            </div>
            {k.sub && <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── ALERTE ── */}
      {hasAlertes ? (
        <div className={`mb-5 p-4 rounded-2xl flex items-start gap-3 ${darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`font-bold text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
              Solde cumulé négatif sur {alertesMois.length} mois
            </p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              Mois concernés : {alertesMois.map(i => mois[i].nom).join(', ')} — risque de tension de trésorerie
            </p>
          </div>
        </div>
      ) : (
        <div className={`mb-5 p-3 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'}`}>
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          <p className={`text-sm font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
            Trésorerie positive sur les 12 mois — aucune tension prévisionnelle
          </p>
        </div>
      )}

      {/* ── GRAPHIQUE ── */}
      <div className="h-44 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'cumul' ? (
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#94a3b8' }} />
              <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#94a3b8' }} width={48} />
              <Tooltip
                contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', fontSize: 12 }}
                labelStyle={{ color: darkMode ? '#e5e7eb' : '#1e293b', fontWeight: 600 }}
                itemStyle={{ color: darkMode ? '#d1d5db' : '#334155' }}
                formatter={(v, name) => [`${v >= 0 ? '+' : ''}${Math.round(v).toLocaleString()} €`, name === 'soldeCumule' ? 'Solde cumulé' : 'Solde mensuel']}
              />
              <ReferenceLine y={0} stroke={darkMode ? '#6b7280' : '#94a3b8'} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="soldeCumule" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 3 }} name="soldeCumule" />
              <Line type="monotone" dataKey="solde" stroke={darkMode ? '#4b5563' : '#cbd5e1'} strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="solde" />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#94a3b8' }} />
              <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#94a3b8' }} width={48} />
              <Tooltip
                contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', fontSize: 12 }}
                labelStyle={{ color: darkMode ? '#e5e7eb' : '#1e293b', fontWeight: 600 }}
                itemStyle={{ color: darkMode ? '#d1d5db' : '#334155' }}
                formatter={(v, name) => [`${Math.round(v).toLocaleString()} €`, name === 'encaissements' ? 'Encaissements' : name === 'salaires' ? 'Salaires & charges' : name === 'exploitation' ? 'Exploitation' : 'Annuités emprunts']}
              />
              <Bar dataKey="salaires"     name="salaires"     stackId="dec" fill={darkMode ? '#3b82f6' : '#93c5fd'} radius={[0,0,0,0]} />
              <Bar dataKey="exploitation" name="exploitation" stackId="dec" fill={darkMode ? '#f59e0b' : '#fcd34d'} radius={[0,0,0,0]} />
              <Bar dataKey="annuites"     name="annuites"     stackId="dec" fill={darkMode ? '#f43f5e' : '#fda4af'} radius={[4,4,0,0]} />
              <Bar dataKey="encaissements" name="encaissements" fill={darkMode ? '#10b981' : '#6ee7b7'} radius={[4,4,0,0]} />
              <Legend formatter={name => name === 'encaissements' ? 'Encaissements' : name === 'salaires' ? 'Salaires' : name === 'exploitation' ? 'Exploitation' : 'Annuités'} wrapperStyle={{ fontSize: 10 }} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ── TABLEAU MENSUEL ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
              <td className="py-2 pr-3 font-bold text-left">Ligne</td>
              {mois.map(m => (
                <td key={m.nom} className="py-2 text-right font-bold px-1 min-w-[52px]">{m.nom}</td>
              ))}
              <td className="py-2 text-right font-bold px-1 min-w-[68px]">Total</td>
            </tr>
          </thead>
          <tbody>
            {/* Encaissements */}
            <tr>
              <td className={`py-2 pr-3 font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <span className="flex items-center gap-1"><TrendingUp size={11} /> Encaissements</span>
              </td>
              {mois.map(m => (
                <td key={m.nom} className={`py-2 text-right px-1 font-semibold tabular-nums ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {Math.round(m.encaissements / 1000).toLocaleString()}k
                </td>
              ))}
              <td className={`py-2 text-right px-1 font-black tabular-nums ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {Math.round(totalEncaissements / 1000).toLocaleString()}k
              </td>
            </tr>

            {/* Décaissements — ligne totale */}
            <tr>
              <td className={`py-2 pr-3 font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                <button className="flex items-center gap-1" onClick={() => setShowDetail(v => !v)}>
                  <TrendingDown size={11} /> Décaissements
                  {showDetail ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              </td>
              {mois.map(m => (
                <td key={m.nom} className={`py-2 text-right px-1 font-semibold tabular-nums ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                  {Math.round(m.decaissements / 1000).toLocaleString()}k
                </td>
              ))}
              <td className={`py-2 text-right px-1 font-black tabular-nums ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                {Math.round(totalDecaissements / 1000).toLocaleString()}k
              </td>
            </tr>

            {/* Sous-lignes décomposition */}
            {showDetail && <>
              <tr className={darkMode ? 'text-blue-300' : 'text-blue-700'}>
                <td className="py-1 pr-3 pl-5 text-[10px] font-bold">↳ Salaires & charges soc.</td>
                {mois.map(m => (
                  <td key={m.nom} className="py-1 text-right px-1 text-[10px] tabular-nums">{Math.round(salairesParMois / 1000).toLocaleString()}k</td>
                ))}
                <td className="py-1 text-right px-1 text-[10px] font-black tabular-nums">{Math.round(totalSalairesAnnuels / 1000).toLocaleString()}k</td>
              </tr>
              <tr className={darkMode ? 'text-amber-300' : 'text-amber-700'}>
                <td className="py-1 pr-3 pl-5 text-[10px] font-bold">↳ Exploitation saisonnalisée</td>
                {mois.map(m => {
                  const expl = Math.max(0, m.decaissements - chargesFixesParMois);
                  return <td key={m.nom} className="py-1 text-right px-1 text-[10px] tabular-nums">{Math.round(expl / 1000).toLocaleString()}k</td>;
                })}
                <td className="py-1 text-right px-1 text-[10px] font-black tabular-nums">{Math.round(Math.max(0, totalExploitation) / 1000).toLocaleString()}k</td>
              </tr>
              <tr className={`${darkMode ? 'text-rose-300' : 'text-rose-600'} ${!hasEmprunts ? 'opacity-40' : ''}`}>
                <td className="py-1 pr-3 pl-5 text-[10px] font-bold">
                  ↳ Annuités emprunts
                  <HelpPopover darkMode={darkMode}>
                    <strong className="block mb-1">Annuité = Capital + Intérêts</strong>
                    <p>Flux de trésorerie réel, versé chaque mois.</p>
                    <p className="mt-1 font-bold text-amber-500">Non confondre avec la dotation aux amortissements</p>
                    <p className="mt-1">La dotation aux amortissements étale comptablement le coût d'un investissement sur sa durée de vie. Elle <strong>n'est pas décaissée</strong> (pas de sortie bancaire) — contrairement au remboursement d'emprunt.</p>
                  </HelpPopover>
                </td>
                {mois.map(m => (
                  <td key={m.nom} className="py-1 text-right px-1 text-[10px] tabular-nums">{annuitesParMois > 0 ? Math.round(annuitesParMois / 1000).toLocaleString() + 'k' : '—'}</td>
                ))}
                <td className="py-1 text-right px-1 text-[10px] font-black tabular-nums">{totalAnnuites > 0 ? Math.round(totalAnnuites / 1000).toLocaleString() + 'k' : '—'}</td>
              </tr>
            </>}

            {/* Solde mensuel */}
            <tr className={darkMode ? 'bg-gray-700/30' : 'bg-slate-50'}>
              <td className={`py-2 pr-3 font-bold rounded-l-xl ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Solde mensuel</td>
              {mois.map(m => (
                <td key={m.nom} className={`py-2 text-right px-1 font-bold tabular-nums ${m.solde >= 0 ? darkMode ? 'text-emerald-400' : 'text-emerald-600' : darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {fmtK(m.solde)}
                </td>
              ))}
              <td className={`py-2 text-right px-1 font-black tabular-nums rounded-r-xl ${soldeAnnuel >= 0 ? darkMode ? 'text-emerald-400' : 'text-emerald-600' : darkMode ? 'text-red-400' : 'text-red-600'}`}>
                {fmtK(soldeAnnuel)}
              </td>
            </tr>

            {/* Solde cumulé */}
            <tr>
              <td className={`py-2 pr-3 font-black ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Solde cumulé</td>
              {mois.map((m, i) => (
                <td key={m.nom} className={`py-2 text-right px-1 font-black tabular-nums rounded ${
                  alertesMois.includes(i) ? 'bg-red-500/10 text-red-500' : darkMode ? 'text-cyan-300' : 'text-cyan-700'
                }`}>
                  {fmtK(m.soldeCumule)}
                </td>
              ))}
              <td className={`py-2 text-right px-1 font-black tabular-nums ${mois[11]?.soldeCumule >= 0 ? darkMode ? 'text-emerald-400' : 'text-emerald-600' : 'text-red-500'}`}>
                {mois[11] ? fmtK(mois[11].soldeCumule) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>
        <span>Flux réels décaissés · Les dotations aux amortissements (charges comptables non décaissées) sont exclues</span>
        {hasEmprunts && (
          <span className="flex items-center gap-1 text-rose-400">
            <AlertTriangle size={10} />
            Annuités : {fmt(totalAnnuites)}/an · Capital {fmt(capitalRembourseAnnuel)} + Intérêts {fmt(totalInteretsAnnuels)}
          </span>
        )}
      </div>
    </div>
  );
}
