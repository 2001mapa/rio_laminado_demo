export const OFFICIAL_PRODUCT_TYPES = [
  'Topos',
  'Candongas',
  'Earcuff',
  'Cadenas',
  'Dijes',
  'Collares',
  'Anillos',
  'Pulseras',
  'Tobilleras',
  'Balines',
  'Herrajes',
  'Barriles'
];

export const normalizeProductType = (rawCategory: string): string => {
  if (!rawCategory) return '';
  const upper = rawCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  
  // Find a match ignoring case and accents
  const match = OFFICIAL_PRODUCT_TYPES.find(
    type => type.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === upper
  );
  
  return match || rawCategory.trim(); // Return official name if matched, else return the raw string trimmed
};
