import React, { useState } from 'react';
import { Plus, Trash2, Users, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { calculerSalaireAnnuel, verifierCoherencePoolRH, syncPoolRH } from '../utils/calculations';
import { PRIME_SEGUR } from '../utils/constants';

const ROLES = [
  { value: 'direction', label: 'Direction' },
  { value: 'formateur', label: 'Formateur' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'technique', label: 'Technique' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'autre', label: 'Autre' },
];

const TYPES_CONTRAT = ['CDI', 'CDD', 'Apprentissage'];

function newAgent() {
  return {
    id: Date.now(),
    titre: '',
    salaire: 0,
    etp: 1,
    segur: false,
    role: 'administratif',
    typeContrat: 'CDI',
    tauxChargesManuel: null,
    eligibleSubvention: false,
    tauxSubvRegion: 100,
    multiAffectation: true,
    affectations: [],
    genre: '',          // 'H' | 'F' | '' (non renseigné) — pour parité H/F
    anneeNaissance: 0,  // année — pour pyramide des âges + IDR/IFC
    dateEntree: 0,      // année — pour ancienneté + IDR/IFC + turn-over entrées
    dateSortie: 0,      // 0 = en activité ; année > 0 = année de sortie (turn-over)
  };
}

function sumPct(affectations) {
  return (affectations || []).reduce((s, a) => s + (parseFloat(a.pct) || 0), 0);
}

function EntityLabel({ aff, services, direction, poleSupport }) {
  if (aff.entityType === 'direction') return <span>Direction / Siège</span>;
  if (aff.entityType === 'poleSupport') return <span>Pôle Ressources</span>;
  const svc = (services || []).find(s => s.id === aff.entityId);
  return <span>{svc ? svc.nom : `Service #${aff.entityId}`}</span>;
}

export default function PoolRHManager({ poolRH, setPoolRH, services, direction, poleSupport, darkMode, msETP }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const entities = [
    { entityType: 'direction', entityId: null, label: 'Direction / Siège' },
    { entityType: 'poleSupport', entityId: null, label: 'Pôle Ressources' },
    ...(services || []).map(s => ({ entityType: 'service', entityId: s.id, label: s.nom })),
  ];

  const segurETP = msETP ?? PRIME_SEGUR;

  const startEdit = (agent) => {
    setEditingId(agent.id);
    setEditForm({ ...agent, affectations: [...(agent.affectations || [])] });
    setExpandedId(agent.id);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const saveEdit = () => {
    const updated = poolRH.map(a => a.id === editingId ? { ...editForm } : a);
    setPoolRH(syncPoolRH(updated));
    setEditingId(null);
    setEditForm(null);
  };

  const addAgent = () => {
    const agent = newAgent();
    setPoolRH([...poolRH, agent]);
    startEdit(agent);
  };

  const deleteAgent = (id) => {
    setPoolRH(poolRH.filter(a => a.id !== id));
    if (editingId === id) cancelEdit();
    if (expandedId === id) setExpandedId(null);
  };

  const setField = (key, value) => setEditForm(f => ({ ...f, [key]: value }));

  const addAffectation = (entity) => {
    const already = (editForm.affectations || []).find(
      a => a.entityType === entity.entityType && a.entityId === entity.entityId
    );
    if (already) return;
    const remaining = Math.max(0, 100 - sumPct(editForm.affectations));
    setEditForm(f => ({
      ...f,
      affectations: [...(f.affectations || []), { entityType: entity.entityType, entityId: entity.entityId, pct: remaining }],
    }));
  };

  const updateAffPct = (idx, pct) => {
    setEditForm(f => ({
      ...f,
      affectations: f.affectations.map((a, i) => i === idx ? { ...a, pct: Math.min(100, Math.max(0, parseFloat(pct) || 0)) } : a),
    }));
  };

  const removeAff = (idx) => {
    setEditForm(f => ({ ...f, affectations: f.affectations.filter((_, i) => i !== idx) }));
  };

  const card = darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200';
  const label = darkMode ? 'text-gray-400' : 'text-gray-500';
  const input = `w-full px-2 py-1 rounded border text-sm ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`;
  const btnPrimary = 'px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors';
  const btnGhost = `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${darkMode ? 'bg-zinc-700 text-gray-300 hover:bg-zinc-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;

  const alertesCoherence = verifierCoherencePoolRH(poolRH);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-purple-500" />
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Pool RH — Agents partagés
          </h3>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
            {poolRH.length}
          </span>
          {alertesCoherence.length > 0 && (
            <span className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-pulse">
              <AlertTriangle size={11} /> {alertesCoherence.length} sur-affectation{alertesCoherence.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button onClick={addAgent} className={btnPrimary}>
          <span className="flex items-center gap-1"><Plus size={14} /> Ajouter un agent</span>
        </button>
      </div>

      {/* ── Bannière alertes sur-affectation ── */}
      {alertesCoherence.length > 0 && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
          <div className={`flex items-center gap-2 font-black text-sm mb-2 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
            <AlertTriangle size={16} /> Sur-affectation détectée — impact sur les budgets de service
          </div>
          <div className="space-y-1.5">
            {alertesCoherence.map(a => (
              <div key={a.agentId} className={`flex items-center justify-between rounded-lg px-3 py-2 ${darkMode ? 'bg-red-900/30' : 'bg-white border border-red-100'}`}>
                <div>
                  <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{a.nom}</span>
                  <span className={`text-[10px] ml-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{a.msg}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(a.totalPct, 100)}%` }} />
                  </div>
                  <span className="text-xs font-black text-red-500">{Math.round(a.totalPct)}%</span>
                </div>
              </div>
            ))}
          </div>
          <p className={`mt-2 text-[11px] ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            Un agent sur-affecté comptabilise plus de 100% de son temps — les coûts sont dupliqués dans les budgets de service, faussant la masse salariale totale.
          </p>
        </div>
      )}

      {poolRH.length === 0 && (
        <div className={`rounded-xl border-2 border-dashed p-8 text-center ${darkMode ? 'border-zinc-700 text-zinc-500' : 'border-slate-200 text-slate-400'}`}>
          <Users size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun agent dans le pool RH partagé.</p>
          <p className="text-xs mt-1">Les agents partagés sont affectés à plusieurs services via un pourcentage.</p>
        </div>
      )}

      {poolRH.map(agent => {
        const isEditing = editingId === agent.id;
        const isExpanded = expandedId === agent.id;
        const data = isEditing ? editForm : agent;
        const total = sumPct(data.affectations);
        const pctOk = Math.abs(total - 100) < 0.01;
        const segurResolu = data.segur === true ? segurETP : (parseFloat(data.segur) || 0);
        const cout = calculerSalaireAnnuel(data.salaire, data.etp, segurResolu, data.typeContrat, data.tauxChargesManuel);

        return (
          <div key={agent.id} className={`rounded-xl border ${card} overflow-hidden`}>
            {/* Card header */}
            <div
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${darkMode ? 'hover:bg-zinc-700/50' : 'hover:bg-slate-50'}`}
              onClick={() => !isEditing && setExpandedId(isExpanded ? null : agent.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {agent.titre || <span className="italic opacity-50">Sans nom</span>}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${darkMode ? 'bg-zinc-700 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                    {ROLES.find(r => r.value === agent.role)?.label || agent.role}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                    {agent.etp} ETP · {(agent.salaire || 0).toLocaleString()} €/mois
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                    Coût total : <strong>{Math.round(cout.total).toLocaleString()} €/an</strong>
                  </span>
                  {/* Pct indicator */}
                  {agent.affectations?.length > 0 && (
                    <span className={`flex items-center gap-1 text-xs font-semibold ${pctOk ? 'text-green-500' : total > 100 ? 'text-red-500' : 'text-amber-500'}`}>
                      {pctOk ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                      {Math.round(total)}%
                    </span>
                  )}
                  {agent.affectations?.length > 0 && (
                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>
                      {agent.affectations.map(a => {
                        const ent = entities.find(e => e.entityType === a.entityType && e.entityId === a.entityId);
                        return `${ent?.label || a.entityType} ${a.pct}%`;
                      }).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing && (
                  <button
                    onClick={e => { e.stopPropagation(); startEdit(agent); }}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${darkMode ? 'bg-zinc-700 text-gray-300 hover:bg-purple-900/50 hover:text-purple-300' : 'bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-700'}`}
                  >
                    Modifier
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); deleteAgent(agent.id); }}
                  className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-600 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                >
                  <Trash2 size={14} />
                </button>
                {!isEditing && (
                  <span className={`${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded / Edit zone */}
            {(isExpanded || isEditing) && (
              <div className={`px-4 pb-4 pt-1 border-t ${darkMode ? 'border-zinc-700' : 'border-slate-100'}`}>
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Champs agent */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Nom du salarié</label>
                        <input className={input} value={data.titre || ''} onChange={e => setField('titre', e.target.value)} placeholder="Ex. Chargé RH" autoFocus />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Salaire brut mensuel (€)</label>
                        <input className={input} type="number" min="0" value={data.salaire || ''} onChange={e => setField('salaire', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>ETP</label>
                        <input className={input} type="number" min="0.1" max="1" step="0.05" value={data.etp || ''} onChange={e => setField('etp', parseFloat(e.target.value) || 1)} />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Type contrat</label>
                        <select className={input} value={data.typeContrat || 'CDI'} onChange={e => setField('typeContrat', e.target.value)}>
                          {TYPES_CONTRAT.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Rôle</label>
                        <select className={input} value={data.role || 'autre'} onChange={e => setField('role', e.target.value)}>
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!data.segur} onChange={e => setField('segur', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Prime Ségur</span>
                        </label>
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Taux charges manuel (%)</label>
                        <input className={input} type="number" min="0" max="100" step="0.1"
                          value={data.tauxChargesManuel ?? ''}
                          placeholder="Auto"
                          onChange={e => setField('tauxChargesManuel', e.target.value === '' ? null : parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Genre (parité H/F)</label>
                        <select className={input} value={data.genre || ''} onChange={e => setField('genre', e.target.value)}>
                          <option value="">— non renseigné —</option>
                          <option value="H">Homme</option>
                          <option value="F">Femme</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Année naissance</label>
                        <input className={input} type="number" min="1940" max="2010" placeholder="ex. 1985"
                          value={data.anneeNaissance || ''}
                          onChange={e => setField('anneeNaissance', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Année d'entrée</label>
                        <input className={input} type="number" min="1980" max="2050" placeholder="ex. 2018"
                          value={data.dateEntree || ''}
                          onChange={e => setField('dateEntree', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${label}`}>Année de sortie</label>
                        <input className={input} type="number" min="1980" max="2050" placeholder="0 = en activité"
                          value={data.dateSortie || ''}
                          onChange={e => setField('dateSortie', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!data.eligibleSubvention} onChange={e => setField('eligibleSubvention', e.target.checked)} className="w-4 h-4 accent-violet-500" />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Subvention Région</span>
                        </label>
                        {data.eligibleSubvention && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <input className={`w-16 px-2 py-1 rounded border text-sm text-right ${darkMode ? 'bg-violet-900/40 border-violet-600 text-violet-200' : 'bg-violet-50 border-violet-300 text-violet-700'}`}
                              type="number" min="0" max="100"
                              value={data.tauxSubvRegion ?? 100}
                              onChange={e => setField('tauxSubvRegion', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} />
                            <span className={`text-xs ${darkMode ? 'text-violet-400' : 'text-violet-500'}`}>% pris en charge</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Aperçu coût */}
                    <div className={`rounded-lg px-3 py-2 text-xs flex gap-4 ${darkMode ? 'bg-zinc-700/50 text-gray-400' : 'bg-slate-50 text-slate-500'}`}>
                      {(() => {
                        const sr = data.segur === true ? segurETP : (parseFloat(data.segur) || 0);
                        const c = calculerSalaireAnnuel(data.salaire, data.etp, sr, data.typeContrat, data.tauxChargesManuel);
                        return <>
                          <span>Brut : <strong className={darkMode ? 'text-white' : 'text-slate-700'}>{Math.round(c.brut + c.brutSegur).toLocaleString()} €</strong></span>
                          <span>Charges : <strong className={darkMode ? 'text-white' : 'text-slate-700'}>{Math.round(c.charges).toLocaleString()} €</strong></span>
                          <span>Total employeur : <strong className={`${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{Math.round(c.total).toLocaleString()} €/an</strong></span>
                          <span>Taux : <strong>{(c.tauxCharges * 100).toFixed(1)}%</strong></span>
                        </>;
                      })()}
                    </div>

                    {/* Affectations */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Affectations</span>
                        <span className={`text-xs font-bold flex items-center gap-1 ${Math.abs(sumPct(data.affectations) - 100) < 0.01 ? 'text-green-500' : sumPct(data.affectations) > 100 ? 'text-red-500' : 'text-amber-500'}`}>
                          {Math.abs(sumPct(data.affectations) - 100) < 0.01 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                          {Math.round(sumPct(data.affectations))} / 100 %
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div className={`h-2 rounded-full mb-3 overflow-hidden ${darkMode ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                        <div
                          className={`h-full rounded-full transition-all ${sumPct(data.affectations) > 100 ? 'bg-red-500' : sumPct(data.affectations) === 100 ? 'bg-green-500' : 'bg-amber-400'}`}
                          style={{ width: `${Math.min(100, sumPct(data.affectations))}%` }}
                        />
                      </div>

                      {/* Lignes affectation */}
                      {(data.affectations || []).map((aff, idx) => {
                        const ent = entities.find(e => e.entityType === aff.entityType && e.entityId === aff.entityId);
                        return (
                          <div key={idx} className={`flex items-center gap-3 mb-2 p-2 rounded-lg ${darkMode ? 'bg-zinc-700/50' : 'bg-slate-50'}`}>
                            <span className={`flex-1 text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{ent?.label || `${aff.entityType} ${aff.entityId}`}</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min="0" max="100" step="1"
                                value={aff.pct}
                                onChange={e => updateAffPct(idx, e.target.value)}
                                className={`w-20 px-2 py-1 rounded border text-sm text-right ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-slate-300 text-slate-800'}`}
                              />
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>%</span>
                            </div>
                            <button onClick={() => removeAff(idx)} className={`p-1 rounded transition-colors ${darkMode ? 'text-gray-600 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}>
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Ajouter affectation */}
                      <div className="mt-2">
                        <label className={`block text-xs mb-1 ${label}`}>Ajouter une affectation :</label>
                        <div className="flex flex-wrap gap-1">
                          {entities
                            .filter(e => !(data.affectations || []).find(a => a.entityType === e.entityType && a.entityId === e.entityId))
                            .map(e => (
                              <button
                                key={`${e.entityType}-${e.entityId}`}
                                onClick={() => addAffectation(e)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${darkMode ? 'bg-zinc-700 text-gray-300 hover:bg-purple-900/50 hover:text-purple-300' : 'bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-700'}`}
                              >
                                <Plus size={10} /> {e.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={saveEdit} className={btnPrimary}>Enregistrer</button>
                      <button onClick={cancelEdit} className={btnGhost}>Annuler</button>
                      {Math.abs(sumPct(data.affectations) - 100) > 0.01 && data.affectations.length > 0 && (
                        <span className={`text-xs flex items-center gap-1 ${sumPct(data.affectations) > 100 ? 'text-red-500' : 'text-amber-500'}`}>
                          <AlertTriangle size={12} />
                          La somme des affectations doit être égale à 100%
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Vue lecture seule */
                  <div className="mt-2">
                    {(agent.affectations || []).length === 0 ? (
                      <p className={`text-xs italic ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>Aucune affectation définie.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {agent.affectations.map((aff, idx) => {
                          const ent = entities.find(e => e.entityType === aff.entityType && e.entityId === aff.entityId);
                          return (
                            <div key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${darkMode ? 'bg-zinc-700 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                              {ent?.label || aff.entityType} — <strong>{aff.pct}%</strong>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
