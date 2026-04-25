import React, { useEffect, useRef, useState } from 'react';
import {
  MoreHorizontal, Eye, EyeOff, BookOpen, Brain, Sun, Moon, Settings, Check,
} from 'lucide-react';
import { surface, button as btnTokens } from '../../styles/tokens';

/**
 * <ToolsMenu /> — Dropdown regroupant les actions secondaires du header.
 *
 * Réduit la pollution visuelle du Topbar en regroupant 5 actions :
 *   - Confidentialité (Privacy mode)
 *   - Glossaire Éco-Fin
 *   - Copilote IA
 *   - Mode sombre / clair
 *   - Paramètres
 *
 * Comportement :
 *   - Ferme au clic extérieur
 *   - Ferme à Échap
 *   - Items "toggle" affichent un check si actifs
 */
export default function ToolsMenu({
  darkMode = false,
  // toggles
  privacyMode, onPrivacyToggle,
  showEcoFin, onEcoFinToggle,
  showAICopilot, onAIToggle,
  onDarkModeToggle,
  onSettings,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Click outside / Échap
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const items = [
    {
      key: 'privacy',
      icon: privacyMode ? EyeOff : Eye,
      label: privacyMode ? 'Confidentialité activée' : 'Mode confidentialité',
      hint: 'Masquer les montants à l\'écran',
      active: privacyMode,
      onClick: () => { onPrivacyToggle?.(); setOpen(false); },
      accent: 'text-rose-500',
    },
    {
      key: 'ecofin',
      icon: BookOpen,
      label: 'Glossaire Éco-Fin',
      hint: '12 termes financiers expliqués',
      active: showEcoFin,
      onClick: () => { onEcoFinToggle?.(); setOpen(false); },
      accent: 'text-indigo-500',
    },
    {
      key: 'ai',
      icon: Brain,
      label: 'Copilote IA',
      hint: 'Analyse stratégique automatisée',
      active: showAICopilot,
      onClick: () => { onAIToggle?.(); setOpen(false); },
      accent: 'text-violet-500',
    },
    { divider: true, key: 'div1' },
    {
      key: 'darkmode',
      icon: darkMode ? Sun : Moon,
      label: darkMode ? 'Mode clair' : 'Mode sombre',
      hint: 'Bascule de thème',
      onClick: () => { onDarkModeToggle?.(); setOpen(false); },
      accent: darkMode ? 'text-amber-500' : 'text-zinc-500',
    },
    {
      key: 'settings',
      icon: Settings,
      label: 'Paramètres',
      hint: 'Configuration et import',
      onClick: () => { onSettings?.(); setOpen(false); },
      accent: 'text-slate-500',
    },
  ];

  const dm = darkMode;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Outils"
        className={`${btnTokens.iconOnly(dm)} ${open ? (dm ? 'bg-zinc-800/60 text-zinc-200' : 'bg-slate-100 text-slate-700') : ''}`}
      >
        <MoreHorizontal size={18} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-full mt-2 w-72 ${surface.elevated(dm)} p-2 z-[60] animate-zoom-in origin-top-right`}
        >
          {items.map(item => {
            if (item.divider) {
              return <div key={item.key} className={`my-1 h-px ${dm ? 'bg-zinc-800' : 'bg-slate-100'}`} />;
            }
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                role="menuitem"
                onClick={item.onClick}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors text-left
                  ${dm ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-50'}`}
              >
                <Icon size={16} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${item.accent}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>
                    {item.label}
                  </div>
                  {item.hint && (
                    <div className={`text-[11px] mt-0.5 ${dm ? 'text-zinc-500' : 'text-slate-500'}`}>
                      {item.hint}
                    </div>
                  )}
                </div>
                {item.active && (
                  <Check size={14} strokeWidth={2} className="text-emerald-500 mt-1 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
