-- nickname uniqueness must be checkable before signup (no session yet),
-- so anon also needs to read nicknames. Nicknames aren't sensitive data.
drop policy "select all profiles" on profiles;
create policy "select all profiles" on profiles for select using (true);
