import React, { useState } from 'react';
import { Plus, Trash2, Calculator, TrendingUp, AlertTriangle, CheckCircle,
         Info, Users, Activity, Zap, Building, Globe, X, Edit2,
         RotateCcw, Lock, Eye, EyeOff, Copy, ChevronDown, ChevronRight,
         UserCheck, UserX, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, ReferenceLine } from 'recharts';

const SEMAINES = 52; // 52 semaines ouverture annuelle complète

// ─── Calcul salarié (interne ou vacataire) ───────────────────────
export const calcSalarie = (s) => {
  if (s.type === 'vacataire') {
    const th = parseFloat(s.tauxHoraire) || 0;
    return {
      salBrutAnnuel: 0, charges: 0, coutTotal: 0,
      heuresContractuelles: 0, heuresHorsProductionAnn: 0,
      heuresDisponibles: 0, heuresAnimees: null, heuresPrepa: 0,
      tauxOccupation: null,
      coutHoraireContractuel: th,
      coutHoraireFacture: th,
      ecartCoutHoraire: 0,
      isVacataire: true,
    };
  }
  // Interne
  const salBrutAnnuel          = (parseFloat(s.salaireBrut) || 0) * 12;
  const charges                = salBrutAnnuel * (parseFloat(s.tauxCharges) || 0) / 100;
  const coutTotal              = salBrutAnnuel + charges;
  const heuresHebdo            = parseFloat(s.heuresHebdo) || 0;
  const heuresContractuelles   = heuresHebdo * SEMAINES;
  const heuresHorsProductionAnn= (parseFloat(s.heuresHorsProduction) || 0) * SEMAINES;
  const joursAbs               = parseFloat(s.joursAbsence) || 0;
  const heuresAbsence          = heuresHebdo > 0 ? joursAbs * (heuresHebdo / 5) : 0;
  const heuresDisponibles      = Math.max(0, heuresContractuelles - heuresHorsProductionAnn - heuresAbsence);
  const ratio                  = Math.max(1, parseFloat(s.ratioPreparation) || 1.2);
  const heuresAnimees          = heuresDisponibles / ratio;
  const heuresPrepa            = heuresDisponibles - heuresAnimees;
  const tauxOccupation         = heuresContractuelles > 0 ? (heuresAnimees / heuresContractuelles) * 100 : 0;
  const coutHoraireContractuel = heuresContractuelles > 0 ? coutTotal / heuresContractuelles : 0;
  const coutHoraireFacture     = heuresAnimees > 0 ? coutTotal / heuresAnimees : 0;
  const ecartCoutHoraire       = coutHoraireFacture - coutHoraireContractuel;
  return {
    salBrutAnnuel, charges, coutTotal,
    heuresContractuelles, heuresHorsProductionAnn, heuresAbsence, heuresDisponibles,
    heuresAnimees, heuresPrepa, tauxOccupation,
    coutHoraireContractuel, coutHoraireFacture, ecartCoutHoraire,
    joursAbsence: joursAbs,
    isVacataire: false,
  };
};

// ─── Stats globales d'un site ────────────────────────────────────
const calcSiteStats = (site) => {
  const totalFF       = site.fraisFixes.reduce((s, f) => s + (parseFloat(f.montant) || 0), 0);
  const tauxStructure = site.heuresVendues > 0 ? totalFF / site.heuresVendues : 0;
  const calcs         = site.salaries.map(calcSalarie);
  const internes      = calcs.filter(c => !c.isVacataire && c.tauxOccupation !== null);
  const tauxOccMoyen  = internes.length > 0 ? internes.reduce((s, c) => s + c.tauxOccupation, 0) / internes.length : 0;

  const sessionStats  = (site.sessions || []).map(sess => {
    const f    = site.salaries.find(s => s.id === sess.formateurId) || site.salaries[0];
    const calcF= f ? calcSalarie(f) : null;
    const rec  = (sess.nbStagiaires || 0) * (sess.prixStagiaire || 0);
    const cF   = calcF ? calcF.coutHoraireFacture * (sess.nbHeures || 0) : 0;
    const cS   = tauxStructure * (sess.nbHeures || 0);
    const cD   = (sess.fraisDeplacements || 0) + (sess.fraisSupports || 0);
    const cout = cF + cS + cD;
    return { rec, cout, marge: rec - cout };
  });
  const totalRecettes = sessionStats.reduce((s, x) => s + x.rec, 0);
  const totalCouts    = sessionStats.reduce((s, x) => s + x.cout, 0);
  const totalMarge    = totalRecettes - totalCouts;

  return { totalFF, tauxStructure, tauxOccMoyen, nbFormateurs: site.salaries.length,
           totalRecettes, totalCouts, totalMarge, nbSessions: (site.sessions || []).length };
};

// ─── Données "zéro" (reset) ──────────────────────────────────────
export const zeroSites = [
  { id: 1, nom: 'Site 1', fraisFixes: [], heuresVendues: 0, salaries: [], sessions: [] },
];

// ─── Données par défaut ──────────────────────────────────────────
const makeDefaultSite = (id, nom, overrides = {}) => ({
  id,
  nom,
  fraisFixes: [
    { id: id*100+1, libelle: 'Personnel support (administration, RH)', montant: overrides.ff1 ?? 60000 },
    { id: id*100+2, libelle: 'Loyer et charges locatives',             montant: overrides.ff2 ?? 24000 },
    { id: id*100+3, libelle: 'Logiciels et licences (LMS, outils)',    montant: overrides.ff3 ?? 8000  },
    { id: id*100+4, libelle: 'Assurances professionnelles',            montant: overrides.ff4 ?? 5000  },
    { id: id*100+5, libelle: 'Comptabilité / Commissariat',            montant: overrides.ff5 ?? 6000  },
    { id: id*100+6, libelle: 'Communication et marketing',             montant: overrides.ff6 ?? 4000  },
    { id: id*100+7, libelle: 'Divers frais généraux',                  montant: overrides.ff7 ?? 3000  },
  ],
  heuresVendues: overrides.heuresVendues ?? 2000,
  salaries: [
    { id: id*10+1, nom: 'Formateur A', type: 'interne',    salaireBrut: overrides.sal1 ?? 2800, tauxCharges: 45, heuresHebdo: 35, heuresHorsProduction: 7, ratioPreparation: 1.2 },
    { id: id*10+2, nom: 'Formateur B', type: 'interne',    salaireBrut: overrides.sal2 ?? 3200, tauxCharges: 45, heuresHebdo: 35, heuresHorsProduction: 7, ratioPreparation: 1.3 },
    { id: id*10+3, nom: 'Vacataire 1', type: 'vacataire',  tauxHoraire: 45 },
  ],
  sessions: [
    { id: id*100+1, nom: 'Session 1', nbStagiaires: 10, prixStagiaire: 500, formateurId: id*10+1, nbHeures: 7, fraisDeplacements: 150, fraisSupports: 80 },
  ],
});

export const defaultSites = [
  makeDefaultSite(1, 'Site Principal', { heuresVendues: 2000 }),
  makeDefaultSite(2, 'Site Antenne',   { heuresVendues: 1200, ff1: 40000, ff2: 14000, sal1: 2600, sal2: 2900 }),
];

