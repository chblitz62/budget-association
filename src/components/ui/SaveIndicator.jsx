import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

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

const SaveIndicator = () => {
  const [toasts, setToasts] = useState([]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type, id } = e.detail;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), DURATION[type] || 3000);
    };
    const handleSave = () => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, message: 'Sauvegardé', type: 'success' }]);
      setTimeout(() => dismiss(id), 2500);
    };
    window.addEventListener('app-toast', handleToast);
    window.addEventListener('storage-save', handleSave);
    return () => {
      window.removeEventListener('app-toast', handleToast);
      window.removeEventListener('storage-save', handleSave);
    };
  }, []);

  if (!toasts.length) return null;

  return (
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
  );
};

export default SaveIndicator;
