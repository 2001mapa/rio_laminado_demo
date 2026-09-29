const fs = require('fs');
function addReactImports(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes("import { use } from 'react';")) {
    c = c.replace("import { use } from 'react';", "import { use, useState, useEffect } from 'react';");
  } else if (!c.includes("useState")) {
    c = "import { use, useState, useEffect } from 'react';\n" + c;
  }
  fs.writeFileSync(file, c);
}

addReactImports('src/app/admin/pedidos/[id]/imprimir/page.tsx');
addReactImports('src/app/admin/pedidos/[id]/verificar/page.tsx');
