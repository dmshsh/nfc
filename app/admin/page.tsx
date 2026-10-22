import { requireAdmin } from '@/lib/admin';
import { Stats } from '@/components/Stats';
import { PageHeader, PeriodTabs } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const { days } = await searchParams;
  const range = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Дашборд" subtitle="Переходы гостей по всем заведениям" action={<PeriodTabs days={range} />} />
      <Stats venueId={null} days={range} />
    </main>
  );
}
