/**
 * VentilationBP.jsx — Ventilation du Budget Prévisionnel par service
 * Accepte tout fichier Excel BP (format libre).
 * Étapes : import → sélection feuille/colonnes → attribution par service → ventilation
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, RefreshCw, ChevronDown, ChevronUp,
  Layers, BarChart3, X, Check, AlertTriangle, Filter,
  Download, Search, Building2, GraduationCap, Settings2,
  TrendingUp, TrendingDown, Minus, Eye, EyeOff, Tag,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n || 0);

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// ─── Détection des colonnes mois ─────────────────────────────────────────────

const MONTH_PATTERNS = [
  ['jan', 'janv', 'janvier'],
  ['fev', 'fevr', 'février', 'fevrier', 'feb'],
  ['mar', 'mars'],
  ['avr', 'avril', 'apr'],
  ['mai', 'may'],
  ['juin', 'jun'],
  ['juil', 'jul', 'juillet'],
  ['aou', 'aout', 'août', 'aug'],
  ['sep', 'sept', 'septembre'],
  ['oct', 'octo', 'octobre'],
  ['nov', 'nove', 'novembre'],
  ['dec', 'déc', 'dece', 'decembre', 'décembre'],
];
const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function detectMonthCols(headers) {
  const cols = [];
  for (const patterns of MONTH_PATTERNS) {
    const idx = headers.findIndex(h => {
      const hn = norm(String(h || ''));
      return patterns.some(p => hn === p || hn.startsWith(p));
    });
    if (idx >= 0 && !cols.includes(idx)) cols.push(idx);
  }
  return cols; // longueur 0-12
}

// ─── Détection des sections BP ────────────────────────────────────────────────

const RECETTE_KW  = ['recette', 'produit', 'entree', 'facturation', 'subvention', 'adhesion', 'vente', 'ressource', 'revenu', 'encaissement'];
const PERSON_KW   = ['personnel', 'salaire', 'salariale', 'masse sal', 'charges de personnel', 'cotisation', 'mutuelle', 'prevoyance'];
const CHARGE_KW   = ['charge', 'depense', 'sortie', 'achat', 'frais', 'exploitation', 'fonctionnement'];
const TOTAL_KW    = ['total', 'sous-total', 'sous total', 'cumul', 'solde'];

function catFromSection(sectionLabel) {
  const n = norm(sectionLabel);
  if (RECETTE_KW.some(k => n.includes(k)))  return 'recette';
  if (PERSON_KW.some(k  => n.includes(k)))  return 'personnel';
  return 'charge';
}

function isSectionHeader(label, row, montantCols) {
  // Une ligne de section = libellé non vide ET toutes les colonnes de montant à 0
  const hasValue = montantCols.some(c => toNum(row[c]) !== 0);
  if (hasValue) return false;
  const n = norm(label);
  const allCaps = label.length > 2 && label === label.toUpperCase() && /[A-Z]/.test(label);
  const knownSection = [...RECETTE_KW, ...PERSON_KW, ...CHARGE_KW, ...TOTAL_KW].some(k => n.includes(k));
  return allCaps || knownSection;
}

function isTotalRow(label) {
  const n = norm(label);
  return TOTAL_KW.some(k => n === k || n.startsWith(k + ' ') || n.startsWith(k + 's '));
}

// ─── Catégorisation automatique par mots-clés ────────────────────────────────
function autoCategorie(label) {
  const n = norm(label);
  if (RECETTE_KW.some(k => n.includes(k))) return 'recette';
  if (PERSON_KW.some(k  => n.includes(k))) return 'personnel';
  return 'charge';
}

// Lecture valeur numérique
function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/\s/g, '').replace(',', '.');
  return parseFloat(s) || 0;
}

// Stockage localStorage
const LS_KEY = 'ventilation_bp';
function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
}
function save(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function VentilationBP({ darkMode, services = [], direction, poleSupport, setServices, setDirection, setPoleSupport }) {
  const fileRef = useRef();
  const wbRef   = useRef(null); // workbook conservé en mémoire entre les changements de feuille

  // Construire la liste des entités cibles
  const entities = useMemo(() => [
    { id: 'direction',   label: 'Direction / Siège',  icon: 'dir'     },
    { id: 'poleSupport', label: 'Pôle Ressources',        icon: 'ps'      },
    ...services.map(s => ({ id: `service-${s.id}`, label: s.nom, icon: 'svc' })),
    { id: 'ignore',      label: '— Ignorer —',         icon: 'ign'     },
  ], [services]);

  // ── State principal ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState(() => {
    const saved = load();
    return saved?.lignes?.length ? 'ventilation' : 'upload';
  });
  const [error, setError] = useState('');
  const [drag, setDrag]   = useState(false);

  // Données Excel brutes
  const [fileName,    setFileName]    = useState(() => load()?.fileName    || '');
  const [sheetNames,  setSheetNames]  = useState(() => load()?.sheetNames  || []);
  const [sheetName,   setSheetName]   = useState(() => load()?.sheetName   || '');
  const [rawRows,     setRawRows]     = useState(() => load()?.rawRows     || []);
  const [colHeaders,  setColHeaders]  = useState(() => load()?.colHeaders  || []);

  // Mapping colonnes
  const [colLabel,      setColLabel]    = useState(() => load()?.colLabel    ?? 0);
  const [amountMode,    setAmountMode]  = useState(() => load()?.amountMode  || 'single');
  const [colSingle,     setColSingle]   = useState(() => load()?.colSingle   ?? 1);
  const [colsMonthly,   setColsMonthly] = useState(() => load()?.colsMonthly || []);
  const [headerRow,     setHeaderRow]   = useState(() => load()?.headerRow   ?? 0); // index de la ligne d'entête

  // Lignes traitées
  const [lignes, setLignes] = useState(() => load()?.lignes || []);

  // UI
  const [viewMode,   setViewMode]   = useState('detail'); // 'detail' | 'ventilation'
  const [filterSvc,  setFilterSvc]  = useState('');
  const [filterCat,  setFilterCat]  = useState('');
  const [filterText, setFilterText] = useState('');
  const [showIgnored, setShowIgnored] = useState(false);
  const [openVentil, setOpenVentil] = useState({});

  // ── Persistance ────────────────────────────────────────────────────────────
  const persist = useCallback((patch) => {
    const current = load() || {};
    save({ ...current, ...patch });
  }, []);

  // ── Lecture Excel ──────────────────────────────────────────────────────────
  const loadSheet = useCallback((wb, sName) => {
    const ws = wb.Sheets[sName];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Chercher la ligne d'entête : priorité à une ligne qui contient des noms de mois
    let hRow = 0;
    for (let i = 0; i < Math.min(raw.length, 15); i++) {
      const rowNorm = raw[i].map(c => norm(String(c || '')));
      const monthCount = MONTH_PATTERNS.filter(mp => rowNorm.some(rn => mp.some(p => rn === p || rn.startsWith(p)))).length;
      if (monthCount >= 6) { hRow = i; break; }
    }
    // Fallback : première ligne avec ≥2 cellules non vides
    if (hRow === 0) {
      for (let i = 0; i < Math.min(raw.length, 10); i++) {
        if (raw[i].filter(c => c !== '').length >= 2) { hRow = i; break; }
      }
    }

    const headers = (raw[hRow] || []).map((c, i) => c ? String(c) : `Col.${i + 1}`);

    // Détecter colonnes mois par leurs noms
    const monthCols = detectMonthCols(headers);

    // Colonne total : cherche "total", "annuel", ou dernière colonne numérique
    const numCols = [];
    for (let c = 0; c < headers.length; c++) {
      let nums = 0;
      for (let r = hRow + 1; r < Math.min(raw.length, hRow + 20); r++) {
        if (typeof raw[r][c] === 'number' && raw[r][c] !== 0) nums++;
      }
      if (nums > 0) numCols.push(c);
    }
    const totalCol = headers.findIndex((h, i) => {
      const hn = norm(h);
      return (hn.includes('total') || hn.includes('annuel') || hn.includes('annee')) && !monthCols.includes(i);
    });
    const bestSingle = totalCol >= 0 ? totalCol : (numCols.filter(c => !monthCols.includes(c)).at(-1) ?? numCols.at(-1) ?? 1);

    return { raw, hRow, headers, numCols, monthCols, bestSingle };
  }, []);

  const handleFile = useCallback((file) => {
    setError('');
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|ods)$/i)) {
      setError('Format non supporté. Utilisez .xlsx, .xls ou .ods');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        wbRef.current = wb; // conserver pour les changements de feuille
        const names = wb.SheetNames;
        const firstSheet = names[0];
        const { raw, hRow, headers, numCols, monthCols, bestSingle } = loadSheet(wb, firstSheet);
        const newAmountMode = monthCols.length >= 6 ? 'monthly' : 'single';

        setFileName(file.name);
        setSheetNames(names);
        setSheetName(firstSheet);
        setRawRows(raw);
        setColHeaders(headers);
        setHeaderRow(hRow);
        setColLabel(0);
        setColSingle(bestSingle);
        setColsMonthly(monthCols);
        setAmountMode(newAmountMode);
        setPhase('mapping');
        persist({ fileName: file.name, sheetNames: names, sheetName: firstSheet, rawRows: raw, colHeaders: headers, headerRow: hRow, colLabel: 0, colSingle: bestSingle, colsMonthly: monthCols, amountMode: newAmountMode });
      } catch (err) {
        setError('Erreur de lecture : ' + err.message);
      }
    };
    reader.onerror = () => setError('Impossible de lire le fichier.');
    reader.readAsArrayBuffer(file);
  }, [loadSheet, persist]);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Changer de feuille ─────────────────────────────────────────────────────
  const changeSheet = useCallback((newSheet) => {
    if (!wbRef.current) {
      // Workbook perdu (ex : rechargement de page) — on signale à l'utilisateur
      setError("Le fichier n'est plus en mémoire après un rechargement de page. Veuillez re-déposer le fichier Excel.");
      return;
    }
    const { raw, hRow, headers, numCols, monthCols, bestSingle } = loadSheet(wbRef.current, newSheet);
    const newAmountMode = monthCols.length >= 6 ? 'monthly' : 'single';

    setSheetName(newSheet);
    setRawRows(raw);
    setColHeaders(headers);
    setHeaderRow(hRow);
    setColLabel(0);
    setColSingle(bestSingle);
    setColsMonthly(monthCols);
    setAmountMode(newAmountMode);
    setLignes([]); // on efface les lignes précédentes (elles appartiennent à l'ancienne feuille)
    setPhase('mapping');
    persist({ sheetName: newSheet, rawRows: raw, colHeaders: headers, headerRow: hRow, colLabel: 0, colSingle: bestSingle, colsMonthly: monthCols, amountMode: newAmountMode, lignes: [] });
  }, [loadSheet, persist]);

  // ── Construction des lignes à partir du mapping (BP-aware) ────────────────
  const buildLignes = useCallback(() => {
    const montantCols = amountMode === 'monthly' ? colsMonthly : [colSingle];
    const dataRows    = rawRows.slice(headerRow + 1);

    let currentSection = '';
    let currentCat     = 'charge'; // catégorie héritée de la section courante
    const built = [];

    dataRows.forEach((row, idx) => {
      const label = String(row[colLabel] || '').trim();
      if (!label) return;

      // Lignes de totaux/sous-totaux → ignorer
      if (isTotalRow(label)) return;

      // Ligne de section (pas de valeurs numériques) → mettre à jour le contexte
      if (isSectionHeader(label, row, montantCols)) {
        currentSection = label;
        currentCat     = catFromSection(label);
        return;
      }

      // Calculer le montant
      const montant = montantCols.reduce((s, c) => s + toNum(row[c]), 0);
      if (montant === 0) return; // ligne vide, on saute

      // Conserver l'assignation manuelle existante si elle existe
      const existing = lignes.find(l => l.idx === idx);
      built.push({
        idx,
        label,
        montant,
        section:   currentSection,
        categorie: existing?.categorie ?? currentCat,
        serviceId: existing?.serviceId ?? 'direction',
        note:      existing?.note      ?? '',
      });
    });

    setLignes(built);
    setPhase('ventilation');
    persist({ lignes: built });
  }, [rawRows, headerRow, colLabel, amountMode, colSingle, colsMonthly, lignes, persist]);

  // ── Mise à jour d'une ligne ────────────────────────────────────────────────
  const updateLigne = useCallback((idx, patch) => {
    setLignes(prev => {
      const n = prev.map(l => l.idx === idx ? { ...l, ...patch } : l);
      persist({ lignes: n });
      return n;
    });
  }, [persist]);

  // ── Import vers onglet Budget ─────────────────────────────────────────────
  const [importResult, setImportResult] = useState(null);

  const importVersBudget = useCallback(() => {
    if (!setServices || !setDirection || !setPoleSupport) return;

    const activeLignes = lignes.filter(l => l.serviceId !== 'ignore' && l.categorie !== 'ignore');
    let added = 0, skipped = 0;

    // Copie des entités pour modification
    const newDir = { ...direction, chargesSiege: [...(direction?.chargesSiege || [])], recettes: [...(direction?.recettes || [])] };
    const newPS  = { ...poleSupport, exploitation: [...(poleSupport?.exploitation || [])], recettes: [...(poleSupport?.recettes || [])] };
    const newSvcs = services.map(s => ({
      ...s,
      exploitation: [...(s.exploitation || [])],
      recettes:     [...(s.recettes     || [])],
    }));

    const normalize = (s) => String(s || '').toLowerCase().trim().slice(0, 12);

    activeLignes.forEach(l => {
      const isRecette = l.categorie === 'recette';
      const newItem   = { id: Date.now() + Math.random() * 1e6 | 0, nom: l.label, montant: Math.round(Math.abs(l.montant) / 12) };

      const addTo = (arr) => {
        const exists = arr.some(e => normalize(e.nom) === normalize(l.label));
        if (exists) { skipped++; return; }
        arr.push(newItem);
        added++;
      };

      if (l.serviceId === 'direction') {
        addTo(isRecette ? newDir.recettes : newDir.chargesSiege);
      } else if (l.serviceId === 'poleSupport') {
        addTo(isRecette ? newPS.recettes : newPS.exploitation);
      } else if (l.serviceId.startsWith('service-')) {
        const id  = parseInt(l.serviceId.replace('service-', ''));
        const idx = newSvcs.findIndex(s => s.id === id);
        if (idx >= 0) addTo(isRecette ? newSvcs[idx].recettes : newSvcs[idx].exploitation);
      }
    });

    setDirection(newDir);
    setPoleSupport(newPS);
    setServices(newSvcs);
    setImportResult({ added, skipped });
  }, [lignes, services, direction, poleSupport, setServices, setDirection, setPoleSupport]);

  // ── Calculs ventilation ────────────────────────────────────────────────────
  const ventilation = useMemo(() => {
    const byService = {};
    entities.filter(e => e.id !== 'ignore').forEach(e => {
      byService[e.id] = { label: e.label, recettes: 0, personnel: 0, charges: 0, lignes: [] };
    });
    lignes.filter(l => l.categorie !== 'ignore' && l.serviceId !== 'ignore').forEach(l => {
      const svc = byService[l.serviceId];
      if (!svc) return;
      if (l.categorie === 'recette')   svc.recettes  += l.montant;
      else if (l.categorie === 'personnel') svc.personnel += l.montant;
      else                             svc.charges   += l.montant;
      svc.lignes.push(l);
    });
    Object.values(byService).forEach(svc => {
      svc.totalCharges = svc.personnel + svc.charges;
      svc.solde = svc.recettes - svc.totalCharges;
    });
    return byService;
  }, [lignes, entities]);

  const totaux = useMemo(() => {
    const recettes  = lignes.filter(l => l.categorie === 'recette'   && l.serviceId !== 'ignore').reduce((s, l) => s + l.montant, 0);
    const personnel = lignes.filter(l => l.categorie === 'personnel' && l.serviceId !== 'ignore').reduce((s, l) => s + l.montant, 0);
    const charges   = lignes.filter(l => l.categorie === 'charge'    && l.serviceId !== 'ignore').reduce((s, l) => s + l.montant, 0);
    const ignored   = lignes.filter(l => l.serviceId === 'ignore' || l.categorie === 'ignore').length;
    return { recettes, personnel, charges, totalCharges: personnel + charges, solde: recettes - personnel - charges, ignored };
  }, [lignes]);

  // ── Export Excel ───────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Onglet Détail
    const hD = ['Service', 'Catégorie', 'Libellé', 'Montant (€)', 'Note'];
    const rowsD = lignes
      .filter(l => l.serviceId !== 'ignore' && l.categorie !== 'ignore')
      .map(l => {
        const svc = entities.find(e => e.id === l.serviceId)?.label || l.serviceId;
        return [svc, l.categorie, l.label, Math.round(l.montant), l.note || ''];
      });
    const wsD = XLSX.utils.aoa_to_sheet([hD, ...rowsD]);
    wsD['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 50 }, { wch: 14 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsD, 'Détail lignes');

    // Onglet Ventilation
    const hV = ['Service', 'Recettes (€)', 'Personnel (€)', 'Autres charges (€)', 'Total charges (€)', 'Solde (€)'];
    const rowsV = Object.values(ventilation)
      .filter(v => v.lignes.length > 0)
      .map(v => [v.label, Math.round(v.recettes), Math.round(v.personnel), Math.round(v.charges), Math.round(v.totalCharges), Math.round(v.solde)]);
    rowsV.push(['TOTAL', Math.round(totaux.recettes), Math.round(totaux.personnel), Math.round(totaux.charges), Math.round(totaux.totalCharges), Math.round(totaux.solde)]);
    const wsV = XLSX.utils.aoa_to_sheet([hV, ...rowsV]);
    wsV['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsV, 'Ventilation par service');

    XLSX.writeFile(wb, `ventilation_bp_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    localStorage.removeItem(LS_KEY);
    setPhase('upload'); setFileName(''); setSheetNames([]); setSheetName('');
    setRawRows([]); setColHeaders([]); setLignes([]); setError('');
  };

  // ── Filtrage lignes ────────────────────────────────────────────────────────
  const lignesFiltrees = useMemo(() => {
    return lignes.filter(l => {
      if (!showIgnored && (l.serviceId === 'ignore' || l.categorie === 'ignore')) return false;
      if (filterSvc  && l.serviceId  !== filterSvc)  return false;
      if (filterCat  && l.categorie  !== filterCat)  return false;
      if (filterText && !norm(l.label).includes(norm(filterText))) return false;
      return true;
    });
  }, [lignes, showIgnored, filterSvc, filterCat, filterText]);

  // ── Classes de style ───────────────────────────────────────────────────────
  const dm = darkMode;
  const cl = {
    card:   dm ? 'bg-zinc-800 border-zinc-700'  : 'bg-white border-slate-200',
    th:     dm ? 'bg-zinc-700/80 text-zinc-300' : 'bg-slate-50 text-zinc-600',
    td:     dm ? 'text-zinc-200 border-zinc-700': 'text-zinc-700 border-slate-200',
    inp:    dm ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300 text-zinc-800',
    muted:  dm ? 'text-zinc-400' : 'text-zinc-500',
    title:  dm ? 'text-white'    : 'text-zinc-900',
    row:    dm ? 'hover:bg-zinc-700/40' : 'hover:bg-slate-50',
    badge:  dm ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-zinc-600',
  };

  const catColor = (cat) => {
    if (cat === 'recette')    return dm ? 'text-teal-400'   : 'text-teal-600';
    if (cat === 'personnel')  return dm ? 'text-blue-400'   : 'text-blue-600';
    if (cat === 'charge')     return dm ? 'text-orange-400' : 'text-orange-600';
    return dm ? 'text-zinc-500' : 'text-zinc-400';
  };
  const catLabel = { recette: 'Recette', personnel: 'Personnel', charge: 'Charge', ignore: 'Ignoré' };

  const SelectInp = ({ value, onChange, children, className = '' }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`rounded-lg border px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-400 outline-none ${cl.inp} ${className}`}
    >
      {children}
    </select>
  );

  // ─── RENDU ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-10">

      {/* ── En-tête ── */}
      <div className={`rounded-2xl border p-5 ${cl.card} shadow`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className={`text-xl font-extrabold ${cl.title}`}>
              Ventilation Budget Prévisionnel 2026
            </h2>
            <p className={`text-sm mt-0.5 ${cl.muted}`}>
              {fileName
                ? <>Fichier : <strong className={cl.title}>{fileName}</strong> · {lignes.length} lignes chargées</>
                : 'Importez votre fichier Excel BP pour ventiler les lignes par service'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {phase === 'ventilation' && (
              <>
                <button
                  onClick={() => setViewMode(v => v === 'detail' ? 'ventilation' : 'detail')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    dm ? 'bg-zinc-700 text-zinc-300 border-zinc-600 hover:bg-zinc-600'
                       : 'bg-white text-zinc-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {viewMode === 'detail' ? <><BarChart3 size={14}/> Ventilation</> : <><Layers size={14}/> Détail</>}
                </button>
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow"
                >
                  <Download size={14}/> Export Excel
                </button>
                <button
                  onClick={importVersBudget}
                  title="Importer les lignes ventilées dans les recettes/charges de chaque service de l'onglet Budget"
                  className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow"
                >
                  <Building2 size={14}/> → Budget
                </button>
              </>
            )}
            {phase !== 'upload' && (
              <button
                onClick={reset}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  dm ? 'bg-zinc-700 text-zinc-300 border-zinc-600 hover:bg-red-900/40 hover:text-red-300'
                     : 'bg-white text-zinc-500 border-slate-300 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <RefreshCw size={14}/> Nouveau fichier
              </button>
            )}
          </div>
        </div>

        {/* KPIs si ventilation prête */}
        {phase === 'ventilation' && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label: 'Recettes',       value: totaux.recettes,  darkBox: 'bg-teal-900/20 border-teal-800/30',   lightBox: 'bg-teal-50 border-teal-200',   darkTxt: 'text-teal-400',   lightTxt: 'text-teal-600',   darkVal: 'text-teal-300',   lightVal: 'text-teal-700',   icon: <TrendingUp size={14}/> },
              { label: 'Personnel',      value: totaux.personnel, darkBox: 'bg-blue-900/20 border-blue-800/30',   lightBox: 'bg-blue-50 border-blue-200',   darkTxt: 'text-blue-400',   lightTxt: 'text-blue-600',   darkVal: 'text-blue-300',   lightVal: 'text-blue-700',   icon: <Building2 size={14}/> },
              { label: 'Autres charges', value: totaux.charges,   darkBox: 'bg-orange-900/20 border-orange-800/30', lightBox: 'bg-orange-50 border-orange-200', darkTxt: 'text-orange-400', lightTxt: 'text-orange-600', darkVal: 'text-orange-300', lightVal: 'text-orange-700', icon: <TrendingDown size={14}/> },
              totaux.solde >= 0
                ? { label: 'Solde', value: totaux.solde, darkBox: 'bg-green-900/20 border-green-800/30', lightBox: 'bg-green-50 border-green-200', darkTxt: 'text-green-400', lightTxt: 'text-green-600', darkVal: 'text-green-300', lightVal: 'text-green-700', icon: <Minus size={14}/> }
                : { label: 'Solde', value: totaux.solde, darkBox: 'bg-red-900/20 border-red-800/30',   lightBox: 'bg-red-50 border-red-200',     darkTxt: 'text-red-400',   lightTxt: 'text-red-600',   darkVal: 'text-red-300',   lightVal: 'text-red-700',   icon: <Minus size={14}/> },
            ].map(({ label, value, darkBox, lightBox, darkTxt, lightTxt, darkVal, lightVal, icon }) => (
              <div key={label} className={`rounded-xl p-3 border ${dm ? darkBox : lightBox}`}>
                <div className={`text-xs font-semibold flex items-center gap-1 ${dm ? darkTxt : lightTxt}`}>
                  {icon} {label}
                </div>
                <div className={`text-lg font-extrabold mt-0.5 ${dm ? darkVal : lightVal}`}>
                  {fmt(value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Résultat import vers budget ── */}
      {importResult && (
        <div className={`p-3 rounded-xl flex items-center gap-3 text-sm ${dm ? 'bg-teal-900/30 text-teal-300 border border-teal-700' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
          <Check size={16} className="flex-shrink-0"/>
          <span>
            Import terminé : <strong>{importResult.added}</strong> ligne{importResult.added > 1 ? 's' : ''} ajoutée{importResult.added > 1 ? 's' : ''} dans l'onglet Budget
            {importResult.skipped > 0 && <>, <strong>{importResult.skipped}</strong> ignorée{importResult.skipped > 1 ? 's' : ''} (déjà présentes)</>}.
            Les montants sont convertis en valeur mensuelle (annuel ÷ 12).
          </span>
          <button onClick={() => setImportResult(null)} className="ml-auto flex-shrink-0"><X size={14}/></button>
        </div>
      )}

      {/* ── Erreur ── */}
      {error && (
        <div className={`p-3 rounded-xl flex items-start gap-2 text-sm ${dm ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5"/>
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14}/></button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PHASE 1 : Upload
      ══════════════════════════════════════════════════════════════════════════ */}
      {phase === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onClick={() => fileRef.current.click()}
          className={`rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-all ${
            drag
              ? dm ? 'border-teal-400 bg-teal-900/20' : 'border-teal-400 bg-teal-50'
              : dm ? 'border-zinc-600 hover:border-teal-500 hover:bg-zinc-700/30' : 'border-slate-300 hover:border-teal-400 hover:bg-teal-50/30'
          }`}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.ods" className="hidden" onChange={e => handleFile(e.target.files[0])}/>
          <FileSpreadsheet size={48} className={`mx-auto mb-4 ${dm ? 'text-zinc-500' : 'text-zinc-400'}`}/>
          <p className={`text-lg font-bold mb-2 ${cl.title}`}>
            Glisser-déposer le fichier Excel ici
          </p>
          <p className={`text-sm ${cl.muted}`}>ou cliquer pour parcourir · Formats acceptés : .xlsx · .xls · .ods</p>
          <p className={`text-xs mt-3 ${cl.muted}`}>
            Tout format de BP est accepté — vous choisirez la feuille et les colonnes à l'étape suivante
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PHASE 2 : Mapping colonnes
      ══════════════════════════════════════════════════════════════════════════ */}
      {phase === 'mapping' && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 ${cl.card} shadow`}>
            <h3 className={`font-bold text-base mb-4 ${cl.title}`}>
              <Settings2 size={16} className="inline mr-2"/>
              Configuration du mapping
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Feuille */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Feuille Excel</label>
                <SelectInp value={sheetName} onChange={changeSheet} className="w-full">
                  {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectInp>
                <p className={`text-xs mt-1 ${cl.muted}`}>
                  {sheetNames.length} feuille{sheetNames.length > 1 ? 's' : ''} détectée{sheetNames.length > 1 ? 's' : ''}
                  {sheetNames.length > 1 && ' · Sélectionnez une feuille pour recharger les données'}
                </p>
              </div>

              {/* Ligne d'entête */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Ligne d'en-tête (numéro)</label>
                <input
                  type="number" min="1" max="20"
                  value={headerRow + 1}
                  onChange={e => { const v = (parseInt(e.target.value) || 1) - 1; setHeaderRow(v); persist({ headerRow: v }); }}
                  className={`w-full rounded-lg border px-2 py-1.5 text-sm ${cl.inp}`}
                />
                <p className={`text-xs mt-1 ${cl.muted}`}>Ligne où se trouvent les titres de colonnes</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Colonne libellé */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Colonne Libellé</label>
                <SelectInp value={colLabel} onChange={v => { setColLabel(Number(v)); persist({ colLabel: Number(v) }); }} className="w-full">
                  {colHeaders.map((h, i) => <option key={i} value={i}>{h || `Col. ${i + 1}`}</option>)}
                </SelectInp>
              </div>

              {/* Mode montant */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Mode montant</label>
                <SelectInp
                  value={amountMode}
                  onChange={v => { setAmountMode(v); persist({ amountMode: v }); }}
                  className="w-full"
                >
                  <option value="single">Total annuel (1 colonne)</option>
                  <option value="monthly">Mensuel (12 colonnes)</option>
                </SelectInp>
              </div>

              {/* Colonne montant ou colonnes mois */}
              {amountMode === 'single' ? (
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>Colonne Montant total</label>
                  <SelectInp value={colSingle} onChange={v => { setColSingle(Number(v)); persist({ colSingle: Number(v) }); }} className="w-full">
                    {colHeaders.map((h, i) => <option key={i} value={i}>{h || `Col. ${i + 1}`}</option>)}
                  </SelectInp>
                </div>
              ) : (
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${cl.muted}`}>
                    Colonnes mois détectées ({colsMonthly.length}/12)
                  </label>
                  {colsMonthly.length >= 6 ? (
                    <div className="flex flex-wrap gap-1">
                      {colsMonthly.map((c, i) => (
                        <span key={c} className={`px-2 py-0.5 rounded text-xs font-bold ${dm ? 'bg-teal-800/40 text-teal-300' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                          {MONTH_NAMES[i] ?? i + 1} → {colHeaders[c] || `Col.${c + 1}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs ${dm ? 'text-amber-400' : 'text-amber-600'}`}>
                      {colsMonthly.length} colonne(s) détectée(s) — vérifiez la ligne d'en-tête ou passez en mode « Total annuel »
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Aperçu avec simulation BP-aware */}
            {(() => {
              // Simuler buildLignes pour l'aperçu
              const montantCols = amountMode === 'monthly' ? colsMonthly : [colSingle];
              let curSection = ''; let curCat = 'charge';
              const preview = [];
              for (let i = headerRow + 1; i < rawRows.length && preview.length < 12; i++) {
                const row = rawRows[i];
                const label = String(row[colLabel] || '').trim();
                if (!label) continue;
                if (isTotalRow(label)) continue;
                if (isSectionHeader(label, row, montantCols)) {
                  curSection = label; curCat = catFromSection(label);
                  preview.push({ label, section: null, montant: null, cat: null, isSection: true });
                  continue;
                }
                const montant = montantCols.reduce((s, c) => s + toNum(row[c]), 0);
                if (montant === 0) continue;
                preview.push({ label, section: curSection, montant, cat: curCat, isSection: false });
              }
              return (
                <div className={`rounded-xl overflow-hidden border ${dm ? 'border-zinc-700' : 'border-slate-200'}`}>
                  <div className={`px-3 py-2 text-xs font-bold flex items-center justify-between ${cl.th}`}>
                    <span>Aperçu de la structure détectée</span>
                    <span className={cl.muted}>{preview.filter(p => !p.isSection).length} lignes de données · {preview.filter(p => p.isSection).length} sections</span>
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={cl.th}>
                          <th className="p-2 text-left">Libellé</th>
                          <th className="p-2 text-right">Montant annuel</th>
                          <th className="p-2 text-left">Catégorie détectée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((p, i) => p.isSection ? (
                          <tr key={i} className={`border-t ${dm ? 'bg-zinc-700/60' : 'bg-slate-100'}`}>
                            <td colSpan={3} className={`p-2 font-bold text-xs uppercase tracking-wide ${dm ? 'text-zinc-300' : 'text-zinc-500'}`}>
                              ── {p.label}
                            </td>
                          </tr>
                        ) : (
                          <tr key={i} className={`border-t ${cl.td}`}>
                            <td className="p-2 pl-5 max-w-xs truncate">{p.label}</td>
                            <td className="p-2 text-right font-mono">{fmt(p.montant)}</td>
                            <td className={`p-2 font-semibold ${catColor(p.cat)}`}>{catLabel[p.cat]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={buildLignes}
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-base shadow transition-all"
            >
              <Check size={18}/> Valider et générer les lignes de ventilation
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PHASE 3 : Ventilation
      ══════════════════════════════════════════════════════════════════════════ */}
      {phase === 'ventilation' && (
        <>
          {/* Bouton reconfigurer */}
          <button
            onClick={() => setPhase('mapping')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${dm ? 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:text-white' : 'bg-white border-slate-300 text-zinc-500 hover:text-zinc-800'}`}
          >
            <Settings2 size={13}/> Reconfigurer le mapping
          </button>

          {/* ── MODE DÉTAIL ── */}
          {viewMode === 'detail' && (
            <div className={`rounded-2xl border ${cl.card} shadow overflow-hidden`}>
              {/* Barre de filtres */}
              <div className={`p-3 flex flex-wrap items-center gap-2 border-b ${dm ? 'border-zinc-700 bg-zinc-800/60' : 'border-slate-100 bg-slate-50'}`}>
                {/* Recherche texte */}
                <div className="relative flex-1 min-w-40">
                  <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${cl.muted}`}/>
                  <input
                    type="text"
                    placeholder="Filtrer par libellé..."
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    className={`w-full pl-8 pr-2 py-1.5 rounded-lg border text-sm ${cl.inp}`}
                  />
                </div>
                {/* Filtre service */}
                <SelectInp value={filterSvc} onChange={setFilterSvc}>
                  <option value="">Tous les services</option>
                  {entities.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                </SelectInp>
                {/* Filtre catégorie */}
                <SelectInp value={filterCat} onChange={setFilterCat}>
                  <option value="">Toutes catégories</option>
                  <option value="recette">Recettes</option>
                  <option value="personnel">Personnel</option>
                  <option value="charge">Charges</option>
                  <option value="ignore">Ignoré</option>
                </SelectInp>
                {/* Afficher ignorés */}
                <button
                  onClick={() => setShowIgnored(v => !v)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border transition-all ${
                    showIgnored
                      ? dm ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700'
                      : dm ? 'border-zinc-600 text-zinc-400' : 'border-slate-300 text-zinc-500'
                  }`}
                >
                  {showIgnored ? <Eye size={12}/> : <EyeOff size={12}/>}
                  Ignorés ({totaux.ignored})
                </button>
                <span className={`text-xs ml-auto ${cl.muted}`}>{lignesFiltrees.length} / {lignes.length} lignes</span>
              </div>

              {/* Tableau des lignes */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cl.th}>
                      <th className="text-left p-2 pl-3 font-semibold">Libellé</th>
                      <th className="text-left p-2 font-semibold">Section BP</th>
                      <th className="text-right p-2 font-semibold">Montant (€)</th>
                      <th className="text-center p-2 font-semibold">Catégorie</th>
                      <th className="text-left p-2 font-semibold">Service</th>
                      <th className="text-left p-2 pr-3 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesFiltrees.map(l => (
                      <tr key={l.idx} className={`border-b ${cl.td} ${cl.row} ${l.serviceId === 'ignore' || l.categorie === 'ignore' ? 'opacity-50' : ''}`}>
                        <td className="p-2 pl-3 max-w-xs">
                          <span className="truncate block" title={l.label}>{l.label}</span>
                        </td>
                        <td className="p-2 max-w-[160px]">
                          {l.section
                            ? <span className={`text-xs px-1.5 py-0.5 rounded font-medium truncate block ${dm ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-zinc-500'}`} title={l.section}>{l.section}</span>
                            : <span className={`text-xs ${cl.muted}`}>—</span>
                          }
                        </td>
                        <td className={`p-2 text-right font-mono font-medium ${l.montant < 0 ? 'text-red-500' : ''}`}>
                          {fmt(l.montant)}
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={l.categorie}
                            onChange={e => updateLigne(l.idx, { categorie: e.target.value })}
                            className={`text-xs rounded-lg border px-1.5 py-1 font-semibold ${cl.inp} ${catColor(l.categorie)}`}
                          >
                            <option value="recette">Recette</option>
                            <option value="personnel">Personnel</option>
                            <option value="charge">Charge</option>
                            <option value="ignore">Ignorer</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={l.serviceId}
                            onChange={e => updateLigne(l.idx, { serviceId: e.target.value })}
                            className={`text-xs rounded-lg border px-1.5 py-1 ${cl.inp} w-full`}
                            disabled={l.categorie === 'ignore'}
                          >
                            {entities.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                          </select>
                        </td>
                        <td className="p-2 pr-3">
                          <input
                            type="text"
                            value={l.note || ''}
                            onChange={e => updateLigne(l.idx, { note: e.target.value })}
                            placeholder="Note..."
                            className={`w-full text-xs rounded-lg border px-1.5 py-1 ${cl.inp}`}
                          />
                        </td>
                      </tr>
                    ))}
                    {lignesFiltrees.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`p-8 text-center ${cl.muted}`}>
                          Aucune ligne ne correspond aux filtres sélectionnés
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totaux filtrés */}
              <div className={`p-3 border-t flex flex-wrap gap-4 text-sm ${dm ? 'border-zinc-700 bg-zinc-800/60' : 'border-slate-100 bg-slate-50'}`}>
                <span className={cl.muted}>Sélection — Recettes : <strong className="text-teal-600">{fmt(lignesFiltrees.filter(l => l.categorie === 'recette').reduce((s, l) => s + l.montant, 0))}</strong></span>
                <span className={cl.muted}>Charges : <strong className="text-orange-500">{fmt(lignesFiltrees.filter(l => l.categorie !== 'recette' && l.categorie !== 'ignore').reduce((s, l) => s + l.montant, 0))}</strong></span>
              </div>
            </div>
          )}

          {/* ── MODE VENTILATION ── */}
          {viewMode === 'ventilation' && (
            <div className="space-y-3">
              {/* Récapitulatif global */}
              <div className={`rounded-2xl border ${cl.card} shadow overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cl.th}>
                        <th className="text-left p-3 font-semibold">Service</th>
                        <th className="text-right p-3 font-semibold">Recettes (€)</th>
                        <th className="text-right p-3 font-semibold">Personnel (€)</th>
                        <th className="text-right p-3 font-semibold">Autres charges (€)</th>
                        <th className="text-right p-3 font-semibold">Total charges (€)</th>
                        <th className="text-right p-3 font-semibold">Solde (€)</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.filter(e => e.id !== 'ignore' && ventilation[e.id]?.lignes?.length > 0).map(e => {
                        const v = ventilation[e.id];
                        const isOpen = openVentil[e.id];
                        return (
                          <React.Fragment key={e.id}>
                            <tr className={`border-b ${cl.td} ${cl.row} cursor-pointer`} onClick={() => setOpenVentil(o => ({ ...o, [e.id]: !o[e.id] }))}>
                              <td className="p-3 font-semibold">{e.label}</td>
                              <td className="p-3 text-right text-teal-600 font-medium">{fmt(v.recettes)}</td>
                              <td className="p-3 text-right text-blue-600 font-medium">{fmt(v.personnel)}</td>
                              <td className="p-3 text-right text-orange-500 font-medium">{fmt(v.charges)}</td>
                              <td className="p-3 text-right font-medium">{fmt(v.totalCharges)}</td>
                              <td className={`p-3 text-right font-bold ${v.solde >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(v.solde)}</td>
                              <td className="p-3 text-center">
                                {isOpen ? <ChevronUp size={14} className={cl.muted}/> : <ChevronDown size={14} className={cl.muted}/>}
                              </td>
                            </tr>
                            {/* Détail des lignes de ce service */}
                            {isOpen && v.lignes.map(l => (
                              <tr key={l.idx} className={`border-b ${cl.td} ${dm ? 'bg-zinc-700/20' : 'bg-slate-50/80'}`}>
                                <td className="p-2 pl-8 text-xs">
                                  <Tag size={11} className={`inline mr-1.5 ${catColor(l.categorie)}`}/>
                                  {l.label}
                                </td>
                                <td className="p-2 text-right text-xs text-teal-600">{l.categorie === 'recette' ? fmt(l.montant) : '—'}</td>
                                <td className="p-2 text-right text-xs text-blue-600">{l.categorie === 'personnel' ? fmt(l.montant) : '—'}</td>
                                <td className="p-2 text-right text-xs text-orange-500">{l.categorie === 'charge' ? fmt(l.montant) : '—'}</td>
                                <td className="p-2 text-right text-xs">{l.categorie !== 'recette' ? fmt(l.montant) : '—'}</td>
                                <td className="p-2" colSpan={2}>
                                  {l.note && <span className={`text-xs italic ${cl.muted}`}>{l.note}</span>}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}

                      {/* Total général */}
                      <tr className={`font-extrabold text-base ${dm ? 'bg-zinc-700 text-white' : 'bg-slate-100 text-zinc-900'}`}>
                        <td className="p-4">TOTAL</td>
                        <td className="p-4 text-right text-teal-600">{fmt(totaux.recettes)}</td>
                        <td className="p-4 text-right text-blue-600">{fmt(totaux.personnel)}</td>
                        <td className="p-4 text-right text-orange-500">{fmt(totaux.charges)}</td>
                        <td className="p-4 text-right">{fmt(totaux.totalCharges)}</td>
                        <td className={`p-4 text-right ${totaux.solde >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(totaux.solde)}</td>
                        <td className="p-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Graphique en barres simplifié (CSS) */}
              <div className={`rounded-2xl border p-5 ${cl.card} shadow`}>
                <h3 className={`font-bold text-sm mb-4 ${cl.title}`}>Répartition visuelle</h3>
                <div className="space-y-3">
                  {entities
                    .filter(e => e.id !== 'ignore' && ventilation[e.id]?.lignes?.length > 0)
                    .sort((a, b) => (ventilation[b.id]?.totalCharges || 0) - (ventilation[a.id]?.totalCharges || 0))
                    .map(e => {
                      const v = ventilation[e.id];
                      const maxCharges = Math.max(...entities.filter(x => ventilation[x.id]).map(x => ventilation[x.id].totalCharges), 1);
                      const pctR = totaux.recettes > 0 ? (v.recettes / totaux.recettes * 100) : 0;
                      const pctC = maxCharges > 0 ? (v.totalCharges / maxCharges * 100) : 0;
                      return (
                        <div key={e.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={`font-semibold ${cl.title}`}>{e.label}</span>
                            <span className={cl.muted}>
                              <span className="text-teal-600">{fmt(v.recettes)}</span>
                              {' / '}
                              <span className="text-orange-500">{fmt(v.totalCharges)}</span>
                            </span>
                          </div>
                          <div className={`h-4 rounded-full overflow-hidden ${dm ? 'bg-zinc-700' : 'bg-slate-100'}`}>
                            <div className="h-full flex">
                              <div className="h-full bg-teal-500/70 transition-all" style={{ width: `${pctR}%` }}/>
                              <div className="h-full bg-orange-400/70 transition-all" style={{ width: `${pctC * 0.8}%` }}/>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  <div className={`flex gap-4 text-xs mt-2 ${cl.muted}`}>
                    <span><span className="inline-block w-3 h-3 rounded bg-teal-500/70 mr-1"></span>Recettes</span>
                    <span><span className="inline-block w-3 h-3 rounded bg-orange-400/70 mr-1"></span>Charges</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
