'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/app/cabinet/actions';

// Имя cookie продублировано в layout.tsx: константу из 'use client'-модуля сервер не прочитает
const SIDEBAR_COOKIE = 'sidebar';

const ITEMS = [
  {
    href: '/admin',
    label: 'Дашборд',
    exact: true,
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
  },
  {
    href: '/admin/clients',
    label: 'Клиенты',
    exact: false,
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {children}
    </svg>
  );
}

const itemCls = 'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors';
const idleCls = 'text-nav-muted hover:bg-nav-hover hover:text-nav-ink';

// Десктоп: боковое меню сворачивается до иконок (состояние в cookie, чтобы не мигало при загрузке).
// Телефон: меню выезжает поверх страницы по кнопке в верхней полосе.
export function AdminShell({ initialCollapsed, children }: { initialCollapsed: boolean; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'open'}; path=/admin; max-age=31536000; samesite=lax`;
  }

  // На десктопе в свёрнутом виде прячем подписи, оставляем иконки
  const hideLabel = collapsed ? 'lg:sr-only' : '';
  const center = collapsed ? 'lg:justify-center lg:px-0' : '';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-nav px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          className="-ml-2 grid size-9 place-items-center rounded-lg text-nav-muted transition-colors hover:bg-nav-hover hover:text-nav-ink"
        >
          <Icon><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
        </button>
        <span className="text-sm font-semibold text-nav-ink">Админка</span>
      </header>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 overflow-hidden bg-nav px-3 py-5 transition-[transform,width] duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-16' : 'lg:w-60'}`}
      >
        <div className={`flex h-9 items-center justify-between gap-2 ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className={`min-w-0 px-3 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="truncate text-sm font-semibold text-nav-ink">Отзывы</div>
            <div className="truncate text-xs text-nav-muted">Админка</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            className={`grid size-9 shrink-0 place-items-center rounded-lg lg:hidden ${idleCls}`}
          >
            <Icon><path d="M18 6 6 18M6 6l12 12" /></Icon>
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className={`hidden size-9 shrink-0 place-items-center rounded-lg lg:grid ${idleCls}`}
          >
            <Icon>{collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}</Icon>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {ITEMS.map((it) => {
            const active = it.exact ? path === it.href : path.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                title={collapsed ? it.label : undefined}
                className={`${itemCls} ${center} ${active ? 'bg-accent text-white' : idleCls}`}
              >
                <Icon>{it.icon}</Icon>
                <span className={`truncate ${hideLabel}`}>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <form action={logout}>
          <button title={collapsed ? 'Выйти' : undefined} className={`${itemCls} ${center} ${idleCls} w-full`}>
            <Icon>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </Icon>
            <span className={hideLabel}>Выйти</span>
          </button>
        </form>
      </aside>

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>{children}</div>
    </div>
  );
}
