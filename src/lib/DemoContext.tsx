'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Customer, Order, OrderStatus, Seller } from './types';
import { initialProducts, initialCustomers, initialOrders, initialSellers } from './mockData';

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

  useEffect(() => {
    const DEMO_VERSION = 'v11'; // bumped to add even bigger order and test pagination
    const storedVersion = localStorage.getItem('rio_demo_version');

    if (storedVersion !== DEMO_VERSION) {
      localStorage.clear();
      localStorage.setItem('rio_demo_version', DEMO_VERSION);
      setProducts(initialProducts);
      setCustomers(initialCustomers);
      setOrders(initialOrders);
      setSellers(initialSellers);
      setCurrentCustomer(initialCustomers[0]);
      setCurrentSeller(initialSellers[0]);
      setIsLoaded(true);
      return;
    }

    const storedProducts = localStorage.getItem('rio_products');
    const storedCustomers = localStorage.getItem('rio_customers');
    const storedOrders = localStorage.getItem('rio_orders');
    const storedSellers = localStorage.getItem('rio_sellers');
    const storedCurrentCustomer = localStorage.getItem('rio_current_customer');
    const storedCurrentSeller = localStorage.getItem('rio_current_seller');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    else setProducts(initialProducts);

    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    else setCustomers(initialCustomers);

    if (storedOrders) setOrders(JSON.parse(storedOrders));
    else setOrders(initialOrders);

    if (storedSellers) setSellers(JSON.parse(storedSellers));
    else setSellers(initialSellers);

    if (storedCurrentCustomer) setCurrentCustomer(JSON.parse(storedCurrentCustomer));
    else setCurrentCustomer(initialCustomers[0]);

    if (storedCurrentSeller) setCurrentSeller(JSON.parse(storedCurrentSeller));
    else setCurrentSeller(initialSellers[0]);

    const storedCart = localStorage.getItem('rio_cart');
    if (storedCart) setCart(JSON.parse(storedCart));

    setIsLoaded(true);
  }, []);

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

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrder = (order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };
  
  const checkoutSeller = (customerId: string, cartItems: CartItem[]) => {
    if (!currentSeller) return;
    
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      number: `PED-${orders.length + 1001}`,
      customerId,
      sellerId: currentSeller.id,
      createdAt: new Date().toISOString(),
      status: 'En preparación',
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
    // keep currentCustomer in sync if it's the same person
    setCurrentCustomer(prev => prev?.id === customer.id ? customer : prev);
  };

  const addCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  const addSeller = (seller: Seller) => {
    setSellers(prev => [...prev, seller]);
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
      checkoutSeller,
      resetDemoData,
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
