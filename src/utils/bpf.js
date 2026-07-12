// BPF — Bilan Pédagogique et Financier (CERFA 10443*16) — Axe 10
//
// Obligation légale annuelle de tout Organisme de Formation déclaré (art. L.6352-11
// du Code du travail). À transmettre à la DREETS via le télé-service
// "bilanpedagogique.travail-emploi.gouv.fr" avant le 30 avril N+1.
//
// **Non transmission = retrait du Numéro de Déclaration d'Activité (NDA)**.
//
// Structure du formulaire :
//   - Cadre A : Identification de l'OF (NDA, SIRET, raison sociale, statut)
//   - Cadre B : Bilan financier 12 mois
//       B1. PRODUITS issus de :
//         B11 — Entreprises (financement direct employeur)
//         B12 — OPCO/OPCA (organismes paritaires)
//         B13 — Pouvoirs publics :
//           B131 — Conseils Régionaux (formation jeunes/adultes)
//           B132 — France Travail (ex-Pôle emploi)
//           B133 — État (autres dispositifs : DGEFP, PIC...)
//           B134 — Autres collectivités (département, commune, métropole)
//         B14 — Particuliers à leurs frais
//         B15 — OF (sous-traitance entrante)
//         B16 — Autres produits formation continue (CPF, apprentissage, contrat pro)
//       B2. CHARGES :
//         B21 — Achats prestations formation (sous-traitance sortante)
//         B22 — Salaires bruts formateurs internes
//         B23 — Charges sociales/fiscales sur ces salaires
//         B24 — Autres dépenses (locaux, matériels, déplacements)
//   - Cadre C : Stagiaires & heures-stagiaires par origine de financement
//
// Classification automatique par regex sur libellés des recettes/charges.
// Cohérent avec compteResultat.js (mêmes patterns enrichis).

import { calculerSalaireAnnuel } from './calculations';
import { CHARGES_PATRONALES } from './constants';

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);
const round = (n) => Math.round(n || 0);

// ─── Patterns de classification — origine PRODUITS ──────────────────────
// Ordre d'évaluation IMPORTANT : les patterns spécifiques avant les généraux
// (ex. "OPCO" doit matcher avant "formation continue")
const PATTERNS_PRODUIT = [
  { code: 'B12', libelle: 'OPCO / OPCA',
    regex: /opco|opca|constructys|afdas|atlas\b|akto|ocapiat|uniformation|opcommerce|opco\s?santé|opco\s?mobilités|opco\s?ep|2i/i },
  { code: 'B131', libelle: 'Conseils Régionaux',
    regex: /région|region|conseil\s?régional|conseil\s?regional/i },
  { code: 'B132', libelle: 'France Travail (ex-Pôle emploi)',
    regex: /france\s?travail|pôle\s?emploi|pole\s?emploi|pôle-emploi|aif|afpr/i },
  { code: 'B133', libelle: 'État (autres dispositifs)',
    regex: /\bétat\b|\betat\b|ministère|ministere|dgefp|pic\b|plan\s?investissement\s?compétences|fse\+?\b|feder|ars\b/i },
  { code: 'B134', libelle: 'Autres collectivités',
    regex: /département|departement|commune|métropole|metropole|intercommunal|epci\b|cd\b/i },
  { code: 'B16', libelle: 'CPF / Apprentissage / Contrat pro',
    regex: /\bcpf\b|apprenti|professionnalisation|contrat\s?pro\b|alternance/i },
  { code: 'B14', libelle: 'Particuliers à leurs frais',
    regex: /particulier|auto-?financ|individu|personnel\b/i },
  { code: 'B15', libelle: 'OF (sous-traitance entrante)',
    regex: /sous-?traitance\s?entrante|co-?traitance|of\s?partenaire/i },
  { code: 'B11', libelle: 'Entreprises (financement direct)',
    regex: /entreprise|convention\s?entreprise|cifa|fc\b|formation\s?continue|prestation/i },
];

const CODES_PRODUITS = ['B11', 'B12', 'B131', 'B132', 'B133', 'B134', 'B14', 'B15', 'B16'];

