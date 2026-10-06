export const INVENTORY_LABELS_PER_SHEET = 27;

export function splitInventoryLabelsIntoSheets<T>(labels: T[]): T[][] {
  const sheets: T[][] = [];
  for (let start = 0; start < labels.length; start += INVENTORY_LABELS_PER_SHEET) {
    sheets.push(labels.slice(start, start + INVENTORY_LABELS_PER_SHEET));
  }
  return sheets;
}
