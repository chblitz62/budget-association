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
  const agents = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const nom = row[0];
    if (!nom || String(nom).trim() === '') continue;
    const emploi = String(row[3] || '').trim();
    const salaireMensuel = parseFloat(row[4]) || 0;
    const chargesAnnuelles = parseFloat(row[5]) || 0;
    if (!emploi) continue;
    agents.push({
      idx: agents.length + 1,
      emploi,
      salaireMensuel,
      chargesAnnuelles,
      assignedTo: autoAssign(emploi, serviceNames),
    });
  }
  return agents;
}

function parseTresorerie(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const items = [];
  let currentSection = '';
  const skipSections = new Set();
  let skipUntilNextSection = false;

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    const label = String(row[0] || '').trim();
    if (!label) continue;

    const lNorm = normalizeStr(label);

    // Detect section changes
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

    if (lNorm.includes('taxe sur les salaires') || lNorm.includes('participation') && lNorm.includes('formation')) {
      continue;
    }

    if (lNorm.includes('solde')) continue;

    if (skipUntilNextSection) continue;

    const vals = [];
    for (let c = 1; c <= 12; c++) {
      vals.push(parseFloat(row[c]) || 0);
    }
    const total = vals.reduce((a, b) => a + b, 0);

    // Section headers = rows where all value cols are 0 but label exists
    if (total === 0) continue;

    let category = 'ignore';
    if (currentSection === 'recette' || currentSection === 'entrees') category = 'recette';
    else if (currentSection === 'exploitation' || currentSection === 'sorties') category = 'exploitation';

    // Skip salary-related labels
    if (lNorm.includes('salariale') || lNorm.includes('salaires') || lNorm.includes('cotisations') || lNorm.includes('mutuelle')) continue;

    items.push({
      idx: items.length + 1,
      label,
      annualTotal: total,
      monthlyAvg: total / 12,
      category,
      serviceTarget: 'direction',
    });
  }
  return items;
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
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step > s.n ? <Check size={14} /> : s.n}
            </div>
            <span className={`text-xs mt-0.5 font-bold ${step === s.n ? (darkMode ? 'text-amber-400' : 'text-amber-600') : darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mb-4 ${step > s.n ? 'bg-teal-400' : darkMode ? 'bg-gray-700' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function WizardImportBP({ onClose, services, poleSupport, direction, setServices, setPoleSupport, setDirection, darkMode }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [workbook, setWorkbook] = useState(null);
  const [sheetsFound, setSheetsFound] = useState({ cdi: false, tresorerie: false });
  const [agents, setAgents] = useState([]);
  const [tresItems, setTresItems] = useState([]);
  const [importDone, setImportDone] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const fileRef = useRef();

  const serviceNames = services.map(s => s.nom);
  const allTargets = [
    { value: 'ignore', label: '— Ignorer —' },
    { value: 'direction', label: 'Direction' },
    { value: 'poleSupport', label: 'Pôle Support' },
    ...services.map((s, i) => ({ value: `service_${i}`, label: s.nom })),
  ];
  const allServiceTargets = [
    { value: 'direction', label: 'Global (Direction)' },
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
    if (sheetsFound.cdi) {
      const sheetName = workbook.SheetNames.find(n => n.trim() === 'CDI');
      try {
        const parsed = parseCDI(workbook.Sheets[sheetName], serviceNames);
        setAgents(parsed);
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
    if (sheetsFound.tresorerie) {
      const sheetName = workbook.SheetNames.find(n => {
        const nn = n.trim().toLowerCase();
        return nn.includes('tresorerie') || nn.includes('trésorerie');
      });
      try {
        const parsed = parseTresorerie(workbook.Sheets[sheetName]);
        setTresItems(parsed);
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

  const updateTresTarget = (idx, val) => {
    setTresItems(prev => prev.map(t => t.idx === idx ? { ...t, serviceTarget: val } : t));
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
      const key = t.serviceTarget;
      if (!tresGroups[key]) tresGroups[key] = { recettes: [], exploitation: [] };
      tresGroups[key][t.category === 'recette' ? 'recettes' : 'exploitation'].push(t);
    });

    return { groups, tresGroups };
  };

  const targetLabel = (key) => {
    if (key === 'direction') return 'Direction';
    if (key === 'poleSupport') return 'Pôle Support';
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
      };
      targetPersonnel.push(newEntry);
      addedPersonnel++;
    });

    // Trésorerie import
    tresItems.filter(t => t.category !== 'ignore').forEach((item) => {
      const key = item.serviceTarget;
      let targetArray, targetEntity;
      const isRecette = item.category === 'recette';
      const fieldName = isRecette ? 'recettes' : 'exploitation';

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
      if (exists) {
        skippedItems++;
        return;
      }
      const newItem = {
        id: Date.now() + item.idx + Math.random() * 1000 | 0,
        nom: item.label,
        montant: Math.round(item.monthlyAvg),
      };
      targetArray.push(newItem);
      addedItems++;
    });

    setDirection(directionUpdated);
    setPoleSupport(poleSupportUpdated);
    setServices(servicesUpdated);

    setImportSummary({ addedPersonnel, skippedPersonnel, addedItems, skippedItems });
    setImportDone(true);
    setStep(5);
  };

  const { groups: previewGroups, tresGroups: previewTresGroups } = step >= 4 ? buildPreview() : { groups: {}, tresGroups: {} };

  const cardCls = darkMode ? 'bg-gray-800' : 'bg-white';
  const textCls = darkMode ? 'text-white' : 'text-slate-800';
  const subCls = darkMode ? 'text-gray-400' : 'text-slate-500';
  const rowEven = darkMode ? 'bg-gray-750' : 'bg-slate-50';
  const rowOdd = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderCls = darkMode ? 'border-gray-700' : 'border-slate-200';
  const inputCls = `rounded-lg border px-2 py-1 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`;

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
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}>
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

        {/* ── STEP 1 : Upload ── */}
        {step === 1 && (
          <div>
            <h3 className={`text-lg font-black mb-4 ${textCls}`}>Charger le fichier Excel</h3>
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:border-amber-500 hover:bg-amber-900/10' : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50'}`}
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <Upload className={`mx-auto mb-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} size={36} />
              <p className={`font-bold mb-1 ${textCls}`}>Glisser-déposer ou cliquer pour sélectionner</p>
              <p className={`text-sm ${subCls}`}>Fichier .xlsx — Budget prévisionnel analytique AFERTES</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>

            {workbook && (
              <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`font-bold mb-2 ${textCls}`}>Feuilles détectées :</p>
                <div className="flex flex-wrap gap-2">
                  {workbook.SheetNames.map(n => (
                    <span key={n} className={`px-3 py-1 rounded-full text-sm font-bold ${
                      n.trim() === 'CDI' || n.trim().toLowerCase().includes('tresorerie') || n.trim().toLowerCase().includes('trésorerie')
                        ? 'bg-teal-100 text-teal-700'
                        : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-slate-200 text-slate-500'
                    }`}>{n}</span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-2 p-2 rounded-xl ${sheetsFound.cdi ? (darkMode ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700') : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-slate-100 text-slate-400')}`}>
                    {sheetsFound.cdi ? <Check size={14} /> : <X size={14} />}
                    <span className="text-sm font-bold">Feuille CDI</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-xl ${sheetsFound.tresorerie ? (darkMode ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700') : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-slate-100 text-slate-400')}`}>
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
              <div className={`p-6 text-center rounded-2xl ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                {sheetsFound.cdi ? 'Aucun agent valide trouvé dans la feuille CDI.' : 'Feuille CDI non trouvée dans le fichier.'}
              </div>
            )}
            {agents.length > 0 && (
              <>
                <div className={`rounded-2xl overflow-hidden border ${borderCls}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={darkMode ? 'bg-gray-700' : 'bg-slate-100'}>
                        <th className={`px-3 py-2 text-left font-bold ${textCls}`}>#</th>
                        <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Emploi</th>
                        <th className={`px-3 py-2 text-right font-bold ${textCls}`}>Salaire mensuel</th>
                        <th className={`px-3 py-2 text-right font-bold ${textCls}`}>Charges annuelles</th>
                        <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Assigner à</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((a, i) => (
                        <tr key={a.idx} className={i % 2 === 0 ? rowEven : rowOdd}>
                          <td className={`px-3 py-2 font-bold ${subCls}`}>Agent #{a.idx}</td>
                          <td className={`px-3 py-2 ${textCls}`}>{a.emploi}</td>
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
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Summary footer */}
                <div className={`mt-3 p-3 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-slate-50'}`}>
                  <p className={`text-sm font-bold mb-2 ${textCls}`}>Récapitulatif par entité :</p>
                  <div className="flex flex-wrap gap-2">
                    {allTargets.filter(t => t.value !== 'ignore').map(t => {
                      const grpAgents = agents.filter(a => a.assignedTo === t.value);
                      const total = grpAgents.reduce((s, a) => s + a.salaireMensuel, 0);
                      if (grpAgents.length === 0) return null;
                      return (
                        <span key={t.value} className={`px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white border border-slate-200 text-slate-700'}`}>
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
              <div className={`p-6 text-center rounded-2xl ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                {sheetsFound.tresorerie ? 'Aucun élément exploitable trouvé dans la feuille Trésorerie.' : 'Feuille Trésorerie auto (2026) non trouvée dans le fichier.'}
              </div>
            )}
            {tresItems.length > 0 && (
              <div className={`rounded-2xl overflow-hidden border ${borderCls}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={darkMode ? 'bg-gray-700' : 'bg-slate-100'}>
                      <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Libellé</th>
                      <th className={`px-3 py-2 text-right font-bold ${textCls}`}>Total annuel</th>
                      <th className={`px-3 py-2 text-right font-bold ${textCls}`}>Moy. mensuelle</th>
                      <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Catégorie</th>
                      <th className={`px-3 py-2 text-left font-bold ${textCls}`}>Service cible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tresItems.map((t, i) => (
                      <tr key={t.idx} className={i % 2 === 0 ? rowEven : rowOdd}>
                        <td className={`px-3 py-2 ${textCls}`}>{t.label}</td>
                        <td className={`px-3 py-2 text-right font-mono ${textCls}`}>{fmt(t.annualTotal)}</td>
                        <td className={`px-3 py-2 text-right font-mono ${subCls}`}>{fmt(t.monthlyAvg)}</td>
                        <td className="px-3 py-2">
                          <select
                            value={t.category}
                            onChange={e => updateTresCategory(t.idx, e.target.value)}
                            className={`${inputCls} ${t.category === 'recette' ? 'text-teal-600' : t.category === 'exploitation' ? 'text-orange-600' : ''}`}
                          >
                            <option value="recette">Recette</option>
                            <option value="exploitation">Exploitation</option>
                            <option value="ignore">Ignorer</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={t.serviceTarget}
                            onChange={e => updateTresTarget(t.idx, e.target.value)}
                            className={inputCls}
                            disabled={t.category === 'ignore'}
                          >
                            {allServiceTargets.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
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
                      <tr className={darkMode ? 'bg-gray-700' : 'bg-slate-100'}>
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
                        {grp.recettes.map(r => (
                          <div key={r.idx} className="flex justify-between text-xs py-0.5">
                            <span className={subCls}>{r.label}</span>
                            <span className={`font-mono ${textCls}`}>{fmt(r.monthlyAvg)}/mois</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {grp.exploitation.length > 0 && (
                      <div>
                        <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Exploitation ({grp.exploitation.length})</p>
                        {grp.exploitation.map(r => (
                          <div key={r.idx} className="flex justify-between text-xs py-0.5">
                            <span className={subCls}>{r.label}</span>
                            <span className={`font-mono ${textCls}`}>{fmt(r.monthlyAvg)}/mois</span>
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
              <div className={`p-6 text-center rounded-2xl ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
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
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-slate-100 border border-slate-200'}`}>
                <p className={`text-3xl font-black ${subCls}`}>{importSummary.skippedPersonnel}</p>
                <p className={`text-xs font-bold ${subCls}`}>agents ignorés (existants)</p>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-3xl font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{importSummary.addedItems}</p>
                <p className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>postes budgétaires ajoutés</p>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-slate-100 border border-slate-200'}`}>
                <p className={`text-3xl font-black ${subCls}`}>{importSummary.skippedItems}</p>
                <p className={`text-xs font-bold ${subCls}`}>postes ignorés (existants)</p>
              </div>
            </div>
            <p className={`text-sm ${subCls}`}>N'oubliez pas de sauvegarder le budget après fermeture.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => step > 1 && !importDone ? setStep(step - 1) : onClose()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            <ChevronLeft size={16} />
            {importDone ? 'Fermer' : step === 1 ? 'Annuler' : 'Précédent'}
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
