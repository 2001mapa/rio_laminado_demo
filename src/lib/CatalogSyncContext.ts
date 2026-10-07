import { createContext, useContext } from 'react';

type CatalogSyncState = {
  syncCatalog: () => Promise<void>;
  isSyncing: boolean;
  lastSyncDate: number | null;
};

export const CatalogSyncContext = createContext<CatalogSyncState>({
  syncCatalog: async () => {},
  isSyncing: false,
  lastSyncDate: null,
});

export const useSellerCatalogSync = () => useContext(CatalogSyncContext);
