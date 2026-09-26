const fs = require('fs');

let code = fs.readFileSync('src/app/actions/inventory.ts', 'utf8');

// Ensure we import the audit tools at the top. We'll use regex to place it after prisma.
if (!code.includes('logAuditEvent')) {
  code = code.replace(
    /import \{ prisma \} from '@\/lib\/prisma';/,
    `import { prisma } from '@/lib/prisma';\nimport { logAuditEvent, getAuditActor } from '@/lib/audit';`
  );
}

const newBulkUpload = `export async function bulkUploadInventory(items: any[]) {
  try {
    const actor = await getAuditActor();
    if (actor.role !== 'admin') throw new Error('No autorizado');

    console.log(\`Processing \${items.length} items from CSV...\`);
    
    // Create AuditBatch first
    const batch = await prisma.auditBatch.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        filename: 'CSV_Import',
        status: 'processing',
        stats: { created: 0, updated: 0, unchanged: 0, errors: 0 }
      }
    });

    const existingProducts = await prisma.product.findMany({ select: { id: true, sku: true, material: true, locationCode: true, name: true, category: true, price: true, physicalStock: true, isActive: true } });
    const existingMap = new Map(existingProducts.map(p => [p.sku, p]));

    let warnings: string[] = [];
    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    const operations = [];
    const auditEvents = [];

    for (const item of items) {
      const priceStr = item.price ? item.price.toString() : '0';
      const price = parseFloat(priceStr.replace(/[^\\d.-]/g, '')) || 0;
      const physicalStock = parseInt(item.physicalStock?.toString(), 10) || 0;
      
      const suggestedMaterial = detectMaterial(item.name || '');
      const existing = existingMap.get(item.sku);
      
      const updateData: any = {
        name: item.name,
        category: normalizeProductType(item.category),
        price: price,
        physicalStock: physicalStock,
      };
      
      if (item.locationCode && item.locationCode.trim() !== '') {
         updateData.locationCode = item.locationCode;
      }

      if (existing) {
         if (existing.material && existing.material !== 'Por revisar' && suggestedMaterial !== 'Por revisar' && existing.material !== suggestedMaterial) {
           warnings.push(\`El SKU \${item.sku} ya es '\${existing.material}'. Sugiere '\${suggestedMaterial}'. (Conservado original)\`);
         }
         
         // Check if anything actually changed
         const changes: any = {};
         let hasChanges = false;
         
         if (existing.name !== updateData.name) { changes.name = { before: existing.name, after: updateData.name }; hasChanges = true; }
         if (existing.category !== updateData.category) { changes.category = { before: existing.category, after: updateData.category }; hasChanges = true; }
         if (existing.price !== updateData.price) { changes.price = { before: existing.price, after: updateData.price }; hasChanges = true; }
         if (existing.physicalStock !== updateData.physicalStock) { changes.physicalStock = { before: existing.physicalStock, after: updateData.physicalStock }; hasChanges = true; }
         if (updateData.locationCode && existing.locationCode !== updateData.locationCode) { changes.locationCode = { before: existing.locationCode, after: updateData.locationCode }; hasChanges = true; }
         
         if (hasChanges) {
           updated++;
           operations.push(prisma.product.update({ where: { sku: item.sku }, data: updateData }));
           auditEvents.push(prisma.auditEvent.create({
             data: {
               actorId: actor.id, actorName: actor.name, actorRole: actor.role,
               action: 'INVENTORY_CSV_UPDATE', entityType: 'PRODUCT', entityId: existing.id, sku: item.sku,
               origin: 'import', result: 'success', batchId: batch.id, changes
             }
           }));
         } else {
           unchanged++;
         }
      } else {
        // Create new
        created++;
        const createData = {
          sku: item.sku,
          name: item.name || 'Sin nombre',
          category: normalizeProductType(item.category) || 'Sin categora',
          price: price,
          physicalStock: physicalStock,
          locationCode: (item.locationCode && item.locationCode.trim() !== '') ? item.locationCode : null,
          material: suggestedMaterial,
          reservedStock: 0,
          isActive: true
        };
        operations.push(prisma.product.create({ data: createData }));
        // For creations, we don't have the ID yet, we could use a raw query or just log the SKU.
        // We'll log it using the SKU as entityId for now since it's unique, or run it sequentially.
        // Prisma transaction array will resolve together. We can just use sku as entityId.
        auditEvents.push(prisma.auditEvent.create({
             data: {
               actorId: actor.id, actorName: actor.name, actorRole: actor.role,
               action: 'INVENTORY_CSV_CREATE', entityType: 'PRODUCT', entityId: item.sku, sku: item.sku,
               origin: 'import', result: 'success', batchId: batch.id, changes: { after: createData }
             }
        }));
      }
    }

    try {
      await prisma.$transaction([...operations, ...auditEvents]);
      await prisma.auditBatch.update({
        where: { id: batch.id },
        data: { status: 'success', stats: { created, updated, unchanged, errors } }
      });
    } catch (e) {
      await prisma.auditBatch.update({
        where: { id: batch.id },
        data: { status: 'failure', stats: { created: 0, updated: 0, unchanged: 0, errors: items.length } }
      });
      throw e;
    }
    
    return { 
      success: true, 
      count: newItems.length, 
      warnings,
      stats: { created, updated, unchanged, errors }
    };
  } catch (error: any) {
    console.error('Error in bulkUploadInventory:', error);
    return { success: false, error: error.message };
  }
}`;

