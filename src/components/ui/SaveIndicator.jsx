import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const SaveIndicator = ({ darkMode }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
    };
    window.addEventListener('storage-save', handleStorage);
    return () => window.removeEventListener('storage-save', handleStorage);
  }, []);

  if (!visible) return null;
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-40 ${darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-500 text-white'}`}>
      <CheckCircle size={18} />
      <span className="font-bold text-sm">Sauvegardé</span>
    </div>
  );
};

export default SaveIndicator;
