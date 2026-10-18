// Минимальный разбор User-Agent без внешних библиотек
export function parseUa(ua: string) {
  const os = /iPhone|iPad|iPod/i.test(ua)
    ? 'iOS'
    : /Android/i.test(ua)
      ? 'Android'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : null;

  const browser = /YaBrowser/i.test(ua)
    ? 'Yandex'
    : /SamsungBrowser/i.test(ua)
      ? 'Samsung'
      : /EdgA?\//i.test(ua)
        ? 'Edge'
        : /OPR\/|Opera/i.test(ua)
          ? 'Opera'
          : /Firefox|FxiOS/i.test(ua)
            ? 'Firefox'
            : /Chrome|CriOS/i.test(ua)
              ? 'Chrome'
              : /Safari/i.test(ua)
                ? 'Safari'
                : null;

  const device = /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobile|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop';

  return { os, browser, device };
}

// Боты, превью мессенджеров, сканеры
const BOT_RE =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|telegram|whatsapp|skype|discord|curl|wget|python-requests|headless|lighthouse|monitor|uptime/i;

export function isBot(ua: string) {
  return !ua || BOT_RE.test(ua);
}
