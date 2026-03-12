import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Check, AlertTriangle } from 'lucide-react';

const ImportN1Modal = ({ isOpen, onClose, onConfirm, darkMode }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear() - 1);

  if (!isOpen) return null;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: 0 });

        if (!rows.length) { setError('Fichier vide ou format non reconnu.'); return; }

        // Expected columns: Entité | Salaires | Exploitation | Recettes
        // Try case-insensitive key lookup
        const getField = (row, ...keys) => {
          for (const k of keys) {
            const found = Object.keys(row).find(rk => rk.toLowerCase().replace(/[^a-z]/g, '').includes(k.toLowerCase().replace(/[^a-z]/g, '')));
            if (found !== undefined) return parseFloat(row[found]) || 0;
          }
          return 0;
        };
        const getEntite = (row) => {
          const found = Object.keys(row).find(k => k.toLowerCase().includes('entit') || k.toLowerCase().includes('service') || k.toLowerCase() === 'nom');
          return found ? String(row[found]).trim() : '';
        };

        let direction = { salaires: 0, exploitation: 0, recettes: 0 };
        let poleSupport = { salaires: 0, exploitation: 0, recettes: 0 };
        const servicesN1 = [];

        rows.forEach(row => {
          const entite = getEntite(row);
          const item = {
            nom: entite,
            salaires: getField(row, 'salaires', 'salaire', 'personnel', 'masse'),
            exploitation: getField(row, 'exploitation', 'charges', 'fonctionnement'),
            recettes: getField(row, 'recettes', 'produits', 'revenus', 'ca'),
          };
          const entiteLow = entite.toLowerCase();
          if (entiteLow.includes('direction') || entiteLow.includes('siege') || entiteLow.includes('siège')) {
            direction = item;
          } else if (entiteLow.includes('support') || entiteLow.includes('pole') || entiteLow.includes('pôle')) {
            poleSupport = item;
          } else if (entite) {
            servicesN1.push(item);
          }
        });

        setPreview({ annee, direction, poleSupport, services: servicesN1 });
      } catch (err) {
        setError('Erreur de lecture : ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    if (!preview) return;
    onConfirm({ ...preview, annee });
    setPreview(null);
    setError('');
    onClose();
  };

  const handleClose = () => {
    setPreview(null);
    setError('');
    onClose();
  };

  const fmtE = (n) => Math.round(n).toLocaleString('fr-FR') + ' €';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-print">
      <div className={`max-w-2xl w-full rounded-3xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${darkMode ? 'bg-violet-900/40' : 'bg-violet-100'}`}>
              <Upload className={darkMode ? 'text-violet-400' : 'text-violet-600'} size={22} />
            </div>
            <div>
              <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Importer données N-1</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Fichier Excel — colonnes : Entité | Salaires | Exploitation | Recettes</p>
            </div>
          </div>
          <button onClick={handleClose} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}><X size={18} /></button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Année N-1 :</label>
          <input
            type="number"
            value={annee}
            onChange={e => { setAnnee(parseInt(e.target.value) || new Date().getFullYear() - 1); if (preview) setPreview({ ...preview, annee: parseInt(e.target.value) || new Date().getFullYear() - 1 }); }}
            className={`w-24 rounded-xl px-3 py-1.5 font-bold text-sm outline-none ${darkMode ? 'bg-gray-700 border border-gray-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-800'}`}
          />
        </div>

        <label className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors mb-4 ${darkMode ? 'border-violet-700 hover:bg-violet-900/10 text-violet-400' : 'border-violet-300 hover:bg-violet-50 text-violet-600'}`}>
          <Upload size={28} />
          <span className="font-bold text-sm">Cliquez pour sélectionner un fichier .xlsx</span>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        </label>

        {error && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${darkMode ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {preview && (
          <div className={`mb-5 p-4 rounded-2xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-violet-50 border-violet-200'}`}>
            <div className={`text-sm font-black mb-3 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
              Apercu — {preview.annee}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    <th className="text-left pb-1 pr-3">Entité</th>
                    <th className="text-right pb-1 pr-3">Salaires</th>
                    <th className="text-right pb-1 pr-3">Exploitation</th>
                    <th className="text-right pb-1">Recettes</th>
                  </tr>
                </thead>
                <tbody className={darkMode ? 'text-gray-300' : 'text-slate-700'}>
                  <tr className="border-t border-violet-200/30">
                    <td className="py-1 pr-3 font-bold">Direction</td>
                    <td className="py-1 pr-3 text-right">{fmtE(preview.direction.salaires)}</td>
                    <td className="py-1 pr-3 text-right">{fmtE(preview.direction.exploitation)}</td>
                    <td className="py-1 text-right">{fmtE(preview.direction.recettes)}</td>
                  </tr>
                  {preview.poleSupport.salaires > 0 || preview.poleSupport.nom ? (
                    <tr className="border-t border-violet-200/30">
                      <td className="py-1 pr-3 font-bold">Pôle Support</td>
                      <td className="py-1 pr-3 text-right">{fmtE(preview.poleSupport.salaires)}</td>
                      <td className="py-1 pr-3 text-right">{fmtE(preview.poleSupport.exploitation)}</td>
                      <td className="py-1 text-right">{fmtE(preview.poleSupport.recettes)}</td>
                    </tr>
                  ) : null}
                  {preview.services.map((s, i) => (
                    <tr key={i} className="border-t border-violet-200/30">
                      <td className="py-1 pr-3">{s.nom}</td>
                      <td className="py-1 pr-3 text-right">{fmtE(s.salaires)}</td>
                      <td className="py-1 pr-3 text-right">{fmtE(s.exploitation)}</td>
                      <td className="py-1 text-right">{fmtE(s.recettes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={handleClose} className={`px-4 py-2 rounded-xl font-bold text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!preview}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${preview ? 'bg-violet-600 text-white hover:bg-violet-700' : 'opacity-40 bg-violet-300 text-white cursor-not-allowed'}`}
          >
            <Check size={16} /> Importer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportN1Modal;
