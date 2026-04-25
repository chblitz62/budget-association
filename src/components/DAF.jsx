/**
 * DAF.jsx – Dossier de Demande de Subvention Régionale
 * Sections : Formations FI | Services transversaux/Siège | Recherche | Récapitulatif
 * Données persistées dans localStorage. Lien optionnel aux données budgétaires de l'appli.
 */
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Trash2, FileSpreadsheet, ChevronDown, ChevronUp,
  GraduationCap, Building2, Search, Info, Calculator,
  Percent, Link, Link2Off, RefreshCw, Target, Layers, Users,
} from 'lucide-react';
import {
  DAF_TAUX_INIT, DAF_FORMATIONS_INIT, DAF_COST_LINES, DAF_TRANSVERSAL_INIT,
  calculerStatsFormation, FILIERES_DEFAULT,
} from '../utils/constants';
import { calculerEnveloppeParFiliere } from '../utils/calculations';
import { formatEuro } from '../utils/formatting';
import { AlertTriangle } from 'lucide-react';

// Alias local pour compatibilité interne (même signature que l'ancienne fmt)
const fmt = (n) => formatEuro(typeof n === 'number' ? n : 0);

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DAF({
  darkMode,
  services                = [],
  direction               = null,
  poleSupport             = null,
  globalParams            = null,
  calculerBudgetService,
  calculerBudgetDirection,
  calculerBudgetPoleSupport,
  enveloppeFormation      = null,
}) {
  // Taux par défaut : globalParams > localStorage > DAF_TAUX_INIT
  const tauxDefaut = globalParams?.tauxSubventionDAF ?? DAF_TAUX_INIT;

  // ── State ──────────────────────────────────────────────────────────────────

  const [taux, setTaux] = useState(() => {
    try { return { ...tauxDefaut, ...JSON.parse(localStorage.getItem('daf_taux') || '{}') }; }
    catch { return tauxDefaut; }
  });

  const [formations, setFormations] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('daf_formations') || 'null');
      if (saved) return saved;
    } catch {}
    return DAF_FORMATIONS_INIT.map(f => ({
      ...f,
      couts: { personnel: 0, materiel: 0, locaux: 0, admin: 0, autres: 0 },
    }));
  });

  const [transversal, setTransversal] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('daf_transversal') || 'null');
      if (saved) return saved;
    } catch {}
    return DAF_TRANSVERSAL_INIT;
  });

  const [recherche, setRecherche] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('daf_recherche') || 'null')
        || { coutTotal: 0, partElig: 50 };
    } catch { return { coutTotal: 0, partElig: 50 }; }
  });

  const [open, setOpen] = useState({
    taux: false, formations: true, transversal: true, recherche: true, recap: true,
  });
  const [openFormation, setOpenFormation] = useState({});

  const [useBudgetLink, setUseBudgetLink] = useState(() => {
    try { return JSON.parse(localStorage.getItem('daf_budget_link') || 'false'); }
    catch { return false; }
  });

  // Liens formation → service (par ID) pour la synchronisation budgétaire
  const [serviceLinks, setServiceLinks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('daf_service_links') || '{}'); }
    catch { return {}; }
  });
  const setServiceLink = (formationId, serviceId) => {
    const n = { ...serviceLinks, [formationId]: serviceId || null };
    setServiceLinks(n);
    localStorage.setItem('daf_service_links', JSON.stringify(n));
  };

  // ── Calcul budgets existants (si lien activé) ──────────────────────────────
  const budgets = useMemo(() => {
    if (!useBudgetLink) return {};
    const out = {};
    services.forEach(s => {
      if (calculerBudgetService) out[`service-${s.id}`] = calculerBudgetService(s);
    });
    if (direction   && calculerBudgetDirection)   out['direction']   = calculerBudgetDirection(direction);
    if (poleSupport && calculerBudgetPoleSupport) out['poleSupport'] = calculerBudgetPoleSupport(poleSupport);
    return out;
  }, [useBudgetLink, services, direction, poleSupport,
      calculerBudgetService, calculerBudgetDirection, calculerBudgetPoleSupport]);

  // ── Persistance ────────────────────────────────────────────────────────────
  const p = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const setTauxP = (v) => {
    const n = { ...taux, ...v }; setTaux(n); p('daf_taux', n);
  };
  const updateFormation = (id, upd) => {
    const n = formations.map(f => f.id === id ? upd(f) : f);
    setFormations(n); p('daf_formations', n);
  };
  const updateTransversal = (id, upd) => {
    const n = transversal.map(t => t.id === id ? upd(t) : t);
    setTransversal(n); p('daf_transversal', n);
  };
  const addTransversal = () => {
    const n = [...transversal, { id: `t${Date.now()}`, nom: 'Nouveau service', coutTotal: 0, cleRep: 50 }];
    setTransversal(n); p('daf_transversal', n);
  };
  const removeTransversal = (id) => {
    const n = transversal.filter(t => t.id !== id);
    setTransversal(n); p('daf_transversal', n);
  };
  const setRechercheP = (v) => {
    const n = { ...recherche, ...v }; setRecherche(n); p('daf_recherche', n);
  };
  const toggleBudgetLink = () => {
    const v = !useBudgetLink; setUseBudgetLink(v); p('daf_budget_link', v);
  };

  // ── Calculs ────────────────────────────────────────────────────────────────
  const rowsFormations = useMemo(() => formations.map(f => {
    let coeff = { ...f };

    // Synchronisation depuis le service lié (si lien budget actif)
    if (useBudgetLink && serviceLinks[f.id]) {
      const srv = services.find(s => s.id === serviceLinks[f.id]);
      if (srv) {
        // Effectif actuel depuis promos (net d'abandons)
        const stats = calculerStatsFormation(srv);
        const effectifActuel = stats.effectifActuel;
        if (effectifActuel > 0) coeff = { ...coeff, effectif: effectifActuel };

        // Coût personnel + exploitation depuis budget
        if (calculerBudgetService) {
          const b = calculerBudgetService(srv);
          coeff = {
            ...coeff,
            couts: { ...coeff.couts, personnel: Math.round(b.salaires) },
            exploitationBudget: Math.round(b.exploitation || 0),
          };
        }
      }
    }

    const coutTotal = DAF_COST_LINES.reduce((s, { key }) => s + (parseFloat(coeff.couts[key]) || 0), 0)
      + (coeff.exploitationBudget || 0);

    let coutEligible, subvention;
    if (taux.tauxModulable) {
      const cSalaires = parseFloat(coeff.couts.personnel) || 0;
      const cExploit  = (parseFloat(coeff.couts.locaux) || 0)
                      + (parseFloat(coeff.couts.admin)   || 0)
                      + (parseFloat(coeff.couts.autres)  || 0)
                      + (coeff.exploitationBudget || 0);
      const cInvest   = parseFloat(coeff.couts.materiel) || 0;
      coutEligible = cSalaires * ((taux.fiSalaires ?? 70) / 100)
                   + cExploit  * ((taux.fiExploitation ?? 70) / 100)
                   + cInvest   * ((taux.fiInvest ?? 50) / 100);
      subvention = coutEligible;
    } else {
      coutEligible = coutTotal;
      subvention = coutTotal * (taux.fi / 100);
    }
    return { ...coeff, coutTotal, coutEligible, subvention };
  }), [formations, taux.fi, taux.tauxModulable, taux.fiSalaires, taux.fiExploitation, taux.fiInvest, useBudgetLink, serviceLinks, services, calculerBudgetService]);

  const rowsTransversal = useMemo(() => {
    const rows = transversal.map(t => {
      const coutTotal     = parseFloat(t.coutTotal) || 0;
      const cleRep        = parseFloat(t.cleRep)    || 0;
      const coutImputable = coutTotal * (cleRep / 100);
      return { ...t, coutTotal, coutImputable, subvention: coutImputable * (taux.transversal / 100) };
    });
    // Lignes liées au budget applicatif
    if (useBudgetLink) {
      if (budgets['direction']) {
        const b = budgets['direction'];
        const cleRep = direction?.repartition
          ? Math.min(100, Object.values(direction.repartition).reduce((s, v) => s + (parseFloat(v) || 0), 0))
          : 60;
        const ci = b.total * (cleRep / 100);
        rows.push({ id: '_dir', nom: 'Direction & Siège (budget)', coutTotal: b.total,
                    cleRep, coutImputable: ci, subvention: ci * (taux.transversal / 100), fromBudget: true });
      }
      if (budgets['poleSupport']) {
        const b = budgets['poleSupport'];
        const cleRep = poleSupport?.repartition
          ? Math.min(100, Object.values(poleSupport.repartition).reduce((s, v) => s + (parseFloat(v) || 0), 0))
          : 50;
        const ci = b.total * (cleRep / 100);
        rows.push({ id: '_ps', nom: 'Pôle Ressource (budget)', coutTotal: b.total,
                    cleRep, coutImputable: ci, subvention: ci * (taux.transversal / 100), fromBudget: true });
      }
    }
    return rows;
  }, [transversal, taux.transversal, budgets, useBudgetLink]);

  // Services de type Recherche (liés depuis l'onglet Budget)
  const servicesRecherche = useMemo(
    () => services.filter(s => s.type === 'recherche'),
    [services]
  );

  const rowRecherche = useMemo(() => {
    let coutTotal;
    if (servicesRecherche.length > 0 && calculerBudgetService) {
      // Source de vérité : budgets calculés des services Recherche
      coutTotal = servicesRecherche.reduce((sum, s) => sum + (calculerBudgetService(s)?.total || 0), 0);
    } else {
      // Fallback : saisie manuelle legacy
      coutTotal = parseFloat(recherche.coutTotal) || 0;
    }
    const coutEligible = coutTotal * ((parseFloat(recherche.partElig) || 0) / 100);
    return {
      coutTotal,
      coutEligible,
      subvention: coutEligible * (taux.recherche / 100),
      isLinked: servicesRecherche.length > 0,
      servicesRecherche,
    };
  }, [recherche, taux.recherche, servicesRecherche, calculerBudgetService]);

  const totF = useMemo(() => ({
    coutTotal:    rowsFormations.reduce((s, r) => s + r.coutTotal,    0),
    coutEligible: rowsFormations.reduce((s, r) => s + r.coutEligible, 0),
    subvention:   rowsFormations.reduce((s, r) => s + r.subvention,   0),
  }), [rowsFormations]);

  const totT = useMemo(() => ({
    coutTotal:     rowsTransversal.reduce((s, r) => s + r.coutTotal,     0),
    coutImputable: rowsTransversal.reduce((s, r) => s + r.coutImputable, 0),
    subvention:    rowsTransversal.reduce((s, r) => s + r.subvention,    0),
  }), [rowsTransversal]);

  const grand = {
    coutTotal:    totF.coutTotal    + totT.coutTotal    + rowRecherche.coutTotal,
    coutEligible: totF.coutEligible + totT.coutImputable + rowRecherche.coutEligible,
    subvention:   totF.subvention   + totT.subvention   + rowRecherche.subvention,
  };

  // Budget prévisionnel total depuis l'application (somme de toutes les entités)
  const totalBudgetApp = useMemo(() => {
    if (!useBudgetLink) return 0;
    return Object.values(budgets).reduce((s, b) => s + (b?.total || 0), 0);
  }, [budgets, useBudgetLink]);

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Onglet 1 – Détail formations
    const hF = ['Formation', 'Durée (ans)', 'Effectif',
      ...DAF_COST_LINES.map(c => c.label), 'Coût total (€)', `Subvention (${taux.fi}%)`];
    const rowsF = rowsFormations.map(f => [
      f.nom, f.duree, f.effectif,
      ...DAF_COST_LINES.map(({ key }) => Math.round(parseFloat(f.couts[key]) || 0)),
      Math.round(f.coutTotal), Math.round(f.subvention),
    ]);
    rowsF.push([
      'TOTAL', '', '',
      ...DAF_COST_LINES.map(({ key }) => Math.round(rowsFormations.reduce((s, f) => s + (parseFloat(f.couts[key]) || 0), 0))),
      Math.round(totF.coutTotal), Math.round(totF.subvention),
    ]);
    const wsF = XLSX.utils.aoa_to_sheet([hF, ...rowsF]);
    wsF['!cols'] = [{ wch: 42 }, { wch: 12 }, { wch: 10 }, ...Array(5).fill({ wch: 20 }), { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsF, 'Formations FI');

    // Onglet 2 – Services transversaux
    const hT = ['Service', 'Coût total (€)', 'Clé répartition (%)', 'Coût imputable FI (€)', `Subvention (${taux.transversal}%)`];
    const rowsT = [
      ...rowsTransversal.map(t => [t.nom, Math.round(t.coutTotal), t.cleRep, Math.round(t.coutImputable), Math.round(t.subvention)]),
      ['TOTAL', Math.round(totT.coutTotal), '', Math.round(totT.coutImputable), Math.round(totT.subvention)],
    ];
    const wsT = XLSX.utils.aoa_to_sheet([hT, ...rowsT]);
    wsT['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsT, 'Services transversaux');

    // Onglet 3 – Récapitulatif
    const hR = ['Activité / Service', 'Coût total (€)', 'Part éligible (%)', 'Coût éligible (€)', 'Taux subvention (%)', 'Subvention demandée (€)'];
    const recapRows = [
      hR,
      ['─── FORMATIONS INITIALES ───', '', '', '', '', ''],
      ...rowsFormations.map(r => [r.nom, Math.round(r.coutTotal), 100, Math.round(r.coutEligible), taux.fi, Math.round(r.subvention)]),
      ['Sous-total FI', Math.round(totF.coutTotal), 100, Math.round(totF.coutEligible), taux.fi, Math.round(totF.subvention)],
      ['', '', '', '', '', ''],
      ['─── SERVICES TRANSVERSAUX ───', '', '', '', '', ''],
      ...rowsTransversal.map(r => [r.nom, Math.round(r.coutTotal), r.cleRep, Math.round(r.coutImputable), taux.transversal, Math.round(r.subvention)]),
      ['Sous-total Transversal', Math.round(totT.coutTotal), '', Math.round(totT.coutImputable), taux.transversal, Math.round(totT.subvention)],
      ['', '', '', '', '', ''],
      ['─── RECHERCHE ───', '', '', '', '', ''],
      ['Activités de recherche', Math.round(rowRecherche.coutTotal), recherche.partElig, Math.round(rowRecherche.coutEligible), taux.recherche, Math.round(rowRecherche.subvention)],
      ['', '', '', '', '', ''],
      ['TOTAL GÉNÉRAL', Math.round(grand.coutTotal), '', Math.round(grand.coutEligible), '', Math.round(grand.subvention)],
      ['', '', '', '', '', ''],
      [`Taux couverture global : ${Math.round(grand.subvention / (grand.coutTotal || 1) * 100)}%`, '', '', '', '', ''],
      [`Reste à charge : ${Math.round(grand.coutTotal - grand.subvention)} €`, '', '', '', '', ''],
    ];
    const wsR = XLSX.utils.aoa_to_sheet(recapRows);
    wsR['!cols'] = [{ wch: 44 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsR, 'Récapitulatif');

    XLSX.writeFile(wb, `daf_subvention_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Enveloppe formation par filière (calculée, non saisie) ─────────────────
  const enveloppeFilieresCalc = useMemo(() => {
    if (!enveloppeFormation) return null;
    const filieres = enveloppeFormation.filieres?.length > 0
      ? enveloppeFormation.filieres : FILIERES_DEFAULT;

    const subv = services.reduce((s, svc) =>
      s + (calculerBudgetService?.(svc)?.subventionRegionAgents || 0), 0);
    const dir    = calculerBudgetDirection?.(direction)?.salaires || 0;
    const ps     = calculerBudgetPoleSupport?.(poleSupport)?.salaires || 0;
    const svcs   = services.reduce((s, svc) => s + (calculerBudgetService?.(svc)?.salaires || 0), 0);
    const dirExp = calculerBudgetDirection?.(direction)?.exploitation || 0;
    const psExp  = calculerBudgetPoleSupport?.(poleSupport)?.exploitation || 0;
    const svcsExp= services.reduce((s, svc) => s + (calculerBudgetService?.(svc)?.exploitation || 0), 0);

    return calculerEnveloppeParFiliere(
      filieres, subv, dir + ps + svcs, dirExp + psExp + svcsExp
    );
  }, [enveloppeFormation, services, direction, poleSupport,
      calculerBudgetService, calculerBudgetDirection, calculerBudgetPoleSupport]);

  // ── Helpers UI ─────────────────────────────────────────────────────────────
  const toggle  = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const toggleF = (id) => setOpenFormation(o => ({ ...o, [id]: !o[id] }));

  const dm = darkMode;
  const cl = {
    card:    dm ? 'bg-zinc-800 border-zinc-700'  : 'bg-white border-slate-200',
    th:      dm ? 'bg-zinc-700/80 text-zinc-300' : 'bg-slate-50 text-zinc-600',
    td:      dm ? 'text-zinc-200 border-zinc-700': 'text-zinc-700 border-slate-200',
    inp:     dm ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300 text-zinc-800',
    badge:   dm ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-50 text-teal-700 border border-teal-200',
    section: dm ? 'bg-zinc-800/50' : 'bg-slate-50',
    total:   dm ? 'bg-zinc-700/60 text-zinc-100' : 'bg-slate-100 text-zinc-800',
    accent:  dm ? 'text-teal-400'  : 'text-teal-600',
    muted:   dm ? 'text-zinc-400'  : 'text-zinc-500',
    title:   dm ? 'text-white'     : 'text-zinc-900',
  };

  const NumInput = ({ value, onChange, step = '1000', className = '' }) => (
    <input
      type="number" value={value || ''} step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full text-right rounded-lg border px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-400 outline-none ${cl.inp} ${className}`}
    />
  );

  const PctInput = ({ value, onChange }) => (
    <input
      type="number" value={value ?? ''} min="0" max="100" step="5"
      onChange={e => onChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
      className={`w-20 text-right rounded-lg border px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-400 outline-none ${cl.inp}`}
    />
  );

  const SectionHeader = ({ id, icon, title, subtitle }) => (
    <button
      onClick={() => toggle(id)}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all ${cl.card}`}
    >
      <div className={`p-2 rounded-xl ${dm ? 'bg-zinc-700' : 'bg-slate-100'}`}>{icon}</div>
      <div className="flex-1 text-left">
        <div className={`font-bold text-base ${cl.title}`}>{title}</div>
        {subtitle && <div className={`text-xs mt-0.5 ${cl.muted}`}>{subtitle}</div>}
      </div>
      {open[id] ? <ChevronUp size={18} className={cl.accent}/> : <ChevronDown size={18} className={cl.accent}/>}
    </button>
  );

  // ─── RENDU ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-10">

      {/* ── En-tête + KPIs ── */}
      <div className={`rounded-2xl border p-5 ${cl.card} shadow`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className={`text-xl font-extrabold ${cl.title}`}>
              Dossier DAF — Demande de Subvention Région
            </h2>
            <p className={`text-sm mt-0.5 ${cl.muted}`}>
              Formations Initiales · Services transversaux / Siège · Recherche
            </p>
            <div className={`flex items-start gap-2 mt-2 px-3 py-2 rounded-xl border text-xs max-w-xl ${
              dm ? 'bg-amber-900/30 border-amber-700/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                <strong>Périmètre spécifique :</strong> Ce dossier calcule la <strong>subvention demandable à la Région</strong> sur la base des charges éligibles (FI, transversal, recherche). Son résultat diffère du budget opérationnel de l'onglet <em>Analyse</em>, qui couvre l'ensemble des charges de fonctionnement de l'association.
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleBudgetLink}
              title="Lier les données de Siège/Pôle Ressource aux données budgétaires saisies dans l'application"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                useBudgetLink
                  ? 'bg-teal-500 text-white border-teal-600 shadow'
                  : dm ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-white text-zinc-600 border-slate-300'
              }`}
            >
              {useBudgetLink ? <Link size={14}/> : <Link2Off size={14}/>}
              {useBudgetLink ? 'Lié au budget' : 'Lier au budget'}
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow transition-all"
            >
              <FileSpreadsheet size={15}/> Exporter Excel
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Coût total',           value: grand.coutTotal,    dark: 'bg-blue-900/20 border-blue-800/30 text-kpi-title-blue-dark',   light: 'bg-blue-50 border-blue-200',   darkTxt: 'text-blue-400',  lightTxt: 'text-blue-600',  darkVal: 'text-blue-300',  lightVal: 'text-blue-700'  },
            { label: 'Coût éligible',         value: grand.coutEligible, dark: 'bg-amber-900/20 border-amber-800/30', light: 'bg-amber-50 border-amber-200', darkTxt: 'text-amber-400', lightTxt: 'text-amber-600', darkVal: 'text-amber-300', lightVal: 'text-amber-700' },
            { label: 'Subvention demandée',   value: grand.subvention,   dark: 'bg-green-900/20 border-green-800/30', light: 'bg-green-50 border-green-200', darkTxt: 'text-green-400', lightTxt: 'text-green-600', darkVal: 'text-green-300', lightVal: 'text-green-700' },
          ].map(({ label, value, dark, light, darkTxt, lightTxt, darkVal, lightVal }) => (
            <div key={label} className={`rounded-xl p-3 border ${dm ? dark : light}`}>
              <div className={`text-xs font-semibold ${dm ? darkTxt : lightTxt}`}>{label}</div>
              <div className={`text-lg font-extrabold mt-0.5 ${dm ? darkVal : lightVal}`}>{fmt(value)}</div>
            </div>
          ))}
        </div>
        {grand.coutTotal > 0 && (
          <div className={`mt-3 flex flex-wrap gap-4 text-xs ${cl.muted}`}>
            <span>Taux de couverture global :
              <strong className={cl.accent}> {Math.round(grand.subvention / grand.coutTotal * 100)}%</strong>
            </span>
            <span>Reste à charge :
              <strong className={dm ? ' text-red-400' : ' text-red-600'}> {fmt(grand.coutTotal - grand.subvention)}</strong>
            </span>
            <span>Taux d'éligibilité :
              <strong> {Math.round(grand.coutEligible / grand.coutTotal * 100)}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* ── Taux de financement ── */}
      <SectionHeader
        id="taux"
        icon={<Percent size={16} className="text-purple-500"/>}
        title="Taux de financement régional"
        subtitle="Configurez les taux appliqués à chaque catégorie de coût"
      />
      {open.taux && (
        <div className={`rounded-2xl border p-5 ${cl.card} shadow`}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'fi',          label: 'Formations Initiales (FI)', icon: <GraduationCap size={14}/>, cardDm: 'border-teal-800/40 bg-teal-900/20',   cardLm: 'border-teal-200 bg-teal-50',   lblDm: 'text-teal-400',   lblLm: 'text-teal-600',   pctDm: 'text-teal-300',   pctLm: 'text-teal-700'   },
              { key: 'transversal', label: 'Services transversaux',     icon: <Building2 size={14}/>,     cardDm: 'border-blue-800/40 bg-blue-900/20',   cardLm: 'border-blue-200 bg-blue-50',   lblDm: 'text-blue-400',   lblLm: 'text-blue-600',   pctDm: 'text-blue-300',   pctLm: 'text-blue-700'   },
              { key: 'recherche',   label: 'Recherche',                 icon: <Search size={14}/>,        cardDm: 'border-purple-800/40 bg-purple-900/20', cardLm: 'border-purple-200 bg-purple-50', lblDm: 'text-purple-400', lblLm: 'text-purple-600', pctDm: 'text-purple-300', pctLm: 'text-purple-700' },
            ].map(({ key, label, icon, cardDm, cardLm, lblDm, lblLm, pctDm, pctLm }) => (
              <div key={key} className={`rounded-xl p-4 border ${dm ? cardDm : cardLm}`}>
                <div className={`flex items-center gap-1.5 text-xs font-semibold mb-3 ${dm ? lblDm : lblLm}`}>
                  {icon} {label}
                </div>
                <div className="flex items-center gap-2">
                  <PctInput value={taux[key]} onChange={v => setTauxP({ [key]: v })}/>
                  <span className={`text-sm font-bold ${dm ? pctDm : pctLm}`}>%</span>
                </div>
              </div>
            ))}
          </div>
          {/* Taux modulables FI par type de charge */}
          <div className={`mt-4 rounded-xl border p-4 ${dm ? 'border-zinc-700 bg-zinc-800/60' : 'border-slate-200 bg-slate-50'}`}>
            <label className={`flex items-center gap-2 text-sm font-bold cursor-pointer mb-3 ${dm ? 'text-white' : 'text-slate-700'}`}>
              <input type="checkbox" checked={!!taux.tauxModulable}
                onChange={e => setTauxP({ tauxModulable: e.target.checked })}
                className="rounded" />
              Taux FI différenciés par type de charge (salaires / exploitation / investissements)
            </label>
            {taux.tauxModulable && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'fiSalaires',     label: 'Salaires & charges', icon: <Users size={13}/>,
                    cardDm: 'border-teal-800/40 bg-teal-900/20', cardLm: 'border-teal-200 bg-teal-50',
                    lblDm: 'text-teal-400', lblLm: 'text-teal-600', pctDm: 'text-teal-300', pctLm: 'text-teal-700' },
                  { key: 'fiExploitation', label: 'Exploitation',       icon: <Building2 size={13}/>,
                    cardDm: 'border-blue-800/40 bg-blue-900/20', cardLm: 'border-blue-200 bg-blue-50',
                    lblDm: 'text-blue-400', lblLm: 'text-blue-600', pctDm: 'text-blue-300', pctLm: 'text-blue-700' },
                  { key: 'fiInvest',       label: 'Investissements',    icon: <Layers size={13}/>,
                    cardDm: 'border-purple-800/40 bg-purple-900/20', cardLm: 'border-purple-200 bg-purple-50',
                    lblDm: 'text-purple-400', lblLm: 'text-purple-600', pctDm: 'text-purple-300', pctLm: 'text-purple-700' },
                ].map(({ key, label, icon, cardDm, cardLm, lblDm, lblLm, pctDm, pctLm }) => (
                  <div key={key} className={`rounded-lg p-3 border ${dm ? cardDm : cardLm}`}>
                    <div className={`flex items-center gap-1 text-xs font-semibold mb-2 ${dm ? lblDm : lblLm}`}>
                      {icon} {label}
                    </div>
                    <div className="flex items-center gap-1">
                      <PctInput value={taux[key] ?? 70} onChange={v => setTauxP({ [key]: v })}/>
                      <span className={`text-xs font-bold ${dm ? pctDm : pctLm}`}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Formations FI ── */}
      <SectionHeader
        id="formations"
        icon={<GraduationCap size={16} className="text-teal-500"/>}
        title="Formations Initiales (FI)"
        subtitle={`${rowsFormations.length} formations · Total : ${fmt(totF.coutTotal)} · Subvention (${taux.fi}%) : ${fmt(totF.subvention)}`}
      />
      {open.formations && (
        <div className="space-y-3">
          {rowsFormations.map(f => (
            <div key={f.id} className={`rounded-2xl border ${cl.card} shadow overflow-hidden`}>
              {/* Ligne résumé / accordéon */}
              <button
                onClick={() => toggleF(f.id)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${cl.section}`}
              >
                <GraduationCap size={17} className={cl.accent}/>
                <div className="flex-1">
                  <span className={`font-bold ${cl.title}`}>{f.nom}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${cl.badge}`}>{f.duree} an{f.duree > 1 ? 's' : ''}</span>
                  {f.effectif > 0 && (
                    <span className={`ml-2 text-xs ${cl.muted}`}>{f.effectif} stagiaires</span>
                  )}
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <span className={cl.muted}>Coût : <strong className={cl.title}>{fmt(f.coutTotal)}</strong></span>
                  <span className="font-bold text-green-600">Subv. : {fmt(f.subvention)}</span>
                  {openFormation[f.id] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
              </button>

              {/* Détail des coûts */}
              {openFormation[f.id] && (
                <div className="p-4 space-y-4">
                  {/* Lien au service budgétaire (si budget link actif) */}
                  {useBudgetLink && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${dm ? 'bg-teal-900/20 border-teal-700/40' : 'bg-teal-50 border-teal-200'}`}>
                      <Link size={14} className="text-teal-500 flex-shrink-0"/>
                      <label className={`text-xs font-semibold flex-shrink-0 ${dm ? 'text-teal-300' : 'text-teal-700'}`}>Service lié :</label>
                      <select
                        value={serviceLinks[f.id] || ''}
                        onChange={e => setServiceLink(f.id, e.target.value)}
                        className={`flex-1 rounded-lg border px-2 py-1 text-xs focus:ring-2 focus:ring-teal-400 outline-none ${cl.inp}`}
                      >
                        <option value="">— Aucun lien (saisie manuelle) —</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.nom}</option>
                        ))}
                      </select>
                      {serviceLinks[f.id] && (
                        <span
                          title="Données synchronisées depuis le service lié : effectif (net d'abandons), coût personnel (salaires + charges + Ségur) et charges d'exploitation (loyers, fournitures, etc.)"
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-help ${dm ? 'bg-teal-800 text-teal-200' : 'bg-teal-100 text-teal-700'}`}
                        >
                          Effectif, personnel &amp; exploitation auto
                        </span>
                      )}
                    </div>
                  )}

                  {/* Paramètres formation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Effectif stagiaires</label>
                      <NumInput step="1" value={f.effectif} onChange={v => updateFormation(f.id, x => ({ ...x, effectif: v }))}/>
                      {useBudgetLink && serviceLinks[f.id] && (
                        <span className={`text-[10px] mt-1 block ${dm ? 'text-teal-400' : 'text-teal-600'}`}>⟵ calculé depuis les promos du service</span>
                      )}
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Durée (ans)</label>
                      <NumInput step="1" value={f.duree} onChange={v => updateFormation(f.id, x => ({ ...x, duree: v }))}/>
                    </div>
                  </div>

                  {/* Tableau des coûts */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cl.th}>
                        <th className="text-left p-2 rounded-tl-lg font-semibold">Poste de coût</th>
                        <th className="text-right p-2 font-semibold">Montant annuel (€)</th>
                        <th className="text-right p-2 rounded-tr-lg font-semibold">% du total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAF_COST_LINES.map(({ key, label }) => {
                        const val  = parseFloat(f.couts[key]) || 0;
                        const part = f.coutTotal > 0 ? Math.round(val / f.coutTotal * 100) : 0;
                        const autoPersonnel = key === 'personnel' && useBudgetLink && serviceLinks[f.id];
                        return (
                          <tr key={key} className={`border-b ${cl.td}`}>
                            <td className="p-2">
                              {label}
                              {autoPersonnel && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${dm ? 'bg-teal-800 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>auto</span>
                              )}
                            </td>
                            <td className="p-2 w-44">
                              {autoPersonnel ? (
                                <span className={`block text-right font-semibold text-sm px-2 py-1.5 rounded-lg ${dm ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>
                                  {fmt(parseFloat(f.couts[key]) || 0)}
                                </span>
                              ) : (
                                <NumInput
                                  value={f.couts[key]}
                                  onChange={v => updateFormation(f.id, x => ({ ...x, couts: { ...x.couts, [key]: v } }))}
                                />
                              )}
                            </td>
                            <td className={`p-2 text-right text-xs font-medium ${cl.muted}`}>
                              {part > 0 ? `${part}%` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                      {f.exploitationBudget > 0 && (
                        <tr className={`border-b ${cl.td}`}>
                          <td className="p-2">
                            Exploitation (budget)
                            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${dm ? 'bg-teal-800 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>auto</span>
                          </td>
                          <td className="p-2 w-44">
                            <span className={`block text-right font-semibold text-sm px-2 py-1.5 rounded-lg ${dm ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>
                              {fmt(f.exploitationBudget)}
                            </span>
                          </td>
                          <td className={`p-2 text-right text-xs font-medium ${cl.muted}`}>
                            {f.coutTotal > 0 ? `${Math.round(f.exploitationBudget / f.coutTotal * 100)}%` : '—'}
                          </td>
                        </tr>
                      )}
                      <tr className={`font-bold ${cl.total}`}>
                        <td className="p-2 rounded-bl-lg">Total</td>
                        <td className="p-2 text-right">{fmt(f.coutTotal)}</td>
                        <td className="p-2 text-right text-green-600 rounded-br-lg">Subv. {fmt(f.subvention)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Indicateurs par stagiaire + référentiel */}
                  <div className={`text-xs p-3 rounded-xl space-y-1 ${dm ? 'bg-zinc-700/50 text-zinc-400' : 'bg-slate-50 text-zinc-500 border border-slate-200'}`}>
                    {f.effectif > 0 && f.coutTotal > 0 && (
                      <div>
                        <span>Coût annuel / stagiaire : <strong>{fmt(f.coutTotal / f.effectif)}</strong></span>
                        {f.duree > 1 && (
                          <span className="ml-4">Coût total du cursus ({f.duree} ans) : <strong>{fmt(f.coutTotal * f.duree)}</strong></span>
                        )}
                      </div>
                    )}
                    {f.heuresTotales > 0 && (
                      <div className={dm ? 'text-zinc-500' : 'text-slate-400'}>
                        Volume réglementaire : <strong>{f.heuresCours}h cours + {f.heuresPratique}h pratique = {f.heuresTotales}h</strong>
                        {f.referentiel && <span className="ml-2 italic">({f.referentiel})</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Sous-total formations */}
          <div className={`rounded-xl border p-3 ${dm ? 'bg-teal-900/20 border-teal-800/40' : 'bg-teal-50 border-teal-200'}`}>
            <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
              <span className={`font-bold ${dm ? 'text-teal-300' : 'text-teal-700'}`}>Sous-total Formations FI</span>
              <div className="flex gap-6">
                <span className={cl.muted}>Coût total : <strong className={cl.title}>{fmt(totF.coutTotal)}</strong></span>
                <span className="text-green-600 font-bold">Subvention ({taux.fi}%) : {fmt(totF.subvention)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Services transversaux ── */}
      <SectionHeader
        id="transversal"
        icon={<Building2 size={16} className="text-blue-500"/>}
        title="Services transversaux / Siège"
        subtitle={`${rowsTransversal.length} services · Imputable FI : ${fmt(totT.coutImputable)} · Subvention (${taux.transversal}%) : ${fmt(totT.subvention)}`}
      />
      {open.transversal && (
        <div className={`rounded-2xl border ${cl.card} shadow overflow-hidden`}>
          <div className={`p-3 flex items-center justify-between gap-3 flex-wrap ${cl.section}`}>
            <span className={`text-xs flex items-center gap-1.5 ${cl.muted}`}>
              <Info size={12}/>
              La clé de répartition = % du coût de ce service affecté à l'activité de Formation Initiale
            </span>
            <button
              onClick={addTransversal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
            >
              <Plus size={13}/> Ajouter un service
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cl.th}>
                  <th className="text-left p-3 font-semibold">Service / Poste</th>
                  <th className="text-right p-3 font-semibold">Coût total (€)</th>
                  <th className="text-center p-3 font-semibold">Clé répartition FI (%)</th>
                  <th className="text-right p-3 font-semibold">Coût imputable FI (€)</th>
                  <th className="text-right p-3 font-semibold">Subvention ({taux.transversal}%)</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rowsTransversal.map(t => (
                  <tr key={t.id} className={`border-b ${cl.td} ${t.fromBudget ? (dm ? 'bg-teal-900/10' : 'bg-teal-50/50') : ''}`}>
                    <td className="p-2">
                      {t.fromBudget ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Link size={12} className={cl.accent}/> {t.nom}
                        </span>
                      ) : (
                        <input
                          type="text" value={t.nom}
                          onChange={e => updateTransversal(t.id, x => ({ ...x, nom: e.target.value }))}
                          className={`w-full rounded-lg border px-2 py-1 text-sm ${cl.inp}`}
                        />
                      )}
                    </td>
                    <td className="p-2 w-36">
                      {t.fromBudget
                        ? <span className="block text-right font-medium">{fmt(t.coutTotal)}</span>
                        : <NumInput value={t.coutTotal} onChange={v => updateTransversal(t.id, x => ({ ...x, coutTotal: v }))}/>
                      }
                    </td>
                    <td className="p-2 text-center">
                      {t.fromBudget
                        ? <span className={`px-2 py-1 rounded text-xs font-bold ${dm ? 'bg-teal-800/40 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>{t.cleRep}%</span>
                        : <div className="flex justify-center"><PctInput value={t.cleRep} onChange={v => updateTransversal(t.id, x => ({ ...x, cleRep: v }))}/></div>
                      }
                    </td>
                    <td className="p-2 text-right font-medium">{fmt(t.coutImputable)}</td>
                    <td className="p-2 text-right font-bold text-green-600">{fmt(t.subvention)}</td>
                    <td className="p-2 text-center">
                      {!t.fromBudget && (
                        <button onClick={() => removeTransversal(t.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={15}/>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className={`font-bold ${cl.total}`}>
                  <td className="p-3 rounded-bl-xl">Sous-total transversal</td>
                  <td className="p-3 text-right">{fmt(totT.coutTotal)}</td>
                  <td className="p-3 text-center text-xs">—</td>
                  <td className="p-3 text-right">{fmt(totT.coutImputable)}</td>
                  <td className="p-3 text-right text-green-600">{fmt(totT.subvention)}</td>
                  <td className="p-3 rounded-br-xl"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Recherche ── */}
      <SectionHeader
        id="recherche"
        icon={<Search size={16} className="text-purple-500"/>}
        title="Activités de Recherche"
        subtitle={`Coût éligible : ${fmt(rowRecherche.coutEligible)} · Subvention (${taux.recherche}%) : ${fmt(rowRecherche.subvention)}`}
      />
      {open.recherche && (
        <div className={`rounded-2xl border ${cl.card} shadow p-5`}>
          {rowRecherche.isLinked ? (
            /* ── Mode lié : données calculées depuis les services Recherche ── */
            <div className="space-y-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${dm ? 'bg-purple-900/30 text-purple-300 border border-purple-800/30' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                <Link size={13}/> Lié au{rowRecherche.servicesRecherche.length > 1 ? 'x' : ''} service{rowRecherche.servicesRecherche.length > 1 ? 's' : ''} Recherche : {rowRecherche.servicesRecherche.map(s => s.nom).join(', ')}
              </div>
              {rowRecherche.servicesRecherche.map(s => {
                const b = calculerBudgetService(s);
                return (
                  <div key={s.id} className={`rounded-xl p-3 text-sm ${dm ? 'bg-zinc-700' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${dm ? 'text-white' : 'text-slate-700'}`}>{s.nom}</span>
                      <span className={`font-black ${dm ? 'text-purple-300' : 'text-purple-700'}`}>{fmt(b?.total || 0)}</span>
                    </div>
                    <div className={`text-xs mt-1 ${cl.muted}`}>
                      Salaires : {fmt(b?.salaires || 0)} · Exploitation : {fmt(b?.exploitation || 0)}
                    </div>
                  </div>
                );
              })}
              <div className="grid grid-cols-2 gap-4 items-end mt-2">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Part éligible à la subvention (%)</label>
                  <div className="flex items-center gap-2">
                    <PctInput value={recherche.partElig} onChange={v => setRechercheP({ partElig: v })}/>
                    <span className={`text-sm ${cl.muted}`}>→ {fmt(rowRecherche.coutEligible)}</span>
                  </div>
                </div>
                <div className={`rounded-xl p-3 ${dm ? 'bg-purple-900/20 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'}`}>
                  <div className={`text-xs font-semibold mb-1 ${dm ? 'text-purple-400' : 'text-purple-600'}`}>Subvention recherche ({taux.recherche}%)</div>
                  <div className={`text-xl font-extrabold ${dm ? 'text-purple-300' : 'text-purple-700'}`}>{fmt(rowRecherche.subvention)}</div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Mode manuel legacy (aucun service Recherche) ── */
            <div className="space-y-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${dm ? 'bg-zinc-700 text-zinc-400' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                <Info size={13}/>
                Créez un service de type « Recherche » dans l'onglet Budget pour lier automatiquement ses coûts.
              </div>
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Coût total de la recherche (€)</label>
                  <NumInput value={recherche.coutTotal} onChange={v => setRechercheP({ coutTotal: v })}/>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Part éligible à la subvention (%)</label>
                  <div className="flex items-center gap-2">
                    <PctInput value={recherche.partElig} onChange={v => setRechercheP({ partElig: v })}/>
                    <span className={`text-sm ${cl.muted}`}>→ {fmt(rowRecherche.coutEligible)}</span>
                  </div>
                </div>
                <div className={`rounded-xl p-3 ${dm ? 'bg-purple-900/20 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'}`}>
                  <div className={`text-xs font-semibold mb-1 ${dm ? 'text-purple-400' : 'text-purple-600'}`}>Subvention recherche ({taux.recherche}%)</div>
                  <div className={`text-xl font-extrabold ${dm ? 'text-purple-300' : 'text-purple-700'}`}>{fmt(rowRecherche.subvention)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Récapitulatif ── */}
      <SectionHeader
        id="recap"
        icon={<Calculator size={16} className="text-green-500"/>}
        title="Récapitulatif — Demande de subvention"
        subtitle={`Subvention totale demandée : ${fmt(grand.subvention)} sur ${fmt(grand.coutTotal)} de coûts`}
      />
      {open.recap && (
        <div className={`rounded-2xl border ${cl.card} shadow overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cl.th}>
                  <th className="text-left p-3 font-semibold">Activité / Service</th>
                  <th className="text-right p-3 font-semibold">Coût total (€)</th>
                  <th className="text-center p-3 font-semibold">Part éligible (%)</th>
                  <th className="text-right p-3 font-semibold">Coût éligible (€)</th>
                  <th className="text-center p-3 font-semibold">Taux Région</th>
                  <th className="text-right p-3 font-semibold">Subvention (€)</th>
                </tr>
              </thead>
              <tbody>
                {/* Formations */}
                <tr className={`border-b ${cl.td} ${cl.section}`}>
                  <td colSpan={6} className={`p-2 pl-3 text-xs font-bold uppercase tracking-wide ${dm ? 'text-teal-400' : 'text-teal-600'}`}>
                    Formations Initiales
                  </td>
                </tr>
                {rowsFormations.map(r => (
                  <tr key={r.id} className={`border-b ${cl.td}`}>
                    <td className="p-2 pl-6">{r.nom}</td>
                    <td className="p-2 text-right">{fmt(r.coutTotal)}</td>
                    <td className="p-2 text-center">100%</td>
                    <td className="p-2 text-right">{fmt(r.coutEligible)}</td>
                    <td className="p-2 text-center">{taux.fi}%</td>
                    <td className="p-2 text-right font-semibold text-green-600">{fmt(r.subvention)}</td>
                  </tr>
                ))}
                <tr className={`border-b font-bold ${dm ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>
                  <td className="p-2 pl-4">Sous-total FI</td>
                  <td className="p-2 text-right">{fmt(totF.coutTotal)}</td>
                  <td className="p-2 text-center">100%</td>
                  <td className="p-2 text-right">{fmt(totF.coutEligible)}</td>
                  <td className="p-2 text-center">{taux.fi}%</td>
                  <td className="p-2 text-right">{fmt(totF.subvention)}</td>
                </tr>

                {/* Transversal */}
                <tr className={`border-b ${cl.td} ${cl.section}`}>
                  <td colSpan={6} className={`p-2 pl-3 text-xs font-bold uppercase tracking-wide ${dm ? 'text-blue-400' : 'text-blue-600'}`}>
                    Services transversaux / Siège
                  </td>
                </tr>
                {rowsTransversal.map(r => (
                  <tr key={r.id} className={`border-b ${cl.td}`}>
                    <td className="p-2 pl-6">{r.nom}</td>
                    <td className="p-2 text-right">{fmt(r.coutTotal)}</td>
                    <td className="p-2 text-center">{r.cleRep}%</td>
                    <td className="p-2 text-right">{fmt(r.coutImputable)}</td>
                    <td className="p-2 text-center">{taux.transversal}%</td>
                    <td className="p-2 text-right font-semibold text-green-600">{fmt(r.subvention)}</td>
                  </tr>
                ))}
                <tr className={`border-b font-bold ${dm ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                  <td className="p-2 pl-4">Sous-total Transversal</td>
                  <td className="p-2 text-right">{fmt(totT.coutTotal)}</td>
                  <td className="p-2 text-center">—</td>
                  <td className="p-2 text-right">{fmt(totT.coutImputable)}</td>
                  <td className="p-2 text-center">{taux.transversal}%</td>
                  <td className="p-2 text-right">{fmt(totT.subvention)}</td>
                </tr>

                {/* Recherche */}
                <tr className={`border-b ${cl.td} ${cl.section}`}>
                  <td colSpan={6} className={`p-2 pl-3 text-xs font-bold uppercase tracking-wide ${dm ? 'text-purple-400' : 'text-purple-600'}`}>
                    Recherche
                  </td>
                </tr>
                <tr className={`border-b ${cl.td}`}>
                  <td className="p-2 pl-6">Activités de recherche</td>
                  <td className="p-2 text-right">{fmt(rowRecherche.coutTotal)}</td>
                  <td className="p-2 text-center">{recherche.partElig}%</td>
                  <td className="p-2 text-right">{fmt(rowRecherche.coutEligible)}</td>
                  <td className="p-2 text-center">{taux.recherche}%</td>
                  <td className="p-2 text-right font-semibold text-green-600">{fmt(rowRecherche.subvention)}</td>
                </tr>

                {/* Total général */}
                <tr className={`font-extrabold text-base ${dm ? 'bg-zinc-700 text-white' : 'bg-slate-100 text-zinc-900'}`}>
                  <td className="p-4">TOTAL GÉNÉRAL</td>
                  <td className="p-4 text-right">{fmt(grand.coutTotal)}</td>
                  <td className="p-4 text-center">—</td>
                  <td className="p-4 text-right">{fmt(grand.coutEligible)}</td>
                  <td className="p-4 text-center">—</td>
                  <td className="p-4 text-right text-green-600">{fmt(grand.subvention)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Indicateurs globaux */}
          {grand.coutTotal > 0 && (
            <div className={`p-4 border-t flex flex-wrap gap-5 text-sm ${dm ? 'border-zinc-700 bg-zinc-800/60' : 'border-slate-100 bg-slate-50'}`}>
              <div className={`flex items-center gap-2 ${cl.muted}`}>
                <Target size={14} className={cl.accent}/>
                Taux de couverture :
                <strong className={cl.accent}>{Math.round(grand.subvention / grand.coutTotal * 100)}%</strong>
              </div>
              <div className={`flex items-center gap-2 ${cl.muted}`}>
                Reste à charge :
                <strong className={dm ? 'text-red-400' : 'text-red-600'}>{fmt(grand.coutTotal - grand.subvention)}</strong>
              </div>
              <div className={`flex items-center gap-2 ${cl.muted}`}>
                Taux d'éligibilité :
                <strong>{Math.round(grand.coutEligible / grand.coutTotal * 100)}%</strong>
              </div>
            </div>
          )}
          {/* Enveloppe formation par filière — lien calculé (2.9) */}
          {enveloppeFilieresCalc && enveloppeFilieresCalc.enveloppeGlobale !== 0 && (
            <div className={`p-4 border-t ${dm ? 'border-zinc-700' : 'border-slate-200'}`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-3 ${cl.muted}`}>
                Enveloppe formation disponible par filière — calculée automatiquement
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {enveloppeFilieresCalc.lignes.map((l) => {
                  const positif = l.enveloppe >= 0;
                  return (
                    <div key={l.id} className={`p-3 rounded-xl border ${dm ? 'bg-zinc-700/60 border-zinc-600' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-xs font-bold mb-0.5 ${cl.muted}`}>{l.label}</p>
                      <p className={`text-sm font-black ${positif ? cl.accent : dm ? 'text-red-400' : 'text-red-600'}`}>
                        {fmt(l.enveloppe)}
                      </p>
                      <p className={`text-[10px] ${cl.muted}`}>{fmt(l.mensuel)}/mois · clé {l.cle}%</p>
                    </div>
                  );
                })}
              </div>
              <p className={`text-xs mt-2 ${cl.muted}`}>
                Enveloppe globale : <span className={`font-black ${enveloppeFilieresCalc.enveloppeGlobale >= 0 ? cl.accent : dm ? 'text-red-400' : 'text-red-600'}`}>
                  {fmt(enveloppeFilieresCalc.enveloppeGlobale)}
                </span> — Subvention Région − (Salaires + Exploitation)
              </p>
            </div>
          )}

          {/* Alerte écart > 10% entre dossier DAF et budget prévisionnel */}
          {useBudgetLink && totalBudgetApp > 0 && grand.coutTotal > 0 && (() => {
            const ecart = (grand.coutTotal - totalBudgetApp) / totalBudgetApp;
            if (Math.abs(ecart) <= 0.10) return null;
            const surEval = ecart > 0;
            return (
              <div className={`p-3 border-t flex items-start gap-2 text-sm ${dm ? 'border-amber-700/40 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0"/>
                <div>
                  <span className={`font-bold ${dm ? 'text-amber-300' : 'text-amber-700'}`}>
                    Écart de {Math.round(Math.abs(ecart) * 100)}% — {surEval ? 'Dossier DAF supérieur' : 'Dossier DAF inférieur'} au budget prévisionnel
                  </span>
                  <span className={`ml-2 ${dm ? 'text-amber-400/80' : 'text-amber-600'}`}>
                    Dossier : {fmt(grand.coutTotal)} vs Budget app : {fmt(totalBudgetApp)}
                    {surEval ? ' — Risque de sur-financement apparent.' : ' — Vérifier les coûts non imputés.'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
