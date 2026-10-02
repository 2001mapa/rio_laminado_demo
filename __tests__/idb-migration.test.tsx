import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { getDB } from '@/lib/offlineQueue';

describe('Phase 5: IDB Migration v2 to v3', () => {
  beforeEach(() => {
    // Reset DB state
    const req = indexedDB.deleteDatabase('rio-offline-db');
    return new Promise((resolve) => {
      req.onsuccess = resolve;
      req.onerror = resolve;
      req.onblocked = resolve;
    });
  });

  it('migra de v2 a v3 creando catalog_products, catalog_customers y sync_meta', async () => {
    // Paso 1: Crear BD en v2
    const dbV2 = await openDB('rio-offline-db', 2, {
      upgrade(db) {
        db.createObjectStore('drafts', { keyPath: 'sellerId' });
        const store = db.createObjectStore('pending_orders', { keyPath: 'clientRequestId' });
        store.createIndex('by-seller', 'sellerId');
      }
    });
    
    // Verificamos que v2 no tiene catálogos
    expect(dbV2.objectStoreNames.contains('catalog_products')).toBe(false);
    dbV2.close();

    // Paso 2: Usar getDB (que abrirá en v3)
    const dbV3 = await getDB();
    expect(dbV3).toBeDefined();
    if (!dbV3) return;

    // Verificar que v3 tiene todos los object stores
    expect(dbV3.objectStoreNames.contains('catalog_products')).toBe(true);
    expect(dbV3.objectStoreNames.contains('catalog_customers')).toBe(true);
    expect(dbV3.objectStoreNames.contains('sync_meta')).toBe(true);

    // Escribir y leer datos
    await dbV3.put('catalog_products', {
      id: 'prod1', sku: 'SKU-001', name: 'Anillo Oro', category: 'Anillos', price: 100, physicalStock: 10, reservedStock: 0, isActive: true
    } as any);

    const product = await dbV3.get('catalog_products', 'prod1');
    expect(product).toBeDefined();
    expect(product?.sku).toBe('SKU-001');

    dbV3.close();
  });
});
