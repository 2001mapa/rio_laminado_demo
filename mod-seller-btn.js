const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const replacement = `<button 
                  onClick={() => addToast('La creación de clientes por vendedores requiere configuración de permisos. Solicita la creación al administrador.')}
                  className="w-full py-3 border-2 border-dashed border-rio-border rounded-xl text-rio-muted hover:bg-rio-surface-muted transition-colors flex items-center justify-center font-semibold text-sm cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4 mr-2 opacity-50" />
                  <span className="opacity-50">Crear Cliente Rápido</span>
                </button>`;

code = code.replace(/<button[\s\n]*onClick=\{\(\) => setShowNewCustomerModal\(true\)\}[\s\S]*?<\/button>/, replacement);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Button replaced');
