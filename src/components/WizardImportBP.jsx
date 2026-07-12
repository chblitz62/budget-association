import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertTriangle, X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Fichier' },
  { n: 2, label: 'CDI' },
  { n: 3, label: 'Trésorerie' },
  { n: 4, label: 'Aperçu' },
  { n: 5, label: 'Importer' },
];

const fmt = (v) =>
  typeof v === 'number'
    ? v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    : '—';

function normalizeStr(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function detectRole(emploi) {
  const e = normalizeStr(emploi);
  if (e.includes('directeur') || e.includes('directrice')) return 'direction';
  if (e.includes('formateur') || e.includes('formatrice')) return 'formateur';
  if (e.includes('resp') || e.includes('responsable')) return 'responsable';
  if (e.includes('secretaire') || e.includes('admin') || e.includes('gestionnaire') || e.includes('comptable')) return 'administratif';
  if (e.includes('technique') || e.includes('polyvalent') || e.includes('technicien')) return 'technique';
  if (e.includes('document')) return 'documentation';
  return 'autre';
}

function autoAssign(emploi, serviceNames) {
  const e = normalizeStr(emploi);
  if (e.includes('directeur') || e.includes('directrice') || e.includes('secretaire') || e.includes('agent admin') || e.includes('gestionnaire') || e.includes('comptable') || e.includes('technicien')) return 'direction';
  if (e.includes('documentaliste') || e.includes('centre ressources') || e.includes('polyvalent')) return 'poleSupport';
  if (e.includes('formateur') || e.includes('formatrice')) {
    const fiEs = serviceNames.find(s => normalizeStr(s).includes('educateur') || normalizeStr(s).includes('fi es') || normalizeStr(s).includes('fi e'));
    return fiEs ? `service_${serviceNames.indexOf(fiEs)}` : 'ignore';
  }
  if (e.includes('responsable site') || e.includes('resp site')) {
    const avion = serviceNames.find(s => normalizeStr(s).includes('avion'));
    if (avion) return `service_${serviceNames.indexOf(avion)}`;
  }
  return 'ignore';
}

function parseCDI(sheet, serviceNames) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const warnings = [];

  // Détection de la ligne d'en-tête par mots-clés
  let colNom = 0, colEmploi = 3, colSalaire = 4, colCharges = 5, startRow = 2;
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const norm = rows[r].map(c => normalizeStr(String(c)));
    const eIdx = norm.findIndex(c => c.includes('emploi') || c.includes('poste') || c.includes('qualification') || c.includes('fonction'));
    if (eIdx >= 0) {
      startRow = r + 1;
      colEmploi = eIdx;
      const sIdx = norm.findIndex(c => (c.includes('salaire') || c.includes('mensuel') || c.includes('brut')) && !c.includes('charge'));
      if (sIdx >= 0) colSalaire = sIdx;
      const cIdx = norm.findIndex(c => c.includes('charge') || c.includes('cotis'));
      if (cIdx >= 0 && cIdx !== colSalaire) colCharges = cIdx;
      break;
    }
  }

  const agents = [];
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row[colNom] || String(row[colNom]).trim() === '') continue;
    const emploi = String(row[colEmploi] || '').trim();
    if (!emploi) continue;

    const salRaw = row[colSalaire];
    const salaireMensuel = parseFloat(String(salRaw).replace(',', '.'));
    if (isNaN(salaireMensuel) && String(salRaw).trim() !== '') {
      warnings.push(`CDI ligne ${i + 1} — "${emploi}" : salaire illisible ("${salRaw}") → 0 utilisé`);
    }

    const chgRaw = row[colCharges];
    const chargesAnnuelles = parseFloat(String(chgRaw).replace(',', '.'));
    if (isNaN(chargesAnnuelles) && String(chgRaw).trim() !== '') {
      warnings.push(`CDI ligne ${i + 1} — "${emploi}" : charges illisibles ("${chgRaw}") → 0 utilisées`);
    }

    agents.push({
      idx: agents.length + 1,
      emploi,
      salaireMensuel: isNaN(salaireMensuel) ? 0 : salaireMensuel,
      chargesAnnuelles: isNaN(chargesAnnuelles) ? 0 : chargesAnnuelles,
      assignedTo: autoAssign(emploi, serviceNames),
    });
  }
  return { agents, warnings };
}

// Variantes d'abréviations mensuelles (FR) pour la détection d'en-têtes
const MONTH_VARIANTS = [
  ['jan'], ['fev', 'fév'], ['mar'], ['avr'], ['mai'],
  ['juin', 'jun'], ['juil', 'jul'], ['aout', 'aou'],
  ['sep'], ['oct'], ['nov'], ['dec', 'déc'],
];

function detectMonthCols(rows) {
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const norm = rows[r].map(c => normalizeStr(String(c)));
    const cols = MONTH_VARIANTS.map(variants =>
      norm.findIndex(c => variants.some(v => c.startsWith(v)))
    );
    if (cols.filter(i => i >= 0).length >= 10) return { headerRow: r, cols };
  }
  return null;
}

