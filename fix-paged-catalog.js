const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const targetFunction = `export async function getPagedCatalog({ 
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
      
      // Los vendedores pueden ver productos sin foto (para vender en mostrador). Los clientes no.
      if (role === 'cliente') {
        where.imageUrl = { not: null };
        where.material = { not: 'Por revisar' };
      }
      // physicalStock - reservedStock > 0 is tricky in Prisma count/where directly without raw query or separate fields, 
      // wait! We can just fetch them and filter, but that breaks cursor pagination.
      // Actually, if we just check physicalStock > 0 or reservedStock < physicalStock... Prisma doesn't support comparing two columns directly in where unless we use where: { physicalStock: { gt: prisma.product.fields.reservedStock } } in Prisma 5? 
      // Prisma 5 supports comparing columns? Actually simpler: we can use a raw query if needed, or if the requirement allows, we just fetch with a generous limit and filter, or just use raw query.
    }
    
    if (material && material !== 'Todos') {
      where.material = material;
    }
    if (category && category !== 'Todos') {
        if (!search) {
          where.category = { gte: category };
        } else {
          where.category = category;
        }
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
        skip: cursor ? 1 : 0,
      orderBy: [
        { category: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // We do JS filtering because of the physicalStock > reservedStock requirement for non-admins,
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
    return {
      success: false,
      error: error.message
    };
  }
}`;

const newFunction = `export async function getPagedCatalog({ 
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
    
    // Base where clause sin filtros específicos de búsqueda
    const baseWhere: any = {};
    if (role !== 'admin') {
      baseWhere.isActive = true;
      if (role === 'cliente') {
        baseWhere.imageUrl = { not: null };
        baseWhere.material = { not: 'Por revisar' };
      }
    }
    
    // Materiales con stock real disponible
    const allProducts = await prisma.product.findMany({
      where: baseWhere,
      select: { material: true, physicalStock: true, reservedStock: true, category: true }
    });
    
    const availableMaterialsSet = new Set<string>();
    for (const p of allProducts) {
      if (role === 'admin' || (p.physicalStock - p.reservedStock) > 0) {
        if (p.material) availableMaterialsSet.add(p.material);
      }
    }
    
    // Orden canónico
    const canonicalOrder = ['Laminado', 'Plata', 'Rodio'];
    const availableMaterials = Array.from(availableMaterialsSet).sort((a, b) => {
       const idxA = canonicalOrder.indexOf(a);
       const idxB = canonicalOrder.indexOf(b);
       if (idxA >= 0 && idxB >= 0) return idxA - idxB;
       if (idxA >= 0) return -1;
       if (idxB >= 0) return 1;
       return a.localeCompare(b);
    });

    // Build specific where clause for pagination
    const where: any = { ...baseWhere };
    if (material && material !== 'Todos') {
      where.material = material;
    }
    if (category && category !== 'Todos') {
        if (!search) {
          where.category = { gte: category };
        } else {
          where.category = category;
        }
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Paginación continua saltando agotados
    let finalItems: any[] = [];
    let currentCursor = cursor;
    let hasMore = true;
    let fallbackHasMore = false;
    
    while (finalItems.length < limit && hasMore) {
      const takeCount = (limit - finalItems.length) + 1;
      const queryArgs: any = {
        where,
        take: takeCount,
        orderBy: [
          { category: 'asc' },
          { createdAt: 'desc' }
        ]
      };
      
      if (currentCursor) {
         queryArgs.cursor = { id: currentCursor };
         queryArgs.skip = 1;
      }
      
      const chunk = await prisma.product.findMany(queryArgs);
      
      if (chunk.length === 0) {
         hasMore = false;
         break;
      }
      
      fallbackHasMore = chunk.length === takeCount;
      const itemsToProcess = fallbackHasMore ? chunk.slice(0, -1) : chunk;
      
      if (itemsToProcess.length > 0) {
         currentCursor = itemsToProcess[itemsToProcess.length - 1].id;
      } else if (fallbackHasMore) {
         currentCursor = chunk[0].id;
      }
      
      for (const item of itemsToProcess) {
        if (role === 'admin' || (item.physicalStock - item.reservedStock) > 0) {
          finalItems.push(item);
          if (finalItems.length === limit) break;
        }
      }
      
      if (!fallbackHasMore && finalItems.length < limit) {
         hasMore = false;
      }
      if (finalItems.length === limit && fallbackHasMore) {
         hasMore = true; // We know there's at least one more in the DB
      }
    }
    
    const nextCursor = finalItems.length > 0 ? finalItems[finalItems.length - 1].id : undefined;

    return {
      success: true,
      products: finalItems,
      hasMore,
      nextCursor,
      availableMaterials
    };

  } catch (error: any) {
    console.error('Error fetching paged catalog:', error);
    return {
      success: false,
      error: error.message
    };
  }
}`;

code = code.replace(targetFunction, newFunction);
fs.writeFileSync('src/app/actions/queries.ts', code);
console.log('Fixed getPagedCatalog pagination and materials');
