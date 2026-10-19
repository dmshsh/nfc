import { headers } from 'next/headers';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { baseUrl } from '@/lib/url';
import { clicksWord, plural } from '@/lib/format';
import { TopBar } from '@/components/TopBar';
import { Badge, CARRIERS, Card, Empty } from '@/components/ui';
import { CopyButton } from '@/components/CopyButton';
import { ClientForm, EditTag, ResetForm, TagForm } from './forms';

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
  const clients = await sql`
    select u.email, v.name as venue, (select count(*)::int from tags t where t.venue_id = v.id) as tags
    from users u join venues v on v.id = u.venue_id
    where not u.is_admin
    order by v.name`;

  return (
    <>
      <TopBar title="Админка" subtitle={`${venues.length} ${plural(venues.length, ['заведение', 'заведения', 'заведений'])} · ${tags.length} ${plural(tags.length, ['метка', 'метки', 'меток'])}`} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <ClientForm />
          <div className="space-y-6">
            <TagForm venues={venues} />
            <ResetForm />
          </div>
        </div>

        <Card title="Клиенты" subtitle="Логины для входа в кабинет" flush>
          {clients.length === 0 ? (
            <div className="px-5 pb-5"><Empty text="Пока нет клиентов" /></div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {clients.map((c) => (
                <li key={c.email} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                  <span className="min-w-32 font-medium text-ink">{c.venue}</span>
                  <code className="min-w-0 flex-1 truncate text-sm text-ink-2">{c.email}</code>
                  <span className="text-xs text-muted">
                    {c.tags} {plural(c.tags, ['метка', 'метки', 'меток'])}
                  </span>
                  <CopyButton text={c.email} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Метки" subtitle="Ссылки для записи на NFC и цели редиректа" flush>
          {tags.length === 0 ? (
            <div className="px-5 pb-5"><Empty text="Пока нет меток" /></div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {tags.map((t) => {
                const link = `${base}/r/${t.code}`;
                return (
                  <li key={t.code} className="space-y-2.5 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-ink">{t.venue}</span>
                      <span className="text-muted">·</span>
                      <span className="text-sm text-ink-2">{t.location_label ?? 'без места'}</span>
                      {t.carrier && <Badge>{CARRIERS[t.carrier] ?? t.carrier}</Badge>}
                      <span className="ml-auto text-sm font-medium tabular-nums text-ink">
                        {t.clicks} <span className="font-normal text-muted">{clicksWord(t.clicks)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-md bg-page px-2 py-1 text-xs text-ink-2 ring-1 ring-line">{link}</code>
                      <CopyButton text={link} />
                    </div>
                    <EditTag code={t.code} url={t.target_url} carrier={t.carrier} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </>
  );
}