function parseTresorerie(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const warnings = [];

  // Détection des colonnes mensuelles par en-têtes
  const detected = detectMonthCols(rows);
  let startRow = 3;
  let getVals;

  if (detected) {
    startRow = detected.headerRow + 1;
    const missing = detected.cols.filter(i => i < 0).length;
    if (missing > 0) warnings.push(`${missing} colonne(s) mensuelle(s) non détectée(s) — valeurs manquantes remplacées par 0.`);
    getVals = row => detected.cols.map(ci => ci >= 0 ? (parseFloat(row[ci]) || 0) : 0);
  } else {
    warnings.push('En-têtes mensuels non détectés dans la feuille Trésorerie — colonnes 1 à 12 utilisées par défaut.');
    getVals = row => Array.from({ length: 12 }, (_, c) => parseFloat(row[c + 1]) || 0);
  }

  const items = [];
  let currentSection = '';
  let skipUntilNextSection = false;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    const label = String(row[0] || '').trim();
    if (!label) continue;

    const lNorm = normalizeStr(label);

    if (lNorm.includes('salariale') || lNorm.includes('salaires bruts') || lNorm.includes('cotisations') || lNorm.includes('mutuelle')) {
      currentSection = 'skip_salary';
      skipUntilNextSection = true;
      continue;
    }
    if (lNorm === 'entrees fonctionnement' || lNorm.includes('entrees fonctionnement') || lNorm === 'sorties fonctionnement' || lNorm.includes('sorties fonctionnement')) {
      skipUntilNextSection = false;
      currentSection = lNorm.includes('entrees') ? 'entrees' : 'sorties';
      continue;
    }
    if (lNorm.includes('facturations') || lNorm.includes('adhesions') || lNorm.includes('subventions d exploitation') || lNorm.includes('subventions')) {
      skipUntilNextSection = false;
      currentSection = 'recette';
      continue;
    }
    if (lNorm.includes('achats') || lNorm.includes('frais generaux')) {
      skipUntilNextSection = false;
      currentSection = 'exploitation';
      continue;
    }
    if (lNorm.includes('impots') || lNorm.includes('taxes')) {
      skipUntilNextSection = false;
      currentSection = 'exploitation';
      continue;
    }
    if (lNorm.includes('taxe sur les salaires') || (lNorm.includes('participation') && lNorm.includes('formation'))) continue;
    if (lNorm.includes('solde')) continue;
    if (skipUntilNextSection) continue;

    const vals = getVals(row);
    const total = vals.reduce((a, b) => a + b, 0);
    if (total === 0) continue;

    let category = 'ignore';
    if (currentSection === 'recette' || currentSection === 'entrees') category = 'recette';
    else if (currentSection === 'exploitation' || currentSection === 'sorties') category = 'exploitation';

    if (lNorm.includes('salariale') || lNorm.includes('salaires') || lNorm.includes('cotisations') || lNorm.includes('mutuelle')) continue;

    items.push({
      idx: items.length + 1,
      label,
      annualTotal: total,
      monthlyAvg: total / 12,
      category,
      repartition: {},
    });
  }
  return { items, warnings };
}

