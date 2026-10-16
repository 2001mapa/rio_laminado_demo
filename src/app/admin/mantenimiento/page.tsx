import { requireRole } from '@/utils/auth-helpers';
import { isClientMaintenanceActive } from '@/lib/client-maintenance';
import MaintenanceControl from './MaintenanceControl';
import { connection } from 'next/server';

export default async function MaintenanceAdminPage() {
  await connection();
  await requireRole(['admin']);
  const active = await isClientMaintenanceActive();
  return <MaintenanceControl initialActive={active} />;
}
