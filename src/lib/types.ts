export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
  lowStock: boolean;
  locationCode?: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  discount: number;
  showDiscount: boolean; // admin controls whether client sees their discount
  status: 'active' | 'suspended';
  phone: string;
  address: string;
};

export type OrderStatus = 
  | 'Reservado' 
  | 'Confirmado' 
  | 'En preparación' 
  | 'Pendiente de verificación' 
  | 'Verificado' 
  | 'Empacado' 
  | 'Despachado' 
  | 'Cancelado';

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  verified?: boolean;
  issue?: string;
};

export type Order = {
  id: string;
  number: string;
  customerId: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
};
