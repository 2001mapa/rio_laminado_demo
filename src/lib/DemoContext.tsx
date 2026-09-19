'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Customer, Order, OrderStatus, Seller } from './types';
import { initialProducts, initialCustomers, initialOrders, initialSellers } from './mockData';
import { createClient } from '@/utils/supabase/client';

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

import { getAppData } from '@/app/actions/queries';
import { createCustomer as createCustomerAction } from '@/app/actions/clients';
import { createSeller as createSellerAction } from '@/app/actions/sellers';
import { createOrder as createOrderAction, updateOrderStatus as updateOrderStatusAction } from '@/app/actions/orders';
import { createClient } from '@/utils/supabase/client';

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

    async function loadAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const username = session.user.email?.replace('@rio.local', '');
        const role = session.user.user_metadata?.role;
        
        if (role === 'cliente') {
          const matched = customers.find(c => c.username === username);
          if (matched) setCurrentCustomer(matched);
        } else if (role === 'vendedor' || role === 'admin') {
          const matched = sellers.find(s => s.username === username);
          if (matched) setCurrentSeller(matched);
        }
      } else {
        // Fallback to local storage if no session
        const storedCurrentCustomer = localStorage.getItem('rio_current_customer');
        const storedCurrentSeller = localStorage.getItem('rio_current_seller');
        if (storedCurrentCustomer) {
          const parsed = JSON.parse(storedCurrentCustomer);
          const matched = customers.find(c => c.id === parsed.id) || parsed;
          setCurrentCustomer(matched);
        }
        if (storedCurrentSeller) {
          const parsed = JSON.parse(storedCurrentSeller);
          const matched = sellers.find(s => s.id === parsed.id) || parsed;
          setCurrentSeller(matched);
        }
      }
      
      const storedCart = localStorage.getItem('rio_cart');
      if (storedCart) setCart(JSON.parse(storedCart));
    }
    
    loadAuth();
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

  const updateCustomer = (customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    setCurrentCustomer(prev => prev?.id === customer.id ? customer : prev);
    // Para simplificar, no conectaremos el updateCustomer a BD en esta iteración sin su propia Server Action.
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
