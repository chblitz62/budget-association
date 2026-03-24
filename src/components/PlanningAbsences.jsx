import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const TYPES_ABSENCE = [null, 'conge', 'maladie', 'formation', 'rtt'];

const LABELS = {
  conge: 'Congé',
  maladie: 'Maladie',
  formation: 'Formation',
  rtt: 'RTT',
};

const BG_CLASSES = {
  conge: 'bg-blue-400',
  maladie: 'bg-red-400',
  formation: 'bg-green-400',
  rtt: 'bg-purple-400',
};

const TEXT_CLASSES = {
  conge: 'text-blue-800',
  maladie: 'text-red-800',
  formation: 'text-green-800',
  rtt: 'text-purple-800',
};

const padNum = (n) => String(n).padStart(2, '0');

const PlanningAbsences = ({ direction, poleSupport, services, planningAbsences, setPlanningAbsences, darkMode }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const monthKey = `${year}-${padNum(month + 1)}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const agents = [
    ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
    ...(poleSupport?.personnel || []).map(p => ({ ...p, source: 'Pôle Support' })),
    ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
  ];

  // Vérifie si un jour tombe dans une plage d'absence budget (dateDebut/dateFin)
  const getBudgetAbsence = (agent, day) => {
    const dateStr = `${year}-${padNum(month + 1)}-${padNum(day)}`;
    const ab = (agent.absences || []).find(a => a.dateDebut && a.dateFin && dateStr >= a.dateDebut && dateStr <= a.dateFin);
    if (!ab) return null;
    // Normaliser 'arret' (arrêt travail) en 'maladie' pour la grille
    return ab.type === 'arret' ? 'maladie' : ab.type;
  };

  const getAbsence = (agent, day) => {
    const dayKey = `${year}-${padNum(month + 1)}-${padNum(day)}`;
    const agentKey = `${agent.id}-${agent.source}`;
    // La grille cliquable a priorité sur les absences budget
    const gridValue = planningAbsences?.[monthKey]?.[agentKey]?.[dayKey] ?? null;
    if (gridValue !== null) return gridValue;
    return getBudgetAbsence(agent, day);
  };

  const cycleAbsence = (agent, day) => {
    const dayKey = `${year}-${padNum(month + 1)}-${padNum(day)}`;
    const agentKey = `${agent.id}-${agent.source}`;
    const current = getAbsence(agent, day);
    const idx = TYPES_ABSENCE.indexOf(current);
    const next = TYPES_ABSENCE[(idx + 1) % TYPES_ABSENCE.length];

    setPlanningAbsences(prev => {
      const newPlan = { ...(prev || {}) };
      if (!newPlan[monthKey]) newPlan[monthKey] = {};
      if (!newPlan[monthKey][agentKey]) newPlan[monthKey][agentKey] = {};

      if (next === null) {
        const updated = { ...newPlan[monthKey][agentKey] };
        delete updated[dayKey];
        newPlan[monthKey] = { ...newPlan[monthKey], [agentKey]: updated };
      } else {
        newPlan[monthKey] = {
          ...newPlan[monthKey],
          [agentKey]: { ...newPlan[monthKey][agentKey], [dayKey]: next },
        };
      }
      return newPlan;
    });
  };

  const totalAbsencesForAgent = (agent) => {
    return days.filter(d => !isWeekend(d) && getAbsence(agent, d) !== null).length;
  };

  const totalAbsencesForDay = (day) => {
    return agents.reduce((sum, a) => {
      return getAbsence(a, day) !== null ? sum + 1 : sum;
    }, 0);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const JOURS_COURTS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  const getDayOfWeek = (day) => new Date(year, month, day).getDay();
  const isWeekend = (day) => { const d = getDayOfWeek(day); return d === 0 || d === 6; };

  const totalJoursAbsence = agents.reduce((sum, a) => sum + totalAbsencesForAgent(a), 0);

  return (
    <div id="planning-absences" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-violet-900' : 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <Calendar className={darkMode ? 'text-violet-400' : 'text-violet-600'} size={28} />
          <div>
            <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Planning des Absences</h2>
            <span className={`text-xs font-bold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>Suivi mensuel des absences de l'équipe</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalJoursAbsence > 0 && (
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-violet-900/40 text-violet-300 border border-violet-700' : 'bg-violet-100 text-violet-700 border border-violet-300'}`}>
              {totalJoursAbsence} jour{totalJoursAbsence > 1 ? 's' : ''} d'absence ce mois
            </div>
          )}
          {/* Month selector */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${darkMode ? 'bg-gray-700' : 'bg-white border border-violet-200'}`}>
            <button onClick={prevMonth} className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-violet-100 text-slate-600'}`}>
              <ChevronLeft size={16} />
            </button>
            <span className={`text-sm font-black w-36 text-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {MOIS_FR[month]} {year}
            </span>
            <button onClick={nextMonth} className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-violet-100 text-slate-600'}`}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Légende :</span>
        {TYPES_ABSENCE.filter(t => t !== null).map(type => (
          <span key={type} className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${BG_CLASSES[type]} ${TEXT_CLASSES[type]}`}>
            {LABELS[type]}
          </span>
        ))}
        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>— Cliquer sur une cellule pour changer le type (cycle)</span>
      </div>

      {/* Calendar grid */}
      {agents.length === 0 ? (
        <p className={`text-center py-8 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
          Aucun agent renseigné — ajoutez du personnel dans les sections Siège, Pôle Ressource ou Services.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse min-w-full">
            <thead>
              <tr>
                <th className={`text-left px-2 py-2 font-bold sticky left-0 z-10 min-w-[160px] ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-violet-50 text-slate-600'}`}>
                  Agent / Service
                </th>
                {days.map(d => (
                  <th
                    key={d}
                    className={`px-1 py-1 text-center w-8 font-bold ${isWeekend(d) ? (darkMode ? 'bg-gray-700/60 text-gray-500' : 'bg-slate-100 text-slate-400') : (darkMode ? 'bg-gray-800 text-gray-300' : 'bg-violet-50 text-slate-500')}`}
                  >
                    <div>{d}</div>
                    <div className={`text-xs font-normal ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>{JOURS_COURTS[getDayOfWeek(d)]}</div>
                  </th>
                ))}
                <th className={`px-2 py-2 text-center font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-violet-50 text-slate-600'}`}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, aIdx) => {
                const totalAgent = totalAbsencesForAgent(agent);
                return (
                  <tr key={`${agent.id}-${agent.source}`} className={`${aIdx % 2 === 0 ? (darkMode ? 'bg-gray-800/50' : 'bg-white/60') : (darkMode ? 'bg-gray-700/30' : 'bg-violet-50/40')}`}>
                    <td className={`px-2 py-1 sticky left-0 z-10 ${aIdx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750 bg-gray-700' : 'bg-violet-50')}`}>
                      <div className={`font-bold truncate max-w-[150px] ${darkMode ? 'text-white' : 'text-slate-800'}`} title={agent.titre}>
                        {agent.titre || 'Agent'}
                      </div>
                      <div className={`text-xs truncate max-w-[150px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{agent.source}</div>
                    </td>
                    {days.map(d => {
                      const absence = getAbsence(agent, d);
                      const weekend = isWeekend(d);
                      const fromBudget = !weekend && absence !== null && (planningAbsences?.[monthKey]?.[`${agent.id}-${agent.source}`]?.[`${year}-${padNum(month + 1)}-${padNum(d)}`] ?? null) === null;
                      return (
                        <td key={d} className={`p-0.5 text-center ${weekend ? (darkMode ? 'bg-gray-700/40' : 'bg-slate-100/60') : ''}`}>
                          {weekend ? (
                            <div className={`w-7 h-7 rounded flex items-center justify-center mx-auto ${darkMode ? 'bg-gray-700/40' : 'bg-slate-100'}`}>
                              <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => cycleAbsence(agent, d)}
                              className={`w-7 h-7 flex items-center justify-center mx-auto transition-all ${
                                absence
                                  ? `${BG_CLASSES[absence]} ${fromBudget ? 'rounded-sm opacity-70 ring-1 ring-inset ring-white/50' : 'rounded'}`
                                  : darkMode
                                  ? 'rounded hover:bg-gray-600'
                                  : 'rounded hover:bg-violet-100'
                              }`}
                              title={absence ? `${LABELS[absence]}${fromBudget ? ' (budget)' : ''}` : 'Cliquer pour ajouter une absence'}
                            >
                              {absence && (
                                <span className={`text-xs font-black ${TEXT_CLASSES[absence]}`}>
                                  {absence === 'conge' ? 'C' : absence === 'maladie' ? 'M' : absence === 'formation' ? 'F' : 'R'}
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-2 py-1 text-center font-black ${totalAgent > 0 ? (darkMode ? 'text-violet-300' : 'text-violet-700') : (darkMode ? 'text-gray-600' : 'text-slate-300')}`}>
                      {totalAgent > 0 ? totalAgent : '—'}
                    </td>
                  </tr>
                );
              })}
              {/* Total per day row */}
              <tr className={`border-t-2 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-violet-200 bg-violet-100'}`}>
                <td className={`px-2 py-1.5 font-black text-xs sticky left-0 z-10 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-violet-100 text-slate-600'}`}>
                  Total / jour
                </td>
                {days.map(d => {
                  const tot = totalAbsencesForDay(d);
                  const weekend = isWeekend(d);
                  return (
                    <td key={d} className={`px-1 py-1.5 text-center font-black ${weekend ? (darkMode ? 'bg-gray-700/40 text-gray-600' : 'bg-slate-100 text-slate-300') : ''}`}>
                      {!weekend && tot > 0 ? (
                        <span className={`text-xs font-black px-1 rounded ${darkMode ? 'bg-violet-900/60 text-violet-300' : 'bg-violet-200 text-violet-800'}`}>
                          {tot}
                        </span>
                      ) : (!weekend ? <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span> : null)}
                    </td>
                  );
                })}
                <td className={`px-2 py-1.5 text-center font-black text-xs ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
                  {totalJoursAbsence}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary by type */}
      {totalJoursAbsence > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {TYPES_ABSENCE.filter(t => t !== null).map(type => {
            const count = agents.reduce((sum, a) => {
              return sum + days.reduce((s2, d) => {
                if (isWeekend(d)) return s2;
                return getAbsence(a, d) === type ? s2 + 1 : s2;
              }, 0);
            }, 0);
            if (count === 0) return null;
            return (
              <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white border border-violet-200 text-slate-700'}`}>
                <span className={`w-3 h-3 rounded-full ${BG_CLASSES[type]}`}></span>
                {LABELS[type]} : {count} jour{count > 1 ? 's' : ''}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanningAbsences;
