'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Customer, Order, OrderStatus, Seller } from './types';
import { initialProducts, initialCustomers, initialOrders, initialSellers } from './mockData';
import { createClient } from '@/utils/supabase/client';
import { getAppData } from '@/app/actions/queries';
import { createCustomer as createCustomerAction, updateCustomerStatusAction } from '@/app/actions/clients';
import { createSeller as createSellerAction } from '@/app/actions/sellers';
import { createOrder as createOrderAction, updateOrderStatus as updateOrderStatusAction } from '@/app/actions/orders';

export type CartItem = {
  product: Product;
  quantity: number;
};

type DemoContextType = {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  sellers: Seller[];
  currentCustomer: Customer | null;
  setCurrentCustomer: (c: Customer | null) => void;
  currentSeller: Seller | null;
  setCurrentSeller: (s: Seller | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateCustomer: (customer: Customer) => void;
  addCustomer: (customer: Customer) => void;
  addSeller: (seller: Seller) => void;
  checkoutSeller: (customerId: string, cartItems: CartItem[]) => void;
  resetDemoData: () => void;
  refreshData: () => Promise<void>;
  isLoaded: boolean;
};

export const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshData = async () => {
    try {
      const result = await getAppData();
      if (result.success && result.data) {
        // Transform DB data to match frontend types if needed
        setProducts(result.data.products as any[]);
        setCustomers(result.data.customers as any[]);
        setSellers(result.data.sellers as any[]);
        setOrders(result.data.orders as any[]);
      }
    } catch (err) {
      console.error("Error cargando base de datos:", err);
    }
  };

  useEffect(() => {
    // 1. Fetch real data from Supabase
    async function fetchRealData() {
      await refreshData();
      setIsLoaded(true);
    }
    fetchRealData();
  }, []);

  // 2. Load Supabase Auth Session ONCE data is loaded
  useEffect(() => {
    if (!isLoaded) return;

    const supabase = createClient();

    async function processSession(session: any) {
      if (session?.user) {
        const username = session.user.email?.replace('@rio.local', '')?.toLowerCase().trim();
        const role = session.user.user_metadata?.role;
        const metaUsername = session.user.user_metadata?.username?.toLowerCase().trim();
        
        if (role === 'cliente') {
          const matched = customers.find(c => 
            c.authUserId === session.user.id || 
            c.username?.toLowerCase().trim() === username ||
            (metaUsername && c.username?.toLowerCase().trim() === metaUsername)
          );
          if (matched) setCurrentCustomer(matched);
          else setCurrentCustomer(null);
        } else if (role === 'vendedor' || role === 'admin') {
          const matched = sellers.find(s => 
            s.authUserId === session.user.id || 
            s.username?.toLowerCase().trim() === username ||
            (metaUsername && s.username?.toLowerCase().trim() === metaUsername)
          );
          if (matched) setCurrentSeller(matched);
          else setCurrentSeller(null);
        }
      } else {
        // Fallback to local storage if no session
        try {
          const storedCurrentCustomer = localStorage.getItem('rio_current_customer');
          if (storedCurrentCustomer && storedCurrentCustomer !== "undefined" && storedCurrentCustomer !== "null") {
            try {
              const parsed = JSON.parse(storedCurrentCustomer);
              if (parsed && parsed.id) {
                const matched = customers.find(c => c.id === parsed.id) || parsed;
                setCurrentCustomer(matched);
              } else {
                setCurrentCustomer(null);
              }
            } catch (e) {
              setCurrentCustomer(null);
            }
          } else {
            setCurrentCustomer(null);
          }

          const storedCurrentSeller = localStorage.getItem('rio_current_seller');
          if (storedCurrentSeller && storedCurrentSeller !== "undefined" && storedCurrentSeller !== "null") {
            try {
              const parsed = JSON.parse(storedCurrentSeller);
              if (parsed && parsed.id) {
                const matched = sellers.find(s => s.id === parsed.id) || parsed;
                setCurrentSeller(matched);
              } else {
                setCurrentSeller(null);
              }
            } catch (e) {
              setCurrentSeller(null);
            }
          } else {
            setCurrentSeller(null);
          }
        } catch (e) {
          console.error("Failed to parse local storage user", e);
        }
      }
      
      try {
        const storedCart = localStorage.getItem('rio_cart');
        if (storedCart && storedCart !== "undefined") setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }

    // Load initial session
    supabase.auth.getSession().then(({ data }) => {
      processSession(data.session);
    });

    // Listen for auth changes (like login/logout in other tabs or soft navigations)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      processSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLoaded, customers, sellers]);

  // 3. Save to LocalStorage whenever things change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('rio_products', JSON.stringify(products));
    localStorage.setItem('rio_customers', JSON.stringify(customers));
    localStorage.setItem('rio_orders', JSON.stringify(orders));
    localStorage.setItem('rio_sellers', JSON.stringify(sellers));
    localStorage.setItem('rio_current_customer', JSON.stringify(currentCustomer));
    localStorage.setItem('rio_current_seller', JSON.stringify(currentSeller));
    localStorage.setItem('rio_cart', JSON.stringify(cart));
  }, [products, customers, orders, sellers, currentCustomer, currentSeller, cart, isLoaded]);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const addOrder = async (order: Order) => {
    setOrders(prev => [order, ...prev]);
    try {
      let totalAmount = 0;
      order.items.forEach(item => {
         const product = products.find(p => p.id === item.productId);
         if (product) totalAmount += product.price * item.quantity;
      });
      
      const res = await createOrderAction({
         customerId: order.customerId,
         sellerId: order.sellerId || '',
         items: order.items.map(i => {
           const p = products.find(prod => prod.id === i.productId);
           return { productId: i.productId, quantity: i.quantity, priceAtTime: p ? p.price : 0 };
         }),
         totalAmount: totalAmount
      });
      if (res.success && res.order) {
        setOrders(prev => prev.map(o => o.id === order.id ? (res.order as any) : o));
      }
    } catch(e) { console.error(e) }
  };

  const updateOrder = (order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await updateOrderStatusAction(orderId, status);
    } catch(e) { console.error(e) }
  };
  
  const checkoutSeller = (customerId: string, cartItems: CartItem[]) => {
    if (!currentSeller) return;
    
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      number: `PED-${orders.length + 1001}`,
      customerId,
      sellerId: currentSeller.id,
      createdAt: new Date().toISOString(),
      status: 'Reservado',
      items: cartItems.map((item, index) => ({
        id: `oi-${Date.now()}-${index}`,
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };
    
    addOrder(newOrder);
  };

  const resetDemoData = () => {
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setOrders(initialOrders);
    setSellers(initialSellers);
    setCurrentCustomer(initialCustomers[0]);
    setCurrentSeller(initialSellers[0]);
    localStorage.removeItem('rio_cart');
  };

  const updateCustomer = async (customer: Customer) => {
    // Optimistic UI update
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    setCurrentCustomer(prev => prev?.id === customer.id ? customer : prev);
    
    // Save to DB
    try {
      await updateCustomerStatusAction(customer.id, {
        status: customer.status,
        showDiscount: customer.showDiscount,
        discount: customer.discount
      });
    } catch (error) {
      console.error('Error updating customer in DB:', error);
      // Optional: rollback optimistic update if needed
    }
  };

  const addCustomer = async (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    try {
      const res = await createCustomerAction({
         name: customer.name,
         username: customer.username,
         email: customer.email,
         phone: customer.phone,
         address: customer.address,
         discount: customer.discount || 0,
         showDiscount: customer.showDiscount || false,
      });
      if (res.success && res.customer) {
         setCustomers(prev => prev.map(c => c.id === customer.id ? (res.customer as any) : c));
      }
    } catch (e) { console.error(e) }
  };

  const addSeller = async (seller: Seller) => {
    setSellers(prev => [...prev, seller]);
    try {
      const res = await createSellerAction({
         name: seller.name,
         email: seller.email || '',
      });
      if (res.success && res.seller) {
         setSellers(prev => prev.map(s => s.id === seller.id ? (res.seller as any) : s));
      }
    } catch (e) { console.error(e) }
  };

  return (
    <DemoContext.Provider value={{
      products,
      customers,
      orders,
      sellers,
      currentCustomer,
      setCurrentCustomer,
      currentSeller,
      setCurrentSeller,
      checkoutSeller,
      cart,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      addOrder,
      updateOrder,
      updateOrderStatus,
      updateCustomer,
      addCustomer,
      addSeller,
      resetDemoData,
      refreshData,
      isLoaded,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
