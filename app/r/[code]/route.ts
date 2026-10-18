import { NextRequest, NextResponse, after } from 'next/server';
import { sql } from '@/lib/db';
import { isBot, parseUa } from '@/lib/ua';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[a-z0-9_-]{1,64}$/i.test(code)) return new NextResponse('Not found', { status: 404 });

  const [tag] = await sql`select id, target_url from tags where code = ${code}`;
  if (!tag) return new NextResponse('Not found', { status: 404 });

  const ua = req.headers.get('user-agent') ?? '';
  const { os, browser, device } = parseUa(ua);
  const lang = (req.headers.get('accept-language') ?? '').slice(0, 5) || null;
  const country = req.headers.get('x-vercel-ip-country');
  let city: string | null = null;
  try {
    city = decodeURIComponent(req.headers.get('x-vercel-ip-city') ?? '') || null;
  } catch {}
  const bot = isBot(ua);

  // Запись клика после отправки ответа, чтобы не задерживать редирект
  after(async () => {
    try {
      await sql`
        insert into clicks (tag_id, os, browser, device, lang, country, city, is_bot)
        values (${tag.id}, ${os}, ${browser}, ${device}, ${lang}, ${country}, ${city}, ${bot})`;
    } catch (e) {
      console.error('click log failed', e);
    }
  });

  // 302, не 301: иначе браузер закэширует и клики перестанут считаться
  return NextResponse.redirect(tag.target_url, 302);
}
