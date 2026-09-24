const fs = require('fs');
let code = fs.readFileSync('src/lib/types.ts', 'utf8');

const regex = /export type Order = \{([\s\S]*?)\};/;
const replace = `export type OrderMaterialGroup = {
  id: string;
  orderId: string;
  material: string;
  groupNumber: string;
  status: string;
  isVerified: boolean;
  externalInvoice?: string | null;
  items: OrderItem[];
};

export type Order = {$1  groups?: OrderMaterialGroup[];
};`;

code = code.replace(regex, replace);

// Add materialGroupId to OrderItem
code = code.replace(/issue\?:\s+string;\n\};/, "issue?: string;\n  materialGroupId?: string | null;\n};");

fs.writeFileSync('src/lib/types.ts', code);
console.log('types.ts modified');
