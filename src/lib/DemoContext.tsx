'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Customer, Order, OrderStatus, Seller } from './types';
import { initialProducts, initialCustomers, initialOrders, initialSellers } from './mockData';
import { createClient } from '@/utils/supabase/client';
import { getAppData } from '@/app/actions/queries';
import { createCustomer as createCustomerAction, updateCustomerStatusAction } from '@/app/actions/clients';
import { createSeller as createSellerAction } from '@/app/actions/sellers';
import { createOrder as createOrderAction, transitionOrder as transitionOrderAction, acknowledgeOrderAdjustment as acknowledgeAdjustmentAction } from '@/app/actions/orders';
import { OrderTransitionAction } from '@/lib/order-status';

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
  addOrder: (orderData: { customerId?: string, items: { productId: string, quantity: number }[] }) => Promise<any>;
  updateOrder: (order: Order) => void;
  transitionOrder: (orderId: string, action: OrderTransitionAction) => Promise<any>;
  acknowledgeAdjustment: (orderId: string) => Promise<any>;
  updateCustomer: (customer: Customer) => void;
  addCustomer: (customer: Customer) => void;
  addSeller: (seller: Seller) => void;
  checkoutSeller: (customerId: string, cartItems: CartItem[]) => Promise<any>;
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
  };

  useEffect(() => {
    // 1. Fetch real data from Supabase
    async function fetchRealData() {
      await refreshData();
      setIsLoaded(true);
    }
    fetchRealData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const supabase = createClient();
    
    async function processSession(session: any) {
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'admin';
        const metaUsername = session.user.user_metadata?.username?.toLowerCase().trim();
        const emailPrefix = session.user.email?.split('@')[0]?.toLowerCase().trim();
        const username = metaUsername || emailPrefix;
        
        if (role === 'cliente') {
          const matched = customers.find(c => 
            c.authUserId === session.user.id || 
            c.username?.toLowerCase().trim() === username ||
            (metaUsername && c.username?.toLowerCase().trim() === metaUsername)
          );
          if (matched) {
            setCurrentCustomer(matched);
          }
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
        setCurrentCustomer(null);
        setCurrentSeller(null);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      processSession(session);
    });

    try {
      const storedCart = localStorage.getItem('rio_cart');
      if (storedCart && storedCart !== "undefined") setCart(JSON.parse(storedCart));
    } catch (e) {
      console.error("Failed to parse cart", e);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const stockDisponible = product.physicalStock - product.reservedStock;
      const existing = prev.find(item => item.product.id === product.id);
      
      if (existing) {
        const newQuantity = Math.min(stockDisponible, existing.quantity + quantity);
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQuantity } : item);
      }
      return [...prev, { product, quantity: Math.min(stockDisponible, quantity) }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const stockDisponible = item.product.physicalStock - item.product.reservedStock;
        return { ...item, quantity: Math.min(stockDisponible, quantity) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const addOrder = async (orderData: { customerId?: string, items: { productId: string, quantity: number }[] }) => {
    try {
      const res = await createOrderAction(orderData);
      
      if (res.success && res.order) {
        const mappedOrder = { ...res.order, number: res.order.orderNumber || (res.order as any).number };
        setOrders(prev => [mappedOrder as any, ...prev]);
        return { success: true, order: mappedOrder };
      } else {
        console.error("Error creating order:", res.error);
        return res;
      }
    } catch(e: any) { 
      console.error(e);
      return { success: false, error: e.message };
    }
  };

  const updateOrder = async (order: Order) => {
    // Si la orden tiene items ajustados o fue validada/acknowledgement, 
    // llamamos al server action que acabamos de crear.
    const { updateOrderChecklist } = await import('@/app/actions/orders');
    
    // Convertimos al formato esperado
    const itemsData = order.items.map(item => ({
      id: item.id,
      newQuantity: item.quantity,
      adjustmentReason: item.adjustmentReason,
      verified: item.verified || false,
      issue: item.issue || null
    }));

    const result = await updateOrderChecklist(order.id, itemsData, (order as any).adjustmentAcknowledged || false);
    
    if (result.success && result.order) {
      const mappedOrder = { ...result.order, number: result.order.orderNumber || (result.order as any).number };
      setOrders(prev => prev.map(o => o.id === result.order.id ? { ...o, ...mappedOrder } as unknown as Order : o));
    } else {
      console.error("Failed to update order checklist:", result.error);
    }
  };

  const transitionOrder = async (orderId: string, action: OrderTransitionAction) => {
    try {
      const result = await transitionOrderAction(orderId, action);
      if (result.success && result.order) {
        const mappedOrder = { ...result.order, number: result.order.orderNumber || (result.order as any).number };
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...mappedOrder } as unknown as Order : o));
      }
      return result;
    } catch(e: any) {
      console.error(e);
      return { success: false, error: e.message };
    }
  };

  const acknowledgeAdjustment = async (orderId: string) => {
    try {
      const result = await acknowledgeAdjustmentAction(orderId);
      if (result.success && result.order) {
        const mappedOrder = { ...result.order, number: result.order.orderNumber || (result.order as any).number };
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...mappedOrder } as unknown as Order : o));
      }
      return result;
    } catch(e: any) {
      console.error(e);
      return { success: false, error: e.message };
    }
  };
  
  const checkoutSeller = async (customerId: string, cartItems: CartItem[]) => {
    if (!currentSeller) return { success: false, error: 'No seller logged in' };
    
    const orderData = {
      customerId,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };
    
    const result = await addOrder(orderData);
    return result;
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
      transitionOrder,
      acknowledgeAdjustment,
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
