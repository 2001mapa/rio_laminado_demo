const fs = require('fs');

let code = fs.readFileSync('src/app/admin/vendedores/page.tsx', 'utf8');

// Ensure we get onlineUsers from useDemo
if (!code.includes('onlineUsers } = useDemo()')) {
  code = code.replace(
    'const { sellers, orders, refreshData } = useDemo();',
    'const { sellers, orders, refreshData, onlineUsers } = useDemo();'
  );
}

const avatarRegex = /<div className="w-12 h-12 rounded-full bg-rio-surface-muted flex items-center justify-center text-xl font-serif text-rio-gold-dark border border-rio-border shrink-0 shadow-sm">\s*\{seller\.name\.charAt\(0\)\}\s*<\/div>/;

const replacement = `
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-rio-surface-muted flex items-center justify-center text-xl font-serif text-rio-gold-dark border border-rio-border shrink-0 shadow-sm">
                    {seller.name.charAt(0)}
                  </div>
                  {seller.authUserId && onlineUsers.includes(seller.authUserId) ? (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-rio-surface rounded-full" title="En línea" aria-label="En línea" />
                  ) : (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-400 border-2 border-rio-surface rounded-full" title="Desconectado" aria-label="Desconectado" />
                  )}
                </div>
`;

code = code.replace(avatarRegex, replacement.trim());

fs.writeFileSync('src/app/admin/vendedores/page.tsx', code);
console.log('Admin sellers page updated');