/**
 * Classe une recette dans une case du Cadre B1.
 * Retourne le code (B11-B16, B131-B134) ou 'B11' par défaut (entreprises).
 */
export const classifierRecette = (libelle) => {
  const nom = (libelle || '').toString();
  for (const pattern of PATTERNS_PRODUIT) {
    if (pattern.regex.test(nom)) return pattern.code;
  }
  return 'B11';
};

// ─── Patterns CHARGES ──────────────────────────────────────────────────
const REGEX_SOUS_TRAITANCE = /vacataire|intervenant\s?externe|sous-?traitance(?!\s?entrante)|prestataire\s?formation|formateur\s?externe|honoraire\s?formateur/i;

export const estChargeSousTraitance = (libelle) => REGEX_SOUS_TRAITANCE.test(libelle || '');

/**
 * Génère le BPF complet.
 *
 * @param {object} direction
 * @param {Array}  services
 * @param {object} poleSupport
 * @param {Array}  poolRH
 * @param {object} globalParams — peut contenir bpfIdentite, heuresStagiairesParService, montantSegurETP
 * @param {number} anneeRef
 */
export const genererBPF = (direction, services = [], poleSupport, poolRH = [], globalParams = {}, anneeRef = new Date().getFullYear()) => {
  const bpFrac = (safe(globalParams.coefficientBP) || 100) / 100;
  const segurETP = safe(globalParams.montantSegurETP) || 238;

  // ─── Cadre A — Identification ──────────────────────────────────────
  const identite = {
    nda: globalParams.bpfIdentite?.nda || '',
    siret: globalParams.bpfIdentite?.siret || '',
    raisonSociale: globalParams.bpfIdentite?.raisonSociale || '',
    adresse: globalParams.bpfIdentite?.adresse || '',
    statutJuridique: globalParams.bpfIdentite?.statutJuridique || 'Association loi 1901',
    anneeExercice: anneeRef,
  };

  // ─── Cadre B1 — PRODUITS par origine ───────────────────────────────
  const allRecettes = [
    ...(direction?.recettes || []),
    ...(poleSupport?.recettes || []),
    ...(services || []).flatMap(s => (s.recettes || []).map(r => ({ ...r, _serviceId: s.id }))),
  ];

  const produits = Object.fromEntries(CODES_PRODUITS.map(c => [c, { code: c, montant: 0, lignes: [] }]));
  // Libellés pour affichage
  const LIBELLES_PRODUITS = {
    B11:  'Entreprises pour la formation de leurs salariés',
    B12:  'Organismes paritaires (OPCO/OPCA)',
    B131: 'Conseils Régionaux',
    B132: 'France Travail (ex-Pôle emploi)',
    B133: 'État (autres dispositifs)',
    B134: 'Autres collectivités publiques',
    B14:  'Particuliers à leurs frais',
    B15:  'Autres OF (sous-traitance entrante)',
    B16:  'CPF / Apprentissage / Contrats pro',
  };
  Object.keys(produits).forEach(c => { produits[c].libelle = LIBELLES_PRODUITS[c]; });

  allRecettes.forEach(r => {
    if (!r) return;
    const code = classifierRecette(r.nom);
    const montantAnnuel = safe(r.montant) * 12 * bpFrac;
    if (montantAnnuel === 0) return;
    produits[code].montant += montantAnnuel;
    produits[code].lignes.push({
      nom: r.nom || '(sans libellé)',
      montantMensuel: safe(r.montant),
      montantAnnuel,
      serviceId: r._serviceId || null,
    });
  });

  // Total Cadre B1 (B13 = somme des B131..B134)
  const totalB13 = produits.B131.montant + produits.B132.montant + produits.B133.montant + produits.B134.montant;
  const totalProduits = CODES_PRODUITS.reduce((s, c) => s + produits[c].montant, 0);

  // ─── Cadre B2 — CHARGES ────────────────────────────────────────────
  // B21 — Sous-traitance pédagogique sortante (achats formateurs externes)
  const allExploitation = [
    ...(direction?.exploitation || []),
    ...(poleSupport?.exploitation || []),
    ...(services || []).flatMap(s => s.exploitation || []),
  ];
  const lignesSousTraitance = allExploitation.filter(e => estChargeSousTraitance(e?.nom));
  const B21 = lignesSousTraitance.reduce((s, e) => s + (safe(e.montant) * 12 * bpFrac), 0);

  // B22 — Salaires bruts formateurs internes (rôle formateur)
  // On somme les salaires bruts annuels des agents flagés "formateur" dans direction/services/poleSupport/poolRH
  const tousAgents = [
    ...(direction?.personnel || []),
    ...(poleSupport?.personnel || []),
    ...(services || []).flatMap(s => s.personnel || []),
    ...(poolRH || []),
  ];
  const estFormateur = (agent) => {
    const role = (agent?.role || '').toLowerCase();
    return role === 'formateur' || /formateur/i.test(agent?.titre || '');
  };
  const formateurs = tousAgents.filter(estFormateur);

  let B22 = 0; // brut formateurs (salaire + Ségur, hors charges patronales)
  let B23 = 0; // charges sociales sur formateurs

  formateurs.forEach(f => {
    const etp = safe(f.etp) || 1;
    const segurMensuel = f.segur === true ? segurETP : safe(f.segur);
    const calc = calculerSalaireAnnuel(safe(f.salaire), etp, segurMensuel, f.typeContrat || 'CDI', f.tauxChargesManuel);
    B22 += (calc.brut || 0) + (calc.brutSegur || 0);
    B23 += calc.charges || 0;
  });
  B22 = round(B22 * bpFrac);
  B23 = round(B23 * bpFrac);

  // B24 — Autres dépenses (exploitation hors sous-traitance)
  const lignesAutresExpl = allExploitation.filter(e => !estChargeSousTraitance(e?.nom));
  const B24 = lignesAutresExpl.reduce((s, e) => s + (safe(e.montant) * 12 * bpFrac), 0);

  const charges = {
    B21: { code: 'B21', libelle: 'Achats prestations formation (sous-traitance)', montant: round(B21), lignes: lignesSousTraitance.map(l => ({ nom: l.nom, montantMensuel: safe(l.montant), montantAnnuel: safe(l.montant) * 12 * bpFrac })) },
    B22: { code: 'B22', libelle: 'Salaires bruts formateurs internes', montant: B22, nbFormateurs: formateurs.length },
    B23: { code: 'B23', libelle: 'Charges sociales et fiscales formateurs', montant: B23 },
    B24: { code: 'B24', libelle: 'Autres dépenses (locaux, matériels, déplacements)', montant: round(B24) },
  };
  const totalCharges = charges.B21.montant + charges.B22.montant + charges.B23.montant + charges.B24.montant;

  // ─── Cadre C — Stagiaires & Heures-stagiaires ──────────────────────
  // Effectif total = somme effectif actuel toutes promos
  const heuresParService = globalParams.heuresStagiairesParService || {};
  const heuresStagiairesDefaut = safe(globalParams.heuresStagiairesDefaut) || 1500;

  let totalNbStagiaires = 0;
  let totalHeuresStagiaires = 0;

  (services || []).forEach(s => {
    const promosFlat = [];
    const promosObj = s.promos || {};
    Object.values(promosObj).forEach(items => {
      if (!Array.isArray(items)) return;
      items.forEach(item => {
        if (!item) return;
        if (typeof item.effectifInitial === 'number') {
          promosFlat.push(item);
        } else if (Array.isArray(item.promos)) {
          item.promos.forEach(p => { if (p && typeof p.effectifInitial === 'number') promosFlat.push(p); });
        }
      });
    });

    const heuresService = safe(heuresParService[s.id]) || heuresStagiairesDefaut;
    promosFlat.forEach(p => {
      const effectifInit = safe(p.effectifInitial);
      const abandons = p.abandons ? Object.values(p.abandons).reduce((acc, v) => acc + safe(v), 0) : 0;
      const effectifActuel = Math.max(0, effectifInit - abandons);
      totalNbStagiaires += effectifActuel;
      totalHeuresStagiaires += effectifActuel * heuresService;
    });
  });

  // Ventilation des stagiaires/heures par origine — proportionnelle aux recettes
  const ventilerProRata = (total) => {
    if (totalProduits === 0) return Object.fromEntries(CODES_PRODUITS.map(c => [c, 0]));
    const out = {};
    CODES_PRODUITS.forEach(c => {
      out[c] = round(total * (produits[c].montant / totalProduits));
    });
    return out;
  };
  const stagiairesParOrigine = ventilerProRata(totalNbStagiaires);
  const heuresParOrigine = ventilerProRata(totalHeuresStagiaires);

  // ─── Validation cohérence ──────────────────────────────────────────
  const alertes = [];
  if (!identite.nda)            alertes.push({ niveau: 'danger',  message: 'NDA (Numéro Déclaration Activité) non renseigné — obligatoire pour validation BPF.' });
  if (!identite.siret)          alertes.push({ niveau: 'danger',  message: 'SIRET non renseigné.' });
  if (!identite.raisonSociale)  alertes.push({ niveau: 'danger',  message: 'Raison sociale non renseignée.' });
  if (totalProduits === 0)      alertes.push({ niveau: 'warning', message: 'Aucun produit de formation détecté. Vérifier que les recettes sont saisies dans les services.' });
  if (formateurs.length === 0)  alertes.push({ niveau: 'warning', message: 'Aucun formateur interne identifié (rôle "formateur"). Vérifier la classification du personnel.' });
  if (totalNbStagiaires === 0)  alertes.push({ niveau: 'warning', message: 'Aucun stagiaire actif détecté (vérifier les effectifs des promos).' });
  if (totalProduits > 0 && totalCharges > totalProduits * 1.5) {
    alertes.push({ niveau: 'warning', message: `Charges (${round(totalCharges).toLocaleString('fr-FR')} €) > 150 % des produits — vérifier la cohérence des données.` });
  }

  return {
    identite,
    cadreB1: {
      produits,
      totalB13,
      totalProduits: round(totalProduits),
    },
    cadreB2: {
      charges,
      totalCharges: round(totalCharges),
      totalSalairesEtCharges: charges.B22.montant + charges.B23.montant,
      tauxChargesEffectif: charges.B22.montant > 0 ? round((charges.B23.montant / charges.B22.montant) * 100) : 0,
    },
    cadreC: {
      totalNbStagiaires: round(totalNbStagiaires),
      totalHeuresStagiaires: round(totalHeuresStagiaires),
      stagiairesParOrigine,
      heuresParOrigine,
      heuresMoyennesParStagiaire: totalNbStagiaires > 0 ? round(totalHeuresStagiaires / totalNbStagiaires) : 0,
    },
    alertes,
    isValide: alertes.filter(a => a.niveau === 'danger').length === 0,
  };
};

