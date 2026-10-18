// Общие форматтеры для сервера и клиента: без Intl по датам, чтобы не было рассинхрона при гидрации

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_LONG = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// date: 'YYYY-MM-DD'
export function dayShort(date: string) {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export function dayLong(date: string) {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS_LONG[m - 1]}`;
}

export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b >= 2 && b <= 4) return forms[1];
  return forms[2];
}

export const clicksWord = (n: number) => plural(n, ['переход', 'перехода', 'переходов']);
