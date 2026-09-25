const fs = require('fs');

// 1. Update src/app/actions/auth.ts
let auth = fs.readFileSync('src/app/actions/auth.ts', 'utf8');

if (!auth.includes('resolveLoginDestination')) {
  auth += `\n
import { getSessionUser } from '@/utils/auth-helpers'

export async function resolveLoginDestination() {
  const { user, role, status } = await getSessionUser();
  if (!user || !role) {
    return { success: false, message: 'Usuario sin rol asignado o perfil inválido.' };
  }
  if (status !== 'active' && role !== 'admin') {
    return { success: false, message: 'Tu cuenta ha sido suspendida.' };
  }
  const targetPath = role === 'admin' ? '/admin' : role === 'vendedor' ? '/vendedor' : '/cliente';
  return { success: true, targetPath };
}
`;
  fs.writeFileSync('src/app/actions/auth.ts', auth);
}

// 2. Update src/app/login/page.tsx
let login = fs.readFileSync('src/app/login/page.tsx', 'utf8');

login = login.replace(/import \{ useRouter \} from 'next\/navigation';/, "import { useRouter } from 'next/navigation';\nimport { resolveLoginDestination } from '@/app/actions/auth';");

const oldLogic = /const role = data\.user\?\.app_metadata\?\.role[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?window\.location\.assign\(targetPath\);[\s\S]*?\}, 300\);/g;

const newLogic = `
      // Check auth status securely on server
      const destination = await resolveLoginDestination();
      if (!destination.success) {
        // Sign out client-side since they are rejected
        await supabase.auth.signOut();
        setError(destination.message || 'No autorizado');
        setLoading(false);
        return;
      }
      
      setTimeout(() => {
        window.location.assign(destination.targetPath as string);
      }, 300);
`;

login = login.replace(oldLogic, newLogic);

// Remove logs containing user_metadata
login = login.replace(/sessionMetadata: debugSession\?\.user\?\.user_metadata \|\| 'N\/A'/g, '');
login = login.replace(/console\.log\('\[Login\] T0[\s\S]*?\);/g, '');
login = login.replace(/console\.log\('\[Login\] T1[\s\S]*?\);/g, '');

fs.writeFileSync('src/app/login/page.tsx', login);
console.log('Fixed login routing logic');