// ─── Jauge taux d'occupation ─────────────────────────────────────
const JaugeOccupation = ({ taux, dm }) => {
  if (taux === null) return <span className={`text-xs ${dm ? 'text-gray-500' : 'text-slate-400'}`}>— vacataire</span>;
  const cl    = Math.min(100, Math.max(0, taux));
  const color = cl < 60 ? '#ef4444' : cl <= 80 ? '#22c55e' : '#f97316';
  const zone  = cl < 60 ? { label: 'Sous-utilisé',    t: 'text-red-500'    }
              : cl <= 80 ? { label: 'Zone optimale',   t: 'text-green-500'  }
              :             { label: 'Risque surcharge', t: 'text-orange-500' };
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className={`text-xs font-bold ${zone.t}`}>{zone.label}</span>
        <span className={`text-base font-black ${zone.t}`}>{cl.toFixed(1)}%</span>
      </div>
      <div className={`w-full h-3 rounded-full ${dm ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden relative`}>
        <div className="absolute inset-0 flex">
          <div className="h-full bg-red-300/20"    style={{ width: '60%' }} />
          <div className="h-full bg-green-300/20"  style={{ width: '20%' }} />
          <div className="h-full bg-orange-300/20" style={{ width: '20%' }} />
        </div>
        <div className="absolute h-full rounded-full" style={{ width: `${cl}%`, background: color }} />
        <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: '60%' }} />
        <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: '80%' }} />
      </div>
      <div className={`flex justify-between text-xs mt-0.5 ${dm ? 'text-gray-600' : 'text-slate-400'}`}>
        <span>0%</span><span>60%</span><span>80%</span><span>100%</span>
      </div>
    </div>
  );
};

// ─── Calcul résultat d'une session ───────────────────────────────
const calcSession = (sess, salaries, tauxStructure) => {
  const f     = salaries.find(s => s.id === sess.formateurId) || salaries[0];
  const calcF = f ? calcSalarie(f) : null;
  const rec   = (sess.nbStagiaires || 0) * (sess.prixStagiaire || 0);
  const cF    = calcF ? calcF.coutHoraireFacture * (sess.nbHeures || 0) : 0;
  const cS    = tauxStructure * (sess.nbHeures || 0);
  const cD    = (sess.fraisDeplacements || 0) + (sess.fraisSupports || 0);
  const cout  = cF + cS + cD;
  const marge = rec - cout;
  const tauxM = rec > 0 ? (marge / rec) * 100 : 0;
  const pm    = (sess.prixStagiaire || 0) > 0 ? Math.ceil(cout / sess.prixStagiaire) : Infinity;
  return { rec, cF, cS, cD, cout, marge, tauxM, pm, calcF };
};

// ═══════════════════════════════════════════════════════════════
// MODAL IMPORT PERSONNEL BUDGET
// ═══════════════════════════════════════════════════════════════
const PRIME_SEGUR = 238;
const CHARGES_PATRONALES = 42; // %

