import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { Stats } from '@/components/Stats';
import { logout } from './actions';

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
    <main className="mx-auto max-w-2xl space-y-8 p-4">
      <header className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold">{venue.name}</h1>
        <form action={logout}>
          <button className="text-sm text-gray-500 underline">Выйти</button>
        </form>
      </header>
      <Stats venueId={session.venueId} days={range} />
    </main>
  );
}
