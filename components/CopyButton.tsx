'use client';
import { useState } from 'react';

export function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`h-7 shrink-0 rounded-md bg-card px-2.5 text-xs font-medium text-ink-2 ring-1 ring-line transition-colors hover:text-ink ${className}`}
    >
      {done ? 'Скопировано' : 'Копировать'}
    </button>
  );
}
