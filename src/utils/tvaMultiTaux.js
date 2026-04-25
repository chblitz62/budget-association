// TVA multi-taux différenciée — Audit DAF Tier 2, F1
//
// Centres de formation médico-social : la formation professionnelle continue
// est exonérée de TVA (CGI Art. 261 4-4° a) sous réserve d'agrément, mais les
// activités annexes (locations, prestations annexes, ventes) sont assujetties
// aux taux normaux (5,5 / 10 / 20 %).
//
// Ce module agrège les recettes et charges par taux de TVA, calcule la TVA
// collectée / déductible et le solde de TVA à reverser ou à reporter.
//
// Champs attendus :
//   - Sur recette  : tauxTVA (0/5.5/10/20), tvaCollectee (bool, défaut true sauf si exonérée)
//   - Sur charge   : tauxTVA, saisieType ('HT'|'TTC'), tvaRecuperable (bool)
//
// Référence : CGI Art. 261 4-4°, BOI-TVA-CHAMP-30-10-20.

export const TAUX_TVA_USUELS = [
  { taux: 0,    label: 'Exonérée',    note: 'CGI 261 4-4° — formation continue agréée' },
  { taux: 5.5,  label: '5,5 %',       note: 'Livres, alimentation, équipements handicap' },
  { taux: 10,   label: '10 %',        note: 'Restauration, transport, médicaments non remboursés' },
  { taux: 20,   label: '20 %',        note: 'Taux normal — prestations annexes, locations' },
];

const safe = (n) => (Number.isFinite(parseFloat(n)) ? parseFloat(n) : 0);

const collecterRecettes = (direction, services, poleSupport) => {
  const items = [];
  (direction?.recettes || []).forEach(r => items.push({ ...r, _source: 'Siège' }));
  (poleSupport?.recettes || []).forEach(r => items.push({ ...r, _source: 'Pôle Support' }));
  (services || []).forEach(s => (s.recettes || []).forEach(r => items.push({ ...r, _source: s.nom || 'Service' })));
  return items;
};

const collecterCharges = (direction, services, poleSupport) => {
  const items = [];
  (direction?.chargesSiege || []).forEach(c => items.push({ ...c, _source: 'Siège', _type: 'chargesSiege' }));
  (direction?.exploitation || []).forEach(c => items.push({ ...c, _source: 'Siège', _type: 'exploitation' }));
  (poleSupport?.exploitation || []).forEach(c => items.push({ ...c, _source: 'Pôle Support', _type: 'exploitation' }));
  (services || []).forEach(s => (s.exploitation || []).forEach(c => items.push({ ...c, _source: s.nom || 'Service', _type: 'exploitation' })));
  return items;
};

/**
 * Calcule la synthèse TVA multi-taux à partir du budget courant.
 *
 * @returns {{
 *   parTaux: Array<{ taux, label, recettesHT, tvaCollectee, chargesHT, tvaDeductible, solde }>,
 *   totalTVACollectee, totalTVADeductible, soldeTVA, statut: 'creditTVA'|'aReverser'|'neutre',
 *   recettesParTaux: object, chargesParTaux: object,
 *   coefficientDeduction: number,
 * }}
 */
