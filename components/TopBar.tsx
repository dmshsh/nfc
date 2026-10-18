import { logout } from '@/app/cabinet/actions';
import { Logo, btnGhost } from './ui';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-ink">{title}</div>
            {subtitle && <div className="truncate text-xs text-muted">{subtitle}</div>}
          </div>
        </div>
        <form action={logout}>
          <button className={btnGhost}>Выйти</button>
        </form>
      </div>
    </header>
  );
}
