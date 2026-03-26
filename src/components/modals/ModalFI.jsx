import React, { useState, useEffect } from 'react';
import { X, Zap, AlertTriangle } from 'lucide-react';
import { calculerSalaireAnnuel } from '../../utils/calculations';
import HelpIcon from '../ui/HelpIcon';
import { FINANCIAL_HELP as H } from '../../utils/constants';

const moisKeysFI = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
const moisLabelsFI = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const moisLabelsFull = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const PRESETS = [
  { label: 'Effacer tout', fn: () => moisKeysFI.reduce((a,m) => ({...a,[m]:0}), {}) },
  { label: '100% toute l\'année', fn: () => moisKeysFI.reduce((a,m) => ({...a,[m]:100}), {}) },
  { label: '50% toute l\'année', fn: () => moisKeysFI.reduce((a,m) => ({...a,[m]:50}), {}) },
  { label: 'Semestre 1 (Jan–Juin)', fn: () => moisKeysFI.reduce((a,m,i) => ({...a,[m]: i < 6 ? 100 : 0}), {}) },
  { label: 'Semestre 2 (Juil–Déc)', fn: () => moisKeysFI.reduce((a,m,i) => ({...a,[m]: i >= 6 ? 100 : 0}), {}) },
  { label: 'Alternance (1 mois/2)', fn: () => moisKeysFI.reduce((a,m,i) => ({...a,[m]: i % 2 === 0 ? 100 : 0}), {}) },
];

