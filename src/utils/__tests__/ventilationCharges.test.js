import { describe, it, expect } from 'vitest';
import { classifierChargeExploitation, ventilerChargesExploitation } from '../ventilationCharges';
import { calculerResultatExercice } from '../resultatExercice';
import { calculerCompteResultat } from '../compteResultat';

describe('classifierChargeExploitation — classification par libellé', () => {
  it.each([
    ['Loyer bâtiment Avion', '61'],
    ['Contrat de maintenance chaudière', '61'],
    ['Assurance multirisque', '61'],
    ['Sous-traitance ménage', '61'],
    ['Honoraires expert-comptable', '62'],
    ['Communication et publicité', '62'],
    ['Frais de déplacement formateurs', '62'],
    ['Téléphonie et internet', '62'],
    ['Cotisation UNIFAF', '62'],
    ['Licence SACEM', '65'],
    ['Pertes sur créances irrécouvrables', '65'],
    ['Électricité', '60'],
    ['Fournitures pédagogiques', '60'],
    ['Achats alimentaires cantine', '60'],
    ['Carburant véhicules', '60'],
  ])('classe « %s » en compte %s', (libelle, compte) => {
    expect(classifierChargeExploitation(libelle)).toBe(compte);
  });

  it('retourne null pour un libellé non reconnu ou vide', () => {
    expect(classifierChargeExploitation('Zzz divers mystère')).toBe(null);
    expect(classifierChargeExploitation('')).toBe(null);
    expect(classifierChargeExploitation(undefined)).toBe(null);
  });
});

describe('ventilerChargesExploitation — exactitude et réconciliation', () => {
  const direction = {
    personnel: [],
    recettes: [],
    chargesSiege: [
      { id: 'c1', nom: 'Loyer siège', montant: 1500 },
      { id: 'c2', nom: 'Électricité', montant: 400 },
    ],
    exploitation: [{ id: 'c3', nom: 'Honoraires comptable', montant: 250 }],
    investissements: {},
  };
  const services = [{
    id: 's1', nom: 'FI', tauxActivite: 100, personnel: [],
    exploitation: [
      { id: 'e1', nom: 'Fournitures pédagogiques', montant: 300 },
      { id: 'e2', nom: 'Machin inconnu', montant: 100 },
    ],
    recettes: [], investissements: {},
  }];
  const gp = { anneeExercice: 2026, coefficientBP: 90, provisions: [], fondRoulement: [], delaiPaiementFournisseurs: 30 };

  it('la somme des classes 60/61/62/65 = total exploitation de la source unique', () => {
    const v = ventilerChargesExploitation(direction, services, null, gp);
    const rex = calculerResultatExercice(direction, services, null, gp, [], null);
    const sommeClasses = v.classes['60'] + v.classes['61'] + v.classes['62'] + v.classes['65'];
    expect(sommeClasses).toBeCloseTo(rex.detail.exploitation, 4);
  });

  it('applique le coefficient BP à chaque ligne', () => {
    const v = ventilerChargesExploitation(direction, services, null, gp);
    const loyer = v.lignes.find(l => l.nom === 'Loyer siège');
    expect(loyer.montant).toBeCloseTo(1500 * 12 * 0.9, 4);
    expect(loyer.compte).toBe('61');
  });

  it('replie les lignes non reconnues en 65 avec classement=defaut', () => {
    const v = ventilerChargesExploitation(direction, services, null, gp);
    const inconnu = v.lignes.find(l => l.nom === 'Machin inconnu');
    expect(inconnu.compte).toBe('65');
    expect(inconnu.classement).toBe('defaut');
    expect(v.nbNonClasses).toBe(1);
  });

  it('gère le format legacy de la Direction (loyer/charges/autresCharges)', () => {
    const legacyDir = { personnel: [], recettes: [], loyer: 1000, charges: 200, autresCharges: 50, investissements: {} };
    const v = ventilerChargesExploitation(legacyDir, [], null, { coefficientBP: 100 });
    expect(v.classes['61']).toBeCloseTo(12000, 2);
    expect(v.classes['60']).toBeCloseTo(2400, 2);
    expect(v.classes['65']).toBeCloseTo(600, 2);
  });

  it('le compte de résultat utilise la ventilation réelle (plus de 35/30/20/15 %)', () => {
    const cr = calculerCompteResultat(direction, services, null, gp);
    const l60 = cr.charges.find(c => c.code === '60');
    const l61 = cr.charges.find(c => c.code === '61');
    const l62 = cr.charges.find(c => c.code === '62');
    // Loyer 1500 → 61 ; Électricité 400 + Fournitures 300 → 60 ; Honoraires 250 → 62
    expect(l61.montant).toBeCloseTo(1500 * 12 * 0.9, 2);
    expect(l60.montant).toBeCloseTo((400 + 300) * 12 * 0.9, 2);
    expect(l62.montant).toBeCloseTo(250 * 12 * 0.9, 2);
    expect(cr.ventilation.nbNonClasses).toBe(1);
  });
});
