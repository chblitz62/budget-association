import React, { useState, useEffect } from 'react';
import { Users, Calculator, Info, RotateCcw, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TARIFS_VACATAIRES as tarifsVacataires_DEFAULT, CHARGES_VACATAIRE, SEUIL_HEURES_VACATAIRE } from '../utils/constants';

const STORAGE_KEY = 'assoc_calculateur_vacataires';
const TAUX_CP = CHARGES_VACATAIRE / 100; // 0.15

const fmt2 = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => Math.round(n).toLocaleString('fr-FR');

export default function CalculateurVacataires({ darkMode, vacatairesBudget = [], tarifsVacataires = tarifsVacataires_DEFAULT }) {
  const initHeures = () => Object.fromEntries(tarifsVacataires.map(t => [t.id, { salarie: '', prestataire: '' }]));

  const [heures, setHeures] = useState(() => {
    try { return { ...initHeures(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return initHeures(); }
  });
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(heures));
  }, [heures]);

  const set = (id, type, val) =>
    setHeures(prev => ({ ...prev, [id]: { ...prev[id], [type]: val === '' ? '' : Math.max(0, Number(val)) } }));

  const reset = () => { setHeures(initHeures()); localStorage.removeItem(STORAGE_KEY); };

  // Calculs par ligne
  const lignes = tarifsVacataires.map(t => {
    const hs = parseFloat(heures[t.id]?.salarie)     || 0;
    const hp = parseFloat(heures[t.id]?.prestataire) || 0;
    const hRémS = hs * t.multiplicateur;
    const hRémP = hp * t.multiplicateur;
    const coutBrutS  = t.salarie      !== null ? hRémS * t.salarie      : null;
    const coutBrutP  = t.prestataire  !== null ? hRémP * t.prestataire  : null;
    const coutEmpS   = coutBrutS  !== null ? coutBrutS  * (1 + TAUX_CP) : null;
    return { ...t, hs, hp, hRémS, hRémP, coutBrutS, coutBrutP, coutEmpS };
  });

  const totaux = lignes.reduce((acc, l) => {
    acc.hSalarie      += l.hs;
    acc.hPrestataire  += l.hp;
    acc.hRémSalarie   += l.hRémS;
    acc.hRémPrestataire += l.hRémP;
    if (l.coutBrutS !== null)  acc.brutSalarie    += l.coutBrutS;
    if (l.coutBrutP !== null)  acc.brutPrestataire += l.coutBrutP;
    if (l.coutEmpS  !== null)  acc.empSalarie     += l.coutEmpS;
    return acc;
  }, { hSalarie: 0, hPrestataire: 0, hRémSalarie: 0, hRémPrestataire: 0, brutSalarie: 0, brutPrestataire: 0, empSalarie: 0 });

  const alerteHeures = totaux.hSalarie > SEUIL_HEURES_VACATAIRE;
  const hasData = totaux.hSalarie > 0 || totaux.hPrestataire > 0;

  // Styles
  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200';
  const th   = darkMode ? 'bg-gray-700 text-gray-300'   : 'bg-slate-50 text-slate-600';
  const tr   = darkMode ? 'border-gray-700 text-gray-200' : 'border-slate-100 text-slate-700';
  const inp  = darkMode
    ? 'bg-gray-700 text-white border-gray-600 focus:border-teal-400'
    : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-teal-400';

  // ── Export Excel ─────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const header = ['Type d\'intervention', 'H. réelles salarié', 'H. rémunérées salarié', 'Tarif brut/h', 'Coût brut salarié (€)', 'Charges +15% (€)', 'Coût employeur salarié (€)', 'H. réelles prestataire', 'H. rémunérées prestataire', 'Tarif prestataire/h', 'Coût prestataire (€)'];
    const rows = lignes.filter(l => l.hs > 0 || l.hp > 0).map(l => [
      l.label,
      l.hs || 0,
      l.hRémS || 0,
      l.salarie ?? 'Selon AO',
      l.coutBrutS !== null ? Math.round(l.coutBrutS) : '',
      l.coutEmpS  !== null ? Math.round(l.coutEmpS - (l.coutBrutS || 0)) : '',
      l.coutEmpS  !== null ? Math.round(l.coutEmpS) : '',
      l.hp || 0,
      l.hRémP || 0,
      l.prestataire ?? 'Selon AO',
      l.coutBrutP !== null ? Math.round(l.coutBrutP) : '',
    ]);
    rows.push([
      'TOTAL',
      totaux.hSalarie, totaux.hRémSalarie, '',
      Math.round(totaux.brutSalarie),
      Math.round(totaux.empSalarie - totaux.brutSalarie),
      Math.round(totaux.empSalarie),
      totaux.hPrestataire, totaux.hRémPrestataire, '',
      Math.round(totaux.brutPrestataire),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Vacataires');
    XLSX.writeFile(wb, `calculateur_vacataires_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Export PDF ───────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 166);
    doc.text('Estimation vacataires & prestataires — AFERTES', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 25);

    const rows = lignes.filter(l => l.hs > 0 || l.hp > 0).map(l => [
      l.label + (l.note ? ` (${l.note})` : ''),
      l.hs || 0,
      l.hRémS || 0,
      l.coutBrutS !== null ? `${fmt0(l.coutBrutS)} €` : '—',
      l.coutEmpS  !== null ? `${fmt0(l.coutEmpS)} €`  : '—',
      l.hp || 0,
      l.hRémP || 0,
      l.coutBrutP !== null ? `${fmt0(l.coutBrutP)} €` : '—',
    ]);
    rows.push([
      'TOTAL',
      totaux.hSalarie, totaux.hRémSalarie,
      `${fmt0(totaux.brutSalarie)} €`,
      `${fmt0(totaux.empSalarie)} €`,
      totaux.hPrestataire, totaux.hRémPrestataire,
      `${fmt0(totaux.brutPrestataire)} €`,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Type', 'H. réelles sal.', 'H. rém. sal.', 'Coût brut sal.', 'Coût emp. sal.', 'H. réelles prest.', 'H. rém. prest.', 'Coût prestataire']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 70 } },
    });

    if (alerteHeures) {
      const y = doc.lastAutoTable.finalY + 6;
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠ Heures salarié (${totaux.hSalarie}h) dépassent le seuil de ${SEUIL_HEURES_VACATAIRE}h — risque de requalification en CDI.`, 14, y);
    }

    doc.save(`calculateur_vacataires_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-8">

      {/* ── GRILLE TARIFAIRE ── */}
      <div id="grille-vacataires" className={`rounded-3xl shadow-lg border-2 p-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-violet-900' : 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-300'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="text-violet-600" size={32} />
            <div>
              <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Grille tarifaire vacataires &amp; prestataires
              </h2>
              <span className={`text-sm font-bold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                Année 2025-2026 — AFERTES
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200'}`}
          >
            <Info size={16} /> Modalités
          </button>
        </div>

        {showInfo && (
          <div className={`mb-6 p-5 rounded-2xl text-sm space-y-2 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-slate-700 border border-violet-100'}`}>
            <p className="font-bold text-violet-600">Formateurs occasionnels</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Doit obligatoirement avoir un employeur principal.</li>
              <li>Aucun frais de déplacement ni remboursement.</li>
            </ul>
            <p className="font-bold text-violet-600 mt-2">Prestataires de service</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Convention obligatoire pour chaque prestataire (+ ½ journée d'intervention).</li>
              <li>Le coût est à négocier — tarifs ci-dessous servent de base obligatoire.</li>
              <li>Conventions FP transmises par l'Assistante de Direction (copie Directrice).</li>
              <li>Pièces administratives + tarifs négociés à transmettre à la Direction.</li>
              <li>Veiller à l'absence d'interventions sur 2 filières.</li>
              <li>Aucun frais de déplacement ni remboursement.</li>
            </ul>
            <p className={`text-xs font-black mt-2 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              Toute demande exceptionnelle doit être validée auprès de la Directrice de l'AFERTES.
            </p>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-violet-100">
          <table className="w-full text-sm">
            <thead>
              <tr className={th}>
                <th className="text-left px-5 py-3 font-bold rounded-tl-2xl">Type d'intervention</th>
                <th className="text-right px-4 py-3 font-bold">Salarié (brut/h)</th>
                <th className="text-right px-4 py-3 font-bold rounded-tr-2xl">Prestataire (base négoc.)</th>
              </tr>
            </thead>
            <tbody>
              {tarifsVacataires.map(t => (
                <tr key={t.id} className={`border-t transition-colors ${tr} hover:opacity-80`}>
                  <td className="px-5 py-3 font-medium">
                    {t.label}
                    {t.note && (
                      <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                        {t.note}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {t.salarie !== null
                      ? <span className={`font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{t.salarie.toFixed(2)} €</span>
                      : <span className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>selon F.I. / AO</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {t.prestataire !== null
                      ? <span className={`font-bold ${darkMode ? 'text-violet-400' : 'text-violet-700'}`}>{t.prestataire.toFixed(2)} €</span>
                      : <span className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>selon F.I. / AO</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
          Les tarifs ×2/h et ×3/h signifient que le temps rémunéré est un multiple du temps réel (ex : 1 h de correction dossiers = 2 h rémunérées).
        </p>
      </div>

      {/* ── CALCULATEUR ── */}
      <div id="calculateur-vacataires" className={`rounded-3xl shadow-lg border-2 p-8 print-avoid-break ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="text-teal-600" size={32} />
            <div>
              <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Calculateur de coût
              </h2>
              <span className={`text-sm font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                Heures réelles · Coût brut · Coût employeur (+{CHARGES_VACATAIRE}% charges)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow transition-all">
              <Download size={15} /> PDF
            </button>
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 text-white shadow transition-all">
              <FileSpreadsheet size={15} /> Excel
            </button>
            <button onClick={reset}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200'}`}>
              <RotateCcw size={15} /> Remettre à zéro
            </button>
          </div>
        </div>

        {/* Alerte seuil 450h */}
        {alerteHeures && (
          <div className={`flex items-start gap-3 mb-5 p-4 rounded-2xl ${darkMode ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Seuil légal dépassé — {totaux.hSalarie} heures saisies pour les salariés</p>
              <p className="text-xs mt-0.5">Au-delà de {SEUIL_HEURES_VACATAIRE} h/an, le statut de vacataire peut être requalifié en CDI. Vérifiez la situation avec le service RH.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-teal-100">
          <table className="w-full text-sm">
            <thead>
              <tr className={th}>
                <th className="text-left px-4 py-3 font-bold rounded-tl-2xl">Type</th>
                <th className="text-center px-2 py-3 font-bold text-teal-600 dark:text-teal-400">H. réelles sal.</th>
                <th className="text-center px-2 py-3 font-bold text-teal-600">H. rém. sal.</th>
                <th className="text-right px-2 py-3 font-bold text-teal-600">Coût brut sal.</th>
                <th className="text-right px-2 py-3 font-bold text-teal-600">Coût emp. (+15%)</th>
                <th className="text-center px-2 py-3 font-bold text-violet-600">H. réelles prest.</th>
                <th className="text-right px-2 py-3 font-bold rounded-tr-2xl text-violet-600">Coût prestataire</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(l => {
                const active = l.hs > 0 || l.hp > 0;
                return (
                  <tr key={l.id} className={`border-t transition-colors ${tr} ${active ? (darkMode ? 'bg-teal-900/20' : 'bg-teal-50/60') : ''}`}>
                    <td className="px-4 py-2.5 font-medium">
                      {l.label}
                      {l.note && (
                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                          {l.note}
                        </span>
                      )}
                    </td>
                    {/* H. réelles salarié */}
                    <td className="px-2 py-2.5 text-center">
                      {l.salarie !== null ? (
                        <input type="number" min="0" step="0.5"
                          value={heures[l.id]?.salarie ?? ''}
                          onChange={e => set(l.id, 'salarie', e.target.value === '' ? '' : e.target.value)}
                          placeholder="0"
                          aria-label={`Heures réelles salarié — ${l.label}`}
                          className={`w-16 text-center rounded-lg px-2 py-1 border outline-none transition-colors ${inp}`}
                        />
                      ) : <span className={`text-xs italic ${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span>}
                    </td>
                    {/* H. rémunérées salarié */}
                    <td className="px-2 py-2.5 text-center font-mono">
                      {l.salarie !== null && l.hRémS > 0
                        ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>{l.hRémS}h</span>
                        : <span className={`${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span>}
                    </td>
                    {/* Coût brut salarié */}
                    <td className="px-2 py-2.5 text-right font-mono">
                      {l.coutBrutS !== null && l.coutBrutS > 0
                        ? <span className={`font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{fmt0(l.coutBrutS)} €</span>
                        : <span className={`${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span>}
                    </td>
                    {/* Coût employeur salarié */}
                    <td className="px-2 py-2.5 text-right font-mono">
                      {l.coutEmpS !== null && l.coutEmpS > 0
                        ? <span className={`font-semibold text-xs ${darkMode ? 'text-teal-300' : 'text-teal-600'}`}>{fmt0(l.coutEmpS)} €</span>
                        : <span className={`${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span>}
                    </td>
                    {/* H. réelles prestataire */}
                    <td className="px-2 py-2.5 text-center">
                      {l.prestataire !== null ? (
                        <input type="number" min="0" step="0.5"
                          value={heures[l.id]?.prestataire ?? ''}
                          onChange={e => set(l.id, 'prestataire', e.target.value === '' ? '' : e.target.value)}
                          placeholder="0"
                          aria-label={`Heures réelles prestataire — ${l.label}`}
                          className={`w-16 text-center rounded-lg px-2 py-1 border outline-none transition-colors ${inp}`}
                        />
                      ) : <span className={`text-xs italic ${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span>}
                    </td>
                    {/* Coût prestataire */}
                    <td className="px-2 py-2.5 text-right font-mono">
                      {l.coutBrutP !== null && l.coutBrutP > 0
                        ? <span className={`font-bold ${darkMode ? 'text-violet-400' : 'text-violet-700'}`}>{fmt0(l.coutBrutP)} €</span>
                        : <span className={`${darkMode ? 'text-gray-600' : 'text-slate-300'}`}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 font-black text-sm ${darkMode ? 'border-gray-600 bg-gray-700/40' : 'border-slate-300 bg-slate-50'}`}>
                <td className="px-4 py-4">TOTAL</td>
                <td className="px-2 py-4 text-center text-xs font-semibold opacity-70">{totaux.hSalarie > 0 ? `${totaux.hSalarie}h` : ''}</td>
                <td className="px-2 py-4 text-center text-xs font-semibold opacity-70">{totaux.hRémSalarie > 0 ? `${totaux.hRémSalarie}h` : ''}</td>
                <td className={`px-2 py-4 text-right font-mono ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                  {totaux.brutSalarie > 0 ? `${fmt0(totaux.brutSalarie)} €` : '—'}
                </td>
                <td className={`px-2 py-4 text-right font-mono ${darkMode ? 'text-teal-200' : 'text-teal-800'}`}>
                  {totaux.empSalarie > 0 ? `${fmt0(totaux.empSalarie)} €` : '—'}
                </td>
                <td className="px-2 py-4 text-center text-xs font-semibold opacity-70">{totaux.hPrestataire > 0 ? `${totaux.hPrestataire}h` : ''}</td>
                <td className={`px-2 py-4 text-right font-mono ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
                  {totaux.brutPrestataire > 0 ? `${fmt0(totaux.brutPrestataire)} €` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {hasData && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {totaux.brutSalarie > 0 && (
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-teal-900/30 border border-teal-800' : 'bg-teal-50 border border-teal-200'}`}>
                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Coût brut salarié</div>
                <div className={`text-2xl font-black ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{fmt0(totaux.brutSalarie)} €</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Avant charges patronales</div>
              </div>
            )}
            {totaux.empSalarie > 0 && (
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-cyan-900/30 border border-cyan-800' : 'bg-cyan-50 border border-cyan-200'}`}>
                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Coût employeur salarié (+{CHARGES_VACATAIRE}%)</div>
                <div className={`text-2xl font-black ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{fmt0(totaux.empSalarie)} €</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Brut + charges vacataire</div>
              </div>
            )}
            {totaux.brutPrestataire > 0 && (
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-violet-900/30 border border-violet-800' : 'bg-violet-50 border border-violet-200'}`}>
                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>Coût prestataire</div>
                <div className={`text-2xl font-black ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>{fmt0(totaux.brutPrestataire)} €</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Base de négociation · TTC selon statut</div>
              </div>
            )}
          </div>
        )}

        <p className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
          Seuil légal vacataire : {SEUIL_HEURES_VACATAIRE} h/an · Charges patronales vacataires : {CHARGES_VACATAIRE}% · Les saisies sont sauvegardées automatiquement.
        </p>
      </div>

      {/* ── RAPPROCHEMENT BUDGET ── */}
      {vacatairesBudget.length > 0 && (() => {
        const totalBudget = vacatairesBudget.reduce((s, v) => s + v.cout, 0);
        const totalCalcule = totaux.empSalarie + totaux.brutPrestataire;
        const ecart = totalCalcule - totalBudget;
        return (
          <div className={`rounded-3xl shadow-lg border-2 p-6 ${darkMode ? 'bg-gray-800 border-teal-900' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Calculator className={darkMode ? 'text-teal-400' : 'text-teal-600'} size={24} />
              <div>
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Rapprochement Budget ↔ Calculateur</h3>
                <span className={`text-xs font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Vacataires saisis dans le budget des services</span>
              </div>
            </div>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
                    <th className="text-left py-2 px-3 font-bold">Service</th>
                    <th className="text-left py-2 px-3 font-bold">Vacataire</th>
                    <th className="text-right py-2 px-3 font-bold">Heures</th>
                    <th className="text-right py-2 px-3 font-bold">Coût budgété</th>
                  </tr>
                </thead>
                <tbody>
                  {vacatairesBudget.map((v, i) => (
                    <tr key={i} className={`border-t ${darkMode ? 'border-gray-700 text-gray-200' : 'border-slate-100 text-slate-700'}`}>
                      <td className="py-2 px-3 font-bold">{v.service}</td>
                      <td className="py-2 px-3">{v.nom}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{Math.round(v.heures)} h</td>
                      <td className="py-2 px-3 text-right tabular-nums font-bold">{fmt0(v.cout)} €</td>
                    </tr>
                  ))}
                  <tr className={`border-t-2 font-black ${darkMode ? 'border-teal-700 text-teal-300' : 'border-teal-300 text-teal-700'}`}>
                    <td className="py-2 px-3" colSpan={3}>Total budget vacataires</td>
                    <td className="py-2 px-3 text-right tabular-nums">{fmt0(totalBudget)} €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {totalCalcule > 0 && (
              <div className={`flex flex-wrap gap-3`}>
                <div className={`flex-1 p-3 rounded-xl text-center ${darkMode ? 'bg-gray-700' : 'bg-white border border-teal-100'}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Coût calculé (ce tableau)</div>
                  <div className={`text-lg font-black tabular-nums ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fmt0(totalCalcule)} €</div>
                </div>
                <div className={`flex-1 p-3 rounded-xl text-center ${darkMode ? 'bg-gray-700' : 'bg-white border border-teal-100'}`}>
                  <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Écart</div>
                  <div className={`text-lg font-black tabular-nums ${ecart > 500 ? 'text-rose-500' : ecart < -500 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {ecart >= 0 ? '+' : ''}{fmt0(ecart)} €
                  </div>
                  <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                    {Math.abs(ecart) < 500 ? 'Cohérent' : ecart > 0 ? 'Dépassement budget' : 'Sous le budget'}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
