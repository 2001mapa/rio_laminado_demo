const fs = require('fs');

let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

// If already wrapped, ignore
if (!code.includes('const refreshData = useCallback')) {
  // Add useCallback import
  if (!code.includes('useCallback')) {
    code = code.replace(/import \{ createContext, useContext, useState, useEffect, ReactNode \} from 'react';/, "import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';");
  }

  const target = `  const refreshData = async () => {
    try {
      const result = await getAppData();
      if (result.success && result.data) {
        setProducts(result.data.products as any[]);
        setCustomers(result.data.customers as any[]);
        setSellers(result.data.sellers as any[]);
        
        // Map Prisma's orderNumber to frontend's expected number
        const mappedOrders = (result.data.orders as any[]).map(o => ({
          ...o,
          number: o.orderNumber || o.number
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Error cargando base de datos:", err);
    }
  };`;

  const replacement = `  const refreshData = useCallback(async () => {
    try {
      const result = await getAppData();
      if (result.success && result.data) {
        setProducts(result.data.products as any[]);
        setCustomers(result.data.customers as any[]);
        setSellers(result.data.sellers as any[]);
        
        // Map Prisma's orderNumber to frontend's expected number
        const mappedOrders = (result.data.orders as any[]).map(o => ({
          ...o,
          number: o.orderNumber || o.number
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Error cargando base de datos:", err);
    }
  }, []);`;

  code = code.replace(target, replacement);

  fs.writeFileSync('src/lib/DemoContext.tsx', code);
  console.log('Successfully wrapped refreshData in useCallback');
} else {
  console.log('Already wrapped');
}
