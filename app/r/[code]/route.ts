import { NextRequest, NextResponse, after } from 'next/server';
import { sql } from '@/lib/db';
import { isBot, parseUa } from '@/lib/ua';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // Удалённая или неверная метка — понятный экран для гостя вместо голого 404
  const gone = () => NextResponse.redirect(new URL('/gone', req.url), 302);
  if (!/^[a-z0-9_-]{1,64}$/i.test(code)) return gone();

  const [tag] = await sql`select id, target_url, mode from tags where code = ${code}`;
  if (!tag) return gone();

  const ua = req.headers.get('user-agent') ?? '';
  const { os, browser, device } = parseUa(ua);
  const lang = (req.headers.get('accept-language') ?? '').slice(0, 5) || null;
  const country = req.headers.get('x-vercel-ip-country');
  let city: string | null = null;
  try {
    city = decodeURIComponent(req.headers.get('x-vercel-ip-city') ?? '') || null;
  } catch {}
  const bot = isBot(ua);

  // Анонимный ID телефона для уникальных гостей; не-UUID из cookie не принимаем
  const saved = req.cookies.get(VISITOR_COOKIE)?.value ?? '';
  const visitorId = UUID_RE.test(saved) ? saved : crypto.randomUUID();

  // Запись клика после отправки ответа, чтобы не задерживать редирект
  after(async () => {
    try {
      await sql`
        insert into clicks (tag_id, os, browser, device, lang, country, city, is_bot, visitor_id)
        values (${tag.id}, ${os}, ${browser}, ${device}, ${lang}, ${country}, ${city}, ${bot}, ${visitorId})`;
    } catch (e) {
      console.error('click log failed', e);
    }
  });

  // 302, не 301: иначе браузер закэширует и клики перестанут считаться.
  // В режиме 'choice' гость сначала попадает на экран выбора (отзыв или соцсети)
  const dest = tag.mode === 'choice' ? new URL(`/c/${code}`, req.url) : tag.target_url;
  const res = NextResponse.redirect(dest, 302);
  res.cookies.set(VISITOR_COOKIE, visitorId, {
    path: '/r',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

const VISITOR_COOKIE = 'vid';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
