const fs = require('fs');
let text = fs.readFileSync('prisma/schema.prisma', 'utf8');

text = text.replace(/isActive\s+Boolean\s+@default\(true\)/, "isActive      Boolean     @default(true)\n  material      String?     @default(\"Por revisar\")");

text = text.replace(/issue\s+String\?\n\}/, "issue            String?\n  materialGroupId  String?\n  group            OrderMaterialGroup? @relation(fields: [materialGroupId], references: [id], onDelete: SetNull)\n  materialSnapshot String?\n}");

text = text.replace(/statusHistory OrderStatusHistory\[\]\n\}/, "statusHistory OrderStatusHistory[]\n  groups      OrderMaterialGroup[]\n}");

if (!text.includes('model OrderMaterialGroup')) {
text += `
model OrderMaterialGroup {
  id              String   @id @default(uuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  material        String
  groupNumber     String
  isVerified      Boolean  @default(false)
  externalInvoice String?
  items           OrderItem[]
  createdAt       DateTime @default(now())
}
`;
}
fs.writeFileSync('prisma/schema.prisma', text);
console.log('Done');
