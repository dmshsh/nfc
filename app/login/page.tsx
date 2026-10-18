import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';

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
    <main className="mx-auto mt-24 max-w-xs p-4">
      <h1 className="mb-4 text-xl font-semibold">Вход</h1>
      <form action={login} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required autoComplete="username" className="rounded border bg-white p-2" />
        <input name="password" type="password" placeholder="Пароль" required autoComplete="current-password" className="rounded border bg-white p-2" />
        {error && <p className="text-sm text-red-600">Неверный email или пароль</p>}
        <button className="rounded bg-black p-2 text-white">Войти</button>
      </form>
    </main>
  );
}
