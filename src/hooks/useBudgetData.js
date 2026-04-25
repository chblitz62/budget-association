import { useState, useEffect, useRef, useCallback } from 'react';
import { loadFromStorage, saveAll, saveAllSync } from '../utils/storage';
import {
  defaultGlobalParams,
  defaultDirection,
  defaultPoleSupport,
  defaultServices,
} from '../utils/constants';
import { zeroSites as pilotageZeroSites } from '../components/PilotageFinancier';

export const useBudgetData = () => {
  const [globalParams, setGlobalParams]         = useState(() => loadFromStorage('assoc_globalParams', defaultGlobalParams));
  const [direction, setDirection]               = useState(() => loadFromStorage('assoc_direction', defaultDirection));
  const [services, setServices]                 = useState(() => loadFromStorage('assoc_services', defaultServices));
  const [poleSupport, setPoleSupport]           = useState(() => loadFromStorage('assoc_pole_support', defaultPoleSupport));
  const [pilotageSites, setPilotageSites]       = useState(() => loadFromStorage('assoc_pilotage_sites', pilotageZeroSites));
  const [poolRH, setPoolRH]                     = useState(() => loadFromStorage('assoc_pool_rh', []));
  const [planningAbsences, setPlanningAbsences] = useState(() => loadFromStorage('assoc_planning_absences', {}));
  const [enveloppeFormation, setEnveloppeFormation] = useState(() => loadFromStorage('assoc_enveloppe_formation', { budget: 0, actions: [] }));
  const [reportingFC, setReportingFC]           = useState(() => loadFromStorage('assoc_reporting_fc', []));
  const [donneesN1, setDonneesN1]               = useState(() => loadFromStorage('assoc_donnees_n1', null));
  const [balanceComptable, setBalanceComptable] = useState(() => loadFromStorage('assoc_balance_comptable', null));
  const defaultRollingForecast = { moisCourant: 0, mois: Array.from({ length: 12 }, () => ({ recettes: 0, charges: 0 })) };
  const [rollingForecast, setRollingForecast] = useState(() => loadFromStorage('assoc_rolling_forecast', defaultRollingForecast));
  const [engagements, setEngagements] = useState(() => loadFromStorage('assoc_engagements', []));
  const [benevoles, setBenevoles]               = useState(() => loadFromStorage('assoc_benevoles', []));
  const [repartitionTemps, setRepartitionTemps] = useState(() => loadFromStorage('assoc_repartition_temps', {}));

  const [auditTrail, setAuditTrail] = useState(() => {
    try { return JSON.parse(localStorage.getItem('assoc_audit_trail') || '[]'); } catch { return []; }
  });

  const appendAuditEntry = useCallback((action, module = '', details = '') => {
    setAuditTrail(prev => {
      const entry = { ts: new Date().toISOString(), action, module, details };
      const next = [entry, ...prev].slice(0, 200);
      try { localStorage.setItem('assoc_audit_trail', JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);

  const saveTimerRef   = useRef(null);
  const autoSaveRef    = useRef(null); // référence stable pour l'intervalle auto-save

  // Snapshot courant de toutes les données métier (stable ref pour les intervalles)
  const buildSnapshot = useCallback(() => ({
    assoc_globalParams:        globalParams,
    assoc_direction:           direction,
    assoc_services:            services,
    assoc_pool_rh:             poolRH,
    assoc_pole_support:        poleSupport,
    assoc_pilotage_sites:      pilotageSites,
    assoc_planning_absences:   planningAbsences,
    assoc_enveloppe_formation: enveloppeFormation,
    assoc_reporting_fc:        reportingFC,
    assoc_donnees_n1:          donneesN1,
    assoc_balance_comptable:   balanceComptable,
    assoc_benevoles:           benevoles,
    assoc_repartition_temps:   repartitionTemps,
    assoc_rolling_forecast:    rollingForecast,
    assoc_engagements:         engagements,
  }), [globalParams, direction, services, poolRH, poleSupport, pilotageSites,
       planningAbsences, enveloppeFormation, reportingFC, donneesN1, balanceComptable, benevoles, repartitionTemps, rollingForecast, engagements]);

  // Sauvegarde atomique de toutes les données métier (debounce 300ms)
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        saveAll(buildSnapshot());
        window.dispatchEvent(new Event('storage-save'));
      } catch { /* quota dépassé — déjà loggé par saveAll */ }
    }, 300);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [buildSnapshot]);

  // Auto-sauvegarde toutes les 5 minutes
  // Electron  → déclenche un snapshot fichier dédié (data_autosave_N.json) via IPC
  // Navigateur → rotation sur 3 slots localStorage (comportement historique)
  useEffect(() => {
    const doAutoSave = () => {
      const ts = new Date().toISOString();

      if (typeof window !== 'undefined' && window.electronAPI?.triggerBackup) {
        // Electron : demande au main process de copier data.json → data_autosave_N.json
        window.electronAPI.triggerBackup()
          .then(res => {
            if (res.ok) {
              window.dispatchEvent(new CustomEvent('storage-autosave', { detail: { ts, path: res.path } }));
            }
          })
          .catch(() => { /* silencieux */ });
      } else {
        // Fallback navigateur : localStorage
        try {
          const snapshot = JSON.stringify({ ts, ...buildSnapshot() });
          const slot = ((parseInt(localStorage.getItem('assoc_backup_slot') || '0') % 3) + 1);
          localStorage.setItem(`assoc_backup_${slot}`, snapshot);
          localStorage.setItem('assoc_backup_slot', String(slot));
          localStorage.setItem('assoc_backup_last', ts);
          window.dispatchEvent(new CustomEvent('storage-autosave', { detail: { ts } }));
          appendAuditEntry('Sauvegarde automatique', 'Système', 'Backup 5 min');
        } catch { /* ignore si localStorage plein */ }
      }
    };

    const id = setInterval(doAutoSave, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [buildSnapshot]);

  // Sauvegarde forcée avant fermeture — synchrone pour garantir l'écriture fichier Electron
  useEffect(() => {
    const handleBeforeUnload = () => {
      try { saveAllSync(buildSnapshot()); } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [buildSnapshot]);

  return {
    globalParams, setGlobalParams,
    direction, setDirection,
    services, setServices,
    poleSupport, setPoleSupport,
    pilotageSites, setPilotageSites,
    poolRH, setPoolRH,
    planningAbsences, setPlanningAbsences,
    enveloppeFormation, setEnveloppeFormation,
    reportingFC, setReportingFC,
    donneesN1, setDonneesN1,
    balanceComptable, setBalanceComptable,
    benevoles, setBenevoles,
    repartitionTemps, setRepartitionTemps,
    rollingForecast, setRollingForecast,
    engagements, setEngagements,
    auditTrail, appendAuditEntry,
  };
};
