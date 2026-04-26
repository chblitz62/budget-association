// Valorisation du Bénévolat — CRC 2018-06 (Axe 7)
//
// Référence : Règl. ANC 2018-06 (associations & fondations) — comptes de classe 8
// (Contributions volontaires en nature).
//
//   Compte 86 — Emplois des contributions volontaires (charges)
//   Compte 87 — Contributions volontaires (produits)
//   Équilibre obligatoire : 86 = 87 (neutralité résultat)
//
// Méthode de valorisation officielle :
//   Valorisation = Heures bénévoles × Taux horaire de référence
//
//   Taux horaire de référence :
//     - Bénévole standard : SMIC horaire × (1 + charges patronales)
//     - Bénévole qualifié (professionnel) : taux du marché équivalent (souvent 2-3× SMIC)
//
// Catégorie comptable (compte 87 ventilé) :
//   871 — Bénévolat
//   872 — Prestations en nature (mise à disposition locaux/matériel)
//   875 — Dons en nature (biens)

import { SMIC_MENSUEL, CHARGES_PATRONALES } from './constants';

// Heures travaillées dans 1 mois SMIC : 35 h × 4,33 sem = ~151,67 h
const HEURES_SMIC_MENSUEL = 35 * 52 / 12;

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

/**
 * Calcule le taux horaire de valorisation par défaut (SMIC chargé).
 * @returns {number} taux horaire €/h (ex : 17,11)
 */
export const calculerTauxHoraireDefault = () => {
  const smicHoraire = SMIC_MENSUEL / HEURES_SMIC_MENSUEL;
  return smicHoraire * (1 + CHARGES_PATRONALES);
};

/**
 * Valorise une contribution unique.
 *
 * @param {object} item — { heures, qualification, tauxHoraireCustom?, categorie? }
 * @returns {{ valorisation, tauxAppliqué, heures }}
 */
export const valoriserContribution = (item) => {
  const heures = safe(item?.heures);
  if (heures <= 0) return { valorisation: 0, tauxAppliqué: 0, heures: 0 };

  // Si taux personnalisé renseigné, on l'utilise prioritairement
  if (Number.isFinite(safe(item?.tauxHoraireCustom)) && safe(item?.tauxHoraireCustom) > 0) {
    const taux = safe(item.tauxHoraireCustom);
    return { valorisation: heures * taux, tauxAppliqué: taux, heures };
  }

  const tauxBase = calculerTauxHoraireDefault();
  // Coefficient selon qualification (standard / professionnel / expert)
  const coefficient = item?.qualification === 'expert' ? 3
    : item?.qualification === 'professionnel' ? 2
    : 1;
  const taux = tauxBase * coefficient;
  return { valorisation: heures * taux, tauxAppliqué: taux, heures };
};

const CATEGORIES_COMPTABLES = {
  benevolat:        { compte: '871', libelle: 'Bénévolat' },
  prestations_nature: { compte: '872', libelle: 'Prestations en nature' },
  dons_nature:      { compte: '875', libelle: 'Dons en nature' },
};

/**
 * Calcule la synthèse complète des contributions volontaires.
 *
 * @param {Array} benevoles — liste de bénévoles { id, nom, role, heures, qualification, categorie?, tauxHoraireCustom? }
 * @returns {{
 *   contributions: Array<{ ..., valorisation, tauxAppliqué }>,
 *   parCategorie: { [cat]: { compte, libelle, total, count } },
 *   totalValorisation: number,
 *   totalHeures: number,
 *   tauxMoyen: number,
 *   compte86: number,
 *   compte87: number,
 *   equilibre: boolean,
 *   tauxHoraireBase: number,
 * }}
 */
export const calculerSyntheseBenevolat = (benevoles = []) => {
  if (!Array.isArray(benevoles)) benevoles = [];

  const contributions = benevoles.map(b => {
    const { valorisation, tauxAppliqué, heures } = valoriserContribution(b);
    return {
      id: b.id || Math.random().toString(36).slice(2),
      nom: b.nom || 'Bénévole anonyme',
      role: b.role || '',
      qualification: b.qualification || 'standard',
      categorie: b.categorie || 'benevolat',
      heures,
      tauxAppliqué,
      valorisation,
    };
  });

  const totalValorisation = contributions.reduce((s, c) => s + c.valorisation, 0);
  const totalHeures = contributions.reduce((s, c) => s + c.heures, 0);
  const tauxMoyen = totalHeures > 0 ? totalValorisation / totalHeures : 0;

  // Ventilation par catégorie comptable (compte 87 ventilé)
  const parCategorie = {};
  Object.keys(CATEGORIES_COMPTABLES).forEach(catId => {
    const items = contributions.filter(c => c.categorie === catId);
    parCategorie[catId] = {
      ...CATEGORIES_COMPTABLES[catId],
      total: items.reduce((s, c) => s + c.valorisation, 0),
      count: items.length,
    };
  });

  return {
    contributions,
    parCategorie,
    totalValorisation,
    totalHeures,
    tauxMoyen,
    // Compte 86 (charges) = Compte 87 (produits) — équilibre comptable obligatoire CRC 2018-06
    compte86: totalValorisation,
    compte87: totalValorisation,
    equilibre: true, // toujours équilibré par construction
    tauxHoraireBase: calculerTauxHoraireDefault(),
  };
};

export const QUALIFICATIONS = [
  { id: 'standard',     label: 'Standard',     coef: 1, hint: 'SMIC chargé (taux légal de référence)' },
  { id: 'professionnel', label: 'Professionnel', coef: 2, hint: 'Compétences techniques équivalentes à un emploi qualifié' },
  { id: 'expert',       label: 'Expert',       coef: 3, hint: 'Expertise rare (médecin, avocat, ingénieur senior)' },
];

export const CATEGORIES_COMPTABLES_LIST = Object.entries(CATEGORIES_COMPTABLES).map(([id, c]) => ({ id, ...c }));
