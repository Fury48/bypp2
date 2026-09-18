alter table cards add column subtype text check (subtype is null or subtype in ('character', 'talent'));
