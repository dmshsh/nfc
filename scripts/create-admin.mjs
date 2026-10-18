// Использование: npm run create-admin -- you@mail.com 'пароль'
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error('Usage: npm run create-admin -- <email> <password (min 8 chars)>');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (проверьте .env.local)');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const hash = await bcrypt.hash(password, 12);
await sql`
  insert into users (email, password_hash, is_admin)
  values (${email.trim().toLowerCase()}, ${hash}, true)
  on conflict (email) do update set password_hash = excluded.password_hash, is_admin = true`;
console.log('Админ создан:', email);
