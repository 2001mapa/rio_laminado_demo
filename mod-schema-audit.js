const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!code.includes('AuditEvent')) {
  code += `

model AuditBatch {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now())
  actorId     String
  actorName   String
  actorRole   String
  filename    String?
  status      String   // success, partial_failure, failure
  stats       Json     // { created: Int, updated: Int, unchanged: Int, errors: Int }
  events      AuditEvent[]
}

model AuditEvent {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now())
  actorId     String
  actorName   String
  actorRole   String
  
  action      String   // CREATE, UPDATE, DELETE, UPLOAD_PHOTO, RESET_PASSWORD, etc.
  entityType  String   // PRODUCT, ORDER, CUSTOMER, SELLER
  entityId    String
  
  sku         String?  // Optional context for quick search
  orderNumber String?  // Optional context for quick search
  
  origin      String   @default("manual") // manual, import, system
  result      String   @default("success") // success, failure, error
  
  batchId     String?
  batch       AuditBatch? @relation(fields: [batchId], references: [id])
  
  changes     Json?    // { before: {}, after: {} }
}
`;
  fs.writeFileSync('prisma/schema.prisma', code);
  console.log("Added Audit models to schema.prisma");
} else {
  console.log("Audit models already exist in schema.prisma");
}
