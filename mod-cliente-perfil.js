const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/perfil/page.tsx', 'utf8');

// It probably has handleLogout. Let's check or add.
const handleLogoutCode = `
  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
`;

if (!code.includes('const handleLogout =')) {
  code = code.replace(/export default function ClientePerfilPage\(\) \{/, 'export default function ClientePerfilPage() {\n' + handleLogoutCode);
}

// Replace all `<a href="/api/auth/logout"` with `<button onClick={handleLogout}`
code = code.replace(
  /<a\s*href="\/api\/auth\/logout"([\s\S]*?)<\/a>/g,
  '<button onClick={handleLogout} $1</button>'
);

// We need to make sure we don't end up with `<button ... onClick={(e) => { if (!confirm...) e.preventDefault(); }} ...`
// Actually, it's fine if the button has two onClicks or we just replace the exact block.
// To be safe, I'll do a simpler replacement for the client profile.

fs.writeFileSync('src/app/cliente/perfil/page.tsx', code);
console.log('Cliente profile updated');
