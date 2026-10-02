import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Customer } from './types';

// En este formato minimizamos los datos almacenados
export interface DraftOrder {
  sellerId: string;
  selectedClientId?: string;
  cart: { productId: string; quantity: number; sizes?: any }[];
  updatedAt: number;
}

export interface PendingOrder {
  clientRequestId: string;
  sellerId: string;
  customerId: string;
  customerName: string;
  items: { productId: string; quantity: number; sizeDetails?: any }[];
  status: 'pending' | 'syncing' | 'failed_recoverable' | 'failed_fatal' | 'failed_intervention';
  lastError?: string;
  createdAt: number;
  retryCount: number;
  totalAmount?: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
}

interface RioDB extends DBSchema {
  drafts: {
    key: string;
    value: DraftOrder;
  };
  pending_orders: {
    key: string;
    value: PendingOrder;
    indexes: { 'by-seller': string };
  };
}

let dbPromise: Promise<IDBPDatabase<RioDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<RioDB>('rio-offline-db', 2, {
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

export async function saveDraft(draft: DraftOrder) {
  const db = await getDB();
  if (db) await db.put('drafts', draft);
}

export async function loadDraft(sellerId: string): Promise<DraftOrder | undefined> {
  const db = await getDB();
  if (db) return db.get('drafts', sellerId);
  return undefined;
}

export async function clearDraft(sellerId: string) {
  const db = await getDB();
  if (db) await db.delete('drafts', sellerId);
}

export async function addPendingOrder(order: PendingOrder) {
  const db = await getDB();
  if (db) await db.put('pending_orders', order);
}

export async function getPendingOrders(sellerId: string): Promise<PendingOrder[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex('pending_orders', 'by-seller', sellerId);
}

export async function updatePendingOrderStatus(id: string, update: Partial<PendingOrder>) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('pending_orders', 'readwrite');
  const store = tx.objectStore('pending_orders');
  const order = await store.get(id);
  if (order) {
    await store.put({ ...order, ...update });
  }
  await tx.done;
}

export async function removePendingOrder(id: string) {
  const db = await getDB();
  if (db) await db.delete('pending_orders', id);
}
