'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { CARRIERS, Card, TAG_MODES, btnPrimary, inputCls } from '@/components/ui';
import { SOCIALS } from '@/lib/socials';
import { createClient, createTag, resetPassword, updateSocials, updateTag, type Row, type State } from './actions';

function Result({ state }: { state: State }) {
  if (!state) return null;
  if (state.error) return <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>;
  return (
    <div className="relative rounded-lg bg-accent-soft p-3 pr-24">
      {state.rows ? (
        <dl className="space-y-1.5 text-sm">
          {state.rows.map((r) => (
            <ResultRow key={r.label} row={r} />
          ))}
        </dl>
      ) : (
        <p className="text-sm break-all text-ink">{state.ok}</p>
      )}
      {state.rows?.some((r) => r.secret) && (
        <p className="mt-2 text-xs text-muted">Пароль показывается один раз — скопируйте и отправьте клиенту</p>
      )}
      {state.href && (
        <Link href={state.href} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          Перейти к клиенту →
        </Link>
      )}
      <CopyButton text={state.ok ?? ''} className="absolute top-2 right-2" />
    </div>
  );
}

function ResultRow({ row }: { row: Row }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted">{row.label}</dt>
      <dd className="flex min-w-0 items-center gap-2 break-all text-ink">
        {row.secret && !shown ? '**********' : row.value}
        {row.secret && (
          <button type="button" onClick={() => setShown(!shown)} className="shrink-0 text-xs font-medium text-accent hover:underline">
            {shown ? 'Скрыть' : 'Показать'}
          </button>
        )}
      </dd>
    </div>
  );
}

export function ClientForm() {
  const [state, action, pending] = useActionState(createClient, null);
  return (
    <Card title="Новый клиент" subtitle="Заведение, аккаунт и первая метка одной операцией">
      <form action={action} className="space-y-3">
        <input name="name" placeholder="Название заведения" required className={inputCls} />
        <input name="email" type="email" placeholder="Email клиента (логин)" required className={inputCls} />
        <input name="targetUrl" placeholder="Ссылка на форму отзыва (Google / 2GIS)" required className={inputCls} />
        <div className="grid grid-cols-2 gap-3">
          <input name="label" placeholder="Место метки (необязательно)" className={inputCls} />
          <CarrierSelect className={inputCls} />
        </div>
        <button disabled={pending} className={btnPrimary}>{pending ? 'Создаю…' : 'Создать клиента'}</button>
        <Result state={state} />
      </form>
    </Card>
  );
}

export function TagForm({ venueId }: { venueId: string }) {
  const [state, action, pending] = useActionState(createTag, null);
  return (
    <Card title="Новая метка" subtitle="Ссылку из ответа нужно записать на NFC / в QR">
      <form action={action} className="space-y-3">
        <input type="hidden" name="venueId" value={venueId} />
        <div className="grid grid-cols-2 gap-3">
          <input name="label" placeholder="Место (Стол 5)" className={inputCls} />
          <CarrierSelect className={inputCls} />
        </div>
        <input name="targetUrl" placeholder="Ссылка на форму отзыва" required className={inputCls} />
        <ModeSelect className={inputCls} />
        <button disabled={pending} className={btnPrimary}>{pending ? 'Создаю…' : 'Создать метку'}</button>
        <Result state={state} />
      </form>
    </Card>
  );
}

// allowEmpty — для старых меток без носителя: пустое значение сохраняется как null
function CarrierSelect({ className, defaultValue, allowEmpty }: { className: string; defaultValue?: string; allowEmpty?: boolean }) {
  return (
    <select name="carrier" defaultValue={defaultValue} className={className}>
      {allowEmpty && <option value="">Носитель не указан</option>}
      {Object.entries(CARRIERS).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </select>
  );
}

function ModeSelect({ className, defaultValue }: { className: string; defaultValue?: string }) {
  return (
    <select name="mode" defaultValue={defaultValue} className={className} title="Что видит гость после скана">
      {Object.entries(TAG_MODES).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </select>
  );
}

export function EditTag({ code, url, carrier, mode }: { code: string; url: string; carrier: string | null; mode: string }) {
  const [state, action, pending] = useActionState(updateTag, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="code" value={code} />
      <CarrierSelect
        defaultValue={carrier ?? ''}
        allowEmpty={!carrier}
        className={`${inputCls} h-8 w-auto shrink-0 py-0 text-xs`}
      />
      <ModeSelect defaultValue={mode} className={`${inputCls} h-8 w-auto shrink-0 py-0 text-xs`} />
      <input name="targetUrl" defaultValue={url} required className={`${inputCls} h-8 min-w-0 flex-1 text-xs`} />
      <button disabled={pending} className="h-8 shrink-0 rounded-lg px-3 text-xs font-medium text-ink-2 ring-1 ring-line transition-colors hover:text-ink disabled:opacity-50">
        Сохранить
      </button>
      {state && <span className={`shrink-0 text-xs ${state.error ? 'text-bad' : 'text-good'}`}>{state.error ?? state.ok}</span>}
    </form>
  );
}

export function AccessCard({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <Card title="Доступ в кабинет" subtitle="Новый пароль покажется один раз">
      {email ? (
        <form action={action} className="space-y-3">
          <input type="hidden" name="email" value={email} />
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-page px-2 py-1.5 text-sm text-ink-2 ring-1 ring-line">{email}</code>
            <CopyButton text={email} />
          </div>
          <button disabled={pending} className={`${btnPrimary} w-full`}>{pending ? 'Сбрасываю…' : 'Сбросить пароль'}</button>
          <Result state={state} />
        </form>
      ) : (
        <p className="text-sm text-muted">У заведения нет аккаунта</p>
      )}
    </Card>
  );
}

// links: kind → сохранённая ссылка
export function SocialsCard({ venueId, links }: { venueId: string; links: Record<string, string> }) {
  const [state, action, pending] = useActionState(updateSocials, null);
  return (
    <Card title="Экран выбора" subtitle="Кнопки соцсетей для меток в режиме «Экран выбора». Пустое поле — кнопки нет">
      <form action={action} className="space-y-3">
        <input type="hidden" name="venueId" value={venueId} />
        {SOCIALS.map((s) => (
          <label key={s.kind} className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg text-white" style={{ background: s.bg }} title={s.label}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                <path d={s.path} />
              </svg>
            </span>
            <input name={s.kind} defaultValue={links[s.kind] ?? ''} placeholder={s.placeholder} aria-label={s.label} className={inputCls} />
          </label>
        ))}
        <button disabled={pending} className={`${btnPrimary} w-full`}>{pending ? 'Сохраняю…' : 'Сохранить'}</button>
        {state && <p className={`text-sm ${state.error ? 'text-bad' : 'text-good'}`}>{state.error ?? state.ok}</p>}
      </form>
    </Card>
  );
}
