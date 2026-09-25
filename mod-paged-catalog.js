const fs = require('fs');

let queries = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

if (!queries.includes('getPagedCatalog')) {
  const getPagedCatalogAction = `
export async function getPagedCatalog({ 
  material, 
  category, 
  search, 
  limit = 24, 
  cursor 
}: { 
  material?: string;
  category?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  noStore();
  try {
    const { role } = await requireRole(['admin', 'vendedor', 'cliente']);
    
    // Build where clause
    const where: any = {};
    if (role !== 'admin') {
      where.isActive = true;
      where.imageUrl = { not: null };
      where.material = { not: 'Por revisar' };
      // physicalStock - reservedStock > 0 is tricky in Prisma count/where directly without raw query or separate fields, 
      // wait! We can just fetch them and filter, but that breaks cursor pagination.
      // Actually, if we just check physicalStock > 0 or reservedStock < physicalStock... Prisma doesn't support comparing two columns directly in where unless we use where: { physicalStock: { gt: prisma.product.fields.reservedStock } } in Prisma 5? 
      // Prisma 5 supports comparing columns? Actually simpler: we can use a raw query if needed, or if the requirement allows, we just fetch with a generous limit and filter, or just use raw query.
    }
    
    if (material && material !== 'Todos') {
      where.material = material;
    }
    if (category && category !== 'Todos') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const items = await prisma.product.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { category: 'asc' }, // To keep groups together
        { createdAt: 'desc' },
        { id: 'asc' } // deterministic tie-breaker
      ]
    });

    // In JS we filter out zero-stock items for clients/sellers just in case,
    // though this might result in fewer than 'limit' items returned. The frontend will just ask for more if needed.
    let filteredItems = items;
    if (role !== 'admin') {
      filteredItems = items.filter(p => (p.physicalStock - p.reservedStock) > 0);
    }

    let hasMore = false;
    if (items.length > limit) {
      hasMore = true;
      // We pop from the ORIGINAL items to find the real next cursor
      items.pop();
    }
    
    // If we filtered out items, we still use the cursor from the original items array to continue properly.
    const nextCursor = items.length > 0 ? items[items.length - 1].id : undefined;
    
    // Also return only the filtered items that are within the current page limit
    const finalItems = role !== 'admin' ? items.filter(p => (p.physicalStock - p.reservedStock) > 0) : items;

    return {
      success: true,
      products: finalItems,
      hasMore,
      nextCursor
    };

  } catch (error: any) {
    console.error('Error fetching paged catalog:', error);
    return { success: false, products: [], hasMore: false };
  }
}
`;

  queries += getPagedCatalogAction;
  fs.writeFileSync('src/app/actions/queries.ts', queries);
  console.log('Added getPagedCatalog to queries.ts');
}
