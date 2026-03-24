/**
 * HelpIcon — icône "?" avec infobulle au survol
 * Usage : <HelpIcon content="Explication ici" darkMode={darkMode} />
 * Props :
 *  content  : string | JSX   — contenu de l'infobulle
 *  size     : number         — taille de l'icône (défaut 14)
 *  darkMode : bool
 *  position : 'top'|'bottom'|'left'|'right'  (défaut 'top')
 *  wide     : bool           — infobulle plus large (défaut false)
 */
import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function HelpIcon({ content, size = 14, darkMode, position = 'top', wide = false }) {
  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  const widthClass = wide ? 'w-96' : 'w-72';

  return (
    <span className="relative inline-flex items-center group">
      <HelpCircle
        size={size}
        className={`cursor-help flex-shrink-0 transition-colors ${darkMode ? 'text-gray-500 group-hover:text-teal-400' : 'text-slate-400 group-hover:text-teal-500'}`}
      />
      <span
        className={`
          pointer-events-none absolute z-[9999] ${posClass} ${widthClass}
          rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xl
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 delay-0 group-hover:delay-500
          ${darkMode
            ? 'bg-gray-800 text-gray-100 border border-gray-600'
            : 'bg-slate-900 text-slate-50 border border-slate-700'}
        `}
      >
        {content}
      </span>
    </span>
  );
}
