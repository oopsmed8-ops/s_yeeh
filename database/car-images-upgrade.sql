-- ملاحظة: أسماء الدوال والمشغّلات granato_* داخلية في قاعدة البيانات وتُركت كما هي عمداً كي لا تتكرر إن كنت شغّلت السكربت سابقاً.
-- Sidahmed-auto — safe image gallery upgrade
-- Run only after the existing base schema and database-upgrade.sql.
-- No image rows or R2 objects are deleted by this migration.
begin;

do $$
begin
  if to_regclass('public.cars') is null then
    raise exception 'Missing public.cars table. Apply the existing base schema first.';
  end if;
  if to_regclass('public.car_images') is null then
    raise exception 'Missing public.car_images table. This migration does not create a replacement table.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='cars' and column_name='status') then
    raise exception 'public.cars.status is missing; inspect the live schema before proceeding.';
  end if;
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Missing public.is_admin() security function; verify the existing admin/RLS setup before proceeding.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='car_images' and column_name='id') then
    raise exception 'public.car_images.id is missing; inspect the live schema before proceeding.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='car_images' and column_name='car_id')
     or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='car_images' and column_name='image_url') then
    raise exception 'Expected car_images columns (car_id, image_url) are missing.';
  end if;
  if (select data_type from information_schema.columns where table_schema='public' and table_name='car_images' and column_name='car_id') <> 'uuid' then
    raise exception 'public.car_images.car_id is not UUID; this migration intentionally stops rather than guessing a key type.';
  end if;
end $$;

alter table public.car_images
  add column if not exists sort_order integer not null default 0;

do $$
begin
  if exists (
    select 1 from public.car_images
    group by car_id having count(*) > 15
  ) then
    raise exception 'Some vehicles already have more than 15 images. No rows were deleted; review these vehicles before retrying the migration.';
  end if;
  if exists (
    select 1 from public.cars c
    where c.status = 'published'
      and not exists (select 1 from public.car_images i where i.car_id = c.id)
  ) then
    raise exception 'Some published vehicles have no image. Add a primary image or move them to draft before retrying.';
  end if;
end $$;

-- Existing rows are preserved. Normalize old/default duplicate positions deterministically.
with ranked as (
  select id, row_number() over (
    partition by car_id
    order by sort_order asc nulls last, id asc
  ) - 1 as new_order
  from public.car_images
)
update public.car_images ci
set sort_order = ranked.new_order
from ranked
where ci.id = ranked.id
  and ci.sort_order is distinct from ranked.new_order;

-- Exactly one primary image per car: the row with sort_order = 0.
create unique index if not exists car_images_one_position_per_car
  on public.car_images(car_id, sort_order);

create or replace function public.granato_enforce_car_image_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_car uuid;
  image_count integer;
begin
  target_car := coalesce(new.car_id, old.car_id);
  perform pg_advisory_xact_lock(hashtextextended(target_car::text, 0));

  if tg_op = 'DELETE' then
    return old;
  end if;

  select count(*) into image_count
  from public.car_images
  where car_id = new.car_id
    and id is distinct from new.id;

  if image_count >= 15 then
    raise exception 'A vehicle can have at most 15 images including the primary image.'
      using errcode = 'check_violation';
  end if;
  if new.sort_order < 0 then
    -- Negative positions are temporarily used by the admin reorder transaction.
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists granato_car_image_limit on public.car_images;
create trigger granato_car_image_limit
before insert or update of car_id, sort_order on public.car_images
for each row execute function public.granato_enforce_car_image_limit();

create or replace function public.granato_require_primary_for_published_car()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and not exists (
    select 1 from public.car_images ci where ci.car_id = new.id and ci.sort_order = 0
  ) then
    raise exception 'A published vehicle must have a primary image (sort_order = 0).'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists granato_published_car_requires_primary on public.cars;
create constraint trigger granato_published_car_requires_primary
after insert or update on public.cars
deferrable initially immediate
for each row execute function public.granato_require_primary_for_published_car();


create or replace function public.granato_compact_car_image_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_car uuid := old.car_id;
  image_row record;
  position integer := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended(target_car::text, 0));
  -- Move all remaining rows out of the non-negative range before assigning dense positions.
  update public.car_images set sort_order = -abs(sort_order) - 1
  where car_id = target_car;
  if exists (select 1 from public.cars c where c.id=target_car and c.status='published')
     and not exists (select 1 from public.car_images i where i.car_id=target_car) then
    raise exception 'A published vehicle must keep at least one image. Set it to draft before deleting its last image.';
  end if;
  for image_row in
    select id from public.car_images
    where car_id = target_car
    order by sort_order desc, id
  loop
    update public.car_images set sort_order = position
    where id = image_row.id;
    position := position + 1;
  end loop;
  return old;
end;
$$;

drop trigger if exists granato_compact_after_image_delete on public.car_images;
create trigger granato_compact_after_image_delete
after delete on public.car_images
for each row execute function public.granato_compact_car_image_order();

drop policy if exists granato_admin_manage_images on public.car_images;
create policy granato_admin_manage_images
on public.car_images for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Keep the existing RLS model; grant no new public write permissions.
alter table public.car_images enable row level security;
grant select on public.car_images to anon, authenticated;
grant insert, update, delete on public.car_images to authenticated;

commit;

-- Verification queries (run separately after successful migration):
-- 1) No car exceeds 15 images:
-- select car_id, count(*) from public.car_images group by car_id having count(*) > 15;
-- 2) No duplicate order positions:
-- select car_id, sort_order, count(*) from public.car_images group by car_id, sort_order having count(*) > 1;
-- 3) Published cars missing primary image (must return zero rows):
-- select c.id, c.brand, c.model from public.cars c
-- where c.status='published' and not exists
-- (select 1 from public.car_images i where i.car_id=c.id and i.sort_order=0);
