import React from 'react';
import { Plus, Trash2, Copy, X, Users, Euro, Upload, TrendingDown, TrendingUp, CheckCircle, AlertTriangle, AlertCircle, FileSpreadsheet, GripVertical, ChevronDown, ChevronUp, UserCheck, UserX, UserMinus, Zap, Tag, MapPin, GraduationCap, Calendar, BarChart3, Building, Building2, Banknote, Landmark, Layers, Cog, Target, Calculator, ExternalLink, FileText, Lock } from 'lucide-react';
import { exportFicheService } from '../../utils/pdfExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import NumericInput from '../ui/NumericInput';
import HelpIcon from '../ui/HelpIcon';
import InfoTooltip from '../ui/Tooltip';
import PoolRHManager from '../PoolRHManager';
import {
  validerTaux, validerETP, validerMontant, validerDuree, validerUnites,
  calculerPresenceAgent, calculerPartPoolRH, calculerSalaireAnnuel,
} from '../../utils/calculations';
import {
  CHARGES_PATRONALES, MOIS, SITES, CHARGES_VACATAIRE, SEUIL_HEURES_VACATAIRE, SEUIL_RATIO_VACATAIRE,
  COMPTES_IMMO, calculerStatsFormation, calculerEffectifActuel, calculerTotalRealisations, defaultRealisations,
  detecterComptePCG,
} from '../../utils/constants';

/**
 * @typedef {import('../../types/index')} Types
 * @typedef {{
 *   darkMode: boolean,
 *   direction: Types.Direction,
 *   setDirection: (d: Types.Direction) => void,
 *   poleSupport: Types.PoleSupport,
 *   setPoleSupport: (ps: Types.PoleSupport) => void,
 *   services: Types.Service[],
 *   setServices: (svcs: Types.Service[]) => void,
 *   poolRH: Types.PoolRHAgent[],
 *   setPoolRH: (pool: Types.PoolRHAgent[]) => void,
 *   globalParams: Types.GlobalParams,
 *   getBudgetService: (s: Types.Service) => Types.BudgetResult,
 *   getBudgetDirection: () => Types.BudgetResult,
 *   getBudgetPoleSupport: () => Types.BudgetResult,
 *   planningAbsences: Types.PlanningAbsences,
 *   dragId: string|null,
 *   setDragId: (id: string|null) => void,
 *   dragOverId: string|null,
 *   setDragOverId: (id: string|null) => void,
 *   simulationsOuvertes: Set<string|number>,
 *   setSimulationsOuvertes: (s: Set<string|number>) => void,
 *   fiPanelsOuverts: Set<string>,
 *   setFiPanelsOuverts: (s: Set<string>) => void,
 *   setFiDialog: (d: any) => void,
 *   setSaisonnaliteDialog: (d: any) => void,
 *   directionPosition: number,
 *   setDirectionPosition: (n: number) => void,
 *   poleSupportPosition: number,
 *   setPoleSupportPosition: (n: number) => void,
 *   focusedAgentId: string|number|null,
 *   navigateToRHAgent: (id: string|number) => void,
 *   privacyMode: boolean,
 *   setShowWizardBP: (v: boolean) => void,
 *   setShowWizardSetup: (v: boolean) => void,
 *   pilotageSites: Types.PilotageSite[],
 *   roles: Types.RolePersonnel[],
 *   calcSalarieFormateur: (id: string|number) => number,
 * }} TabBudgetProps
 * @param {TabBudgetProps} props
 */