const ImportBudgetModal = ({ budgetPersonnel, salaries, onImport, onClose, dm }) => {
  const [selected, setSelected] = useState(
    budgetPersonnel.map(p => ({ ...p, checked: true }))
  );

  const toggle = (id) => setSelected(sel => sel.map(p => p.id === id ? { ...p, checked: !p.checked } : p));

  const doImport = () => {
    const existingNames = salaries.map(s => s.nom.trim().toLowerCase());
    const toAdd = selected
      .filter(p => p.checked)
      .map(p => ({
        id: Date.now() + Math.random(),
        type: 'interne',
        nom: p.titre,
        salaireBrut: Math.round((p.salaire + (p.segur ? PRIME_SEGUR : 0)) * (p.etp || 1)),
        tauxCharges: CHARGES_PATRONALES,
        heuresHebdo: Math.round(35 * (p.etp || 1) * 10) / 10,
        heuresHorsProduction: 7,
        ratioPreparation: 1.2,
      }))
      .filter(p => !existingNames.includes(p.nom.trim().toLowerCase()));
    onImport(toAdd);
    onClose();
  };

  const overlay = `fixed inset-0 z-50 flex items-center justify-center p-4 ${dm ? 'bg-black/70' : 'bg-black/40'}`;
  const card = `w-full max-w-lg rounded-2xl shadow-2xl p-6 ${dm ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`;
  const textPri = dm ? 'text-white' : 'text-slate-800';
  const textMut = dm ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className={overlay} onClick={onClose}>
      <div className={card} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-black flex items-center gap-2 ${textPri}`}>
            <Download size={18} className="text-teal-500" />
            Importer depuis le Budget
          </h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={18} /></button>
        </div>

        {budgetPersonnel.length === 0 ? (
          <p className={`text-sm py-4 text-center ${textMut}`}>Aucun personnel trouvé dans la partie Budget.</p>
        ) : (
          <>
            <p className={`text-xs mb-3 ${textMut}`}>Les personnes déjà présentes (même nom) ne seront pas dupliquées.</p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selected.map(p => {
                const alreadyExists = salaries.some(s => s.nom.trim().toLowerCase() === p.titre.trim().toLowerCase());
                return (
                  <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    alreadyExists
                      ? dm ? 'bg-gray-700/30 opacity-50' : 'bg-slate-50 opacity-50'
                      : p.checked
                        ? dm ? 'bg-teal-900/30 border border-teal-700' : 'bg-teal-50 border border-teal-200'
                        : dm ? 'bg-gray-700/40 border border-gray-600' : 'bg-white border border-slate-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={p.checked && !alreadyExists}
                      disabled={alreadyExists}
                      onChange={() => !alreadyExists && toggle(p.id)}
                      className="w-4 h-4 accent-teal-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${textPri}`}>{p.titre}</div>
                      <div className={`text-xs ${textMut}`}>
                        {p.source} · {p.etp} ETP · {p.salaire.toLocaleString()} €/mois
                        {p.segur && <span className="ml-1 text-blue-500 font-bold">+Ségur</span>}
                        {alreadyExists && <span className="ml-2 text-amber-500 font-bold">déjà présent</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm font-bold ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Annuler</button>
              <button onClick={doImport}
                disabled={!selected.some(p => p.checked && !salaries.some(s => s.nom.trim().toLowerCase() === p.titre.trim().toLowerCase()))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed">
                <Download size={14} /> Importer la sélection
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// VUE D'UN SITE
// ═══════════════════════════════════════════════════════════════
const SiteView = ({ site, onUpdateSite, tauxFraisStructure, dm, budgetPersonnel }) => {
  const { fraisFixes, heuresVendues, salaries, sessions } = site;
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id ?? null);
  const [showImport, setShowImport] = useState(false);
  const totalFF = fraisFixes.reduce((s, f) => s + (parseFloat(f.montant) || 0), 0);

  // Salariés budget convertis au format calcSalarie (sélectionnables directement)
  const budgetFormateurs = (budgetPersonnel || []).map(p => ({
    id: 'b' + p.id,
    nom: p.titre || 'Sans nom',
    type: 'interne',
    salaireBrut: Math.round((p.salaire + (p.segur ? PRIME_SEGUR : 0)) * (p.etp || 1)),
    tauxCharges: Math.round(CHARGES_PATRONALES * 100),
    heuresHebdo: Math.round(35 * (p.etp || 1) * 10) / 10,
    heuresHorsProduction: 7,
    ratioPreparation: 1.2,
    joursAbsence: 0,
    _source: p.source || 'Budget',
  }));
  const allFormateurs = [...salaries, ...budgetFormateurs];

  const card       = `rounded-2xl border shadow-md ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`;
  const textPri    = dm ? 'text-white' : 'text-slate-800';
  const textMuted  = dm ? 'text-gray-400' : 'text-slate-500';
  const inputCls   = `w-full px-3 py-2 rounded-xl border outline-none text-sm font-medium ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`;
  const inputSmCls = `px-2 py-1.5 rounded-lg border outline-none text-sm font-bold ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200'}`;
  const borderT    = dm ? 'border-gray-700' : 'border-slate-100';
  const tooltip    = dm ? '#1f2937' : '#fff';

  const setFF  = v => onUpdateSite('fraisFixes', v);
  const setHV  = v => onUpdateSite('heuresVendues', v);
  const setSal = v => onUpdateSite('salaries', v);
  const setSessions = v => onUpdateSite('sessions', v);

  const upSal = (i, field, value) => setSal(salaries.map((x, j) => j === i ? { ...x, [field]: value } : x));
  const upSess= (id, field, value) => setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));

  const addSession = () => {
    const newId = Date.now();
    const newSess = {
      id: newId, nom: `Session ${sessions.length + 1}`,
      nbStagiaires: 10, prixStagiaire: 500,
      formateurId: salaries[0]?.id ?? null,
      nbHeures: 7, fraisDeplacements: 0, fraisSupports: 0,
    };
    setSessions([...sessions, newSess]);
    setActiveSessionId(newId);
  };

  const duplicateSession = (sess) => {
    const newId  = Date.now();
    const newSess = { ...sess, id: newId, nom: `${sess.nom} (copie)` };
    setSessions([...sessions, newSess]);
    setActiveSessionId(newId);
  };

  const deleteSession = (id) => {
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    setActiveSessionId(remaining[0]?.id ?? null);
  };

  const activeSess = sessions.find(s => s.id === activeSessionId);
  const activeRes  = activeSess ? calcSession(activeSess, allFormateurs, tauxFraisStructure) : null;

  return (
    <div className="space-y-6">

      {showImport && (
        <ImportBudgetModal
          budgetPersonnel={budgetPersonnel || []}
          salaries={salaries}
          onImport={newSals => setSal([...salaries, ...newSals])}
          onClose={() => setShowImport(false)}
          dm={dm}
        />
      )}

      {/* ── MODULE 01 : FRAIS FIXES ── */}
      <div className={`${card} p-6`}>
        <h3 className={`text-xl font-black mb-5 flex items-center gap-2 ${textPri}`}>
          <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded-lg text-sm font-black">01</span>
          Frais Fixes
        </h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase font-bold ${textMuted}`}>
                <th className="text-left pb-2">Poste de charge</th>
                <th className="text-right pb-2 pr-10">Montant annuel (€)</th>
              </tr>
            </thead>
            <tbody>
              {fraisFixes.map((f, i) => (
                <tr key={f.id} className={`border-t ${borderT}`}>
                  <td className="py-2 pr-4">
                    <input type="text" value={f.libelle}
                      onChange={e => setFF(fraisFixes.map((x, j) => j === i ? { ...x, libelle: e.target.value } : x))}
                      className={`w-full px-3 py-1.5 rounded-lg border outline-none text-sm ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input type="number" value={f.montant}
                      onChange={e => setFF(fraisFixes.map((x, j) => j === i ? { ...x, montant: parseFloat(e.target.value) || 0 } : x))}
                      className={`w-32 ${inputSmCls} text-right`}
                    />
                  </td>
                  <td className="py-2 pl-2 w-12">
                    <button onClick={() => setFF(fraisFixes.filter((_, j) => j !== i))}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setFF([...fraisFixes, { id: Date.now(), libelle: 'Nouveau poste', montant: 0 }])}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 border-dashed transition-colors ${dm ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-500'}`}>
          <Plus size={15} /> Ajouter un poste
        </button>
        <div className={`mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t ${dm ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className={`p-4 rounded-2xl ${dm ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <div className={`text-xs font-bold uppercase mb-1 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>Total Frais Fixes</div>
            <div className={`text-2xl font-black ${textPri}`}>{Math.round(totalFF).toLocaleString()} €</div>
          </div>
          <div className={`p-4 rounded-2xl ${dm ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
            <div className={`text-xs font-bold uppercase mb-1 ${dm ? 'text-indigo-400' : 'text-indigo-600'}`}>Heures vendues / an</div>
            <input type="number" value={heuresVendues}
              onChange={e => setHV(parseInt(e.target.value) || 0)}
              className={`text-2xl font-black bg-transparent outline-none w-full ${textPri}`} />
          </div>
          <div className={`p-4 rounded-2xl ${dm ? 'bg-violet-900/30' : 'bg-violet-50'}`}>
            <div className={`text-xs font-bold uppercase mb-1 ${dm ? 'text-violet-400' : 'text-violet-600'}`}>Taux Structure / heure</div>
            <div className={`text-2xl font-black ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{tauxFraisStructure.toFixed(2)} €/h</div>
          </div>
        </div>
      </div>

      {/* ── MODULE 02 : SALARIÉS + VACATAIRES ── */}
      <div className={`${card} p-6`}>
        <h3 className={`text-xl font-black mb-2 flex items-center gap-2 ${textPri}`}>
          <span className="px-2.5 py-0.5 bg-teal-500 text-white rounded-lg text-sm font-black">02</span>
          Formateurs & Vacataires
          <span className={`text-xs font-normal ${textMuted}`}>— {SEMAINES} semaines / an</span>
        </h3>
        <p className={`text-xs mb-4 ${textMuted}`}>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg mr-2 ${dm ? 'bg-teal-900/40 text-teal-400' : 'bg-teal-50 text-teal-700'}`}><UserCheck size={11} /> Interne</span>
          Calcul complet coût horaire facturé.
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg mx-2 ${dm ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-50 text-orange-700'}`}><UserX size={11} /> Vacataire</span>
          Taux horaire direct (tout inclus).
        </p>

        <div className="space-y-2">
          {salaries.map((s, i) => {
            const c = calcSalarie(s);
            const isVac = s.type === 'vacataire';
            return (
              <div key={s.id} className={`p-4 rounded-xl border ${dm ? 'bg-gray-700/40 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Type toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-slate-300 flex-shrink-0">
                    {['interne', 'vacataire'].map(t => (
                      <button key={t}
                        onClick={() => upSal(i, 'type', t)}
                        className={`px-2 py-1 text-xs font-bold transition-colors ${s.type === t
                          ? t === 'interne' ? 'bg-teal-500 text-white' : 'bg-orange-500 text-white'
                          : dm ? 'bg-gray-700 text-gray-400' : 'bg-white text-slate-400'}`}>
                        {t === 'interne' ? 'Interne' : 'Vacataire'}
                      </button>
                    ))}
                  </div>
                  {/* Nom */}
                  <input type="text" value={s.nom}
                    onChange={e => upSal(i, 'nom', e.target.value)}
                    className={`${inputSmCls} w-36`}
                    placeholder="Nom"
                  />

                  {isVac ? (
                    /* ─ VACATAIRE ─ */
                    <div className="flex items-center gap-2">
                      <label className={`text-xs font-bold ${textMuted}`}>Taux horaire (€/h TTC) :</label>
                      <input type="number" value={s.tauxHoraire ?? 0}
                        onChange={e => upSal(i, 'tauxHoraire', parseFloat(e.target.value) || 0)}
                        className={`w-20 ${inputSmCls} text-right`}
                      />
                    </div>
                  ) : (
                    /* ─ INTERNE ─ */
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className={textMuted}>Sal. brut/mois</span>
                        <input type="number" value={s.salaireBrut}
                          onChange={e => upSal(i, 'salaireBrut', parseFloat(e.target.value) || 0)}
                          className={`w-20 ${inputSmCls} text-right`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={textMuted}>Ch.%</span>
                        <input type="number" value={s.tauxCharges}
                          onChange={e => upSal(i, 'tauxCharges', parseFloat(e.target.value) || 0)}
                          className={`w-14 ${inputSmCls} text-right`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={textMuted}>H/sem</span>
                        <input type="number" value={s.heuresHebdo}
                          onChange={e => upSal(i, 'heuresHebdo', parseFloat(e.target.value) || 0)}
                          className={`w-14 ${inputSmCls} text-right`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`${dm ? 'text-amber-400' : 'text-amber-600'} font-bold`}>H.hors-prod/sem</span>
                        <input type="number" value={s.heuresHorsProduction} step="0.5"
                          onChange={e => upSal(i, 'heuresHorsProduction', parseFloat(e.target.value) || 0)}
                          className={`w-14 ${inputSmCls} text-right`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`${dm ? 'text-amber-400' : 'text-amber-600'} font-bold`}>Ratio prépa</span>
                        <input type="number" value={s.ratioPreparation} step="0.1" min="1" max="3"
                          onChange={e => upSal(i, 'ratioPreparation', parseFloat(e.target.value) || 1)}
                          className={`w-14 ${inputSmCls} text-right`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`${dm ? 'text-red-400' : 'text-red-600'} font-bold`} title="Jours d'absence maladie / arrêt de travail sur l'année">Abs. (j/an)</span>
                        <input type="number" value={s.joursAbsence ?? 0} step="1" min="0" max="260"
                          onChange={e => upSal(i, 'joursAbsence', Math.max(0, parseFloat(e.target.value) || 0))}
                          className={`w-14 ${inputSmCls} text-right ${(s.joursAbsence ?? 0) > 0 ? (dm ? 'border-red-600 text-red-300' : 'border-red-300 text-red-700') : ''}`} />
                      </div>
                    </div>
                  )}

                  {/* Coûts horaires */}
                  <div className="ml-auto flex items-center gap-3">
                    {!isVac && (
                      <div className="text-right">
                        <div className={`text-xs line-through ${dm ? 'text-gray-500' : 'text-slate-400'}`}>{c.coutHoraireContractuel.toFixed(2)} €/h</div>
                        <div className={`text-xs ${dm ? 'text-orange-400' : 'text-orange-600'}`}>+{c.ecartCoutHoraire.toFixed(2)} €</div>
                      </div>
                    )}
                    <div className={`px-3 py-1.5 rounded-xl font-black text-sm ${
                      isVac
                        ? dm ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-50 text-orange-700'
                        : dm ? 'bg-teal-900/40 text-teal-300'    : 'bg-teal-50 text-teal-700'
                    }`}>
                      {c.coutHoraireFacture.toFixed(2)} €/h
                      {isVac && <span className="text-xs font-normal ml-1">vacataire</span>}
                    </div>
                    {salaries.length > 1 && (
                      <button onClick={() => setSal(salaries.filter((_, j) => j !== i))}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Jauge occupation (internes seulement) */}
                {!isVac && (
                  <div className="mt-3">
                    <JaugeOccupation taux={c.tauxOccupation} dm={dm} />
                    <div className={`text-xs mt-1 flex flex-wrap gap-x-3 ${textMuted}`}>
                      <span>{Math.round(c.heuresAnimees ?? 0)}h anim.</span>
                      <span>{Math.round(c.heuresPrepa)}h prépa</span>
                      <span>{Math.round(c.heuresHorsProductionAnn)}h hors-prod.</span>
                      {c.heuresAbsence > 0 && (
                        <span className={`font-bold ${dm ? 'text-red-400' : 'text-red-600'}`}>
                          -{Math.round(c.heuresAbsence)}h absence ({c.joursAbsence}j)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ajouter interne / vacataire / import budget */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSal([...salaries, { id: Date.now(), nom: `Formateur ${salaries.length + 1}`, type: 'interne', salaireBrut: 2800, tauxCharges: 45, heuresHebdo: 35, heuresHorsProduction: 7, ratioPreparation: 1.2 }])}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 border-dashed transition-colors ${dm ? 'border-gray-600 text-gray-400 hover:border-teal-500 hover:text-teal-400' : 'border-slate-300 text-slate-500 hover:border-teal-400 hover:text-teal-500'}`}>
            <Plus size={15} /><UserCheck size={14} /> Formateur interne
          </button>
          <button
            onClick={() => setSal([...salaries, { id: Date.now(), nom: `Vacataire ${salaries.filter(s => s.type === 'vacataire').length + 1}`, type: 'vacataire', tauxHoraire: 45 }])}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 border-dashed transition-colors ${dm ? 'border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-400' : 'border-slate-300 text-slate-500 hover:border-orange-400 hover:text-orange-500'}`}>
            <Plus size={15} /><UserX size={14} /> Vacataire
          </button>
          {(budgetPersonnel?.length > 0) && (
            <button
              onClick={() => setShowImport(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${dm ? 'border-teal-700 text-teal-400 hover:bg-teal-900/30' : 'border-teal-300 text-teal-600 hover:bg-teal-50'}`}>
              <Download size={15} /> Importer depuis le Budget
            </button>
          )}
        </div>

        {/* Repères */}
        <div className={`mt-4 p-3 rounded-xl text-xs ${dm ? 'bg-amber-900/20 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
          <Zap size={13} className="inline text-amber-500 mr-1" />
          <strong className={dm ? 'text-amber-300' : 'text-amber-800'}>Taux d'occupation cible :</strong>
          <span className={dm ? 'text-amber-400' : 'text-amber-700'}> &lt;60% sous-utilisé · 60–80% optimal · &gt;80% risque surcharge</span>
        </div>
      </div>

      {/* ── MODULE 03 : SESSIONS ── */}
      <div className={`${card} p-6`}>
        <h3 className={`text-xl font-black mb-2 flex items-center gap-2 ${textPri}`}>
          <span className="px-2.5 py-0.5 bg-orange-500 text-white rounded-lg text-sm font-black">03</span>
          Sessions de Formation
          <span className={`ml-auto text-sm font-normal ${textMuted}`}>{sessions.length} session{sessions.length > 1 ? 's' : ''}</span>
        </h3>
        <p className={`text-xs mb-5 ${textMuted}`}>Nommez, ajoutez et comparez toutes vos sessions. Coût formateur = coût de l'heure facturée.</p>

        {/* Onglets sessions */}
        <div className="flex flex-wrap gap-2 mb-5">
          {sessions.map(sess => {
            const res = calcSession(sess, allFormateurs, tauxFraisStructure);
            const isActive = sess.id === activeSessionId;
            return (
              <div key={sess.id} className="relative group">
                <button
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md'
                      : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{sess.nom}</span>
                  <span className={`text-xs font-black ${
                    isActive
                      ? 'text-white/80'
                      : res.marge >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {res.marge >= 0 ? '+' : ''}{Math.round(res.marge / 100) * 100 === 0 ? Math.round(res.marge) : Math.round(res.marge / 10) * 10 > 999 ? `${Math.round(res.marge / 100) / 10}k` : Math.round(res.marge)}€
                  </span>
                </button>
              </div>
            );
          })}
          <button onClick={addSession}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border-2 border-dashed transition-colors ${dm ? 'border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-400' : 'border-slate-300 text-slate-500 hover:border-orange-400 hover:text-orange-500'}`}>
            <Plus size={15} /> Ajouter
          </button>
        </div>

        {/* Éditeur de la session active */}
        {activeSess && activeRes ? (
          <div className={`rounded-2xl border p-5 ${dm ? 'bg-gray-700/40 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
            {/* Nom de la session + actions */}
            <div className="flex items-center gap-3 mb-5">
              <input type="text" value={activeSess.nom}
                onChange={e => upSess(activeSess.id, 'nom', e.target.value)}
                className={`text-lg font-black bg-transparent border-b-2 outline-none px-1 pb-0.5 ${dm ? 'border-gray-500 text-white focus:border-orange-400' : 'border-slate-300 text-slate-800 focus:border-orange-400'}`}
                placeholder="Nom de la session"
              />
              <div className="ml-auto flex gap-2">
                <button onClick={() => duplicateSession(activeSess)}
                  title="Dupliquer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${dm ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-white text-slate-600 hover:bg-slate-100'} border ${dm ? 'border-gray-500' : 'border-slate-200'}`}>
                  <Copy size={15} /> Dupliquer
                </button>
                {sessions.length > 1 && (
                  <button onClick={() => deleteSession(activeSess.id)}
                    title="Supprimer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 border-red-300 text-red-500 hover:bg-red-50">
                    <Trash2 size={15} /> Supprimer
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ─ Paramètres ─ */}
              <div>
                <h4 className={`text-xs font-bold uppercase mb-3 ${textMuted}`}>Paramètres</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Nb stagiaires</label>
                    <input type="number" value={activeSess.nbStagiaires} min="1"
                      onChange={e => upSess(activeSess.id, 'nbStagiaires', parseInt(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Prix / stagiaire (€)</label>
                    <input type="number" value={activeSess.prixStagiaire} min="0"
                      onChange={e => upSess(activeSess.id, 'prixStagiaire', parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Durée (heures)</label>
                    <input type="number" value={activeSess.nbHeures} min="0.5" step="0.5"
                      onChange={e => upSess(activeSess.id, 'nbHeures', parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Formateur / Vacataire</label>
                    {allFormateurs.length === 0 ? (
                      <div className={`px-3 py-2 rounded-xl border text-sm ${dm ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        Aucun formateur — ajoutez un salarié ou un vacataire ci-dessous
                      </div>
                    ) : (
                      <select
                        value={activeSess.formateurId ?? allFormateurs[0]?.id}
                        onChange={e => {
                          const v = e.target.value;
                          upSess(activeSess.id, 'formateurId', String(v).startsWith('b') ? v : parseInt(v));
                        }}
                        className={inputCls}>
                        {salaries.length > 0 && (
                          <optgroup label="Formateurs / Vacataires">
                            {salaries.map(s => {
                              const c = calcSalarie(s);
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.nom} ({s.type === 'vacataire' ? 'vac.' : 'int.'}) — {c.coutHoraireFacture.toFixed(0)} €/h
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                        {budgetFormateurs.length > 0 && (
                          <optgroup label="Salariés budget">
                            {budgetFormateurs.map(s => {
                              const c = calcSalarie(s);
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.nom} — {c.coutHoraireFacture.toFixed(0)} €/h
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Frais déplacements (€)</label>
                    <input type="number" value={activeSess.fraisDeplacements} min="0"
                      onChange={e => upSess(activeSess.id, 'fraisDeplacements', parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Frais supports (€)</label>
                    <input type="number" value={activeSess.fraisSupports} min="0"
                      onChange={e => upSess(activeSess.id, 'fraisSupports', parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* ─ Résultats ─ */}
              <div>
                <h4 className={`text-xs font-bold uppercase mb-3 ${textMuted}`}>Résultats</h4>
                <div className="space-y-2">
                  <div className={`p-3 rounded-xl flex justify-between ${dm ? 'bg-gray-700' : 'bg-white'}`}>
                    <span className={`text-sm ${textMuted}`}>Recettes</span>
                    <span className={`font-black text-lg ${textPri}`}>{Math.round(activeRes.rec).toLocaleString()} €</span>
                  </div>
                  <div className={`p-3 rounded-xl ${dm ? 'bg-gray-700' : 'bg-white'} space-y-1`}>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Coût formateur ({activeSess.nbHeures}h)</span>
                      <span className={`font-bold ${textPri}`}>{Math.round(activeRes.cF).toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Frais structure</span>
                      <span className={`font-bold ${textPri}`}>{Math.round(activeRes.cS).toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Frais directs</span>
                      <span className={`font-bold ${textPri}`}>{Math.round(activeRes.cD).toLocaleString()} €</span>
                    </div>
                    <div className={`flex justify-between pt-1 border-t ${dm ? 'border-gray-600' : 'border-slate-200'}`}>
                      <span className={`text-sm font-bold ${textPri}`}>Total coûts</span>
                      <span className={`font-black ${textPri}`}>{Math.round(activeRes.cout).toLocaleString()} €</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${
                    activeRes.marge >= 0
                      ? dm ? 'bg-green-900/40 border-green-700' : 'bg-green-50 border-green-200'
                      : dm ? 'bg-red-900/40 border-red-700'    : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-black flex items-center gap-1 ${activeRes.marge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {activeRes.marge >= 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        Marge nette
                      </span>
                      <span className={`font-black text-xl ${activeRes.marge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {activeRes.marge >= 0 ? '+' : ''}{Math.round(activeRes.marge).toLocaleString()} €
                      </span>
                    </div>
                    <div className={`text-xs grid grid-cols-2 gap-2 ${textMuted}`}>
                      <div>Taux de marge : <strong className={activeRes.marge >= 0 ? 'text-green-500' : 'text-red-500'}>{activeRes.tauxM.toFixed(1)}%</strong></div>
                      <div>Point mort : <strong className={textPri}>{isFinite(activeRes.pm) ? `${activeRes.pm} stag.` : '—'}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-8 rounded-2xl border-2 border-dashed text-center ${dm ? 'border-gray-600 text-gray-500' : 'border-slate-300 text-slate-400'}`}>
            <p className="font-bold mb-2">Aucune session</p>
            <button onClick={addSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600">
              <Plus size={15} /> Créer la première session
            </button>
          </div>
        )}

        {/* Récapitulatif toutes sessions */}
        {sessions.length > 1 && (
          <div className="mt-5">
            <h4 className={`font-bold text-sm mb-3 ${dm ? 'text-gray-300' : 'text-slate-700'}`}>
              Récapitulatif — {sessions.length} sessions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${textMuted} uppercase font-bold border-b ${dm ? 'border-gray-700' : 'border-slate-200'}`}>
                    <th className="text-left pb-2">Session</th>
                    <th className="text-right pb-2 px-2">Formateur</th>
                    <th className="text-right pb-2 px-2">Nb stag.</th>
                    <th className="text-right pb-2 px-2">Heures</th>
                    <th className="text-right pb-2 px-2">Recettes</th>
                    <th className="text-right pb-2 px-2">Coûts</th>
                    <th className="text-right pb-2 px-2">Marge</th>
                    <th className="text-right pb-2 px-2">Tx marge</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(sess => {
                    const r = calcSession(sess, salaries, tauxFraisStructure);
                    const f = salaries.find(s => s.id === sess.formateurId);
                    return (
                      <tr key={sess.id} className={`border-t ${dm ? 'border-gray-700' : 'border-slate-100'} cursor-pointer hover:opacity-80`}
                        onClick={() => setActiveSessionId(sess.id)}>
                        <td className={`py-2 pr-2 font-bold ${sess.id === activeSessionId ? 'text-orange-500' : textPri}`}>{sess.nom}</td>
                        <td className={`py-2 px-2 text-right ${textMuted}`}>{f?.nom ?? '—'}</td>
                        <td className={`py-2 px-2 text-right ${textPri}`}>{sess.nbStagiaires}</td>
                        <td className={`py-2 px-2 text-right ${textPri}`}>{sess.nbHeures}h</td>
                        <td className={`py-2 px-2 text-right font-bold ${textPri}`}>{Math.round(r.rec).toLocaleString()} €</td>
                        <td className={`py-2 px-2 text-right font-bold ${textPri}`}>{Math.round(r.cout).toLocaleString()} €</td>
                        <td className={`py-2 px-2 text-right font-black ${r.marge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {r.marge >= 0 ? '+' : ''}{Math.round(r.marge).toLocaleString()} €
                        </td>
                        <td className={`py-2 px-2 text-right font-black ${r.marge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {r.tauxM.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total */}
                  {(() => {
                    const totRec  = sessions.reduce((s, sess) => s + calcSession(sess, salaries, tauxFraisStructure).rec,  0);
                    const totCout = sessions.reduce((s, sess) => s + calcSession(sess, salaries, tauxFraisStructure).cout, 0);
                    const totMarge = totRec - totCout;
                    return (
                      <tr className={`border-t-2 font-black ${dm ? 'border-gray-600' : 'border-slate-300'}`}>
                        <td className={`py-2 pr-2 ${textPri}`} colSpan={4}>TOTAL</td>
                        <td className={`py-2 px-2 text-right ${textPri}`}>{Math.round(totRec).toLocaleString()} €</td>
                        <td className={`py-2 px-2 text-right ${textPri}`}>{Math.round(totCout).toLocaleString()} €</td>
                        <td className={`py-2 px-2 text-right ${totMarge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {totMarge >= 0 ? '+' : ''}{Math.round(totMarge).toLocaleString()} €
                        </td>
                        <td className={`py-2 px-2 text-right ${totMarge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {totRec > 0 ? ((totMarge / totRec) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// VUE PILOTAGE GLOBAL
// ═══════════════════════════════════════════════════════════════
const GlobalView = ({ sites, dm }) => {
  const textPri   = dm ? 'text-white' : 'text-slate-800';
  const textMuted = dm ? 'text-gray-400' : 'text-slate-500';
  const card      = `rounded-2xl border shadow-md ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`;
  const tooltip   = dm ? '#1f2937' : '#fff';

  const stats = sites.map(s => ({ ...calcSiteStats(s), nom: s.nom, id: s.id }));
  const totalFF       = stats.reduce((s, x) => s + x.totalFF, 0);
  const totalHV       = sites.reduce((s, x) => s + x.heuresVendues, 0);
  const tauxConsolide = totalHV > 0 ? totalFF / totalHV : 0;
  const totalForm     = stats.reduce((s, x) => s + x.nbFormateurs, 0);
  const totalRec      = stats.reduce((s, x) => s + x.totalRecettes, 0);
  const totalMarge    = stats.reduce((s, x) => s + x.totalMarge, 0);
  const totalSessions = stats.reduce((s, x) => s + x.nbSessions, 0);

  const chartData = stats.map(s => ({
    nom: s.nom,
    'Taux structure': Math.round(s.tauxStructure * 100) / 100,
    'Taux occupation': Math.round(s.tauxOccMoyen * 10) / 10,
    'Heures vendues': sites.find(x => x.id === s.id)?.heuresVendues || 0,
    'Marge': Math.round(s.totalMarge),
  }));

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className={`${card} p-6`}>
        <h3 className={`text-xl font-black mb-5 flex items-center gap-2 ${textPri}`}>
          <Globe size={22} className="text-violet-500" />
          Consolidation Multi-Sites
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { l: 'Frais Fixes',       v: `${Math.round(totalFF).toLocaleString()} €`,  bg: dm ? 'bg-blue-900/30'   : 'bg-blue-50',   c: dm ? 'text-blue-400'   : 'text-blue-600'   },
            { l: 'Heures vendues',    v: totalHV.toLocaleString(),                      bg: dm ? 'bg-indigo-900/30' : 'bg-indigo-50', c: dm ? 'text-indigo-400' : 'text-indigo-600' },
            { l: 'Taux structure',    v: `${tauxConsolide.toFixed(2)} €/h`,             bg: dm ? 'bg-violet-900/30' : 'bg-violet-50', c: dm ? 'text-violet-400' : 'text-violet-600' },
            { l: 'Formateurs',        v: totalForm,                                     bg: dm ? 'bg-teal-900/30'   : 'bg-teal-50',   c: dm ? 'text-teal-400'   : 'text-teal-600'   },
            { l: 'Sessions',          v: totalSessions,                                 bg: dm ? 'bg-orange-900/30' : 'bg-orange-50', c: dm ? 'text-orange-400' : 'text-orange-600' },
            { l: 'CA total',          v: `${Math.round(totalRec).toLocaleString()} €`,  bg: dm ? 'bg-green-900/30'  : 'bg-green-50',  c: dm ? 'text-green-400'  : 'text-green-600'  },
            { l: 'Marge totale',      v: `${totalMarge >= 0 ? '+' : ''}${Math.round(totalMarge).toLocaleString()} €`,
              bg: totalMarge >= 0 ? (dm ? 'bg-green-900/30' : 'bg-green-50') : (dm ? 'bg-red-900/30' : 'bg-red-50'),
              c:  totalMarge >= 0 ? (dm ? 'text-green-400'  : 'text-green-600') : (dm ? 'text-red-400' : 'text-red-600') },
          ].map(k => (
            <div key={k.l} className={`p-4 rounded-2xl ${k.bg}`}>
              <div className={`text-xs font-bold uppercase mb-1 ${k.c}`}>{k.l}</div>
              <div className={`text-lg font-black ${textPri}`}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau comparatif */}
      <div className={`${card} p-6`}>
        <h3 className={`text-lg font-black mb-4 ${textPri}`}>Comparatif par site</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase font-bold ${textMuted} border-b ${dm ? 'border-gray-700' : 'border-slate-200'}`}>
                <th className="text-left pb-3">Site</th>
                <th className="text-right pb-3 px-3">Frais Fixes</th>
                <th className="text-right pb-3 px-3">H. vendues</th>
                <th className="text-right pb-3 px-3">Taux structure</th>
                <th className="text-right pb-3 px-3">Formateurs</th>
                <th className="text-right pb-3 px-3">Sessions</th>
                <th className="text-right pb-3 px-3">Tx. occup. moy.</th>
                <th className="text-right pb-3 px-3">CA sessions</th>
                <th className="text-right pb-3 px-3">Marge</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.id} className={`border-t ${dm ? 'border-gray-700' : 'border-slate-100'}`}>
                  <td className={`py-3 font-black ${textPri}`}>{s.nom}</td>
                  <td className={`py-3 px-3 text-right font-bold ${textPri}`}>{Math.round(s.totalFF).toLocaleString()} €</td>
                  <td className={`py-3 px-3 text-right font-bold ${textPri}`}>{sites.find(x => x.id === s.id)?.heuresVendues.toLocaleString()}</td>
                  <td className={`py-3 px-3 text-right font-black ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{s.tauxStructure.toFixed(2)} €/h</td>
                  <td className={`py-3 px-3 text-right ${textPri}`}>{s.nbFormateurs}</td>
                  <td className={`py-3 px-3 text-right ${textPri}`}>{s.nbSessions}</td>
                  <td className="py-3 px-3 text-right">
                    {s.tauxOccMoyen > 0 ? (
                      <span className={`font-black ${s.tauxOccMoyen < 60 ? 'text-red-500' : s.tauxOccMoyen <= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                        {s.tauxOccMoyen.toFixed(1)}%
                      </span>
                    ) : <span className={textMuted}>—</span>}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${textPri}`}>{Math.round(s.totalRecettes).toLocaleString()} €</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-black ${s.totalMarge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {s.totalMarge >= 0 ? '+' : ''}{Math.round(s.totalMarge).toLocaleString()} €
                    </span>
                  </td>
                </tr>
              ))}
              <tr className={`border-t-2 font-black ${dm ? 'border-gray-600' : 'border-slate-300'}`}>
                <td className={`py-2 ${textPri}`}>TOTAL</td>
                <td className={`py-2 px-3 text-right ${textPri}`}>{Math.round(totalFF).toLocaleString()} €</td>
                <td className={`py-2 px-3 text-right ${textPri}`}>{totalHV.toLocaleString()}</td>
                <td className={`py-2 px-3 text-right ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{tauxConsolide.toFixed(2)} €/h</td>
                <td className={`py-2 px-3 text-right ${textPri}`}>{totalForm}</td>
                <td className={`py-2 px-3 text-right ${textPri}`}>{totalSessions}</td>
                <td className="py-2 px-3"></td>
                <td className={`py-2 px-3 text-right ${textPri}`}>{Math.round(totalRec).toLocaleString()} €</td>
                <td className={`py-2 px-3 text-right ${totalMarge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalMarge >= 0 ? '+' : ''}{Math.round(totalMarge).toLocaleString()} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: 'Taux de structure (€/h)', key: 'Taux structure', color: '#8b5cf6', unit: '€' },
          { title: "Taux d'occupation moy. (%)", key: 'Taux occupation', color: '#f59e0b', unit: '%', refLines: [{ y: 60, c: '#ef4444' }, { y: 80, c: '#f97316' }] },
          { title: 'Heures vendues',          key: 'Heures vendues',  color: '#14b8a6', unit: 'h' },
          { title: 'Marge totale (€)',        key: 'Marge',           color: '#22c55e', unit: '€', ref0: true },
        ].map(g => (
          <div key={g.key} className={`${card} p-5`}>
            <h4 className={`font-bold text-sm mb-3 ${textPri}`}>{g.title}</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dm ? '#374151' : '#e2e8f0'} />
                <XAxis dataKey="nom" tick={{ fontSize: 11, fill: dm ? '#9ca3af' : '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: dm ? '#9ca3af' : '#64748b' }} width={50} />
                {g.ref0 && <ReferenceLine y={0} stroke={dm ? '#6b7280' : '#94a3b8'} />}
                {(g.refLines || []).map(r => <ReferenceLine key={r.y} y={r.y} stroke={r.c} strokeDasharray="4 2" />)}
                <Tooltip contentStyle={{ background: tooltip, border: 'none', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v.toLocaleString()} ${g.unit}`, g.title]} />
                <Bar dataKey={g.key} fill={g.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Alertes */}
      {stats.some(s => s.tauxOccMoyen < 60 || s.tauxOccMoyen > 80 || s.totalMarge < 0) && (
        <div className={`${card} p-5`}>
          <h3 className={`text-lg font-black mb-3 flex items-center gap-2 ${textPri}`}>
            <AlertTriangle size={20} className="text-amber-500" /> Points d'attention
          </h3>
          <div className="space-y-2">
            {stats.filter(s => s.tauxOccMoyen > 0 && s.tauxOccMoyen < 60).map(s => (
              <div key={`low-${s.id}`} className={`p-3 rounded-xl text-sm flex items-center gap-2 ${dm ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                <AlertTriangle size={15} /><strong>{s.nom}</strong> : taux d'occupation {s.tauxOccMoyen.toFixed(1)}% — formateurs sous-utilisés
              </div>
            ))}
            {stats.filter(s => s.tauxOccMoyen > 80).map(s => (
              <div key={`high-${s.id}`} className={`p-3 rounded-xl text-sm flex items-center gap-2 ${dm ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-700'}`}>
                <AlertTriangle size={15} /><strong>{s.nom}</strong> : taux d'occupation {s.tauxOccMoyen.toFixed(1)}% — risque surcharge
              </div>
            ))}
            {stats.filter(s => s.totalMarge < 0 && s.nbSessions > 0).map(s => (
              <div key={`marge-${s.id}`} className={`p-3 rounded-xl text-sm flex items-center gap-2 ${dm ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                <AlertTriangle size={15} /><strong>{s.nom}</strong> : marge négative ({Math.round(s.totalMarge).toLocaleString()} €) sur {s.nbSessions} session{s.nbSessions > 1 ? 's' : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Modal remise à zéro ─────────────────────────────────────────
const ResetModal = ({ onClose, onConfirm, dm }) => {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleConfirm = async () => {
    if (!password) { setError('Veuillez saisir le mot de passe'); return; }
    setLoading(true);
    const ok = await onConfirm(password);
    setLoading(false);
    if (!ok) { setError('Mot de passe incorrect'); setPassword(''); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-3xl shadow-2xl p-6 ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-red-100"><RotateCcw className="text-red-600" size={24} /></div>
          <div>
            <h3 className={`text-xl font-black ${dm ? 'text-white' : 'text-slate-800'}`}>Remise à zéro</h3>
            <p className={`text-sm ${dm ? 'text-gray-400' : 'text-slate-500'}`}>Action irréversible</p>
          </div>
        </div>
        <div className={`mb-5 p-4 rounded-2xl border-2 text-sm ${dm ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>Supprime définitivement :</strong>
              <ul className="mt-1 list-disc list-inside space-y-0.5 font-normal">
                <li>Tous les sites, sessions, formateurs</li>
                <li>Tous les frais fixes saisis</li>
                <li>Toutes les simulations</li>
              </ul>
            </div>
          </div>
        </div>
        <label className={`block text-sm font-bold mb-2 ${dm ? 'text-gray-300' : 'text-slate-600'}`}>
          <Lock size={14} className="inline mr-1" /> Confirmer avec le mot de passe
        </label>
        <div className="relative mb-3">
          <input type={showPwd ? 'text' : 'password'} value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            autoFocus
            className={`w-full px-4 py-3 pr-12 rounded-xl border-2 outline-none ${error ? 'border-red-400' : dm ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' : 'bg-slate-50 border-slate-200 focus:border-red-400'}`}
            placeholder="Mot de passe…" />
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${dm ? 'text-gray-400' : 'text-slate-400'}`}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-bold ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
            Annuler
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            <RotateCcw size={15} /> {loading ? 'Vérification…' : 'Réinitialiser'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const PilotageFinancier = ({ darkMode: dm, checkPassword, startEmpty, budgetPersonnel = [], externalSites, setExternalSites }) => {
  const [localSites, setLocalSites] = useState(startEmpty ? zeroSites : defaultSites);
  const sites    = externalSites    !== undefined ? externalSites    : localSites;
  const setSites = setExternalSites !== undefined ? setExternalSites : setLocalSites;
  const [activeTab, setActiveTab]   = useState(`site-${(startEmpty ? zeroSites : defaultSites)[0].id}`);
  const [editingName, setEditingName] = useState(null);
  const [showReset, setShowReset]   = useState(false);
  const [resetDone, setResetDone]   = useState(false);

  const updateSite = (siteId, field, value) =>
    setSites(sites.map(s => s.id === siteId ? { ...s, [field]: value } : s));

  const handleReset = async (password) => {
    if (!checkPassword) return false;
    const ok = await checkPassword(password);
    if (!ok) return false;
    setSites(zeroSites);
    setActiveTab(`site-${zeroSites[0].id}`);
    setShowReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
    return true;
  };

  const addSite = () => {
    const newId   = Date.now();
    const newSite = makeDefaultSite(newId, `Nouveau Site ${sites.length + 1}`);
    newSite.fraisFixes = newSite.fraisFixes.map((f, i) => ({ ...f, id: newId * 100 + i }));
    newSite.salaries   = newSite.salaries.map((s, i)  => ({ ...s, id: newId * 10  + i }));
    newSite.sessions   = newSite.sessions.map((s, i)  => ({ ...s, id: newId * 1000 + i, formateurId: newSite.salaries[0].id }));
    setSites([...sites, newSite]);
    setActiveTab(`site-${newId}`);
  };

  const deleteSite = (siteId) => {
    if (sites.length <= 1) return;
    const remaining = sites.filter(s => s.id !== siteId);
    setSites(remaining);
    setActiveTab(`site-${remaining[0].id}`);
  };

  const activeSite = sites.find(s => `site-${s.id}` === activeTab);
  const tauxStructure = activeSite
    ? (activeSite.heuresVendues > 0
        ? activeSite.fraisFixes.reduce((s, f) => s + (parseFloat(f.montant) || 0), 0) / activeSite.heuresVendues
        : 0)
    : 0;

  const card    = `rounded-2xl border shadow-md ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`;
  const textPri = dm ? 'text-white' : 'text-slate-800';
  const textMut = dm ? 'text-gray-400' : 'text-slate-500';

  return (
    <div id="pilotage-financier" className="mb-6">
      {showReset && <ResetModal onClose={() => setShowReset(false)} onConfirm={handleReset} dm={dm} />}

      {resetDone && (
        <div className={`mb-4 p-4 rounded-2xl flex items-center gap-3 ${dm ? 'bg-green-900/40 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
          <span className={`font-bold text-sm ${dm ? 'text-green-300' : 'text-green-700'}`}>Données réinitialisées.</span>
        </div>
      )}

      {/* ── EN-TÊTE ── */}
      <div className={`${card} p-6 mb-6`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
              <Calculator className="text-white" size={30} />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${textPri}`}>Outil de Pilotage Financier</h2>
              <p className={`text-sm ${textMut}`}>
                {sites.length} site{sites.length > 1 ? 's' : ''} · {sites.reduce((s, x) => s + (x.sessions?.length || 0), 0)} sessions · {SEMAINES} semaines/an
              </p>
            </div>
          </div>
          <button onClick={() => setShowReset(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${dm ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
            <RotateCcw size={15} /> Réinitialiser
          </button>
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap items-center gap-2">
          {sites.map(site => (
            <div key={site.id} className="flex items-center">
              {editingName === site.id ? (
                <input autoFocus type="text" defaultValue={site.nom}
                  onBlur={e => { updateSite(site.id, 'nom', e.target.value || site.nom); setEditingName(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') { updateSite(site.id, 'nom', e.target.value || site.nom); setEditingName(null); } }}
                  className={`px-3 py-2 rounded-xl border-2 border-violet-500 outline-none text-sm font-bold w-36 ${dm ? 'bg-gray-700 text-white' : 'bg-white text-slate-800'}`}
                />
              ) : (
                <button onClick={() => setActiveTab(`site-${site.id}`)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === `site-${site.id}`
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                      : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  <Building size={14} /> {site.nom}
                  <span className={`text-xs ${activeTab === `site-${site.id}` ? 'text-white/70' : textMut}`}>
                    {site.sessions?.length || 0} sess.
                  </span>
                </button>
              )}
              {activeTab === `site-${site.id}` && editingName !== site.id && (
                <div className="flex items-center ml-1 gap-0.5">
                  <button onClick={() => setEditingName(site.id)} className={`flex items-center justify-center w-7 h-7 rounded-lg ${dm ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-slate-200 text-slate-400'}`} title="Renommer"><Edit2 size={15} /></button>
                  {sites.length > 1 && (
                    <button onClick={() => { if (window.confirm(`Supprimer "${site.nom}" ?`)) deleteSite(site.id); }}
                      className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-100 text-red-400" title="Supprimer"><X size={15} /></button>
                  )}
                </div>
              )}
            </div>
          ))}

          <button onClick={addSite}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 border-dashed transition-colors ${dm ? 'border-gray-600 text-gray-400 hover:border-violet-500 hover:text-violet-400' : 'border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600'}`}>
            <Plus size={14} /> Ajouter un site
          </button>

          <div className={`h-8 w-px mx-1 ${dm ? 'bg-gray-600' : 'bg-slate-200'}`} />

          <button onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'global'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            <Globe size={14} /> Pilotage Global
          </button>
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'global' ? (
        <GlobalView sites={sites} dm={dm} />
      ) : activeSite ? (
        <SiteView
          site={activeSite}
          onUpdateSite={(field, value) => updateSite(activeSite.id, field, value)}
          tauxFraisStructure={tauxStructure}
          dm={dm}
          budgetPersonnel={budgetPersonnel}
        />
      ) : null}
    </div>
  );
};

export default PilotageFinancier;
