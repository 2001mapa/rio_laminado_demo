const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/perfil/page.tsx', 'utf8');

const handleLogoutFn = `
  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
`;

code = code.replace(/export default function PerfilPage\(\) \{/, 'export default function PerfilPage() {\n' + handleLogoutFn);
fs.writeFileSync('src/app/cliente/perfil/page.tsx', code);
