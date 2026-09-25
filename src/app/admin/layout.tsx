import { requireRole } from '@/utils/auth-helpers';
import ClientLayout from './ClientLayout';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(['admin']);
  } catch (error) {
    redirect('/login');
  }
  return <ClientLayout>{children}</ClientLayout>;
}
