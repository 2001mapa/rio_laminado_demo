export interface QuickCustomerData {
  name: string;
  phone: string;
  city: string;
  address: string;
  document?: string;
}

export function normalizeQuickCustomer(data: QuickCustomerData): QuickCustomerData {
  return {
    name: data.name.trim().replace(/\s+/g, ' '),
    phone: data.phone.trim(),
    city: data.city.trim().replace(/\s+/g, ' '),
    address: data.address.trim().replace(/\s+/g, ' '),
    document: data.document?.trim() || undefined,
  };
}

export function isValidQuickCustomer(data: QuickCustomerData): boolean {
  const normalized = normalizeQuickCustomer(data);
  return normalized.name.length >= 2 && normalized.name.length <= 120
    && /^[+()\d\s-]+$/.test(normalized.phone)
    && normalized.phone.replace(/\D/g, '').length >= 7
    && normalized.phone.length <= 30
    && normalized.city.length >= 2 && normalized.city.length <= 100
    && normalized.address.length >= 5 && normalized.address.length <= 250
    && (!normalized.document || normalized.document.length <= 40);
}
