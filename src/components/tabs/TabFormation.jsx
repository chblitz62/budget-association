import React from 'react';
import { GraduationCap, Trash2, Plus } from 'lucide-react';
import HelpIcon from '../ui/HelpIcon';
import ReportingFC from '../ReportingFC';
import PilotageFinancier from '../PilotageFinancier';
import ChargeFormateurs from '../ChargeFormateurs';
import EnveloppeFiliere from './EnveloppeFiliere';
import { exportReportingFC } from '../../utils/excelExport';
import { exportReportingFCPdf } from '../../utils/pdfExport';
import { FILIERES_DEFAULT } from '../../utils/constants';

const STATUT_LABELS = {
  planifie:  { label: '◷ Planifié',  cls: 'bg-amber-100 text-amber-700'   },
  en_cours:  { label: '⟳ En cours',  cls: 'bg-blue-100 text-blue-700'     },
  realise:   { label: '✓ Réalisé',   cls: 'bg-emerald-100 text-emerald-700'},
  annule:    { label: '✕ Annulé',    cls: 'bg-gray-100 text-gray-500'      },
};
const STATUT_LABELS_DM = {
  planifie:  'bg-amber-900/50 text-amber-300',
  en_cours:  'bg-blue-900/50 text-blue-300',
  realise:   'bg-emerald-900/50 text-emerald-300',
  annule:    'bg-gray-600 text-gray-400',
};

