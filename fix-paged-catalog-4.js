const fs = require('fs');
let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

const regex = /export async function getPagedCatalog\(\{[\s\S]*?\} \)\{[\s\S]*?\} catch \(error: any\) \{\n    console\.error\('Error fetching paged catalog:', error\);\n    return \{\n      success: false,\n      error: error\.message\n    \};\n  \}\n\}/;

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
    
    // Build where clause
    const baseWhere: any = {};
    if (role !== 'admin') {
      baseWhere.isActive = true;
      if (role === 'cliente') {
        baseWhere.imageUrl = { not: null };
        baseWhere.material = { not: 'Por revisar' };
      }
    }
    
    if (category && category !== 'Todos') {
      if (!search) {
        baseWhere.category = { gte: category };
      } else {
        baseWhere.category = category;
      }
    }
    
    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Materiales con stock real disponible para los filtros actuales (sin incluir material)
    const allFilteredProducts = await prisma.product.findMany({
      where: baseWhere,
      select: { material: true, physicalStock: true, reservedStock: true }
    });
    
    const availableMaterialsSet = new Set<string>();
    for (const p of allFilteredProducts) {
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

    const where: any = { ...baseWhere };
    if (material && material !== 'Todos') {
      where.material = material;
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
          { createdAt: 'desc' },
          { id: 'asc' }
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
         hasMore = true; 
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

const start = code.indexOf('export async function getPagedCatalog');
const next = code.indexOf('export async function', start + 10);

if (start !== -1 && next !== -1) {
  code = code.substring(0, start) + newFunction + '\n\n' + code.substring(next);
  fs.writeFileSync('src/app/actions/queries.ts', code);
  console.log('Replaced via indexOf correctly');
} else {
  console.log('Failed again');
}
