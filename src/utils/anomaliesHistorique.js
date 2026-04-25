// Détection d'anomalies historiques (Phase 6 — Intelligence prédictive)
// Compare les données N-1 et le budget courant pour identifier sous-provisionnements,
// dérives de charges, ruptures de recettes, etc. avant validation budgétaire.

const sumServices = (services = [], field) =>
  services.reduce((sum, s) => sum + (parseFloat(s[field]) || 0), 0);

const totalN1 = (donneesN1, field) => {
  if (!donneesN1) return 0;
  return (parseFloat(donneesN1.direction?.[field]) || 0)
    + (parseFloat(donneesN1.poleSupport?.[field]) || 0)
    + sumServices(donneesN1.services, field);
};

/**
 * Détecte les anomalies entre l'exercice courant et N-1.
 * @param {object} donneesN1 — { annee, direction, poleSupport, services: [...] }
 * @param {object} kpiGlobaux — { totalRecettes, totalCharges, soldeGlobal, ... }
 * @param {Array}  services — services courants
 * @param {object} direction — direction courante
 * @param {object} poleSupport — pôle support courant
 * @param {object} globalParams — paramètres globaux
 * @param {number} masseSalarialeTotal — masse salariale totale courante
 * @returns {Array<{ id, lvl, categorie, titre, message, recommandation, ecart? }>}
 */
