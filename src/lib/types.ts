export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  hoverImageUrl?: string;
  lowStock: boolean;
  stock: number;
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
  originalQuantity?: number;
  adjustmentReason?: string;
  verified?: boolean;
  issue?: string;
};

export type Seller = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended';
};

export type Order = {
  id: string;
  number: string;
  customerId: string;
  sellerId?: string; // If present, the order was made by a seller
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  adjustmentAcknowledged?: boolean;
};
