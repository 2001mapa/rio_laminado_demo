'use client';

import { createContext, useContext } from 'react';

export const OfflineSellerContext = createContext('');
export const useOfflineSellerId = () => useContext(OfflineSellerContext);
