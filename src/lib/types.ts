export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  physicalStock: number;
  reservedStock: number;
  isActive: boolean;
  imageUrl?: string | null;
  hoverImageUrl?: string | null;
  locationCode?: string | null;
  material?: string;
  createdAt?: string | Date;
};

export type Customer = {
  id: string;
  name: string;
  username: string; // Nuevo
  authUserId?: string | null;
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

export type SizeDetail = {
  size: string;
  quantity: number;
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  originalQuantity?: number;
  adjustmentReason?: string;
  verified?: boolean;
  issue?: string;
  materialGroupId?: string | null;
  sizeDetails?: SizeDetail[] | null;
};

export type Seller = {
  id: string;
  name: string;
  username: string; // Nuevo
  authUserId?: string | null;
  email: string;
  status: 'active' | 'suspended';
};

export type OrderMaterialGroup = {
  id: string;
  orderId: string;
  material: string;
  groupNumber: string;
  status: string;
  isVerified: boolean;
  externalInvoice?: string | null;
  items: OrderItem[];
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
  carrier?: string | null;
  trackingNumber?: string | null;
  groups?: OrderMaterialGroup[];
};
