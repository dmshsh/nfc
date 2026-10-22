import { requireAdmin } from '@/lib/admin';
import { PageHeader } from '@/components/ui';
import { ClientForm } from '../../forms';

export default async function Page() {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Новый клиент" crumbs={[{ href: '/admin/clients', label: 'Клиенты' }]} />
      <ClientForm />
    </main>
  );
}
