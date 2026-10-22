import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin';
import { AdminShell } from './shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const collapsed = (await cookies()).get('sidebar')?.value === 'collapsed';
  return <AdminShell initialCollapsed={collapsed}>{children}</AdminShell>;
}
