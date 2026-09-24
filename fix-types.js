const fs = require('fs');

let types = fs.readFileSync('src/lib/types.ts', 'utf8');
if (!types.includes('material?: string;')) {
  types = types.replace('locationCode?: string | null;', 'locationCode?: string | null;\n  material?: string;');
  types = types.replace('refreshData: () => Promise<void>;', 'refreshData: () => Promise<void>;\n  updateGroupInvoice: (groupId: string, invoice: string) => Promise<{success: boolean, error?: string}>;');
  fs.writeFileSync('src/lib/types.ts', types);
}

let orders = fs.readFileSync('src/app/actions/orders.ts', 'utf8');
orders = orders.replace(/'VERIFY'/g, "'SEND_TO_VERIFICATION'");
fs.writeFileSync('src/app/actions/orders.ts', orders);

let page = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');
page = page.replace('let elements = [];', 'let elements: any[] = [];');
page = page.replace("group.status || 'Pendiente'", "(group as any).status || 'Pendiente'");
fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', page);

console.log('Fixed types');
