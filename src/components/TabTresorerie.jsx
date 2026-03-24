/**
 * TabTresorerie — Tableau de trésorerie mensuelle prévisionnel
 * Affiche encaissements / décaissements / solde mensuel / solde cumulé sur 12 mois
 */
import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const formatEuro = (v) => Math.round(v).toLocaleString('fr-FR') + ' €';
const formatK = (v) => {
  const k = v / 1000;
  return (k >= 0 ? '+' : '') + k.toFixed(1) + 'k';
};

export default function TabTresorerie({ tresorerie, darkMode }) {
  if (!tresorerie) return null;
  const { mois, totalEncaissements, totalDecaissements, alertesMois } = tresorerie;
  const soldeAnnuel = totalEncaissements - totalDecaissements;
  const hasAlertes = alertesMois.length > 0;

  const chartData = mois.map(m => ({
    name: m.nom,
    soldeCumule: Math.round(m.soldeCumule),
    solde: Math.round(m.solde),
  }));

  return (
    <div className={`rounded-3xl border shadow-md p-6 mb-8 ${darkMode ? 'bg-gray-800/40 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-black flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
            <TrendingUp size={22} />
          </div>
          Trésorerie prévisionnelle — 12 mois
        </h2>
        <div className={`px-4 py-2 rounded-2xl font-black text-sm ${
          soldeAnnuel >= 0
            ? darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
            : darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-700'
        }`}>
          Solde annuel : {soldeAnnuel >= 0 ? '+' : ''}{Math.round(soldeAnnuel).toLocaleString()} €
        </div>
      </div>

      {/* Alerte mois négatifs */}
      {hasAlertes && (
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
      )}
      {!hasAlertes && (
        <div className={`mb-5 p-3 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'}`}>
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          <p className={`text-sm font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
            Trésorerie positive sur les 12 mois — aucune tension prévisionnelle
          </p>
        </div>
      )}

      {/* Graphique solde cumulé */}
      <div className="h-40 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#94a3b8' }} />
            <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#94a3b8' }} width={48} />
            <Tooltip
              contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', fontSize: 12 }}
              formatter={(v, name) => [
                `${v >= 0 ? '+' : ''}${Math.round(v).toLocaleString()} €`,
                name === 'soldeCumule' ? 'Solde cumulé' : 'Solde mensuel'
              ]}
            />
            <ReferenceLine y={0} stroke={darkMode ? '#6b7280' : '#94a3b8'} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="soldeCumule" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 3 }} name="soldeCumule" />
            <Line type="monotone" dataKey="solde" stroke={darkMode ? '#4b5563' : '#cbd5e1'} strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="solde" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau mensuel */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
              <td className="py-2 pr-3 font-bold text-left">Ligne</td>
              {mois.map(m => (
                <td key={m.nom} className="py-2 text-right font-bold px-1 min-w-[58px]">{m.nom}</td>
              ))}
              <td className="py-2 text-right font-bold px-1 min-w-[72px]">Total</td>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Encaissements */}
            <tr>
              <td className={`py-2 pr-3 font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <span className="flex items-center gap-1"><TrendingUp size={12} /> Encaissements</span>
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
            {/* Décaissements */}
            <tr>
              <td className={`py-2 pr-3 font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                <span className="flex items-center gap-1"><TrendingDown size={12} /> Décaissements</span>
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
            {/* Solde mensuel */}
            <tr className={darkMode ? 'bg-gray-700/30' : 'bg-slate-50'}>
              <td className={`py-2 pr-3 font-bold rounded-l-xl ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Solde mensuel</td>
              {mois.map(m => (
                <td key={m.nom} className={`py-2 text-right px-1 font-bold tabular-nums ${
                  m.solde >= 0
                    ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    : darkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {formatK(m.solde)}
                </td>
              ))}
              <td className={`py-2 text-right px-1 font-black tabular-nums rounded-r-xl ${
                soldeAnnuel >= 0 ? darkMode ? 'text-emerald-400' : 'text-emerald-600' : darkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {formatK(soldeAnnuel)}
              </td>
            </tr>
            {/* Solde cumulé */}
            <tr>
              <td className={`py-2 pr-3 font-black ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Solde cumulé</td>
              {mois.map((m, i) => (
                <td key={m.nom} className={`py-2 text-right px-1 font-black tabular-nums rounded ${
                  alertesMois.includes(i)
                    ? 'bg-red-500/10 text-red-500'
                    : darkMode ? 'text-cyan-300' : 'text-cyan-700'
                }`}>
                  {formatK(m.soldeCumule)}
                </td>
              ))}
              <td className={`py-2 text-right px-1 font-black tabular-nums ${
                mois[11]?.soldeCumule >= 0 ? darkMode ? 'text-emerald-400' : 'text-emerald-600' : 'text-red-500'
              }`}>
                {mois[11] ? formatK(mois[11].soldeCumule) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
        Charges réparties uniformément sur 12 mois · Recettes saisonnalisées si configurées · Hors provisions et BFR
      </p>
    </div>
  );
}
