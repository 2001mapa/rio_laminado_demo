import { Product, Customer, Order, Seller } from './types';

export const initialSellers: Seller[] = [
  { id: 'v1', name: 'Vendedor Andrés', email: 'andres@rio.com', status: 'active' },
  { id: 'v2', name: 'Vendedora Laura', email: 'laura@rio.com', status: 'active' },
];

export const initialProducts: Product[] = [
  // Anillos
  {
    id: 'p1', sku: 'ANI-001', name: 'Anillo Circones Clásico', category: 'Anillos', price: 45000, lowStock: false, stock: 25, locationCode: 'A-01-01',
    imageUrl:      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1605100804763-247f66126e28?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p2', sku: 'ANI-002', name: 'Anillo Sello Liso', category: 'Anillos', price: 55000, lowStock: true, stock: 3, locationCode: 'A-01-02',
    imageUrl:      'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p3', sku: 'ANI-003', name: 'Anillo Cruz Delgada', category: 'Anillos', price: 38000, lowStock: false, stock: 25, locationCode: 'A-02-01',
    imageUrl:      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?fit=crop&w=600&h=600&q=80',
  },
  // Cadenas
  {
    id: 'p4', sku: 'CAD-001', name: 'Cadena Fígaro 45cm', category: 'Cadenas', price: 85000, lowStock: false, stock: 25, locationCode: 'B-01-01',
    imageUrl:      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p5', sku: 'CAD-002', name: 'Cadena Serpiente 50cm', category: 'Cadenas', price: 92000, lowStock: true, stock: 3, locationCode: 'B-01-03',
    imageUrl:      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p6', sku: 'CAD-003', name: 'Cadena Eslabón Cubano', category: 'Cadenas', price: 110000, lowStock: false, stock: 25, locationCode: 'B-02-01',
    imageUrl:      'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?fit=crop&w=600&h=600&q=80',
  },
  // Pulseras
  {
    id: 'p7', sku: 'PUL-001', name: 'Pulsera Balines', category: 'Pulseras', price: 65000, lowStock: false, stock: 25, locationCode: 'C-01-01',
    imageUrl:      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p8', sku: 'PUL-002', name: 'Pulsera Tejido Mágico', category: 'Pulseras', price: 72000, lowStock: false, stock: 25, locationCode: 'C-01-02',
    imageUrl:      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p9', sku: 'PUL-003', name: 'Pulsera Infinito', category: 'Pulseras', price: 48000, lowStock: true, stock: 3, locationCode: 'C-02-01',
    imageUrl:      'https://images.unsplash.com/photo-1630019852942-f89202989a59?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?fit=crop&w=600&h=600&q=80',
  },
  // Aretes
  {
    id: 'p10', sku: 'ARE-001', name: 'Topos Estrella', category: 'Aretes', price: 25000, lowStock: false, stock: 25, locationCode: 'D-01-01',
    imageUrl:      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p11', sku: 'ARE-002', name: 'Candongas Lisas Medianas', category: 'Aretes', price: 42000, lowStock: false, stock: 25, locationCode: 'D-01-02',
    imageUrl:      'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?fit=crop&w=600&h=600&q=80',
  },
  {
    id: 'p12', sku: 'ARE-003', name: 'Candongas Entorchadas', category: 'Aretes', price: 49000, lowStock: false, stock: 25,
    imageUrl:      'https://images.unsplash.com/photo-1630019852942-f89202989a59?fit=crop&w=600&h=600&q=80',
    hoverImageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?fit=crop&w=600&h=600&q=80',
  },
];

