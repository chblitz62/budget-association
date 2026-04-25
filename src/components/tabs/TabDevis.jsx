import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Trash2, ChevronDown, ChevronUp,
  User, Briefcase, UserCheck, AlertCircle, CheckCircle,
  Calculator, Euro, Clock, Printer, Info, AlertTriangle,
  Building2, Shield, BookOpen, Target, TrendingUp, Layers,
  ClipboardList, BadgeCheck,
} from 'lucide-react';

// ─── Constantes 2026 ────────────────────────────────────────────────────────
const SMIC_MENSUEL_2026   = 1841.45;
const SMIC_HORAIRE_2026   = +(SMIC_MENSUEL_2026 / 151.67).toFixed(4); // ~12.14 €/h
const HEURES_LEGALES_AN   = 1607;   // durée légale du travail / an
const JOURS_OUVRES_AN     = 228;    // jours ouvrés base France
const JOURS_CONGES_PAYES  = 25;     // jours ouvrés minimum légal
const JOURS_FERIES_MOY    = 8;      // jours fériés tombant en semaine (moyenne)
const TAUX_CHARGES_SALARIE_DEF  = 43;  // % charges patronales (associations, hors Fillon)
const TAUX_CHARGES_VACATAIRE_DEF = 30; // % cotisations URSSAF vacataires (régime spécifique)
const TAUX_STRUCTURE_DEF  = 15;    // % coûts indirects appliqués aux coûts directs

// ─── Mentions légales obligatoires ──────────────────────────────────────────
const MENTIONS_LEGALES = [
  { id: 'siret',           label: 'N° SIRET de l\'organisme', ref: 'Code Commerce L.123-237' },
  { id: 'da',              label: 'N° Déclaration d\'Activité (DA)', ref: 'CT L.6351-1' },
  { id: 'qualiopi',        label: 'Mention certification Qualiopi', ref: 'Loi Avenir 2018 / Décret 2019-564 — obligatoire depuis 01/01/2022 pour fonds publics' },
  { id: 'intitule',        label: 'Intitulé exact de la formation', ref: 'CT L.6353-1' },
  { id: 'objectifs',       label: 'Objectifs pédagogiques', ref: 'CT L.6353-1' },
  { id: 'programme',       label: 'Programme détaillé (contenu + durée modules)', ref: 'CT L.6353-1' },
  { id: 'duree',           label: 'Durée totale en heures', ref: 'CT L.6353-1' },
  { id: 'dates_lieu',      label: 'Dates, horaires et lieu (ou modalités distanciel)', ref: 'CT L.6353-1' },
  { id: 'modalite',        label: 'Modalités pédagogiques (présentiel / distanciel / hybride)', ref: 'Décret 2018-1341' },
  { id: 'evaluation',      label: 'Modalités d\'évaluation des acquis', ref: 'CT L.6353-1' },
  { id: 'formateur',       label: 'Profil du/des formateur(s)', ref: 'CT L.6353-1' },
  { id: 'handicap',        label: 'Référent handicap et conditions d\'accessibilité', ref: 'CT L.6352-3 — depuis 01/01/2019' },
  { id: 'prix',            label: 'Prix HT et mention TVA (ou exonération art. 261-4-4° CGI)', ref: 'CGI art. 261-4-4°' },
  { id: 'paiement',        label: 'Conditions de règlement et modalités d\'acompte', ref: 'Code Commerce L.441-1' },
  { id: 'validite',        label: 'Durée de validité du devis', ref: 'Recommandation DGCCRF' },
  { id: 'annulation',      label: 'Conditions d\'annulation et indemnités', ref: 'CT L.6354-1' },
  { id: 'retractation',    label: 'Droit de rétractation 14 jours (particuliers uniquement)', ref: 'CT L.6353-5 — depuis 2016' },
  { id: 'convention',      label: 'Convention de formation obligatoire (>= 6h, entreprise)', ref: 'CT L.6353-1 — document séparé du devis' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n, dec = 2) =>
  isNaN(n) ? '0,00 €' : n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €';

const fmtH = n => isNaN(n) ? '0 h' : `${(+n).toFixed(1)} h`;

const today = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
};

const newIntervenant = (type = 'salarie') => ({
  id: Date.now() + Math.random(),
  type,
  nom: '',
  // Salarié
  salaireBrutMensuel: 2500,
  tauxCharges: TAUX_CHARGES_SALARIE_DEF,
  heuresHebdo: 35,
  joursAbsenceAn: 5,
  tauxAnimation: 70,
  heuresAction: 0,
  // Vacataire
  tauxHoraireVacataire: 35,
  tauxChargesVacataire: TAUX_CHARGES_VACATAIRE_DEF,
  heuresVacataire: 0,
  // Prestataire
  montantHT: 0,
  heuresPrestataire: 0,
  descriptionPrestataire: '',
});

const newFrais = () => ({
  id: Date.now() + Math.random(),
  libelle: '',
  montant: 0,
  type: 'direct', // direct | indirect
});

const newFinancement = () => ({
  id: Date.now() + Math.random(),
  source: '',
  type: 'opco',
  montant: 0,
  pourcentage: 0,
  usePercent: false,
});

const STORAGE_KEY = 'devis_formation_data';

const defaultDevis = () => ({
  // Identification
  numero: `DEV-${new Date().getFullYear()}-001`,
  dateEmission: today(),
  dateValidite: addDays(today(), 30),
  // Organisme
  organisme: {
    nom: 'AFERTES',
    siret: '',
    adresse: '',
    numeroDA: '',
    qualiopi: true,
    referentHandicap: '',
  },
  // Client
  client: {
    nom: '',
    siret: '',
    adresse: '',
    contact: '',
    typeClient: 'entreprise',
  },
  // Action
  action: {
    intitule: '',
    objectifs: '',
    programme: '',
    dureeHeures: 0,
    dateDebut: '',
    dateFin: '',
    lieu: '',
    modalite: 'presentiel',
    nbStagiaires: 1,
    niveauEntree: '',
    modalitesEvaluation: '',
    conditionsHandicap: 'Formation accessible aux personnes en situation de handicap. Contacter notre référent handicap pour aménagement.',
  },
  // Coût de revient
  intervenants: [],
  fraisDirects: [],
  tauxStructure: TAUX_STRUCTURE_DEF,
  // Financements
  financements: [],
  // Conditions commerciales
  exonerationTVA: true,
  tauxTVA: 20,
  conditionsPaiement: '30 jours date de facture',
  acompte: 30,
  conditionsAnnulation: 'Annulation > 15 jours avant le début : sans frais. Entre 8 et 15 jours : 30 % du montant dû. < 8 jours : 100 % du montant dû.',
});

