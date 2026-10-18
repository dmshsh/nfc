import { sql } from '@/lib/db';
import { clicksWord } from '@/lib/format';
import { AreaChart, HourChart } from './charts';
import { Badge, CARRIERS, Card, Empty } from './ui';

type Row = { label: string; n: number };
type TagRow = { code: string; label: string; carrier: string | null; n: number; last: string | Date | null };

const TZ = 'Asia/Almaty';

// Все выборки считаются по календарным дням Алматы: последние `days` дней, включая сегодня
export async function Stats({ venueId, days }: { venueId: string; days: number }) {
  const [daily, [prev], byCarrier, byOs, byHour, tags] = (await Promise.all([
    sql`
      select to_char(d, 'YYYY-MM-DD') as date, coalesce(x.n, 0)::int as n
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
      select count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and (c.ts at time zone 'Asia/Almaty')::date
            between (now() at time zone 'Asia/Almaty')::date - (${2 * days - 1})::int
                and (now() at time zone 'Asia/Almaty')::date - (${days})::int`,
    sql`
      select coalesce(t.carrier, 'Другое') as label, count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and (c.ts at time zone 'Asia/Almaty')::date > (now() at time zone 'Asia/Almaty')::date - (${days})::int
      group by 1 order by n desc`,
    sql`
      select coalesce(c.os, 'Другое') as label, count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and (c.ts at time zone 'Asia/Almaty')::date > (now() at time zone 'Asia/Almaty')::date - (${days})::int
      group by 1 order by n desc`,
    sql`
      select extract(hour from c.ts at time zone 'Asia/Almaty')::int::text as label, count(*)::int as n
      from clicks c join tags t on t.id = c.tag_id
      where t.venue_id = ${venueId} and not c.is_bot
        and (c.ts at time zone 'Asia/Almaty')::date > (now() at time zone 'Asia/Almaty')::date - (${days})::int
      group by 1`,
    sql`
      select t.code, coalesce(t.location_label, t.code) as label, t.carrier,
             count(c.id) filter (
               where (c.ts at time zone 'Asia/Almaty')::date > (now() at time zone 'Asia/Almaty')::date - (${days})::int
             )::int as n,
             max(c.ts) as last
      from tags t left join clicks c on c.tag_id = t.id and not c.is_bot
      where t.venue_id = ${venueId}
      group by t.id
      order by n desc, t.created_at`,
  ])) as unknown as [{ date: string; n: number }[], Row[], Row[], Row[], Row[], TagRow[]];

  const total = daily.reduce((s, r) => s + r.n, 0);
  const today = daily.at(-1)?.n ?? 0;
  const avg = (total / days).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  const best = tags[0]?.n ? tags[0] : null;
  const hours = Array.from({ length: 24 }, (_, h) => byHour.find((r) => r.label === String(h))?.n ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={`Переходы за ${days} дн.`} value={total.toLocaleString('ru-RU')} foot={<Delta cur={total} prev={prev.n} days={days} />} />
        <Kpi label="Сегодня" value={today.toLocaleString('ru-RU')} foot={clicksWord(today)} />
        <Kpi label="В среднем в день" value={avg} foot="переходов" />
        <Kpi
          label="Лучшая метка"
          value={best?.label ?? '—'}
          foot={best ? `${best.n} ${clicksWord(best.n)}` : 'нет переходов'}
          small
        />
      </div>

      <Card title="Переходы по дням" subtitle="Сколько гостей открыли страницу отзыва">
        {total === 0 ? <Empty /> : <AreaChart data={daily} />}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="По носителям" subtitle="Где гости нашли метку">
          <BarList rows={byCarrier.map((r) => ({ ...r, label: CARRIERS[r.label] ?? r.label }))} />
        </Card>
        <Card title="Устройства" subtitle="Операционная система телефона">
          <BarList rows={byOs} />
        </Card>
      </div>

      <Card title="Часы пик" subtitle="По времени Алматы">
        {total === 0 ? <Empty /> : <HourChart data={hours} />}
      </Card>

      <Card title="Метки" subtitle={`Все метки заведения, переходы за ${days} дн.`} flush>
        <TagTable rows={tags} total={total} />
      </Card>
    </div>
  );
}

function Kpi({ label, value, foot, small }: { label: string; value: string; foot: React.ReactNode; small?: boolean }) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-line sm:p-5">
      <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
      <p className={`mt-2 truncate font-semibold tracking-tight text-ink ${small ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}`}>
        {value}
      </p>
      <div className="mt-1 text-xs text-muted">{foot}</div>
    </div>
  );
}

function Delta({ cur, prev, days }: { cur: number; prev: number; days: number }) {
  if (prev === 0) return <span>нет данных за прошлые {days} дн.</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const up = pct >= 0;
  return (
    <span>
      <span className={`font-medium ${up ? 'text-good' : 'text-bad'}`}>
        {up ? '▲' : '▼'} {Math.abs(pct)}%
      </span>{' '}
      к прошлым {days} дн.
    </span>
  );
}

function BarList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <Empty />;
  const max = Math.max(1, ...rows.map((r) => r.n));
  const sum = rows.reduce((s, r) => s + r.n, 0);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 text-sm">
          <div className="relative h-8 min-w-0 flex-1">
            <div className="absolute inset-y-0 left-0 rounded-md bg-accent-soft" style={{ width: `${(r.n / max) * 100}%` }} />
            <span className="relative flex h-full items-center truncate px-2.5 text-ink">{r.label}</span>
          </div>
          <span className="w-10 text-right font-medium tabular-nums text-ink">{r.n}</span>
          <span className="w-10 text-right text-xs tabular-nums text-muted">{Math.round((r.n / sum) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}

const lastFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function TagTable({ rows, total }: { rows: TagRow[]; total: number }) {
  if (rows.length === 0) return <div className="px-5 pb-5"><Empty text="Меток пока нет" /></div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-y border-line bg-page/60 text-left text-xs text-muted">
            <th className="px-5 py-2.5 font-medium">Место</th>
            <th className="px-3 py-2.5 font-medium">Носитель</th>
            <th className="px-3 py-2.5 text-right font-medium">Переходы</th>
            <th className="px-3 py-2.5 font-medium">Доля</th>
            <th className="px-5 py-2.5 text-right font-medium">Последний переход</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const share = total ? Math.round((r.n / total) * 100) : 0;
            return (
              <tr key={r.code} className="transition-colors hover:bg-page/60">
                <td className="px-5 py-3 font-medium text-ink">{r.label}</td>
                <td className="px-3 py-3">{r.carrier ? <Badge>{CARRIERS[r.carrier] ?? r.carrier}</Badge> : <span className="text-muted">—</span>}</td>
                <td className="px-3 py-3 text-right font-medium tabular-nums text-ink">{r.n}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-grid">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
                    </div>
                    <span className="w-9 text-xs tabular-nums text-muted">{share}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap text-ink-2">
                  {r.last ? lastFmt.format(new Date(r.last)) : <span className="text-muted">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
