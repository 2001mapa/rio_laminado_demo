const fs = require('fs');
const path = require('path');

['admin', 'vendedor', 'cliente'].forEach(role => {
  const layoutPath = path.join('src/app', role, 'layout.tsx');
  const clientLayoutPath = path.join('src/app', role, 'ClientLayout.tsx');
  
  if (fs.existsSync(layoutPath)) {
    let layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Only wrap if not already wrapped
    if (!layoutContent.includes('import { requireRole } from')) {
      fs.writeFileSync(clientLayoutPath, layoutContent);
      
      const serverLayoutContent = `import { requireRole } from '@/utils/auth-helpers';
import ClientLayout from './ClientLayout';
import { redirect } from 'next/navigation';

export default async function ${role.charAt(0).toUpperCase() + role.slice(1)}Layout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(['${role}']);
  } catch (error) {
    redirect('/login');
  }
  return <ClientLayout>{children}</ClientLayout>;
}
`;
      fs.writeFileSync(layoutPath, serverLayoutContent);
      console.log(`Protected ${role} layout with Server Component`);
    }
  }
});
