import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, darkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
      <div className={`max-w-md w-full mx-4 p-6 rounded-3xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-100">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
        </div>
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
