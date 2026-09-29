const fs = require('fs');

let code = fs.readFileSync('src/app/admin/clientes/[id]/page.tsx', 'utf8');

const targetCiudad = `<div>
                <p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Ciudad</p>
                <p className="font-medium text-rio-ink">No registrada</p>
              </div>`;

const targetAddress = `<p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Dirección de Envío</p>`;

code = code.replace(targetCiudad, '');
code = code.replace(targetAddress, `<p className="text-[10px] uppercase font-bold text-rio-muted tracking-wider mb-1">Dirección / Ciudad de Envío</p>`);

fs.writeFileSync('src/app/admin/clientes/[id]/page.tsx', code);
console.log('Fixed ciudad ficticia');
