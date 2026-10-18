import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { Stats } from '@/components/Stats';
import { TopBar } from '@/components/TopBar';
import { PeriodTabs } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.venueId) redirect('/admin'); // админ без заведения

  const { days } = await searchParams;
  const range = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;

  const [venue] = await sql`select name from venues where id = ${session.venueId}`;
  if (!venue) redirect('/login');

  return (
    <>
      <TopBar title={venue.name} subtitle="Личный кабинет" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Обзор</h1>
            <p className="mt-1 text-sm text-muted">Переходы гостей по NFC-меткам на страницу отзывов</p>
          </div>
          <PeriodTabs days={range} />
        </div>
        <Stats venueId={session.venueId} days={range} />
      </main>
    </>
  );
}
