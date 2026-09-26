const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logAuditEvent } = require('./src/lib/audit');

async function testAudit() {
  console.log('Testing Audit Log...');
  const actor = { id: 'test-admin-id', name: 'Test Admin', role: 'admin' };
  
  // Create an audit event directly
  const event = await logAuditEvent(actor, {
    action: 'TEST_ACTION',
    entityType: 'TEST',
    entityId: 'test-123',
    origin: 'manual',
    changes: { before: { status: 'old' }, after: { status: 'new' } }
  });
  
  console.log('Created AuditEvent:', event);
  
  const found = await prisma.auditEvent.findUnique({ where: { id: event.id } });
  console.log('Found in DB:', !!found);
  
  // Cleanup
  await prisma.auditEvent.delete({ where: { id: event.id } });
}

testAudit().catch(console.error).finally(() => prisma.$disconnect());