/**
 * Recommandation contextuelle DAF selon l'état du BPF.
 */
export const recommendationBPF = (bpf) => {
  if (!bpf) return '';
  const nbErreurs  = bpf.alertes.filter(a => a.niveau === 'danger').length;
  const nbWarnings = bpf.alertes.filter(a => a.niveau === 'warning').length;

  if (nbErreurs > 0) {
    return `✕ ${nbErreurs} erreur${nbErreurs > 1 ? 's' : ''} bloquante${nbErreurs > 1 ? 's' : ''}. Compléter l'identification de l'OF (Cadre A) avant export. Rappel : non-transmission BPF avant le 30 avril N+1 = retrait du NDA (Code travail art. L.6352-11).`;
  }
  if (nbWarnings > 0) {
    return `⚠ ${nbWarnings} alerte${nbWarnings > 1 ? 's' : ''} de cohérence. Le BPF est techniquement exportable mais des données paraissent incomplètes. Vérifier avant transmission DREETS.`;
  }
  return `✓ BPF prêt à être transmis (${bpf.cadreB1.totalProduits.toLocaleString('fr-FR')} € de produits formation, ${bpf.cadreC.totalNbStagiaires} stagiaires, ${bpf.cadreC.totalHeuresStagiaires.toLocaleString('fr-FR')} heures-stagiaires). Soumission via bilanpedagogique.travail-emploi.gouv.fr avant le 30 avril ${bpf.identite.anneeExercice + 1}.`;
};
