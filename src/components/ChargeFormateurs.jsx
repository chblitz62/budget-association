import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ChargeFormateurs({ darkMode, services, direction, poleSupport }) {
  const data = useMemo(() => {
    // 1. Collecter tous les formateurs
    const allFormateurs = [
      ...(direction?.personnel || []).filter(p => p.role === 'formateur').map(p => ({ ...p, site: 'Siège / Direction' })),
      ...(poleSupport?.personnel || []).filter(p => p.role === 'formateur').map(p => ({ ...p, site: 'Pôle Support' })),
      ...services.flatMap(s => (s.personnel || []).filter(p => p.role === 'formateur').map(p => ({ ...p, site: s.nom })))
    ];

    if (allFormateurs.length === 0) return [];

    // 2. Calculer la charge pour chaque formateur
    // Note: Dans une version réelle, on croiserait avec les heures saisies dans PilotageFinancier
    // Ici, on simule l'agrégation pour la démonstration du dashboard DAF
    return allFormateurs.map(f => {
      const etp = parseFloat(f.etp) || 1;
      const capaciteAnnuelle = etp * 1607; // Base légale annuelle
      
      // Simulation de la ventilation (à relier aux données réelles si disponibles)
      // On utilise le site d'origine comme base principale
      const sitesCharge = {};
      sitesCharge[f.site] = capaciteAnnuelle * 0.7; // 70% sur son site principal
      
      // Simulation de transversalité (30% ailleurs)
      const autresSites = services.filter(s => s.nom !== f.site).map(s => s.nom);
      if (autresSites.length > 0) {
        sitesCharge[autresSites[0]] = capaciteAnnuelle * 0.2;
        sitesCharge['FC / Autres'] = capaciteAnnuelle * 0.05;
      }

      const totalCharge = Object.values(sitesCharge).reduce((a, b) => a + b, 0);

      return {
        nom: f.titre,
        siteOrigine: f.site,
        capacite: Math.round(capaciteAnnuelle),
        totalCharge: Math.round(totalCharge),
        tauxOccupation: Math.round((totalCharge / capaciteAnnuelle) * 100),
        ...sitesCharge
      };
    }).sort((a, b) => b.tauxOccupation - a.tauxOccupation);
  }, [services, direction, poleSupport]);

  const siteColors = {
    'Siège / Direction': '#8b5cf6',
    'Pôle Support': '#06b6d4',
    'Avion': '#3b82f6',
    'Saint Laurent': '#10b981',
    'FC / Autres': '#f59e0b',
  };

  const getSiteColor = (name) => {
    if (name.includes('Avion')) return '#3b82f6';
    if (name.includes('Laurent')) return '#10b981';
    if (name.includes('Direction') || name.includes('Siège')) return '#8b5cf6';
    return siteColors[name] || '#94a3b8';
  };

  if (data.length === 0) return null;

  return (
    <div className={`rounded-3xl border-2 p-6 mb-8 shadow-lg ${darkMode ? 'bg-gray-800 border-blue-900' : 'bg-white border-blue-100'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Users size={24} />
          </div>
          <div>
            <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Charge de travail Formateurs</h2>
            <p className={`text-xs font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Vue transversale par site (Animation + Préparation + Hors-prod)</p>
          </div>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <div className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Taux moyen</div>
                <div className={`text-xl font-black ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    {Math.round(data.reduce((s, d) => s + d.tauxOccupation, 0) / data.length)}%
                </div>
            </div>
        </div>
      </div>

      <div className="h-80 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#e2e8f0'} />
            <XAxis 
              dataKey="nom" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              height={60}
              tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#64748b', fontWeight: 600 }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#64748b' }} 
              label={{ value: 'Heures annuelles', angle: -90, position: 'insideLeft', style: { fill: darkMode ? '#9ca3af' : '#64748b', fontSize: 12, fontWeight: 700 } }}
            />
            <Tooltip 
              cursor={{ fill: darkMode ? '#374151' : '#f8fafc', opacity: 0.4 }}
              contentStyle={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                border: 'none', 
                borderRadius: '12px', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
              }}
              itemStyle={{ fontSize: 12 }}
              labelStyle={{ fontWeight: 800, marginBottom: '4px', color: darkMode ? '#f3f4f6' : '#1e293b' }}
            />
            <Legend verticalAlign="top" height={36}/>
            
            {/* On génère dynamiquement les barres pour chaque site unique trouvé */}
            {Array.from(new Set(data.flatMap(d => Object.keys(d).filter(k => !['nom', 'capacite', 'totalCharge', 'tauxOccupation', 'siteOrigine'].includes(k))))).map(site => (
              <Bar 
                key={site} 
                dataKey={site} 
                stackId="a" 
                fill={getSiteColor(site)} 
                radius={[0, 0, 0, 0]}
                name={site}
              />
            ))}

            <ReferenceLine y={1607} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: '100% ETP', fill: '#ef4444', fontSize: 10, fontWeight: 700 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.filter(d => d.tauxOccupation > 105).map(d => (
          <div key={d.nom} className={`p-3 rounded-2xl border flex items-center gap-3 ${darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <AlertTriangle size={20} className="shrink-0" />
            <div className="text-xs">
              <div className="font-black">Surcharge : {d.nom} ({d.tauxOccupation}%)</div>
              <div>Capacité dépassée de {d.totalCharge - d.capacite}h/an. Risque de burn-out ou heures supp. non provisionnées.</div>
            </div>
          </div>
        ))}
        {data.filter(d => d.tauxOccupation < 70).map(d => (
          <div key={d.nom} className={`p-3 rounded-2xl border flex items-center gap-3 ${darkMode ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            <Info size={20} className="shrink-0" />
            <div className="text-xs">
              <div className="font-black">Sous-activité : {d.nom} ({d.tauxOccupation}%)</div>
              <div>Potentiel inexploité de {d.capacite - d.totalCharge}h/an. Possibilité de renfort sur d'autres sites.</div>
            </div>
          </div>
        ))}
        {data.every(d => d.tauxOccupation >= 70 && d.tauxOccupation <= 105) && (
            <div className={`col-span-full p-3 rounded-2xl border flex items-center gap-3 ${darkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <CheckCircle size={20} className="shrink-0" />
                <div className="text-xs font-black">Plan de charge équilibré sur l'ensemble des sites de formation.</div>
            </div>
        )}
      </div>
    </div>
  );
}
