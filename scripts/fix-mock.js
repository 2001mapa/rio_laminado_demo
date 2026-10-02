const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`vi.mock('@/app/actions/queries', () => ({
  getExactProductBySku: vi.fn(async () => ({
      success: true,
      product: { id: 'P1', sku: 'SKU1', name: 'MockProduct', price: 100, physicalStock: 10, reservedStock: 0, category: 'Collares' }
  }))
}));`,
`vi.mock('@/app/actions/queries', () => ({
  getExactProductBySku: vi.fn(async () => ({
      success: true,
      product: { id: 'P1', sku: 'SKU1', name: 'MockProduct', price: 100, physicalStock: 10, reservedStock: 0, category: 'Collares' }
  })),
  getProductsByIds: vi.fn(async () => ({
      success: true,
      products: [{ id: 'P1', sku: 'SKU1', name: 'MockProduct', price: 100, physicalStock: 10, reservedStock: 0, category: 'Collares' }]
  })),
  getPagedCatalog: vi.fn(async () => ({ success: true, products: [] }))
}));`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
