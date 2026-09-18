alter table cards add column parent_c_id uuid references cards(id) on delete set null;

alter table cards drop constraint composite_has_parents;

alter table cards add constraint composite_has_parents check (
  (type = 'composite' and parent_a_id is not null and parent_b_id is not null)
  or (type = 'base' and parent_a_id is null and parent_b_id is null and parent_c_id is null)
);
