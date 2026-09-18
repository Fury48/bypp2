create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "select all profiles" on profiles for select to authenticated using (true);
create policy "insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);

-- social browsing: any authenticated user can view anyone's cards.
-- writes stay restricted by the existing "insert own cards" policy.
create policy "select all cards for social" on cards for select to authenticated using (true);

create table compliments (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  card_id uuid references cards(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

alter table compliments enable row level security;

create policy "select own compliments" on compliments
  for select to authenticated using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "insert own compliments" on compliments
  for insert to authenticated with check (auth.uid() = from_user_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  card_id uuid references cards(id) on delete set null,
  claimed boolean not null default false,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "select own notifications" on notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "update own notifications" on notifications
  for update to authenticated using (auth.uid() = user_id);
-- no insert policy: notifications are written by the social-compliment edge
-- function using the service role key, which bypasses RLS.