function StepIndicator({ step, darkMode }) {
  return (
    <div className="flex items-center justify-center mb-6 gap-1">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                step === s.n
                  ? 'bg-amber-500 text-white shadow-lg scale-110'
                  : step > s.n
                  ? 'bg-teal-500 text-white'
                  : darkMode
                  ? 'bg-zinc-700 text-zinc-400'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step > s.n ? <Check size={14} /> : s.n}
            </div>
            <span className={`text-xs mt-0.5 font-bold ${step === s.n ? (darkMode ? 'text-amber-400' : 'text-amber-600') : darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mb-4 ${step > s.n ? 'bg-teal-400' : darkMode ? 'bg-zinc-700' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function WizardImportBP({ onClose, services, poleSupport, direction, setServices, setPoleSupport, setDirection, darkMode, globalParams, setGlobalParams, onImportComplete }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [parseWarnings, setParseWarnings] = useState([]);
  const [workbook, setWorkbook] = useState(null);
  const [sheetsFound, setSheetsFound] = useState({ cdi: false, tresorerie: false });
  const [agents, setAgents] = useState([]);
  const [tresItems, setTresItems] = useState([]);
  const [importDone, setImportDone] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [coeffLocal, setCoeffLocal] = useState(() => globalParams?.coefficientBP ?? 100);
  const fileRef = useRef();

  const serviceNames = services.map(s => s.nom);
  const allTargets = [
    { value: 'ignore', label: '— Ignorer —' },
    { value: 'direction', label: 'Siège' },
    { value: 'poleSupport', label: 'Pôle Ressources' },
    ...services.map((s, i) => ({ value: `service_${i}`, label: s.nom })),
  ];
  const allServiceTargets = [
    { value: 'direction', label: 'Global (Direction)' },
    ...services.map((s, i) => ({ value: `service_${i}`, label: s.nom })),
  ];
  const repartitionTargets = [
    { value: 'direction', label: 'Siège' },
    { value: 'poleSupport', label: 'Pôle Ressources' },
    ...services.map((s, i) => ({ value: `service_${i}`, label: s.nom })),
  ];

  const handleFile = (file) => {
    setError('');
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const names = wb.SheetNames;
        const hasCDI = names.some(n => n.trim() === 'CDI');
        const hasTres = names.some(n => n.trim().toLowerCase().includes('tresorerie') || n.trim().toLowerCase().includes('trésorerie'));
        setSheetsFound({ cdi: hasCDI, tresorerie: hasTres });
        setWorkbook(wb);
        if (!hasCDI && !hasTres) {
          setError("Aucune feuille 'CDI' ou 'Trésorerie auto (2026)' trouvée dans ce fichier.");
        }
      } catch (err) {
        setError('Erreur lors de la lecture du fichier : ' + err.message);
      }
    };
    reader.onerror = () => setError('Impossible de lire le fichier.');
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const goStep2 = () => {
    if (!workbook) { setError('Veuillez charger un fichier.'); return; }
    setError('');
    setParseWarnings([]);
    if (sheetsFound.cdi) {
      const sheetName = workbook.SheetNames.find(n => n.trim() === 'CDI');
      try {
        const { agents: parsed, warnings } = parseCDI(workbook.Sheets[sheetName], serviceNames);
        setAgents(parsed);
        setParseWarnings(warnings);
      } catch (err) {
        setError('Erreur lecture feuille CDI : ' + err.message);
        return;
      }
    } else {
      setAgents([]);
    }
    setStep(2);
  };

  const goStep3 = () => {
    setError('');
    setParseWarnings([]);
    if (sheetsFound.tresorerie) {
      const sheetName = workbook.SheetNames.find(n => {
        const nn = n.trim().toLowerCase();
        return nn.includes('tresorerie') || nn.includes('trésorerie');
      });
      try {
        const { items: parsed, warnings } = parseTresorerie(workbook.Sheets[sheetName]);
        const repKeys = ['direction', 'poleSupport', ...services.map((_, i) => `service_${i}`)];
        const withRep = parsed.map(item => {
          const rep = {};
          repKeys.forEach((k, i) => { rep[k] = i === 0 ? 100 : 0; });
          return { ...item, repartition: rep };
        });
        setTresItems(withRep);
        setParseWarnings(warnings);
      } catch (err) {
        setError('Erreur lecture feuille Trésorerie : ' + err.message);
        return;
      }
    } else {
      setTresItems([]);
    }
    setStep(3);
  };

  const updateAgentAssign = (idx, val) => {
    setAgents(prev => prev.map(a => a.idx === idx ? { ...a, assignedTo: val } : a));
  };

  const updateTresCategory = (idx, val) => {
    setTresItems(prev => prev.map(t => t.idx === idx ? { ...t, category: val } : t));
  };

  const updateRepartition = (idx, target, val) => {
    const pct = Math.max(0, Math.min(100, parseFloat(val) || 0));
    setTresItems(prev => prev.map(t => t.idx === idx ? { ...t, repartition: { ...t.repartition, [target]: pct } } : t));
  };

  // Helper to auto-distribute Regional Subsidy based on eligible personnel costs
  const autoDistributeSubvention = (idx) => {
    const item = tresItems.find(t => t.idx === idx);
    if (!item) return;

    // Calculate eligible costs per entity
    const eligibleCosts = {
      direction: (direction.personnel || []).filter(p => p.eligibleSubvention).reduce((sum, p) => sum + (parseFloat(p.salaire) || 0), 0),
      poleSupport: (poleSupport.personnel || []).filter(p => p.eligibleSubvention).reduce((sum, p) => sum + (parseFloat(p.salaire) || 0), 0),
    };
    services.forEach((s, i) => {
      eligibleCosts[`service_${i}`] = (s.personnel || []).filter(p => p.eligibleSubvention).reduce((sum, p) => sum + (parseFloat(p.salaire) || 0), 0);
    });

    const totalEligible = Object.values(eligibleCosts).reduce((a, b) => a + b, 0);
    if (totalEligible === 0) {
      if (window.appToast) window.appToast("Aucun agent coché 'Subvention' dans le budget. Cochez-les d'abord dans l'onglet RH/Budget.", "warning");
      else alert("Aucun agent coché 'Subvention' dans le budget.");
      return;
    }

    const newRep = {};
    Object.keys(eligibleCosts).forEach(key => {
      newRep[key] = Math.round((eligibleCosts[key] / totalEligible) * 100);
    });

    // Adjust last one to ensure 100% total
    const sum = Object.values(newRep).reduce((a, b) => a + b, 0);
    if (sum !== 100 && sum > 0) {
      const firstKey = Object.keys(newRep).find(k => newRep[k] > 0);
      if (firstKey) newRep[firstKey] += (100 - sum);
    }

    setTresItems(prev => prev.map(t => t.idx === idx ? { ...t, repartition: newRep, category: 'recette' } : t));
    if (window.appToast) window.appToast("Répartition calculée selon les salaires éligibles", "success");
  };

  // Build preview data
  const buildPreview = () => {
    const groups = {};
    agents.filter(a => a.assignedTo !== 'ignore').forEach(a => {
      if (!groups[a.assignedTo]) groups[a.assignedTo] = { agents: 0, totalSalaire: 0 };
      groups[a.assignedTo].agents++;
      groups[a.assignedTo].totalSalaire += a.salaireMensuel;
    });

    const tresGroups = {};
    tresItems.filter(t => t.category !== 'ignore').forEach(t => {
      Object.entries(t.repartition || {}).forEach(([key, pct]) => {
        if (!pct) return;
        if (!tresGroups[key]) tresGroups[key] = { recettes: [], exploitation: [] };
        tresGroups[key][t.category === 'recette' ? 'recettes' : 'exploitation'].push({ ...t, pct });
      });
    });

    return { groups, tresGroups };
  };

  const targetLabel = (key) => {
    if (key === 'direction') return 'Siège';
    if (key === 'poleSupport') return 'Pôle Ressources';
    if (key.startsWith('service_')) {
      const idx = parseInt(key.split('_')[1]);
      return services[idx]?.nom || key;
    }
    return key;
  };

  const doImport = () => {
    let addedPersonnel = 0;
    let skippedPersonnel = 0;
    let addedItems = 0;
    let skippedItems = 0;

    const getEntity = (key) => {
      if (key === 'direction') return { entity: direction, type: 'direction' };
      if (key === 'poleSupport') return { entity: poleSupport, type: 'poleSupport' };
      if (key.startsWith('service_')) {
        const idx = parseInt(key.split('_')[1]);
        return { entity: services[idx], type: 'service', idx };
      }
      return null;
    };

    // CDI import
    const directionUpdated = { ...direction, personnel: [...direction.personnel] };
    const poleSupportUpdated = { ...poleSupport, personnel: [...poleSupport.personnel] };
    const servicesUpdated = services.map(s => ({ ...s, personnel: [...s.personnel] }));

    agents.filter(a => a.assignedTo !== 'ignore').forEach((agent, i) => {
      const key = agent.assignedTo;
      let targetPersonnel;
      if (key === 'direction') targetPersonnel = directionUpdated.personnel;
      else if (key === 'poleSupport') targetPersonnel = poleSupportUpdated.personnel;
      else if (key.startsWith('service_')) {
        const idx = parseInt(key.split('_')[1]);
        targetPersonnel = servicesUpdated[idx].personnel;
      } else return;

      const emploiNorm = normalizeStr(agent.emploi);
      const exists = targetPersonnel.some(p => normalizeStr(p.titre).includes(emploiNorm.substring(0, 8)));
      if (exists) {
        skippedPersonnel++;
        return;
      }
      const newEntry = {
        id: Date.now() + i + Math.random() * 1000 | 0,
        titre: agent.emploi,
        etp: 1,
        salaire: agent.salaireMensuel,
        segur: false,
        role: detectRole(agent.emploi),
        rqth: false,
        anneeNaissance: 0,
        genre: '',
        dateEntree: 0,
        dateSortie: 0,
      };
      targetPersonnel.push(newEntry);
      addedPersonnel++;
    });

    // Trésorerie import
    tresItems.filter(t => t.category !== 'ignore').forEach((item) => {
      const isRecette = item.category === 'recette';
      const fieldName = isRecette ? 'recettes' : 'exploitation';

      Object.entries(item.repartition || {}).forEach(([key, pct]) => {
        if (!pct) return;
        let targetArray;

        if (key === 'direction') {
          if (isRecette) {
            if (!directionUpdated.recettes) directionUpdated.recettes = [];
            targetArray = directionUpdated.recettes;
          } else {
            if (!directionUpdated.chargesSiege) directionUpdated.chargesSiege = [];
            targetArray = directionUpdated.chargesSiege;
          }
        } else if (key === 'poleSupport') {
          if (!poleSupportUpdated[fieldName]) poleSupportUpdated[fieldName] = [];
          targetArray = poleSupportUpdated[fieldName];
        } else if (key.startsWith('service_')) {
          const idx = parseInt(key.split('_')[1]);
          if (!servicesUpdated[idx][fieldName]) servicesUpdated[idx][fieldName] = [];
          targetArray = servicesUpdated[idx][fieldName];
        } else return;

        const labelNorm = normalizeStr(item.label);
        const exists = targetArray.some(e => normalizeStr(e.nom || e.libelle || '').includes(labelNorm.substring(0, 10)));
        if (exists) { skippedItems++; return; }

        const suffix = pct < 100 ? ` (${pct}%)` : '';
        targetArray.push({
          id: Date.now() + item.idx + Math.random() * 1000 | 0,
          nom: item.label + suffix,
          montant: Math.round(item.monthlyAvg * pct / 100),
        });
        addedItems++;
      });
    });

    setDirection(directionUpdated);
    setPoleSupport(poleSupportUpdated);
    setServices(servicesUpdated);
    if (setGlobalParams) setGlobalParams(prev => ({ ...prev, coefficientBP: coeffLocal }));

    setImportSummary({ addedPersonnel, skippedPersonnel, addedItems, skippedItems });
    setImportDone(true);
    setStep(5);
    if (window.appToast) {
      const msgs = [];
      if (addedPersonnel > 0) msgs.push(`${addedPersonnel} agent${addedPersonnel > 1 ? 's' : ''} importé${addedPersonnel > 1 ? 's' : ''}`);
      if (addedItems > 0) msgs.push(`${addedItems} ligne${addedItems > 1 ? 's' : ''} trésorerie`);
      window.appToast(msgs.length > 0 ? `Import BP : ${msgs.join(', ')}` : 'Import BP effectué', 'success');
    }
    onImportComplete?.(`${addedPersonnel} agents, ${addedItems} lignes trésorerie importés`);
  };

  const { groups: previewGroups, tresGroups: previewTresGroups } = step >= 4 ? buildPreview() : { groups: {}, tresGroups: {} };

  // Détecte si un agent importé est un doublon probable dans l'entité cible
  const checkDuplicate = (agent) => {
    if (agent.assignedTo === 'ignore') return false;
    let targetPersonnel = [];
    if (agent.assignedTo === 'direction') targetPersonnel = direction.personnel || [];
    else if (agent.assignedTo === 'poleSupport') targetPersonnel = poleSupport.personnel || [];
    else if (agent.assignedTo.startsWith('service_')) {
      const idx = parseInt(agent.assignedTo.split('_')[1]);
      targetPersonnel = services[idx]?.personnel || [];
    }
    const emploiNorm = normalizeStr(agent.emploi);
    return targetPersonnel.some(p => normalizeStr(p.titre).includes(emploiNorm.substring(0, 8)));
  };

  const cardCls = darkMode ? 'bg-zinc-800' : 'bg-white';
  const textCls = darkMode ? 'text-white' : 'text-slate-800';
  const subCls = darkMode ? 'text-zinc-400' : 'text-slate-500';
  const rowEven = darkMode ? 'bg-zinc-900/50' : 'bg-slate-50';
  const rowOdd = darkMode ? 'bg-zinc-800' : 'bg-white';
  const borderCls = darkMode ? 'border-zinc-700' : 'border-slate-200';
  const inputCls = `rounded-lg border px-2 py-1 text-sm ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-print">
      <div className={`max-w-5xl w-full rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto ${cardCls}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-100">
              <FileSpreadsheet className="text-amber-600" size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-black ${textCls}`}>Import Budget Prévisionnel</h2>
              <p className={`text-sm ${subCls}`}>Assistant d'import — Budget AFERTES 2026</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
            <X size={20} />
          </button>
        </div>

        <StepIndicator step={step} darkMode={darkMode} />

        {error && (
          <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${darkMode ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {parseWarnings.length > 0 && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${darkMode ? 'bg-amber-900/20 text-amber-300 border border-amber-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle size={14} />
              {parseWarnings.length} avertissement{parseWarnings.length > 1 ? 's' : ''} de lecture
            </div>
            <ul className="list-disc list-inside space-y-0.5 font-normal">
              {parseWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* ── STEP 1 : Upload ── */}
        {step === 1 && (
          <div>
            <h3 className={`text-lg font-black mb-4 ${textCls}`}>Charger le fichier Excel</h3>

            {/* Coefficient BP */}
            <div className={`mb-4 rounded-2xl p-4 border-2 ${coeffLocal !== 100 ? (darkMode ? 'bg-amber-900/20 border-amber-600' : 'bg-amber-50 border-amber-400') : (darkMode ? 'bg-zinc-700/40 border-zinc-600' : 'bg-slate-50 border-slate-200')}`}>
              <label className={`text-xs font-black uppercase tracking-widest block mb-2 ${coeffLocal !== 100 ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-zinc-300' : 'text-slate-600')}`}>
                Coefficient d'application — charges &amp; recettes
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" step="0.1" min="0" max="200"
                  value={coeffLocal}
                  onChange={e => setCoeffLocal(Math.max(0, Math.min(200, parseFloat(e.target.value) || 100)))}
                  className={`rounded-xl px-3 py-2 font-black text-2xl outline-none w-28 border ${coeffLocal !== 100 ? (darkMode ? 'bg-zinc-700 text-amber-300 border-amber-600' : 'bg-white text-amber-700 border-amber-400') : (darkMode ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-white border-slate-300')}`}
                />
                <span className={`text-2xl font-black ${coeffLocal !== 100 ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-zinc-400' : 'text-slate-400')}`}>%</span>
                <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Appliqué à toutes les charges d'exploitation et recettes importées — transversal à tous les onglets. 100 % = budget plein.
                </p>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${darkMode ? 'border-zinc-600 hover:border-amber-500 hover:bg-amber-900/10' : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50'}`}
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <Upload className={`mx-auto mb-3 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} size={36} />
              <p className={`font-bold mb-1 ${textCls}`}>Glisser-déposer ou cliquer pour sélectionner</p>
              <p className={`text-sm ${subCls}`}>Fichier .xlsx — Budget prévisionnel analytique AFERTES</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>

            {workbook && (
              <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`font-bold mb-2 ${textCls}`}>Feuilles détectées :</p>
                <div className="flex flex-wrap gap-2">
                  {workbook.SheetNames.map(n => (
                    <span key={n} className={`px-3 py-1 rounded-full text-sm font-bold ${
                      n.trim() === 'CDI' || n.trim().toLowerCase().includes('tresorerie') || n.trim().toLowerCase().includes('trésorerie')
                        ? 'bg-teal-100 text-teal-700'
                        : darkMode ? 'bg-zinc-600 text-zinc-300' : 'bg-slate-200 text-slate-500'
                    }`}>{n}</span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-2 p-2 rounded-xl ${sheetsFound.cdi ? (darkMode ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700') : (darkMode ? 'bg-zinc-600 text-zinc-400' : 'bg-slate-100 text-slate-400')}`}>
                    {sheetsFound.cdi ? <Check size={14} /> : <X size={14} />}
                    <span className="text-sm font-bold">Feuille CDI</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-xl ${sheetsFound.tresorerie ? (darkMode ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700') : (darkMode ? 'bg-zinc-600 text-zinc-400' : 'bg-slate-100 text-slate-400')}`}>
                    {sheetsFound.tresorerie ? <Check size={14} /> : <X size={14} />}
                    <span className="text-sm font-bold">Feuille Trésorerie auto (2026)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2 : CDI ── */}
        {step === 2 && (
          <div>
            <h3 className={`text-lg font-black mb-1 ${textCls}`}>Masse salariale — Feuille CDI</h3>
            <p className={`text-sm mb-4 ${subCls}`}>Assignez chaque poste à un service. Les noms sont masqués. Si un agent existe déjà, le salaire actuel est conservé.</p>
            {agents.length === 0 && (
              <div className={`p-6 text-center rounded-2xl ${darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                {sheetsFound.cdi ? 'Aucun agent valide trouvé dans la feuille CDI.' : 'Feuille CDI non trouvée dans le fichier.'}
              </div>
            )}
            {agents.length > 0 && (
              <>
                <div className={`rounded-2xl overflow-hidden border ${borderCls}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={darkMode ? 'bg-zinc-700' : 'bg-slate-100'}>
                        <th className={`px-3 py-2 text-left font-bold ${textCls}`}>#</th>
                        <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Emploi</th>
                        <th className={`px-3 py-2 text-right font-bold ${textCls}`}>Salaire mensuel</th>
                        <th className={`px-3 py-2 text-right font-bold ${textCls}`}>Charges annuelles</th>
                        <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Assigner à</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((a, i) => {
                        const isDuplicate = checkDuplicate(a);
                        return (
                        <tr key={a.idx} className={`${i % 2 === 0 ? rowEven : rowOdd} ${isDuplicate ? (darkMode ? 'bg-amber-900/20' : 'bg-amber-50') : ''}`}>
                          <td className={`px-3 py-2 font-bold ${subCls}`}>Agent #{a.idx}</td>
                          <td className={`px-3 py-2 ${textCls}`}>
                            {a.emploi}
                            {isDuplicate && (
                              <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${darkMode ? 'bg-amber-800/60 text-amber-300' : 'bg-amber-100 text-amber-700'}`} title="Un agent avec un emploi similaire existe déjà dans l'entité cible — sera ignoré à l'import">
                                doublon probable
                              </span>
                            )}
                          </td>
                          <td className={`px-3 py-2 text-right font-mono ${textCls}`}>{fmt(a.salaireMensuel)}</td>
                          <td className={`px-3 py-2 text-right font-mono ${subCls}`}>{fmt(a.chargesAnnuelles)}</td>
                          <td className="px-3 py-2">
                            <select
                              value={a.assignedTo}
                              onChange={e => updateAgentAssign(a.idx, e.target.value)}
                              className={inputCls}
                            >
                              {allTargets.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Summary footer */}
                <div className={`mt-3 p-3 rounded-2xl ${darkMode ? 'bg-zinc-700' : 'bg-slate-50'}`}>
                  <p className={`text-sm font-bold mb-2 ${textCls}`}>Récapitulatif par entité :</p>
                  <div className="flex flex-wrap gap-2">
                    {allTargets.filter(t => t.value !== 'ignore').map(t => {
                      const grpAgents = agents.filter(a => a.assignedTo === t.value);
                      const total = grpAgents.reduce((s, a) => s + a.salaireMensuel, 0);
                      if (grpAgents.length === 0) return null;
                      return (
                        <span key={t.value} className={`px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-zinc-600 text-zinc-200' : 'bg-white border border-slate-200 text-slate-700'}`}>
                          {t.label} : {grpAgents.length} agent{grpAgents.length > 1 ? 's' : ''} — {fmt(total)}/mois
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3 : Trésorerie ── */}
        {step === 3 && (
          <div>
            <h3 className={`text-lg font-black mb-1 ${textCls}`}>Plan de trésorerie 2026</h3>
            <p className={`text-sm mb-4 ${subCls}`}>Catégorisez les lignes et assignez-les à un service. La masse salariale est exclue (gérée via CDI).</p>
            {tresItems.length === 0 && (
              <div className={`p-6 text-center rounded-2xl ${darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                {sheetsFound.tresorerie ? 'Aucun élément exploitable trouvé dans la feuille Trésorerie.' : 'Feuille Trésorerie auto (2026) non trouvée dans le fichier.'}
              </div>
            )}
            {tresItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className={`w-full text-sm border rounded-2xl overflow-hidden ${borderCls}`}>
                  <thead>
                    <tr className={darkMode ? 'bg-zinc-700' : 'bg-slate-100'}>
                      <th className={`px-3 py-2 text-left font-bold ${textCls} sticky left-0 ${darkMode ? 'bg-zinc-700' : 'bg-slate-100'}`}>Libellé</th>
                      <th className={`px-3 py-2 text-right font-bold ${textCls} whitespace-nowrap`}>Moy./mois</th>
                      <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Cat.</th>
                      {repartitionTargets.map(rt => (
                        <th key={rt.value} className={`px-2 py-2 text-center font-bold ${textCls} whitespace-nowrap min-w-[80px]`}>{rt.label}</th>
                      ))}
                      <th className={`px-2 py-2 text-center font-bold ${textCls}`}>Total %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tresItems.map((t, i) => {
                      const totalPct = Object.values(t.repartition || {}).reduce((s, v) => s + v, 0);
                      const pctOk = totalPct === 100;
                      const pctOver = totalPct > 100;
                      return (
                        <tr key={t.idx} className={`${i % 2 === 0 ? rowEven : rowOdd} ${t.category === 'ignore' ? 'opacity-40' : ''}`}>
                          <td className={`px-3 py-2 font-medium ${textCls} sticky left-0 ${i % 2 === 0 ? (darkMode ? 'bg-zinc-900/80' : 'bg-slate-50') : (darkMode ? 'bg-zinc-800' : 'bg-white')} max-w-[200px] truncate`} title={t.label}>{t.label}</td>
                          <td className={`px-3 py-2 text-right font-mono whitespace-nowrap ${subCls}`}>{fmt(t.monthlyAvg)}</td>
                          <td className="px-2 py-2">
                            <select
                              value={t.category}
                              onChange={e => updateTresCategory(t.idx, e.target.value)}
                              className={`${inputCls} text-xs ${t.category === 'recette' ? (darkMode ? 'text-teal-300' : 'text-teal-600') : t.category === 'exploitation' ? (darkMode ? 'text-orange-300' : 'text-orange-600') : ''}`}
                            >
                              <option value="recette">Recette</option>
                              <option value="exploitation">Exploit.</option>
                              <option value="ignore">Ignorer</option>
                            </select>
                          </td>
                          {repartitionTargets.map(rt => (
                            <td key={rt.value} className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                <input
                                  type="number" min="0" max="100" step="1"
                                  value={t.repartition?.[rt.value] ?? 0}
                                  onChange={e => updateRepartition(t.idx, rt.value, e.target.value)}
                                  disabled={t.category === 'ignore'}
                                  className={`rounded border px-1 py-0.5 text-xs text-center w-14 outline-none
                                    ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300 text-slate-800'}
                                    ${(t.repartition?.[rt.value] ?? 0) > 0 ? (darkMode ? 'border-amber-500 text-amber-300' : 'border-amber-400 text-amber-700 font-bold') : ''}
                                  `}
                                />
                                <span className={`text-xs ${subCls}`}>%</span>
                              </div>
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                              pctOk ? (darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-700')
                              : pctOver ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                              : (darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-200 text-slate-500')
                            }`}>{totalPct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4 : Preview ── */}
        {step === 4 && (
          <div>
            <h3 className={`text-lg font-black mb-4 ${textCls}`}>Aperçu de l'import</h3>

            {/* Personnel preview */}
            {agents.filter(a => a.assignedTo !== 'ignore').length > 0 && (
              <div className="mb-5">
                <h4 className={`font-black mb-2 ${textCls}`}>Personnel (CDI)</h4>
                <div className={`rounded-2xl overflow-hidden border ${borderCls}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={darkMode ? 'bg-zinc-700' : 'bg-slate-100'}>
                        <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Entité cible</th>
                        <th className={`px-3 py-2 text-center font-bold ${textCls}`}>Agents</th>
                        <th className={`px-3 py-2 text-right font-bold ${textCls}`}>Total salaires/mois</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(previewGroups).map(([key, grp], i) => (
                        <tr key={key} className={i % 2 === 0 ? rowEven : rowOdd}>
                          <td className={`px-3 py-2 font-bold ${textCls}`}>{targetLabel(key)}</td>
                          <td className={`px-3 py-2 text-center ${textCls}`}>{grp.agents}</td>
                          <td className={`px-3 py-2 text-right font-mono ${textCls}`}>{fmt(grp.totalSalaire)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={`text-xs mt-1 ${subCls}`}>Les postes déjà présents (même emploi) ne seront pas dupliqués. Le salaire existant sera conservé.</p>
              </div>
            )}

            {/* Trésorerie preview */}
            {tresItems.filter(t => t.category !== 'ignore').length > 0 && (
              <div className="mb-5">
                <h4 className={`font-black mb-2 ${textCls}`}>Postes budgétaires (Trésorerie)</h4>
                {Object.entries(previewTresGroups).map(([key, grp]) => (
                  <div key={key} className={`mb-3 p-3 rounded-2xl border ${borderCls}`}>
                    <p className={`font-bold mb-2 ${textCls}`}>{targetLabel(key)}</p>
                    {grp.recettes.length > 0 && (
                      <div className="mb-2">
                        <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Recettes ({grp.recettes.length})</p>
                        {grp.recettes.map((r, ri) => (
                          <div key={`${r.idx}-${ri}`} className="flex justify-between text-xs py-0.5">
                            <span className={subCls}>{r.label}{r.pct < 100 ? <span className={`ml-1 font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{r.pct}%</span> : null}</span>
                            <span className={`font-mono ${textCls}`}>{fmt(r.monthlyAvg * r.pct / 100)}/mois</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {grp.exploitation.length > 0 && (
                      <div>
                        <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Exploitation ({grp.exploitation.length})</p>
                        {grp.exploitation.map((r, ri) => (
                          <div key={`${r.idx}-${ri}`} className="flex justify-between text-xs py-0.5">
                            <span className={subCls}>{r.label}{r.pct < 100 ? <span className={`ml-1 font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{r.pct}%</span> : null}</span>
                            <span className={`font-mono ${textCls}`}>{fmt(r.monthlyAvg * r.pct / 100)}/mois</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <p className={`text-xs ${subCls}`}>Les éléments déjà présents (même libellé) ne seront pas dupliqués.</p>
              </div>
            )}

            {agents.filter(a => a.assignedTo !== 'ignore').length === 0 && tresItems.filter(t => t.category !== 'ignore').length === 0 && (
              <div className={`p-6 text-center rounded-2xl ${darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                Aucun élément sélectionné pour l'import. Revenez aux étapes précédentes pour assigner des données.
              </div>
            )}

            <div className={`mt-4 p-4 rounded-2xl border-2 ${darkMode ? 'bg-amber-900/20 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Avant de confirmer :</strong>
                  <ul className="mt-1 list-disc list-inside font-normal space-y-0.5">
                    <li>Les salaires déjà saisis dans l'application seront conservés</li>
                    <li>Les doublons (même emploi / même libellé) seront ignorés</li>
                    <li>Cette action modifiera les données en mémoire (pensez à sauvegarder ensuite)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5 : Done ── */}
        {step === 5 && importDone && importSummary && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Check className="text-teal-600" size={32} />
            </div>
            <h3 className={`text-2xl font-black mb-2 ${textCls}`}>Import terminé !</h3>
            <p className={`mb-6 ${subCls}`}>Les données ont été intégrées avec succès.</p>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-teal-900/30 border border-teal-700' : 'bg-teal-50 border border-teal-200'}`}>
                <p className={`text-3xl font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{importSummary.addedPersonnel}</p>
                <p className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>agents ajoutés</p>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-zinc-700 border border-zinc-600' : 'bg-slate-100 border border-slate-200'}`}>
                <p className={`text-3xl font-black ${subCls}`}>{importSummary.skippedPersonnel}</p>
                <p className={`text-xs font-bold ${subCls}`}>agents ignorés (existants)</p>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-3xl font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{importSummary.addedItems}</p>
                <p className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>postes budgétaires ajoutés</p>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-zinc-700 border border-zinc-600' : 'bg-slate-100 border border-slate-200'}`}>
                <p className={`text-3xl font-black ${subCls}`}>{importSummary.skippedItems}</p>
                <p className={`text-xs font-bold ${subCls}`}>postes ignorés (existants)</p>
              </div>
            </div>
            <p className={`text-sm ${subCls}`}>N'oubliez pas de sauvegarder le budget après fermeture.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-zinc-700">
          <button
            onClick={() => step > 1 && !importDone ? setStep(step - 1) : onClose(importDone)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${darkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            <ChevronLeft size={16} />
            {importDone ? 'Fermer & voir le tableau de bord' : step === 1 ? 'Annuler' : 'Précédent'}
          </button>

          {!importDone && (
            <button
              onClick={() => {
                if (step === 1) goStep2();
                else if (step === 2) goStep3();
                else if (step === 3) setStep(4);
                else if (step === 4) doImport();
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-colors ${
                step === 4
                  ? 'bg-teal-500 text-white hover:bg-teal-600'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
              disabled={step === 1 && !workbook}
            >
              {step === 4 ? (
                <><Check size={16} /> Confirmer l'import</>
              ) : (
                <>Suivant <ChevronRight size={16} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
