import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Users, Banknote } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useBudget } from '../contexts/BudgetContext';

const fmtEuro = (n) => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
const fmtMillier = (n) => {
  const v = Math.round(n || 0);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + ' M€';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + ' k€';
  return v + ' €';
};

export default function BoardModeView({ open, onClose }) {
  const {
    kpiGlobaux, summary3Ans, alertes,
    tresorerie, masseSalarialeTotal,
  } = useBudget();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const {
    totalRecettes = 0, totalCharges = 0, soldeGlobal = 0,
    totalETP = 0, tauxCouverture = 0,
    totalEngagementsOuverts = 0,
  } = kpiGlobaux || {};

  const equilibre = soldeGlobal >= 0;
  const couvertureOK = tauxCouverture >= 100;
  const alertesCritiques = (alertes || []).filter(a => a.lvl === 'error');
  const alertesAvertissement = (alertes || []).filter(a => a.lvl === 'warning');

  // Graphique 3 ans à partir de summary3Ans (annee 1=N, 2=N+1, 3=N+2)
  const annexeLabels = { 1: '2026 (N)', 2: '2027 (N+1)', 3: '2028 (N+2)' };
  const chartData = (summary3Ans || []).map(row => ({
    annee:    annexeLabels[row.annee] || `Année ${row.annee}`,
    Recettes: row.recettes,
    Charges:  row.total,
    Solde:    row.solde,
  }));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 text-white overflow-y-auto">
      <div className="min-h-screen p-8 lg:p-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Mode Conseil d'Administration</p>
            <h1 className="text-4xl lg:text-5xl font-black">Synthèse stratégique — Exercice 2026</h1>
            <p className="text-sm text-slate-400 mt-2">Édition épurée pour présentation au Bureau / CA</p>
          </div>
          <button onClick={onClose} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold border border-slate-700">
            <X size={18} /> Quitter le mode CA
          </button>
        </div>

        {/* KPIs grands chiffres */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className={`rounded-3xl p-6 border-2 ${equilibre ? 'bg-emerald-950/40 border-emerald-700' : 'bg-rose-950/40 border-rose-700'}`}>
            <div className="flex items-center gap-2 mb-3">
              {equilibre ? <TrendingUp size={20} className="text-emerald-400" /> : <TrendingDown size={20} className="text-rose-400" />}
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Solde de l'exercice</span>
            </div>
            <p className={`text-4xl lg:text-5xl font-black tabular-nums ${equilibre ? 'text-emerald-300' : 'text-rose-300'}`}>
              {soldeGlobal >= 0 ? '+' : ''}{fmtMillier(soldeGlobal)}
            </p>
            <p className="text-xs text-slate-400 mt-2">{equilibre ? 'Excédent prévisionnel' : 'Déficit à combler'}</p>
          </div>

          <div className={`rounded-3xl p-6 border-2 ${couvertureOK ? 'bg-teal-950/40 border-teal-700' : 'bg-amber-950/40 border-amber-700'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={20} className={couvertureOK ? 'text-teal-400' : 'text-amber-400'} />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Taux de couverture</span>
            </div>
            <p className={`text-4xl lg:text-5xl font-black tabular-nums ${couvertureOK ? 'text-teal-300' : 'text-amber-300'}`}>
              {tauxCouverture.toFixed(1)} %
            </p>
            <p className="text-xs text-slate-400 mt-2">Cible : 100 %</p>
          </div>

          <div className="rounded-3xl p-6 border-2 bg-blue-950/40 border-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <Banknote size={20} className="text-blue-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Recettes 2026</span>
            </div>
            <p className="text-4xl lg:text-5xl font-black tabular-nums text-blue-300">
              {fmtMillier(totalRecettes)}
            </p>
            <p className="text-xs text-slate-400 mt-2">Charges : {fmtMillier(totalCharges)}</p>
          </div>

          <div className="rounded-3xl p-6 border-2 bg-violet-950/40 border-violet-700">
            <div className="flex items-center gap-2 mb-3">
              <Users size={20} className="text-violet-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Effectif total</span>
            </div>
            <p className="text-4xl lg:text-5xl font-black tabular-nums text-violet-300">
              {totalETP.toFixed(2)} ETP
            </p>
            <p className="text-xs text-slate-400 mt-2">MS : {fmtMillier(masseSalarialeTotal)}</p>
          </div>
        </div>

        {/* Trajectoire 3 ans */}
        {chartData.length > 0 && (
          <div className="rounded-3xl p-8 bg-slate-800/60 border border-slate-700 mb-10">
            <h2 className="text-2xl font-black mb-6">Trajectoire financière 3 ans</h2>
            <div style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="annee" stroke="#cbd5e1" tick={{ fontSize: 14, fontWeight: 700 }} />
                  <YAxis stroke="#cbd5e1" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtMillier(v)} />
                  <Tooltip
                    formatter={(v) => fmtEuro(v)}
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 14, fontWeight: 700 }} />
                  <Bar dataKey="Recettes" fill="#3b82f6" radius={[6,6,0,0]} />
                  <Bar dataKey="Charges"  fill="#ef4444" radius={[6,6,0,0]} />
                  <Bar dataKey="Solde"    fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trésorerie 12 mois */}
        {tresorerie?.mois?.length > 0 && (
          <div className="rounded-3xl p-8 bg-slate-800/60 border border-slate-700 mb-10">
            <h2 className="text-2xl font-black mb-6">Trésorerie prévisionnelle 12 mois</h2>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tresorerie.mois}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="nom" stroke="#cbd5e1" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis stroke="#cbd5e1" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtMillier(v)} />
                  <Tooltip
                    formatter={(v) => fmtEuro(v)}
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12 }}
                  />
                  <Line type="monotone" dataKey="soldeCumule" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} name="Solde cumulé" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {tresorerie.alertesMois?.length > 0 && (
              <p className="text-sm text-amber-300 mt-3">
                ⚠ Tension de trésorerie prévue sur {tresorerie.alertesMois.length} mois — solde cumulé négatif
              </p>
            )}
          </div>
        )}

        {/* Alertes critiques */}
        <div className="rounded-3xl p-8 bg-slate-800/60 border border-slate-700 mb-10">
          <h2 className="text-2xl font-black mb-5 flex items-center gap-2">
            {alertesCritiques.length === 0 ? <CheckCircle size={26} className="text-emerald-400" /> : <AlertTriangle size={26} className="text-rose-400" />}
            Points de vigilance
          </h2>
          {alertesCritiques.length === 0 && alertesAvertissement.length === 0 ? (
            <p className="text-emerald-300 text-lg">Aucune alerte — l'exercice est dans les rails attendus.</p>
          ) : (
            <ul className="space-y-3">
              {alertesCritiques.map((a, i) => (
                <li key={`e${i}`} className="flex items-start gap-3 p-4 rounded-2xl bg-rose-950/40 border border-rose-800">
                  <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="font-bold text-rose-100">{a.msg}</p>
                </li>
              ))}
              {alertesAvertissement.map((a, i) => (
                <li key={`w${i}`} className="flex items-start gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-800">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="font-medium text-amber-100">{a.msg}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Engagements */}
        {totalEngagementsOuverts > 0 && (
          <div className="rounded-3xl p-6 bg-amber-950/40 border-2 border-amber-700 mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-amber-300 mb-2">Engagements non facturés en cours</p>
            <p className="text-3xl font-black text-amber-200 tabular-nums">{fmtMillier(totalEngagementsOuverts)}</p>
            <p className="text-xs text-amber-300/80 mt-1">À provisionner ou à régulariser avant clôture</p>
          </div>
        )}

        {/* Pied de page */}
        <div className="text-center text-xs text-slate-500 mt-12 pb-4">
          Document de présentation — AFERTES 2026 · Échap pour quitter
        </div>
      </div>
    </div>
  );
}
