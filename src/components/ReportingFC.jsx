import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, FileSpreadsheet, Download } from 'lucide-react';
import HelpIcon from './ui/HelpIcon';

const emptyRecord = () => ({
  id: String(Date.now() + Math.random()),
  stagiaire: '',
  formation: '',
  dateDebut: '',
  dateFin: '',
  heures: 0,
  cout: 0,
  financementOPCO: 0,
  serviceId: null,
});

const ReportingFC = ({ reportingFC, setReportingFC, services, darkMode, globalParams, setGlobalParams, onExportExcel, onExportPdf }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyRecord());
  const [editId, setEditId] = useState(null);

  const fcServices = services.filter(s => s.promos === undefined
    ? false
    : true
  );

  const handleAdd = () => {
    if (!form.stagiaire.trim()) return;
    if (editId) {
      setReportingFC(reportingFC.map(r => r.id === editId ? { ...form, id: editId } : r));
      setEditId(null);
    } else {
      setReportingFC([...reportingFC, { ...form, id: String(Date.now()) }]);
    }
    setForm(emptyRecord());
    setShowForm(false);
  };

  const handleEdit = (record) => {
    setForm({ ...record });
    setEditId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setReportingFC(reportingFC.filter(r => r.id !== id));
  };

  const handleCancel = () => {
    setForm(emptyRecord());
    setEditId(null);
    setShowForm(false);
  };

  const getServiceNom = (serviceId) => {
    const s = services.find(s => s.id === serviceId);
    return s ? s.nom : '—';
  };

  const totalHeures = reportingFC.reduce((s, r) => s + (parseFloat(r.heures) || 0), 0);
  const totalCout = reportingFC.reduce((s, r) => s + (parseFloat(r.cout) || 0), 0);
  const totalOPCO = reportingFC.reduce((s, r) => s + (parseFloat(r.financementOPCO) || 0), 0);

  const opcoPrevMontant = parseFloat(globalParams?.opcoPrevisionnelAnnuel) || 0;
  const opcoPrevHeures  = parseFloat(globalParams?.opcoPrevisionnelHeures)  || 0;
  const tauxRealisationOPCO  = opcoPrevMontant > 0 ? Math.round(totalOPCO / opcoPrevMontant * 100) : null;
  const tauxRealisationHeures = opcoPrevHeures > 0 ? Math.round(totalHeures / opcoPrevHeures * 100) : null;

  const inputCls = `w-full rounded-lg px-2 py-1.5 text-sm outline-none ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white border border-slate-200'}`;

  return (
    <div id="reporting-fc" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-indigo-900' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} size={28} />
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Reporting Formation Continue
              <HelpIcon type="info" position="bottom" wide content="Registre individuel des parcours de formation continue (FC) des salariés. Permet de suivre le volume horaire, les coûts et les prises en charge OPCO. Exportable en Excel et PDF pour transmission aux organismes financeurs." />
            </h2>
            <span className={`text-xs font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {reportingFC.length} stagiaire{reportingFC.length !== 1 ? 's' : ''} · {totalHeures.toLocaleString('fr-FR')} h · {Math.round(totalCout).toLocaleString('fr-FR')} € (OPCO : {Math.round(totalOPCO).toLocaleString('fr-FR')} €)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={onExportExcel}
            disabled={reportingFC.length === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${reportingFC.length === 0 ? 'opacity-40 cursor-not-allowed bg-green-100 text-green-600' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={onExportPdf}
            disabled={reportingFC.length === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${reportingFC.length === 0 ? 'opacity-40 cursor-not-allowed bg-red-100 text-red-500' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            <Download size={16} /> PDF
          </button>
          <button
            onClick={() => { setForm(emptyRecord()); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Suivi OPCO : prévisionnel vs. réel */}
      {setGlobalParams && (
        <div className={`mb-4 rounded-2xl border p-4 ${darkMode ? 'bg-indigo-900/20 border-indigo-800/40' : 'bg-indigo-50 border-indigo-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Suivi OPCO — prévisionnel vs. réel</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Budget OPCO prév. (€)</label>
              <input type="number" min="0" className={`w-full rounded-lg px-2 py-1.5 text-sm outline-none ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white border border-slate-200'}`}
                value={opcoPrevMontant || ''}
                onChange={e => setGlobalParams(p => ({ ...p, opcoPrevisionnelAnnuel: parseFloat(e.target.value) || 0 }))}
                placeholder="0" />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Heures formation prév.</label>
              <input type="number" min="0" className={`w-full rounded-lg px-2 py-1.5 text-sm outline-none ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white border border-slate-200'}`}
                value={opcoPrevHeures || ''}
                onChange={e => setGlobalParams(p => ({ ...p, opcoPrevisionnelHeures: parseFloat(e.target.value) || 0 }))}
                placeholder="0" />
            </div>
            <div className={`rounded-xl p-3 border ${darkMode ? 'bg-green-900/20 border-green-800/40' : 'bg-green-50 border-green-200'}`}>
              <div className={`text-xs font-semibold mb-0.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>OPCO réalisé</div>
              <div className={`text-lg font-black ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                {Math.round(totalOPCO).toLocaleString('fr-FR')} €
              </div>
              {tauxRealisationOPCO !== null && (
                <div className={`text-xs font-bold mt-0.5 ${tauxRealisationOPCO >= 100 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-amber-400' : 'text-amber-600')}`}>
                  {tauxRealisationOPCO}% du prévisionnel
                </div>
              )}
            </div>
            <div className={`rounded-xl p-3 border ${darkMode ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`text-xs font-semibold mb-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Heures réalisées</div>
              <div className={`text-lg font-black ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                {totalHeures.toLocaleString('fr-FR')} h
              </div>
              {tauxRealisationHeures !== null && (
                <div className={`text-xs font-bold mt-0.5 ${tauxRealisationHeures >= 100 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-amber-400' : 'text-amber-600')}`}>
                  {tauxRealisationHeures}% du prévisionnel
                </div>
              )}
            </div>
          </div>
          {opcoPrevMontant > 0 && totalOPCO > 0 && (
            <div className="mt-2">
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                <div className={`h-2 rounded-full transition-all ${tauxRealisationOPCO >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, tauxRealisationOPCO)}%` }} />
              </div>
              {totalOPCO < opcoPrevMontant && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  Reste à percevoir : {Math.round(opcoPrevMontant - totalOPCO).toLocaleString('fr-FR')} €
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className={`mb-4 p-4 rounded-2xl border-2 ${darkMode ? 'bg-gray-700 border-indigo-700' : 'bg-white border-indigo-200'}`}>
          <h3 className={`text-sm font-black mb-3 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
            {editId ? 'Modifier le stagiaire' : 'Nouveau stagiaire FC'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Stagiaire *</label>
              <input className={inputCls} value={form.stagiaire} onChange={e => setForm({ ...form, stagiaire: e.target.value })} placeholder="Nom prénom" />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Formation</label>
              <input className={inputCls} value={form.formation} onChange={e => setForm({ ...form, formation: e.target.value })} placeholder="Intitulé de la formation" />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Date début</label>
              <input type="date" className={inputCls} value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Date fin</label>
              <input type="date" className={inputCls} value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} />
            </div>
            <div>
              <label className={`flex items-center gap-1 text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Heures
                <HelpIcon type="info" position="top" content="Durée totale de la formation en heures. Sert à justifier la prise en charge OPCO et à calculer le coût horaire." />
              </label>
              <input type="number" min="0" step="0.5" className={inputCls} value={form.heures} onChange={e => setForm({ ...form, heures: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={`flex items-center gap-1 text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Coût (€)
                <HelpIcon type="info" position="top" content="Coût total brut de la formation avant déduction OPCO. Inclure les frais pédagogiques, déplacement et hébergement si applicable." />
              </label>
              <input type="number" min="0" className={inputCls} value={form.cout} onChange={e => setForm({ ...form, cout: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={`flex items-center gap-1 text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Financement OPCO (€)
                <HelpIcon type="warning" position="top" content="Montant confirmé de prise en charge par l'OPCO. À ne saisir qu'après accord de financement. Le reste à charge employeur = Coût − OPCO." />
              </label>
              <input type="number" min="0" className={inputCls} value={form.financementOPCO} onChange={e => setForm({ ...form, financementOPCO: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Service</label>
              <select className={inputCls} value={form.serviceId ?? ''} onChange={e => setForm({ ...form, serviceId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">— Aucun —</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
              <X size={14} /> Annuler
            </button>
            <button onClick={handleAdd} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
              <Check size={14} /> {editId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Tableau */}
      {reportingFC.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-700' : 'bg-white/70'}`}>
                {[
                  { label: 'Stagiaire', help: null },
                  { label: 'Formation', help: null },
                  { label: 'Date début', help: null },
                  { label: 'Date fin', help: null },
                  { label: 'Heures', help: 'Nombre d\'heures de formation réalisées. Permet de calculer le coût horaire et de justifier auprès de l\'OPCO.', right: true },
                  { label: 'Coût (€)', help: 'Coût total engagé pour cette formation : frais pédagogiques, déplacement, hébergement. Avant déduction OPCO.', right: true },
                  { label: 'OPCO (€)', help: 'Montant pris en charge par l\'OPCO (Opérateur de Compétences). Le reste à charge employeur = Coût − OPCO.', right: true },
                  { label: 'Service', help: null },
                  { label: '', help: null },
                ].map((h, i) => (
                  <th key={i} className={`px-3 py-2 text-left text-xs font-black uppercase ${h.right ? 'text-right' : ''} ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    {h.help ? (
                      <span className={`flex items-center gap-1 ${h.right ? 'justify-end' : ''}`}>
                        {h.label}
                        <HelpIcon type="info" position="bottom" content={h.help} />
                      </span>
                    ) : h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportingFC.map((r, idx) => (
                <tr key={r.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-indigo-100'} ${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white/40') : ''}`}>
                  <td className={`px-3 py-2 font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{r.stagiaire || '—'}</td>
                  <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{r.formation || '—'}</td>
                  <td className={`px-3 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{r.dateDebut || '—'}</td>
                  <td className={`px-3 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{r.dateFin || '—'}</td>
                  <td className={`px-3 py-2 text-right font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{(parseFloat(r.heures) || 0).toLocaleString('fr-FR')}</td>
                  <td className={`px-3 py-2 text-right font-bold ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{Math.round(parseFloat(r.cout) || 0).toLocaleString('fr-FR')} €</td>
                  <td className={`px-3 py-2 text-right font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{Math.round(parseFloat(r.financementOPCO) || 0).toLocaleString('fr-FR')} €</td>
                  <td className={`px-3 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{getServiceNom(r.serviceId)}</td>
                  <td className="px-3 py-2 no-print">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(r)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 font-black ${darkMode ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-300 bg-indigo-100/80'}`}>
                <td colSpan={4} className={`px-3 py-2 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL ({reportingFC.length})</td>
                <td className={`px-3 py-2 text-right ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{totalHeures.toLocaleString('fr-FR')} h</td>
                <td className={`px-3 py-2 text-right ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{Math.round(totalCout).toLocaleString('fr-FR')} €</td>
                <td className={`px-3 py-2 text-right ${darkMode ? 'text-green-200' : 'text-green-800'}`}>{Math.round(totalOPCO).toLocaleString('fr-FR')} €</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className={`text-center py-8 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
          Aucun stagiaire — cliquez "Ajouter" pour saisir un parcours FC
        </p>
      )}
    </div>
  );
};

export default ReportingFC;
