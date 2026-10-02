import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Customer } from './types';

// En este formato minimizamos los datos almacenados
export interface DraftOrder {
  sellerId: string;
  selectedClientId?: string;
  cart: { productId: string; quantity: number; sizes?: any }[];
  updatedAt: number;
  clientRequestId?: string;
}

export interface PendingOrder {
  clientRequestId: string;
  sellerId: string;
  customerId: string;
  customerName: string;
  items: { productId: string; quantity: number; sizeDetails?: any }[];
  status: 'pending' | 'syncing' | 'failed_recoverable' | 'failed_fatal' | 'failed_intervention' | 'conflict';
  conflicts?: { productId?: string; reason: string; currentStock?: number; currentPrice?: number }[];
  lastError?: string;
  createdAt: number;
  retryCount: number;
  totalAmount?: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
}


export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  material: string | null;
  category: string;
  price: number;
  physicalStock: number;
  reservedStock: number;
  isActive: boolean;
  imageUrl?: string | null;
}

export interface CatalogCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
}

export interface SyncMeta {
  storeName: string;
  lastSyncedAt: number;
  isComplete: boolean;
}

export interface RioDB extends DBSchema {
  drafts: { key: string; value: DraftOrder; };
  pending_orders: { key: string; value: PendingOrder; indexes: { 'by-seller': string }; };
  catalog_products: { key: string; value: CatalogProduct; indexes: { 'by-sku': string }; };
  catalog_customers: { key: string; value: CatalogCustomer; };
  sync_meta: { key: string; value: SyncMeta; };
}

let dbPromise: Promise<IDBPDatabase<RioDB>> | null = null;

export function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<RioDB>('rio-offline-db', 3, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'sellerId' });
        }
        if (!db.objectStoreNames.contains('pending_orders')) {
          const store = db.createObjectStore('pending_orders', { keyPath: 'clientRequestId' });
          store.createIndex('by-seller', 'sellerId');
        }
      },
    });
  }
  return dbPromise;
}

export function emitWriteStart() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('idb-write-start'));
}
export function emitWriteEnd(success: boolean, error?: any) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('idb-write-end', { detail: { success, error } }));
}

async function withWriteTracking<T>(operation: () => Promise<T>): Promise<T> {
  emitWriteStart();
  try {
    const res = await operation();
    emitWriteEnd(true);
    return res;
  } catch (error: any) {
    emitWriteEnd(false, error);
    throw error;
  }
}

export async function saveDraft(draft: DraftOrder) {
  return withWriteTracking(async () => {
    const db = await getDB();
    if (db) await db.put('drafts', draft);
  });
}

export async function loadDraft(sellerId: string): Promise<DraftOrder | undefined> {
  const db = await getDB();
  if (db) return db.get('drafts', sellerId);
  return undefined;
}

export async function clearDraft(sellerId: string) {
  return withWriteTracking(async () => {
    const db = await getDB();
    if (db) await db.delete('drafts', sellerId);
  });
}

export async function addPendingOrder(order: PendingOrder) {
  return withWriteTracking(async () => {
    const db = await getDB();
    if (db) await db.put('pending_orders', order);
  });
}

export async function getPendingOrders(sellerId: string): Promise<PendingOrder[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex('pending_orders', 'by-seller', sellerId);
}

export async function updatePendingOrderStatus(id: string, update: Partial<PendingOrder>) {
  return withWriteTracking(async () => {
    const db = await getDB();
    if (!db) return;
    const tx = db.transaction('pending_orders', 'readwrite');
    const store = tx.objectStore('pending_orders');
    const order = await store.get(id);
    if (order) {
      await store.put({ ...order, ...update });
    }
    await tx.done;
  });
}

export async function removePendingOrder(id: string) {
  return withWriteTracking(async () => {
    const db = await getDB();
    if (db) await db.delete('pending_orders', id);
  });
}


export async function searchOfflineProducts(query: string): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const all = (await db.getAll('catalog_products')) as unknown as CatalogProduct[];
  const lowerQuery = query.toLowerCase();
  return all.filter(p => p.isActive && (p.sku.toLowerCase().includes(lowerQuery) || p.name.toLowerCase().includes(lowerQuery)));
}

export async function searchOfflineCustomers(query: string): Promise<CatalogCustomer[]> {
  const db = await getDB();
  if (!db) return [];
  const all = (await db.getAll('catalog_customers')) as unknown as CatalogCustomer[];
  const lowerQuery = query.toLowerCase();
  return all.filter(c => c.status === 'active' && c.name.toLowerCase().includes(lowerQuery));
}

export async function getOfflineProductsByIds(ids: string[]): Promise<CatalogProduct[]> {
  const db = await getDB();
  if (!db) return [];
  const tx = db.transaction('catalog_products', 'readonly');
  const products = [];
  for (const id of ids) {
    const p = await tx.store.get(id);
    if (p) products.push(p as unknown as CatalogProduct);
  }
  return products;
}
