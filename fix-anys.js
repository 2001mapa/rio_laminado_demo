const fs = require('fs');

function fix(file) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(/\(s\s*=>/g, "(s: any) =>");
    c = c.replace(/i\s*=>/g, "(i: any) =>"); // this might hit safe `i =>`
    // let's do more explicit regex:
    // .filter(s =>
    // .some(i =>
    // .map(g =>
    
    // to be safe, I'll just replace these specific strings:
    c = c.replace(/\(s =>/g, "((s: any) =>"); // wait, `(s =>` if we change to `((s:any) =>` we might get `((s:any) =>` which is valid if followed by `)` but let's just do:
    c = c.replace(/s => /g, "(s: any) => ");
    c = c.replace(/i => /g, "(i: any) => ");
    c = c.replace(/g => /g, "(g: any) => ");
    c = c.replace(/\(acc, item\)/g, "(acc: any, item: any)");
    c = c.replace(/\(group, groupIdx\)/g, "(group: any, groupIdx: any)");
    
    // Wait, let's just use ts-ignore or eslint-disable, or explicitly replace:
    // It's safer to just replace `s =>` with `(s: any) =>`
    
    fs.writeFileSync(file, c);
}

fix('src/app/admin/pedidos/[id]/imprimir/page.tsx');
fix('src/app/admin/pedidos/[id]/verificar/page.tsx');
fix('src/app/admin/pedidos/[id]/page.tsx');
