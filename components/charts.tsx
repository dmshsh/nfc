'use client';
import { useId, useState, type PointerEvent } from 'react';
import { clicksWord, dayLong, dayShort } from '@/lib/format';

// Круглая шкала по Y: 0..max с шагом 1/2/5×10ⁿ, только целые
function niceScale(maxVal: number) {
  const top = Math.max(maxVal, 1);
  const raw = top / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = Math.max(1, (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag);
  const max = Math.ceil(top / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= max; t += step) ticks.push(t);
  return { max, ticks };
}

const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact' });

function Grid({ ticks, max }: { ticks: number[]; max: number }) {
  return ticks.map((t) => (
    <div
      key={t}
      className={`pointer-events-none absolute inset-x-0 border-t ${t === 0 ? 'border-line' : 'border-grid'}`}
      style={{ bottom: `${(t / max) * 100}%` }}
    >
      <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-[11px] tabular-nums text-muted">
        {compact.format(t)}
      </span>
    </div>
  ));
}

// Подсказка справа от курсора, у правого края — слева
function Tip({ x, title, value }: { x: number; title: string; value: string }) {
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 rounded-lg bg-card px-3 py-2 text-xs whitespace-nowrap shadow-lg ring-1 ring-line"
      style={{ left: `${x}%`, transform: x > 60 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
    >
      <div className="text-muted">{title}</div>
      <div className="mt-0.5 font-semibold text-ink tabular-nums">{value}</div>
    </div>
  );
}

function spread(n: number, count: number) {
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const step = (n - 1) / (count - 1);
  return [...new Set(Array.from({ length: count }, (_, k) => Math.round(k * step)))];
}

export function AreaChart({ data }: { data: { date: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const gid = 'g' + useId().replace(/\W/g, '');
  const { max, ticks } = niceScale(Math.max(...data.map((d) => d.n)));
  const last = data.length - 1;
  const px = (k: number) => (last ? (k / last) * 100 : 50);
  const py = (v: number) => 100 - (v / max) * 100;
  const line = data.map((d, k) => `${k ? 'L' : 'M'}${px(k)},${py(d.n)}`).join('');

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.min(last, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * last))));
  };

  return (
    <div className="pl-10">
      <div
        className="relative h-56 touch-pan-y text-accent"
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setHover(null)}
      >
        <Grid ticks={ticks} max={max} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line}L${px(last)},100L${px(0)},100Z`} fill={`url(#${gid})`} />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {hover !== null && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-line" style={{ left: `${px(hover)}%` }} />
            <div
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent ring-2 ring-card"
              style={{ left: `${px(hover)}%`, bottom: `${(data[hover].n / max) * 100}%` }}
            />
            <Tip x={px(hover)} title={dayLong(data[hover].date)} value={`${data[hover].n} ${clicksWord(data[hover].n)}`} />
          </>
        )}
      </div>
      <div className="relative mt-2 h-4 text-[11px] text-muted">
        {spread(data.length, 6).map((k) => (
          <span
            key={k}
            className="absolute whitespace-nowrap"
            style={{
              left: `${px(k)}%`,
              transform: k === 0 ? 'none' : k === last ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {dayShort(data[k].date)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HourChart({ data }: { data: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const { max, ticks } = niceScale(Math.max(...data));
  const cx = (h: number) => ((h + 0.5) / data.length) * 100;

  return (
    <div className="pl-10">
      <div className="relative h-44" onPointerLeave={() => setHover(null)}>
        <Grid ticks={ticks} max={max} />
        <div className="absolute inset-0 flex">
          {data.map((n, h) => (
            <div
              key={h}
              className="flex h-full flex-1 items-end justify-center px-px"
              onPointerEnter={() => setHover(h)}
              onPointerDown={() => setHover(h)}
            >
              <div
                className={`w-full max-w-6 rounded-t bg-accent transition-opacity ${
                  hover !== null && hover !== h ? 'opacity-35' : ''
                }`}
                style={{ height: `${(n / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
        {hover !== null && (
          <Tip
            x={cx(hover)}
            title={`${hover}:00–${(hover + 1) % 24}:00`}
            value={`${data[hover]} ${clicksWord(data[hover])}`}
          />
        )}
      </div>
      <div className="relative mt-2 h-4 text-[11px] text-muted">
        {data.map((_, h) =>
          h % 3 === 0 ? (
            <span key={h} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${cx(h)}%` }}>
              {h}<span className="hidden sm:inline">:00</span>
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}
