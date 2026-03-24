/**
 * HelpIcon — icône ronde "?" cliquable, affiche l'explication au clic
 * Usage : <HelpIcon content="Explication ici" darkMode={darkMode} />
 * Props :
 *  content  : string | JSX   — contenu de l'infobulle
 *  size     : number         — taille de l'icône (défaut 14, ignoré — cercle fixe)
 *  darkMode : bool
 *  position : 'top'|'bottom'|'left'|'right'  (défaut 'top')
 *  wide     : bool           — infobulle plus large (défaut false)
 */
import React, { useState, useEffect, useRef } from 'react';

export default function HelpIcon({ content, darkMode, position = 'top', wide = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  const widthClass = wide ? 'w-96' : 'w-72';

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors
          ${open
            ? 'bg-teal-500 text-white'
            : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-teal-600 hover:text-white' : 'bg-slate-200 text-slate-500 hover:bg-teal-500 hover:text-white'
          }`}
      >?</button>
      {open && (
        <span
          className={`
            absolute z-[9999] ${posClass} ${widthClass}
            rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xl
            ${darkMode
              ? 'bg-gray-800 text-gray-100 border border-gray-600'
              : 'bg-slate-900 text-slate-50 border border-slate-700'}
          `}
        >
          {content}
        </span>
      )}
    </span>
  );
}