export default function TabBudget({
  darkMode,
  direction,
  setDirection,
  poleSupport,
  setPoleSupport,
  services,
  setServices,
  poolRH,
  setPoolRH,
  globalParams,
  getBudgetService,
  getBudgetDirection,
  getBudgetPoleSupport,
  planningAbsences,
  dragId,
  setDragId,
  dragOverId,
  setDragOverId,
  simulationsOuvertes,
  setSimulationsOuvertes,
  fiPanelsOuverts,
  setFiPanelsOuverts,
  setFiDialog,
  setSaisonnaliteDialog,
  directionPosition,
  setDirectionPosition,
  poleSupportPosition,
  setPoleSupportPosition,
  focusedAgentId,
  navigateToRHAgent,
  privacyMode,
  setShowWizardBP,
  setShowWizardSetup,
  pilotageSites,
  roles,
  calcSalarieFormateur,
}) {
  const estGele = globalParams?.statutBudget === 'gele';

  return (
    <>

{estGele && (
  <div className="flex items-center gap-3 px-5 py-3 mb-6 rounded-2xl bg-violet-100 border border-violet-300 text-violet-800 font-semibold text-sm no-print">
    <Lock size={16} className="shrink-0" />
    Budget gelé — lecture seule. Modifiez le statut dans l'onglet Paramètres pour débloquer.
  </div>
)}

{services.length === 0 && (
  <div className={`rounded-3xl border-2 border-dashed p-16 text-center mb-8 ${darkMode ? 'border-zinc-700 bg-zinc-900/40' : 'border-slate-200 bg-slate-50/50'}`}>
    <Building2 size={40} className={`mx-auto mb-4 ${darkMode ? 'text-zinc-600' : 'text-slate-300'}`} />
    <h3 className={`text-lg font-black mb-2 ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>Aucun service défini</h3>
    <p className={`text-sm mb-6 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Ajoutez un service ou importez un budget prévisionnel pour commencer.</p>
    <div className="flex gap-3 justify-center flex-wrap">
      <button onClick={() => setShowWizardBP(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 transition-all">
        <Upload size={15} /> Importer un BP Excel
      </button>
      <button onClick={() => setShowWizardSetup(true)} className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-sm border transition-all ${darkMode ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-white'}`}>
        <Plus size={15} /> Démarrer depuis zéro
      </button>
    </div>
  </div>
)}

{/* DIRECTION + SERVICES + PÔLE SUPPORT : section unifiée réordonnable */}
<div id="services-section" className="space-y-8">
  {(() => {
    const makeAbandons = () => ({ janvier:0,fevrier:0,mars:0,avril:0,mai:0,juin:0,juillet:0,aout:0,septembre:0,octobre:0,novembre:0,decembre:0 });
    const makeRepartitionFI = () => ({ janvier:0,fevrier:0,mars:0,avril:0,mai:0,juin:0,juillet:0,aout:0,septembre:0,octobre:0,novembre:0,decembre:0 });
    const moisKeysFI = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
    const moisLabelsFI = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    // Construction de la liste unifiée pour le drag-and-drop
    // Positions: 0..services.length+1 (services.length+2 slots total)
    const buildOrder = () => {
      const N = services.length;
      // Clamp positions to valid range
      const dirPos = Math.min(directionPosition, N + 1);
      const psPos  = Math.min(poleSupportPosition, N + 1);
      // Start with service ids in current array order
      const serviceIds = services.map(s => s.id);
      // Build order by inserting direction and pole-support at their positions
      // We iterate over (N+2) slots and fill them
      const slots = [...serviceIds]; // N slots
      // Insert direction at dirPos (clamped)
      const clampedDirPos = Math.min(dirPos, slots.length);
      slots.splice(clampedDirPos, 0, 'direction');
      // Insert pole-support at psPos (relative to original N slots, then adjust for direction insertion)
      const adjustedPsPos = psPos >= clampedDirPos ? Math.min(psPos + 1, slots.length) : Math.min(psPos, slots.length);
      slots.splice(adjustedPsPos, 0, 'pole-support');
      return slots;
    };
    const handleUnifiedDrop = (targetId) => {
      if (dragId === targetId) return;
      const order = buildOrder();
      const fromIdx = order.indexOf(dragId);
      const toIdx   = order.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return;
      const newOrder = [...order];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      const newDirPos = newOrder.indexOf('direction');
      const newPSPos  = newOrder.indexOf('pole-support');
      const newServices = newOrder.filter(id => id !== 'direction' && id !== 'pole-support').map(id => services.find(s => s.id === id));
      setDirectionPosition(newDirPos);
      setPoleSupportPosition(newPSPos);
      setServices(newServices);
      setDragId(null);
      setDragOverId(null);
    };

    const orderedItems = buildOrder();
    const items = [];

    for (let pos = 0; pos < orderedItems.length; pos++) {
      const itemId = orderedItems[pos];

      // ── DIRECTION ──────────────────────────────────────────────
      if (itemId === 'direction') {
        const isDirDragging = dragId === 'direction';
        const isDirOver     = dragOverId === 'direction' && !isDirDragging;
        items.push(
          <div
            key="direction"
            id="direction"
            draggable
            onDragStart={() => setDragId('direction')}
            onDragOver={(e) => { e.preventDefault(); setDragOverId('direction'); }}
            onDrop={() => handleUnifiedDrop('direction')}
            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
            className={`rounded-3xl shadow-xl border p-8 print-avoid-break transition-all duration-300 backdrop-blur-md
              ${isDirDragging ? 'opacity-40 scale-95' : 'hover:shadow-2xl'}
              ${isDirOver ? 'ring-2 ring-teal-400 ring-offset-4' : ''}
              ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}
          >
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`cursor-grab active:cursor-grabbing p-2 rounded-xl no-print transition-colors ${darkMode ? 'bg-white/5 text-gray-500 hover:text-gray-300' : 'bg-slate-100 text-slate-300 hover:text-slate-500'}`} title="Déplacer Siège"><GripVertical size={20} /></div>
                <div className="flex flex-col gap-0.5 no-print">
                  <button disabled={pos === 0} onClick={() => setDirectionPosition(p => Math.max(0, p-1))} className={`p-1 rounded-lg transition-colors ${pos===0?'opacity-20 cursor-not-allowed':'hover:bg-teal-500/10 text-teal-500'}`}><ChevronUp size={14}/></button>
                  <button disabled={pos === orderedItems.length - 1} onClick={() => setDirectionPosition(p => Math.min(services.length + 1, p+1))} className={`p-1 rounded-lg transition-colors ${pos===orderedItems.length-1?'opacity-20 cursor-not-allowed':'hover:bg-teal-500/10 text-teal-500'}`}><ChevronDown size={14}/></button>
                </div>
                <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 shadow-inner">
                  <Building2 size={32} />
                </div>
                <div>
                  <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Siège</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 font-bold">{direction.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Siège administratif</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Budget annuel estimé</div>
                <span className={`text-3xl font-black font-mono-numbers ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(getBudgetDirection().total).toLocaleString()} <span className="text-lg opacity-50 font-sans">€</span></span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`font-black flex items-center gap-2 text-sm tracking-wide ${darkMode ? 'text-white' : 'text-slate-700'}`}><Users size={18} className="text-teal-500" /> ÉQUIPE DIRECTION</h3>
                  <button onClick={() => setDirection({...direction, personnel: [...direction.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: false, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }]})} 
                          className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 no-print"><Plus size={18} /></button>
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {direction.personnel.map((p, pIdx) => (
                    <div key={p.id} id={`agent-budget-${p.id}`} className={`p-3 rounded-xl border group relative transition-all duration-700 ${focusedAgentId === p.id ? (darkMode ? 'ring-2 ring-yellow-400 bg-yellow-900/30' : 'ring-2 ring-yellow-400 bg-yellow-50') : (darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200')}`}>
                      <button onClick={() => setDirection({...direction, personnel: direction.personnel.filter(x => x.id !== p.id)})} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex flex-col gap-0 no-print">
                          <button disabled={pIdx===0} onClick={() => { const a=[...direction.personnel]; a.splice(pIdx-1,0,a.splice(pIdx,1)[0]); setDirection({...direction,personnel:a}); }} className={`p-0.5 rounded ${pIdx===0?'opacity-20':'hover:bg-teal-100'}`}><ChevronUp size={10}/></button>
                          <button disabled={pIdx===direction.personnel.length-1} onClick={() => { const a=[...direction.personnel]; a.splice(pIdx+1,0,a.splice(pIdx,1)[0]); setDirection({...direction,personnel:a}); }} className={`p-0.5 rounded ${pIdx===direction.personnel.length-1?'opacity-20':'hover:bg-teal-100'}`}><ChevronDown size={10}/></button>
                        </div>
                        <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''} ${privacyMode ? 'blur-sm select-none pointer-events-none' : ''}`} value={p.titre} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)})} />
                        <input placeholder="Matr." title="Matricule RH (mapping Dolibarr)" className={`no-print text-[10px] w-16 rounded px-1 py-0.5 outline-none border font-mono ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-400 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-500 placeholder-slate-300'} ${p.matricule ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-400 text-violet-700') : ''} opacity-0 group-hover:opacity-100 transition-opacity`} value={p.matricule || ''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, matricule: e.target.value} : x)})} />
                        <button onClick={() => navigateToRHAgent(p.id)} className={`no-print p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-gray-500 text-teal-400' : 'hover:bg-teal-50 text-teal-600'}`} title="Voir dans RH"><ExternalLink size={12} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                        <div><InfoTooltip content="ETP = Équivalent Temps Plein. 1 = temps complet, 0.5 = mi-temps. Impacte directement le coût employeur." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</label></InfoTooltip><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.etp} onChange={(e) => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)})} /></div>
                        <div><InfoTooltip content="Salaire brut mensuel en euros (hors charges patronales et hors prime Ségur). Coût employeur = salaire × 12 × ETP × 1,42." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Salaire brut/mois</label></InfoTooltip><NumericInput className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.salaire} onChange={v => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, salaire: v} : x)})} /></div>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.role || 'administratif'} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)})}>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                        <InfoTooltip content="RQTH = Reconnaissance en Qualité de Travailleur Handicapé. Permet à l'employeur de comptabiliser ce poste dans l'obligation OETH (6% de l'effectif)." darkMode={darkMode} position="top"><label className="flex items-center gap-1 cursor-help"><input type="checkbox" checked={p.rqth || false} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)})} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label></InfoTooltip>
                        <InfoTooltip content="Prime Ségur Médico-Social : supplément brut mensuel ajouté au salaire, soumis aux charges patronales. Montant configurable dans les paramètres globaux." darkMode={darkMode} position="top"><label className="flex items-center gap-1 cursor-help"><input type="checkbox" checked={!!p.segur} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)})} /><span className={`text-xs ${p.segur ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>Ségur {p.segur ? `(+${p.segur === true ? (globalParams.montantSegurETP ?? 238) : (parseFloat(p.segur) || 0)} €/m)` : ''}</span></label></InfoTooltip>
                        <div className="flex items-center gap-1">
                          <label className="flex items-center gap-0.5 cursor-pointer" title="Prise en charge Région : inclure ce salarié dans le calcul de subvention régionale (onglet DAF)"><input type="checkbox" checked={!!p.eligibleSubvention} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, eligibleSubvention: e.target.checked, tauxSubvRegion: e.target.checked ? (x.tauxSubvRegion ?? 100) : x.tauxSubvRegion} : x)})} /><span className={`text-xs font-semibold flex items-center gap-0.5 ${p.eligibleSubvention ? (darkMode ? 'text-violet-400' : 'text-violet-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}><Landmark size={10} />Région</span></label>
                          {p.eligibleSubvention && (<><input type="number" min="0" max="100" className={`w-11 text-right text-xs rounded px-1 py-0.5 font-bold border ${darkMode ? 'bg-violet-900/40 border-violet-600 text-violet-200' : 'bg-violet-50 border-violet-300 text-violet-700'}`} value={p.tauxSubvRegion ?? 100} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, tauxSubvRegion: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))} : x)})} /><span className={`text-[10px] ${darkMode ? 'text-violet-400' : 'text-violet-500'}`}>%</span></>)}
                        </div>
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="Année de naissance — utilisée pour la pyramide des âges et les alertes départs en retraite." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Né(e) en</span></InfoTooltip>
                          <input type="number" min="1940" max="2005" placeholder="1980"
                            className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                            value={p.anneeNaissance || ''}
                            onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, anneeNaissance: parseInt(e.target.value) || 0} : x)})}
                          />
                          <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Entrée</span>
                          <input type="number" min="1990" max="2026" placeholder="2020"
                            className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                            value={p.dateEntree || ''}
                            onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, dateEntree: parseInt(e.target.value) || 0} : x)})}
                          />
                          {p.dateEntree > 0 && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                              {2026 - p.dateEntree} an{2026 - p.dateEntree > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap mt-1">
                        <select className={`rounded px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.typeContrat || 'CDI'} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, typeContrat: e.target.value, dateFinContrat: e.target.value === 'CDI' ? '' : x.dateFinContrat} : x)})}>
                          <option value="CDI">CDI</option>
                          <option value="CDD">CDD</option>
                          <option value="Apprentissage">Apprentissage</option>
                          <option value="Stage">Stage</option>
                          <option value="Vacataire">Vacataire</option>
                          <option value="Autre">Autre</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="RTT = Réduction du Temps de Travail. Jours de repos accordés en compensation des heures supplémentaires liées à l'annualisation du temps de travail." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>RTT</span></InfoTooltip>
                          <input type="number" min="0" max="30" step="0.5" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.nbJoursRTT ?? 0} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, nbJoursRTT: parseFloat(e.target.value) || 0} : x)})} />
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="CP = Congés Payés annuels. Minimum légal : 25 jours (5 semaines). Utilisé pour calculer le taux de présence effectif de l'agent." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CP</span></InfoTooltip>
                          <input type="number" min="0" max="50" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.joursConges ?? 25} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, joursConges: parseInt(e.target.value) || 25} : x)})} />
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                        </div>
                        {(p.typeContrat && p.typeContrat !== 'CDI') && (
                          <div className="flex items-center gap-1">
                            <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                            <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.dateFinContrat || ''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)})} />
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="Taux de charges patronales forcé (%). Si vide, l'outil calcule automatiquement le taux réel incluant l'allègement Fillon." darkMode={darkMode} position="top">
                            <span className={`cursor-help font-bold ${p.tauxChargesManuel > 0 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Ch.%</span>
                          </InfoTooltip>
                          <input type="number" min="0" max="100" step="0.1" placeholder="auto"
                            className={`w-14 text-center rounded px-1 py-0.5 text-xs font-bold ${p.tauxChargesManuel > 0 ? (darkMode ? 'bg-amber-900/40 border border-amber-600 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                            value={p.tauxChargesManuel || ''}
                            onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, tauxChargesManuel: e.target.value === '' ? null : parseFloat(e.target.value)} : x)})}
                          />
                        </div>
                        <label className="flex items-center gap-1 cursor-pointer" title="Poste à pourvoir — le salaire sera proraté selon la date de début prévue">
                          <input type="checkbox" checked={!!p.estPosteAPourvoir} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, estPosteAPourvoir: e.target.checked} : x)})} />
                          <span className={`text-xs font-semibold ${p.estPosteAPourvoir ? 'text-orange-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>En recrutement</span>
                        </label>
                        {p.estPosteAPourvoir && (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début prévu</span>
                            <input type="month" className={`rounded px-1 py-0.5 text-xs ${darkMode ? 'bg-orange-900/40 border border-orange-600 text-orange-300' : 'bg-orange-50 border border-orange-300 text-orange-700'}`}
                              value={p.dateDebutPrevue || ''}
                              onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, dateDebutPrevue: e.target.value} : x)})} />
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-semibold ${p.moisPrime ? (darkMode ? 'text-purple-400' : 'text-purple-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Prime</span>
                          <select className={`rounded px-1 py-0.5 text-xs ${p.moisPrime ? (darkMode ? 'bg-purple-900/40 border border-purple-600 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                            value={p.moisPrime || ''}
                            onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, moisPrime: e.target.value ? parseInt(e.target.value) : null, montantPrime: e.target.value ? (x.montantPrime || 0) : 0} : x)})}>
                            <option value="">Aucune</option>
                            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, idx) => (
                              <option key={idx + 1} value={idx + 1}>{m}</option>
                            ))}
                          </select>
                          {p.moisPrime && (
                            <>
                              <NumericInput className={`w-20 rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-purple-900/40 border border-purple-600 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700'}`}
                                value={p.montantPrime || 0}
                                onChange={v => setDirection({...direction, personnel: direction.personnel.map(x => x.id === p.id ? {...x, montantPrime: v} : x)})} />
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€ brut</span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Absences */}
                      <details className="mt-2">
                        <summary className={`text-xs cursor-pointer select-none flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Calendar size={12} />
                          {(p.absences||[]).length > 0 ? `${(p.absences||[]).length} période(s)` : 'Congés / Arrêts'}
                        </summary>
                        <div className="mt-1.5 space-y-1 pl-1">
                          {(p.absences||[]).map(ab => (
                            <div key={ab.id} className={`flex flex-wrap items-center gap-1 text-xs rounded-lg px-2 py-1 ${ab.type==='conge'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-50 border border-blue-200'):ab.type==='maladie'?(darkMode?'bg-red-900/40 text-red-300':'bg-red-50 border border-red-200'):ab.type==='rtt'?(darkMode?'bg-purple-900/40 text-purple-300':'bg-purple-50 border border-purple-200'):(darkMode?'bg-orange-900/40 text-orange-300':'bg-orange-50 border border-orange-200')}`}>
                              <select className="bg-transparent font-bold outline-none text-xs" value={ab.type} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,type:e.target.value}:a)}:x)})}>
                                <option value="conge">Congé</option>
                                <option value="maladie">Maladie</option>
                                <option value="rtt">RTT</option>
                                <option value="arret">Arrêt travail</option>
                              </select>
                              <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateDebut||''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateDebut:e.target.value}:a)}:x)})} />
                              <span>→</span>
                              <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateFin||''} onChange={e => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateFin:e.target.value}:a)}:x)})} />
                              <button onClick={() => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).filter(a=>a.id!==ab.id)}:x)})} className="ml-auto text-red-400 hover:text-red-600 no-print"><X size={12}/></button>
                            </div>
                          ))}
                          <button onClick={() => setDirection({...direction, personnel: direction.personnel.map(x => x.id===p.id?{...x,absences:[...(x.absences||[]),{id:Date.now(),type:'conge',dateDebut:'',dateFin:''}]}:x)})} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded border border-dashed no-print ${darkMode?'border-gray-500 text-gray-400 hover:text-gray-200':'border-slate-300 text-slate-400 hover:text-slate-600'}`}>
                            <Plus size={10}/> Ajouter
                          </button>
                        </div>
                      </details>
                      {(() => {
                        const pr = calculerPresenceAgent(p, 'Direction', planningAbsences, 2026);
                        if (pr.absences.total === 0) return null;
                        const delta = parseFloat(p.etp) - pr.etpReel;
                        return (
                          <div className={`mt-1.5 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'}`} title={`${pr.absences.total}j d'absence dans le planning`}>
                            <UserMinus size={11} /> ETP réel {pr.etpReel.toFixed(2)} <span className="opacity-60">(-{delta.toFixed(2)})</span>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Landmark size={20} className="text-teal-500" /> Charges siège</h3>
                  <button onClick={() => setDirection({ ...direction, chargesSiege: [...(direction.chargesSiege || []), { id: Date.now(), nom: 'Nouvelle charge', montant: 0 }] })} className="bg-teal-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {(direction.chargesSiege || []).map((c, cIdx) => (
                    <div key={c.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                      <button onClick={() => setDirection({ ...direction, chargesSiege: direction.chargesSiege.filter(x => x.id !== c.id) })} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex flex-col gap-0 no-print">
                          <button disabled={cIdx===0} onClick={() => { const a=[...(direction.chargesSiege||[])]; a.splice(cIdx-1,0,a.splice(cIdx,1)[0]); setDirection({...direction,chargesSiege:a}); }} className={`p-0.5 rounded ${cIdx===0?'opacity-20':'hover:bg-teal-100'}`}><ChevronUp size={10}/></button>
                          <button disabled={cIdx===(direction.chargesSiege||[]).length-1} onClick={() => { const a=[...(direction.chargesSiege||[])]; a.splice(cIdx+1,0,a.splice(cIdx,1)[0]); setDirection({...direction,chargesSiege:a}); }} className={`p-0.5 rounded ${cIdx===(direction.chargesSiege||[]).length-1?'opacity-20':'hover:bg-teal-100'}`}><ChevronDown size={10}/></button>
                        </div>
                        <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={c.nom} onChange={e => setDirection({ ...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? { ...x, nom: e.target.value } : x) })} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Euro className="text-teal-500" size={16} />
                        <input type="number" className={`w-28 text-right font-black text-lg rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={c.montant} onChange={e => setDirection({ ...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? { ...x, montant: validerMontant(e.target.value) } : x) })} />
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                        {globalParams.gestionTVA && (
                          <>
                            <button title="Basculer HT / TTC" onClick={() => setDirection({...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? {...x, saisieType: (c.saisieType||'HT')==='HT'?'TTC':'HT'} : x)})}
                              className={`text-[10px] font-black px-1 py-0.5 rounded border ${(c.saisieType||'HT')==='TTC'?(darkMode?'bg-amber-900/40 border-amber-600 text-amber-300':'bg-amber-100 border-amber-400 text-amber-700'):(darkMode?'bg-gray-600 border-gray-500 text-gray-300':'bg-white border-slate-300 text-slate-500')}`}>
                              {c.saisieType||'HT'}
                            </button>
                            <button title="TVA récupérable / non récupérable" onClick={() => setDirection({...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? {...x, tvaRecuperable: c.tvaRecuperable===false?true:false} : x)})}
                              className={`text-[10px] font-black px-1 py-0.5 rounded border ${c.tvaRecuperable===false?(darkMode?'bg-red-900/40 border-red-600 text-red-300':'bg-red-100 border-red-400 text-red-700'):(darkMode?'bg-green-900/40 border-green-600 text-green-300':'bg-green-100 border-green-400 text-green-700')}`}>
                              {c.tvaRecuperable===false?'TVA✗':'TVA♻'}
                            </button>
                          </>
                        )}
                        <Tag size={11} className={`${darkMode ? 'text-zinc-500' : 'text-slate-300'}`} />
                        <input
                          placeholder="tag projet"
                          className={`text-[11px] w-24 rounded px-1.5 py-0.5 outline-none border ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${c.tagProjet ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-300 text-violet-700') : ''}`}
                          value={c.tagProjet || ''}
                          onChange={e => setDirection({...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? {...x, tagProjet: e.target.value} : x)})}
                        />
                        <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-xs rounded px-2 py-1 border no-print ${c.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={c.realise ?? ''} onChange={e => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setDirection({...direction, chargesSiege: direction.chargesSiege.map(x => x.id === c.id ? {...x, realise: v} : x)}); }} />
                        {c.realise != null && (() => { const ecart = c.realise - c.montant; return <span className={`text-[10px] font-bold no-print ${ecart > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{ecart > 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                      </div>
                    </div>
                  ))}
                  {(direction.chargesSiege || []).length === 0 && <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune charge — cliquez + pour en ajouter</p>}
                </div>
                {(direction.chargesSiege || []).length > 0 && (
                  <div className={`mt-3 pt-3 border-t flex justify-between text-sm font-bold ${darkMode ? 'border-gray-600 text-gray-300' : 'border-slate-200 text-slate-600'}`}>
                    <span>Total mensuel</span>
                    <span className="text-teal-600">{(direction.chargesSiege || []).reduce((s, c) => s + (parseFloat(c.montant) || 0), 0).toLocaleString()} €</span>
                  </div>
                )}
              </div>

              {/* ── Recettes Direction ──────────────────────────── */}
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}><TrendingUp size={18} className="text-emerald-500" /> Recettes propres</h3>
                  <button onClick={() => setDirection({ ...direction, recettes: [...(direction.recettes || []), { id: Date.now(), nom: 'Nouvelle recette', montant: 0 }] })} className="bg-emerald-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(direction.recettes || []).map(r => (
                    <div key={r.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-emerald-100'}`}>
                      <button onClick={() => setDirection({ ...direction, recettes: (direction.recettes || []).filter(x => x.id !== r.id) })} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                      <input className={`font-bold text-sm w-full outline-none bg-transparent mb-1 ${darkMode ? 'text-white' : ''}`} value={r.nom} onChange={e => setDirection({ ...direction, recettes: (direction.recettes || []).map(x => x.id === r.id ? { ...x, nom: e.target.value } : x) })} />
                      <div className="flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" size={16} />
                        <input type="number" className={`w-28 text-right font-black text-lg rounded-lg px-3 py-1.5 outline-none ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={r.montant} onChange={e => setDirection({ ...direction, recettes: (direction.recettes || []).map(x => x.id === r.id ? { ...x, montant: validerMontant(e.target.value) } : x) })} />
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                        <button
                          title={r.fondsDedie ? 'Fonds dédiés (reportable) — cliquer pour désactiver' : 'Marquer comme Fonds dédiés (subvention reportable)'}
                          onClick={() => setDirection({...direction, recettes: (direction.recettes||[]).map(x => x.id === r.id ? {...x, fondsDedie: !r.fondsDedie} : x)})}
                          className={`text-[10px] font-black px-1 py-0.5 rounded border no-print ${r.fondsDedie ? (darkMode ? 'bg-indigo-900/40 border-indigo-600 text-indigo-300' : 'bg-indigo-100 border-indigo-400 text-indigo-700') : (darkMode ? 'text-gray-600 border-gray-600 hover:text-gray-400' : 'text-slate-300 border-slate-200 hover:text-slate-500')}`}>
                          FD
                        </button>
                        <input
                          placeholder="tag projet"
                          className={`text-[11px] w-24 rounded px-1.5 py-0.5 outline-none border no-print ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${r.tagProjet ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-300 text-violet-700') : ''}`}
                          value={r.tagProjet || ''}
                          onChange={e => setDirection({...direction, recettes: (direction.recettes||[]).map(x => x.id === r.id ? {...x, tagProjet: e.target.value} : x)})}
                        />
                        <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-xs rounded px-2 py-1 border no-print ${r.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={r.realise ?? ''} onChange={e => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setDirection({...direction, recettes: (direction.recettes||[]).map(x => x.id === r.id ? {...x, realise: v} : x)}); }} />
                        {r.realise != null && (() => { const ecart = r.realise - r.montant; return <span className={`text-[10px] font-bold no-print ${ecart >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{ecart >= 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                        <input type="number" min="0" max="365" placeholder="∅j"
                          title="Délai d'encaissement spécifique (jours) — laissez vide pour utiliser le délai global"
                          className={`w-12 text-center text-xs rounded px-1 py-1 border no-print ${r.delaiEncaissement != null ? (darkMode ? 'bg-amber-900/40 border-amber-600 text-amber-200' : 'bg-amber-50 border-amber-400 text-amber-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`}
                          value={r.delaiEncaissement ?? ''}
                          onChange={e => { const v = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0); setDirection({...direction, recettes: (direction.recettes||[]).map(x => x.id === r.id ? {...x, delaiEncaissement: v} : x)}); }}
                        />
                        <button
                          onClick={() => setSaisonnaliteDialog({ type: 'direction', entityId: null, recetteId: r.id })}
                          title={r.repartitionMensuelle ? 'Saisonnalité configurée — modifier' : 'Configurer la saisonnalité mensuelle'}
                          className={`no-print p-1 rounded-lg transition-colors ${r.repartitionMensuelle ? (darkMode ? 'bg-cyan-800/60 text-cyan-300' : 'bg-cyan-100 text-cyan-700') : (darkMode ? 'text-gray-500 hover:text-cyan-400' : 'text-slate-300 hover:text-cyan-500')}`}
                        ><Calendar size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {(direction.recettes || []).length === 0 && <p className={`text-sm text-center py-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune recette — cliquez + pour en ajouter</p>}
                </div>
                {(direction.recettes || []).length > 0 && (
                  <div className={`mt-3 pt-3 border-t flex justify-between text-sm font-bold ${darkMode ? 'border-gray-600 text-emerald-400' : 'border-emerald-200 text-emerald-700'}`}>
                    <span>Total mensuel</span>
                    <span>{(direction.recettes || []).reduce((s, r) => s + (parseFloat(r.montant) || 0), 0).toLocaleString()} €</span>
                  </div>
                )}
              </div>

              {/* ── Répartition vers les services ──────────────── */}
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-teal-50 border-teal-200'}`}>
                <h3 className={`font-black flex items-center gap-2 mb-4 text-sm uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}><Layers size={18} className="text-teal-500" /> Répartition du coût Direction</h3>
                {(() => {
                  const totalPct = services.reduce((sum, s) => sum + (direction.repartition?.[String(s.id)] || 0), 0);
                  const totalDir = getBudgetDirection().total;
                  return (
                    <div className="space-y-2">
                      {services.map(s => {
                        const pct = direction.repartition?.[String(s.id)] || 0;
                        const montant = Math.round(totalDir * pct / 100);
                        return (
                          <div key={s.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <span className={`text-xs font-bold flex-1 truncate ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{s.nom}</span>
                            <input
                              type="number" min="0" max="100"
                              className={`w-16 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50 border'}`}
                              value={pct}
                              onChange={e => setDirection({...direction, repartition: {...(direction.repartition||{}), [String(s.id)]: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))}})}
                            />
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>%</span>
                            <span className={`text-xs font-bold w-20 text-right ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{montant.toLocaleString()} €</span>
                          </div>
                        );
                      })}
                      <div className={`flex items-center justify-between pt-2 mt-1 border-t text-xs font-black ${darkMode ? 'border-gray-600' : 'border-teal-200'}`}>
                        <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Total</span>
                        <span className={totalPct === 100 ? 'text-green-600' : 'text-red-500'}>{totalPct}%</span>
                        <span className={darkMode ? 'text-teal-300' : 'text-teal-700'}>{Math.round(totalDir).toLocaleString()} €</span>
                      </div>
                      {totalPct !== 100 && totalPct > 0 && (
                        <div className="text-xs text-red-500 font-bold flex items-center gap-1">
                          <AlertTriangle size={12} /> Le total doit être 100%
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      }

      // ── PÔLE SUPPORT ───────────────────────────────────────────
      if (itemId === 'pole-support') {
        const isPSDragging = dragId === 'pole-support';
        const isPSOver = dragOverId === 'pole-support' && !isPSDragging;
        items.push(
          <div
            key="pole-support"
            id="pole-support"
            draggable
            onDragStart={() => setDragId('pole-support')}
            onDragOver={(e) => { e.preventDefault(); setDragOverId('pole-support'); }}
            onDrop={() => handleUnifiedDrop('pole-support')}
            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
            className={`rounded-3xl shadow-xl border p-8 print-avoid-break transition-all duration-300 backdrop-blur-md
              ${isPSDragging ? 'opacity-40 scale-95' : 'hover:shadow-2xl'}
              ${isPSOver ? 'ring-2 ring-cyan-400 ring-offset-4' : ''}
              ${darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80'}`}
          >
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`cursor-grab active:cursor-grabbing p-2 rounded-xl no-print transition-colors ${darkMode ? 'bg-white/5 text-gray-500 hover:text-gray-300' : 'bg-slate-100 text-slate-300 hover:text-slate-500'}`} title="Déplacer Pôle Ressource"><GripVertical size={20} /></div>
                <div className="flex flex-col gap-0.5 no-print">
                  <button disabled={pos === 0} onClick={() => setPoleSupportPosition(p => Math.max(0, p-1))} className={`p-1 rounded-lg transition-colors ${pos===0?'opacity-20 cursor-not-allowed':'hover:bg-cyan-500/10 text-cyan-500'}`}><ChevronUp size={14}/></button>
                  <button disabled={pos === orderedItems.length - 1} onClick={() => setPoleSupportPosition(p => Math.min(services.length + 1, p+1))} className={`p-1 rounded-lg transition-colors ${pos===orderedItems.length-1?'opacity-20 cursor-not-allowed':'hover:bg-cyan-500/10 text-cyan-500'}`}><ChevronDown size={14}/></button>
                </div>
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 shadow-inner">
                  <Building size={32} />
                </div>
                <div>
                  <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Pôle Ressource</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 font-bold">{poleSupport.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Ressources transversales</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Budget annuel estimé</div>
                <span className={`text-3xl font-black font-mono-numbers ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{Math.round(getBudgetPoleSupport().total).toLocaleString()} <span className="text-lg opacity-50 font-sans">€</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Personnel */}
              <div className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`font-black flex items-center gap-2 text-sm tracking-wide ${darkMode ? 'text-white' : 'text-slate-700'}`}><Users size={18} className="text-cyan-500" /> PERSONNEL PÔLE</h3>
                  <button onClick={() => setPoleSupport({...poleSupport, personnel: [...poleSupport.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: 0, role: 'administratif', rqth: false, anneeNaissance: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }]})} 
                          className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 no-print"><Plus size={18} /></button>
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {poleSupport.personnel.map((p) => (
                    <div key={p.id} id={`agent-budget-${p.id}`} className={`p-3 rounded-xl border group relative transition-all duration-700 ${focusedAgentId === p.id ? (darkMode ? 'ring-2 ring-yellow-400 bg-yellow-900/30' : 'ring-2 ring-yellow-400 bg-yellow-50') : (darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200')}`}>
                      <button onClick={() => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.filter(x => x.id !== p.id)})} className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                      <div className="flex items-center gap-1 mb-2">
                        <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''} ${privacyMode ? 'blur-sm select-none pointer-events-none' : ''}`} value={p.titre} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)})} />
                        <button onClick={() => navigateToRHAgent(p.id)} className={`no-print p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-gray-500 text-cyan-400' : 'hover:bg-cyan-50 text-cyan-600'}`} title="Voir dans RH"><ExternalLink size={12} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                        <div><InfoTooltip content="ETP = Équivalent Temps Plein. 1 = temps complet, 0.5 = mi-temps. Impacte directement le coût employeur." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</label></InfoTooltip><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.etp} onChange={(e) => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)})} /></div>
                        <div><InfoTooltip content="Salaire brut mensuel en euros (hors charges patronales et hors prime Ségur). Coût employeur = salaire × 12 × ETP × 1,42." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Salaire</label></InfoTooltip><NumericInput className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white'}`} value={p.salaire} onChange={v => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, salaire: v} : x)})} /></div>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.role || 'administratif'} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)})}>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                        <label className="flex items-center gap-1"><input type="checkbox" checked={p.rqth || false} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)})} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label>
                        <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={!!p.segur} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)})} /><span className={`text-xs ${p.segur ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>Ségur {p.segur ? `(+${p.segur === true ? (globalParams.montantSegurETP ?? 238) : (parseFloat(p.segur) || 0)} €/m)` : ''}</span></label>
                        <div className="flex items-center gap-1">
                          <label className="flex items-center gap-0.5 cursor-pointer" title="Prise en charge Région : inclure ce salarié dans le calcul de subvention régionale (onglet DAF)"><input type="checkbox" checked={!!p.eligibleSubvention} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, eligibleSubvention: e.target.checked, tauxSubvRegion: e.target.checked ? (x.tauxSubvRegion ?? 100) : x.tauxSubvRegion} : x)})} /><span className={`text-xs font-semibold flex items-center gap-0.5 ${p.eligibleSubvention ? (darkMode ? 'text-violet-400' : 'text-violet-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}><Landmark size={10} />Région</span></label>
                          {p.eligibleSubvention && (<><input type="number" min="0" max="100" className={`w-11 text-right text-xs rounded px-1 py-0.5 font-bold border ${darkMode ? 'bg-violet-900/40 border-violet-600 text-violet-200' : 'bg-violet-50 border-violet-300 text-violet-700'}`} value={p.tauxSubvRegion ?? 100} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, tauxSubvRegion: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))} : x)})} /><span className={`text-[10px] ${darkMode ? 'text-violet-400' : 'text-violet-500'}`}>%</span></>)}
                        </div>
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="Année de naissance — utilisée pour la pyramide des âges et les alertes départs en retraite." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Né(e) en</span></InfoTooltip>
                          <input type="number" min="1940" max="2005" placeholder="1980" className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.anneeNaissance || ''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, anneeNaissance: parseInt(e.target.value) || 0} : x)})} />
                          <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Entrée</span>
                          <input type="number" min="1990" max="2026" placeholder="2020"
                            className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                            value={p.dateEntree || ''}
                            onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, dateEntree: parseInt(e.target.value) || 0} : x)})}
                          />
                          {p.dateEntree > 0 && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                              {2026 - p.dateEntree} an{2026 - p.dateEntree > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap mt-1">
                        <select className={`rounded px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.typeContrat || 'CDI'} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, typeContrat: e.target.value, dateFinContrat: e.target.value === 'CDI' ? '' : x.dateFinContrat} : x)})}>
                          <option value="CDI">CDI</option>
                          <option value="CDD">CDD</option>
                          <option value="Apprentissage">Apprentissage</option>
                          <option value="Stage">Stage</option>
                          <option value="Vacataire">Vacataire</option>
                          <option value="Autre">Autre</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="RTT = Réduction du Temps de Travail. Jours de repos accordés en compensation des heures supplémentaires liées à l'annualisation du temps de travail." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>RTT</span></InfoTooltip>
                          <input type="number" min="0" max="30" step="0.5" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-cyan-50 border'}`} value={p.nbJoursRTT ?? 0} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, nbJoursRTT: parseFloat(e.target.value) || 0} : x)})} />
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="CP = Congés Payés annuels. Minimum légal : 25 jours (5 semaines). Utilisé pour calculer le taux de présence effectif de l'agent." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CP</span></InfoTooltip>
                          <input type="number" min="0" max="50" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-cyan-50 border'}`} value={p.joursConges ?? 25} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, joursConges: parseInt(e.target.value) || 25} : x)})} />
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                        </div>
                        {(p.typeContrat && p.typeContrat !== 'CDI') && (
                          <div className="flex items-center gap-1">
                            <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                            <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={p.dateFinContrat || ''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)})} />
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <InfoTooltip content="Taux de charges patronales forcé (%). Si vide, l'outil calcule automatiquement le taux réel incluant l'allègement Fillon." darkMode={darkMode} position="top">
                            <span className={`cursor-help font-bold ${p.tauxChargesManuel > 0 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Ch.%</span>
                          </InfoTooltip>
                          <input type="number" min="0" max="100" step="0.1" placeholder="auto"
                            className={`w-14 text-center rounded px-1 py-0.5 text-xs font-bold ${p.tauxChargesManuel > 0 ? (darkMode ? 'bg-amber-900/40 border border-amber-600 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                            value={p.tauxChargesManuel || ''}
                            onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, tauxChargesManuel: e.target.value === '' ? null : parseFloat(e.target.value)} : x)})}
                          />
                        </div>
                        <label className="flex items-center gap-1 cursor-pointer" title="Poste à pourvoir — le salaire sera proraté selon la date de début prévue">
                          <input type="checkbox" checked={!!p.estPosteAPourvoir} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, estPosteAPourvoir: e.target.checked} : x)})} />
                          <span className={`text-xs font-semibold ${p.estPosteAPourvoir ? 'text-orange-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>En recrutement</span>
                        </label>
                        {p.estPosteAPourvoir && (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début prévu</span>
                            <input type="month" className={`rounded px-1 py-0.5 text-xs ${darkMode ? 'bg-orange-900/40 border border-orange-600 text-orange-300' : 'bg-orange-50 border border-orange-300 text-orange-700'}`}
                              value={p.dateDebutPrevue || ''}
                              onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, dateDebutPrevue: e.target.value} : x)})} />
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-semibold ${p.moisPrime ? (darkMode ? 'text-purple-400' : 'text-purple-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Prime</span>
                          <select className={`rounded px-1 py-0.5 text-xs ${p.moisPrime ? (darkMode ? 'bg-purple-900/40 border border-purple-600 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                            value={p.moisPrime || ''}
                            onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, moisPrime: e.target.value ? parseInt(e.target.value) : null, montantPrime: e.target.value ? (x.montantPrime || 0) : 0} : x)})}>
                            <option value="">Aucune</option>
                            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, idx) => (
                              <option key={idx + 1} value={idx + 1}>{m}</option>
                            ))}
                          </select>
                          {p.moisPrime && (
                            <>
                              <NumericInput className={`w-20 rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-purple-900/40 border border-purple-600 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700'}`}
                                value={p.montantPrime || 0}
                                onChange={v => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id === p.id ? {...x, montantPrime: v} : x)})} />
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€ brut</span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Absences */}
                      <details className="mt-2">
                        <summary className={`text-xs cursor-pointer select-none flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Calendar size={12} />
                          {(p.absences||[]).length > 0 ? `${(p.absences||[]).length} période(s)` : 'Congés / Arrêts'}
                        </summary>
                        <div className="mt-1.5 space-y-1 pl-1">
                          {(p.absences||[]).map(ab => (
                            <div key={ab.id} className={`flex flex-wrap items-center gap-1 text-xs rounded-lg px-2 py-1 ${ab.type==='conge'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-50 border border-blue-200'):ab.type==='maladie'?(darkMode?'bg-red-900/40 text-red-300':'bg-red-50 border border-red-200'):ab.type==='rtt'?(darkMode?'bg-purple-900/40 text-purple-300':'bg-purple-50 border border-purple-200'):(darkMode?'bg-orange-900/40 text-orange-300':'bg-orange-50 border border-orange-200')}`}>
                              <select className="bg-transparent font-bold outline-none text-xs" value={ab.type} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,type:e.target.value}:a)}:x)})}>
                                <option value="conge">Congé</option>
                                <option value="maladie">Maladie</option>
                                <option value="rtt">RTT</option>
                                <option value="arret">Arrêt travail</option>
                              </select>
                              <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateDebut||''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateDebut:e.target.value}:a)}:x)})} />
                              <span>→</span>
                              <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateFin||''} onChange={e => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateFin:e.target.value}:a)}:x)})} />
                              <button onClick={() => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:(x.absences||[]).filter(a=>a.id!==ab.id)}:x)})} className="ml-auto text-red-400 hover:text-red-600 no-print"><X size={12}/></button>
                            </div>
                          ))}
                          <button onClick={() => setPoleSupport({...poleSupport, personnel: poleSupport.personnel.map(x => x.id===p.id?{...x,absences:[...(x.absences||[]),{id:Date.now(),type:'conge',dateDebut:'',dateFin:''}]}:x)})} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded border border-dashed no-print ${darkMode?'border-gray-500 text-gray-400 hover:text-gray-200':'border-slate-300 text-slate-400 hover:text-slate-600'}`}>
                            <Plus size={10}/> Ajouter
                          </button>
                        </div>
                      </details>
                      {(() => {
                        const pr = calculerPresenceAgent(p, 'Pôle Ressources', planningAbsences, 2026);
                        if (pr.absences.total === 0) return null;
                        const delta = parseFloat(p.etp) - pr.etpReel;
                        return (
                          <div className={`mt-1.5 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'}`} title={`${pr.absences.total}j d'absence dans le planning`}>
                            <UserMinus size={11} /> ETP réel {pr.etpReel.toFixed(2)} <span className="opacity-60">(-{delta.toFixed(2)})</span>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Exploitation */}
              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Landmark size={20} className="text-cyan-500" /> Exploitation</h3>
                  <button onClick={() => setPoleSupport({...poleSupport, exploitation: [...(poleSupport.exploitation||[]), { id: Date.now(), nom: 'Nouvelle charge', montant: 0 }]})} className="bg-cyan-500 text-white p-2 rounded-lg no-print"><Plus size={18} /></button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(poleSupport.exploitation||[]).map(c => (
                    <div key={c.id} className={`p-2 rounded-xl border group relative flex items-center gap-2 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                      <button onClick={() => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.filter(x => x.id !== c.id)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={12} /></button>
                      <input className={`font-bold text-xs flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={c.nom} onChange={e => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, nom: e.target.value} : x)})} />
                      <input type="number" className={`w-24 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={c.montant} onChange={e => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, montant: validerMontant(e.target.value)} : x)})} />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                      {globalParams.gestionTVA && (
                        <>
                          <button title="Basculer HT / TTC" onClick={() => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, saisieType: (c.saisieType||'HT')==='HT'?'TTC':'HT'} : x)})}
                            className={`text-[10px] font-black px-1 py-0.5 rounded border ${(c.saisieType||'HT')==='TTC'?(darkMode?'bg-amber-900/40 border-amber-600 text-amber-300':'bg-amber-100 border-amber-400 text-amber-700'):(darkMode?'bg-gray-600 border-gray-500 text-gray-300':'bg-white border-slate-300 text-slate-500')}`}>
                            {c.saisieType||'HT'}
                          </button>
                          <button title="TVA récupérable / non récupérable" onClick={() => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, tvaRecuperable: c.tvaRecuperable===false?true:false} : x)})}
                            className={`text-[10px] font-black px-1 py-0.5 rounded border ${c.tvaRecuperable===false?(darkMode?'bg-red-900/40 border-red-600 text-red-300':'bg-red-100 border-red-400 text-red-700'):(darkMode?'bg-green-900/40 border-green-600 text-green-300':'bg-green-100 border-green-400 text-green-700')}`}>
                            {c.tvaRecuperable===false?'TVA✗':'TVA♻'}
                          </button>
                        </>
                      )}
                      <Tag size={10} className={`${darkMode ? 'text-zinc-500' : 'text-slate-300'}`} />
                      <input
                        placeholder="tag"
                        className={`text-[10px] w-20 rounded px-1 py-0.5 outline-none border ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${c.tagProjet ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-300 text-violet-700') : ''}`}
                        value={c.tagProjet || ''}
                        onChange={e => setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, tagProjet: e.target.value} : x)})}
                      />
                      <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-[10px] rounded px-1.5 py-0.5 border no-print ${c.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={c.realise ?? ''} onChange={e => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setPoleSupport({...poleSupport, exploitation: poleSupport.exploitation.map(x => x.id === c.id ? {...x, realise: v} : x)}); }} />
                      {c.realise != null && (() => { const ecart = c.realise - c.montant; return <span className={`text-[10px] font-bold no-print ${ecart > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{ecart > 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                    </div>
                  ))}
                  {(poleSupport.exploitation||[]).length === 0 && <p className={`text-xs text-center py-3 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune charge</p>}
                </div>
                {/* Recettes */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-black text-sm flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}><Banknote size={16} className="text-green-500" /> Recettes</h4>
                    <button onClick={() => setPoleSupport({...poleSupport, recettes: [...(poleSupport.recettes||[]), { id: Date.now(), nom: 'Nouvelle recette', montant: 0 }]})} className="bg-green-500 text-white p-1 rounded-lg no-print"><Plus size={14} /></button>
                  </div>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
                    {(poleSupport.recettes||[]).map(r => (
                      <div key={r.id} className={`p-2 rounded-xl border group relative flex items-center gap-2 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                        <button onClick={() => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.filter(x => x.id !== r.id)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={12} /></button>
                        <input className={`font-bold text-xs flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''}`} value={r.nom} onChange={e => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, nom: e.target.value} : x)})} />
                        <input type="number" className={`w-24 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={r.montant} onChange={e => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, montant: validerMontant(e.target.value)} : x)})} />
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>/mois</span>
                        <button
                          title={r.fondsDedie ? 'Fonds dédiés (reportable) — cliquer pour désactiver' : 'Marquer comme Fonds dédiés'}
                          onClick={() => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, fondsDedie: !r.fondsDedie} : x)})}
                          className={`text-[10px] font-black px-1 py-0.5 rounded border no-print ${r.fondsDedie ? (darkMode ? 'bg-indigo-900/40 border-indigo-600 text-indigo-300' : 'bg-indigo-100 border-indigo-400 text-indigo-700') : (darkMode ? 'text-gray-600 border-gray-600 hover:text-gray-400' : 'text-slate-300 border-slate-200 hover:text-slate-500')}`}>
                          FD
                        </button>
                        <input
                          placeholder="tag"
                          className={`text-[10px] w-20 rounded px-1 py-0.5 outline-none border no-print ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${r.tagProjet ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-300 text-violet-700') : ''}`}
                          value={r.tagProjet || ''}
                          onChange={e => setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, tagProjet: e.target.value} : x)})}
                        />
                        <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-[10px] rounded px-1.5 py-0.5 border no-print ${r.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={r.realise ?? ''} onChange={e => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, realise: v} : x)}); }} />
                        {r.realise != null && (() => { const ecart = r.realise - r.montant; return <span className={`text-[10px] font-bold no-print ${ecart >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{ecart >= 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                        <input type="number" min="0" max="365" placeholder="∅j"
                          title="Délai d'encaissement spécifique (jours)"
                          className={`w-10 text-center text-[10px] rounded px-1 py-0.5 border no-print ${r.delaiEncaissement != null ? (darkMode ? 'bg-amber-900/40 border-amber-600 text-amber-200' : 'bg-amber-50 border-amber-400 text-amber-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`}
                          value={r.delaiEncaissement ?? ''}
                          onChange={e => { const v = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0); setPoleSupport({...poleSupport, recettes: poleSupport.recettes.map(x => x.id === r.id ? {...x, delaiEncaissement: v} : x)}); }}
                        />
                        <button
                          onClick={() => setSaisonnaliteDialog({ type: 'poleSupport', entityId: null, recetteId: r.id })}
                          title={r.repartitionMensuelle ? 'Saisonnalité configurée — modifier' : 'Configurer la saisonnalité mensuelle'}
                          className={`no-print p-0.5 rounded-lg transition-colors ${r.repartitionMensuelle ? (darkMode ? 'bg-cyan-800/60 text-cyan-300' : 'bg-cyan-100 text-cyan-700') : (darkMode ? 'text-gray-500 hover:text-cyan-400' : 'text-slate-300 hover:text-cyan-500')}`}
                        ><Calendar size={12} /></button>
                      </div>
                    ))}
                    {(poleSupport.recettes||[]).length === 0 && <p className={`text-xs text-center py-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aucune recette</p>}
                  </div>
                </div>
              </div>

              {/* Répartition coût */}
              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <h3 className={`font-black flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-700'}`}><Layers size={20} className="text-cyan-500" /> Répartition du coût</h3>
                {(() => {
                  const totalPct = services.reduce((sum, s) => sum + (poleSupport.repartition?.[String(s.id)] || 0), 0);
                  const totalPS = getBudgetPoleSupport().total;
                  return (
                    <div className="space-y-2">
                      {services.map(s => {
                        const pct = poleSupport.repartition?.[String(s.id)] || 0;
                        const montant = Math.round(totalPS * pct / 100);
                        return (
                          <div key={s.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-600' : 'bg-slate-50'}`}>
                            <span className={`text-xs font-bold flex-1 truncate ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{s.nom}</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className={`w-16 text-right text-xs font-bold rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                              value={pct}
                              onChange={e => setPoleSupport({...poleSupport, repartition: {...(poleSupport.repartition||{}), [String(s.id)]: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))}})}
                            />
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>%</span>
                            <span className={`text-xs font-bold w-20 text-right ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{montant.toLocaleString()} €</span>
                          </div>
                        );
                      })}
                      <div className={`flex items-center justify-between pt-2 mt-1 border-t text-xs font-black ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
                        <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Total</span>
                        <span className={totalPct === 100 ? 'text-green-600' : 'text-red-500'}>{totalPct}%</span>
                        <span className={darkMode ? 'text-cyan-300' : 'text-cyan-700'}>{Math.round(totalPS).toLocaleString()} €</span>
                      </div>
                      {totalPct !== 100 && totalPct > 0 && (
                        <div className="text-xs text-red-500 font-bold flex items-center gap-1">
                          <AlertTriangle size={12} /> Le total doit être 100%
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      }

      // ── SERVICE ─────────────────────────────────────────────────
      if (itemId !== 'direction' && itemId !== 'pole-support') {
        const service = services.find(s => s.id === itemId);
        if (!service) continue;
        const serviceIndex = services.indexOf(service);
    const bs = getBudgetService(service);
    const hasPromos = service.promos && Object.keys(service.promos).length > 0;
    const isPrestation = service.type === 'prestation';
    const stats = hasPromos ? calculerStatsFormation(service) : null;
    const totalRealisations = isPrestation ? calculerTotalRealisations(service.realisations) : 0;
    const accueilPublic = service.accueilPublic !== false;
    const sessionsSimulees = service.sessionsSimulees || [];
    const simOuverte = simulationsOuvertes.has(service.id);
    const isDragging = dragId === service.id;
    const isDragOver = dragOverId === service.id && !isDragging;

    // Tous les salariés de tous les sites Pilotage
    const tousSalariesPilotage = pilotageSites.flatMap(site =>
      site.salaries.map(s => ({ ...s, siteNom: site.nom, siteId: site.id }))
    );

    // Salariés du budget convertis au format calcSalarieFormateur
    const salariesBudget = [
      ...direction.personnel.map(p => ({
        id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
        salaireBrut: p.salaire || 0,
        tauxCharges: Math.round(CHARGES_PATRONALES * 100),
        heuresHebdo: Math.round(35 * (p.etp || 1)),
        heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
        _source: 'Direction / Siège',
      })),
      ...poleSupport.personnel.map(p => ({
        id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
        salaireBrut: p.salaire || 0,
        tauxCharges: Math.round(CHARGES_PATRONALES * 100),
        heuresHebdo: Math.round(35 * (p.etp || 1)),
        heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
        _source: 'Pôle Ressources',
      })),
      ...services.flatMap(svc => (svc.personnel || []).map(p => ({
        id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
        salaireBrut: p.salaire || 0,
        tauxCharges: Math.round(CHARGES_PATRONALES * 100),
        heuresHebdo: Math.round(35 * (p.etp || 1)),
        heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
        _source: svc.nom,
      }))),
      ...(poolRH || []).map(p => ({
        id: `budget-${p.id}`, nom: p.titre || 'Sans nom', type: 'interne',
        salaireBrut: p.salaire || 0,
        tauxCharges: Math.round(CHARGES_PATRONALES * 100),
        heuresHebdo: Math.round(35 * (p.etp || 1)),
        heuresHorsProduction: 7, ratioPreparation: 1.2, joursAbsence: 0,
        _source: 'Pool RH',
      })),
    ];

    // Calcul résultat d'une session simulée
    const calcSession = (sess) => {
      const formateur = tousSalariesPilotage.find(s => s.id === sess.formateurId)
                     || salariesBudget.find(s => s.id === sess.formateurId);
      if (!formateur) return { ca: 0, coutFormateur: 0, marge: 0 };
      const calc = calcSalarieFormateur(formateur);
      const coutFormateur = calc.coutHoraireFacture * (sess.nbHeures || 0);
      const ca = (sess.nbParticipants || 0) * (sess.prixParParticipant || 0);
      return { ca, coutFormateur, marge: ca - coutFormateur - (sess.fraisDeplacements || 0) - (sess.fraisSupports || 0) };
    };

    items.push(
      <div
        key={service.id}
        id={`service-${service.id}`}
        draggable
        onDragStart={() => setDragId(service.id)}
        onDragOver={(e) => { e.preventDefault(); setDragOverId(service.id); }}
        onDrop={() => handleUnifiedDrop(service.id)}
        onDragEnd={() => { setDragId(null); setDragOverId(null); }}
        className={`rounded-3xl shadow-xl border p-8 print-avoid-break transition-all duration-300 backdrop-blur-md
          ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-2xl'}
          ${isDragOver && !isDragging ? 'ring-2 ring-teal-400 ring-offset-4' : ''}
          ${!accueilPublic 
            ? (darkMode ? 'bg-amber-900/10 border-amber-500/20' : 'bg-amber-50/50 border-amber-200/60') 
            : (darkMode ? 'bg-zinc-900/80 border-zinc-700/30' : 'bg-white border-slate-100/80')}`}
      >
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Poignée de déplacement */}
            <div className={`cursor-grab active:cursor-grabbing p-2 rounded-xl no-print transition-colors ${darkMode ? 'bg-white/5 text-gray-500 hover:text-gray-300' : 'bg-slate-100 text-slate-300 hover:text-slate-500'}`} title="Déplacer ce service">
              <GripVertical size={20} />
            </div>
            {/* Boutons haut/bas */}
            <div className="flex flex-col gap-0.5 no-print">
              <button
                disabled={serviceIndex === 0}
                onClick={() => {
                  const arr = [...services]; arr.splice(serviceIndex - 1, 0, arr.splice(serviceIndex, 1)[0]);
                  setServices(arr);
                }}
                className={`p-1 rounded-lg transition-colors ${serviceIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-500'}`}
              ><ChevronUp size={14} /></button>
              <button
                disabled={serviceIndex === services.length - 1}
                onClick={() => {
                  const arr = [...services]; arr.splice(serviceIndex + 1, 0, arr.splice(serviceIndex, 1)[0]);
                  setServices(arr);
                }}
                className={`p-1 rounded-lg transition-colors ${serviceIndex === services.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-500'}`}
              ><ChevronDown size={14} /></button>
            </div>
            <div className={`p-3 rounded-2xl shadow-inner ${
              isPrestation ? 'bg-orange-500/10 text-orange-500' : 
              hasPromos ? 'bg-purple-500/10 text-purple-500' : 
              'bg-teal-500/10 text-teal-500'
            }`}>
              {isPrestation ? <Calendar size={32} /> : hasPromos ? <GraduationCap size={32} /> : <Cog size={32} className="text-red-500" />}
            </div>
            <div className="flex flex-col">
              <input className={`text-2xl font-black outline-none border-b-2 border-transparent focus:border-teal-500 bg-transparent transition-all ${darkMode ? 'text-white' : 'text-slate-800'}`} 
                     value={service.nom} 
                     onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, nom: e.target.value} : s))} />
              <div className="flex items-center gap-2 mt-1">
                <select
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 outline-none cursor-pointer no-print ${
                    service.type === 'prestation' ? 'bg-orange-500/10 text-orange-600' :
                    service.type === 'recherche'  ? 'bg-violet-500/10 text-violet-600' :
                                                    'bg-teal-500/10 text-teal-600'
                  }`}
                  value={service.type || 'formation'}
                  onChange={e => setServices(services.map(s => s.id === service.id ? {...s, type: e.target.value} : s))}
                >
                  <option value="formation">Formation</option>
                  <option value="prestation">Prestation</option>
                  <option value="recherche">Recherche</option>
                </select>
                <button
                  onClick={() => setServices(services.map(s => s.id === service.id ? {...s, accueilPublic: !accueilPublic} : s))}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all no-print border ${
                    accueilPublic 
                      ? 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20' 
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  {accueilPublic ? <UserCheck size={12} /> : <UserX size={12} />}
                  {accueilPublic ? 'Accueil public' : 'Sans accueil public'}
                </button>
                <input
                  placeholder="Code analytique"
                  title="Code analytique court (ex: IFAS, AIDE-DOM) — utilisé pour le mapping Dolibarr"
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border outline-none no-print w-28 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-600' : 'bg-slate-100 border-slate-300 text-slate-700 placeholder-slate-400'} ${service.codeAnalytique ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-400 text-violet-700') : ''}`}
                  value={service.codeAnalytique || ''}
                  onChange={e => setServices(services.map(s => s.id === service.id ? {...s, codeAnalytique: e.target.value.toUpperCase()} : s))}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-end">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Total charges</div>
              <span className={`text-xl font-black font-mono-numbers text-red-500`}>
                {Math.round(bs.total).toLocaleString()} <span className="text-sm opacity-50 font-sans">€</span>
              </span>
            </div>
            <div className="w-px h-10 bg-slate-200/50 mx-1"></div>
            <div className="flex flex-col items-end">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Total recettes</div>
              <span className={`text-xl font-black font-mono-numbers text-green-500`}>
                {Math.round(bs.recettes).toLocaleString()} <span className="text-sm opacity-50 font-sans">€</span>
              </span>
            </div>
            <div className="w-px h-10 bg-slate-200/50 mx-1"></div>
            <div className="flex flex-col items-end">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Solde</div>
              <span className={`text-xl font-black font-mono-numbers ${bs.solde >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                {bs.solde >= 0 ? '+' : ''}{Math.round(bs.solde).toLocaleString()} <span className="text-sm opacity-50 font-sans">€</span>
              </span>
            </div>
            <span className={`px-3 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              {service.personnel.reduce((s, p) => s + p.etp, 0).toFixed(1)} ETP
              {bs.etpReel !== undefined && Math.abs(bs.etpReel - bs.etpContractuel) > 0.01 && (
                <span className={`ml-1 ${darkMode ? 'text-amber-300' : 'text-amber-600'}`} title="ETP réel après absences">
                  → {bs.etpReel.toFixed(2)} réel
                </span>
              )}
            </span>
            {bs.coutCarenceMaladie > 0 && (
              <span className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'}`}
                title="Coût des jours de carence maladie à charge de l'employeur (non remboursés par la SS)">
                🤒 Carence: +{Math.round(bs.coutCarenceMaladie).toLocaleString()} €
              </span>
            )}
            {bs.salairesAllouesFI > 0 && (
              <span className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}
                title={`Part FI extraite du budget service : ${Math.round(bs.salairesAllouesFI).toLocaleString()} € / an`}>
                <Zap size={12} /> dont -{Math.round(bs.salairesAllouesFI).toLocaleString()} € → FI
                {bs.salairesAllouesFC > 0 && <span className="ml-1 opacity-60">({Math.round(bs.salairesAllouesFC).toLocaleString()} € FC)</span>}
              </span>
            )}
            {stats && (
              <span className="bg-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold">
                {stats.effectifActuel} étudiants ({stats.totalAbandons} abandons)
              </span>
            )}
            {stats && stats.effectifActuel > 0 && (() => {
              // Coût par étudiant = charges service / effectif actuel
              const cout = Math.round(bs.total / stats.effectifActuel);
              // Avec allocation direction (prorata ETP)
              const etpTotal = [
                ...(direction?.personnel || []).map(p => p.etp),
                ...services.flatMap(s => (s.personnel || []).map(p => p.etp))
              ].reduce((a, b) => a + b, 0);
              const etpService = (service.personnel || []).reduce((s, p) => s + p.etp, 0);
              const bdDir = getBudgetDirection();
              const allocDir = etpTotal > 0 ? bdDir.total * (etpService / etpTotal) : 0;
              const coutAvecDir = Math.round((bs.total + allocDir) / stats.effectifActuel);
              return (
                <span className={`px-3 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`} title={`Sans direction : ${cout.toLocaleString()} €/étudiant — Avec allocation direction : ${coutAvecDir.toLocaleString()} €/étudiant`}>
                  ~{coutAvecDir.toLocaleString()} €/étudiant
                </span>
              );
            })()}
            {isPrestation && (
              <span className="bg-orange-100 text-orange-700 px-3 py-2 rounded-xl text-xs font-bold">
                {totalRealisations} réalisations
              </span>
            )}
          </div>
          <button
            onClick={() => exportFicheService(service, globalParams)}
            title="Exporter la fiche synthèse PDF (1 page A4)"
            className={`p-2 rounded-xl transition-colors no-print ${darkMode ? 'text-teal-400 hover:bg-teal-900/20' : 'text-teal-600 hover:bg-teal-50'}`}
          ><FileText size={20} /></button>
          <button onClick={async () => {
            const ok = await window.appConfirm(
              'Supprimer ce service ?',
              `Êtes-vous sûr de vouloir supprimer "${service.nom}" ? Cette action est irréversible.`,
              { confirmLabel: 'Supprimer', danger: true }
            );
            if (ok) setServices(services.filter(s => s.id !== service.id));
          }} className="text-red-400 p-2 hover:bg-red-50 rounded-xl no-print"><Trash2 size={22} /></button>
        </div>

        {/* Bouton d'initialisation promos pour un service sans promos */}
        {!hasPromos && !isPrestation && (
          <div className="mb-6 flex items-center gap-3 no-print">
            <GraduationCap size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
            <span className={`text-sm font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Activer les effectifs / promos</span>
            <select
              defaultValue=""
              onChange={e => {
                if (!e.target.value) return;
                const site = e.target.value;
                const ts = Date.now();
                setServices(services.map(s => s.id === service.id ? {
                  ...s,
                  promos: { [site]: [{ id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }] }
                } : s));
              }}
              className={`text-sm font-bold px-3 py-2 rounded-xl border-2 border-dashed cursor-pointer ${darkMode ? 'bg-gray-700 border-purple-700 text-purple-300' : 'bg-white border-purple-300 text-purple-700'}`}
            >
              <option value="">— Choisir un site…</option>
              {Object.values(SITES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Section Promos par site - uniquement pour les services de formation */}
        {hasPromos && (
          <div className={`mb-6 p-6 rounded-2xl border-2 ${darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className={`text-lg font-black flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                <GraduationCap size={22} /> Effectifs par site et promo
              </h3>
              {/* Ajouter un nouveau site */}
              {Object.values(SITES).filter(s => !Object.keys(service.promos).includes(s)).length > 0 && (
                <select
                  className={`text-xs rounded-lg px-3 py-1.5 font-bold border-2 border-dashed cursor-pointer no-print ${darkMode ? 'bg-gray-700 border-purple-700 text-purple-300' : 'bg-white border-purple-300 text-purple-600'}`}
                  defaultValue=""
                  onChange={e => {
                    if (!e.target.value) return;
                    const newSite = e.target.value;
                    const ts = Date.now();
                    const newSiteContent = service.useFiliere
                      ? [{ id: `fil-${newSite}-${ts}`, nom: 'Nouvelle filière', promos: [{ id: `${newSite}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }] }]
                      : [{ id: `${newSite}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }];
                    setServices(services.map(s => s.id === service.id ? {
                      ...s,
                      promos: { ...s.promos, [newSite]: newSiteContent }
                    } : s));
                    e.target.value = '';
                  }}
                >
                  <option value="">+ Ajouter un site…</option>
                  {Object.values(SITES).filter(s => !Object.keys(service.promos).includes(s)).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(service.promos).map(([site, items]) => {
                // Helper pour mettre à jour une promo dans la structure (avec ou sans filières)
                const updatePromo = (filiereId, promoId, updater) => {
                  setServices(services.map(s => {
                    if (s.id !== service.id) return s;
                    return {
                      ...s,
                      promos: {
                        ...s.promos,
                        [site]: s.useFiliere
                          ? s.promos[site].map(fil => fil.id !== filiereId ? fil : {
                              ...fil, promos: fil.promos.map(p => p.id !== promoId ? p : updater(p))
                            })
                          : s.promos[site].map(p => p.id !== promoId ? p : updater(p))
                      }
                    };
                  }));
                };
                const deletePromo = (filiereId, promoId) => {
                  setServices(services.map(s => {
                    if (s.id !== service.id) return s;
                    return {
                      ...s,
                      promos: {
                        ...s.promos,
                        [site]: s.useFiliere
                          ? s.promos[site].map(fil => fil.id !== filiereId ? fil : {
                              ...fil, promos: fil.promos.filter(p => p.id !== promoId)
                            })
                          : s.promos[site].filter(p => p.id !== promoId)
                      }
                    };
                  }));
                };

                // Construit la liste des promos à afficher (avec filière context si useFiliere)
                const promosList = service.useFiliere
                  ? null // handled separately below
                  : items;

                const renderPromoCard = (promo, filiereId) => {
                  const effectifActuel = calculerEffectifActuel(promo);
                  const totalAbandons = Object.values(promo.abandons).reduce((sum, v) => sum + v, 0);
                  return (
                    <div key={promo.id} className={`p-3 rounded-lg border group/promo ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        {/* Nom éditable */}
                        <input
                          className={`font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-purple-400 w-28 ${darkMode ? 'text-white' : 'text-slate-700'}`}
                          value={promo.nom}
                          onChange={e => updatePromo(filiereId, promo.id, p => ({...p, nom: e.target.value}))}
                        />
                        <div className="flex items-center gap-2">
                          {/* Type de promo */}
                          <select
                            value={promo.type || 'standard'}
                            onChange={e => {
                              const newType = e.target.value;
                              const ventilInit = newType === 'contrat_pro' && !promo.ventilationMensuelle
                                ? Object.fromEntries(moisKeysFI.map(m => [m, {fc:100, fi:0}]))
                                : promo.ventilationMensuelle;
                              updatePromo(filiereId, promo.id, p => ({...p, type: newType, ...(newType === 'contrat_pro' ? {ventilationMensuelle: ventilInit} : {})}));
                            }}
                            className={`text-xs rounded px-1 py-0.5 ${darkMode ? 'bg-gray-500 text-white border-gray-400' : 'bg-white border border-slate-300 text-slate-700'} no-print`}
                          >
                            <option value="standard">Standard</option>
                            <option value="apprentissage">Apprentissage</option>
                            <option value="contrat_pro">Contrat pro</option>
                          </select>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium print-only ${
                            (promo.type || 'standard') === 'apprentissage'
                              ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
                              : (promo.type || 'standard') === 'contrat_pro'
                                ? (darkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700')
                                : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
                          }`}>
                            {(promo.type || 'standard') === 'apprentissage' ? 'Apprentissage' : (promo.type || 'standard') === 'contrat_pro' ? 'Contrat pro' : 'Standard'}
                          </span>
                          {/* Bouton supprimer promo */}
                          <button
                            onClick={() => deletePromo(filiereId, promo.id)}
                            className={`opacity-0 group-hover/promo:opacity-100 transition-opacity p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'} no-print`}
                            title="Supprimer cette promo"
                          ><Trash2 size={12} /></button>
                          <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            Initial: {promo.effectifInitial}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-bold ${effectifActuel < promo.effectifInitial ? (darkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700') : (darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-100 text-teal-700')}`}>
                            Actuel: {effectifActuel}
                          </span>
                          {totalAbandons > 0 && (
                            <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'}`}>
                              <UserMinus size={12} className="inline mr-1" />{totalAbandons}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Dates de formation */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début:</label>
                          <input
                            type="date"
                            className={`text-xs rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                            value={promo.dateDebut || ''}
                            onChange={e => updatePromo(filiereId, promo.id, p => ({...p, dateDebut: e.target.value}))}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Fin:</label>
                          <input
                            type="date"
                            className={`text-xs rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                            value={promo.dateFin || ''}
                            onChange={e => updatePromo(filiereId, promo.id, p => ({...p, dateFin: e.target.value}))}
                          />
                        </div>
                        {promo.dateDebut && promo.dateFin && (() => {
                          const d1 = new Date(promo.dateDebut), d2 = new Date(promo.dateFin);
                          if (d2 > d1) {
                            const mois = Math.round((d2 - d1) / (1000*60*60*24*30.44));
                            return <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{mois} mois</span>;
                          }
                          return null;
                        })()}
                      </div>
                      {/* Effectif initial éditable */}
                      <div className="flex items-center gap-2 mb-2">
                        <InfoTooltip content="Nombre d'apprenants inscrits au démarrage de la promotion. L'effectif actuel est recalculé chaque mois en soustrayant les abandons cumulés. Utilisé pour le calcul du point mort et le coût par étudiant." darkMode={darkMode} position="top">
                          <label className={`text-xs cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Effectif initial:</label>
                        </InfoTooltip>
                        <input
                          type="number"
                          className={`w-16 text-xs rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`}
                          value={promo.effectifInitial}
                          onChange={e => updatePromo(filiereId, promo.id, p => ({...p, effectifInitial: Math.max(0, parseInt(e.target.value) || 0)}))}
                        />
                      </div>
                      {/* Abandons par mois */}
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        <div className="flex items-center gap-1 mb-1">
                          <UserMinus size={12} />
                          <InfoTooltip content="Nombre d'apprenants qui quittent la formation ce mois-ci (désinscription, rupture, abandon). S'accumule pour calculer l'effectif réel présent chaque mois, et sert à évaluer le risque de rentabilité de la promotion." darkMode={darkMode} position="top">
                            <span className="cursor-help">Abandons par mois:</span>
                          </InfoTooltip>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                          {Object.entries(promo.abandons).map(([mois, val]) => (
                            <div key={mois} className="text-center">
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                {mois.substring(0, 3)}
                              </div>
                              <input
                                type="number"
                                min="0"
                                className={`w-full text-center text-xs rounded px-1 py-0.5 ${val > 0 ? (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-white border')}`}
                                value={val}
                                onChange={e => updatePromo(filiereId, promo.id, p => ({...p, abandons: {...p.abandons, [mois]: Math.max(0, parseInt(e.target.value) || 0)}}))}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Ventilation FC / FI — contrat pro uniquement */}
                      {(promo.type === 'contrat_pro') && (() => {
                        const ventil = promo.ventilationMensuelle || Object.fromEntries(moisKeysFI.map(m => [m, {fc:100, fi:0}]));
                        return (
                          <div className={`mt-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                            <div className={`text-xs font-black mb-2 flex items-center gap-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              Ventilation FC / FI (%)
                              <HelpIcon darkMode={darkMode} position="right" content="FC = Formation Continue (financement OPCO, entreprises). FI = Formation Initiale (financement Région, étudiants). Pour les contrats pro, les coûts sont répartis entre ces deux lignes de financement chaque mois. FC + FI = 100% chaque mois." />
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1">
                              {moisKeysFI.map((mois, i) => {
                                const v = ventil[mois] || {fc:100, fi:0};
                                return (
                                  <div key={mois} className="text-center">
                                    <div className={`text-xs mb-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{moisLabelsFI[i]}</div>
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-0.5">
                                        <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>FC</span>
                                        <input
                                          type="number"
                                          min="0" max="100"
                                          className={`w-full text-center text-xs rounded px-1 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-white border'}`}
                                          value={v.fc}
                                          onChange={e => {
                                            const fcVal = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                            const newVentil = {...ventil, [mois]: {fc: fcVal, fi: 100-fcVal}};
                                            updatePromo(filiereId, promo.id, p => ({...p, ventilationMensuelle: newVentil}));
                                          }}
                                        />
                                      </div>
                                      <div className={`text-xs text-center font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>FI:{100-v.fc}%</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {(() => {
                              const vals = moisKeysFI.map(m => (ventil[m] || {fc:100,fi:0}).fc);
                              const moyFC = vals.reduce((a,b) => a+b, 0) / 12;
                              return (
                                <div className={`mt-2 flex justify-between text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                  <span className={darkMode ? 'text-teal-400' : 'text-teal-700'}>Moy. FC : {moyFC.toFixed(1)}%</span>
                                  <span className={darkMode ? 'text-amber-300' : 'text-amber-700'}>Moy. FI : {(100-moyFC).toFixed(1)}%</span>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                      {/* Courbe d'attrition */}
                      {totalAbandons > 0 && (() => {
                        const moisKeys = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
                        const moisLbl  = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
                        let cumulAbandons = 0;
                        const attrData = moisKeys.map((m, i) => {
                          cumulAbandons += (promo.abandons[m] || 0);
                          return { mois: moisLbl[i], effectif: Math.max(0, promo.effectifInitial - cumulAbandons) };
                        });
                        const tauxRet = (attrData[11].effectif / promo.effectifInitial * 100).toFixed(0);
                        return (
                          <div className="mt-3">
                            <div className={`flex justify-between text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                              <span className="flex items-center gap-1"><TrendingDown size={11}/> Courbe d'attrition</span>
                              <span className={parseInt(tauxRet) >= 90 ? 'text-green-500 font-bold' : parseInt(tauxRet) >= 75 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold'}>Rétention : {tauxRet}%</span>
                            </div>
                            <ResponsiveContainer width="100%" height={60}>
                              <AreaChart data={attrData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                                <defs><linearGradient id={`attr-${promo.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                                <XAxis dataKey="mois" tick={{ fontSize: 8, fill: darkMode ? '#6b7280' : '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937':'#fff', border:'none', borderRadius:'8px', fontSize:10 }} formatter={v => [`${v} étudiants`]} />
                                <Area type="monotone" dataKey="effectif" stroke="#8b5cf6" fill={`url(#attr-${promo.id})`} strokeWidth={2} dot={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>
                  );
                };

                return (
                <div key={site} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      <MapPin size={18} className="text-purple-500" />
                      <select
                        value={site}
                        onChange={e => {
                          const newSite = e.target.value;
                          if (!newSite || newSite === site) return;
                          // Déplace toutes les promos de l'ancien site vers le nouveau
                          setServices(services.map(s => {
                            if (s.id !== service.id) return s;
                            const newPromos = { ...s.promos };
                            newPromos[newSite] = newPromos[site];
                            delete newPromos[site];
                            return { ...s, promos: newPromos };
                          }));
                        }}
                        className={`font-black text-sm bg-transparent border-b-2 border-transparent hover:border-purple-400 focus:border-purple-500 outline-none cursor-pointer no-print ${darkMode ? 'text-white' : 'text-slate-800'}`}
                      >
                        {Object.values(SITES).filter(s => s === site || !Object.keys(service.promos).includes(s)).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </h4>
                    <div className="flex items-center gap-2 no-print">
                      {/* Bouton ajouter filière (mode filière) ou promo (mode plat) */}
                      {service.useFiliere ? (
                        <button
                          onClick={() => {
                            const ts = Date.now();
                            setServices(services.map(s => s.id !== service.id ? s : {
                              ...s, promos: { ...s.promos, [site]: [...s.promos[site], { id: `fil-${site}-${ts}`, nom: 'Nouvelle filière', promos: [{ id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }] }] }
                            }));
                          }}
                          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-purple-800 text-purple-200 hover:bg-purple-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                        ><Plus size={12} /> Filière</button>
                      ) : (
                        <button
                          onClick={() => setServices(services.map(s => s.id === service.id ? {
                            ...s,
                            promos: { ...s.promos, [site]: [...s.promos[site], { id: `${site}-${Date.now()}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }] }
                          } : s))}
                          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-purple-800 text-purple-200 hover:bg-purple-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                        ><Plus size={12} /> Promo</button>
                      )}
                      {/* Bouton supprimer ce site */}
                      <button
                        onClick={() => {
                          const newPromos = {...service.promos};
                          delete newPromos[site];
                          setServices(services.map(s => s.id === service.id ? { ...s, promos: Object.keys(newPromos).length > 0 ? newPromos : undefined } : s));
                        }}
                        className={`text-xs p-1 rounded-lg ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'}`}
                        title={`Supprimer le site ${site}`}
                      ><Trash2 size={12} /></button>
                    </div>
                  </div>

                  {service.useFiliere ? (
                    /* Rendu avec filières */
                    <div className="space-y-4">
                      {items.map(filiere => {
                        const filiereEffectif = filiere.promos.reduce((sum, p) => sum + calculerEffectifActuel(p), 0);
                        return (
                          <div key={filiere.id} className={`rounded-xl border-2 ${darkMode ? 'border-purple-800 bg-gray-800/50' : 'border-purple-200 bg-purple-50/50'}`}>
                            {/* En-tête filière */}
                            <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                              <input
                                className={`font-black text-sm bg-transparent outline-none border-b border-transparent focus:border-purple-400 flex-1 ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}
                                value={filiere.nom}
                                onChange={e => setServices(services.map(s => s.id !== service.id ? s : {
                                  ...s, promos: { ...s.promos, [site]: s.promos[site].map(fil => fil.id !== filiere.id ? fil : { ...fil, nom: e.target.value }) }
                                }))}
                                title="Nom de la filière"
                              />
                              <div className="flex items-center gap-2 no-print">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-800 text-purple-200' : 'bg-purple-200 text-purple-700'}`}>
                                  {filiereEffectif} étud.
                                </span>
                                <button
                                  onClick={() => {
                                    const ts = Date.now();
                                    setServices(services.map(s => s.id !== service.id ? s : {
                                      ...s, promos: { ...s.promos, [site]: s.promos[site].map(fil => fil.id !== filiere.id ? fil : {
                                        ...fil, promos: [...fil.promos, { id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons(), type: 'standard' }]
                                      }) }
                                    }));
                                  }}
                                  className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-purple-300 hover:bg-gray-600' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                                ><Plus size={11} /> Promo</button>
                                <button
                                  onClick={() => setServices(services.map(s => s.id !== service.id ? s : {
                                    ...s, promos: { ...s.promos, [site]: s.promos[site].filter(fil => fil.id !== filiere.id) }
                                  }))}
                                  className={`text-xs p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'}`}
                                  title="Supprimer cette filière"
                                ><Trash2 size={12} /></button>
                              </div>
                            </div>
                            {/* Promos de la filière */}
                            <div className="p-3 space-y-3">
                              {filiere.promos.map(promo => renderPromoCard(promo, filiere.id))}
                            </div>
                          </div>
                        );
                      })}
                      {/* Bouton ajouter filière bas */}
                      <button
                        onClick={() => {
                          const ts = Date.now();
                          setServices(services.map(s => s.id !== service.id ? s : {
                            ...s, promos: { ...s.promos, [site]: [...s.promos[site], { id: `fil-${site}-${ts}`, nom: 'Nouvelle filière', promos: [{ id: `${site}-${ts}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }] }] }
                          }));
                        }}
                        className={`w-full py-1.5 border-dashed border-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 no-print ${darkMode ? 'border-purple-700 text-purple-400 hover:bg-purple-900/20' : 'border-purple-200 text-purple-500 hover:bg-purple-50'}`}
                      ><Plus size={12} /> Ajouter une filière</button>
                    </div>
                  ) : (
                    /* Rendu plat (sans filières) */
                    <div className="space-y-3">
                      {promosList.map(promo => renderPromoCard(promo, null))}
                      <button
                        onClick={() => setServices(services.map(s => s.id === service.id ? {
                          ...s,
                          promos: { ...s.promos, [site]: [...s.promos[site], { id: `${site}-${Date.now()}`, nom: 'Nouvelle promo', effectifInitial: 20, abandons: makeAbandons() }] }
                        } : s))}
                        className={`w-full mt-2 py-1.5 border-dashed border-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 no-print ${darkMode ? 'border-purple-700 text-purple-400 hover:bg-purple-900/20' : 'border-purple-200 text-purple-500 hover:bg-purple-50'}`}
                      ><Plus size={12} /> Ajouter une promo</button>
                    </div>
                  )}

                  {/* Total par site */}
                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-slate-200'} flex justify-between text-sm font-bold`}>
                    <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>Total {site}:</span>
                    <span className={darkMode ? 'text-white' : 'text-slate-800'}>
                      {service.useFiliere
                        ? items.reduce((sum, fil) => sum + fil.promos.reduce((s2, p) => s2 + calculerEffectifActuel(p), 0), 0)
                        : items.reduce((sum, p) => sum + calculerEffectifActuel(p), 0)
                      } étudiants
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
            {/* Synthèse par site */}
            {Object.keys(service.promos).length > 1 && (() => {
              const siteTotals = Object.entries(service.promos).map(([site, items]) => {
                const effectif = service.useFiliere
                  ? items.reduce((sum, fil) => sum + fil.promos.reduce((s2, p) => s2 + calculerEffectifActuel(p), 0), 0)
                  : items.reduce((sum, p) => sum + calculerEffectifActuel(p), 0);
                const nbPromos = service.useFiliere
                  ? items.reduce((sum, fil) => sum + fil.promos.length, 0)
                  : items.length;
                return { site, effectif, nbPromos };
              });
              const totalEff = siteTotals.reduce((s, t) => s + t.effectif, 0);
              return (
                <div className={`mt-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-purple-100'}`}>
                  <div className={`text-xs font-black uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-purple-500'}`}>Répartition par site</div>
                  <div className="flex flex-wrap gap-3">
                    {siteTotals.map(t => (
                      <div key={t.site} className={`flex-1 min-w-[120px] p-2 rounded-lg text-center ${darkMode ? 'bg-gray-600' : 'bg-purple-50'}`}>
                        <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-300' : 'text-purple-700'}`}>{t.site}</div>
                        <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{t.effectif}</div>
                        <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t.nbPromos} promo{t.nbPromos > 1 ? 's' : ''} · {totalEff > 0 ? Math.round(t.effectif/totalEff*100) : 0}%</div>
                        {/* mini jauge */}
                        <div className={`mt-1 h-1.5 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-purple-100'}`}>
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${totalEff > 0 ? (t.effectif/totalEff*100) : 0}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className={`flex-1 min-w-[120px] p-2 rounded-lg text-center ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                      <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>TOTAL</div>
                      <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{totalEff}</div>
                      <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{siteTotals.reduce((s, t) => s + t.nbPromos, 0)} promos</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Section Réalisations par mois - uniquement pour les prestations */}
        {isPrestation && (
          <div className={`mb-6 p-6 rounded-2xl border-2 ${darkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
            <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
              <Calendar size={22} /> Réalisations par mois
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              {MOIS.map((mois, idx) => {
                const moisKey = mois.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace('û', 'u');
                return (
                  <div key={mois} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{mois}</label>
                    <input
                      type="number"
                      min="0"
                      className={`w-full text-center font-black text-lg rounded px-2 py-1 ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50 text-orange-700'}`}
                      value={service.realisations?.[moisKey] || 0}
                      onChange={(e) => setServices(services.map(s => s.id === service.id ? {
                        ...s,
                        realisations: {
                          ...(s.realisations || defaultRealisations()),
                          [moisKey]: Math.max(0, parseInt(e.target.value) || 0)
                        }
                      } : s))}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Prix unitaire (€)</label>
                <input
                  type="number"
                  className={`font-black text-xl px-4 py-2 rounded-xl w-full outline-none ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50 text-orange-700'}`}
                  value={service.prixUnitaire || 0}
                  onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, prixUnitaire: validerMontant(e.target.value)} : s))}
                />
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Total réalisations</label>
                <div className={`font-black text-xl px-4 py-2 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                  {totalRealisations}
                </div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>CA estimé</label>
                <div className={`font-black text-xl px-4 py-2 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                  {(totalRealisations * (service.prixUnitaire || 0)).toLocaleString()} €
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unités/Taux - uniquement pour les services sans promos et non-prestation */}
        {!hasPromos && !isPrestation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
              <InfoTooltip content="Nombre de bénéficiaires, usagers ou unités d'œuvre produits sur l'année (ex : nombre de stagiaires, journées de prise en charge…). Utilisé pour calculer le coût par unité et comparer l'efficience entre services." darkMode={darkMode} position="top">
                <label className={`text-xs font-black uppercase cursor-help ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Unités / Bénéficiaires</label>
              </InfoTooltip>
              <input type="number" className={`font-black text-2xl px-4 py-2 rounded-xl w-full outline-none mt-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-blue-700'}`} value={service.unites} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, unites: validerUnites(e.target.value)} : s))} />
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-teal-900/30 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
              <InfoTooltip content="Pourcentage de temps d'ouverture ou de fonctionnement du service sur l'année. Un service ouvert toute l'année = 100%. Un service saisonnier ouvert 9 mois sur 12 = 75%. Impacte le calcul des unités annuelles réelles." darkMode={darkMode} position="top">
                <label className={`text-xs font-black uppercase cursor-help ${darkMode ? 'text-teal-400' : 'text-slate-600'}`}>Taux d'activité (%)</label>
              </InfoTooltip>
              <input type="number" className={`font-black text-2xl px-4 py-2 rounded-xl w-full outline-none mt-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-slate-700'}`} value={service.tauxActivite} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, tauxActivite: validerTaux(e.target.value)} : s))} />
            </div>
          </div>
        )}

        {/* Taux d'activité - pour les services de formation */}
        {hasPromos && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-teal-900/30 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
              <InfoTooltip content="Pourcentage de temps d'ouverture ou de fonctionnement du service sur l'année. Un service ouvert toute l'année = 100%. Un service saisonnier ouvert 9 mois sur 12 = 75%. Impacte le calcul des unités annuelles réelles." darkMode={darkMode} position="top">
                <label className={`text-xs font-black uppercase cursor-help ${darkMode ? 'text-teal-400' : 'text-slate-600'}`}>Taux d'activité (%)</label>
              </InfoTooltip>
              <input type="number" className={`font-black text-2xl px-4 py-2 rounded-xl w-full outline-none mt-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-slate-700'}`} value={service.tauxActivite} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, tauxActivite: validerTaux(e.target.value)} : s))} />
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
              <label className={`text-xs font-black uppercase block mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Effectif total actuel</label>
              <div className={`font-black text-2xl px-4 py-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                {stats.effectifActuel} étudiants
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Investissements */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className={`text-sm font-black uppercase mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}><Landmark size={18} /> Investissements</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {Object.entries(service.investissements).map(([key, inv]) => {
                const info = COMPTES_IMMO[key];
                return (
                  <div key={key} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                    <div className="text-xs text-teal-600 font-bold">{info.compte} - {info.libelle}</div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <InfoTooltip content="Valeur d'acquisition hors taxes de l'immobilisation (€). Sert de base au calcul de l'amortissement annuel (Montant ÷ Durée) et aux intérêts d'emprunt si financement à crédit." darkMode={darkMode} position="top"><label className={`text-[10px] cursor-help ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Montant €</label></InfoTooltip>
                        <input type="number" placeholder="0" className={`w-full text-xs rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50'}`} value={inv.montant} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, investissements: {...s.investissements, [key]: {...inv, montant: validerMontant(e.target.value)}}} : s))} />
                      </div>
                      <div>
                        <InfoTooltip content="Durée d'amortissement comptable en années. Varie selon la nature du bien : 20–50 ans pour les constructions, 5–10 ans pour le matériel, 3–5 ans pour l'informatique. Détermine la dotation aux amortissements annuelle." darkMode={darkMode} position="top"><label className={`text-[10px] cursor-help ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Durée (ans)</label></InfoTooltip>
                        <input type="number" placeholder="0" className={`w-full text-xs rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50'}`} value={inv.duree} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, investissements: {...s.investissements, [key]: {...inv, duree: validerDuree(e.target.value)}}} : s))} />
                      </div>
                      <div>
                        <InfoTooltip content="Taux d'intérêt annuel du crédit finançant cet investissement (%). Laisser à 0 si l'achat est réalisé en fonds propres ou sur subvention. Le coût du crédit (intérêts) est inscrit en charges financières." darkMode={darkMode} position="top"><label className={`text-[10px] cursor-help ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Taux crédit %</label></InfoTooltip>
                        <input type="number" step="0.1" placeholder="0" className={`w-full text-xs rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-slate-50'}`} value={inv.taux} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, investissements: {...s.investissements, [key]: {...inv, taux: validerTaux(e.target.value)}}} : s))} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exploitation */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-teal-50 border-teal-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}><Cog size={18} className="text-red-500" /> Exploitation</h3>
              <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, exploitation: [...s.exploitation, { id: Date.now(), nom: 'Nouveau', montant: 0 }]} : s))} className="bg-teal-600 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {service.exploitation.map((item, expIdx) => (
                <div key={item.id} className={`flex items-center gap-1 p-2 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.filter(e => e.id !== item.id)} : s))} className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                  <button title="Dupliquer cette ligne" onClick={() => { const n={...item,id:Date.now(),nom:item.nom+' (copie)'}; const a=[...service.exploitation]; a.splice(expIdx+1,0,n); setServices(services.map(s=>s.id===service.id?{...s,exploitation:a}:s)); }} className="absolute -top-1 left-4 bg-teal-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Copy size={12} /></button>
                  <div className="flex flex-col gap-0 no-print">
                    <button disabled={expIdx===0} onClick={() => { const a=[...service.exploitation]; a.splice(expIdx-1,0,a.splice(expIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,exploitation:a}:s)); }} className={`p-0.5 rounded ${expIdx===0?'opacity-20':'hover:bg-teal-100'}`}><ChevronUp size={10}/></button>
                    <button disabled={expIdx===service.exploitation.length-1} onClick={() => { const a=[...service.exploitation]; a.splice(expIdx+1,0,a.splice(expIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,exploitation:a}:s)); }} className={`p-0.5 rounded ${expIdx===service.exploitation.length-1?'opacity-20':'hover:bg-teal-100'}`}><ChevronDown size={10}/></button>
                  </div>
                  <input className={`flex-1 text-xs font-bold bg-transparent outline-none ${darkMode ? 'text-white' : ''}`} value={item.nom} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, nom: e.target.value} : exp)} : s))} />
                  <input
                    placeholder="PCG"
                    title="Compte PCG (ex: 6132 pour loyer). Cliquez ⚡ pour détection automatique."
                    className={`text-[10px] w-14 rounded px-1 py-0.5 outline-none border no-print font-mono ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${item.comptePCG ? (darkMode ? 'border-blue-600 text-blue-300' : 'border-blue-400 text-blue-700') : ''}`}
                    value={item.comptePCG || ''}
                    onChange={e => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, comptePCG: e.target.value} : exp)} : s))}
                  />
                  <button
                    title="Détecter le compte PCG automatiquement selon le libellé"
                    onClick={() => { const detected = detecterComptePCG(item.nom); if (detected) setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, comptePCG: detected} : exp)} : s)); }}
                    className={`no-print text-[10px] px-1 py-0.5 rounded border transition-colors ${darkMode ? 'border-zinc-600 text-zinc-500 hover:text-yellow-400 hover:border-yellow-600' : 'border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-400'}`}
                  >⚡</button>
                  <input type="number" className={`w-20 text-right text-xs font-black rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={item.montant} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, montant: validerMontant(e.target.value)} : exp)} : s))} />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>€/m</span>
                  {globalParams.gestionTVA && (
                    <>
                      <button title="Basculer HT / TTC" onClick={() => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, saisieType: (item.saisieType || 'HT') === 'HT' ? 'TTC' : 'HT'} : exp)} : s))}
                        className={`text-[10px] font-black px-1 py-0.5 rounded border ${(item.saisieType || 'HT') === 'TTC' ? (darkMode ? 'bg-amber-900/40 border-amber-600 text-amber-300' : 'bg-amber-100 border-amber-400 text-amber-700') : (darkMode ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-white border-slate-300 text-slate-500')}`}>
                        {item.saisieType || 'HT'}
                      </button>
                      <button title="TVA récupérable / non récupérable" onClick={() => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, tvaRecuperable: item.tvaRecuperable === false ? true : false} : exp)} : s))}
                        className={`text-[10px] font-black px-1 py-0.5 rounded border ${item.tvaRecuperable === false ? (darkMode ? 'bg-red-900/40 border-red-600 text-red-300' : 'bg-red-100 border-red-400 text-red-700') : (darkMode ? 'bg-green-900/40 border-green-600 text-green-300' : 'bg-green-100 border-green-400 text-green-700')}`}>
                        {item.tvaRecuperable === false ? 'TVA✗' : 'TVA♻'}
                      </button>
                    </>
                  )}
                  <Tag size={10} className={`${darkMode ? 'text-zinc-500' : 'text-slate-300'}`} />
                  <input
                    placeholder="tag"
                    className={`text-[10px] w-20 rounded px-1 py-0.5 outline-none border ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${item.tagProjet ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-300 text-violet-700') : ''}`}
                    value={item.tagProjet || ''}
                    onChange={e => setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, tagProjet: e.target.value} : exp)} : s))}
                  />
                  <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-xs rounded px-2 py-1 border ${item.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={item.realise ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setServices(services.map(s => s.id === service.id ? {...s, exploitation: s.exploitation.map(exp => exp.id === item.id ? {...exp, realise: v} : exp)} : s)); }} />
                  {item.realise != null && (() => { const ecart = (item.realise - item.montant); return <span className={`text-[10px] font-bold ${ecart > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{ecart > 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                </div>
              ))}
            </div>
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'} flex justify-between font-bold`}>
              <span className={darkMode ? 'text-teal-400' : 'text-teal-700'}>Total/an:</span>
              <div className="text-right">
                <div className={darkMode ? 'text-white' : 'text-teal-800'}>{Math.round(bs.exploitation).toLocaleString()} €</div>
                {bs.exploitationRealisee > 0 && <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Réalisé: {Math.round(bs.exploitationRealisee).toLocaleString()} €</div>}
              </div>
            </div>
          </div>

          {/* Personnel */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-teal-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}><Users size={18} /> Équipe</h3>
              <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: [...s.personnel, { id: Date.now(), titre: 'Nouveau', etp: 1, salaire: 2500, segur: 0, typeContrat: 'CDI', nbJoursRTT: 0, joursConges: 25, dateFinContrat: '' }]} : s))} className="bg-slate-700 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {service.personnel.map((p, pIdx) => (
                <div key={p.id} id={`agent-budget-${p.id}`} className={`p-3 rounded-xl group relative transition-all duration-700 border ${focusedAgentId === p.id ? (darkMode ? 'ring-2 ring-yellow-400 bg-yellow-900/30' : 'ring-2 ring-yellow-400 bg-yellow-50') : (darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-teal-100')}`}>
                  <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.filter(x => x.id !== p.id)} : s))} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex flex-col gap-0 no-print">
                      <button disabled={pIdx===0} onClick={() => { const a=[...service.personnel]; a.splice(pIdx-1,0,a.splice(pIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,personnel:a}:s)); }} className={`p-0.5 rounded ${pIdx===0?'opacity-20':'hover:bg-slate-100'}`}><ChevronUp size={10}/></button>
                      <button disabled={pIdx===service.personnel.length-1} onClick={() => { const a=[...service.personnel]; a.splice(pIdx+1,0,a.splice(pIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,personnel:a}:s)); }} className={`p-0.5 rounded ${pIdx===service.personnel.length-1?'opacity-20':'hover:bg-slate-100'}`}><ChevronDown size={10}/></button>
                    </div>
                    <input className={`font-bold text-sm flex-1 outline-none bg-transparent ${darkMode ? 'text-white' : ''} ${privacyMode ? 'blur-sm select-none pointer-events-none' : ''}`} value={p.titre} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, titre: e.target.value} : x)} : s))} />
                    <input placeholder="Matr." title="Matricule RH (mapping Dolibarr)" className={`no-print text-[10px] w-16 rounded px-1 py-0.5 outline-none border font-mono ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-400 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-500 placeholder-slate-300'} ${p.matricule ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-400 text-violet-700') : ''} opacity-0 group-hover:opacity-100 transition-opacity`} value={p.matricule || ''} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, matricule: e.target.value} : x)} : s))} />
                    <button onClick={() => navigateToRHAgent(p.id)} className={`no-print p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-gray-500 text-teal-400' : 'hover:bg-teal-50 text-teal-600'}`} title="Voir dans RH"><ExternalLink size={12} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                    <div><InfoTooltip content="ETP = Équivalent Temps Plein. 1 = temps complet, 0.5 = mi-temps. Impacte directement le coût employeur." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</label></InfoTooltip><input type="number" step="0.1" className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.etp} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, etp: validerETP(e.target.value)} : x)} : s))} /></div>
                    <div><InfoTooltip content="Salaire brut mensuel en euros (hors charges patronales et hors prime Ségur). Coût employeur = salaire × 12 × ETP × 1,42." darkMode={darkMode} position="top"><label className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Salaire</label></InfoTooltip><NumericInput className={`w-full rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50'}`} value={p.salaire} onChange={v => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, salaire: v} : x)} : s))} /></div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
                    <select className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.role || 'formateur'} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, role: e.target.value} : x)} : s))}>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={p.rqth || false} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, rqth: e.target.checked} : x)} : s))} /><span className={p.rqth ? 'text-amber-500 font-black' : (darkMode ? 'text-gray-400' : 'text-slate-500')}>RQTH</span></label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={!!p.segur} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, segur: e.target.checked} : x)} : s))} /><span className={`text-xs ${p.segur ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>Ségur {p.segur ? `(+${p.segur === true ? (globalParams.montantSegurETP ?? 238) : (parseFloat(p.segur) || 0)} €/m)` : ''}</span></label>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-0.5 cursor-pointer" title="Prise en charge Région : le % du coût employeur s'ajoute aux recettes du service"><input type="checkbox" checked={!!p.eligibleSubvention} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, eligibleSubvention: e.target.checked, tauxSubvRegion: e.target.checked ? (x.tauxSubvRegion ?? 100) : x.tauxSubvRegion} : x)} : s))} /><span className={`text-xs font-semibold flex items-center gap-0.5 ${p.eligibleSubvention ? (darkMode ? 'text-violet-400' : 'text-violet-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}><Landmark size={10} />Région</span></label>
                      {p.eligibleSubvention && (<><input type="number" min="0" max="100" className={`w-11 text-right text-xs rounded px-1 py-0.5 font-bold border ${darkMode ? 'bg-violet-900/40 border-violet-600 text-violet-200' : 'bg-violet-50 border-violet-300 text-violet-700'}`} value={p.tauxSubvRegion ?? 100} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, tauxSubvRegion: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))} : x)} : s))} /><span className={`text-[10px] ${darkMode ? 'text-violet-400' : 'text-violet-500'}`}>%</span></>)}
                    </div>
                    <button
                      onClick={() => {
                        const updatedAgent = { ...p, multiAffectation: true, affectations: [{ entityType: 'service', entityId: service.id, pct: 100 }] };
                        setPoolRH([...poolRH, updatedAgent]);
                        setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.filter(x => x.id !== p.id)} : s));
                      }}
                      title="Marquer comme partagé — déplace l'agent dans le Pool RH commun (affectable à plusieurs services)"
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold no-print transition-colors ${darkMode ? 'bg-gray-600 text-gray-400 hover:bg-purple-900/40 hover:text-purple-300' : 'bg-slate-100 text-slate-400 hover:bg-purple-100 hover:text-purple-700'}`}
                    >Partagé</button>
                    <div className="flex items-center gap-1">
                      <InfoTooltip content="Année de naissance — utilisée pour la pyramide des âges et les alertes départs en retraite." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Né(e) en</span></InfoTooltip>
                      <input type="number" min="1940" max="2005" placeholder="1980"
                        className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`}
                        value={p.anneeNaissance || ''}
                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, anneeNaissance: parseInt(e.target.value) || 0} : x)} : s))}
                      />
                      <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Entrée</span>
                      <input type="number" min="1990" max="2026" placeholder="2020"
                        className={`w-16 rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`}
                        value={p.dateEntree || ''}
                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateEntree: parseInt(e.target.value) || 0} : x)} : s))}
                      />
                      {p.dateEntree > 0 && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                          {2026 - p.dateEntree} an{2026 - p.dateEntree > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <select className={`rounded px-2 py-1 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.typeContrat || 'CDI'} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, typeContrat: e.target.value, dateFinContrat: e.target.value === 'CDI' ? '' : x.dateFinContrat} : x)} : s))}>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Apprentissage">Apprentissage</option>
                      <option value="Stage">Stage</option>
                      <option value="Vacataire">Vacataire</option>
                      <option value="Autre">Autre</option>
                    </select>
                    {(p.typeContrat && p.typeContrat !== 'CDI') && (
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Fin</span>
                        <input type="date" title="Date de fin de contrat — génère une alerte automatique"
                          className={`rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-amber-50 border border-amber-300'}`}
                          value={p.dateFinContrat || ''}
                          onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)} : s))}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <InfoTooltip content="RTT = Réduction du Temps de Travail. Jours de repos accordés en compensation des heures supplémentaires liées à l'annualisation du temps de travail." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>RTT</span></InfoTooltip>
                      <input type="number" min="0" max="30" step="0.5" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.nbJoursRTT ?? 0} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, nbJoursRTT: parseFloat(e.target.value) || 0} : x)} : s))} />
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <InfoTooltip content="CP = Congés Payés annuels. Minimum légal : 25 jours (5 semaines). Utilisé pour calculer le taux de présence effectif de l'agent." darkMode={darkMode} position="top"><span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CP</span></InfoTooltip>
                      <input type="number" min="0" max="50" className={`w-12 text-center rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.joursConges ?? 25} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, joursConges: parseInt(e.target.value) || 25} : x)} : s))} />
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>j</span>
                    </div>
                    {(p.typeContrat && p.typeContrat !== 'CDI') && (
                      <div className="flex items-center gap-1">
                        <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Fin contrat</span>
                        <input type="date" className={`rounded px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border'}`} value={p.dateFinContrat || ''} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateFinContrat: e.target.value} : x)} : s))} />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <InfoTooltip content="Taux de charges patronales forcé (%). Si vide, l'outil calcule automatiquement le taux réel incluant l'allègement Fillon." darkMode={darkMode} position="top">
                        <span className={`cursor-help font-bold ${p.tauxChargesManuel > 0 ? 'text-amber-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Ch.%</span>
                      </InfoTooltip>
                      <input type="number" min="0" max="100" step="0.1" placeholder="auto"
                        className={`w-14 text-center rounded px-1 py-0.5 text-xs font-bold ${p.tauxChargesManuel > 0 ? (darkMode ? 'bg-amber-900/40 border border-amber-600 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border')}`}
                        value={p.tauxChargesManuel || ''}
                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, tauxChargesManuel: e.target.value === '' ? null : parseFloat(e.target.value)} : x)} : s))}
                      />
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer" title="Poste à pourvoir — le salaire sera proraté selon la date de début prévue">
                      <input type="checkbox" checked={!!p.estPosteAPourvoir} onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, estPosteAPourvoir: e.target.checked} : x)} : s))} />
                      <span className={`text-xs font-semibold ${p.estPosteAPourvoir ? 'text-orange-500' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>En recrutement</span>
                    </label>
                    {p.estPosteAPourvoir && (
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Début prévu</span>
                        <input type="month" className={`rounded px-1 py-0.5 text-xs ${darkMode ? 'bg-orange-900/40 border border-orange-600 text-orange-300' : 'bg-orange-50 border border-orange-300 text-orange-700'}`}
                          value={p.dateDebutPrevue || ''}
                          onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, dateDebutPrevue: e.target.value} : x)} : s))} />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-semibold ${p.moisPrime ? (darkMode ? 'text-purple-400' : 'text-purple-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>Prime</span>
                      <select className={`rounded px-1 py-0.5 text-xs ${p.moisPrime ? (darkMode ? 'bg-purple-900/40 border border-purple-600 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700') : (darkMode ? 'bg-gray-500 text-white' : 'bg-teal-50 border')}`}
                        value={p.moisPrime || ''}
                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, moisPrime: e.target.value ? parseInt(e.target.value) : null, montantPrime: e.target.value ? (x.montantPrime || 0) : 0} : x)} : s))}>
                        <option value="">Aucune</option>
                        {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, idx) => (
                          <option key={idx + 1} value={idx + 1}>{m}</option>
                        ))}
                      </select>
                      {p.moisPrime && (
                        <>
                          <NumericInput className={`w-20 rounded px-1 py-0.5 text-xs font-bold ${darkMode ? 'bg-purple-900/40 border border-purple-600 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700'}`}
                            value={p.montantPrime || 0}
                            onChange={v => setServices(services.map(s => s.id === service.id ? {...s, personnel: s.personnel.map(x => x.id === p.id ? {...x, montantPrime: v} : x)} : s))} />
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€ brut</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Absences */}
                  <details className="mt-1.5">
                    <summary className={`text-xs cursor-pointer select-none flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Calendar size={12} />
                      {(p.absences||[]).length > 0 ? `${(p.absences||[]).length} période(s)` : 'Congés / Arrêts'}
                    </summary>
                    <div className="mt-1.5 space-y-1 pl-1">
                      {(p.absences||[]).map(ab => (
                        <div key={ab.id} className={`flex flex-wrap items-center gap-1 text-xs rounded-lg px-2 py-1 ${ab.type==='conge'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-50 border border-blue-200'):ab.type==='maladie'?(darkMode?'bg-red-900/40 text-red-300':'bg-red-50 border border-red-200'):ab.type==='rtt'?(darkMode?'bg-purple-900/40 text-purple-300':'bg-purple-50 border border-purple-200'):(darkMode?'bg-orange-900/40 text-orange-300':'bg-orange-50 border border-orange-200')}`}>
                          <select className="bg-transparent font-bold outline-none text-xs" value={ab.type} onChange={e => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,type:e.target.value}:a)}:x)}:s))}>
                            <option value="conge">Congé</option>
                            <option value="maladie">Maladie</option>
                            <option value="rtt">RTT</option>
                            <option value="arret">Arrêt travail</option>
                          </select>
                          <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateDebut||''} onChange={e => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateDebut:e.target.value}:a)}:x)}:s))} />
                          <span>→</span>
                          <input type="date" className="bg-transparent outline-none text-xs" value={ab.dateFin||''} onChange={e => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).map(a=>a.id===ab.id?{...a,dateFin:e.target.value}:a)}:x)}:s))} />
                          <button onClick={() => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:(x.absences||[]).filter(a=>a.id!==ab.id)}:x)}:s))} className="ml-auto text-red-400 hover:text-red-600 no-print"><X size={12}/></button>
                        </div>
                      ))}
                      <button onClick={() => setServices(services.map(s => s.id===service.id?{...s,personnel:s.personnel.map(x=>x.id===p.id?{...x,absences:[...(x.absences||[]),{id:Date.now(),type:'conge',dateDebut:'',dateFin:''}]}:x)}:s))} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded border border-dashed no-print ${darkMode?'border-gray-500 text-gray-400 hover:text-gray-200':'border-slate-300 text-slate-400 hover:text-slate-600'}`}>
                        <Plus size={10}/> Ajouter
                      </button>
                    </div>
                  </details>
                  <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
                    {/* Bouton ouvre modal FI% */}
                    {(() => {
                      const rfc = p.repartitionFC || p.repartitionFI || makeRepartitionFI();
                      const pctMoyen = moisKeysFI.reduce((s, m) => s + (rfc[m] || 0), 0) / 12;
                      const hasData = pctMoyen > 0;
                      return (
                        <button
                          onClick={() => setFiDialog({ serviceId: service.id, agentId: p.id })}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold no-print transition-colors ${hasData ? (darkMode ? 'bg-amber-700 text-amber-100' : 'bg-amber-200 text-amber-800') : (darkMode ? 'bg-gray-600 text-gray-300 hover:bg-amber-800/50 hover:text-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700')}`}
                          title="Répartition mensuelle du salaire en Formation Continue (FC%) — la part restante est imputée en FI"
                        >
                          <Zap size={12} /> FC% {hasData && <span className="opacity-75">{pctMoyen.toFixed(0)}% moy.</span>}
                        </button>
                      );
                    })()}
                    {(() => {
                      const pr = calculerPresenceAgent(p, service.nom, planningAbsences, 2026);
                      if (pr.absences.total === 0) return null;
                      const delta = parseFloat(p.etp) - pr.etpReel;
                      return (
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'}`} title={`${pr.absences.total}j d'absence · ETP effectif selon planning`}>
                          <UserMinus size={11} /> ETP réel {pr.etpReel.toFixed(2)} <span className="opacity-60">(-{delta.toFixed(2)})</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
            {/* Agents Pool RH affectés à ce service */}
            {poolRH.filter(a => (a.affectations || []).some(aff => aff.entityType === 'service' && aff.entityId === service.id)).map(poolAgent => {
              const aff = (poolAgent.affectations || []).find(a => a.entityType === 'service' && a.entityId === service.id);
              return (
                <div key={poolAgent.id} className={`mt-2 p-3 rounded-xl border group ${darkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500 text-white">Partagé</span>
                    <input
                      className={`font-bold flex-1 bg-transparent border-b outline-none ${darkMode ? 'text-white border-zinc-600 focus:border-purple-400' : 'text-slate-800 border-slate-200 focus:border-purple-400'}`}
                      value={poolAgent.titre || ''}
                      placeholder="Nom du salarié"
                      onChange={e => setPoolRH(poolRH.map(a => a.id === poolAgent.id ? {...a, titre: e.target.value} : a))}
                    />
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Quote-part :</span>
                    <input
                      type="number" min="0" max="100"
                      className={`w-14 text-right rounded px-2 py-1 font-bold border ${darkMode ? 'bg-purple-900/40 border-purple-600 text-purple-200' : 'bg-white border-purple-300'}`}
                      value={aff?.pct ?? 100}
                      onChange={e => {
                        const newPct = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setPoolRH(poolRH.map(a => a.id === poolAgent.id ? {
                          ...a,
                          affectations: a.affectations.map(af =>
                            af.entityType === 'service' && af.entityId === service.id ? {...af, pct: newPct} : af
                          )
                        } : a));
                      }}
                    />
                    <span className={darkMode ? 'text-gray-500' : 'text-slate-400'}>%</span>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-0.5 cursor-pointer" title="Prise en charge Région : le % du coût employeur s'ajoute aux recettes du service">
                        <input type="checkbox" checked={!!poolAgent.eligibleSubvention} onChange={e => setPoolRH(poolRH.map(a => a.id === poolAgent.id ? {...a, eligibleSubvention: e.target.checked, tauxSubvRegion: e.target.checked ? (a.tauxSubvRegion ?? 100) : a.tauxSubvRegion} : a))} />
                        <span className={`text-xs font-semibold flex items-center gap-0.5 ${poolAgent.eligibleSubvention ? (darkMode ? 'text-violet-400' : 'text-violet-600') : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}><Landmark size={10} />Région</span>
                      </label>
                      {poolAgent.eligibleSubvention && (<><input type="number" min="0" max="100" className={`w-11 text-right text-xs rounded px-1 py-0.5 font-bold border ${darkMode ? 'bg-violet-900/40 border-violet-600 text-violet-200' : 'bg-violet-50 border-violet-300 text-violet-700'}`} value={poolAgent.tauxSubvRegion ?? 100} onChange={e => setPoolRH(poolRH.map(a => a.id === poolAgent.id ? {...a, tauxSubvRegion: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))} : a))} /><span className={`text-[10px] ${darkMode ? 'text-violet-400' : 'text-violet-500'}`}>%</span></>)}
                    </div>
                    <button
                      onClick={() => {
                        const {multiAffectation: _ma, affectations: _af, ...agentBack} = poolAgent;
                        setServices(services.map(s => s.id === service.id ? {...s, personnel: [...s.personnel, agentBack]} : s));
                        setPoolRH(poolRH.filter(x => x.id !== poolAgent.id));
                      }}
                      title="Annuler le partage — replacer dans ce service uniquement"
                      className={`no-print ml-auto p-1 rounded ${darkMode ? 'text-purple-400 hover:bg-purple-800' : 'text-purple-600 hover:bg-purple-100'}`}
                    ><X size={12} /></button>
                  </div>
                </div>
              );
            })}
            {/* Vacataires pédagogiques */}
            {(() => {
              const MOIS_VAC_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
              const MOIS_VAC_KEYS   = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
              const updV = (vid, patch) => setServices(services.map(s => s.id === service.id ? {...s, vacataires: (s.vacataires||[]).map(x => x.id === vid ? {...x, ...patch} : x)} : s));
              const today = new Date();
              return (
                <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'}`}>
                  {/* En-tête + enveloppe budgétaire */}
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <h4 className={`text-xs font-black uppercase flex items-center gap-1.5 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                      <GraduationCap size={14} /> Vacataires FC / FI
                    </h4>
                    <div className="flex items-center gap-2">
                      <InfoTooltip content="Budget maximal alloué aux vacataires (FI + FC) pour ce service sur l'année. Déclenche une alerte visuelle si le coût réel calculé dépasse ce plafond." darkMode={darkMode} position="top">
                        <span className={`text-xs cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Enveloppe :</span>
                      </InfoTooltip>
                      <input type="number" min="0" step="100" placeholder="0 €"
                        className={`w-24 rounded px-2 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-white border'} ${bs.alerteEnveloppe ? 'border-red-500' : ''}`}
                        value={service.budgetVacataires || ''}
                        onChange={e => setServices(services.map(s => s.id === service.id ? {...s, budgetVacataires: parseFloat(e.target.value) || 0} : s))}
                      />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/an</span>
                      <button onClick={() => setServices(services.map(s => s.id === service.id ? {
                        ...s, vacataires: [...(s.vacataires||[]), { id: Date.now(), nom: 'Intervenant', type: 'fi', tauxHoraire: 50, tauxCharges: CHARGES_VACATAIRE, pctFI: 100, planningMensuel: { jan:0,fev:0,mar:0,avr:0,mai:0,jun:0,jul:0,aou:0,sep:0,oct:0,nov:0,dec:0 }, typeContrat: 'convention', siret: '', dateDebut: '', dateFin: '' }]
                      } : s))}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg no-print ${darkMode ? 'bg-purple-800 text-purple-200 hover:bg-purple-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                      ><Plus size={12} /> Ajouter</button>
                    </div>
                  </div>

                  {/* Alertes enveloppe */}
                  {bs.alerteEnveloppe && (
                    <div className={`mb-2 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-50 border border-red-300 text-red-700'}`}>
                      <AlertTriangle size={12} /> Enveloppe dépassée : {Math.round(bs.coutVacataires).toLocaleString()} € / {Math.round(bs.enveloppeVacataires).toLocaleString()} €
                    </div>
                  )}
                  {bs.alerteRatioVacataires && (
                    <div className={`mb-2 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-700'}`}>
                      <AlertTriangle size={12} /> Ratio vacataires élevé : {bs.ratioVacataires.toFixed(0)}% de la masse salariale (seuil {SEUIL_RATIO_VACATAIRE}%)
                    </div>
                  )}

                  <div className="space-y-3">
                    {(service.vacataires || []).map((v) => {
                      const MOIS_VAC_K = ['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'];
                      const heuresMois = MOIS_VAC_K.map(m => parseFloat(v.planningMensuel?.[m]) || 0);
                      const hTotal = heuresMois.reduce((s,h) => s+h, 0) || 0;
                      const tauxH = parseFloat(v.tauxHoraire) || 0;
                      const charges = parseFloat(v.tauxCharges ?? CHARGES_VACATAIRE) / 100;
                      const coutCharge = hTotal * tauxH * (1 + charges);
                      const depasse = hTotal > SEUIL_HEURES_VACATAIRE;
                      const contratExpire = v.dateFin && new Date(v.dateFin) < today;
                      const contratManquant = !v.dateFin;
                      return (
                        <div key={v.id} className={`p-3 rounded-xl border group relative ${darkMode ? 'bg-gray-600 border-purple-900' : 'bg-purple-50 border-purple-200'} ${(depasse||contratExpire) ? 'border-red-400' : ''}`}>
                          <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, vacataires: (s.vacataires||[]).filter(x => x.id !== v.id)} : s))} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={12} /></button>

                          {/* Ligne 1 : nom + type pédago + type contrat */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <input className={`font-bold text-xs flex-1 min-w-0 outline-none bg-transparent ${darkMode ? 'text-white' : 'text-slate-800'}`} value={v.nom} onChange={e => updV(v.id, {nom: e.target.value})} />
                            <select className={`rounded px-1.5 py-0.5 text-xs font-black ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800 border border-purple-300'}`} value={v.type} onChange={e => updV(v.id, {type: e.target.value, pctFI: e.target.value==='fi'?100:e.target.value==='fc'?0:v.pctFI})}>
                              <option value="fi">FI</option>
                              <option value="fc">FC</option>
                              <option value="mixte">Mixte</option>
                            </select>
                            <select className={`rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-gray-200' : 'bg-white border text-slate-600'}`} value={v.typeContrat || 'convention'} onChange={e => updV(v.id, {typeContrat: e.target.value})}>
                              <option value="convention">Convention</option>
                              <option value="intervention">Contrat d'intervention</option>
                              <option value="auto_entrepreneur">Auto-entrepreneur</option>
                              <option value="autre">Autre</option>
                            </select>
                          </div>

                          {/* Ligne 2 : taux horaire + charges + % FI */}
                          <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <InfoTooltip content="Taux horaire brut versé à l'intervenant (€/heure). Multiplié par les heures planifiées et les charges patronales pour obtenir le coût employeur total." darkMode={darkMode} position="top">
                                <span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taux</span>
                              </InfoTooltip>
                              <input type="number" min="0" step="1" className={`w-16 rounded px-1.5 py-0.5 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.tauxHoraire} onChange={e => updV(v.id, {tauxHoraire: parseFloat(e.target.value)||0})} />
                              <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>€/h</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <InfoTooltip content="Taux de charges patronales appliqué (%). Les vacataires bénéficient d'un régime allégé (~15%). Un prestataire auto-entrepreneur facture HT sans charges supplémentaires (mettre 0%)." darkMode={darkMode} position="top">
                                <span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Ch.</span>
                              </InfoTooltip>
                              <input type="number" min="0" max="100" step="1" className={`w-12 rounded px-1.5 py-0.5 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.tauxCharges ?? CHARGES_VACATAIRE} onChange={e => updV(v.id, {tauxCharges: parseFloat(e.target.value)||0})} />
                              <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>%</span>
                            </div>
                            {v.type === 'mixte' && (
                              <div className="flex items-center gap-1">
                                <InfoTooltip content="Part des heures allouée à la Formation Initiale (FI). Le solde est affecté à la Formation Continue (FC). Impacte la ventilation des coûts dans la synthèse analytique et la DAF." darkMode={darkMode} position="top">
                                  <span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>%FI</span>
                                </InfoTooltip>
                                <input type="number" min="0" max="100" step="5" className={`w-12 rounded px-1.5 py-0.5 font-bold ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.pctFI ?? 50} onChange={e => updV(v.id, {pctFI: parseFloat(e.target.value)||0})} />
                                <span className={darkMode ? 'text-gray-400' : 'text-slate-400'}>FC:{100-(v.pctFI??50)}%</span>
                              </div>
                            )}
                            {v.typeContrat === 'auto_entrepreneur' && (
                              <div className="flex items-center gap-1">
                                <InfoTooltip content="Numéro SIRET de l'auto-entrepreneur (14 chiffres). Obligatoire pour les conventions de prestation avec un travailleur indépendant — vérification légale avant paiement." darkMode={darkMode} position="top">
                                  <span className={`cursor-help ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>SIRET</span>
                                </InfoTooltip>
                                <input type="text" maxLength={14} placeholder="14 chiffres" className={`w-32 rounded px-1.5 py-0.5 text-xs font-mono ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.siret || ''} onChange={e => updV(v.id, {siret: e.target.value})} />
                              </div>
                            )}
                          </div>

                          {/* Ligne 3 : dates contrat */}
                          <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Début</span>
                              <input type="date" className={`rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'}`} value={v.dateDebut || ''} onChange={e => updV(v.id, {dateDebut: e.target.value})} />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`${darkMode ? 'text-gray-400' : 'text-slate-500'} ${contratExpire ? 'text-red-500 font-black' : ''}`}>Fin</span>
                              <input type="date" className={`rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-500 text-white' : 'bg-white border'} ${contratExpire ? 'border-red-500' : ''}`} value={v.dateFin || ''} onChange={e => updV(v.id, {dateFin: e.target.value})} />
                            </div>
                            {contratExpire && <span className="text-red-500 font-black text-xs flex items-center gap-1"><AlertTriangle size={11} /> Expiré</span>}
                            {contratManquant && <span className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'} flex items-center gap-1`}><AlertCircle size={11} /> Fin manquante</span>}
                          </div>

                          {/* Planning mensuel 12 mois */}
                          <div className={`rounded-lg p-2 ${darkMode ? 'bg-gray-700' : 'bg-white border border-purple-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Planning mensuel (h)</span>
                              <div className="flex gap-1">
                                <button onClick={() => {
                                  const eq = Math.round(hTotal / 12);
                                  const plan = {};
                                  MOIS_VAC_K.forEach(m => { plan[m] = eq; });
                                  updV(v.id, {planningMensuel: plan});
                                }} className={`text-xs px-1.5 py-0.5 rounded no-print ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="Répartir uniformément">= Égal</button>
                                <button onClick={() => updV(v.id, {planningMensuel: { jan:0,fev:0,mar:0,avr:0,mai:0,jun:0,jul:0,aou:0,sep:0,oct:0,nov:0,dec:0 }})} className={`text-xs px-1.5 py-0.5 rounded no-print ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-slate-100 text-slate-500'}`} title="Tout vider">RAZ</button>
                              </div>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              {MOIS_VAC_KEYS.map((m, i) => (
                                <div key={m} className="text-center">
                                  <div className={`text-xs mb-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{MOIS_VAC_COURTS[i]}</div>
                                  <input type="number" min="0" step="1"
                                    className={`w-full text-center rounded px-0.5 py-0.5 text-xs font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-purple-50 border border-purple-200'} ${heuresMois[i] > 0 ? (darkMode ? 'bg-purple-900/40' : 'bg-purple-100') : ''}`}
                                    value={v.planningMensuel?.[m] ?? 0}
                                    onChange={e => updV(v.id, {planningMensuel: {...(v.planningMensuel||{}), [m]: parseFloat(e.target.value)||0}})}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Récapitulatif + alertes */}
                          <div className={`mt-2 pt-2 border-t text-xs font-bold flex flex-wrap justify-between gap-1 ${darkMode ? 'border-gray-500' : 'border-purple-200'}`}>
                            <span className={darkMode ? 'text-purple-300' : 'text-purple-700'}>
                              {hTotal}h × {tauxH}€/h + {v.tauxCharges ?? CHARGES_VACATAIRE}% = {Math.round(coutCharge).toLocaleString()} €/an
                            </span>
                            {depasse && <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={11} /> Seuil {SEUIL_HEURES_VACATAIRE}h dépassé</span>}
                          </div>
                        </div>
                      );
                    })}
                    {(service.vacataires || []).length === 0 && (
                      <p className={`text-xs text-center py-2 ${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>Aucun vacataire — cliquer "+ Ajouter"</p>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-teal-200'} flex justify-between font-bold`}>
              <span className={darkMode ? 'text-gray-300' : 'text-slate-700'}>Masse salariale:</span>
              <span className={darkMode ? 'text-white' : 'text-slate-800'}>{Math.round(bs.salaires).toLocaleString()} €</span>
            </div>
            {bs.coutVacataires > 0 && (
              <div className={`mt-1 flex justify-between text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                <span className="flex items-center gap-1"><GraduationCap size={11} /> dont vacataires ({(service.vacataires||[]).length}) · ratio {bs.ratioVacataires.toFixed(0)}% :</span>
                <span>{Math.round(bs.coutVacataires).toLocaleString()} €</span>
              </div>
            )}
            {bs.coutVacatairesFI > 0 && (
              <div className={`mt-0.5 flex justify-between text-xs ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                <span className="pl-4">dont FI :</span><span>{Math.round(bs.coutVacatairesFI).toLocaleString()} €</span>
              </div>
            )}
            {bs.coutVacatairesFC > 0 && (
              <div className={`mt-0.5 flex justify-between text-xs ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                <span className="pl-4">dont FC :</span><span>{Math.round(bs.coutVacatairesFC).toLocaleString()} €</span>
              </div>
            )}
            {bs.coutParEtudiant && (
              <div className={`mt-1 flex justify-between text-xs font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                <span>Coût / étudiant (effectif final {bs.coutParEtudiant.effectif}) :</span>
                <span>{Math.round(bs.coutParEtudiant.coutParEtudiant).toLocaleString()} €</span>
              </div>
            )}
            {bs.coutParEtudiant && bs.coutParEtudiant.effectifInitial !== bs.coutParEtudiant.effectif && (
              <div className={`flex justify-between text-xs ${darkMode ? 'text-cyan-500/80' : 'text-cyan-600/80'}`}>
                <span className="pl-2">Coût / étudiant (initial {bs.coutParEtudiant.effectifInitial}) :</span>
                <span>{Math.round(bs.coutParEtudiant.coutParEtudiantInitial).toLocaleString()} €</span>
              </div>
            )}
            {bs.salairesAllouesFI > 0 && (
              <div className={`mt-1 text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Zap size={11} /> Part FC formateurs:</span>
                  <span>{Math.round(bs.salairesAllouesFC).toLocaleString()} €</span>
                </div>
                <div className={`flex justify-between ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                  <span className="flex items-center gap-1"><Zap size={11} /> Part FI (extraite):</span>
                  <span>-{Math.round(bs.salairesAllouesFI).toLocaleString()} €</span>
                </div>
              </div>
            )}
          </div>

          {/* Recettes */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-700 border-green-800' : 'bg-green-50 border-green-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}><Banknote size={18} /> Recettes</h3>
              <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, recettes: [...(s.recettes || []), { id: Date.now(), nom: 'Nouvelle recette', montant: 0 }]} : s))} className="bg-green-600 text-white p-1.5 rounded-lg no-print"><Plus size={16} /></button>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {bs.subventionRegionAgents > 0 && (() => {
                const tauxDep = bs.recettes > 0 ? Math.round(bs.subventionRegionAgents / bs.recettes * 100) : 0;
                const depHigh = tauxDep >= 70;
                const depMed  = tauxDep >= 40 && tauxDep < 70;
                return (
                  <div className={`p-2 rounded-xl border ${darkMode ? 'bg-violet-900/20 border-violet-700' : 'bg-violet-50 border-violet-200'}`}>
                    <div className="flex items-center gap-2">
                      <Landmark size={13} className={darkMode ? 'text-violet-400' : 'text-violet-600'} />
                      <span className={`flex-1 text-xs font-bold ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>Subvention Région — salaires éligibles</span>
                      <span className={`text-xs font-black ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>+{Math.round(bs.subventionRegionAgents / 12).toLocaleString()} €/m</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-zinc-700' : 'bg-violet-100'}`}>
                        <div className={`h-full rounded-full transition-all ${depHigh ? 'bg-red-500' : depMed ? 'bg-amber-400' : 'bg-violet-400'}`} style={{ width: `${Math.min(100, tauxDep)}%` }} />
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${depHigh ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : depMed ? (darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700') : (darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700')}`}>
                        {tauxDep}% des recettes
                      </span>
                      <span className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{Math.round(bs.subventionRegionAgents).toLocaleString()} €/an</span>
                    </div>
                  </div>
                );
              })()}
              {(service.recettes || []).map((item, recIdx) => (
                <div key={item.id} className={`flex items-center gap-1 p-2 rounded-xl group relative ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <button onClick={() => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.filter(r => r.id !== item.id)} : s))} className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14} /></button>
                  <button title="Dupliquer cette ligne" onClick={() => { const n={...item,id:Date.now(),nom:item.nom+' (copie)'}; const a=[...(service.recettes||[])]; a.splice(recIdx+1,0,n); setServices(services.map(s=>s.id===service.id?{...s,recettes:a}:s)); }} className="absolute -top-1 left-4 bg-green-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 no-print"><Copy size={12} /></button>
                  <div className="flex flex-col gap-0 no-print">
                    <button disabled={recIdx===0} onClick={() => { const a=[...(service.recettes||[])]; a.splice(recIdx-1,0,a.splice(recIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,recettes:a}:s)); }} className={`p-0.5 rounded ${recIdx===0?'opacity-20':'hover:bg-green-100'}`}><ChevronUp size={10}/></button>
                    <button disabled={recIdx===(service.recettes||[]).length-1} onClick={() => { const a=[...(service.recettes||[])]; a.splice(recIdx+1,0,a.splice(recIdx,1)[0]); setServices(services.map(s=>s.id===service.id?{...s,recettes:a}:s)); }} className={`p-0.5 rounded ${recIdx===(service.recettes||[]).length-1?'opacity-20':'hover:bg-green-100'}`}><ChevronDown size={10}/></button>
                  </div>
                  <input className={`flex-1 text-xs font-bold bg-transparent outline-none ${darkMode ? 'text-white' : ''}`} value={item.nom} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, nom: e.target.value} : rec)} : s))} />
                  <input
                    placeholder="PCG"
                    title="Compte PCG (ex: 7411 pour subvention Région). Cliquez ⚡ pour détection automatique."
                    className={`text-[10px] w-14 rounded px-1 py-0.5 outline-none border no-print font-mono ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${item.comptePCG ? (darkMode ? 'border-blue-600 text-blue-300' : 'border-blue-400 text-blue-700') : ''}`}
                    value={item.comptePCG || ''}
                    onChange={e => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, comptePCG: e.target.value} : rec)} : s))}
                  />
                  <button
                    title="Détecter le compte PCG automatiquement selon le libellé"
                    onClick={() => { const detected = detecterComptePCG(item.nom); if (detected) setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, comptePCG: detected} : rec)} : s)); }}
                    className={`no-print text-[10px] px-1 py-0.5 rounded border transition-colors ${darkMode ? 'border-zinc-600 text-zinc-500 hover:text-yellow-400 hover:border-yellow-600' : 'border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-400'}`}
                  >⚡</button>
                  <input type="number" className={`w-20 text-right text-xs font-black rounded px-2 py-1 ${darkMode ? 'bg-gray-500 text-white' : 'bg-green-50'}`} value={item.montant} onChange={(e) => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, montant: validerMontant(e.target.value)} : rec)} : s))} />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>€/m</span>
                  <button
                    title={item.fondsDedie ? 'Fonds dédiés (reportable) — cliquer pour désactiver' : 'Marquer comme Fonds dédiés (subvention reportable)'}
                    onClick={() => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, fondsDedie: !rec.fondsDedie} : rec)} : s))}
                    className={`text-[10px] font-black px-1 py-0.5 rounded border no-print ${item.fondsDedie ? (darkMode ? 'bg-indigo-900/40 border-indigo-600 text-indigo-300' : 'bg-indigo-100 border-indigo-400 text-indigo-700') : (darkMode ? 'text-gray-600 border-gray-600 hover:text-gray-400' : 'text-slate-300 border-slate-200 hover:text-slate-500')}`}>
                    FD
                  </button>
                  <input type="number" placeholder="réel" title="Montant réalisé (€/mois)" className={`w-16 text-right text-xs rounded px-2 py-1 border ${item.realise != null ? (darkMode ? 'bg-blue-900/40 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-white border-slate-200 text-slate-400')}`} value={item.realise ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : validerMontant(e.target.value); setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, realise: v} : rec)} : s)); }} />
                  {item.realise != null && (() => { const ecart = (item.realise - item.montant); return <span className={`text-[10px] font-bold ${ecart >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{ecart >= 0 ? '+' : ''}{Math.round(ecart).toLocaleString()}€</span>; })()}
                  <input
                    placeholder="tag"
                    className={`text-[10px] w-16 rounded px-1 py-0.5 outline-none border no-print ${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder-slate-300'} ${item.tagProjet ? (darkMode ? 'border-violet-600 text-violet-300' : 'border-violet-300 text-violet-700') : ''}`}
                    value={item.tagProjet || ''}
                    onChange={e => setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, tagProjet: e.target.value} : rec)} : s))}
                  />
                  <input type="number" min="0" max="365" placeholder="∅j"
                    title="Délai d'encaissement (jours). Utilisé pour le calcul du BFR. Laisser vide = délai global Paramètres."
                    className={`no-print w-10 text-right text-[10px] rounded px-1 py-0.5 outline-none border ${item.delaiEncaissement != null ? (darkMode ? 'bg-amber-900/30 border-amber-600 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-700') : (darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-500' : 'bg-white border-slate-200 text-slate-400')}`}
                    value={item.delaiEncaissement ?? ''}
                    onChange={e => {
                      const v = e.target.value === '' ? null : Math.max(0, Math.min(365, parseInt(e.target.value) || 0));
                      setServices(services.map(s => s.id === service.id ? {...s, recettes: s.recettes.map(rec => rec.id === item.id ? {...rec, delaiEncaissement: v} : rec)} : s));
                    }}
                  />
                  <button
                    onClick={() => setSaisonnaliteDialog({ type: 'service', entityId: service.id, recetteId: item.id })}
                    title={item.repartitionMensuelle ? 'Saisonnalité configurée — modifier' : 'Configurer la saisonnalité mensuelle'}
                    className={`no-print p-1 rounded-lg transition-colors ${item.repartitionMensuelle ? (darkMode ? 'bg-cyan-800/60 text-cyan-300' : 'bg-cyan-100 text-cyan-700') : (darkMode ? 'text-gray-500 hover:text-cyan-400' : 'text-slate-300 hover:text-cyan-500')}`}
                  ><Calendar size={13} /></button>
                </div>
              ))}
            </div>
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-green-200'} flex justify-between font-bold`}>
              <span className={darkMode ? 'text-green-400' : 'text-green-700'}>Total/an:</span>
              <div className="text-right">
                <div className={darkMode ? 'text-white' : 'text-green-800'}>{Math.round(bs.recettes).toLocaleString()} €</div>
                {bs.recettesRealisees > 0 && <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Réalisé: {Math.round(bs.recettesRealisees).toLocaleString()} €</div>}
              </div>
            </div>
            {bs.subventionRegionAgents > 0 && bs.recettes > 0 && (() => {
              const dep = Math.round(bs.subventionRegionAgents / bs.recettes * 100);
              const isHigh = dep >= 70;
              const isMed  = dep >= 40 && dep < 70;
              const recPropres = Math.round((bs.recettes - bs.subventionRegionAgents) / bs.recettes * 100);
              return (
                <div className={`mt-2 p-2.5 rounded-xl border text-xs ${isHigh ? (darkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200') : isMed ? (darkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200') : (darkMode ? 'bg-violet-900/20 border-violet-700/50' : 'bg-violet-50 border-violet-200')}`}>
                  <div className={`font-black mb-1.5 flex items-center gap-1 ${isHigh ? (darkMode ? 'text-red-300' : 'text-red-700') : isMed ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-violet-300' : 'text-violet-700')}`}>
                    <Landmark size={11} />
                    Dépendance Région : {dep}%
                    {isHigh && <span className="ml-1 text-[9px] px-1 py-0.5 rounded-full bg-red-500/20">⚠ Risque élevé</span>}
                    {isMed  && <span className="ml-1 text-[9px] px-1 py-0.5 rounded-full bg-amber-500/20">⚡ Modéré</span>}
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div className={`h-full rounded-l-full ${isHigh ? 'bg-red-400' : isMed ? 'bg-amber-400' : 'bg-violet-400'}`} style={{ width: `${dep}%` }} title={`Subvention Région : ${dep}%`} />
                    <div className={`h-full rounded-r-full flex-1 ${darkMode ? 'bg-green-700' : 'bg-green-300'}`} title={`Recettes propres : ${recPropres}%`} />
                  </div>
                  <div className={`flex justify-between mt-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <span>Subv. Région : {dep}%</span>
                    <span>Recettes propres : {recPropres}%</span>
                  </div>
                </div>
              );
            })()}
            {bs.hasRealise && (() => {
              const ecartRec = bs.recettesRealisees - bs.recettes;
              const ecartExp = bs.exploitationRealisee - bs.exploitation;
              return (
                <div className={`mt-2 p-2 rounded-xl text-xs font-bold flex gap-3 ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                  <span>Écart recettes: <span className={ecartRec >= 0 ? 'text-emerald-500' : 'text-red-500'}>{ecartRec >= 0 ? '+' : ''}{Math.round(ecartRec).toLocaleString()} €</span></span>
                  {bs.exploitationRealisee > 0 && <span>Écart charges: <span className={ecartExp > 0 ? 'text-red-500' : 'text-emerald-500'}>{ecartExp > 0 ? '+' : ''}{Math.round(ecartExp).toLocaleString()} €</span></span>}
                </div>
              );
            })()}
            {/* Indicateur de solde */}
            <div className={`mt-3 p-3 rounded-xl ${bs.solde >= 0 ? (darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100') : (darkMode ? 'bg-orange-900/50' : 'bg-orange-100')}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1 ${bs.solde >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : (darkMode ? 'text-orange-400' : 'text-orange-700')}`}>
                  {bs.solde >= 0 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {bs.solde >= 0 ? 'Excédent' : 'Déficit'}
                </span>
                <span className={`font-black ${bs.solde >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-orange-300' : 'text-orange-700')}`}>
                  {bs.solde >= 0 ? '+' : ''}{Math.round(bs.solde).toLocaleString()} €
                </span>
              </div>
            </div>

            {/* Seuil de rentabilité */}
            {(() => {
              const srvStats = hasPromos ? calculerStatsFormation(service) : null;
              const effectif = srvStats ? srvStats.effectifActuel : (service.unites || 0);
              if (!effectif || effectif === 0 || bs.recettes === 0) return null;
              const recParEtudiant = bs.recettes / effectif;
              const seuil = recParEtudiant > 0 ? Math.ceil(bs.total / recParEtudiant) : null;
              if (!seuil) return null;
              const couvert = effectif >= seuil;
              const pct = Math.min(100, Math.round((effectif / seuil) * 100));
              return (
                <div className={`mt-2 p-3 rounded-xl border ${couvert ? (darkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200') : (darkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200')}`}>
                  <div className="flex items-center gap-1 mb-2">
                    <Target size={13} className={couvert ? 'text-teal-500' : 'text-amber-500'} />
                    <span className={`text-xs font-black ${couvert ? (darkMode ? 'text-teal-300' : 'text-teal-700') : (darkMode ? 'text-amber-300' : 'text-amber-700')}`}>Seuil de rentabilité</span>
                  </div>
                  <div className={`flex justify-between text-xs mb-1.5 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    <span>Effectif : <strong>{effectif}</strong></span>
                    <span>Seuil : <strong>{seuil}</strong></span>
                    <span className={couvert ? 'text-teal-500 font-bold' : 'text-amber-500 font-bold'}>{pct}% couvert</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} overflow-hidden`}>
                    <div className={`h-full rounded-full ${couvert ? 'bg-teal-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {!couvert && <div className={`text-xs mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Manque {seuil - effectif} étudiant{seuil - effectif > 1 ? 's' : ''} pour atteindre l'équilibre</div>}
                </div>
              );
            })()}
          </div>
        </div>

        {/* PANEL SIMULATION SESSIONS */}
        <div className={`mt-6 rounded-2xl border-2 overflow-hidden no-print ${darkMode ? 'border-indigo-800' : 'border-indigo-200'}`}>
          <button
            onClick={() => {
              const next = new Set(simulationsOuvertes);
              if (next.has(service.id)) next.delete(service.id); else next.add(service.id);
              setSimulationsOuvertes(next);
            }}
            className={`w-full flex items-center justify-between px-5 py-3 font-black text-sm ${darkMode ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
          >
            <span className="flex items-center gap-2">
              <Calculator size={16} />
              Simuler des sessions de formation
              {sessionsSimulees.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-indigo-700 text-indigo-200' : 'bg-indigo-200 text-indigo-800'}`}>
                  {sessionsSimulees.length} session{sessionsSimulees.length > 1 ? 's' : ''}
                </span>
              )}
            </span>
            {simOuverte ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {simOuverte && (
            <div className={`p-5 ${darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50/50'}`}>
              {tousSalariesPilotage.length === 0 && salariesBudget.length === 0 ? (
                <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Aucun formateur configuré. Ajoutez des agents dans les équipes des services ou des formateurs dans le Pilotage Financier.
                </p>
              ) : (
                <>
                  {/* Liste sessions simulées */}
                  <div className="space-y-3 mb-4">
                    {sessionsSimulees.map((sess, sessIdx) => {
                      const res = calcSession(sess);
                      const formateur = tousSalariesPilotage.find(s => s.id === sess.formateurId)
                                     || salariesBudget.find(s => s.id === sess.formateurId);
                      return (
                        <div key={sess.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-indigo-100'}`}>
                          <div className="flex items-start gap-3 flex-wrap">
                            {/* Grip pour réordonner */}
                            <div className="flex flex-col gap-0.5 pt-1">
                              <button
                                disabled={sessIdx === 0}
                                onClick={() => {
                                  const arr = [...sessionsSimulees]; arr.splice(sessIdx - 1, 0, arr.splice(sessIdx, 1)[0]);
                                  setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: arr} : s));
                                }}
                                className={`p-0.5 rounded ${sessIdx === 0 ? 'opacity-20' : 'hover:bg-indigo-100'}`}
                              ><ChevronUp size={12} /></button>
                              <button
                                disabled={sessIdx === sessionsSimulees.length - 1}
                                onClick={() => {
                                  const arr = [...sessionsSimulees]; arr.splice(sessIdx + 1, 0, arr.splice(sessIdx, 1)[0]);
                                  setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: arr} : s));
                                }}
                                className={`p-0.5 rounded ${sessIdx === sessionsSimulees.length - 1 ? 'opacity-20' : 'hover:bg-indigo-100'}`}
                              ><ChevronDown size={12} /></button>
                            </div>

                            {/* Nom session */}
                            <div className="flex-1 min-w-[120px]">
                              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Nom</label>
                              <input
                                className={`w-full font-bold text-sm rounded px-2 py-1 ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                value={sess.nom}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, nom: e.target.value} : ss)} : s))}
                              />
                            </div>

                            {/* Formateur */}
                            <div className="flex-1 min-w-[160px]">
                              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Formateur / Vacataire</label>
                              <select
                                className={`w-full text-sm rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                value={sess.formateurId || ''}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, formateurId: parseInt(e.target.value) || e.target.value} : ss)} : s))}
                              >
                                <option value="">— Choisir —</option>
                                {/* Salariés du budget */}
                                {salariesBudget.length > 0 && (() => {
                                  const groupes = {};
                                  salariesBudget.forEach(s => {
                                    if (!groupes[s._source]) groupes[s._source] = [];
                                    groupes[s._source].push(s);
                                  });
                                  return Object.entries(groupes).map(([src, membres]) => (
                                    <optgroup key={`budget-${src}`} label={src}>
                                      {membres.map(sal => {
                                        const c = calcSalarieFormateur(sal);
                                        return (
                                          <option key={sal.id} value={sal.id}>
                                            {sal.nom} ({Math.round(c.coutHoraireFacture)}€/h)
                                          </option>
                                        );
                                      })}
                                    </optgroup>
                                  ));
                                })()}
                                {/* Salariés Pilotage Financier */}
                                {pilotageSites.map(site => (
                                  <optgroup key={site.id} label={`Pilotage — ${site.nom}`}>
                                    {site.salaries.map(sal => {
                                      const c = calcSalarieFormateur(sal);
                                      return (
                                        <option key={sal.id} value={sal.id}>
                                          {sal.nom} ({sal.type === 'vacataire' ? `${sal.tauxHoraire}€/h` : `${Math.round(c.coutHoraireFacture)}€/h facturé`})
                                        </option>
                                      );
                                    })}
                                  </optgroup>
                                ))}
                              </select>
                            </div>

                            {/* Heures */}
                            <div className="w-16">
                              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Heures</label>
                              <input type="number" min="0"
                                className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                value={sess.nbHeures}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, nbHeures: Math.max(0, parseFloat(e.target.value) || 0)} : ss)} : s))}
                              />
                            </div>

                            {/* Participants */}
                            <div className="w-20">
                              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Participants</label>
                              <input type="number" min="0"
                                className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                value={sess.nbParticipants}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, nbParticipants: Math.max(0, parseInt(e.target.value) || 0)} : ss)} : s))}
                              />
                            </div>

                            {/* Prix/participant */}
                            <div className="w-24">
                              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Prix/part. €</label>
                              <input type="number" min="0"
                                className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                value={sess.prixParParticipant}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, prixParParticipant: Math.max(0, parseFloat(e.target.value) || 0)} : ss)} : s))}
                              />
                            </div>

                            {/* Frais déplacements */}
                            <div className="w-20">
                              <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Dépl. €</label>
                              <input type="number" min="0"
                                className={`w-full text-sm rounded px-2 py-1 font-bold text-center ${darkMode ? 'bg-gray-600 text-white' : 'bg-indigo-50'}`}
                                value={sess.fraisDeplacements}
                                onChange={e => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.map(ss => ss.id === sess.id ? {...ss, fraisDeplacements: Math.max(0, parseFloat(e.target.value) || 0)} : ss)} : s))}
                              />
                            </div>

                            {/* Supprimer */}
                            <button
                              onClick={() => setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: s.sessionsSimulees.filter(ss => ss.id !== sess.id)} : s))}
                              className="mt-4 p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                            ><Trash2 size={16} /></button>
                          </div>

                          {/* Résultats session */}
                          {formateur && (
                            <div className={`mt-3 grid grid-cols-3 gap-2 text-xs pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-indigo-100'}`}>
                              <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                                <div className={darkMode ? 'text-green-400' : 'text-green-600'}>CA</div>
                                <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(res.ca).toLocaleString()} €</div>
                              </div>
                              <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                                <div className={darkMode ? 'text-red-400' : 'text-red-600'}>Coût formateur</div>
                                <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(res.coutFormateur).toLocaleString()} €</div>
                              </div>
                              <div className={`p-2 rounded-lg ${res.marge >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-orange-900/30' : 'bg-orange-50')}`}>
                                <div className={res.marge >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-orange-400' : 'text-orange-600')}>Marge</div>
                                <div className={`font-black ${res.marge >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-orange-300' : 'text-orange-700')}`}>
                                  {res.marge >= 0 ? '+' : ''}{Math.round(res.marge).toLocaleString()} €
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bouton ajouter session */}
                  <button
                    onClick={() => {
                      const defFormateur = tousSalariesPilotage[0];
                      setServices(services.map(s => s.id === service.id ? {...s, sessionsSimulees: [...(s.sessionsSimulees || []), {
                        id: Date.now(),
                        nom: `Session ${(s.sessionsSimulees || []).length + 1}`,
                        formateurId: defFormateur?.id || null,
                        nbHeures: 7,
                        nbParticipants: 10,
                        prixParParticipant: 0,
                        fraisDeplacements: 0,
                        fraisSupports: 0
                      }]} : s));
                    }}
                    className={`w-full py-2 border-2 border-dashed rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-4 ${darkMode ? 'border-indigo-700 text-indigo-400 hover:bg-indigo-900/20' : 'border-indigo-300 text-indigo-500 hover:bg-indigo-50'}`}
                  >
                    <Plus size={16} /> Ajouter une session
                  </button>

                  {/* Totaux simulation */}
                  {sessionsSimulees.length > 0 && (() => {
                    const totCA    = sessionsSimulees.reduce((sum, s) => sum + calcSession(s).ca, 0);
                    const totCout  = sessionsSimulees.reduce((sum, s) => sum + calcSession(s).coutFormateur + (s.fraisDeplacements || 0), 0);
                    const totMarge = totCA - totCout;
                    return (
                      <div className={`grid grid-cols-4 gap-3 p-4 rounded-xl ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                        <div className="text-center">
                          <div className={`text-xs font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>CA total simulé</div>
                          <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(totCA).toLocaleString()} €</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-xs font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Coût total</div>
                          <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(totCout).toLocaleString()} €</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-xs font-bold ${totMarge >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-orange-400' : 'text-orange-600')}`}>Marge totale</div>
                          <div className={`text-lg font-black ${totMarge >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-orange-300' : 'text-orange-700')}`}>
                            {totMarge >= 0 ? '+' : ''}{Math.round(totMarge).toLocaleString()} €
                          </div>
                        </div>
                        {(() => {
                          const totalPart = sessionsSimulees.reduce((sum, s) => sum + (s.nbParticipants || 0), 0);
                          if (totalPart === 0) return null;
                          const coutParPart = Math.round(totCout / totalPart);
                          const caParPart = Math.round(totCA / totalPart);
                          return (
                            <div className="text-center">
                              <div className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Coût / participant</div>
                              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{coutParPart.toLocaleString()} €</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>CA: {caParPart.toLocaleString()} €/part.</div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    );
      }  // end if service block
    }  // end for loop
    return items;
  })()}
</div>

{/* ═══ POOL RH — Agents partagés entre plusieurs entités ═══ */}
<div className={`mt-8 rounded-3xl border p-6 ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200 shadow-sm'}`}>
  <PoolRHManager
    poolRH={poolRH}
    setPoolRH={setPoolRH}
    services={services}
    direction={direction}
    poleSupport={poleSupport}
    darkMode={darkMode}
    msETP={globalParams?.montantSegurETP}
  />
</div>
    </>
  );
}
