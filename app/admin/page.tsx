import { headers } from 'next/headers';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { baseUrl } from '@/lib/url';
import { logout } from '@/app/cabinet/actions';
import { ClientForm, EditUrl, ResetForm, TagForm } from './forms';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  const base = baseUrl(await headers());

  const venues = (await sql`select id, name from venues order by name`) as { id: string; name: string }[];
  const tags = await sql`
    select t.code, t.location_label, t.carrier, t.target_url, v.name as venue,
           (select count(*)::int from clicks c where c.tag_id = t.id and not c.is_bot) as clicks
    from tags t join venues v on v.id = t.venue_id
    order by v.name, t.created_at`;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Админка</h1>
        <form action={logout}>
          <button className="text-sm text-gray-500 underline">Выйти</button>
        </form>
      </header>

      <ClientForm />
      <TagForm venues={venues} />
      <ResetForm />

      <section>
        <h2 className="mb-2 font-medium">Метки</h2>
        {tags.length === 0 && <p className="text-sm text-gray-500">Пока нет меток</p>}
        <ul className="space-y-2 text-sm">
          {tags.map((t) => (
            <li key={t.code} className="rounded border bg-white p-2">
              <b>{t.venue}</b> · {t.location_label ?? '—'} ({t.carrier ?? '—'}) · {t.clicks} кл.
              <div className="break-all text-gray-500">{base}/r/{t.code}</div>
              <EditUrl code={t.code} url={t.target_url} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
