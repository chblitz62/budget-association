import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, HardDrive, FileDown } from 'lucide-react';

const EXPORT_REMINDER_DAYS = 30;

let toastId = 0;

// API globale : window.appToast('msg', 'success'|'error'|'warning'|'info')
if (typeof window !== 'undefined') {
  window.appToast = (message, type = 'success') => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, id: ++toastId } }));
  };
}

const ICONS = {
  success: <CheckCircle size={17} />,
  error:   <XCircle size={17} />,
  warning: <AlertTriangle size={17} />,
  info:    <Info size={17} />,
};

const COLORS = {
  success: 'bg-teal-500 text-white',
  error:   'bg-rose-500 text-white',
  warning: 'bg-amber-500 text-white',
  info:    'bg-indigo-500 text-white',
};

const DURATION = { success: 2500, error: 5000, warning: 4000, info: 3000 };

function formatRelative(ts) {
  if (!ts) return null;
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return 'à l\'instant';
  if (diff < 120) return 'il y a 1 min';
  const mins = Math.floor(diff / 60);
  if (mins < 60)  return `il y a ${mins} min`;
  return `il y a ${Math.floor(mins / 60)} h`;
}

const SaveIndicator = ({ darkMode }) => {
  const [toasts, setToasts] = useState([]);
  // Dernière sauvegarde fichier (Electron) ou auto-save
  const [lastFileSave,   setLastFileSave]   = useState(null);  // timestamp ms
  const [lastAutoSave,   setLastAutoSave]   = useState(null);  // timestamp ms
  const [lastExcelExport, setLastExcelExport] = useState(() => {
    try { const v = localStorage.getItem('lastExcelExportDate'); return v ? parseInt(v, 10) : null; } catch (_) { return null; }
  });
  const [, forceUpdate] = useState(0);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type, id } = e.detail;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), DURATION[type] || 3000);
    };

    // Sauvegarde temps-réel (300ms debounce)
    const handleSave = () => {
      setLastFileSave(Date.now());
      const id = ++toastId;
      setToasts(prev => [...prev, { id, message: 'Sauvegardé', type: 'success' }]);
      setTimeout(() => dismiss(id), 2500);
    };

    // Sauvegarde fichier Electron (confirmée par l'IPC)
    const handleFileSaved = (e) => {
      setLastFileSave(e.detail?.ts ?? Date.now());
    };

    // Auto-save 5 minutes
    const handleAutoSave = (e) => {
      const ts = e.detail?.ts ? new Date(e.detail.ts).getTime() : Date.now();
      setLastAutoSave(ts);
      const isElectron = !!window.electronAPI;
      const id = ++toastId;
      const msg = isElectron && e.detail?.path
        ? `Sauvegarde auto → ${e.detail.path.split(/[/\\]/).pop()}`
        : 'Sauvegarde auto effectuée';
      setToasts(prev => [...prev, { id, message: msg, type: 'info' }]);
      setTimeout(() => dismiss(id), 4000);
    };

    const handleExcelExport = (e) => {
      const ts = e.detail?.ts ?? Date.now();
      setLastExcelExport(ts);
    };

    window.addEventListener('app-toast',           handleToast);
    window.addEventListener('storage-save',         handleSave);
    window.addEventListener('storage-file-saved',   handleFileSaved);
    window.addEventListener('storage-autosave',     handleAutoSave);
    window.addEventListener('storage-excel-export', handleExcelExport);
    return () => {
      window.removeEventListener('app-toast',           handleToast);
      window.removeEventListener('storage-save',         handleSave);
      window.removeEventListener('storage-file-saved',   handleFileSaved);
      window.removeEventListener('storage-autosave',     handleAutoSave);
      window.removeEventListener('storage-excel-export', handleExcelExport);
    };
  }, []);

  // Rafraîchit le label relatif ("il y a X min") toutes les 30s
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const lastSaveTs = lastFileSave ?? lastAutoSave;
  const daysSinceExport = lastExcelExport
    ? Math.floor((Date.now() - lastExcelExport) / (1000 * 60 * 60 * 24))
    : null;
  const showExportReminder = daysSinceExport === null || daysSinceExport >= EXPORT_REMINDER_DAYS;

  return (
    <>
      {/* Badge rappel export Excel */}
      {showExportReminder && (
        <div
          className={`fixed ${isElectron && lastSaveTs ? 'bottom-12' : 'bottom-4'} left-4 z-[9997] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-default select-none border
            ${darkMode ? 'bg-amber-900/40 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
          title={lastExcelExport ? `Dernier export Excel : il y a ${daysSinceExport} jours` : 'Aucun export Excel enregistré'}
        >
          <FileDown size={12} />
          {lastExcelExport ? `Export Excel il y a ${daysSinceExport} j` : 'Export Excel non effectué'}
        </div>
      )}

      {/* Badge discret "dernière sauvegarde" — visible uniquement sous Electron */}
      {isElectron && lastSaveTs && (
        <div
          className={`fixed bottom-4 left-4 z-[9998] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium opacity-70 hover:opacity-100 transition-opacity cursor-default select-none
            ${darkMode ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
          title={`Sauvegarde fichier active — ${window.electronAPI?.initialData?._savedAt ? 'data.json' : 'localStorage'}`}
        >
          <HardDrive size={12} />
          Sauvegardé {formatRelative(lastSaveTs)}
        </div>
      )}

      {/* Stack de toasts (bas-droite) */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg pointer-events-auto ${COLORS[t.type] || COLORS.info}`}
              style={{ animation: 'slideUp 0.2s ease-out' }}
            >
              {ICONS[t.type]}
              <span className="font-semibold text-sm">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default SaveIndicator;
