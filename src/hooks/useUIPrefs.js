import { useState, useEffect, useRef } from 'react';
import { loadFromStorage, saveAll } from '../utils/storage';

// Lit une préférence en supportant les deux formats : JSON (nouveau) et chaîne brute (ancien)
const readPref = (key, defaultVal) => {
  const item = localStorage.getItem(key);
  if (item === null) return defaultVal;
  try { return JSON.parse(item); }
  catch { return item || defaultVal; }
};

export const useUIPrefs = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dark') === 'true') return true;
    if (urlParams.get('dark') === 'false') return false;
    return loadFromStorage('assoc_darkMode', false);
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const newKey = readPref('assoc_sidebar_open', null);
    if (newKey !== null) return newKey;
    const legacy = readPref('budget_sidebar_open', true);
    try { localStorage.removeItem('budget_sidebar_open'); } catch {}
    return legacy;
  });

  const [activeTab, setActiveTab] = useState(() => readPref('assoc_active_tab', 'dashboard'));
  const [dafSub, setDafSub] = useState(() => readPref('daf_sub', 'subvention'));
  const [showTooltips, setShowTooltips] = useState(() => readPref('assoc_show_tooltips', true));
  const [privacyMode, setPrivacyMode] = useState(false);
  const [directionPosition, setDirectionPosition] = useState(() => loadFromStorage('assoc_direction_position', 0));
  const [poleSupportPosition, setPoleSupportPosition] = useState(() => loadFromStorage('assoc_pole_support_position', 1));

  // Scroll vers le haut lors d'un changement d'onglet
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [activeTab]);

  // Persistance atomique : toutes les prefs en une seule écriture saveAll
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    try {
      saveAll({
        'assoc_darkMode': darkMode,
        'assoc_sidebar_open': sidebarOpen,
        'assoc_active_tab': activeTab,
        'daf_sub': dafSub,
        'assoc_show_tooltips': showTooltips,
        'assoc_direction_position': directionPosition,
        'assoc_pole_support_position': poleSupportPosition,
      });
    } catch { /* ignore les erreurs de quota */ }
  }, [darkMode, sidebarOpen, activeTab, dafSub, showTooltips, directionPosition, poleSupportPosition]);

  return {
    darkMode, setDarkMode,
    sidebarOpen, setSidebarOpen,
    activeTab, setActiveTab,
    dafSub, setDafSub,
    showTooltips, setShowTooltips,
    privacyMode, setPrivacyMode,
    directionPosition, setDirectionPosition,
    poleSupportPosition, setPoleSupportPosition,
  };
};
