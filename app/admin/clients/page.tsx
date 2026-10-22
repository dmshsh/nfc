import Link from 'next/link';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { plural } from '@/lib/format';
import { Card, Empty, PageHeader, btnPrimary } from '@/components/ui';

export const dynamic = 'force-dynamic';

type ClientRow = { id: string; name: string; email: string | null; tags: number; clicks: number; uniq: number };

export default async function Page() {
  await requireAdmin();
  const clients = (await sql`
    select v.id, v.name, u.email,
           (select count(*)::int from tags t where t.venue_id = v.id) as tags,
           count(c.id)::int as clicks,
           count(distinct c.visitor_id)::int as uniq
    from venues v
      left join users u on u.venue_id = v.id and not u.is_admin
      left join tags t on t.venue_id = v.id
      left join clicks c on c.tag_id = t.id and not c.is_bot and c.ts > now() - interval '30 days'
    group by v.id, u.email
    order by v.name`) as ClientRow[];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Клиенты"
        subtitle={`${clients.length} ${plural(clients.length, ['заведение', 'заведения', 'заведений'])}`}
        action={<Link href="/admin/clients/new" className={btnPrimary}>+ Новый клиент</Link>}
      />

      <Card flush>
        {clients.length === 0 ? (
          <div className="p-5"><Empty text="Пока нет клиентов" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-page/60 text-left text-xs text-muted">
                  <th className="px-5 py-2.5 font-medium">Заведение</th>
                  <th className="px-3 py-2.5 font-medium">Логин</th>
                  <th className="px-3 py-2.5 text-right font-medium">Метки</th>
                  <th className="px-3 py-2.5 text-right font-medium">Переходы, 30 дн.</th>
                  <th className="px-5 py-2.5 text-right font-medium">Уникальные</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {clients.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-page/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/clients/${c.id}`} className="font-medium text-accent hover:underline">{c.name}</Link>
                    </td>
                    <td className="px-3 py-3 text-ink-2">{c.email ?? <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink">{c.tags}</td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums text-ink">{c.clicks}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-2">{c.uniq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
