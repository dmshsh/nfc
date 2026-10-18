import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';
import { Logo, btnPrimary, inputCls } from '@/components/ui';

export const dynamic = 'force-dynamic';

// Фиктивный хэш: время ответа не выдаёт, существует ли email
const DUMMY = bcrypt.hashSync('dummy-password', 10);

async function login(formData: FormData) {
  'use server';
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const [user] = await sql`select id, password_hash, venue_id, is_admin from users where email = ${email}`;
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY);
  if (!user || !ok) redirect('/login?error=1');

  await createSession(user.id, user.venue_id ?? null);
  redirect(user.is_admin ? '/admin' : '/cabinet');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={44} />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">Вход в кабинет</h1>
          <p className="mt-1 text-sm text-muted">Статистика отзывов по NFC-меткам</p>
        </div>
        <form action={login} className="space-y-4 rounded-xl bg-card p-6 shadow-sm ring-1 ring-line">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
            <input name="email" type="email" placeholder="you@example.com" required autoComplete="username" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Пароль</span>
            <input name="password" type="password" placeholder="••••••••" required autoComplete="current-password" className={inputCls} />
          </label>
          {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">Неверный email или пароль</p>}
          <button className={`${btnPrimary} w-full`}>Войти</button>
        </form>
      </div>
    </main>
  );
}
