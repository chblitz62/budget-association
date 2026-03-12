// Formate une valeur en euros sous forme de chaîne (pour l'affichage PDF, UI)
export const formatEuro = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return '0 €';
  return Math.round(val).toLocaleString('fr-FR') + ' €';
};

// Formate une valeur en nombre euros arrondi (pour Excel, valeur brute)
export const formatEuroNumber = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.round(val * 100) / 100;
};
