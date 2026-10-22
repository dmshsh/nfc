import Link from 'next/link';

export const CARRIERS: Record<string, string> = {
  sticker: 'Стикер',
  tent: 'Тейбл-тент',
  receipt: 'Чек',
  stand: 'Стойка',
  cashier: 'Касса',
};

// Что видит гость после скана
export const TAG_MODES: Record<string, string> = {
  redirect: 'Сразу на отзыв',
  choice: 'Экран выбора',
};

export const inputCls =
  'h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/20';
export const btnPrimary =
  'inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50';

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

// Заголовок страницы: хлебные крошки, название, подпись и действие справа
export function PageHeader({
  title,
  subtitle,
  crumbs,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumbs && (
          <nav className="mb-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-1.5">
                <Link href={c.href} className="hover:text-accent">{c.label}</Link>
                <span aria-hidden>›</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
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
