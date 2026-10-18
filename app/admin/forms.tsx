'use client';
import { useActionState } from 'react';
import { createClient, createTag, resetPassword, updateTagUrl } from './actions';

const input = 'w-full rounded border bg-white p-2';
const button = 'rounded bg-black px-3 py-2 text-white disabled:opacity-50';

export function ClientForm() {
  const [state, action, pending] = useActionState(createClient, null);
  return (
    <form action={action} className="space-y-2 rounded border bg-white p-3">
      <h2 className="font-medium">Новый клиент</h2>
      <input name="name" placeholder="Название заведения" required className={input} />
      <input name="email" type="email" placeholder="Email клиента (логин)" required className={input} />
      <input name="targetUrl" placeholder="Ссылка на форму отзыва (Google / 2GIS)" required className={input} />
      <input name="label" placeholder="Место метки (необязательно)" className={input} />
      <button disabled={pending} className={button}>Создать</button>
      {state?.error && <p className="text-red-600">{state.error}</p>}
      {state?.ok && <pre className="whitespace-pre-wrap break-all rounded bg-gray-100 p-2 text-sm">{state.ok}</pre>}
    </form>
  );
}

export function TagForm({ venues }: { venues: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createTag, null);
  return (
    <form action={action} className="space-y-2 rounded border bg-white p-3">
      <h2 className="font-medium">Новая метка для существующего клиента</h2>
      <select name="venueId" required className={input}>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
      <input name="label" placeholder="Место (Стол 5, Касса)" className={input} />
      <select name="carrier" className={input}>
        <option value="sticker">Стикер</option>
        <option value="tent">Тейбл-тент</option>
        <option value="receipt">Чек</option>
        <option value="stand">Стойка</option>
      </select>
      <input name="targetUrl" placeholder="Ссылка на форму отзыва" required className={input} />
      <button disabled={pending} className={button}>Создать</button>
      {state?.error && <p className="text-red-600">{state.error}</p>}
      {state?.ok && <pre className="whitespace-pre-wrap break-all rounded bg-gray-100 p-2 text-sm">{state.ok}</pre>}
    </form>
  );
}

export function EditUrl({ code, url }: { code: string; url: string }) {
  const [state, action, pending] = useActionState(updateTagUrl, null);
  return (
    <form action={action} className="mt-2 flex gap-2">
      <input type="hidden" name="code" value={code} />
      <input name="targetUrl" defaultValue={url} required className="min-w-0 flex-1 rounded border bg-white p-1 text-xs" />
      <button disabled={pending} className="rounded border px-2 text-xs">Сохранить</button>
      {state && <span className={`self-center text-xs ${state.error ? 'text-red-600' : 'text-green-700'}`}>{state.error ?? state.ok}</span>}
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <form action={action} className="space-y-2 rounded border bg-white p-3">
      <h2 className="font-medium">Сбросить пароль клиента</h2>
      <input name="email" type="email" placeholder="Email клиента" required className={input} />
      <button disabled={pending} className={button}>Сбросить</button>
      {state?.error && <p className="text-red-600">{state.error}</p>}
      {state?.ok && <pre className="whitespace-pre-wrap rounded bg-gray-100 p-2 text-sm">{state.ok}</pre>}
    </form>
  );
}