export const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Joyería El Diamante', email: 'contacto@eldiamante.com', discount: 15, showDiscount: false, status: 'active', phone: '3001234567', address: 'Calle 10 # 45-23, Medellín' },
  { id: 'c2', name: 'Accesorios María', email: 'ventas@accesoriosmaria.co', discount: 10, showDiscount: false, status: 'active', phone: '3109876543', address: 'Cra 15 # 2-11, Bogotá' },
  { id: 'c3', name: 'Oro y Estilo', email: 'info@oroyestilo.com', discount: 20, showDiscount: true, status: 'active', phone: '3156667788', address: 'C.C. El Puente Local 101, Cali' },
  { id: 'c4', name: 'Distribuidora Dorada', email: 'distri@dorada.com', discount: 5, showDiscount: false, status: 'suspended', phone: '3205554433', address: 'Av 33 # 65-10, Barranquilla' },
];

export const initialOrders: Order[] = [
  {
    id: 'o1',
    number: 'PED-1001',
    customerId: 'c1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'Despachado',
    items: [
      { id: 'i1', productId: 'p1', quantity: 5, verified: true },
      { id: 'i2', productId: 'p4', quantity: 2, verified: true },
    ]
  },
  {
    id: 'o2',
    number: 'PED-1002',
    customerId: 'c2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: 'En preparación',
    items: [
      { id: 'i3', productId: 'p2', quantity: 10 },
      { id: 'i4', productId: 'p10', quantity: 20 },
      { id: 'i5', productId: 'p12', quantity: 5 },
    ]
  },
  {
    id: 'o3',
    number: 'PED-1003',
    customerId: 'c3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    status: 'Pendiente de verificación',
    items: [
      { id: 'i6', productId: 'p5', quantity: 3 },
      { id: 'i7', productId: 'p6', quantity: 1 },
      { id: 'i8', productId: 'p11', quantity: 15 },
    ]
  },
  {
    id: 'o4',
    number: 'PED-1004',
    customerId: 'c1',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'Reservado',
    items: [
      { id: 'i9', productId: 'p7', quantity: 4 },
      { id: 'i10', productId: 'p9', quantity: 8 },
    ]
  },
  {
    id: 'o5',
    number: 'PED-1005',
    customerId: 'c2',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    status: 'Reservado',
    items: [
      { id: 't1', productId: 'p1', quantity: 1 },
      { id: 't2', productId: 'p2', quantity: 2 },
      { id: 't3', productId: 'p3', quantity: 3 },
      { id: 't4', productId: 'p4', quantity: 4 },
      { id: 't5', productId: 'p5', quantity: 5 },
      { id: 't6', productId: 'p6', quantity: 6 },
      { id: 't7', productId: 'p7', quantity: 7 },
      { id: 't8', productId: 'p8', quantity: 8 },
      { id: 't9', productId: 'p9', quantity: 9 },
      { id: 't10', productId: 'p10', quantity: 10 },
      { id: 't11', productId: 'p11', quantity: 11 },
      { id: 't12', productId: 'p12', quantity: 12 },
      { id: 't13', productId: 'p1', quantity: 13 },
      { id: 't14', productId: 'p2', quantity: 14 },
      { id: 't15', productId: 'p3', quantity: 15 },
      { id: 't16', productId: 'p4', quantity: 16 },
      { id: 't17', productId: 'p5', quantity: 17 },
      { id: 't18', productId: 'p6', quantity: 18 },
      { id: 't19', productId: 'p7', quantity: 19 },
      { id: 't20', productId: 'p8', quantity: 20 },
      { id: 't21', productId: 'p9', quantity: 21 },
      { id: 't22', productId: 'p10', quantity: 22 },
      { id: 't23', productId: 'p11', quantity: 23 },
      { id: 't24', productId: 'p12', quantity: 24 },
    ]
  },
  {
    id: 'o6',
    number: 'PED-1006',
    customerId: 'c3',
    createdAt: new Date(Date.now() - 1000 * 60).toISOString(),
    status: 'Reservado',
    items: Array.from({ length: 48 }).map((_, index) => {
      // Rotate through the 12 products
      const pIndex = (index % 12) + 1;
      return {
        id: `t6_${index}`,
        productId: `p${pIndex}`,
        quantity: index + 1
      };
    })
  }
];
