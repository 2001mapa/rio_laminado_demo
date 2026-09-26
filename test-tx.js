const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Starting local transaction test...");
  const sku = 'X0397'; // From the user's screenshot
  
  const product = await prisma.product.findUnique({ where: { sku } });
  if (!product) {
    console.log("Product not found");
    return;
  }
  
  const id = product.id;
  
  const txResult = await prisma.$transaction(async (tx) => {
    console.log("Inside tx");
    const before = await tx.product.findUnique({ where: { id } });
    
    console.log("Found before");
    const after = await tx.product.update({
      where: { id },
      data: { physicalStock: 10 }
    });
    
    console.log("Updated after");
    
    const audit = await tx.auditEvent.create({
      data: {
        actorId: 'test-admin',
        actorName: 'test',
        actorRole: 'admin',
        action: 'UPDATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: id,
        sku: after.sku,
        origin: 'test',
        changes: JSON.parse(JSON.stringify({ before, after }))
      }
    });
    
    console.log("Created audit");
    return true;
  });
  
  console.log("Tx result:", txResult);
}

run().catch(console.error).finally(() => prisma.$disconnect());
