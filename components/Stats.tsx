import { sql } from '@/lib/db';

type Row = { label: string; n: number };

const TZ = 'Asia/Almaty';

export async function Stats({ venueId, days }: { venueId: string; days: number }) {
  const [daily, byTag, byCarrier, byOs, byHour] = (await Promise.all([
    sql`
      select to_char(d, 'DD.MM') as label, coalesce(x.n, 0)::int as n
      from generate_series(
        ((now() at time zone 'Asia/Almaty')::date - (${days - 1})::int)::timestamp,
        (now() at time zone 'Asia/Almaty')::date::timestamp,
        interval '1 day'
      ) d
      left join (
        select (c.ts at time zone 'Asia/Almaty')::date as day, count(*) as n
        from clicks c join tags t on t.id = c.tag_id
        where t.venue_id = ${venueId} and not c.is_bot
        group by 1
      ) x on x.day = d::date
      order by d`,
    sql`
      select coalesce(t.location_label, t.code) as label, count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and c.ts > now() - make_interval(days => (${days})::int)
      group by 1 order by n desc`,
    sql`
      select coalesce(t.carrier, 'другое') as label, count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and c.ts > now() - make_interval(days => (${days})::int)
      group by 1 order by n desc`,
    sql`
      select coalesce(c.os, 'Другое') as label, count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and c.ts > now() - make_interval(days => (${days})::int)
      group by 1 order by n desc`,
    sql`
      select extract(hour from c.ts at time zone 'Asia/Almaty')::int::text as label, count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and c.ts > now() - make_interval(days => (${days})::int)
      group by 1`,
  ])) as Row[][];

  const total = daily.reduce((s, r) => s + r.n, 0);
  const hours = Array.from({ length: 24 }, (_, h) => ({
    label: String(h),
    n: byHour.find((r) => r.label === String(h))?.n ?? 0,
  }));

  const CARRIERS: Record<string, string> = {
    sticker: 'Стикер',
    tent: 'Тейбл-тент',
    receipt: 'Чек',
    stand: 'Стойка',
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`?days=${d}`}
              className={`rounded border px-3 py-1 ${d === days ? 'bg-black text-white' : 'bg-white'}`}
            >
              {d} дн.
            </a>
          ))}
        </div>
        <p className="mt-4 text-5xl font-bold">{total}</p>
        <p className="text-sm text-gray-500">переходов за {days} дн.</p>
      </section>

      <Columns title="По дням" rows={daily} />
      <Bars title="По меткам" rows={byTag} />
      <Bars title="По носителям" rows={byCarrier.map((r) => ({ ...r, label: CARRIERS[r.label] ?? r.label }))} />
      <Bars title="Устройства" rows={byOs} />
      <Columns title={`Часы пик (${TZ})`} rows={hours} suffix=":00" />
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-gray-500">Пока нет данных</p>;
}

function Bars({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section>
      <h2 className="mb-2 font-medium">{title}</h2>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-2">
              <span className="w-32 shrink-0 truncate">{r.label}</span>
              <div className="h-4 rounded bg-blue-500" style={{ width: `${(r.n / max) * 100}%`, minWidth: 2 }} />
              <span className="tabular-nums">{r.n}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Columns({ title, rows, suffix = '' }: { title: string; rows: Row[]; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const empty = rows.every((r) => r.n === 0);
  return (
    <section>
      <h2 className="mb-2 font-medium">{title}</h2>
      {empty ? (
        <Empty />
      ) : (
        <div className="flex h-32 items-end gap-px">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex h-full min-w-0 flex-1 items-end"
              title={`${r.label}${suffix}: ${r.n}`}
            >
              <div
                className="w-full rounded-t bg-blue-500"
                style={{ height: `${(r.n / max) * 100}%`, minHeight: r.n ? 2 : 0 }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
