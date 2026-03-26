import React from 'react';
import { GraduationCap, Trash2, Plus } from 'lucide-react';
import ReportingFC from '../ReportingFC';
import PilotageFinancier from '../PilotageFinancier';
import ChargeFormateurs from '../ChargeFormateurs';
import { exportReportingFC } from '../../utils/excelExport';
import { exportReportingFCPdf } from '../../utils/pdfExport';

export default function TabFormation({
  darkMode,
  services,
  enveloppeFormation,
  setEnveloppeFormation,
  reportingFC,
  setReportingFC,
  pilotageSites,
  setPilotageSites,
  pilotageResetKey,
  direction,
  poleSupport,
  globalParams,
  checkPassword,
}) {
  return (
    <>
      {/* CHARGE DE TRAVAIL DES FORMATEURS (VUE DAF TRANSVERSALE) */}
      <ChargeFormateurs 
        darkMode={darkMode}
        services={services}
        direction={direction}
        poleSupport={poleSupport}
      />

      {/* ENVELOPPE DE FORMATION */}
      <div id="enveloppe-formation" className={`rounded-3xl shadow-lg border-2 p-8 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-emerald-900' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'}`}>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-emerald-600" size={32} />
            <div>
              <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Enveloppe de Formation</h2>
              <span className={`text-sm font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Formation continue du personnel</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-right`}>
              <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Budget alloué</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className={`w-36 text-right font-black text-xl rounded-xl px-3 py-2 outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-slate-800'}`}
                  value={enveloppeFormation.budget}
                  onChange={e => setEnveloppeFormation({...enveloppeFormation, budget: Math.max(0, parseFloat(e.target.value) || 0)})}
                />
                <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de consommation */}
        {(() => {
          const totalConsomme = (enveloppeFormation.actions || []).reduce((s, a) => s + (parseFloat(a.cout) || 0), 0);
          const pct = enveloppeFormation.budget > 0 ? Math.min(100, Math.round(totalConsomme / enveloppeFormation.budget * 100)) : 0;
          const restant = enveloppeFormation.budget - totalConsomme;
          return (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Consommé : <strong className="text-emerald-600">{Math.round(totalConsomme).toLocaleString()} €</strong></span>
                <span className={`font-bold ${restant >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {restant >= 0 ? 'Restant' : 'Dépassement'} : {Math.abs(Math.round(restant)).toLocaleString()} €
                </span>
              </div>
              <div className={`w-full h-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} overflow-hidden`}>
                <div className={`h-full rounded-full transition-all ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, pct)}%`}} />
              </div>
              <div className={`text-right text-xs mt-1 font-bold ${pct > 80 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>{pct}% consommé</div>
            </div>
          );
        })()}

        {/* Liste des actions de formation */}
        <div className="space-y-3 mb-4">
          {(enveloppeFormation.actions || []).map((action, aIdx) => (
            <div key={action.id} className={`p-4 rounded-2xl border group relative ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-emerald-100'}`}>
              <button onClick={() => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.filter(a => a.id !== action.id)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
              <div className="flex flex-wrap gap-3 items-start">
                <div className="flex-1 min-w-[150px]">
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Intitulé formation</label>
                  <input className={`w-full font-bold text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.nom} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, nom: e.target.value} : a)})} />
                </div>
                <div className="w-36">
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Bénéficiaire</label>
                  <input className={`w-full text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.beneficiaire || ''} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, beneficiaire: e.target.value} : a)})} />
                </div>
                <div className="w-28">
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Date</label>
                  <input type="date" className={`w-full text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.date || ''} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, date: e.target.value} : a)})} />
                </div>
                <div className="w-28">
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Coût (€)</label>
                  <input type="number" min="0" className={`w-full font-black text-sm rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.cout || 0} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, cout: Math.max(0, parseFloat(e.target.value) || 0)} : a)})} />
                </div>
                <div className="w-28">
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Statut</label>
                  <select className={`w-full text-xs rounded-lg px-2 py-1.5 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`} value={action.statut || 'planifie'} onChange={e => setEnveloppeFormation({...enveloppeFormation, actions: enveloppeFormation.actions.map(a => a.id === action.id ? {...a, statut: e.target.value} : a)})}>
                    <option value="planifie">Planifié</option>
                    <option value="en_cours">En cours</option>
                    <option value="realise">Réalisé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>
                <div className={`self-end px-3 py-1.5 rounded-lg text-xs font-black ${
                  action.statut === 'realise' ? (darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700') :
                  action.statut === 'en_cours' ? (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700') :
                  action.statut === 'annule' ? (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-500') :
                  (darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700')
                }`}>
                  {action.statut === 'realise' ? '✓ Réalisé' : action.statut === 'en_cours' ? '⟳ En cours' : action.statut === 'annule' ? '✕ Annulé' : '◷ Planifié'}
                </div>
              </div>
            </div>
          ))}
          {(enveloppeFormation.actions || []).length === 0 && (
            <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune action de formation — cliquez + pour en ajouter</p>
          )}
        </div>
        <button
          onClick={() => setEnveloppeFormation({...enveloppeFormation, actions: [...(enveloppeFormation.actions || []), { id: Date.now(), nom: 'Nouvelle formation', beneficiaire: '', date: '', cout: 0, statut: 'planifie' }]})}
          className={`w-full py-3 border-2 border-dashed rounded-2xl text-sm font-bold flex items-center justify-center gap-2 no-print ${darkMode ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}
        >
          <Plus size={16} /> Ajouter une action de formation
        </button>
      </div>

      {/* REPORTING FC */}
      <ReportingFC
        reportingFC={reportingFC}
        setReportingFC={setReportingFC}
        services={services}
        darkMode={darkMode}
        onExportExcel={() => exportReportingFC(reportingFC, services)}
        onExportPdf={() => exportReportingFCPdf(reportingFC, services)}
      />

      {/* PILOTAGE FINANCIER */}
      <PilotageFinancier
        key={pilotageResetKey}
        darkMode={darkMode}
        checkPassword={checkPassword}
        startEmpty={pilotageResetKey > 0}
        budgetPersonnel={[
          ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
          ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom })))
        ]}
        externalSites={pilotageSites}
        setExternalSites={setPilotageSites}
      />
    </>
  );
}