code = code.replace(/export async function bulkUploadInventory\([\s\S]*?return \{ success: false, error: error\.message \};\n  \}\n\}/, newBulkUpload);

// Rewrite createSingleProduct
const newCreate = `export async function createSingleProduct(data: {
  sku: string;
  name: string;
  category: string;
  price: number;
  physicalStock: number;
  locationCode?: string;
  material?: string;
}) {
  try {
    const actor = await getAuditActor();
    if (actor.role !== 'admin') throw new Error('No autorizado');

    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) {
      return { success: false, error: 'Ya existe un producto con este SKU' };
    }

    const material = data.material || detectMaterial(data.name);

    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          sku: data.sku,
          name: data.name,
          category: data.category,
          price: data.price,
          physicalStock: data.physicalStock,
          locationCode: data.locationCode || null,
          material,
          reservedStock: 0,
          isActive: true
        }
      });
      await logAuditEvent(actor, {
        action: 'INVENTORY_CREATE', entityType: 'PRODUCT', entityId: p.id, sku: p.sku, origin: 'manual', changes: { after: p }
      }, tx);
      return p;
    });

    return { success: true, product: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}`;
code = code.replace(/export async function createSingleProduct\([\s\S]*?return \{ success: false, error: error\.message \};\n  \}\n\}/, newCreate);

const newUpdate = `export async function updateProductAction(id: string, data: {
  name?: string;
  category?: string;
  price?: number;
  physicalStock?: number;
  locationCode?: string | null;
  material?: string;
  isActive?: boolean;
}) {
  try {
    const actor = await getAuditActor();
    if (actor.role !== 'admin') throw new Error('No autorizado');

    const before = await prisma.product.findUnique({ where: { id } });
    if (!before) throw new Error('Product not found');
    
    // Check if reservedStock is valid if physicalStock is being decreased
    if (data.physicalStock !== undefined) {
      if (data.physicalStock < before.reservedStock) {
        return { success: false, error: \`El stock fsico (\${data.physicalStock}) no puede ser menor al stock reservado (\${before.reservedStock})\` };
      }
    }
    
    const changes: any = {};
    for (const key in data) {
       if ((data as any)[key] !== (before as any)[key]) {
          changes[key] = { before: (before as any)[key], after: (data as any)[key] };
       }
    }

    if (Object.keys(changes).length === 0) return { success: true, product: before };

    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data
      });
      await logAuditEvent(actor, {
        action: 'INVENTORY_UPDATE', entityType: 'PRODUCT', entityId: p.id, sku: p.sku, origin: 'manual', changes
      }, tx);
      return p;
    });
    
    return { success: true, product: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}`;
code = code.replace(/export async function updateProductAction\([\s\S]*?return \{ success: false, error: error\.message \};\n  \}\n\}/, newUpdate);

fs.writeFileSync('src/app/actions/inventory.ts', code);
console.log("Updated inventory.ts for auditing");
