import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, FileSpreadsheet, Download } from 'lucide-react';

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

const ReportingFC = ({ reportingFC, setReportingFC, services, darkMode, onExportExcel, onExportPdf }) => {
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

  const inputCls = `w-full rounded-lg px-2 py-1.5 text-sm outline-none ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white border border-slate-200'}`;

  return (
    <div id="reporting-fc" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-indigo-900' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} size={28} />
          <div>
            <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Reporting Formation Continue</h2>
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
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Heures</label>
              <input type="number" min="0" step="0.5" className={inputCls} value={form.heures} onChange={e => setForm({ ...form, heures: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Coût (€)</label>
              <input type="number" min="0" className={inputCls} value={form.cout} onChange={e => setForm({ ...form, cout: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Financement OPCO (€)</label>
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
                {['Stagiaire', 'Formation', 'Date début', 'Date fin', 'Heures', 'Coût (€)', 'OPCO (€)', 'Service', ''].map((h, i) => (
                  <th key={i} className={`px-3 py-2 text-left text-xs font-black uppercase ${i >= 4 && i <= 6 ? 'text-right' : ''} ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{h}</th>
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