// ─── Calculs taux horaire ─────────────────────────────────────────────────────
function calcSalarie(iv) {
  const brut = parseFloat(iv.salaireBrutMensuel) || 0;
  const charges = parseFloat(iv.tauxCharges) || 0;
  const hHebdo = parseFloat(iv.heuresHebdo) || 35;
  const joursAbs = parseFloat(iv.joursAbsenceAn) || 0;
  const txAnim = parseFloat(iv.tauxAnimation) || 70;
  const hAction = parseFloat(iv.heuresAction) || 0;

  const coutAnnuel = brut * 12 * (1 + charges / 100);
  const hContractuelles = hHebdo * 52;
  // Heures disponibles nettes = heures légales - absences imprévues
  const hDisponibles = HEURES_LEGALES_AN - joursAbs * (hHebdo / 5);
  const hAnimation = hDisponibles * (txAnim / 100);
  const tauxHoraire = hAnimation > 0 ? coutAnnuel / hAnimation : 0;
  const coutAction = tauxHoraire * hAction;

  return { coutAnnuel, hContractuelles, hDisponibles, hAnimation, tauxHoraire, coutAction, hAction };
}

function calcVacataire(iv) {
  const taux = parseFloat(iv.tauxHoraireVacataire) || 0;
  const charges = parseFloat(iv.tauxChargesVacataire) || 0;
  const heures = parseFloat(iv.heuresVacataire) || 0;
  const tauxCharge = taux * (1 + charges / 100);
  const coutAction = tauxCharge * heures;
  return { tauxCharge, coutAction, heures };
}

