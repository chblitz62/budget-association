import { describe, it, expect } from 'vitest';
import { genererLignesFEC, serialiserFEC } from '../fecExport';

const minimalDirection = {
  personnel: [
    { id: 'p1', titre: 'Directeur', salaire: 4500, etp: 1, segur: false, anneeNaissance: 1975, dateEntree: 2010 },
  ],
  recettes: [{ id: 'r1', nom: 'Subv. Région', montant: 2000 }],
  chargesSiege: [{ id: 'c1', nom: 'Loyer', montant: 1500 }],
  investissements: {},
};

const minimalGlobalParams = {
  anneeExercice: 2026,
  siren: '123456789',
  augmentationAnnuelle: 0,
  tauxGVT: 0,
  inflationEnergie: 0,
  inflationLoyers: 0,
  inflationAutres: 0,
  delaiPaiementClients: 30,
  delaiPaiementFournisseurs: 30,
  delaiPaiementURSSAF: 45,
  montantSegurETP: 238,
  seuilCouverture: 90,
  coefficientBP: 100,
  provisions: [],
};

describe('fecExport — conformité BOI-CF-IOR-60-40', () => {
  it('génère un FEC avec exactement 18 colonnes et chaque ligne a le bon nombre de champs', () => {
    const { lines } = genererLignesFEC(minimalDirection, [], null, minimalGlobalParams);
    const serialized = serialiserFEC(lines);
    const rows = serialized.split('\r\n');
    expect(rows[0].split('|').length).toBe(18);
    rows.forEach(r => expect(r.split('|').length).toBe(18));
  });

  it('chaque écriture est équilibrée (ΣDébit = ΣCrédit par EcritureNum)', () => {
    const { lines } = genererLignesFEC(minimalDirection, [], null, minimalGlobalParams);
    const parEcriture = {};
    lines.forEach(l => {
      parEcriture[l.EcritureNum] = parEcriture[l.EcritureNum] || { d: 0, c: 0 };
      parEcriture[l.EcritureNum].d += parseFloat(l.Debit.replace(',', '.'));
      parEcriture[l.EcritureNum].c += parseFloat(l.Credit.replace(',', '.'));
    });
    Object.values(parEcriture).forEach(({ d, c }) => {
      expect(Math.abs(d - c)).toBeLessThan(0.01);
    });
  });

  it('Debit XOR Credit > 0 (jamais les deux non nuls sur la même ligne)', () => {
    const { lines } = genererLignesFEC(minimalDirection, [], null, minimalGlobalParams);
    lines.forEach(l => {
      const d = parseFloat(l.Debit.replace(',', '.'));
      const c = parseFloat(l.Credit.replace(',', '.'));
      expect(d > 0 ? c === 0 : true).toBe(true);
      expect(c > 0 ? d === 0 : true).toBe(true);
    });
  });

  it('dates au format AAAAMMJJ', () => {
    const { lines } = genererLignesFEC(minimalDirection, [], null, minimalGlobalParams);
    lines.forEach(l => {
      expect(l.EcritureDate).toMatch(/^\d{8}$/);
      expect(l.PieceDate).toMatch(/^\d{8}$/);
      expect(l.ValidDate).toMatch(/^\d{8}$/);
    });
  });

  it('montants au format virgule décimale (pas de point ni de séparateur de milliers)', () => {
    const { lines } = genererLignesFEC(minimalDirection, [], null, minimalGlobalParams);
    lines.forEach(l => {
      expect(l.Debit).toMatch(/^\d+,\d{2}$/);
      expect(l.Credit).toMatch(/^\d+,\d{2}$/);
    });
  });

  it('génère plusieurs écritures pour direction (salaires, charges patronales, exploitation, recettes)', () => {
    const { stats } = genererLignesFEC(minimalDirection, [], null, minimalGlobalParams);
    expect(stats.ecritures).toBeGreaterThanOrEqual(3);
    expect(stats.totalDebit).toBeCloseTo(stats.totalCredit, 1);
  });

  it('en-tête CSV contient les 18 colonnes obligatoires dans l\'ordre', () => {
    const { lines } = genererLignesFEC(minimalDirection, [], null, minimalGlobalParams);
    const header = serialiserFEC(lines).split('\r\n')[0];
    expect(header).toBe(
      'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise'
    );
  });
});
