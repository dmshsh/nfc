'use server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { assertAllowedUrl, baseUrl } from '@/lib/url';
import { CARRIERS as CARRIER_LABELS, TAG_MODES } from '@/components/ui';
import { SOCIALS, normalizeSocial } from '@/lib/socials';

// rows — данные для показа (secret скрывается звёздочками), ok — текст для копирования,
// href — куда перейти после успеха (например, на страницу нового клиента)
export type Row = { label: string; value: string; secret?: boolean };
export type State = { ok?: string; error?: string; rows?: Row[]; href?: string } | null;

const CARRIERS = Object.keys(CARRIER_LABELS);
const modeOf = (fd: FormData) => {
  const m = String(fd.get('mode') ?? '');
  return Object.hasOwn(TAG_MODES, m) ? m : 'redirect';
};

// Заведение + аккаунт + первая метка одной операцией
export async function createClient(_: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const targetUrl = String(fd.get('targetUrl') ?? '').trim();
  const label = String(fd.get('label') ?? '').trim();
  const carrier = String(fd.get('carrier') ?? '');
  if (!name || !email) return { error: 'Заполните название и email' };

  try {
    assertAllowedUrl(targetUrl);
  } catch {
    return { error: 'Нужна https-ссылка Google, 2GIS или Яндекс' };
  }

  const password = randomBytes(9).toString('base64url');
  const hash = await bcrypt.hash(password, 12);
  const code = randomBytes(4).toString('hex');

  let venueId: string;
  try {
    const [r] = await sql`
      with v as (insert into venues (name) values (${name}) returning id),
           u as (insert into users (email, password_hash, venue_id)
                 select ${email}, ${hash}, id from v)
      insert into tags (code, venue_id, location_label, carrier, target_url)
      select ${code}, id, ${label || null}, ${CARRIERS.includes(carrier) ? carrier : null}, ${targetUrl} from v
      returning venue_id`;
    venueId = r.venue_id;
  } catch {
    return { error: 'Не удалось создать (возможно, такой email уже есть)' };
  }

  const base = baseUrl(await headers());
  revalidatePath('/admin', 'layout');
  return {
    ok: `Логин: ${email}\nПароль: ${password}\nВход: ${base}/login\n\nСсылка для NFC-метки:\n${base}/r/${code}`,
    rows: [
      { label: 'Логин', value: email },
      { label: 'Пароль', value: password, secret: true },
      { label: 'Вход', value: `${base}/login` },
      { label: 'Ссылка для NFC', value: `${base}/r/${code}` },
    ],
    href: `/admin/clients/${venueId}`,
  };
}

export async function createTag(_: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const venueId = String(fd.get('venueId') ?? '');
  const label = String(fd.get('label') ?? '').trim();
  const carrier = String(fd.get('carrier') ?? '');
  const targetUrl = String(fd.get('targetUrl') ?? '').trim();

  try {
    assertAllowedUrl(targetUrl);
  } catch {
    return { error: 'Нужна https-ссылка Google, 2GIS или Яндекс' };
  }

  const code = randomBytes(4).toString('hex');
  try {
    await sql`
      insert into tags (code, venue_id, location_label, carrier, target_url, mode)
      values (${code}, ${venueId}, ${label || null}, ${CARRIERS.includes(carrier) ? carrier : null}, ${targetUrl}, ${modeOf(fd)})`;
  } catch {
    return { error: 'Не удалось создать метку' };
  }

  const base = baseUrl(await headers());
  revalidatePath('/admin', 'layout');
  return { ok: `${base}/r/${code}` };
}

export async function updateTag(_: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const code = String(fd.get('code') ?? '');
  const targetUrl = String(fd.get('targetUrl') ?? '').trim();
  const carrier = String(fd.get('carrier') ?? '');

  try {
    assertAllowedUrl(targetUrl);
  } catch {
    return { error: 'Ссылка не подходит' };
  }

  const r = await sql`
    update tags set target_url = ${targetUrl}, carrier = ${CARRIERS.includes(carrier) ? carrier : null}, mode = ${modeOf(fd)}
    where code = ${code} returning id`;
  revalidatePath('/admin', 'layout');
  return r.length ? { ok: 'Сохранено' } : { error: 'Метка не найдена' };
}

export async function resetPassword(_: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = randomBytes(9).toString('base64url');
  const hash = await bcrypt.hash(password, 12);
  const r = await sql`update users set password_hash = ${hash} where email = ${email} and not is_admin returning id`;
  if (!r.length) return { error: 'Пользователь не найден' };
  return {
    ok: `Логин: ${email}\nПароль: ${password}`,
    rows: [
      { label: 'Логин', value: email },
      { label: 'Пароль', value: password, secret: true },
    ],
  };
}

// Соцсети заведения для экрана выбора: пустое поле удаляет кнопку
export async function updateSocials(_: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const venueId = String(fd.get('venueId') ?? '');

  const links: { kind: string; url: string | null }[] = [];
  for (const s of SOCIALS) {
    try {
      links.push({ kind: s.kind, url: normalizeSocial(s.kind, String(fd.get(s.kind) ?? '')) });
    } catch {
      return { error: `${s.label}: ссылка не подходит` };
    }
  }

  for (const l of links) {
    if (l.url) {
      await sql`
        insert into venue_links (venue_id, kind, url) values (${venueId}, ${l.kind}, ${l.url})
        on conflict (venue_id, kind) do update set url = excluded.url`;
    } else {
      await sql`delete from venue_links where venue_id = ${venueId} and kind = ${l.kind}`;
    }
  }

  revalidatePath('/admin', 'layout');
  return { ok: 'Сохранено' };
}
