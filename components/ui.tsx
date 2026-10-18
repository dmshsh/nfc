import Link from 'next/link';

export const CARRIERS: Record<string, string> = {
  sticker: 'Стикер',
  tent: 'Тейбл-тент',
  receipt: 'Чек',
  stand: 'Стойка',
};

export const inputCls =
  'h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/20';
export const btnPrimary =
  'inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50';
export const btnGhost =
  'inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-page hover:text-ink';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-lg bg-accent text-white"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="currentColor" aria-hidden>
        <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5-4.9-4.5 6.6-.8z" />
      </svg>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  flush,
  className = '',
  children,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  flush?: boolean; // без внутренних отступов у тела (для таблиц)
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-line ${flush ? '' : 'p-5'} ${className}`}>
      {(title || action) && (
        <header className={`flex items-start justify-between gap-4 ${flush ? 'px-5 pt-5 pb-4' : 'mb-4'}`}>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-page px-2 py-0.5 text-xs font-medium text-ink-2 ring-1 ring-line">
      {children}
    </span>
  );
}

export function Empty({ text = 'Пока нет данных' }: { text?: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-lg border border-dashed border-line text-sm text-muted">
      {text}
    </div>
  );
}

export function PeriodTabs({ days }: { days: number }) {
  return (
    <nav className="inline-flex rounded-lg bg-card p-1 shadow-xs ring-1 ring-line">
      {[7, 30, 90].map((d) => (
        <Link
          key={d}
          href={`?days=${d}`}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            d === days ? 'bg-accent text-white shadow-sm' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {d} дней
        </Link>
      ))}
    </nav>
  );
}