const ModalFI = ({ fiDialog, setFiDialog, services, setServices, msETP, darkMode }) => {
  const [confirme100, setConfirme100] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setFiDialog(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setFiDialog]);

  if (!fiDialog) return null;

  const svc = services.find(s => s.id === fiDialog.serviceId);
  const agent = svc?.personnel.find(p => p.id === fiDialog.agentId);
  if (!svc || !agent) return null;

  // Lecture backward compat : repartitionFC prioritaire, sinon repartitionFI (ancienne sémantique = FI, maintenant interprété comme FC)
  const srcRFC = agent.repartitionFC || agent.repartitionFI;
  const rfi = moisKeysFI.reduce((acc, m) => ({
    ...acc,
    [m]: Math.min(100, Math.max(0, (srcRFC?.[m]) ?? 0))
  }), {});
  const pctMoyen = moisKeysFI.reduce((s, m) => s + rfi[m], 0) / 12; // % moyen FC
  const sal = calculerSalaireAnnuel(agent.salaire, agent.etp, agent.segur === true ? msETP : (parseFloat(agent.segur) || 0), agent.typeContrat);
  const montantFCAnnuel = Math.round(sal.total * pctMoyen / 100);   // part FC
  const montantFIAnnuel = Math.round(sal.total - montantFCAnnuel);   // part FI (extraite)

  const updateRFI = (newRFI) => {
    setConfirme100(false);
    setServices(services.map(s => s.id !== fiDialog.serviceId ? s : {
      ...s,
      // Sauvegarde en repartitionFC ; supprime l'ancienne clé repartitionFI si présente
      personnel: s.personnel.map(p => p.id !== fiDialog.agentId ? p : { ...p, repartitionFC: newRFI, repartitionFI: undefined })
    }));
  };

  const pctTotal = Math.round(pctMoyen * 10) / 10;
  const estPlein = pctMoyen >= 100; // 100% FC = aucune part FI
  const peutValider = !estPlein || confirme100;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print" onClick={() => setFiDialog(null)}>
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
              <Zap className="text-amber-500" size={22} />
            </div>
            <div>
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Répartition FC mensuelle</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{agent.titre} — {svc.nom}</p>
              <p className={`text-xs mt-0.5 flex items-center gap-1.5 flex-wrap ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                <span className="flex items-center gap-1">
                  Salaire {agent.salaire.toLocaleString()} €/mois
                  <HelpIcon {...H.chargesPatronales} darkMode={darkMode} position="bottom" />
                </span>
                · {agent.etp} ETP
                <HelpIcon {...H.etp} darkMode={darkMode} position="bottom" />
                {sal.tauxCharges !== undefined && sal.tauxCharges < 0.42 && (
                  <span className="flex items-center gap-1 text-emerald-500 font-bold">
                    (charges {Math.round(sal.tauxCharges * 100)}% — allègement Fillon)
                    <HelpIcon {...H.allégementFillon} darkMode={darkMode} position="bottom" />
                  </span>
                )}
                · Coût annuel {Math.round(sal.total).toLocaleString()} €
              </p>
            </div>
          </div>
          <button onClick={() => setFiDialog(null)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
        </div>

        <div className={`mb-5 p-3 rounded-2xl ${darkMode ? 'bg-gray-700/60' : 'bg-slate-50'}`}>
          <div className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Remplissage rapide</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => updateRFI(preset.fn())}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-amber-800/60 hover:text-amber-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800'}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2 mb-4">
          {moisKeysFI.map((mois, i) => {
            const val = rfi[mois] || 0;
            const montantMoisFC = Math.round(sal.total / 12 * val / 100);
            const montantMoisFI = Math.round(sal.total / 12 * (1 - val / 100));
            return (
              <div key={mois} className="text-center">
                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{moisLabelsFI[i]}</div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  title={`${moisLabelsFull[i]} : ${val}% FC → ${montantMoisFC.toLocaleString()} € FC / ${montantMoisFI.toLocaleString()} € FI`}
                  className={`w-full text-center text-sm font-black rounded-xl py-2.5 outline-none border-2 transition-all ${
                    val > 0
                      ? darkMode ? 'bg-amber-800/50 border-amber-500 text-amber-100' : 'bg-amber-100 border-amber-400 text-amber-800'
                      : darkMode ? 'bg-gray-700 border-gray-600 text-gray-400 focus:border-amber-500' : 'bg-white border-slate-200 text-slate-400 focus:border-amber-400'
                  }`}
                  value={val}
                  onChange={e => {
                    const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                    updateRFI({ ...rfi, [mois]: v });
                  }}
                />
                <div className={`mt-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-slate-200'}`}>
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${val}%` }} />
                </div>
                {val > 0 && (
                  <div className={`text-[10px] mt-1 font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                    {(montantMoisFC/1000).toFixed(1)}k€ FC
                  </div>
                )}
                {val > 0 && val < 100 && (
                  <div className={`text-[10px] font-bold ${darkMode ? 'text-teal-500' : 'text-teal-600'}`}>
                    {(montantMoisFI/1000).toFixed(1)}k€ FI
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-4">
          {moisKeysFI.map((mois, i) => (
            <div
              key={mois}
              className="flex-1 transition-all"
              style={{ background: `rgba(245, 158, 11, ${(rfi[mois]||0)/100})`, minWidth: '1px' }}
              title={`${moisLabelsFull[i]}: ${rfi[mois]||0}%`}
            />
          ))}
        </div>

        <div className={`grid grid-cols-3 gap-3 mb-4 p-4 rounded-2xl ${darkMode ? 'bg-gray-700/60' : 'bg-amber-50'}`}>
          <div className="text-center">
            <div className={`text-xs font-bold mb-1 flex items-center justify-center gap-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Moyenne FC / an
              <HelpIcon {...H.repartitionFI} darkMode={darkMode} position="top" />
            </div>
            <div className={`text-2xl font-black ${estPlein ? (darkMode ? 'text-amber-300' : 'text-amber-700') : pctMoyen < 20 ? 'text-orange-500' : darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{pctTotal}%</div>
          </div>
          <div className="text-center">
            <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Coût alloué FC / an</div>
            <div className={`text-2xl font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{montantFCAnnuel.toLocaleString()} €</div>
          </div>
          <div className="text-center">
            <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Part FI extraite / an</div>
            <div className={`text-2xl font-black ${montantFIAnnuel === 0 ? (darkMode ? 'text-gray-500' : 'text-slate-400') : darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{montantFIAnnuel.toLocaleString()} €</div>
          </div>
        </div>

        {estPlein && (
          <div className={`flex flex-col gap-3 mb-4 p-3 rounded-xl text-xs ${darkMode ? 'bg-amber-900/30 text-amber-300 border border-amber-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                <strong>100 % alloué en FC</strong> — la totalité du coût annuel ({Math.round(sal.total).toLocaleString()} €) reste dans le budget Formation Continue.
                Aucune part ne sera extraite vers la FI. Vérifiez que c'est bien voulu.
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={confirme100}
                onChange={e => setConfirme100(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Je confirme : cet agent est exclusivement affecté à la Formation Continue</span>
            </label>
          </div>
        )}
        {pctMoyen === 0 && (
          <div className={`flex items-start gap-2 mb-4 p-3 rounded-xl text-xs ${darkMode ? 'bg-orange-900/30 text-orange-300 border border-orange-700' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>0 % FC</strong> — la totalité du coût ({Math.round(sal.total).toLocaleString()} €) sera extraite vers la FI.
              Si cet agent fait aussi de la FC, ajustez les pourcentages.
            </span>
          </div>
        )}

        <button
          onClick={() => { if (peutValider) setFiDialog(null); }}
          disabled={!peutValider}
          className={`w-full py-3 font-black rounded-2xl transition-all ${
            peutValider
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
              : darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {estPlein && !confirme100 ? 'Cochez la case de confirmation pour valider' : 'Valider'}
        </button>
      </div>
    </div>
  );
};

export default ModalFI;
