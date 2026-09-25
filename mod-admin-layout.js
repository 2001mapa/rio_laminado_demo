const fs = require('fs');
let code = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');

// The file already has import { createClient } from '@/utils/supabase/client';
// I need to add `const handleLogout = ...` inside AdminLayout.
// Let's insert it after `const { currentAdmin } = useDemo();` or `const [soundEnabled, setSoundEnabled] = useState`

const handleLogoutCode = `
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
`;

if (!code.includes('const handleLogout =')) {
  code = code.replace(/const \[isCollapsed, setIsCollapsed\] = useState\(false\);/, 'const [isCollapsed, setIsCollapsed] = useState(false);\n' + handleLogoutCode);
}

// Replace the mobile logout
code = code.replace(
  /<a\s*href="\/api\/auth\/logout"([\s\S]*?)<\/a>/g,
  '<button onClick={handleLogout} $1</button>'
);

fs.writeFileSync('src/app/admin/layout.tsx', code);
console.log('Admin layout updated with secure logout');
