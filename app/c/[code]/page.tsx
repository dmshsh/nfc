import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { SOCIALS, reviewLabel } from '@/lib/socials';

export const dynamic = 'force-dynamic';

type Data = { name: string; target_url: string; links: Record<string, string> };

// Скан уже записан в /r/<код>, сюда гость попадает редиректом оттуда
async function load(code: string): Promise<Data | null> {
  if (!/^[a-z0-9_-]{1,64}$/i.test(code)) return null;
  const [row] = await sql`
    select v.name, t.target_url,
           coalesce((select jsonb_object_agg(l.kind, l.url) from venue_links l where l.venue_id = v.id), '{}') as links
    from tags t join venues v on v.id = t.venue_id
    where t.code = ${code}`;
  return (row as Data) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const data = await load((await params).code);
  return { title: data?.name ?? 'Отзывы' };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const data = await load((await params).code);
  if (!data) redirect('/gone');

  const socials = SOCIALS.filter((s) => data.links[s.kind]);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{data.name}</h1>
          <p className="mt-1 text-sm text-muted">Спасибо, что заглянули! Оставьте отзыв или подпишитесь на нас</p>
        </div>

        <div className="space-y-3">
          <a
            href={data.target_url}
            className="flex h-14 items-center gap-3 rounded-xl bg-accent px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 9h8M8 13h5" />
            </svg>
            {reviewLabel(data.target_url)}
          </a>

          {socials.map((s) => (
            <a
              key={s.kind}
              href={data.links[s.kind]}
              className="flex h-14 items-center gap-3 rounded-xl px-5 text-[15px] font-semibold text-white shadow-sm ring-1 ring-white/10 transition-opacity hover:opacity-90"
              style={{ background: s.bg }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden className="shrink-0">
                <path d={s.path} />
              </svg>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
