import { describe, it, expect } from 'vitest';
import { calculerResteAEngager, recommendationRAE } from '../resteAEngager';

const direction = {
  chargesSiege: [
    { id: 'c1', nom: 'Loyer', montant: 1000 },     // 12 000 €/an
    { id: 'c2', nom: 'Énergie', montant: 500 },    // 6 000 €/an
  ],
  exploitation: [],
};

const poleSupport = {
  exploitation: [
    { id: 'c3', nom: 'Maintenance', montant: 300 }, // 3 600 €/an
  ],
};

const services = [
  {
    id: 's1', nom: 'Service A',
    exploitation: [{ id: 'c4', nom: 'Fournitures', montant: 200 }], // 2 400 €/an
  },
  {
    id: 's2', nom: 'Service B',
    exploitation: [{ id: 'c5', nom: 'Documentation', montant: 100 }], // 1 200 €/an
  },
];

const baseParams = { coefficientBP: 100 };

describe('calculerResteAEngager', () => {
  it('produit un calcul pour chaque entité (siège + pôle + 2 services)', () => {
    const r = calculerResteAEngager(direction, services, poleSupport, [], baseParams);
    expect(r.entites.length).toBe(4);
    expect(r.entites[0].id).toBe('direction');
    expect(r.entites[1].id).toBe('poleSupport');
    expect(r.entites[2].id).toBe('s1');
  });

  it('budget Direction = 18 000 € (1500 × 12) si BP 100 %', () => {
    const r = calculerResteAEngager(direction, [], null, [], baseParams);
    expect(r.entites[0].budget).toBe(18000);
  });

  it('coefficientBP 80 % réduit le budget de 20 %', () => {
    const r = calculerResteAEngager(direction, [], null, [], { coefficientBP: 80 });
    expect(r.entites[0].budget).toBe(14400);
  });

  it('engagements ouverts affectés à Direction réduisent le RAE', () => {
    const eng = [
      { id: 'e1', entite: 'Direction', montant: 5000, statut: 'ouvert' },
      { id: 'e2', entite: 'Direction', montant: 3000, statut: 'ouvert' },
    ];
    const r = calculerResteAEngager(direction, [], null, eng, baseParams);
    const dir = r.entites[0];
    expect(dir.engagements).toBe(8000);
    expect(dir.reste).toBe(10000); // 18000 - 8000
    expect(dir.count).toBe(2);
  });

  it('engagements soldés ignorés', () => {
    const eng = [
      { id: 'e1', entite: 'Direction', montant: 5000, statut: 'solde' },
      { id: 'e2', entite: 'Direction', montant: 3000, statut: 'ouvert' },
    ];
    const r = calculerResteAEngager(direction, [], null, eng, baseParams);
    expect(r.entites[0].engagements).toBe(3000);
    expect(r.entites[0].count).toBe(1);
  });

  it('niveau success si taux < 70 %', () => {
    const eng = [{ id: 'e1', entite: 'Direction', montant: 5000, statut: 'ouvert' }];
    const r = calculerResteAEngager(direction, [], null, eng, baseParams);
    // 5000 / 18000 = 27.7 % → success
    expect(r.entites[0].niveau).toBe('success');
  });

  it('niveau warning si taux 70-90 %', () => {
    const eng = [{ id: 'e1', entite: 'Direction', montant: 14000, statut: 'ouvert' }];
    const r = calculerResteAEngager(direction, [], null, eng, baseParams);
    // 14000 / 18000 = 77.7 % → warning
    expect(r.entites[0].niveau).toBe('warning');
  });

  it('niveau danger si taux 90-100 %', () => {
    const eng = [{ id: 'e1', entite: 'Direction', montant: 17000, statut: 'ouvert' }];
    const r = calculerResteAEngager(direction, [], null, eng, baseParams);
    // 17000 / 18000 = 94 % → danger
    expect(r.entites[0].niveau).toBe('danger');
  });

  it('niveau overrun si taux > 100 % (dépassement)', () => {
    const eng = [{ id: 'e1', entite: 'Direction', montant: 20000, statut: 'ouvert' }];
    const r = calculerResteAEngager(direction, [], null, eng, baseParams);
    // 20000 / 18000 = 111 % → overrun
    expect(r.entites[0].niveau).toBe('overrun');
    expect(r.entites[0].reste).toBe(-2000); // RAE négatif
  });

  it('total consolidé somme tous les budgets et engagements', () => {
    const eng = [
      { id: 'e1', entite: 'Direction', montant: 1000, statut: 'ouvert' },
      { id: 'e2', entite: 'Service A', montant: 500, statut: 'ouvert' },
    ];
    const r = calculerResteAEngager(direction, services, poleSupport, eng, baseParams);
    expect(r.total.budget).toBe(18000 + 3600 + 2400 + 1200);
    expect(r.total.engagements).toBe(1500);
  });

  it('engagements vers entité inexistante ignorés', () => {
    const eng = [{ id: 'e1', entite: 'Service Fantôme', montant: 1000, statut: 'ouvert' }];
    const r = calculerResteAEngager(direction, services, poleSupport, eng, baseParams);
    expect(r.total.engagements).toBe(0);
  });

  it('robuste aux engagements null/sans montant', () => {
    const eng = [
      { id: 'e1', entite: 'Direction', montant: null, statut: 'ouvert' },
      null,
      { id: 'e3', entite: 'Direction', montant: 'abc', statut: 'ouvert' },
    ];
    const r = calculerResteAEngager(direction, [], null, eng, baseParams);
    expect(r.entites[0].engagements).toBe(0);
  });
});

describe('recommendationRAE', () => {
  it('texte adapté au niveau success', () => {
    expect(recommendationRAE('success', 50)).toMatch(/Marge disponible/);
  });
  it('texte adapté au niveau warning', () => {
    expect(recommendationRAE('warning', 75)).toMatch(/Vigilance/);
  });
  it('texte adapté au niveau danger', () => {
    expect(recommendationRAE('danger', 95)).toMatch(/Pré-saturation/);
  });
  it('texte adapté au niveau overrun', () => {
    expect(recommendationRAE('overrun', 110)).toMatch(/Dépassement budgétaire/);
  });
});
