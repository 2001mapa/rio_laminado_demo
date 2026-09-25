const fs = require('fs');

let code = fs.readFileSync('src/app/cliente/perfil/page.tsx', 'utf8');

// Insert handleLogout
const handleLogoutFn = `
  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
`;

if (!code.includes('const handleLogout = async')) {
  code = code.replace(/export default function ClientePerfilPage\(\) \{/, 'export default function ClientePerfilPage() {\n' + handleLogoutFn);
}

// Fix double onClick
code = code.replace(/<button onClick=\{handleLogout\}\s*onClick=\{\(e\) => \{[\s\S]*?\}\}/, '<button onClick={handleLogout}');

fs.writeFileSync('src/app/cliente/perfil/page.tsx', code);
console.log('Fixed cliente perfil');
