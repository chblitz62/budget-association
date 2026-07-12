// Ventilation des charges d'exploitation par nature (classes PCG 60/61/62/65)
//
// Remplace l'ancien éclatement forfaitaire 35/30/20/15 % (non auditable) par une
// classification ligne à ligne sur les libellés réellement saisis :
//   60 — Achats (énergie, fournitures, matières)
//   61 — Services extérieurs (loyers, entretien, assurances, sous-traitance)
//   62 — Autres services extérieurs (honoraires, communication, déplacements…)
//   65 — Autres charges de gestion courante (et lignes non classées, signalées)
//
// Invariant : la somme des 4 classes est exactement égale au total des charges
// d'exploitation des budgets (mêmes items, même formule TVA, même coefficient BP)
// — le compte de résultat reste réconcilié avec la source unique.

import { _montantReelExploitation } from './calculations';

/**
 * Classe une ligne de charge d'exploitation par son libellé.
 * @returns {'60'|'61'|'62'|'65'|null} null = non classé (le CR replie en 65 en le signalant)
 */
export const classifierChargeExploitation = (libelle = '') => {
  const l = (libelle || '').toLowerCase();
  if (!l.trim()) return null;
  // 61 — Services extérieurs
  if (/loyer|bail|location|cr[ée]dit.?bail|entretien|maintenance|r[ée]paration|assurance|nettoyage|documentation|sous.?trait/.test(l)) return '61';
  // 62 — Autres services extérieurs
  if (/honorair|comptab|commissaire|avocat|juridique|conseil|communication|publicit|impression|annonce|d[ée]placement|mission|r[ée]ception|voyage|poste|affranchissement|t[ée]l[ée]phon|internet|t[ée]l[ée]com|bancaire|banque|cotisation|adh[ée]sion|recrutement|int[ée]rim|gardiennage/.test(l)) return '62';
  // 65 — Autres charges de gestion courante
  if (/redevance|licence|sacem|droit.{0,4}auteur|perte|cr[ée]ance|irr[ée]couvrable|amende|p[ée]nalit/.test(l)) return '65';
  // 60 — Achats
  if (/achat|fourniture|[ée]nergie|[ée]lectric|gaz\b|eau\b|chauffage|fioul|fuel|carburant|essence|aliment|repas|cantine|p[ée]dagog|mati[èe]re|[ée]quipement|mat[ée]riel|produit|papeterie|consommable|v[êe]tement|pharmac/.test(l)) return '60';
  return null;
};

const LIBELLES = {
  '60': 'Achats (énergie, fournitures, matières)',
  '61': 'Services extérieurs (loyers, entretien, assurances)',
  '62': 'Autres services extérieurs (honoraires, communication)',
  '65': 'Autres charges de gestion courante',
};

/**
 * Ventile toutes les charges d'exploitation (Direction, Pôle Support, Services)
 * dans les classes 60/61/62/65, ligne à ligne.
 *
 * Reproduit exactement les règles de montant des moteurs de budget :
 * montant ligne = montantReel(TVA) × 12 × coefficientBP. Le format legacy de la
 * Direction (loyer / charges / autresCharges) est ventilé loyer→61, charges→60,
 * autresCharges→65 (sans ajustement TVA, comme calculerBudgetDirection).
 *
 * @returns {{
 *   classes: { '60': number, '61': number, '62': number, '65': number },
 *   lignes: Array<{ entite, nom, montant, compte, classement: 'auto'|'defaut' }>,
 *   totalVentile: number,
 *   nbNonClasses: number,   Lignes repliées en 65 faute de mot-clé reconnu
 * }}
 */
export const ventilerChargesExploitation = (direction, services, poleSupport, globalParams) => {
  const tvaParams = globalParams?.gestionTVA
    ? { gestionTVA: true, tauxTVAMoyen: globalParams.tauxTVAMoyen ?? 20 }
    : null;
  const bpFrac = (globalParams?.coefficientBP ?? 100) / 100;

  const lignes = [];
  const pushItems = (items, entite) => {
    (Array.isArray(items) ? items : []).forEach(item => {
      if (!item || typeof item !== 'object') return;
      const montant = _montantReelExploitation(item, tvaParams) * 12 * bpFrac;
      if (montant === 0) return;
      const auto = classifierChargeExploitation(item.nom);
      lignes.push({
        entite,
        nom: item.nom || '(sans libellé)',
        montant,
        compte: auto ?? '65',
        classement: auto ? 'auto' : 'defaut',
      });
    });
  };

  if (direction && typeof direction === 'object') {
    if (direction.chargesSiege) {
      pushItems(direction.chargesSiege, 'Direction / Siège');
    } else {
      // Format legacy : champs scalaires (pas d'ajustement TVA, cf. calculerBudgetDirection)
      const legacy = [
        { nom: 'Loyer', montant: direction.loyer || 0, compte: '61' },
        { nom: 'Charges (fluides)', montant: direction.charges || 0, compte: '60' },
        { nom: 'Autres charges', montant: direction.autresCharges || 0, compte: '65' },
      ];
      legacy.forEach(l => {
        const montant = l.montant * 12 * bpFrac;
        if (montant === 0) return;
        lignes.push({ entite: 'Direction / Siège', nom: l.nom, montant, compte: l.compte, classement: 'auto' });
      });
    }
    pushItems(direction.exploitation, 'Direction / Siège');
  }
  if (poleSupport && typeof poleSupport === 'object') {
    pushItems(poleSupport.exploitation, 'Pôle Support');
  }
  (services || []).forEach(s => {
    if (!s || typeof s !== 'object') return;
    pushItems(s.exploitation, s.nom || 'Service');
  });

  const classes = { '60': 0, '61': 0, '62': 0, '65': 0 };
  lignes.forEach(l => { classes[l.compte] += l.montant; });
  const totalVentile = lignes.reduce((s, l) => s + l.montant, 0);
  const nbNonClasses = lignes.filter(l => l.classement === 'defaut').length;

  return { classes, lignes, totalVentile, nbNonClasses };
};

export const LIBELLES_CLASSES_EXPLOITATION = LIBELLES;
