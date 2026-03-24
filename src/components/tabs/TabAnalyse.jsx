import React from 'react';
import { Plus, Trash2, HelpCircle, X, Upload, BarChart3, Calculator, RotateCcw } from 'lucide-react';
import HelpIcon from '../ui/HelpIcon';
import { validerTaux, validerEntier, validerMontant, validerMontantSigne, calculerProvisions, calculerBFR, calculerFondRoulement } from '../../utils/calculations';

export default function TabAnalyse({
  darkMode,
  direction,
  poleSupport,
  services,
  globalParams,
  setGlobalParams,
  donneesN1,
  setDonneesN1,
  setShowImportN1,
  simCharges,
  setSimCharges,
  getBudgetDirection,
  getBudgetPoleSupport,
  getBudgetService,
  msETP,
  planningAbsences,
}) {
  const getProvisions = () => calculerProvisions(direction, services, globalParams, poleSupport);
  const getBFR = () => calculerBFR(direction, services, globalParams, poleSupport);
  const getFondRoulement = () => calculerFondRoulement(direction, services, globalParams);

  return (
    <>
      {/* PROVISIONS & BFR & FONDS DE ROULEMENT */}
      <div id="provisions-bfr-fr" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* PROVISIONS */}
        <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-orange-900' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'}`}>
          {(() => { const p = getProvisions(); return (<>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black ${darkMode ? 'text-orange-400' : 'text-orange-900'}`}>Provisions pour risque</h2>
                <HelpIcon darkMode={darkMode} position="right" wide content="Les provisions permettent d'anticiper des charges futures probables (congés non pris, litiges, grosses réparations…). Formule : Montant = Base × Taux%. La base peut être la masse salariale, les investissements ou le chiffre d'affaires. Obligatoire pour respecter le principe de prudence comptable." />
              </div>
              <button
                onClick={() => setGlobalParams({
                  ...globalParams,
                  provisions: [...(globalParams.provisions || []), {
                    id: `prov_${Date.now()}`,
                    nom: 'Nouvelle provision',
                    baseCalcul: 'salaires',
                    taux: 0
                  }]
                })}
                className="bg-orange-500 text-white p-2 rounded-lg no-print"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-orange-100 text-orange-700'}`}>
              <div className="font-bold mb-1">Formule :</div>
              <div className="font-mono">Montant = Base × Taux %</div>
              <div className="mt-1 opacity-75">Base : masse salariale, investissements ou chiffre d'affaires</div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(p.details || []).map((prov, idx) => (
                <div key={prov.id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} group relative`}>
                  <button
                    onClick={() => setGlobalParams({
                      ...globalParams,
                      provisions: globalParams.provisions.filter(pr => pr.id !== prov.id)
                    })}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      className={`flex-1 font-bold text-sm bg-transparent outline-none ${darkMode ? 'text-white' : 'text-slate-700'}`}
                      value={globalParams.provisions[idx]?.nom || prov.nom}
                      onChange={(e) => setGlobalParams({
                        ...globalParams,
                        provisions: globalParams.provisions.map(pr =>
                          pr.id === prov.id ? {...pr, nom: e.target.value} : pr
                        )
                      })}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      className={`rounded px-2 py-1 ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50'}`}
                      value={globalParams.provisions[idx]?.baseCalcul || prov.baseCalcul}
                      onChange={(e) => setGlobalParams({
                        ...globalParams,
                        provisions: globalParams.provisions.map(pr =>
                          pr.id === prov.id ? {...pr, baseCalcul: e.target.value} : pr
                        )
                      })}
                    >
                      <option value="salaires">% Salaires</option>
                      <option value="investissements">% Investissements</option>
                      <option value="chiffre_affaires">% Chiffre d'affaires</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      className={`w-16 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-orange-50'}`}
                      value={globalParams.provisions[idx]?.taux || 0}
                      onChange={(e) => setGlobalParams({
                        ...globalParams,
                        provisions: globalParams.provisions.map(pr =>
                          pr.id === prov.id ? {...pr, taux: validerTaux(e.target.value)} : pr
                        )
                      })}
                    />
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>%</span>
                  </div>
                  <div className={`text-right mt-1 font-black text-orange-600`}>
                    {Math.round(prov.montant).toLocaleString()} €
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white flex justify-between">
              <span className="font-bold">TOTAL</span>
              <span className="text-xl font-black">{Math.round(p.total).toLocaleString()} €</span>
            </div>
          </>); })()}
        </div>

        {/* FOND DE ROULEMENT */}
        <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-purple-900' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
          {(() => { const fr = getFondRoulement(); return (<>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-900'}`}>Fonds de Roulement</h2>
                <div className="relative group">
                  <HelpCircle size={16} className={`cursor-help ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <div className={`absolute left-0 top-6 w-72 p-3 rounded-xl shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-slate-700'}`}>
                    <p className="font-bold mb-2">Méthode de calcul :</p>
                    <p className="text-xs mb-1"><strong>FR = Capitaux permanents - Immobilisations nettes</strong></p>
                    <p className="text-xs text-gray-500">Le FR représente la part des capitaux permanents qui finance l'exploitation. Un FR positif signifie une marge de sécurité financière.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setGlobalParams({
                  ...globalParams,
                  fondRoulement: [...(globalParams.fondRoulement || []), {
                    id: `fr_${Date.now()}`,
                    nom: 'Nouveau poste',
                    montant: 0
                  }]
                })}
                className="bg-purple-500 text-white p-2 rounded-lg no-print"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-purple-100 text-purple-700'}`}>
              <div className="font-bold mb-1">Formule :</div>
              <div className="font-mono">FR = Σ Capitaux permanents - Immobilisations nettes</div>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {(fr.details || []).map((item, idx) => (
                <div key={item.id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} group relative`}>
                  <button
                    onClick={() => setGlobalParams({
                      ...globalParams,
                      fondRoulement: globalParams.fondRoulement.filter(f => f.id !== item.id)
                    })}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 no-print"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      className={`flex-1 font-bold text-sm bg-transparent outline-none ${darkMode ? 'text-white' : 'text-slate-700'}`}
                      value={globalParams.fondRoulement[idx]?.nom || item.nom}
                      onChange={(e) => setGlobalParams({
                        ...globalParams,
                        fondRoulement: globalParams.fondRoulement.map(f =>
                          f.id === item.id ? {...f, nom: e.target.value} : f
                        )
                      })}
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className={`w-24 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-purple-50'}`}
                        value={globalParams.fondRoulement[idx]?.montant || 0}
                        onChange={(e) => setGlobalParams({
                          ...globalParams,
                          fondRoulement: globalParams.fondRoulement.map(f =>
                            f.id === item.id ? {...f, montant: (item.id === 'reportNouveau' ? validerMontantSigne : validerMontant)(e.target.value)} : f
                          )
                        })}
                      />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-purple-200'} space-y-2 text-sm`}>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Capitaux permanents</span>
                <span className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>+{Math.round(fr.totalCapitauxPermanents).toLocaleString()} €</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Immobilisations nettes</span>
                <span className={`font-bold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>-{Math.round(fr.immobilisationsNettes).toLocaleString()} €</span>
              </div>
            </div>
            <div className={`mt-3 p-4 rounded-xl ${fr.fondRoulement >= 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white flex justify-between`}>
              <span className="font-bold">FR</span>
              <span className="text-xl font-black">{Math.round(fr.fondRoulement).toLocaleString()} €</span>
            </div>
          </>); })()}
        </div>

        {/* BFR */}
        <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-blue-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'}`}>
          {(() => { const b = getBFR(); return (<>
            <div className="flex items-center gap-2 mb-4">
              <h2 className={`text-xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Besoin en Fonds de Roulement</h2>
              <div className="relative group">
                <HelpCircle size={16} className={`cursor-help ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className={`absolute right-0 top-6 w-80 p-3 rounded-xl shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-slate-700'}`}>
                  <p className="font-bold mb-2">Méthode de calcul :</p>
                  <p className="text-xs mb-1"><strong>BFR = Stocks + Créances clients - Dettes fournisseurs</strong></p>
                  <p className="text-xs mb-1">Créances = (CA / 365) × Délai paiement clients</p>
                  <p className="text-xs mb-1">Dettes = (Achats / 365) × Délai paiement fournisseurs</p>
                  <p className="text-xs text-gray-500 mt-2">Le BFR représente le besoin de financement lié au cycle d'exploitation. Un BFR négatif est favorable.</p>
                </div>
              </div>
            </div>
            <div className={`text-xs mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-blue-100 text-blue-700'}`}>
              <div className="font-bold mb-1">Formule :</div>
              <div className="font-mono">BFR = Stocks + (CA/365 × {globalParams.delaiPaiementClients}j) - (Achats/365 × {globalParams.delaiPaiementFournisseurs}j)</div>
            </div>
            <div className="space-y-2">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Stocks</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className={`w-24 text-right rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                      value={globalParams.stocksValeur || 0}
                      onChange={(e) => setGlobalParams({...globalParams, stocksValeur: validerMontant(e.target.value)})}
                    />
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>€</span>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Créances clients</span>
                  <span className="font-black text-blue-600">+{Math.round(b.creancesClients).toLocaleString()} €</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Délai:</span>
                  <input
                    type="number"
                    className={`w-16 text-center rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                    value={globalParams.delaiPaiementClients}
                    onChange={(e) => setGlobalParams({...globalParams, delaiPaiementClients: validerEntier(e.target.value, 0, 365)})}
                  />
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>jours</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>Dettes fournisseurs</span>
                  <span className="font-black text-teal-600">-{Math.round(b.dettesFournisseurs).toLocaleString()} €</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Délai:</span>
                  <input
                    type="number"
                    className={`w-16 text-center rounded px-2 py-1 font-bold ${darkMode ? 'bg-gray-600 text-white' : 'bg-blue-50'}`}
                    value={globalParams.delaiPaiementFournisseurs}
                    onChange={(e) => setGlobalParams({...globalParams, delaiPaiementFournisseurs: validerEntier(e.target.value, 0, 365)})}
                  />
                  <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>jours</span>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${b.bfr > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500'} text-white flex justify-between`}>
                <div><span className="font-bold block">BFR</span><span className="text-xs">{Math.round(b.bfrEnJours)} jours</span></div>
                <span className="text-xl font-black">{Math.round(b.bfr).toLocaleString()} €</span>
              </div>
            </div>
          </>); })()}
        </div>
      </div>

      {/* ═══ SYNTHÈSE ANALYTIQUE ═══ */}
      {(() => {
        const bdDir = getBudgetDirection();
        const bdPS = getBudgetPoleSupport();
        const rows = [
          {
            nom: '📋 Direction / Siège',
            personnel: bdDir.salaires,
            exploitation: bdDir.chargesSiege,
            recettes: 0,
            isDirection: true,
          },
          {
            nom: '🔧 Pôle Ressource',
            personnel: bdPS.salaires,
            exploitation: bdPS.exploitation,
            recettes: bdPS.recettes,
            isDirection: true,
          },
          ...services.map(s => {
            const bd = getBudgetService(s);
            return {
              nom: s.nom,
              serviceId: s.id,
              personnel: bd.salaires,
              exploitation: bd.exploitation,
              recettes: bd.recettes,
              isDirection: false,
            };
          }),
        ];
        const totPerso  = rows.reduce((s, r) => s + r.personnel, 0);
        const totExpl   = rows.reduce((s, r) => s + r.exploitation, 0);
        const totRec    = rows.reduce((s, r) => s + r.recettes, 0);
        const totCharges = totPerso + totExpl;
        const totResult = totRec - totCharges;

        const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
        const col = `px-3 py-2 text-right text-sm font-bold`;
        const colH = `px-3 py-2 text-right text-xs font-black uppercase`;

        const getN1Row = (r) => {
          if (!donneesN1) return null;
          const nomLow = r.nom.toLowerCase();
          if (nomLow.includes('direction') || nomLow.includes('siège') || nomLow.includes('siege')) return donneesN1.direction;
          if (nomLow.includes('support') || nomLow.includes('pôle')) return donneesN1.poleSupport;
          return (donneesN1.services || []).find(s => s.nom && r.nom.toLowerCase().includes(s.nom.toLowerCase().slice(0, 5)));
        };
        const evolPct = (current, n1) => {
          if (n1 === null || n1 === undefined || Math.abs(n1) < 1) return null;
          return ((current - n1) / Math.abs(n1) * 100).toFixed(1);
        };

        return (
          <div id="synthese-analytique" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-violet-900' : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <BarChart3 className={darkMode ? 'text-violet-400' : 'text-violet-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Synthèse Analytique</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>Tableau croisé par service · montants annuels{donneesN1 ? ` · comparatif N-1 (${donneesN1.annee})` : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 no-print">
                {donneesN1 && (
                  <button onClick={() => setDonneesN1(null)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <X size={13} /> Effacer N-1
                  </button>
                )}
                <button onClick={() => setShowImportN1(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-violet-900/40 text-violet-300 hover:bg-violet-900/60 border border-violet-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                  <Upload size={13} /> {donneesN1 ? 'Recharger N-1' : 'Importer N-1'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${darkMode ? 'bg-gray-700' : 'bg-white/70'} rounded-xl`}>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase text-slate-500">Service</th>
                    <th className={`${colH} ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>Personnel</th>
                    <th className={`${colH} ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Exploitation</th>
                    <th className={`${colH} ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total charges</th>
                    <th className={`${colH} ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Recettes</th>
                    <th className={`${colH} ${darkMode ? 'text-violet-400' : 'text-violet-700'}`}>Résultat</th>
                    {donneesN1 && <th className={`${colH} ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>N-1 charges</th>}
                    {donneesN1 && <th className={`${colH} ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Évol. %</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const totalChargesRow = r.personnel + r.exploitation;
                    const allocPS = (!r.isDirection && r.serviceId != null)
                      ? Math.round(bdPS.total * (poleSupport.repartition?.[String(r.serviceId)] || 0) / 100)
                      : 0;
                    const resultat = r.recettes - totalChargesRow;
                    const isPos = resultat >= 0;
                    const n1Row = getN1Row(r);
                    const n1Charges = n1Row ? ((n1Row.salaires || 0) + (n1Row.exploitation || 0)) : null;
                    const ePct = n1Charges !== null ? evolPct(totalChargesRow, n1Charges) : null;
                    return (
                      <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700' : 'border-violet-100'} ${r.isDirection ? (darkMode ? 'bg-gray-700/30' : 'bg-white/50') : ''}`}>
                        <td className={`px-3 py-2 font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {r.nom}
                          {allocPS > 0 && (
                            <div className={`text-xs font-normal mt-0.5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                              + Pôle Ressource : {allocPS.toLocaleString('fr-FR')} €
                            </div>
                          )}
                        </td>
                        <td className={`${col} ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt(r.personnel)} €</td>
                        <td className={`${col} ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{fmt(r.exploitation)} €</td>
                        <td className={`${col} ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{fmt(totalChargesRow)} €</td>
                        <td className={`${col} ${r.recettes > 0 ? (darkMode ? 'text-green-300' : 'text-green-700') : (darkMode ? 'text-gray-500' : 'text-slate-400')}`}>
                          {r.recettes > 0 ? fmt(r.recettes) + ' €' : '—'}
                        </td>
                        <td className={`${col} font-black ${isPos ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-600')}`}>
                          {r.recettes > 0 ? (isPos ? '+' : '') + fmt(resultat) + ' €' : '—'}
                        </td>
                        {donneesN1 && (
                          <td className={`${col} ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                            {n1Charges !== null ? fmt(n1Charges) + ' €' : '—'}
                          </td>
                        )}
                        {donneesN1 && (
                          <td className="px-3 py-2 text-right">
                            {ePct !== null ? (
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${parseFloat(ePct) > 0 ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : parseFloat(ePct) < 0 ? (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500')}`}>
                                {parseFloat(ePct) > 0 ? '+' : ''}{ePct}%
                              </span>
                            ) : '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 font-black ${darkMode ? 'border-violet-700 bg-violet-900/20' : 'border-violet-300 bg-violet-100/80'}`}>
                    <td className={`px-3 py-3 font-black text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>TOTAL</td>
                    <td className={`${col} ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>{fmt(totPerso)} €</td>
                    <td className={`${col} ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{fmt(totExpl)} €</td>
                    <td className={`${col} ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{fmt(totCharges)} €</td>
                    <td className={`${col} ${darkMode ? 'text-green-200' : 'text-green-800'}`}>{fmt(totRec)} €</td>
                    <td className={`${col} text-base ${totResult >= 0 ? (darkMode ? 'text-emerald-200' : 'text-emerald-800') : (darkMode ? 'text-red-200' : 'text-red-800')}`}>
                      {totResult >= 0 ? '+' : ''}{fmt(totResult)} €
                    </td>
                    {donneesN1 && (() => {
                      const n1Tot = ((donneesN1.direction?.salaires || 0) + (donneesN1.direction?.exploitation || 0))
                        + ((donneesN1.poleSupport?.salaires || 0) + (donneesN1.poleSupport?.exploitation || 0))
                        + (donneesN1.services || []).reduce((s, sv) => s + (sv.salaires || 0) + (sv.exploitation || 0), 0);
                      const eTot = evolPct(totCharges, n1Tot);
                      return (<>
                        <td className={`${col} ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>{fmt(n1Tot)} €</td>
                        <td className="px-3 py-2 text-right">
                          {eTot !== null ? (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${parseFloat(eTot) > 0 ? (darkMode ? 'bg-red-900/60 text-red-200' : 'bg-red-200 text-red-800') : (darkMode ? 'bg-emerald-900/60 text-emerald-200' : 'bg-emerald-200 text-emerald-800')}`}>
                              {parseFloat(eTot) > 0 ? '+' : ''}{eTot}%
                            </span>
                          ) : '—'}
                        </td>
                      </>);
                    })()}
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Mini KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Masse salariale', val: fmt(totPerso) + ' €', pct: totCharges > 0 ? Math.round(totPerso/totCharges*100) : 0, color: darkMode ? 'text-teal-300' : 'text-teal-700', bg: darkMode ? 'bg-teal-900/30' : 'bg-teal-50' },
                { label: 'Exploitation', val: fmt(totExpl) + ' €', pct: totCharges > 0 ? Math.round(totExpl/totCharges*100) : 0, color: darkMode ? 'text-blue-300' : 'text-blue-700', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
                { label: 'Recettes totales', val: fmt(totRec) + ' €', pct: totCharges > 0 ? Math.round(totRec/totCharges*100) : 0, color: darkMode ? 'text-green-300' : 'text-green-700', bg: darkMode ? 'bg-green-900/30' : 'bg-green-50', label2: '% couverture' },
                { label: 'Résultat net', val: (totResult >= 0 ? '+' : '') + fmt(totResult) + ' €', pct: null, color: totResult >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700'), bg: totResult >= 0 ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50') },
              ].map((k, i) => (
                <div key={i} className={`p-3 rounded-2xl ${k.bg}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{k.label}</div>
                  <div className={`text-lg font-black ${k.color}`}>{k.val}</div>
                  {k.pct !== null && (
                    <div className={`text-xs font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{k.label2 || '% des charges'} : {k.pct}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* SIMULATION CHARGES INTERACTIF */}
      {(() => {
        const bdDir = getBudgetDirection();
        const totalPers0 = [bdDir.salaires, ...services.map(s => getBudgetService(s).salaires)].reduce((a, b) => a + b, 0);
        const totalExpl0 = [bdDir.chargesSiege, ...services.map(s => getBudgetService(s).exploitation)].reduce((a, b) => a + b, 0);
        const totalRec0  = services.reduce((s, svc) => s + getBudgetService(svc).recettes, 0);

        const factS = 1 + (simCharges.augSalaires || 0) / 100;
        const factC = 1 + (simCharges.augCharges || 0) / 100;
        const factE = 1 + (simCharges.augExploitation || 0) / 100;

        const totalPers1 = totalPers0 * factS * factC;
        const totalExpl1 = totalExpl0 * factE;
        const total0 = totalPers0 + totalExpl0;
        const total1 = totalPers1 + totalExpl1;
        const delta  = total1 - total0;
        const result1 = totalRec0 - total1;

        const fmt = n => Math.round(n).toLocaleString('fr-FR');
        const SLIDER_COLOR_CLS = {
          teal:  [darkMode ? 'text-teal-300'  : 'text-teal-700'],
          blue:  [darkMode ? 'text-blue-300'  : 'text-blue-700'],
          amber: [darkMode ? 'text-amber-300' : 'text-amber-700'],
        };
        const Slider = ({ label, field, min, max, color }) => (
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{label}</span>
              <span className={`text-sm font-black ${simCharges[field] > 0 ? (SLIDER_COLOR_CLS[color]?.[0] || (darkMode ? 'text-teal-300' : 'text-teal-700')) : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>
                {simCharges[field] > 0 ? '+' : ''}{simCharges[field]}%
              </span>
            </div>
            <input type="range" min={min} max={max} step="0.5" value={simCharges[field]}
              onChange={e => setSimCharges({...simCharges, [field]: parseFloat(e.target.value)})}
              className="w-full accent-teal-500"
            />
            <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}><span>{min}%</span><span>{max}%</span></div>
          </div>
        );

        return (
          <div id="simulation-charges" className={`rounded-3xl shadow-lg border-2 p-6 mb-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-sky-900' : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <Calculator className={darkMode ? 'text-sky-400' : 'text-sky-600'} size={28} />
                <div>
                  <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Simulation de charges</h2>
                  <span className={`text-xs font-bold ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>Testez l'impact d'une variation des charges sur le résultat</span>
                </div>
              </div>
              <button onClick={() => setSimCharges({ augSalaires: 0, augCharges: 0, augExploitation: 0 })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <RotateCcw size={13} /> Réinitialiser
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <Slider label="Augmentation salariale (masse brute)" field="augSalaires" min={-5} max={15} color="teal" />
                <Slider label="Variation taux de charges patronales" field="augCharges" min={-5} max={10} color="blue" />
                <Slider label="Variation charges d'exploitation" field="augExploitation" min={-10} max={20} color="amber" />
              </div>

              <div className="space-y-3">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-xs font-bold uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Impact sur le budget</div>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Personnel (base)', val: fmt(totalPers0) + ' €', sim: fmt(totalPers1) + ' €', delta: totalPers1 - totalPers0 },
                      { label: 'Exploitation (base)', val: fmt(totalExpl0) + ' €', sim: fmt(totalExpl1) + ' €', delta: totalExpl1 - totalExpl0 },
                      { label: 'TOTAL charges', val: fmt(total0) + ' €', sim: fmt(total1) + ' €', delta: delta, bold: true },
                    ].map((r, i) => (
                      <div key={i} className={`flex justify-between items-center ${r.bold ? `pt-2 border-t font-black ${darkMode ? 'border-gray-600' : 'border-slate-200'}` : ''}`}>
                        <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs line-through ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{r.val}</span>
                          <span className={darkMode ? 'text-white' : 'text-slate-800'}>{r.sim}</span>
                          {r.delta !== 0 && (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${r.delta > 0 ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>
                              {r.delta > 0 ? '+' : ''}{fmt(r.delta)} €
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`p-4 rounded-2xl font-black text-center ${result1 >= 0 ? (darkMode ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200') : (darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200')}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Résultat simulé (Recettes {fmt(totalRec0)} € − Charges simulées)</div>
                  <div className={`text-2xl ${result1 >= 0 ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700')}`}>
                    {result1 >= 0 ? '+' : ''}{fmt(result1)} €
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    vs résultat actuel : {totalRec0 - total0 >= 0 ? '+' : ''}{fmt(totalRec0 - total0)} €
                    {' '}({delta >= 0 ? '+' : ''}{fmt(delta)} € de variation)
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