export const calculerSyntheseTVA = (direction, services, poleSupport, globalParams) => {
  const tauxDefaut = globalParams?.tauxTVAMoyen ?? 20;
  const bpFrac = (globalParams?.coefficientBP ?? 100) / 100;

  const recettes = collecterRecettes(direction, services, poleSupport);
  const charges = collecterCharges(direction, services, poleSupport);

  // ── Coefficient de déduction global ──────────────────────────────
  // Si l'asso a une activité mixte (FC exonérée + annexes assujetties),
  // le coefficient = CA assujetti / CA total. La TVA déductible est limitée à ce ratio.
  const totalRecettesAnnuelles = recettes.reduce((s, r) => s + safe(r.montant) * 12 * bpFrac, 0);
  const recettesAssujetties = recettes
    .filter(r => safe(r.tauxTVA) > 0 && r.tvaCollectee !== false)
    .reduce((s, r) => s + safe(r.montant) * 12 * bpFrac, 0);
  const coefficientDeduction = totalRecettesAnnuelles > 0 ? recettesAssujetties / totalRecettesAnnuelles : 1;

  // ── Agrégation par taux ──────────────────────────────────────────
  const tauxMap = new Map();
  TAUX_TVA_USUELS.forEach(t => {
    tauxMap.set(t.taux, { taux: t.taux, label: t.label, recettesHT: 0, tvaCollectee: 0, chargesHT: 0, tvaDeductible: 0, solde: 0 });
  });

  // Recettes : TVA collectée
  recettes.forEach(r => {
    const taux = r.tauxTVA != null ? safe(r.tauxTVA) : 0; // par défaut exonérée pour FC
    if (!tauxMap.has(taux)) tauxMap.set(taux, { taux, label: `${taux} %`, recettesHT: 0, tvaCollectee: 0, chargesHT: 0, tvaDeductible: 0, solde: 0 });
    const e = tauxMap.get(taux);
    const annuel = safe(r.montant) * 12 * bpFrac;
    e.recettesHT += annuel;
    if (r.tvaCollectee !== false) e.tvaCollectee += annuel * (taux / 100);
  });

  // Charges : TVA déductible (proratisée par coefficient si activité mixte)
  charges.forEach(c => {
    const tauxC = c.tauxTVA != null ? safe(c.tauxTVA) : tauxDefaut;
    if (!tauxMap.has(tauxC)) tauxMap.set(tauxC, { taux: tauxC, label: `${tauxC} %`, recettesHT: 0, tvaCollectee: 0, chargesHT: 0, tvaDeductible: 0, solde: 0 });
    const e = tauxMap.get(tauxC);
    const montant = safe(c.montant);
    const tauxFrac = tauxC / 100;
    const ht = c.saisieType === 'TTC' ? montant / (1 + tauxFrac) : montant;
    const annuel = ht * 12 * bpFrac;
    e.chargesHT += annuel;
    const recup = c.tvaRecuperable !== false;
    if (recup) e.tvaDeductible += annuel * tauxFrac * coefficientDeduction;
  });

  // Solde par taux
  tauxMap.forEach(e => { e.solde = e.tvaCollectee - e.tvaDeductible; });

  const parTaux = Array.from(tauxMap.values()).sort((a, b) => a.taux - b.taux);
  const totalTVACollectee = parTaux.reduce((s, e) => s + e.tvaCollectee, 0);
  const totalTVADeductible = parTaux.reduce((s, e) => s + e.tvaDeductible, 0);
  const soldeTVA = totalTVACollectee - totalTVADeductible;
  const statut = soldeTVA > 1 ? 'aReverser' : (soldeTVA < -1 ? 'creditTVA' : 'neutre');

  // Récap par source
  const recettesParTaux = {};
  recettes.forEach(r => {
    const taux = r.tauxTVA != null ? safe(r.tauxTVA) : 0;
    recettesParTaux[taux] = recettesParTaux[taux] || [];
    recettesParTaux[taux].push({ nom: r.nom, source: r._source, montantAnnuel: Math.round(safe(r.montant) * 12 * bpFrac) });
  });

  const chargesParTaux = {};
  charges.forEach(c => {
    const taux = c.tauxTVA != null ? safe(c.tauxTVA) : tauxDefaut;
    chargesParTaux[taux] = chargesParTaux[taux] || [];
    chargesParTaux[taux].push({ nom: c.nom, source: c._source, montantAnnuel: Math.round(safe(c.montant) * 12 * bpFrac) });
  });

  return {
    parTaux,
    totalTVACollectee,
    totalTVADeductible,
    soldeTVA,
    statut,
    coefficientDeduction,
    recettesParTaux,
    chargesParTaux,
  };
};
