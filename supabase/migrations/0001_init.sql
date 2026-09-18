create extension if not exists pgcrypto;

create type card_type as enum ('base', 'composite');

create table cards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text,
  type         card_type not null,
  parent_a_id  uuid references cards(id) on delete set null,
  parent_b_id  uuid references cards(id) on delete set null,
  source_question_id text,
  created_at   timestamptz not null default now(),

  constraint composite_has_parents check (
    (type = 'composite' and parent_a_id is not null and parent_b_id is not null)
    or (type = 'base' and parent_a_id is null and parent_b_id is null)
  )
);

create index cards_user_id_idx on cards(user_id);

alter table cards enable row level security;

create policy "select own cards" on cards
  for select using (auth.uid() = user_id);

create policy "insert own cards" on cards
  for insert with check (auth.uid() = user_id);
