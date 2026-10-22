import { logout } from '@/app/cabinet/actions';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 bg-nav">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-nav-ink">{title}</div>
            {subtitle && <div className="truncate text-xs text-nav-muted">{subtitle}</div>}
          </div>
        </div>
        <form action={logout}>
          <button className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-nav-muted transition-colors hover:bg-nav-hover hover:text-nav-ink">
            Выйти
          </button>
        </form>
      </div>
    </header>
  );
}
