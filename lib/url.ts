// Белый список доменов, на которые разрешён редирект
const ALLOWED = [
  'google.com',
  'google.kz',
  'g.page',
  'goo.gl',
  '2gis.kz',
  '2gis.ru',
  '2gis.com',
  'yandex.kz',
  'yandex.ru',
  'yandex.com',
];

export function assertAllowedUrl(raw: string) {
  const u = new URL(raw);
  if (u.protocol !== 'https:') throw new Error('https only');
  const ok = ALLOWED.some((d) => u.hostname === d || u.hostname.endsWith('.' + d));
  if (!ok) throw new Error('domain not allowed');
}

// Базовый адрес сайта с реальным протоколом (локально dev-сервер работает по http)
export function baseUrl(h: Headers) {
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
