/**
 * WizardSetup — Assistant de configuration initiale
 * 5 étapes : Bienvenue · Structure · Personnel · Recettes · Récapitulatif
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, Check, Plus, Trash2, Building2,
  Users, Banknote, BarChart3, Zap, UserCheck, Calendar, X,
  GraduationCap, AlertTriangle, Info
} from 'lucide-react';
import { calculerSalaireAnnuel } from '../utils/calculations';
import { CHARGES_PATRONALES, PRIME_SEGUR } from '../utils/constants';

const STEPS = [
  { label: 'Bienvenue',   icon: Building2 },
  { label: 'Structure',   icon: BarChart3 },
  { label: 'Personnel',   icon: Users },
  { label: 'Recettes',    icon: Banknote },
  { label: 'Récapitulatif', icon: Check },
];

const TYPES_SERVICE = [
  { id: 'fi',         label: 'Formation Initiale (FI)' },
  { id: 'fc',         label: 'Formation Continue (FC)' },
  { id: 'mixte',      label: 'Mixte FI + FC' },
  { id: 'prestation', label: 'Prestation de service' },
];

const TYPES_CONTRAT = ['CDI', 'CDD', 'Apprentissage', 'Stage', 'Vacataire'];

const ROLES = [
  { id: 'direction',     label: 'Direction' },
  { id: 'formateur',     label: 'Formateur·rice' },
  { id: 'responsable',   label: 'Responsable secteur' },
  { id: 'administratif', label: 'Administratif·ve' },
  { id: 'technique',     label: 'Technique' },
  { id: 'documentation', label: 'Documentation' },
];

const newId = () => Date.now() + Math.random();

const newAgent = (overrides = {}) => ({
  id: newId(), titre: '', etp: 1, salaire: 2500,
  segur: false, rqth: false, anneeNaissance: '',
  typeContrat: 'CDI', dateFinContrat: '', role: 'formateur',
  nbJoursRTT: 0, joursConges: 25,
  multiAffectation: false, affectations: [],
  ...overrides,
});

const newService = (n) => ({
  id: newId(), nom: `Service ${n}`, type: 'fi',
});

const newRecette = (nom, montant = 0) => ({
  id: newId(), nom, montant,
});

// ── Parsing robuste : gère virgule, point, espaces (notation française) ────────
function parseLocaleNumber(str) {
  const s = str.trim().replace(/\s/g, '');
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalized;
  if (lastDot > lastComma) {
    // point = séparateur décimal : "2,500.50" → supprimer virgules
    normalized = s.replace(/,/g, '');
  } else if (lastComma > lastDot) {
    // virgule = séparateur décimal : "2.500,50" → supprimer points, virgule→point
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = s;
  }
  return parseFloat(normalized);
}

const isPartial = (s) => /[.,]$/.test(s.trim());

// ── Champ numérique tolérant virgule et point ─────────────────────────────────
function DecimalInput({ value, onChange, integer = false, className, ...props }) {
  const [str, setStr] = useState(String(value ?? ''));
  const lastExternal = useRef(value);
  useEffect(() => {
    if (value !== lastExternal.current) {
      const parsedStr = parseLocaleNumber(str);
      if (isNaN(parsedStr) || parsedStr !== value) setStr(String(value ?? ''));
      lastExternal.current = value;
    }
  }, [value]);
  const commit = (raw) => {
    const parsed = parseLocaleNumber(raw);
    if (!isNaN(parsed)) {
      const v = integer ? Math.round(parsed) : parsed;
      lastExternal.current = v;
      onChange(v);
    }
  };
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      className={className}
      value={str}
      onChange={e => { const raw = e.target.value; setStr(raw); if (!isPartial(raw)) commit(raw); }}
      onBlur={() => { commit(str); const parsed = parseLocaleNumber(str); if (isNaN(parsed)) setStr(String(value ?? '')); }}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
    />
  );
}

// ── Tableau compact des agents ───────────────────────────────────────────────
function AgentTable({ agents, onChange, poolable = true, services = [], darkMode }) {
  const td = `px-2 py-1.5 text-xs`;
  const inp = (cls = '') => `rounded-lg px-2 py-1 text-xs font-bold outline-none border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200'} ${cls}`;

  const update = (id, field, val) =>
    onChange(agents.map(a => a.id === id ? { ...a, [field]: val } : a));

  const toggleAff = (agentId, entityType, entityId, checked) => {
    onChange(agents.map(a => {
      if (a.id !== agentId) return a;
      const affs = a.affectations.filter(x => !(x.entityType === entityType && x.entityId === entityId));
      if (checked) affs.push({ entityType, entityId, pct: 0 });
      return { ...a, affectations: affs };
    }));
  };

  const updateAffPct = (agentId, entityType, entityId, pct) => {
    onChange(agents.map(a => {
      if (a.id !== agentId) return a;
      return {
        ...a,
        affectations: a.affectations.map(x =>
          x.entityType === entityType && x.entityId === entityId ? { ...x, pct: parseFloat(pct) || 0 } : x
        ),
      };
    }));
  };

  if (agents.length === 0) {
    return (
      <div className={`text-center py-8 rounded-2xl border-2 border-dashed text-sm ${darkMode ? 'border-gray-600 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
        Aucun agent — cliquez sur + Ajouter
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {agents.map(agent => {
        const montantSegur = agent.segur ? PRIME_SEGUR : 0;
        const sal = calculerSalaireAnnuel(agent.salaire, agent.etp, montantSegur);
        const totalAff = agent.affectations.reduce((s, a) => s + (a.pct || 0), 0);
        const affOk = !agent.multiAffectation || Math.abs(totalAff - 100) < 0.5;

        return (
          <div key={agent.id} className={`rounded-2xl border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-200'}`}>
            {/* Ligne principale */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                placeholder="Titre / Prénom Nom"
                className={inp('flex-1 min-w-[140px]')}
                value={agent.titre}
                onChange={e => update(agent.id, 'titre', e.target.value)}
              />
              <div className="flex items-center gap-1">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>ETP</span>
                <DecimalInput
                  className={inp('w-14 text-center')}
                  value={agent.etp}
                  onChange={v => update(agent.id, 'etp', v || 1)}
                />
              </div>
              <div className="flex items-center gap-1">
                <DecimalInput
                  className={inp('w-20 text-right')}
                  value={agent.salaire}
                  onChange={v => update(agent.id, 'salaire', v || 0)}
                />
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/m</span>
              </div>
              <select className={inp('w-28')} value={agent.typeContrat}
                onChange={e => update(agent.id, 'typeContrat', e.target.value)}>
                {TYPES_CONTRAT.map(t => <option key={t}>{t}</option>)}
              </select>
              {agent.typeContrat !== 'CDI' && (
                <input type="date" className={inp('w-32')}
                  value={agent.dateFinContrat || ''}
                  onChange={e => update(agent.id, 'dateFinContrat', e.target.value)}
                  title="Date de fin de contrat"
                />
              )}
              <select className={inp('w-32')} value={agent.role}
                onChange={e => update(agent.id, 'role', e.target.value)}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <input type="number" min="1940" max="2005" placeholder="Né en"
                className={inp('w-16 text-center')}
                value={agent.anneeNaissance || ''}
                onChange={e => update(agent.id, 'anneeNaissance', parseInt(e.target.value) || '')}
              />
              {/* Badges */}
              <button
                onClick={() => update(agent.id, 'segur', !agent.segur)}
                title="Prime Ségur médico-social (+238 €/mois)"
                className={`px-2 py-1 rounded-lg text-xs font-black transition-colors ${agent.segur ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-slate-100 text-slate-400')}`}
              >Ségur</button>
              <button
                onClick={() => update(agent.id, 'rqth', !agent.rqth)}
                title="Reconnaissance en Qualité de Travailleur Handicapé"
                className={`px-2 py-1 rounded-lg text-xs font-black transition-colors ${agent.rqth ? 'bg-amber-500 text-white' : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-slate-100 text-slate-400')}`}
              >RQTH</button>
              {poolable && services.length > 0 && (
                <button
                  onClick={() => update(agent.id, 'multiAffectation', !agent.multiAffectation)}
                  title="Agent partagé entre plusieurs services"
                  className={`px-2 py-1 rounded-lg text-xs font-black transition-colors ${agent.multiAffectation ? 'bg-purple-500 text-white' : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-slate-100 text-slate-400')}`}
                >Partagé</button>
              )}
              {/* Coût estimé */}
              <span className={`ml-auto text-xs font-black tabular-nums ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                {Math.round(sal.total).toLocaleString()} €/an
              </span>
              <button onClick={() => onChange(agents.filter(a => a.id !== agent.id))}
                className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Grille répartition multi-service */}
            {agent.multiAffectation && services.length > 0 && (
              <div className={`mt-3 p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-purple-50'}`}>
                <div className={`text-xs font-black mb-2 flex items-center gap-1 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  <Zap size={12} /> Répartition entre services — total : {' '}
                  <span className={affOk ? 'text-emerald-500' : 'text-red-500'}>{totalAff}%</span>
                  {!affOk && <AlertTriangle size={12} className="text-red-500 ml-1" />}
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map(svc => {
                    const aff = agent.affectations.find(a => a.entityType === 'service' && a.entityId === svc.id);
                    return (
                      <div key={svc.id} className="flex items-center gap-1">
                        <input type="checkbox" checked={!!aff}
                          onChange={e => toggleAff(agent.id, 'service', svc.id, e.target.checked)}
                          className="accent-purple-500"
                        />
                        <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{svc.nom}</span>
                        {aff && (
                          <>
                            <input type="number" min="0" max="100" step="5"
                              className={`w-14 rounded-lg px-2 py-0.5 text-xs font-black text-center outline-none border ${darkMode ? 'bg-gray-700 border-purple-600 text-purple-200' : 'bg-white border-purple-300 text-purple-700'}`}
                              value={aff.pct}
                              onChange={e => updateAffPct(agent.id, 'service', svc.id, e.target.value)}
                            />
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>%</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function WizardSetup({ onComplete, onClose, darkMode, existingData }) {
  const [step, setStep] = useState(0);

  // Étape 0 — Bienvenue
  const [assocName, setAssocName] = useState(existingData?.assocName || 'AFERTES');
  const [annee, setAnnee]         = useState(2026);

  // Étape 1 — Structure
  const [dirEnabled, setDirEnabled] = useState(true);
  const [psEnabled,  setPsEnabled]  = useState(true);
  const [services, setServices]     = useState([newService(1), newService(2)]);

  // Étape 2 — Paramètres globaux
  const [segurMontant,    setSegurMontant]    = useState(238);
  const [augmentation,    setAugmentation]    = useState(2.5);

  // Étape 3 — Personnel
  const [dirPersonnel, setDirPersonnel] = useState([]);
  const [psPersonnel,  setPsPersonnel]  = useState([]);
  const [svcPersonnel, setSvcPersonnel] = useState({}); // { [svcId]: [] }
  const [personnelTab, setPersonnelTab] = useState('dir');

  // Étape 4 — Recettes
  const [svcRecettes, setSvcRecettes] = useState({}); // { [svcId]: [] }

  // Helpers personnel services
  const getSvcP = (id) => svcPersonnel[id] || [];
  const setSvcP = (id, val) => setSvcPersonnel(prev => ({ ...prev, [id]: val }));
  const getSvcR = (id) => svcRecettes[id] || [];
  const setSvcR = (id, val) => setSvcRecettes(prev => ({ ...prev, [id]: val }));

  // ── Récapitulatif ────────────────────────────────────────────────────────
  const allAgents = [
    ...dirPersonnel.map(a => ({ ...a, source: 'Siège' })),
    ...psPersonnel.map(a => ({ ...a, source: 'Pôle Ressources' })),
    ...services.flatMap(s => getSvcP(s.id).map(a => ({
      ...a,
      source: a.multiAffectation ? 'Pool RH' : s.nom,
    }))),
  ];
  const poolRHAgents = allAgents.filter(a => a.multiAffectation);
  const msTotal = allAgents.reduce((sum, a) => {
    const sal = calculerSalaireAnnuel(a.salaire, a.etp, a.segur ? segurMontant : 0);
    return sum + sal.total;
  }, 0);

  // ── Finalisation ─────────────────────────────────────────────────────────
  const handleComplete = () => {
    const msETP = segurMontant;
    const makeExploitation = () => [
      { id: newId(), nom: 'Loyer / Charges locatives', montant: 0 },
      { id: newId(), nom: 'Fournitures & matériel', montant: 0 },
      { id: newId(), nom: 'Téléphonie & internet', montant: 0 },
    ];
    const makeInvest = () => ({ bienImmo: { montant: 0, duree: 10, taux: 0 }, travaux: { montant: 0, duree: 5, taux: 0 }, vehicule: { montant: 0, duree: 5, taux: 0 }, informatique: { montant: 0, duree: 3, taux: 0 }, mobilier: { montant: 0, duree: 5, taux: 0 } });

    const builtServices = services.map(s => ({
      id: s.id, nom: s.nom, type: s.type,
      couleur: 'teal', tauxActivite: 100,
      unites: 20, budgetVacataires: 0,
      personnel: getSvcP(s.id).filter(a => !a.multiAffectation),
      exploitation: makeExploitation(),
      investissements: makeInvest(),
      recettes: getSvcR(s.id).length > 0
        ? getSvcR(s.id)
        : [newRecette('Subvention Région', 0), newRecette('Droits inscription', 0)],
      vacataires: [],
    }));

    const poolRH = poolRHAgents.map(({ source, ...a }) => a);

    onComplete({
      assocName,
      annee,
      globalParams: {
        augmentationAnnuelle: augmentation,
        montantSegurETP: msETP,
        delaiPaiementClients: 30,
        delaiPaiementFournisseurs: 30,
        stocksValeur: 0,
        capitauxPropres: 0,
        reservesStrategiques: 0,
        reportANouveau: 0,
        subventionsInvestissement: 0,
        immobilisationsNettes: 0,
        provisions: [],
      },
      direction: {
        personnel: dirEnabled ? dirPersonnel : [],
        chargesSiege: makeExploitation(),
        recettes: [],
      },
      poleSupport: {
        personnel: psEnabled ? psPersonnel : [],
        exploitation: makeExploitation(),
        recettes: [],
        repartition: services.reduce((acc, s) => ({ ...acc, [s.id]: Math.round(100 / services.length) }), {}),
      },
      services: builtServices,
      poolRH,
    });
  };

  const card = `rounded-3xl border p-6 ${darkMode ? 'bg-gray-800/40 border-white/10' : 'bg-white/80 border-slate-200/60'}`;
  const label = `text-xs font-bold uppercase tracking-widest mb-1 block ${darkMode ? 'text-gray-400' : 'text-slate-500'}`;
  const inp = (cls = '') => `rounded-xl px-3 py-2 font-bold outline-none border w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200 text-slate-800'} ${cls}`;

  // ── Rendu des étapes ──────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── Étape 0 : Bienvenue ───────────────────────────────────────────────
      case 0: return (
        <div className="space-y-6 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-teal-500" />
            </div>
            <h2 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Configuration initiale</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Ce wizard va vous guider pour configurer votre budget prévisionnel en 5 étapes.</p>
          </div>
          <div className={card}>
            <label className={label}>Nom de l'association</label>
            <input className={inp()} value={assocName} onChange={e => setAssocName(e.target.value)} placeholder="AFERTES" />
          </div>
          <div className={card}>
            <label className={label}>Année budgétaire</label>
            <input type="number" className={inp('w-32')} value={annee} onChange={e => setAnnee(parseInt(e.target.value) || 2026)} />
          </div>
          <div className={card}>
            <label className={label}>Paramètres globaux</label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Augmentation salariale annuelle</span>
                <div className="flex items-center gap-2 mt-1">
                  <DecimalInput className={inp('w-20 text-center')} value={augmentation} onChange={v => setAugmentation(v || 0)} />
                  <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>%</span>
                </div>
              </div>
              <div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Prime Ségur médico-social</span>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" step="1" min="0" className={inp('w-20 text-center')} value={segurMontant} onChange={e => setSegurMontant(parseInt(e.target.value) || 0)} />
                  <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€/m</span>
                </div>
              </div>
            </div>
            <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Charges patronales : {Math.round(CHARGES_PATRONALES * 100)}% (fixe)</p>
          </div>
        </div>
      );

      // ── Étape 1 : Structure ───────────────────────────────────────────────
      case 1: return (
        <div className="space-y-5 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'dir', label: 'Siège / Direction', desc: 'Personnel administratif, direction générale', enabled: dirEnabled, toggle: setDirEnabled },
              { key: 'ps',  label: 'Pôle Ressources',       desc: 'Agents polyvalents partagés entre services',  enabled: psEnabled,  toggle: setPsEnabled  },
            ].map(e => (
              <div key={e.key} className={`${card} cursor-pointer select-none`} onClick={() => e.toggle(!e.enabled)}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>{e.label}</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${e.enabled ? 'bg-teal-500' : (darkMode ? 'bg-gray-600' : 'bg-slate-200')}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${e.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{e.desc}</p>
              </div>
            ))}
          </div>

          <div className={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Services ({services.length})</h3>
              <button onClick={() => setServices([...services, newService(services.length + 1)])}
                className="bg-teal-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1">
                <Plus size={14} /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {services.map((svc, i) => (
                <div key={svc.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-slate-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-white text-slate-500 shadow'}`}>{i + 1}</span>
                  <input className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-bold outline-none border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-slate-200'}`}
                    value={svc.nom} onChange={e => setServices(services.map(s => s.id === svc.id ? { ...s, nom: e.target.value } : s))} placeholder="Nom du service" />
                  <select className={`rounded-xl px-3 py-1.5 text-sm font-bold outline-none border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-slate-200'}`}
                    value={svc.type} onChange={e => setServices(services.map(s => s.id === svc.id ? { ...s, type: e.target.value } : s))}>
                    {TYPES_SERVICE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <button onClick={() => setServices(services.filter(s => s.id !== svc.id))} disabled={services.length <= 1}
                    className="p-1 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      // ── Étape 2 : Personnel ───────────────────────────────────────────────
      case 2: {
        const tabs = [
          ...(dirEnabled ? [{ id: 'dir', label: 'Siège', icon: Building2 }] : []),
          ...(psEnabled  ? [{ id: 'ps',  label: 'Pôle Ressources', icon: UserCheck }] : []),
          ...services.map(s => ({ id: s.id, label: s.nom, icon: GraduationCap })),
        ];
        if (!tabs.find(t => t.id === personnelTab) && tabs.length > 0)
          setPersonnelTab(tabs[0].id);

        const currentAgents = personnelTab === 'dir' ? dirPersonnel
          : personnelTab === 'ps' ? psPersonnel
          : getSvcP(personnelTab);
        const setCurrentAgents = personnelTab === 'dir' ? setDirPersonnel
          : personnelTab === 'ps' ? setPsPersonnel
          : (v) => setSvcP(personnelTab, v);
        const showPoolable = typeof personnelTab !== 'string' || (personnelTab !== 'dir' && personnelTab !== 'ps');

        return (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className={`flex items-center gap-1 flex-wrap p-1 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setPersonnelTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    personnelTab === t.id
                      ? darkMode ? 'bg-teal-600 text-white' : 'bg-white text-teal-700 shadow'
                      : darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <t.icon size={14} /> {t.label}
                  <span className={`text-[10px] font-black px-1.5 rounded-full ${
                    personnelTab === t.id ? 'bg-white/20' : darkMode ? 'bg-gray-700' : 'bg-slate-200'
                  }`}>
                    {t.id === 'dir' ? dirPersonnel.length : t.id === 'ps' ? psPersonnel.length : getSvcP(t.id).length}
                  </span>
                </button>
              ))}
            </div>

            <div className={`p-1 rounded-2xl ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs px-3 py-2 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <Info size={13} />
                Activez <strong>Partagé</strong> pour un agent affecté à plusieurs services — il sera placé dans le Pool RH commun.
              </p>
            </div>

            <AgentTable
              agents={currentAgents}
              onChange={setCurrentAgents}
              poolable={showPoolable}
              services={services}
              darkMode={darkMode}
            />

            <button onClick={() => setCurrentAgents([...currentAgents, newAgent()])}
              className={`w-full py-3 border-2 border-dashed rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${darkMode ? 'border-gray-600 text-gray-400 hover:border-teal-600 hover:text-teal-400' : 'border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-600'}`}>
              <Plus size={16} /> Ajouter un agent
            </button>
          </div>
        );
      }

      // ── Étape 3 : Recettes ────────────────────────────────────────────────
      case 3: return (
        <div className="max-w-2xl mx-auto space-y-4">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            Renseignez les recettes mensuelles par service. Vous pourrez affiner plus tard.
          </p>
          {services.map(svc => {
            const recettes = getSvcR(svc.id);
            const initRecettes = () => setSvcR(svc.id, [
              newRecette('Subvention Région', 0),
              newRecette('Droits inscription', 0),
              newRecette('Produits FC', 0),
            ]);
            return (
              <div key={svc.id} className={card}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>{svc.nom}</h3>
                  {recettes.length === 0
                    ? <button onClick={initRecettes} className="text-xs text-teal-500 font-bold underline">Pré-remplir</button>
                    : <button onClick={() => setSvcR(svc.id, [...recettes, newRecette('Autre recette')])} className="text-xs flex items-center gap-1 text-teal-500 font-bold"><Plus size={12} />Ajouter</button>
                  }
                </div>
                <div className="space-y-2">
                  {recettes.map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      <input className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-bold outline-none border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200'}`}
                        value={r.nom} onChange={e => setSvcR(svc.id, recettes.map(x => x.id === r.id ? { ...x, nom: e.target.value } : x))} />
                      <input type="number" className={`w-24 rounded-xl px-3 py-1.5 text-sm font-black text-right outline-none border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-green-50 border-green-200'}`}
                        value={r.montant} onChange={e => setSvcR(svc.id, recettes.map(x => x.id === r.id ? { ...x, montant: parseInt(e.target.value) || 0 } : x))} />
                      <span className={`text-xs w-6 ${darkMode ? 'text-gray-400' : 'text-slate-400'}`}>€/m</span>
                      <button onClick={() => setSvcR(svc.id, recettes.filter(x => x.id !== r.id))} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 pt-3 border-t text-right text-sm font-black ${darkMode ? 'border-gray-700 text-green-400' : 'border-slate-100 text-green-700'}`}>
                  {(recettes.reduce((s, r) => s + r.montant, 0) * 12).toLocaleString()} €/an
                </div>
              </div>
            );
          })}
        </div>
      );

      // ── Étape 4 : Récapitulatif ───────────────────────────────────────────
      case 4: return (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Agents', val: allAgents.length, unit: '', color: 'text-teal-500' },
              { label: 'Pool RH partagé', val: poolRHAgents.length, unit: '', color: 'text-purple-500' },
              { label: 'Masse salariale', val: Math.round(msTotal / 1000) + 'k', unit: '€/an', color: 'text-blue-500' },
            ].map(k => (
              <div key={k.label} className={`${card} text-center`}>
                <div className={`text-3xl font-black ${k.color}`}>{k.val}<span className="text-base ml-1">{k.unit}</span></div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className={card}>
            <h3 className={`font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Services configurés</h3>
            <div className="space-y-2">
              {services.map(svc => {
                const agents = getSvcP(svc.id);
                const recettes = getSvcR(svc.id);
                const msService = agents.reduce((sum, a) => {
                  const sal = calculerSalaireAnnuel(a.salaire, a.etp, a.segur ? segurMontant : 0);
                  return sum + sal.total;
                }, 0);
                return (
                  <div key={svc.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-slate-50'}`}>
                    <div>
                      <span className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>{svc.nom}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-slate-200 text-slate-500'}`}>{TYPES_SERVICE.find(t => t.id === svc.type)?.label}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{agents.length} agent{agents.length > 1 ? 's' : ''} · {recettes.length} recette{recettes.length > 1 ? 's' : ''}</div>
                      <div className={`text-sm font-black ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{Math.round(msService).toLocaleString()} €/an MS</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {poolRHAgents.length > 0 && (
            <div className={`${card} border-purple-500/20`}>
              <h3 className={`font-black mb-2 text-purple-500`}>Pool RH — Agents partagés ({poolRHAgents.length})</h3>
              {poolRHAgents.map(a => (
                <div key={a.id} className={`text-xs py-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                  {a.titre || 'Sans nom'} — {a.affectations.map(af => {
                    const svc = services.find(s => s.id === af.entityId);
                    return `${svc?.nom || af.entityId} (${af.pct}%)`;
                  }).join(' · ')}
                </div>
              ))}
            </div>
          )}

          <div className={`p-4 rounded-2xl flex items-start gap-3 ${darkMode ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'}`}>
            <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className={`text-sm ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Configuration prête. Cliquez sur <strong>Lancer le budget</strong> pour créer votre espace de travail. Tout pourra être ajusté ensuite.
            </p>
          </div>
        </div>
      );

      default: return null;
    }
  };

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10"><Building2 size={20} className="text-teal-500" /></div>
            <div>
              <h1 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>Configuration — {assocName}</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Étape {step + 1} sur {STEPS.length} — {STEPS[step].label}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className={`px-8 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <button onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    i === step ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                    : i < step ? (darkMode ? 'bg-teal-900/40 text-teal-400 cursor-pointer hover:bg-teal-900/60' : 'bg-teal-50 text-teal-600 cursor-pointer hover:bg-teal-100')
                    : (darkMode ? 'text-gray-600' : 'text-slate-300')
                  }`}>
                  {i < step ? <Check size={12} /> : <s.icon size={12} />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full ${i < step ? 'bg-teal-500' : (darkMode ? 'bg-gray-700' : 'bg-slate-200')}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {renderStep()}
        </div>

        {/* Footer navigation */}
        <div className={`px-8 py-4 border-t flex justify-between ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <button onClick={() => setStep(s => s - 1)} disabled={!canPrev}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${canPrev ? (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200') : 'opacity-0 pointer-events-none'}`}>
            <ChevronLeft size={16} /> Précédent
          </button>

          {canNext ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20">
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-xl transition-all shadow-lg">
              <Check size={16} /> Lancer le budget
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
