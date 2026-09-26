const fs = require('fs');

let content = fs.readFileSync('src/app/admin/historial/page.tsx', 'utf8');

// Insert the dictionaries right after imports
const dictionaries = `
const ACTION_MAP: Record<string, string> = {
  CREATE_PRODUCT: 'Creó Producto',
  UPDATE_PRODUCT: 'Actualizó Producto',
  DELETE_PRODUCT: 'Eliminó Producto',
  UPDATE_ORDER: 'Actualizó Pedido',
  CREATE_ORDER: 'Creó Pedido',
  UPLOAD_PHOTO: 'Subió Fotografía',
  BULK_UPLOAD: 'Importación Masiva',
  UPDATE_INVENTORY: 'Actualizó Inventario',
  CREATE_CUSTOMER: 'Creó Cliente',
  UPDATE_CUSTOMER: 'Actualizó Cliente',
  CREATE_SELLER: 'Creó Vendedor',
  UPDATE_SELLER: 'Actualizó Vendedor'
};

const ENTITY_MAP: Record<string, string> = {
  PRODUCT: 'Producto',
  ORDER: 'Pedido',
  INVOICE: 'Remisión',
  CUSTOMER: 'Cliente',
  SELLER: 'Vendedor',
  PHOTO: 'Fotografía'
};

const ORIGIN_MAP: Record<string, string> = {
  admin_dashboard: 'Panel Admin',
  vendedor_app: 'App Vendedor',
  cliente_app: 'App Cliente',
  system: 'Sistema',
  manual: 'Manual'
};
`;

if (!content.includes('ACTION_MAP')) {
  content = content.replace(
    /export default function HistorialPage\(\) \{/,
    `${dictionaries}\nexport default function HistorialPage() {`
  );
}

// Replace Action rendering
content = content.replace(
  /\{ev\.action\}/,
  `{ACTION_MAP[ev.action] || ev.action}`
);

// Replace Origin rendering
content = content.replace(
  /\{ev\.origin\}/,
  `{ORIGIN_MAP[ev.origin] || ev.origin}`
);

// Replace EntityType rendering
content = content.replace(
  /\{ev\.entityType\}/,
  `{ENTITY_MAP[ev.entityType] || ev.entityType}`
);

// Also format the JSON changes a bit better? Not strictly requested, but they just wanted "esos mensajes del cambio que hizo pueden ser menos tecnicos".
// I'll format the changes viewer using a custom renderer if possible, but actually `JSON.stringify` might be fine if the user just wanted the table row.
// Wait, the user specifically mentioned "esos mensajes del cambio que hizo", which might mean the ACTION tag (`UPDATE_PRODUCT`), the ORIGIN tag (`ADMIN_DASHBOARD`), and the ENTITY tag (`PRODUCT`).
// Let's also ensure `ADMIN_DASHBOARD` is handled if it was uppercase in the DB.
// Let's add uppercase versions to the map just in case.

content = content.replace(
  /admin_dashboard: 'Panel Admin',/,
  `admin_dashboard: 'Panel Admin',
  ADMIN_DASHBOARD: 'Panel Admin',`
);

fs.writeFileSync('src/app/admin/historial/page.tsx', content);
console.log('Dictionaries injected.');
