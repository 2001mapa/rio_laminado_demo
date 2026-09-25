import { requireRole } from '@/utils/auth-helpers';
import ClientLayout from './ClientLayout';
import { redirect } from 'next/navigation';

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(['cliente']);
  } catch (error) {
    redirect('/login');
  }
  return <ClientLayout>{children}</ClientLayout>;
}