export default function TabFormation({
  darkMode,
  services,
  enveloppeFormation,
  setEnveloppeFormation,
  reportingFC,
  setReportingFC,
  pilotageSites,
  setPilotageSites,
  pilotageResetKey,
  direction,
  poleSupport,
  globalParams,
  setGlobalParams,
  checkPassword,
  calculerBudgetService,
  calculerBudgetDirection,
  calculerBudgetPoleSupport,
}) {
  const dm = darkMode;
  const actions = enveloppeFormation.actions || [];
  const filieres = enveloppeFormation.filieres?.length > 0
    ? enveloppeFormation.filieres
    : FILIERES_DEFAULT;

  const totalConsomme = actions.reduce((s, a) => s + (parseFloat(a.cout) || 0), 0);

  const addAction = () =>
    setEnveloppeFormation({
      ...enveloppeFormation,
      actions: [...actions, { id: Date.now(), nom: 'Nouvelle formation', beneficiaire: '', date: '', cout: 0, statut: 'planifie', filiereId: filieres[0]?.id ?? '' }],
    });

  const updateAction = (id, field, val) =>
    setEnveloppeFormation({
      ...enveloppeFormation,
      actions: actions.map(a => a.id === id ? { ...a, [field]: val } : a),
    });

  const removeAction = (id) =>
    setEnveloppeFormation({ ...enveloppeFormation, actions: actions.filter(a => a.id !== id) });

  // Consommation par filière
  const consoParFiliere = filieres.reduce((acc, f) => {
    acc[f.id] = actions
      .filter(a => a.filiereId === f.id)
      .reduce((s, a) => s + (parseFloat(a.cout) || 0), 0);
    return acc;
  }, {});

  return (
    <>
      {/* CHARGE DE TRAVAIL DES FORMATEURS */}
      <ChargeFormateurs
        darkMode={dm}
        services={services}
        direction={direction}
        poleSupport={poleSupport}
      />

      {/* ENVELOPPES DE FORMATION PAR FILIÈRE */}
      <EnveloppeFiliere
        darkMode={dm}
        services={services}
        direction={direction}
        poleSupport={poleSupport}
        calculerBudgetService={calculerBudgetService}
        calculerBudgetDirection={calculerBudgetDirection}
        calculerBudgetPoleSupport={calculerBudgetPoleSupport}
        enveloppeFormation={enveloppeFormation}
        setEnveloppeFormation={setEnveloppeFormation}
      />

      {/* PLAN D'ACTIONS DE FORMATION DU PERSONNEL */}
      <div id="enveloppe-formation" className={`rounded-3xl shadow-lg border-2 p-8 mb-8 print-avoid-break ${
        dm ? 'bg-gray-800 border-emerald-900' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
      }`}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-emerald-600" size={32} />
            <div>
              <h2 className={`text-2xl font-black flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-800'}`}>
                Plan d'actions de formation
                <HelpIcon type="info" position="bottom" wide content="Registre des actions de formation continue du personnel. Chaque action est rattachée à une filière pour le suivi budgétaire. Le total engagé est comparé à l'enveloppe calculée dans le tableau Filières ci-dessus." />
              </h2>
              <span className={`text-sm font-bold ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Formation continue du personnel — rattachée aux filières
              </span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-lg ${dm ? 'bg-zinc-700 text-white' : 'bg-white text-slate-800'}`}>
            {Math.round(totalConsomme).toLocaleString('fr-FR')} € engagés
            <HelpIcon type="warning" position="left" content="Total des coûts de toutes les actions de formation saisies, quel que soit leur statut (y compris annulées). Pour ne compter que les actions actives, consultez la section couverture dans le tableau Filières." />
          </div>
        </div>

        {/* Récap consommation par filière */}
        {filieres.length > 0 && totalConsomme > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filieres.map(f => {
              const conso = consoParFiliere[f.id] || 0;
              if (conso === 0) return null;
              return (
                <span key={f.id} className={`px-3 py-1 rounded-full text-xs font-black ${
                  dm ? 'bg-zinc-700 text-zinc-200' : 'bg-white border border-emerald-200 text-slate-700'
                }`}>
                  {f.label} : {Math.round(conso).toLocaleString('fr-FR')} €
                </span>
              );
            })}
          </div>
        )}

        {/* Liste des actions */}
        <div className="space-y-3 mb-4">
          {actions.map((action) => {
            const statut = STATUT_LABELS[action.statut] || STATUT_LABELS.planifie;
            const statutDm = STATUT_LABELS_DM[action.statut] || STATUT_LABELS_DM.planifie;
            return (
              <div key={action.id} className={`p-4 rounded-2xl border group relative ${
                dm ? 'bg-gray-700 border-gray-600' : 'bg-white border-emerald-100'
              }`}>
                <button
                  onClick={() => removeAction(action.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex flex-wrap gap-3 items-start">
                  {/* Intitulé */}
                  <div className="flex-1 min-w-[150px]">
                    <label className={`text-xs font-bold block mb-1 ${dm ? 'text-gray-400' : 'text-slate-500'}`}>Intitulé</label>
                    <input
                      className={`w-full font-bold text-sm rounded-lg px-3 py-1.5 outline-none ${dm ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`}
                      value={action.nom}
                      onChange={e => updateAction(action.id, 'nom', e.target.value)}
                    />
                  </div>
                  {/* Bénéficiaire */}
                  <div className="w-32">
                    <label className={`text-xs font-bold block mb-1 ${dm ? 'text-gray-400' : 'text-slate-500'}`}>Bénéficiaire</label>
                    <input
                      className={`w-full text-sm rounded-lg px-3 py-1.5 outline-none ${dm ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`}
                      value={action.beneficiaire || ''}
                      onChange={e => updateAction(action.id, 'beneficiaire', e.target.value)}
                    />
                  </div>
                  {/* Filière */}
                  <div className="w-32">
                    <label className={`text-xs font-bold flex items-center gap-1 mb-1 ${dm ? 'text-gray-400' : 'text-slate-500'}`}>
                      Filière
                      <HelpIcon type="info" position="bottom" content="Filière pédagogique à laquelle est rattachée cette action. Permet le suivi budgétaire dans le tableau Enveloppes par filière." />
                    </label>
                    <select
                      className={`w-full text-xs font-bold rounded-lg px-2 py-1.5 border outline-none ${dm ? 'bg-gray-600 border-gray-500 text-white' : 'bg-emerald-50 border-emerald-200'}`}
                      value={action.filiereId || ''}
                      onChange={e => updateAction(action.id, 'filiereId', e.target.value)}
                    >
                      <option value="">— Aucune —</option>
                      {filieres.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                  {/* Date */}
                  <div className="w-28">
                    <label className={`text-xs font-bold block mb-1 ${dm ? 'text-gray-400' : 'text-slate-500'}`}>Date</label>
                    <input
                      type="date"
                      className={`w-full text-sm rounded-lg px-3 py-1.5 outline-none ${dm ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`}
                      value={action.date || ''}
                      onChange={e => updateAction(action.id, 'date', e.target.value)}
                    />
                  </div>
                  {/* Coût */}
                  <div className="w-28">
                    <label className={`text-xs font-bold flex items-center gap-1 mb-1 ${dm ? 'text-gray-400' : 'text-slate-500'}`}>
                      Coût (€)
                      <HelpIcon type="info" position="bottom" content="Coût total de l'action : inscription, déplacement, hébergement, matériaux. Pris en compte dans le suivi de l'enveloppe filière." />
                    </label>
                    <input
                      type="number" min="0"
                      className={`w-full font-black text-sm rounded-lg px-3 py-1.5 outline-none ${dm ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`}
                      value={action.cout || 0}
                      onChange={e => updateAction(action.id, 'cout', Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  {/* Statut */}
                  <div className="w-28">
                    <label className={`text-xs font-bold flex items-center gap-1 mb-1 ${dm ? 'text-gray-400' : 'text-slate-500'}`}>
                      Statut
                      <HelpIcon type="info" position="bottom" content="Planifié : à venir. En cours : formation démarrée. Réalisé : terminée et facturée. Annulé : non consommé (exclu du calcul de couverture filière)." />
                    </label>
                    <select
                      className={`w-full text-xs rounded-lg px-2 py-1.5 font-bold ${dm ? 'bg-gray-600 text-white' : 'bg-emerald-50'}`}
                      value={action.statut || 'planifie'}
                      onChange={e => updateAction(action.id, 'statut', e.target.value)}
                    >
                      {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  {/* Badge statut */}
                  <div className={`self-end px-3 py-1.5 rounded-lg text-xs font-black ${dm ? statutDm : statut.cls}`}>
                    {statut.label}
                  </div>
                </div>
              </div>
            );
          })}
          {actions.length === 0 && (
            <p className={`text-center py-6 text-sm ${dm ? 'text-gray-500' : 'text-slate-400'}`}>
              Aucune action de formation — cliquez + pour en ajouter
            </p>
          )}
        </div>

        <button
          onClick={addAction}
          className={`w-full py-3 border-2 border-dashed rounded-2xl text-sm font-bold flex items-center justify-center gap-2 no-print ${
            dm ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20'
               : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          <Plus size={16} /> Ajouter une action de formation
        </button>
      </div>

      {/* REPORTING FC */}
      <ReportingFC
        reportingFC={reportingFC}
        setReportingFC={setReportingFC}
        services={services}
        darkMode={dm}
        globalParams={globalParams}
        setGlobalParams={setGlobalParams}
        onExportExcel={() => exportReportingFC(reportingFC, services)}
        onExportPdf={() => exportReportingFCPdf(reportingFC, services)}
      />

      {/* PILOTAGE FINANCIER */}
      <PilotageFinancier
        key={pilotageResetKey}
        darkMode={dm}
        checkPassword={checkPassword}
        startEmpty={pilotageResetKey > 0}
        budgetPersonnel={[
          ...(direction?.personnel || []).map(p => ({ ...p, source: 'Direction' })),
          ...services.flatMap(s => (s.personnel || []).map(p => ({ ...p, source: s.nom }))),
        ]}
        services={services}
        externalSites={pilotageSites}
        setExternalSites={setPilotageSites}
      />
    </>
  );
}