function calcPrestataire(iv) {
  const montant = parseFloat(iv.montantHT) || 0;
  const heures = parseFloat(iv.heuresPrestataire) || 0;
  const tauxHoraire = heures > 0 ? montant / heures : 0;
  return { montant, heures, tauxHoraire, coutAction: montant };
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TabDevis({ darkMode }) {
  const dm = darkMode;

  const [devis, setDevis] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultDevis();
    } catch {
      return defaultDevis();
    }
  });

  const [openSections, setOpenSections] = useState({
    legal: true,
    organisme: true,
    client: false,
    action: false,
    couts: true,
    financements: false,
    synthese: true,
  });

  const [mentionsChecked, setMentionsChecked] = useState({});
  const [showMentions, setShowMentions] = useState(false);

  // Persistance auto
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devis));
    }, 400);
    return () => clearTimeout(t);
  }, [devis]);

  const setField = (path, value) => {
    setDevis(prev => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...prev, [path]: value };
      if (parts.length === 2) return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } };
      return prev;
    });
  };

  const toggleSection = key =>
    setOpenSections(s => ({ ...s, [key]: !s[key] }));

  // ── Calculs ────────────────────────────────────────────────────────────────
  const calcs = useMemo(() => {
    const intervenants = devis.intervenants || [];
    const frais = devis.fraisDirects || [];
    const financements = devis.financements || [];
    const nbStagiaires = Math.max(1, parseInt(devis.action.nbStagiaires) || 1);

    // Coût intervenants
    const coutIntervenants = intervenants.reduce((sum, iv) => {
      if (iv.type === 'salarie')    return sum + calcSalarie(iv).coutAction;
      if (iv.type === 'vacataire')  return sum + calcVacataire(iv).coutAction;
      if (iv.type === 'prestataire') return sum + calcPrestataire(iv).coutAction;
      return sum;
    }, 0);

    const coutFraisDirects = frais.reduce((sum, f) => sum + (parseFloat(f.montant) || 0), 0);
    const coutDirectTotal = coutIntervenants + coutFraisDirects;

    const coutIndirect = coutDirectTotal * (parseFloat(devis.tauxStructure) || 0) / 100;
    const coutTotalHT = coutDirectTotal + coutIndirect;

    const totalFinancements = financements.reduce((sum, f) => {
      if (f.usePercent) return sum + coutTotalHT * ((parseFloat(f.pourcentage) || 0) / 100);
      return sum + (parseFloat(f.montant) || 0);
    }, 0);

    const resteACharge = Math.max(0, coutTotalHT - totalFinancements);
    const prixParStagiaireHT = nbStagiaires > 0 ? resteACharge / nbStagiaires : 0;
    const tva = devis.exonerationTVA ? 0 : coutTotalHT * (parseFloat(devis.tauxTVA) || 20) / 100;
    const prixParStagiaireTTC = prixParStagiaireHT + (devis.exonerationTVA ? 0 : prixParStagiaireHT * (parseFloat(devis.tauxTVA) || 20) / 100);

    // Coût horaire global de l'action
    const dureeH = parseFloat(devis.action.dureeHeures) || 0;
    const coutHoraireAction = dureeH > 0 ? coutTotalHT / dureeH : 0;
    const coutHoraireParStagiaire = dureeH > 0 && nbStagiaires > 0 ? resteACharge / (dureeH * nbStagiaires) : 0;

    // Taux de couverture
    const tauxCouverture = coutTotalHT > 0 ? (totalFinancements / coutTotalHT) * 100 : 0;

    // Heures totales intervenants
    const heuresTotalesIntervenants = intervenants.reduce((sum, iv) => {
      if (iv.type === 'salarie')    return sum + (parseFloat(iv.heuresAction) || 0);
      if (iv.type === 'vacataire')  return sum + (parseFloat(iv.heuresVacataire) || 0);
      if (iv.type === 'prestataire') return sum + (parseFloat(iv.heuresPrestataire) || 0);
      return sum;
    }, 0);

    return {
      coutIntervenants, coutFraisDirects, coutDirectTotal,
      coutIndirect, coutTotalHT, totalFinancements,
      resteACharge, prixParStagiaireHT, prixParStagiaireTTC,
      tva, coutHoraireAction, coutHoraireParStagiaire,
      tauxCouverture, heuresTotalesIntervenants, nbStagiaires,
    };
  }, [devis]);

  // ── Helpers UI ──────────────────────────────────────────────────────────────
  const card = `rounded-2xl border p-5 mb-4 ${dm ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`;
  const label = `block text-xs font-semibold mb-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`;
  const input = `w-full px-3 py-2 text-sm rounded-xl border transition-colors ${
    dm ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500' :
         'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400'
  } outline-none`;
  const btnSm = `px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all`;
  const sectionHeader = (label, key, icon) => (
    <button
      onClick={() => toggleSection(key)}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition-all ${
        dm ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800' :
             'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
      } ${openSections[key] ? 'rounded-b-none border-b-0' : ''}`}
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      {openSections[key] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
    </button>
  );

  // ── Intervenants ────────────────────────────────────────────────────────────
  const addIntervenant = type =>
    setDevis(d => ({ ...d, intervenants: [...d.intervenants, newIntervenant(type)] }));

  const updateIntervenant = (id, field, val) =>
    setDevis(d => ({ ...d, intervenants: d.intervenants.map(iv => iv.id === id ? { ...iv, [field]: val } : iv) }));

  const removeIntervenant = id =>
    setDevis(d => ({ ...d, intervenants: d.intervenants.filter(iv => iv.id !== id) }));

  // ── Frais directs ───────────────────────────────────────────────────────────
  const addFrais = () =>
    setDevis(d => ({ ...d, fraisDirects: [...d.fraisDirects, newFrais()] }));

  const updateFrais = (id, field, val) =>
    setDevis(d => ({ ...d, fraisDirects: d.fraisDirects.map(f => f.id === id ? { ...f, [field]: val } : f) }));

  const removeFrais = id =>
    setDevis(d => ({ ...d, fraisDirects: d.fraisDirects.filter(f => f.id !== id) }));

  // ── Financements ────────────────────────────────────────────────────────────
  const addFinancement = () =>
    setDevis(d => ({ ...d, financements: [...d.financements, newFinancement()] }));

  const updateFinancement = (id, field, val) =>
    setDevis(d => ({ ...d, financements: d.financements.map(f => f.id === id ? { ...f, [field]: val } : f) }));

  const removeFinancement = id =>
    setDevis(d => ({ ...d, financements: d.financements.filter(f => f.id !== id) }));

  const mentionsOK = MENTIONS_LEGALES.filter(m => mentionsChecked[m.id]).length;

  return (
    <div className="space-y-2">

      {/* ── EN-TÊTE ──────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        dm ? 'bg-gradient-to-r from-violet-900/40 to-indigo-900/30 border border-violet-800/40' :
             'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200'
      }`}>
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${dm ? 'text-violet-200' : 'text-violet-900'}`}>
            <FileText size={22} className="text-violet-500" /> Construction de Devis Formation
          </h2>
          <p className={`text-xs mt-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            Calcul du taux horaire réel · Reste à charge · Obligations légales 2026 (CT + CGI)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowMentions(v => !v)}
            className={`${btnSm} ${
              mentionsOK === MENTIONS_LEGALES.length
                ? dm ? 'bg-emerald-800/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                : dm ? 'bg-amber-800/50 text-amber-300' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <BadgeCheck size={14} />
            Obligations légales {mentionsOK}/{MENTIONS_LEGALES.length}
          </button>
          <button
            onClick={() => window.print()}
            className={`${btnSm} ${dm ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Printer size={14} /> Imprimer
          </button>
          <button
            onClick={() => { if (window.confirm('Réinitialiser ce devis ?')) setDevis(defaultDevis()); }}
            className={`${btnSm} ${dm ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Nouveau devis
          </button>
        </div>
      </div>

      {/* ── CHECKLIST MENTIONS LÉGALES ────────────────────────────────────── */}
      {showMentions && (
        <div className={`rounded-2xl border p-5 ${dm ? 'bg-zinc-900 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-amber-500" />
            <h3 className={`font-bold text-sm ${dm ? 'text-amber-300' : 'text-amber-800'}`}>
              Mentions obligatoires — Devis de formation professionnelle (France, 2026)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MENTIONS_LEGALES.map(m => (
              <label key={m.id} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!mentionsChecked[m.id]}
                  onChange={e => setMentionsChecked(prev => ({ ...prev, [m.id]: e.target.checked }))}
                  className="mt-0.5 accent-violet-600"
                />
                <div>
                  <span className={`text-xs font-semibold ${
                    mentionsChecked[m.id]
                      ? dm ? 'text-emerald-400 line-through' : 'text-emerald-600 line-through'
                      : dm ? 'text-zinc-200' : 'text-slate-700'
                  }`}>{m.label}</span>
                  <span className={`block text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{m.ref}</span>
                </div>
              </label>
            ))}
          </div>
          {devis.client.typeClient === 'particulier' && (
            <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-xs ${dm ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'}`}>
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span><strong>Client particulier :</strong> droit de rétractation de 14 jours obligatoire (CT L.6353-5). La formation ne peut démarrer avant l'expiration du délai sauf demande expresse écrite du stagiaire.</span>
            </div>
          )}
          <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 text-xs ${dm ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span><strong>TVA :</strong> les organismes de formation professionnelle continue bénéficient d'une exonération de TVA (CGI art. 261-4-4°) sous réserve de respecter les obligations déclaratives (bilan pédagogique et financier). Cette exonération ne s'applique pas aux formations considérées comme "de loisir" ou hors champ de la formation professionnelle.</span>
          </div>
        </div>
      )}

      {/* ── IDENTIFICATION DU DEVIS ───────────────────────────────────────── */}
      <div className={card}>
        <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${dm ? 'text-zinc-200' : 'text-slate-700'}`}>
          <ClipboardList size={15} className="text-violet-500" /> Identification du devis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Numéro de devis', 'numero', 'text'],
            ['Date d\'émission', 'dateEmission', 'date'],
            ['Date de validité', 'dateValidite', 'date'],
          ].map(([lbl, key, type]) => (
            <div key={key}>
              <label className={label}>{lbl}</label>
              <input type={type} className={input} value={devis[key] || ''}
                onChange={e => setField(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label className={label}>Client</label>
            <select className={input} value={devis.client.typeClient}
              onChange={e => setField('client.typeClient', e.target.value)}>
              <option value="entreprise">Entreprise</option>
              <option value="particulier">Particulier (+ rétractation 14j)</option>
              <option value="opco">OPCO / Financeur direct</option>
              <option value="region">Conseil Régional</option>
              <option value="pole_emploi">France Travail</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── ORGANISME ────────────────────────────────────────────────────── */}
      {sectionHeader('Organisme de formation (prestataire)', 'organisme', <Building2 size={15} className="text-indigo-400" />)}
      {openSections.organisme && (
        <div className={`${card} rounded-t-none mt-0`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              ['Raison sociale', 'organisme.nom'],
              ['N° SIRET', 'organisme.siret'],
              ['N° Déclaration d\'Activité (DA)', 'organisme.numeroDA'],
              ['Adresse', 'organisme.adresse'],
              ['Référent handicap', 'organisme.referentHandicap'],
            ].map(([lbl, key]) => (
              <div key={key} className={key === 'organisme.adresse' ? 'md:col-span-2' : ''}>
                <label className={label}>{lbl}</label>
                <input type="text" className={input} value={(devis.organisme && devis.organisme[key.split('.')[1]]) || ''}
                  onChange={e => setField(key, e.target.value)} />
              </div>
            ))}
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="qualiopi" checked={!!devis.organisme.qualiopi}
                onChange={e => setField('organisme.qualiopi', e.target.checked)}
                className="accent-violet-600 w-4 h-4" />
              <label htmlFor="qualiopi" className={`text-sm font-bold cursor-pointer ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                Certifié Qualiopi
              </label>
              {devis.organisme.qualiopi
                ? <CheckCircle size={16} className="text-emerald-500" />
                : <AlertCircle size={16} className="text-amber-500" />}
            </div>
          </div>
          {!devis.organisme.qualiopi && (
            <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 text-xs ${dm ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span><strong>Attention :</strong> sans certification Qualiopi, l'action ne peut pas être financée sur fonds publics ou mutualisés (CPF, OPCO, Région, France Travail). Obligatoire depuis le 1er janvier 2022 (Loi Avenir professionnel 2018).</span>
            </div>
          )}
        </div>
      )}

      {/* ── CLIENT ───────────────────────────────────────────────────────── */}
      {sectionHeader('Bénéficiaire / Client', 'client', <User size={15} className="text-blue-400" />)}
      {openSections.client && (
        <div className={`${card} rounded-t-none mt-0`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              ['Nom / Raison sociale', 'client.nom'],
              ['N° SIRET', 'client.siret'],
              ['Contact', 'client.contact'],
              ['Adresse', 'client.adresse'],
            ].map(([lbl, key]) => (
              <div key={key} className={key === 'client.adresse' ? 'md:col-span-3' : ''}>
                <label className={label}>{lbl}</label>
                <input type="text" className={input} value={(devis.client && devis.client[key.split('.')[1]]) || ''}
                  onChange={e => setField(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTION DE FORMATION ──────────────────────────────────────────── */}
      {sectionHeader("Action de formation", 'action', <BookOpen size={15} className="text-teal-400" />)}
      {openSections.action && (
        <div className={`${card} rounded-t-none mt-0`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className={label}>Intitulé de la formation *</label>
              <input type="text" className={input} value={devis.action.intitule}
                onChange={e => setField('action.intitule', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className={label}>Objectifs pédagogiques *</label>
              <textarea rows={2} className={`${input} resize-none`} value={devis.action.objectifs}
                onChange={e => setField('action.objectifs', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className={label}>Programme / Contenu (modules + durées) *</label>
              <textarea rows={3} className={`${input} resize-none`} value={devis.action.programme}
                onChange={e => setField('action.programme', e.target.value)} />
            </div>
            <div>
              <label className={label}>Durée totale (heures) *</label>
              <input type="number" min="0" step="0.5" className={input} value={devis.action.dureeHeures}
                onChange={e => setField('action.dureeHeures', e.target.value)} />
            </div>
            <div>
              <label className={label}>Nb de stagiaires</label>
              <input type="number" min="1" className={input} value={devis.action.nbStagiaires}
                onChange={e => setField('action.nbStagiaires', e.target.value)} />
            </div>
            <div>
              <label className={label}>Modalité *</label>
              <select className={input} value={devis.action.modalite}
                onChange={e => setField('action.modalite', e.target.value)}>
                <option value="presentiel">Présentiel</option>
                <option value="distanciel">Distanciel (FOAD)</option>
                <option value="hybride">Hybride (mixte)</option>
                <option value="elearning">E-learning (autoformation)</option>
              </select>
            </div>
            <div>
              <label className={label}>Date début</label>
              <input type="date" className={input} value={devis.action.dateDebut}
                onChange={e => setField('action.dateDebut', e.target.value)} />
            </div>
            <div>
              <label className={label}>Date fin</label>
              <input type="date" className={input} value={devis.action.dateFin}
                onChange={e => setField('action.dateFin', e.target.value)} />
            </div>
            <div>
              <label className={label}>Lieu</label>
              <input type="text" className={input} value={devis.action.lieu}
                onChange={e => setField('action.lieu', e.target.value)} />
            </div>
            <div>
              <label className={label}>Modalités d'évaluation *</label>
              <input type="text" className={input} value={devis.action.modalitesEvaluation}
                onChange={e => setField('action.modalitesEvaluation', e.target.value)}
                placeholder="QCM, mise en situation, grille d'évaluation..." />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Conditions d'accessibilité handicap *</label>
              <input type="text" className={input} value={devis.action.conditionsHandicap}
                onChange={e => setField('action.conditionsHandicap', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ── COÛT DE REVIENT ──────────────────────────────────────────────── */}
      {sectionHeader('Calcul du coût de revient', 'couts', <Calculator size={15} className="text-orange-400" />)}
      {openSections.couts && (
        <div className={`${card} rounded-t-none mt-0`}>

          {/* Info méthodologique */}
          <div className={`p-3 rounded-xl mb-4 flex items-start gap-2 text-xs ${dm ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'}`}>
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Méthodologie :</strong> le taux horaire réel d'un salarié intègre son coût employeur annuel (brut × 12 × charges patronales) rapporté à ses seules heures d'animation (disponible net × taux animation).
              Le taux affiché est le coût réel par heure productive — il sera systématiquement supérieur au coût horaire contractuel.
            </span>
          </div>

          {/* Référence SMIC 2026 */}
          <div className={`p-2 rounded-xl mb-4 inline-flex items-center gap-3 text-xs ${dm ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
            <span>SMIC 2026 : <strong>{SMIC_MENSUEL_2026.toLocaleString('fr-FR')} €</strong>/mois brut</span>
            <span className={dm ? 'text-zinc-600' : 'text-slate-300'}>|</span>
            <span><strong>{SMIC_HORAIRE_2026.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong>/h brut</span>
            <span className={dm ? 'text-zinc-600' : 'text-slate-300'}>|</span>
            <span>Heures légales/an : <strong>{HEURES_LEGALES_AN} h</strong></span>
          </div>

          {/* Boutons ajouter intervenant */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-xs font-bold self-center ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Ajouter :</span>
            <button onClick={() => addIntervenant('salarie')}
              className={`${btnSm} ${dm ? 'bg-indigo-800/50 text-indigo-300 hover:bg-indigo-700/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
              <User size={13} /> Salarié
            </button>
            <button onClick={() => addIntervenant('vacataire')}
              className={`${btnSm} ${dm ? 'bg-violet-800/50 text-violet-300 hover:bg-violet-700/50' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
              <UserCheck size={13} /> Vacataire
            </button>
            <button onClick={() => addIntervenant('prestataire')}
              className={`${btnSm} ${dm ? 'bg-teal-800/50 text-teal-300 hover:bg-teal-700/50' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>
              <Briefcase size={13} /> Prestataire
            </button>
          </div>

          {/* Liste intervenants */}
          <div className="space-y-4 mb-6">
            {devis.intervenants.length === 0 && (
              <div className={`text-center py-8 rounded-xl border-2 border-dashed text-sm ${dm ? 'border-zinc-700 text-zinc-500' : 'border-slate-200 text-slate-400'}`}>
                Aucun intervenant — ajoutez un salarié, vacataire ou prestataire ci-dessus
              </div>
            )}
            {devis.intervenants.map(iv => {
              const isSalarie = iv.type === 'salarie';
              const isVaca = iv.type === 'vacataire';
              const isPrest = iv.type === 'prestataire';
              const c = isSalarie ? calcSalarie(iv) : isVaca ? calcVacataire(iv) : calcPrestataire(iv);
              const typeColor = isSalarie
                ? dm ? 'border-indigo-700 bg-indigo-950/30' : 'border-indigo-200 bg-indigo-50/50'
                : isVaca
                  ? dm ? 'border-violet-700 bg-violet-950/30' : 'border-violet-200 bg-violet-50/50'
                  : dm ? 'border-teal-700 bg-teal-950/30' : 'border-teal-200 bg-teal-50/50';
              const badgeColor = isSalarie
                ? dm ? 'bg-indigo-800/60 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                : isVaca
                  ? dm ? 'bg-violet-800/60 text-violet-300' : 'bg-violet-100 text-violet-700'
                  : dm ? 'bg-teal-800/60 text-teal-300' : 'bg-teal-100 text-teal-700';

              return (
                <div key={iv.id} className={`rounded-2xl border p-4 ${typeColor}`}>
                  {/* Entête intervenant */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${badgeColor}`}>
                      {isSalarie ? 'Salarié' : isVaca ? 'Vacataire' : 'Prestataire'}
                    </span>
                    <input
                      type="text"
                      placeholder={isSalarie ? "Nom du salarié / poste" : isVaca ? "Nom du vacataire" : "Nom du prestataire"}
                      className={`flex-1 px-2 py-1 text-sm rounded-lg border ${dm ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'} outline-none`}
                      value={iv.nom}
                      onChange={e => updateIntervenant(iv.id, 'nom', e.target.value)}
                    />
                    <button onClick={() => removeIntervenant(iv.id)}
                      className={`p-1.5 rounded-lg transition-colors ${dm ? 'text-zinc-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Champs selon type */}
                  {isSalarie && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={label}>Salaire brut mensuel (€)</label>
                        <input type="number" min="0" step="50" className={input}
                          value={iv.salaireBrutMensuel}
                          onChange={e => updateIntervenant(iv.id, 'salaireBrutMensuel', e.target.value)} />
                      </div>
                      <div>
                        <label className={label}>Charges patronales (%)</label>
                        <input type="number" min="0" max="100" step="0.5" className={input}
                          value={iv.tauxCharges}
                          onChange={e => updateIntervenant(iv.id, 'tauxCharges', e.target.value)} />
                        <span className={`text-[10px] mt-0.5 block ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Moy. associations : 43 %</span>
                      </div>
                      <div>
                        <label className={label}>Heures / semaine</label>
                        <input type="number" min="1" max="48" step="0.5" className={input}
                          value={iv.heuresHebdo}
                          onChange={e => updateIntervenant(iv.id, 'heuresHebdo', e.target.value)} />
                      </div>
                      <div>
                        <label className={label}>Absences imprévues /an (j)</label>
                        <input type="number" min="0" max="60" className={input}
                          value={iv.joursAbsenceAn}
                          onChange={e => updateIntervenant(iv.id, 'joursAbsenceAn', e.target.value)} />
                        <span className={`text-[10px] mt-0.5 block ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Hors CP (25j intégrés)</span>
                      </div>
                      <div>
                        <label className={label}>Taux d'animation (%)</label>
                        <input type="number" min="1" max="100" className={input}
                          value={iv.tauxAnimation}
                          onChange={e => updateIntervenant(iv.id, 'tauxAnimation', e.target.value)} />
                        <span className={`text-[10px] mt-0.5 block ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>% temps en face-à-face pédago</span>
                      </div>
                      <div>
                        <label className={label}>Heures sur cette action</label>
                        <input type="number" min="0" step="0.5" className={input}
                          value={iv.heuresAction}
                          onChange={e => updateIntervenant(iv.id, 'heuresAction', e.target.value)} />
                      </div>
                      {/* Résultats calculés */}
                      <div className={`md:col-span-2 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs ${dm ? 'bg-zinc-800' : 'bg-white border border-slate-200'}`}>
                        <div>
                          <div className={`font-semibold ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Coût annuel employeur</div>
                          <div className={`font-black text-sm ${dm ? 'text-zinc-100' : 'text-slate-800'}`}>{fmt(c.coutAnnuel)}</div>
                        </div>
                        <div>
                          <div className={`font-semibold ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Taux horaire réel</div>
                          <div className={`font-black text-sm text-orange-500`}>{fmt(c.tauxHoraire)}<span className="text-xs font-normal">/h</span></div>
                          <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{fmtH(c.hAnimation)} animation/an</div>
                        </div>
                        <div>
                          <div className={`font-semibold ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Coût sur action</div>
                          <div className={`font-black text-sm text-violet-500`}>{fmt(c.coutAction)}</div>
                          <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>{fmtH(c.hAction)} × {fmt(c.tauxHoraire)}/h</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isVaca && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={label}>Taux horaire brut (€/h)</label>
                        <input type="number" min="0" step="0.5" className={input}
                          value={iv.tauxHoraireVacataire}
                          onChange={e => updateIntervenant(iv.id, 'tauxHoraireVacataire', e.target.value)} />
                        <span className={`text-[10px] mt-0.5 block ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Min. légal ≈ SMIC ({SMIC_HORAIRE_2026.toFixed(2)} €/h)</span>
                      </div>
                      <div>
                        <label className={label}>Charges patronales (%)</label>
                        <input type="number" min="0" max="100" step="0.5" className={input}
                          value={iv.tauxChargesVacataire}
                          onChange={e => updateIntervenant(iv.id, 'tauxChargesVacataire', e.target.value)} />
                        <span className={`text-[10px] mt-0.5 block ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Vacataires : ~30 % URSSAF</span>
                      </div>
                      <div>
                        <label className={label}>Heures sur cette action</label>
                        <input type="number" min="0" step="0.5" className={input}
                          value={iv.heuresVacataire}
                          onChange={e => updateIntervenant(iv.id, 'heuresVacataire', e.target.value)} />
                        {parseFloat(iv.heuresVacataire) > 450 && (
                          <span className={`text-[10px] mt-0.5 block text-amber-500`}>
                            ⚠ Seuil requalification : 450 h/an
                          </span>
                        )}
                      </div>
                      <div className={`rounded-xl p-3 text-xs ${dm ? 'bg-zinc-800' : 'bg-white border border-slate-200'}`}>
                        <div className={`font-semibold mb-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Coût horaire chargé</div>
                        <div className={`font-black text-sm text-orange-500`}>{fmt(c.tauxCharge)}/h</div>
                        <div className={`font-semibold mt-2 mb-0.5 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>Coût sur action</div>
                        <div className={`font-black text-sm text-violet-500`}>{fmt(c.coutAction)}</div>
                      </div>
                    </div>
                  )}

                  {isPrest && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className={label}>Description de la prestation</label>
                        <input type="text" className={input}
                          value={iv.descriptionPrestataire}
                          placeholder="Nature de la prestation externe"
                          onChange={e => updateIntervenant(iv.id, 'descriptionPrestataire', e.target.value)} />
                      </div>
                      <div>
                        <label className={label}>Montant forfaitaire HT (€)</label>
                        <input type="number" min="0" step="10" className={input}
                          value={iv.montantHT}
                          onChange={e => updateIntervenant(iv.id, 'montantHT', e.target.value)} />
                      </div>
                      <div>
                        <label className={label}>Heures incluses (si connu)</label>
                        <input type="number" min="0" step="0.5" className={input}
                          value={iv.heuresPrestataire}
                          onChange={e => updateIntervenant(iv.id, 'heuresPrestataire', e.target.value)} />
                        {c.tauxHoraire > 0 && (
                          <span className={`text-[10px] mt-0.5 block ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                            ≈ {fmt(c.tauxHoraire)}/h
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Frais directs */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-bold ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>Frais directs complémentaires</h4>
              <button onClick={addFrais}
                className={`${btnSm} ${dm ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Plus size={13} /> Ajouter un frais
              </button>
            </div>
            {devis.fraisDirects.length === 0 && (
              <div className={`text-xs py-3 text-center ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>
                Hébergement, repas, transport, location salle, matériels pédagogiques...
              </div>
            )}
            <div className="space-y-2">
              {devis.fraisDirects.map(f => (
                <div key={f.id} className="flex items-center gap-2">
                  <input type="text" placeholder="Libellé (hébergement, transport...)" className={`${input} flex-1`}
                    value={f.libelle} onChange={e => updateFrais(f.id, 'libelle', e.target.value)} />
                  <input type="number" min="0" step="10" placeholder="Montant €" className={`${input} w-32`}
                    value={f.montant} onChange={e => updateFrais(f.id, 'montant', e.target.value)} />
                  <button onClick={() => removeFrais(f.id)}
                    className={`p-1.5 rounded-lg ${dm ? 'text-zinc-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Charges indirectes */}
          <div className={`rounded-xl p-3 flex items-center gap-4 ${dm ? 'bg-zinc-800' : 'bg-slate-50 border border-slate-200'}`}>
            <div className="flex-1">
              <div className={`text-xs font-bold mb-0.5 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                Taux de charges indirectes (structure) — % appliqué sur coûts directs
              </div>
              <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                Loyer, administration, informatique, assurances... à ventiler sur les actions de formation
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" step="1" className={`${input} w-20 text-center`}
                value={devis.tauxStructure}
                onChange={e => setField('tauxStructure', e.target.value)} />
              <span className={`text-sm font-bold ${dm ? 'text-zinc-300' : 'text-slate-600'}`}>%</span>
              <span className={`text-xs font-bold text-orange-500`}>{fmt(calcs.coutIndirect)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FINANCEMENTS ──────────────────────────────────────────────────── */}
      {sectionHeader('Financements prévisionnels', 'financements', <TrendingUp size={15} className="text-emerald-400" />)}
      {openSections.financements && (
        <div className={`${card} rounded-t-none mt-0`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`text-xs ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
              Coût total HT de référence : <strong className={dm ? 'text-zinc-200' : 'text-slate-700'}>{fmt(calcs.coutTotalHT)}</strong>
            </div>
            <button onClick={addFinancement}
              className={`${btnSm} ${dm ? 'bg-emerald-800/40 text-emerald-300 hover:bg-emerald-700/40' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
              <Plus size={13} /> Ajouter un financement
            </button>
          </div>
          {devis.financements.length === 0 && (
            <div className={`text-xs py-3 text-center ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>
              OPCO, Conseil Régional, France Travail, CPF, plan de formation entreprise, autofinancement...
            </div>
          )}
          <div className="space-y-2 mb-4">
            {devis.financements.map(f => {
              const montantCalc = f.usePercent
                ? calcs.coutTotalHT * ((parseFloat(f.pourcentage) || 0) / 100)
                : parseFloat(f.montant) || 0;
              return (
                <div key={f.id} className="flex items-center gap-2 flex-wrap">
                  <select className={`${input} w-36`} value={f.type}
                    onChange={e => updateFinancement(f.id, 'type', e.target.value)}>
                    <option value="opco">OPCO</option>
                    <option value="region">Conseil Régional</option>
                    <option value="france_travail">France Travail</option>
                    <option value="cpf">CPF</option>
                    <option value="plan">Plan de formation</option>
                    <option value="subvention">Subvention</option>
                    <option value="entreprise">Prise en charge entreprise</option>
                    <option value="autofinancement">Autofinancement</option>
                    <option value="autre">Autre</option>
                  </select>
                  <input type="text" placeholder="Source / organisme" className={`${input} flex-1 min-w-32`}
                    value={f.source} onChange={e => updateFinancement(f.id, 'source', e.target.value)} />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateFinancement(f.id, 'usePercent', !f.usePercent)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        f.usePercent
                          ? dm ? 'bg-indigo-800/60 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                          : dm ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {f.usePercent ? '%' : '€'}
                    </button>
                    {f.usePercent ? (
                      <input type="number" min="0" max="100" step="1" placeholder="%" className={`${input} w-20 text-center`}
                        value={f.pourcentage} onChange={e => updateFinancement(f.id, 'pourcentage', e.target.value)} />
                    ) : (
                      <input type="number" min="0" step="10" placeholder="€" className={`${input} w-28`}
                        value={f.montant} onChange={e => updateFinancement(f.id, 'montant', e.target.value)} />
                    )}
                    <span className={`text-xs font-bold w-20 text-right ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {fmt(montantCalc)}
                    </span>
                  </div>
                  <button onClick={() => removeFinancement(f.id)}
                    className={`p-1.5 rounded-lg ${dm ? 'text-zinc-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SYNTHÈSE ──────────────────────────────────────────────────────── */}
      {sectionHeader('Synthèse financière & reste à charge', 'synthese', <Target size={15} className="text-red-400" />)}
      {openSections.synthese && (
        <div className={`${card} rounded-t-none mt-0`}>

          {/* Décomposition coûts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Coût intervenants', val: calcs.coutIntervenants, color: 'text-indigo-500', sub: `${devis.intervenants.length} intervenant(s)` },
              { label: 'Frais directs', val: calcs.coutFraisDirects, color: 'text-blue-500', sub: `${devis.fraisDirects.length} poste(s)` },
              { label: 'Charges indirectes', val: calcs.coutIndirect, color: 'text-orange-500', sub: `${devis.tauxStructure || 0} % structure` },
              { label: 'Coût total HT', val: calcs.coutTotalHT, color: 'text-slate-700', sub: 'Coûts directs + indirects', bold: true },
            ].map(({ label: lbl, val, color, sub, bold }) => (
              <div key={lbl} className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50 border border-slate-200'}`}>
                <div className={`text-xs font-semibold mb-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{lbl}</div>
                <div className={`font-black text-lg ${bold ? (dm ? 'text-zinc-100' : 'text-slate-800') : color}`}>{fmt(val)}</div>
                <div className={`text-[10px] ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Financement et reste à charge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className={`rounded-xl p-4 ${dm ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className={`text-xs font-semibold mb-1 ${dm ? 'text-emerald-400' : 'text-emerald-700'}`}>Total financements</div>
              <div className={`font-black text-2xl ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>{fmt(calcs.totalFinancements)}</div>
              <div className={`text-xs mt-1 ${dm ? 'text-emerald-500' : 'text-emerald-600'}`}>
                Taux de couverture : <strong>{calcs.tauxCouverture.toFixed(1)} %</strong>
              </div>
              <div className="mt-2 h-2 rounded-full bg-emerald-200/50 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, calcs.tauxCouverture)}%` }} />
              </div>
            </div>
            <div className={`rounded-xl p-4 ${
              calcs.resteACharge > 0
                ? dm ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'
                : dm ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'
            }`}>
              <div className={`text-xs font-semibold mb-1 ${dm ? 'text-amber-400' : 'text-amber-700'}`}>Reste à charge total</div>
              <div className={`font-black text-2xl ${
                calcs.resteACharge > 0 ? 'text-amber-500' : dm ? 'text-emerald-300' : 'text-emerald-600'
              }`}>{fmt(calcs.resteACharge)}</div>
              <div className={`text-xs mt-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                Coût total − financements
              </div>
            </div>
            <div className={`rounded-xl p-4 ${dm ? 'bg-violet-900/20 border border-violet-800/30' : 'bg-violet-50 border border-violet-200'}`}>
              <div className={`text-xs font-semibold mb-1 ${dm ? 'text-violet-400' : 'text-violet-700'}`}>Prix de vente / stagiaire</div>
              <div className={`font-black text-2xl ${dm ? 'text-violet-300' : 'text-violet-700'}`}>{fmt(calcs.prixParStagiaireHT)} <span className="text-sm font-normal">HT</span></div>
              {!devis.exonerationTVA && (
                <div className={`text-sm font-bold ${dm ? 'text-violet-400' : 'text-violet-600'}`}>
                  {fmt(calcs.prixParStagiaireTTC)} TTC ({devis.tauxTVA} %)
                </div>
              )}
              <div className={`text-xs mt-1 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
                Pour {calcs.nbStagiaires} stagiaire(s)
              </div>
            </div>
          </div>

          {/* Indicateurs horaires */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Coût/h de l\'action', val: fmt(calcs.coutHoraireAction), sub: `${devis.action.dureeHeures || 0} h formation`, color: 'text-orange-500' },
              { label: 'Coût/h/stagiaire', val: fmt(calcs.coutHoraireParStagiaire), sub: 'Reste à charge ÷ (h × stagiaires)', color: 'text-violet-500' },
              { label: 'Heures intervenants', val: fmtH(calcs.heuresTotalesIntervenants), sub: `${devis.intervenants.length} intervenant(s)`, color: dm ? 'text-zinc-200' : 'text-slate-800' },
              { label: 'TVA', val: devis.exonerationTVA ? 'Exonérée' : fmt(calcs.tva), sub: devis.exonerationTVA ? 'Art. 261-4-4° CGI' : `Taux ${devis.tauxTVA} %`, color: devis.exonerationTVA ? 'text-emerald-500' : 'text-amber-500' },
            ].map(({ label: lbl, val, sub, color }) => (
              <div key={lbl} className={`rounded-xl p-3 ${dm ? 'bg-zinc-800' : 'bg-slate-50 border border-slate-200'}`}>
                <div className={`text-xs font-semibold mb-0.5 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>{lbl}</div>
                <div className={`font-black text-base ${color}`}>{val}</div>
                <div className={`text-[10px] ${dm ? 'text-zinc-600' : 'text-slate-400'}`}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Conditions commerciales */}
          <div className={`rounded-xl border p-4 ${dm ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className={`text-xs font-bold mb-3 ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>Conditions commerciales (mentions obligatoires devis)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={label}>Conditions de règlement</label>
                <select className={input} value={devis.conditionsPaiement}
                  onChange={e => setField('conditionsPaiement', e.target.value)}>
                  <option value="comptant">Comptant à réception de facture</option>
                  <option value="30 jours date de facture">30 jours date de facture</option>
                  <option value="30 jours fin de mois">30 jours fin de mois</option>
                  <option value="45 jours fin de mois">45 jours fin de mois</option>
                  <option value="échelonné">Échelonné (voir convention)</option>
                </select>
              </div>
              <div>
                <label className={label}>Acompte à la commande (%)</label>
                <input type="number" min="0" max="100" className={input} value={devis.acompte}
                  onChange={e => setField('acompte', e.target.value)} />
                <span className={`text-[10px] mt-0.5 block ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>
                  = {fmt(calcs.resteACharge * (parseFloat(devis.acompte) || 0) / 100)} à la signature
                </span>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <input type="checkbox" id="exoTVA" checked={!!devis.exonerationTVA}
                  onChange={e => setField('exonerationTVA', e.target.checked)}
                  className="accent-violet-600 w-4 h-4" />
                <div>
                  <label htmlFor="exoTVA" className={`text-xs font-bold cursor-pointer ${dm ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Exonération TVA
                  </label>
                  <div className={`text-[10px] ${dm ? 'text-zinc-500' : 'text-slate-400'}`}>Art. 261-4-4° CGI</div>
                </div>
                {!devis.exonerationTVA && (
                  <input type="number" min="0" max="100" className={`${input} w-16`} value={devis.tauxTVA}
                    onChange={e => setField('tauxTVA', e.target.value)} />
                )}
              </div>
            </div>
            <div className="mt-3">
              <label className={label}>Conditions d'annulation (CT L.6354-1) *</label>
              <textarea rows={2} className={`${input} resize-none`} value={devis.conditionsAnnulation}
                onChange={e => setField('conditionsAnnulation', e.target.value)} />
            </div>
          </div>

          {/* Alertes */}
          {calcs.tauxCouverture < 50 && (
            <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 text-xs ${dm ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span><strong>Alerte :</strong> le taux de couverture est inférieur à 50 %. Le reste à charge ({fmt(calcs.resteACharge)}) représente plus de la moitié du coût total. Vérifiez vos hypothèses de financement.</span>
            </div>
          )}
          {!devis.organisme.qualiopi && calcs.totalFinancements > 0 && (
            <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 text-xs ${dm ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span><strong>Attention :</strong> des financements sont renseignés mais la certification Qualiopi n'est pas cochée. Sans Qualiopi, les financements OPCO, CPF, Région et France Travail ne sont pas mobilisables.</span>
            </div>
          )}
          {!devis.organisme.numeroDA && (
            <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 text-xs ${dm ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span>Pensez à renseigner votre numéro de Déclaration d'Activité (DA) — mention obligatoire sur tout devis de formation (CT L.6351-1).</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
