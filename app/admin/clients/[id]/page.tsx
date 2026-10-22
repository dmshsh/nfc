import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { baseUrl } from '@/lib/url';
import { clicksWord, plural } from '@/lib/format';
import { Stats } from '@/components/Stats';
import { CopyButton } from '@/components/CopyButton';
import { Badge, CARRIERS, Card, Empty, PageHeader, PeriodTabs } from '@/components/ui';
import { AccessCard, EditTag, SocialsCard, TagForm } from '../../forms';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TagRow = { code: string; location_label: string | null; carrier: string | null; target_url: string; mode: string; clicks: number };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { days } = await searchParams;
  const range = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;

  const [venue] = await sql`
    select v.name, u.email
    from venues v left join users u on u.venue_id = v.id and not u.is_admin
    where v.id = ${id}`;
  if (!venue) notFound();

  const tags = (await sql`
    select t.code, t.location_label, t.carrier, t.target_url, t.mode,
           (select count(*)::int from clicks c where c.tag_id = t.id and not c.is_bot) as clicks
    from tags t where t.venue_id = ${id}
    order by t.created_at`) as TagRow[];
  const links = Object.fromEntries(
    ((await sql`select kind, url from venue_links where venue_id = ${id}`) as { kind: string; url: string }[]).map((l) => [l.kind, l.url]),
  );
  const base = baseUrl(await headers());

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={venue.name}
        subtitle={`${tags.length} ${plural(tags.length, ['метка', 'метки', 'меток'])}`}
        crumbs={[{ href: '/admin/clients', label: 'Клиенты' }]}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card title="Метки" subtitle="Ссылки для записи на NFC и цели редиректа" flush className="lg:col-span-2">
          {tags.length === 0 ? (
            <div className="px-5 pb-5"><Empty text="Пока нет меток" /></div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {tags.map((t) => {
                const link = `${base}/r/${t.code}`;
                return (
                  <li key={t.code} className="space-y-2.5 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-ink">{t.location_label ?? 'без места'}</span>
                      {t.carrier && <Badge>{CARRIERS[t.carrier] ?? t.carrier}</Badge>}
                      {t.mode === 'choice' && (
                        <Link href={`/c/${t.code}`} target="_blank" className="text-xs font-medium text-accent hover:underline">
                          Экран выбора ↗
                        </Link>
                      )}
                      <span className="ml-auto text-sm font-medium tabular-nums text-ink">
                        {t.clicks} <span className="font-normal text-muted">{clicksWord(t.clicks)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-md bg-page px-2 py-1 text-xs text-ink-2 ring-1 ring-line">{link}</code>
                      <CopyButton text={link} />
                    </div>
                    <EditTag code={t.code} url={t.target_url} carrier={t.carrier} mode={t.mode} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <TagForm venueId={id} />
          <SocialsCard venueId={id} links={links} />
          <AccessCard email={venue.email} />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <PageHeader title="Статистика" subtitle="То же, что клиент видит в своём кабинете" action={<PeriodTabs days={range} />} />
        <Stats venueId={id} days={range} />
      </div>
    </main>
  );
}
