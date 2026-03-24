import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Monitor } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
const fmtK = (n) => {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + ' M€';
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + ' k€';
  return Math.round(n) + ' €';
};

const ROLE_COLORS = {
  directeur: '#6366f1',
  coordinateur: '#8b5cf6',
  formateur: '#06b6d4',
  administratif: '#10b981',
  technique: '#f59e0b',
  autre: '#94a3b8',
};

const PresentationMode = ({
  direction,
  poleSupport,
  services,
  onClose,
  calculerBudgetDirection,
  calculerBudgetService,
  calculerBudgetPoleSupport,
  calculerSalaireAnnuel,
  calculerStatsFormation,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const bdDir = calculerBudgetDirection(direction);
  const bdPole = calculerBudgetPoleSupport(poleSupport);
  const bServices = services.map(s => ({ ...calculerBudgetService(s), nom: s.nom }));

  const totalRecettes = bServices.reduce((s, b) => s + b.recettes, 0);
  const totalCharges =
    bdDir.total +
    bdPole.total +
    bServices.reduce((s, b) => s + b.total, 0);
  const solde = totalRecettes - totalCharges;
  const tauxCouverture = totalCharges > 0 ? (totalRecettes / totalCharges) * 100 : 0;

  const totalETP =
    direction.personnel.reduce((s, p) => s + p.etp, 0) +
    (poleSupport?.personnel || []).reduce((s, p) => s + p.etp, 0) +
    services.reduce((s, srv) => s + srv.personnel.reduce((s2, p) => s2 + p.etp, 0), 0);

  // Masse salariale par rôle
  const roleMap = {};
  const allPersonnel = [
    ...direction.personnel.map(p => ({ ...p })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p })),
    ...services.flatMap(s => s.personnel.map(p => ({ ...p }))),
  ];
  allPersonnel.forEach(p => {
    const role = p.role || 'autre';
    const sal = calculerSalaireAnnuel(p.salaire, p.etp, p.segur);
    if (!roleMap[role]) roleMap[role] = { role, total: 0, etp: 0 };
    roleMap[role].total += sal.total;
    roleMap[role].etp += p.etp;
  });
  const roleData = Object.values(roleMap).sort((a, b) => b.total - a.total);
  const totalMasseSalariale = roleData.reduce((s, r) => s + r.total, 0);

  // Effectifs formation
  const formationServices = services.filter(s => s.promos && typeof s.promos === 'object' && Object.keys(s.promos).length > 0);
  const totalEtudiants = services.reduce((s, srv) => {
    if (srv.promos) return s + calculerStatsFormation(srv).effectifActuel;
    return s + (srv.unites || 0);
  }, 0);

  // Projection 3 ans (simple)
  const proj3ans = [
    { annee: 'An 1', budget: totalCharges },
    { annee: 'An 2', budget: totalCharges * 1.02 },
    { annee: 'An 3', budget: totalCharges * 1.04 },
  ];

  const totalMSPct = totalCharges > 0 ? (totalMasseSalariale / totalCharges) * 100 : 0;
  const servicesChartData = bServices.map(b => ({
    nom: b.nom.length > 12 ? b.nom.slice(0, 12) + '…' : b.nom,
    Charges: Math.round(b.total),
    Recettes: Math.round(b.recettes),
  }));

  const slides = [
    { id: 'cover' },
    { id: 'kpi-ca' },
    { id: 'services-chart' },
    { id: 'resultats' },
    { id: 'synthese' },
    { id: 'masse-salariale' },
    { id: 'effectifs' },
    { id: 'projection' },
  ];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
        setCurrentSlide(s => Math.min(s + 1, slides.length - 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        setCurrentSlide(s => Math.max(s - 1, 0));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides.length, onClose]);

  const slide = slides[currentSlide];

  const renderSlide = () => {
    switch (slide.id) {
      case 'cover':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <img src="/logo.png" alt="AFERTES" className="h-28 mb-8 brightness-200" onError={e => { e.target.style.display = 'none'; }} />
            <h1 className="text-6xl font-black text-white mb-4 tracking-tight">AFERTES</h1>
            <h2 className="text-3xl font-bold text-indigo-300 mb-6">Budget Prévisionnel 2026</h2>
            <p className="text-lg text-slate-400">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-10 flex gap-4">
              <div className="px-6 py-3 rounded-2xl bg-indigo-900/60 border border-indigo-700">
                <div className="text-xs text-indigo-400 font-bold uppercase mb-1">Entités</div>
                <div className="text-2xl font-black text-white">{2 + services.length}</div>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-indigo-900/60 border border-indigo-700">
                <div className="text-xs text-indigo-400 font-bold uppercase mb-1">ETP</div>
                <div className="text-2xl font-black text-white">{totalETP.toFixed(1)}</div>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-indigo-900/60 border border-indigo-700">
                <div className="text-xs text-indigo-400 font-bold uppercase mb-1">Étudiants</div>
                <div className="text-2xl font-black text-white">{totalEtudiants}</div>
              </div>
            </div>
          </div>
        );

      case 'kpi-ca':
        return (
          <div className="flex flex-col items-center justify-center h-full px-8">
            <h2 className="text-4xl font-black text-white mb-8">Tableau de bord</h2>
            <div className="grid grid-cols-3 gap-5 w-full max-w-5xl">
              {[
                { label: 'Recettes totales', val: fmtK(totalRecettes), sub: 'Produits de l\'exercice', color: 'bg-emerald-900/60 border-emerald-600', txt: 'text-emerald-300' },
                { label: 'Charges totales', val: fmtK(totalCharges), sub: 'Toutes entités', color: 'bg-red-900/60 border-red-700', txt: 'text-red-300' },
                { label: 'Solde', val: (solde >= 0 ? '+' : '') + fmtK(solde), sub: solde >= 0 ? 'Excédent' : 'Déficit', color: solde >= 0 ? 'bg-teal-900/60 border-teal-600' : 'bg-orange-900/60 border-orange-700', txt: solde >= 0 ? 'text-teal-300' : 'text-orange-300' },
                { label: 'Taux de couverture', val: tauxCouverture.toFixed(1) + '%', sub: tauxCouverture >= 100 ? '✓ Équilibré' : '⚠ Sous-couverture', color: tauxCouverture >= 100 ? 'bg-indigo-900/60 border-indigo-600' : 'bg-amber-900/60 border-amber-700', txt: tauxCouverture >= 100 ? 'text-indigo-300' : 'text-amber-300' },
                { label: 'Masse salariale', val: fmtK(totalMasseSalariale), sub: totalMSPct.toFixed(0) + '% des charges', color: 'bg-purple-900/60 border-purple-700', txt: 'text-purple-300' },
                { label: 'ETP total', val: totalETP.toFixed(1), sub: `${totalEtudiants} étudiants`, color: 'bg-sky-900/60 border-sky-700', txt: 'text-sky-300' },
              ].map((k, i) => (
                <div key={i} className={`rounded-3xl border-2 p-6 flex flex-col items-center ${k.color}`}>
                  <div className="text-slate-400 text-xs font-bold uppercase mb-2 text-center">{k.label}</div>
                  <div className={`text-4xl font-black ${k.txt} mb-1`}>{k.val}</div>
                  <div className="text-slate-500 text-xs">{k.sub}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'services-chart':
        return (
          <div className="flex flex-col h-full px-8 py-6">
            <h2 className="text-4xl font-black text-white mb-6">Budget par service</h2>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesChartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nom" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 700 }} />
                  <YAxis tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => fmt(v) + ' €'}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                  />
                  <Bar dataKey="Charges" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recettes" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 justify-center mt-2">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500" /><span className="text-slate-400 text-sm font-bold">Charges</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500" /><span className="text-slate-400 text-sm font-bold">Recettes</span></div>
            </div>
          </div>
        );

      case 'resultats':
        return (
          <div className="flex flex-col items-center justify-center h-full px-8">
            <h2 className="text-4xl font-black text-white mb-10">Résultats Globaux</h2>
            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
              {[
                { label: 'Recettes totales', val: fmtK(totalRecettes), color: 'bg-emerald-900/60 border-emerald-600', txt: 'text-emerald-300' },
                { label: 'Charges totales', val: fmtK(totalCharges), color: 'bg-red-900/60 border-red-700', txt: 'text-red-300' },
                { label: 'Solde', val: (solde >= 0 ? '+' : '') + fmtK(solde), color: solde >= 0 ? 'bg-teal-900/60 border-teal-600' : 'bg-orange-900/60 border-orange-700', txt: solde >= 0 ? 'text-teal-300' : 'text-orange-300' },
                { label: 'Taux de couverture', val: tauxCouverture.toFixed(1) + '%', color: tauxCouverture >= 100 ? 'bg-indigo-900/60 border-indigo-600' : 'bg-amber-900/60 border-amber-700', txt: tauxCouverture >= 100 ? 'text-indigo-300' : 'text-amber-300' },
              ].map((k, i) => (
                <div key={i} className={`rounded-3xl border-2 p-8 flex flex-col items-center ${k.color}`}>
                  <div className="text-slate-400 text-sm font-bold uppercase mb-3">{k.label}</div>
                  <div className={`text-5xl font-black ${k.txt}`}>{k.val}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'synthese':
        return (
          <div className="flex flex-col h-full px-8 py-6">
            <h2 className="text-4xl font-black text-white mb-6">Synthèse par Entité</h2>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-bold">Entité</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-bold">Personnel</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-bold">Exploitation</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-bold">Recettes</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-bold">Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nom: 'Siège', sal: bdDir.salaires, expl: bdDir.chargesSiege, rec: 0 },
                    { nom: 'Pôle Ressource', sal: bdPole.salaires, expl: bdPole.exploitation, rec: bdPole.recettes },
                    ...bServices.map(b => ({ nom: b.nom, sal: b.salaires, expl: b.exploitation, rec: b.recettes })),
                  ].map((row, i) => {
                    const charges = row.sal + row.expl;
                    const resultat = row.rec - charges;
                    return (
                      <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-800/30' : ''}`}>
                        <td className="py-3 px-3 font-bold text-white text-base">{row.nom}</td>
                        <td className="py-3 px-3 text-right text-slate-300">{fmt(row.sal)} €</td>
                        <td className="py-3 px-3 text-right text-slate-300">{fmt(row.expl)} €</td>
                        <td className="py-3 px-3 text-right text-emerald-300 font-bold">{row.rec > 0 ? fmt(row.rec) + ' €' : '—'}</td>
                        <td className={`py-3 px-3 text-right font-black text-base ${resultat >= 0 ? 'text-teal-300' : 'text-red-400'}`}>
                          {resultat >= 0 ? '+' : ''}{fmt(resultat)} €
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-slate-600 bg-slate-800/60">
                    <td className="py-3 px-3 font-black text-white text-base">TOTAL</td>
                    <td className="py-3 px-3 text-right text-white font-black">{fmt(totalMasseSalariale)} €</td>
                    <td className="py-3 px-3 text-right text-white font-black">
                      {fmt(bdDir.chargesSiege + bdPole.exploitation + bServices.reduce((s, b) => s + b.exploitation, 0))} €
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-300 font-black">{fmt(totalRecettes)} €</td>
                    <td className={`py-3 px-3 text-right font-black text-lg ${solde >= 0 ? 'text-teal-300' : 'text-red-400'}`}>
                      {solde >= 0 ? '+' : ''}{fmt(solde)} €
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'masse-salariale':
        return (
          <div className="flex flex-col h-full px-8 py-6">
            <h2 className="text-4xl font-black text-white mb-6">Masse Salariale</h2>
            <div className="grid grid-cols-2 gap-8 flex-1">
              <div className="flex flex-col justify-center space-y-4">
                <div className="rounded-2xl bg-indigo-900/50 border border-indigo-700 p-6">
                  <div className="text-indigo-300 text-sm font-bold uppercase mb-2">Total masse salariale</div>
                  <div className="text-4xl font-black text-white">{fmtK(totalMasseSalariale)}</div>
                </div>
                <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
                  <div className="text-slate-400 text-sm font-bold uppercase mb-2">Total ETP</div>
                  <div className="text-4xl font-black text-white">{totalETP.toFixed(1)}</div>
                </div>
                <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-4 space-y-2">
                  {roleData.slice(0, 4).map(r => (
                    <div key={r.role} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 capitalize">{r.role}</span>
                      <span className="font-bold text-white">{fmtK(r.total)} <span className="text-slate-500 text-xs">({r.etp.toFixed(1)} ETP)</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-slate-400 text-xs font-bold uppercase mb-3">Répartition par rôle</div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleData} layout="vertical" margin={{ left: 80, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tickFormatter={v => Math.round(v / 1000) + 'k'} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis type="category" dataKey="role" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                      <Tooltip formatter={(v) => fmt(v) + ' €'} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {roleData.map((r, i) => (
                          <Cell key={i} fill={ROLE_COLORS[r.role] || '#94a3b8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case 'effectifs':
        return (
          <div className="flex flex-col h-full px-8 py-6">
            <h2 className="text-4xl font-black text-white mb-6">Effectifs Formation</h2>
            <div className="flex flex-col justify-center flex-1 space-y-4">
              <div className="rounded-3xl bg-indigo-900/50 border border-indigo-700 p-6 text-center">
                <div className="text-indigo-300 text-sm font-bold uppercase mb-2">Total étudiants</div>
                <div className="text-6xl font-black text-white">{totalEtudiants}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {services.map(s => {
                  let effectif = 0;
                  let promoCount = 0;
                  if (s.promos && typeof s.promos === 'object' && Object.keys(s.promos).length > 0) {
                    const stats = calculerStatsFormation(s);
                    effectif = stats.effectifActuel;
                    const allPromos = Object.values(s.promos).flat();
                    promoCount = allPromos.length;
                  } else {
                    effectif = s.unites || 0;
                  }
                  return (
                    <div key={s.id} className="rounded-2xl bg-slate-800/50 border border-slate-700 p-4">
                      <div className="font-bold text-slate-300 text-sm mb-1 truncate">{s.nom}</div>
                      <div className="text-3xl font-black text-white">{effectif}</div>
                      {promoCount > 0 && (
                        <div className="text-xs text-indigo-400 mt-1">{promoCount} promotion{promoCount > 1 ? 's' : ''}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'projection':
        return (
          <div className="flex flex-col h-full px-8 py-6">
            <h2 className="text-4xl font-black text-white mb-6">Projection sur 3 ans</h2>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proj3ans} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="annee" tick={{ fill: '#cbd5e1', fontSize: 16, fontWeight: 'bold' }} />
                  <YAxis tickFormatter={v => Math.round(v / 1000) + 'k €'} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                  <Tooltip
                    formatter={(v) => fmt(v) + ' €'}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                  />
                  <Bar dataKey="budget" fill="#6366f1" radius={[8, 8, 0, 0]}>
                    {proj3ans.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#6366f1' : i === 1 ? '#8b5cf6' : '#a78bfa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {proj3ans.map((p, i) => (
                <div key={i} className="rounded-2xl bg-indigo-900/40 border border-indigo-800 p-4 text-center">
                  <div className="text-indigo-300 font-bold text-sm mb-1">{p.annee}</div>
                  <div className="text-2xl font-black text-white">{fmtK(p.budget)}</div>
                  {i > 0 && (
                    <div className="text-xs text-slate-400 mt-1">
                      +{((p.budget / proj3ans[0].budget - 1) * 100).toFixed(1)}% vs An 1
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const slideTitles = [
    'Couverture',
    'Résultats globaux',
    'Synthèse par entité',
    'Masse salariale',
    'Effectifs formation',
    'Projection 3 ans',
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
      {/* Slide dots / title bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Monitor size={18} className="text-indigo-400" />
          <span className="text-slate-400 text-sm font-bold">{slideTitles[currentSlide]}</span>
        </div>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-indigo-500 w-6' : 'bg-slate-700 hover:bg-slate-500'}`}
            />
          ))}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-hidden">
        {renderSlide()}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800">
        <button
          onClick={() => setCurrentSlide(s => Math.max(s - 1, 0))}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft size={16} /> Précédent
        </button>
        <span className="text-slate-500 text-sm font-bold">
          {currentSlide + 1} / {slides.length}
          <span className="ml-3 text-slate-600 text-xs">← → pour naviguer · Échap pour fermer</span>
        </span>
        <button
          onClick={() => setCurrentSlide(s => Math.min(s + 1, slides.length - 1))}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed bg-indigo-700 text-white hover:bg-indigo-600 transition-colors"
        >
          Suivant <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PresentationMode;
