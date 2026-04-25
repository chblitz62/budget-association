import React from 'react';
import { Shield, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { calculerSalaireAnnuel, runFinancialAudit } from '../../utils/calculations';

export default function TabReporting({
  darkMode,
  direction,
  poleSupport,
  services,
  poolRH,
  globalParams,
  privacyMode,
}) {
  const msETP = globalParams.montantSegurETP ?? 238;
  const tousPersonnels = [
    ...(direction.personnel || []).map(p => ({ ...p, _source: 'Siège' })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p, _source: 'Pôle Ressources' })),
    ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, _source: s.nom }))),
    ...(poolRH || []).map(p => ({ ...p, _source: 'Pool RH' })),
  ];

  const pivotRoles = {};
  tousPersonnels.forEach(p => {
    const role = p.role || 'autre';
    if (!pivotRoles[role]) pivotRoles[role] = { agents: [], etpTotal: 0, msTotal: 0 };
    const etp = parseFloat(p.etp) || 0;
    const sal = calculerSalaireAnnuel(parseFloat(p.salaire) || 0, etp, p.segur ? msETP : 0, p.typeContrat, p.tauxChargesManuel);
    pivotRoles[role].agents.push(p);
    pivotRoles[role].etpTotal += etp;
    pivotRoles[role].msTotal += sal.total;
  });

  const roles = (globalParams.rolesPersonnel || []);
  const getRoleLabel = (id) => roles.find(r => r.id === id)?.label || id;

  const auditAlertes = runFinancialAudit(direction, services, poleSupport, globalParams);
  const erreurs = auditAlertes.filter(a => a.type === 'ER');
  const avertissements = auditAlertes.filter(a => a.type === 'WA');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
        <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          <Shield size={20} className="text-violet-500" /> Pivot réglementaire — Rôle × Masse Salariale
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs font-bold uppercase tracking-wide border-b ${darkMode ? 'text-zinc-400 border-zinc-700' : 'text-slate-500 border-slate-200'}`}>
                <th className="text-left py-2 pr-4">Rôle</th>
                <th className="text-right py-2 pr-4">Nb agents</th>
                <th className="text-right py-2 pr-4">ETP total</th>
                <th className="text-right py-2">Masse salariale chargée</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pivotRoles).sort((a,b) => b[1].msTotal - a[1].msTotal).map(([roleId, data]) => (
                <tr key={roleId} className={`border-b text-sm ${darkMode ? 'border-zinc-800 hover:bg-zinc-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <td className={`py-2 pr-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{getRoleLabel(roleId)}</td>
                  <td className={`py-2 pr-4 text-right ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{data.agents.length}</td>
                  <td className={`py-2 pr-4 text-right ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{data.etpTotal.toFixed(2)}</td>
                  <td className={`py-2 text-right font-bold ${privacyMode ? 'blur-sm select-none' : ''} ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    {data.msTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
              <tr className={`text-sm font-black ${darkMode ? 'text-white border-t border-zinc-600' : 'text-slate-900 border-t border-slate-300'}`}>
                <td className="py-2 pr-4">TOTAL</td>
                <td className="py-2 pr-4 text-right">{tousPersonnels.length}</td>
                <td className="py-2 pr-4 text-right">{Object.values(pivotRoles).reduce((s, d) => s + d.etpTotal, 0).toFixed(2)}</td>
                <td className={`py-2 text-right ${privacyMode ? 'blur-sm select-none' : ''} text-teal-600`}>
                  {Object.values(pivotRoles).reduce((s, d) => s + d.msTotal, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={`rounded-3xl border p-6 shadow-md ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}>
        <h2 className={`text-lg font-black mb-5 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          <AlertTriangle size={20} className="text-amber-500" /> Vérificateur de cohérence financière
          <span className={`ml-auto text-sm font-bold px-3 py-1 rounded-full ${auditAlertes.length === 0 ? 'bg-green-100 text-green-700' : erreurs.length > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {auditAlertes.length === 0 ? '✓ RAS' : `${erreurs.length} erreur${erreurs.length > 1 ? 's' : ''} · ${avertissements.length} avertissement${avertissements.length > 1 ? 's' : ''}`}
          </span>
        </h2>
        {auditAlertes.length === 0 ? (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
            <CheckCircle size={20} className="text-green-500" />
            <span className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Aucune anomalie détectée — budget cohérent</span>
          </div>
        ) : (
          <div className="space-y-3">
            {erreurs.map((a, i) => (
              <div key={i} className={`rounded-2xl p-4 flex items-start gap-3 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className={`text-xs font-black uppercase tracking-wide ${darkMode ? 'text-red-400' : 'text-red-600'}`}>[ERREUR] {a.code}</span>
                  <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-red-200' : 'text-red-800'}`}>{a.message}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>{a.entity}</p>
                </div>
              </div>
            ))}
            {avertissements.map((a, i) => (
              <div key={i} className={`rounded-2xl p-4 flex items-start gap-3 ${darkMode ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'}`}>
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className={`text-xs font-black uppercase tracking-wide ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>[AVERT.] {a.code}</span>
                  <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>{a.message}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`}>{a.entity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
