// Glossaire centralisé — Termes techniques DAF / Pédagogie financière
// Structure : Définition → Impact sur le solde → Levier d'action conseillé
// Utilisé par : Tooltips, Panneau Éco-Fin, exports PDF synthèse

export const GLOSSARY = [
  {
    id: 'bfr',
    term: 'BFR — Besoin en Fonds de Roulement',
    categorie: 'tresorerie',
    definition:
      "Trésorerie nécessaire pour couvrir le décalage entre les encaissements (subventions, OPCO) et les décaissements (salaires, fournisseurs). BFR = Créances + Stocks − Dettes fournisseurs/sociales.",
    impact:
      "Un BFR élevé immobilise de la trésorerie sans générer de produit. Chaque jour de retard de paiement OPCO augmente le BFR proportionnellement aux charges quotidiennes.",
    levier:
      "Négocier les délais de paiement clients (raccourcir) et fournisseurs (allonger) ; suivre la rotation des créances ; activer les acomptes sur subvention.",
  },
  {
    id: 'fillon',
    term: 'Réduction Fillon (générale de cotisations)',
    categorie: 'masse_salariale',
    definition:
      "Allègement de cotisations patronales URSSAF sur les bas salaires (jusqu'à 1,6 SMIC). Calcul dégressif : maximum à 1 SMIC, nul à 1,6 SMIC.",
    impact:
      "Réduit mécaniquement les charges patronales sur les contrats à temps partiel ou les rémunérations modestes. Impact direct sur le coût employeur.",
    levier:
      "Recensement annuel des agents éligibles ; vérifier l'application correcte sur les fiches de paie ; intégrer la réduction dans les budgets prévisionnels.",
  },
  {
    id: 'point_mort',
    term: 'Point Mort (seuil de rentabilité)',
    categorie: 'pilotage',
    definition:
      "Niveau d'activité (en € de recettes ou en nombre d'étudiants) à partir duquel les recettes couvrent l'ensemble des charges fixes + variables.",
    impact:
      "Sous le point mort, chaque mois aggrave le déficit. Au-dessus, l'association capitalise une marge de sécurité pour les imprévus.",
    levier:
      "Réduire les charges fixes (renégociation loyers, mutualisation) ou augmenter les recettes contractuelles (CFA, formation continue) pour abaisser le point mort.",
  },
  {
    id: 'taxe_salaires',
    term: 'Taxe sur les Salaires (CGI art. 231)',
    categorie: 'fiscal',
    definition:
      "Taxe due par les employeurs non assujettis à la TVA sur tout ou partie de leur activité. Barème progressif 2026 : 4,25 % jusqu'à 8 985 €, 8,50 % de 8 986 à 17 936 €, 13,60 % au-delà.",
    impact:
      "Charge fiscale annuelle qui s'ajoute aux cotisations sociales. Pour une association non assujettie, peut atteindre 4 à 6 % de la masse salariale brute.",
    levier:
      "Vérifier l'éligibilité à l'abattement associations (article 1679 A : 22 535 € en 2026) ; analyser l'opportunité d'un assujettissement partiel à la TVA.",
  },
  {
    id: 'ifc',
    term: 'IFC — Indemnités de Fin de Carrière',
    categorie: 'provisions',
    definition:
      "Indemnités versées au moment du départ à la retraite des salariés. Calcul gradué selon l'ancienneté et la CCN 66 (du 1/4 mois au 6 mois de salaire).",
    impact:
      "Engagement social long terme à provisionner annuellement. Sous-provisionnement crée un risque comptable et un choc de trésorerie au moment des départs.",
    levier:
      "Provision annuelle calculée par méthode actuarielle (PUC) ; externaliser via contrat IFC auprès d'un assureur pour lisser la charge.",
  },
  {
    id: 'segur',
    term: 'Prime Ségur (médico-social)',
    categorie: 'masse_salariale',
    definition:
      "Prime mensuelle brute de 238 €/ETP versée aux personnels du secteur médico-social éligibles (CCN 66/FEHAP/CHRS). Soumise aux charges patronales.",
    impact:
      "Coût employeur ≈ 343 €/ETP/mois (avec charges 44 %), soit ~4 100 €/ETP/an. Compensée pour les structures financées par l'État/CD.",
    levier:
      "Recenser précisément les agents éligibles ; remonter la créance Ségur dans les budgets ; sécuriser le financement compensatoire.",
  },
  {
    id: 'fonds_roulement',
    term: 'Fonds de Roulement (FR)',
    categorie: 'tresorerie',
    definition:
      "Excédent des ressources stables (capitaux propres + dettes long terme) sur les emplois stables (immobilisations). FR = capitaux permanents − immobilisations nettes.",
    impact:
      "Doit couvrir le BFR. Un FR < BFR contraint à découvert bancaire. Un FR robuste = autonomie financière.",
    levier:
      "Reconstituer via des excédents annuels affectés aux réserves ; négocier des prêts long terme pour adosser aux investissements.",
  },
  {
    id: 'opca_opco',
    term: 'OPCO — Opérateur de Compétences',
    categorie: 'recettes',
    definition:
      "Organisme financeur de la formation professionnelle. Verse les fonds après réalisation et facturation, avec un délai moyen de 60 à 90 jours.",
    impact:
      "Décalage de trésorerie significatif : entre la prestation facturée et le règlement, l'association porte la charge cash.",
    levier:
      "Activer les acomptes contractuels ; suivre hebdomadairement les en-attente ; relances systématisées ≥ 45 j.",
  },
  {
    id: 'gvt',
    term: 'GVT — Glissement Vieillesse Technicité',
    categorie: 'masse_salariale',
    definition:
      "Hausse automatique de la masse salariale liée aux progressions de carrière (ancienneté, échelons, promotions). Indépendante des revalorisations générales.",
    impact:
      "Augmentation annuelle structurelle de 1 à 2 % de la masse salariale dans le secteur médico-social, même sans embauche.",
    levier:
      "Anticiper dans les projections N+1/N+2 ; arbitrer entre GVT et embauches ; piloter la pyramide des âges.",
  },
  {
    id: 'taux_couverture',
    term: 'Taux de Couverture',
    categorie: 'pilotage',
    definition:
      "Ratio Recettes ÷ Charges × 100. Exprime la capacité des produits à financer les charges. Cible : 100 % minimum.",
    impact:
      "Sous 100 %, l'exercice puise dans les réserves. Sous le seuil d'alerte (par défaut 90 %), une intervention urgente est nécessaire.",
    levier:
      "Diversifier les recettes (subventions, prestations, mécénat) ; rationaliser les charges variables ; renégocier les marchés fournisseurs.",
  },
  {
    id: 'amortissement',
    term: 'Amortissement (PCG 214-9)',
    categorie: 'comptable',
    definition:
      "Constatation comptable de la dépréciation d'un bien sur sa durée d'utilisation. Calculé au prorata temporis (au mois près) à partir de la date de mise en service.",
    impact:
      "Charge non décaissable mais qui réduit le résultat. Affecte le taux de couverture sans impact sur la trésorerie.",
    levier:
      "Politique d'amortissement cohérente (durées CCNSP) ; capitaliser les investissements > 500 € ; dotations annuelles intégrées au budget.",
  },
  {
    id: 'urssaf',
    term: 'Cotisations URSSAF (BFR)',
    categorie: 'tresorerie',
    definition:
      "Cotisations sociales reversées trimestriellement (ou mensuellement > 9 salariés). Décalage moyen de 45 jours entre le fait générateur (paie) et le décaissement.",
    impact:
      "Diminue le BFR car constituent une dette sociale au passif. Plus le délai est long, plus le BFR baisse mécaniquement.",
    levier:
      "Calendrier strict de déclaration (DSN) ; éviter les pénalités de retard (10 %) ; optimiser le calendrier des virements.",
  },
];

export const CATEGORIES = {
  tresorerie:      { label: 'Trésorerie',      color: 'cyan'    },
  masse_salariale: { label: 'Masse salariale', color: 'blue'    },
  pilotage:        { label: 'Pilotage',        color: 'teal'    },
  fiscal:          { label: 'Fiscal',          color: 'rose'    },
  provisions:      { label: 'Provisions',      color: 'amber'   },
  recettes:        { label: 'Recettes',        color: 'emerald' },
  comptable:       { label: 'Comptable',       color: 'violet'  },
};

export const findGlossaryTerm = (id) => GLOSSARY.find(g => g.id === id);

export const searchGlossary = (query) => {
  if (!query) return GLOSSARY;
  const q = query.toLowerCase().trim();
  return GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(q) ||
    g.definition.toLowerCase().includes(q) ||
    g.id.includes(q)
  );
};
