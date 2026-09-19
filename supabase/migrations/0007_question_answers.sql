create table question_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  created_at timestamptz not null default now()
);

create index question_answers_user_id_idx on question_answers(user_id);

alter table question_answers enable row level security;

create policy "select own question answers" on question_answers
  for select to authenticated using (auth.uid() = user_id);

create policy "insert own question answers" on question_answers
  for insert to authenticated with check (auth.uid() = user_id);