export const detecterAnomalies = ({
  donneesN1,
  kpiGlobaux,
  services = [],
  direction = {},
  poleSupport = {},
  globalParams = {},
  masseSalarialeTotal = 0,
  getBudgetService = null,
}) => {
  const anomalies = [];

  // ── 1. Provisions congés (toujours évaluable, indépendant de N-1) ────
  const provisions = globalParams.provisions || [];
  const provCongesEntry = provisions.find(p => p.id === 'conges');
  const tauxCongesActuel = parseFloat(provCongesEntry?.taux) || 0;
  if (tauxCongesActuel < 8) {
    anomalies.push({
      id: 'prov_conges_faible',
      lvl: tauxCongesActuel < 5 ? 'error' : 'warning',
      categorie: 'Provisions',
      titre: 'Provision congés payés sous le seuil CCN 66',
      message: `Taux actuel : ${tauxCongesActuel.toFixed(1)} % de la masse salariale. Le seuil de référence CCN 66 (1 jour acquis = 1/30 du salaire mensuel) est généralement de 8 à 10 %.`,
      recommandation: 'Ajuster le taux dans le bloc Provisions à 10 % minimum pour absorber les acquis non pris.',
    });
  }

  // ── 2. Provision IFC / retraite ──────────────────────────────────────
  const provRetraite = provisions.find(p => p.id === 'retraite');
  const tauxRetraite = parseFloat(provRetraite?.taux) || 0;
  if (tauxRetraite === 0) {
    anomalies.push({
      id: 'prov_ifc_zero',
      lvl: 'warning',
      categorie: 'Provisions',
      titre: 'Provision IFC non constituée',
      message: 'Aucune provision pour Indemnités de Fin de Carrière. Engagement social long terme non couvert.',
      recommandation: 'Provisionner annuellement par méthode actuarielle (PUC) ou externaliser via contrat IFC assureur.',
    });
  }

  // ── 3. Taxe sur les salaires — détection d'omission ──────────────────
  if (!globalParams.taxeSalaires && masseSalarialeTotal > 100000) {
    anomalies.push({
      id: 'taxe_salaires_inactive',
      lvl: 'warning',
      categorie: 'Fiscal',
      titre: 'Taxe sur les salaires inactive',
      message: 'Les associations non assujetties à la TVA sur tout ou partie de leur activité sont redevables de la taxe sur les salaires (CGI art. 231).',
      recommandation: 'Vérifier votre régime TVA et activer la taxe si applicable. Coût estimé entre 4 et 6 % de la masse salariale brute.',
    });
  }

  // ── 4. Charges patronales hors plage CCN 66 ──────────────────────────
  const tauxCharges = parseFloat(globalParams.tauxChargesPatronales) || 44;
  if (tauxCharges < 40 || tauxCharges > 50) {
    anomalies.push({
      id: 'charges_pat_hors_plage',
      lvl: 'warning',
      categorie: 'Masse salariale',
      titre: `Taux de charges patronales atypique (${tauxCharges} %)`,
      message: 'Plage CCN 66 attendue : 40 à 50 % (URSSAF + prévoyance CHORUM/OCIRP + médecine du travail).',
      recommandation: 'Confirmer avec le service paie. Une dérive impacte fortement les projections N+1/N+2.',
    });
  }

  // ── 5. Comparaison N-1 ───────────────────────────────────────────────
  if (donneesN1) {
    const recettesN1 = totalN1(donneesN1, 'recettes');
    const chargesN1  = totalN1(donneesN1, 'salaires') + totalN1(donneesN1, 'exploitation');
    const recettesN  = kpiGlobaux?.totalRecettes || 0;
    const chargesN   = kpiGlobaux?.totalCharges  || 0;

    // 5a. Chute de recettes ≥ 5 %
    if (recettesN1 > 0 && recettesN < recettesN1 * 0.95) {
      const baisse = ((recettesN1 - recettesN) / recettesN1) * 100;
      anomalies.push({
        id: 'recettes_chute',
        lvl: baisse > 10 ? 'error' : 'warning',
        categorie: 'Recettes',
        titre: `Chute des recettes vs N-1 (-${baisse.toFixed(1)} %)`,
        message: `Recettes N-1 : ${Math.round(recettesN1).toLocaleString('fr-FR')} € → N : ${Math.round(recettesN).toLocaleString('fr-FR')} €`,
        recommandation: 'Vérifier l\'attrition des subventions, OPCO et conventionnements. Identifier des relais (mécénat, formation continue).',
        ecart: baisse,
      });
    }

    // 5b. Dérive des charges au-delà de l'inflation + GVT + 5 %
    if (chargesN1 > 0) {
      const inflation = (parseFloat(globalParams.augmentationAnnuelle) || 2.5) / 100;
      const gvt = (parseFloat(globalParams.tauxGVT) || 1.5) / 100;
      const seuilDerive = chargesN1 * (1 + inflation + gvt + 0.05);
      if (chargesN > seuilDerive) {
        const hausse = ((chargesN - chargesN1) / chargesN1) * 100;
        anomalies.push({
          id: 'charges_derive',
          lvl: hausse > 15 ? 'error' : 'warning',
          categorie: 'Charges',
          titre: `Progression anormale des charges (+${hausse.toFixed(1)} %)`,
          message: `Hausse au-delà du seuil attendu (inflation ${(inflation*100).toFixed(1)} % + GVT ${(gvt*100).toFixed(1)} % + tolérance 5 %). Charges N-1 : ${Math.round(chargesN1).toLocaleString('fr-FR')} € → N : ${Math.round(chargesN).toLocaleString('fr-FR')} €`,
          recommandation: 'Identifier les postes en hausse (énergie, MS, sous-traitance) et arbitrer.',
          ecart: hausse,
        });
      }
    }

    // 5c. Services en déficit récurrent (N et N-1)
    if (getBudgetService) {
      const servicesN1Map = (donneesN1.services || []).reduce((m, s) => {
        if (!s.nom) return m;
        const cle = s.nom.toLowerCase().slice(0, 8);
        m[cle] = s;
        return m;
      }, {});
      services.forEach(srv => {
        const b = getBudgetService(srv);
        if (b.solde >= 0) return; // OK en N
        const cle = (srv.nom || '').toLowerCase().slice(0, 8);
        const sn1 = servicesN1Map[cle];
        if (!sn1) return;
        const chargesSrvN1 = (parseFloat(sn1.salaires) || 0) + (parseFloat(sn1.exploitation) || 0);
        const recettesSrvN1 = parseFloat(sn1.recettes) || 0;
        if (recettesSrvN1 < chargesSrvN1) {
          const deficitN1 = chargesSrvN1 - recettesSrvN1;
          anomalies.push({
            id: `deficit_recurrent_${srv.id}`,
            lvl: 'error',
            categorie: 'Pilotage',
            titre: `Déficit récurrent — service « ${srv.nom} »`,
            message: `Déficit N-1 : ${Math.round(deficitN1).toLocaleString('fr-FR')} € · Déficit prévu N : ${Math.round(-b.solde).toLocaleString('fr-FR')} €. Pattern de sous-financement structurel.`,
            recommandation: 'Renégocier le financement (subvention, prix de journée) ou arbitrer le périmètre de l\'activité.',
          });
        }
      });
    }

    // 5d. Sous-estimation masse salariale N (proxy : si charges salaires N < salaires N-1)
    const salairesN1 = totalN1(donneesN1, 'salaires');
    if (salairesN1 > 0 && masseSalarialeTotal > 0 && masseSalarialeTotal < salairesN1 * 0.97) {
      const baisse = ((salairesN1 - masseSalarialeTotal) / salairesN1) * 100;
      anomalies.push({
        id: 'ms_sous_estimation',
        lvl: 'warning',
        categorie: 'Masse salariale',
        titre: `Masse salariale N inférieure à N-1 (-${baisse.toFixed(1)} %)`,
        message: `MS N-1 : ${Math.round(salairesN1).toLocaleString('fr-FR')} € → MS N : ${Math.round(masseSalarialeTotal).toLocaleString('fr-FR')} €. Sans départ massif documenté, vérifier l\'oubli d\'agents ou d\'augmentations.`,
        recommandation: 'Croiser avec la liste paie ; ajouter les agents manquants ; intégrer GVT et primes.',
      });
    }
  }

  // ── 6. Coefficient BP réducteur sans justification ───────────────────
  const coeffBP = parseFloat(globalParams.coefficientBP);
  if (Number.isFinite(coeffBP) && coeffBP < 90) {
    anomalies.push({
      id: 'coefficient_bp_bas',
      lvl: 'info',
      categorie: 'Pilotage',
      titre: `Coefficient BP appliqué : ${coeffBP} %`,
      message: 'Un coefficient inférieur à 90 % minore artificiellement les charges et recettes du budget validé. Cohérent uniquement pour un scénario de stress test ou de réduction d\'activité.',
      recommandation: 'Avant validation, repasser le coefficient à 100 % ou justifier formellement la décote.',
    });
  }

  return anomalies;
};

export const compterAnomaliesParNiveau = (anomalies) => {
  return (anomalies || []).reduce((acc, a) => {
    acc[a.lvl] = (acc[a.lvl] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { error: 0, warning: 0, info: 0, total: 0 });
};
