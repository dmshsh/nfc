import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ссылка не работает' };

// Сюда ведёт /r/<код>, если метку удалили или код неверный. Видят гости заведения
export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 text-center shadow-xs ring-1 ring-line sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-page text-muted ring-1 ring-line">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 17H7A5 5 0 0 1 7 7h2" />
            <path d="M15 7h2a5 5 0 0 1 4 8" />
            <path d="M8 12h4" />
            <path d="m2 2 20 20" />
          </svg>
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink">Ссылка не работает</h1>
        <p className="mt-2 text-sm text-muted">
          Эта метка больше не активна. Пожалуйста, сообщите об этом персоналу заведения.
        </p>
      </div>
    </main>
  );
}
