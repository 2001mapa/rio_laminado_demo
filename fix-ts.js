const fs = require('fs');

function addReactImports(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes("import { use } from 'react';")) {
    c = c.replace("import { use } from 'react';", "import { use, useState, useEffect } from 'react';");
  } else if (!c.includes("useState")) {
    c = "import { use, useState, useEffect } from 'react';\n" + c;
  }
  
  // also let's just do a quick replace for implicit any if possible, or we can just leave it as is 
  // and manually fix the types. For now I'll just fix imports.
  fs.writeFileSync(file, c);
}

addReactImports('src/app/admin/pedidos/[id]/imprimir/page.tsx');
addReactImports('src/app/admin/pedidos/[id]/verificar/page.tsx');
addReactImports('src/app/admin/pedidos/[id]/page.tsx'); // just in case

// Fix 'any' issues in those files by just throwing `any` at parameters where TS complains:
function fixAnys(file) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(/\(s \=>/g, "(s: any) =>");
    c = c.replace(/\(i \=>/g, "(i: any) =>");
    c = c.replace(/\(g \=>/g, "(g: any) =>");
    c = c.replace(/\(acc, item\)/g, "(acc: any, item: any)");
    c = c.replace(/\(group, groupIdx\)/g, "(group: any, groupIdx: any)");
    fs.writeFileSync(file, c);
}

fixAnys('src/app/admin/pedidos/[id]/imprimir/page.tsx');
fixAnys('src/app/admin/pedidos/[id]/verificar/page.tsx');
fixAnys('src/app/admin/pedidos/[id]/page.tsx');

console.log('Fixed React imports and anys');
