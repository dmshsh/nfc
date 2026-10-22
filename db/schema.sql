
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  venue_id uuid references venues(id) on delete cascade, -- у админа может быть null
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  venue_id uuid not null references venues(id) on delete cascade,
  location_label text,
  carrier text,
  target_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists clicks (
  id bigserial primary key,
  tag_id uuid not null references tags(id) on delete cascade,
  ts timestamptz not null default now(),
  os text,
  browser text,
  device text,
  lang text,
  country text,
  city text,
  is_bot boolean not null default false
);

-- Что происходит при скане: 'redirect' — сразу на отзыв, 'choice' — экран выбора (отзыв + соцсети)
alter table tags add column if not exists mode text not null default 'redirect';

-- Соцсети заведения для экрана выбора; нет строки — нет кнопки
create table if not exists venue_links (
  venue_id uuid not null references venues(id) on delete cascade,
  kind text not null, -- instagram | tiktok | whatsapp
  url text not null,
  primary key (venue_id, kind)
);

-- Случайный ID телефона из cookie: для подсчёта уникальных гостей
alter table clicks add column if not exists visitor_id uuid;

create index if not exists clicks_tag_ts_idx on clicks (tag_id, ts);
create index if not exists tags_venue_idx on tags (venue_id);
