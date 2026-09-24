const fs = require('fs');

let code = fs.readFileSync('src/app/admin/clientes/[id]/page.tsx', 'utf8');

// Ensure we get onlineUsers from useDemo
if (!code.includes('onlineUsers } = useDemo()')) {
  code = code.replace(
    'const { customers, orders, updateCustomer, refreshData } = useDemo();',
    'const { customers, orders, updateCustomer, refreshData, onlineUsers } = useDemo();'
  );
}

const avatarRegex = /<div className="w-20 h-20 bg-rio-surface rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-serif text-rio-gold-dark border border-rio-border relative z-10 shadow-sm">\s*\{customer\.name\.charAt\(0\)\}\s*<\/div>/;

const replacement = `
            <div className="relative inline-block mx-auto mb-4 z-10">
              <div className="w-20 h-20 bg-rio-surface rounded-full flex items-center justify-center text-3xl font-serif text-rio-gold-dark border border-rio-border shadow-sm">
                {customer.name.charAt(0)}
              </div>
              {customer.authUserId && onlineUsers.includes(customer.authUserId) ? (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-rio-surface rounded-full" title="En línea" aria-label="En línea" />
              ) : (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-gray-400 border-4 border-rio-surface rounded-full" title="Desconectado" aria-label="Desconectado" />
              )}
            </div>
`;

code = code.replace(avatarRegex, replacement.trim());

// Update the actual status indicator as well
code = code.replace(
  /<div className="mt-3 inline-flex items-center px-2 py-0.5 rounded border text-\[10px\] font-bold uppercase tracking-wider bg-rio-success\/10 text-rio-success border-rio-success\/20">\s*\{customer\.status === 'active' \? 'Acceso Activo' : 'Acceso Suspendido'\}\s*<\/div>/,
  `<div className={\`mt-3 inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider \${customer.status === 'active' ? 'bg-rio-success/10 text-rio-success border-rio-success/20' : 'bg-rio-danger/10 text-rio-danger border-rio-danger/20'}\`}>
              {customer.status === 'active' ? 'Acceso Activo' : 'Acceso Suspendido'}
            </div>
            
            <div className="mt-2 text-xs font-semibold text-rio-muted flex items-center justify-center gap-1.5">
              {customer.authUserId && onlineUsers.includes(customer.authUserId) ? (
                <><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> En línea</>
              ) : (
                <><span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span> Desconectado</>
              )}
            </div>`
);


fs.writeFileSync('src/app/admin/clientes/[id]/page.tsx', code);
console.log('Admin client detail page updated');
