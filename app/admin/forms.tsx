'use client';
import { useActionState, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { CARRIERS, Card, btnPrimary, inputCls } from '@/components/ui';
import { createClient, createTag, resetPassword, updateTag, type Row, type State } from './actions';

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

export function TagForm({ venues }: { venues: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createTag, null);
  return (
    <Card title="Новая метка" subtitle="Для существующего клиента">
      <form action={action} className="space-y-3">
        <select name="venueId" required className={inputCls}>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input name="label" placeholder="Место (Стол 5)" className={inputCls} />
          <CarrierSelect className={inputCls} />
        </div>
        <input name="targetUrl" placeholder="Ссылка на форму отзыва" required className={inputCls} />
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

export function EditTag({ code, url, carrier }: { code: string; url: string; carrier: string | null }) {
  const [state, action, pending] = useActionState(updateTag, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="code" value={code} />
      <CarrierSelect
        defaultValue={carrier ?? ''}
        allowEmpty={!carrier}
        className={`${inputCls} h-8 w-auto shrink-0 py-0 text-xs`}
      />
      <input name="targetUrl" defaultValue={url} required className={`${inputCls} h-8 min-w-0 flex-1 text-xs`} />
      <button disabled={pending} className="h-8 shrink-0 rounded-lg px-3 text-xs font-medium text-ink-2 ring-1 ring-line transition-colors hover:text-ink disabled:opacity-50">
        Сохранить
      </button>
      {state && <span className={`shrink-0 text-xs ${state.error ? 'text-bad' : 'text-good'}`}>{state.error ?? state.ok}</span>}
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <Card title="Сбросить пароль клиента" subtitle="Новый пароль покажется один раз">
      <form action={action} className="space-y-3">
        <div className="flex gap-3">
          <input name="email" type="email" placeholder="Email клиента" required className={inputCls} />
          <button disabled={pending} className={`${btnPrimary} shrink-0`}>Сбросить</button>
        </div>
        <Result state={state} />
      </form>
    </Card>
  );
}
