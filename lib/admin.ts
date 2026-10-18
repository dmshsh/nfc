import { notFound, redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

// Вызывать и на странице, и в каждом server action: actions доступны напрямую
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect('/login');
  const [u] = await sql`select is_admin from users where id = ${s.userId}`;
  if (!u?.is_admin) notFound();
  return s;
}
