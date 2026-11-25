-- =====================================================================
-- Sidahmed-auto — صلاحيات الأدمن الكاملة (حذف الطلبات والتقييمات وإدارة السيارات والصور)
-- Supabase → SQL Editor → الصق ثم Run. آمن لإعادة التشغيل ولا يحذف أي بيانات.
-- يتطلب وجود الدالة public.is_admin() (موجودة في database-security.sql / fix-public-read.sql).
-- =====================================================================

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- الطلبات: الزائر يرسل فقط، الأدمن يقرأ ويعدّل ويحذف
alter table public.inquiries enable row level security;
drop policy if exists "inquiries_public_insert" on public.inquiries;
create policy "inquiries_public_insert" on public.inquiries for insert to anon, authenticated with check (true);
drop policy if exists "inquiries_admin_manage" on public.inquiries;
create policy "inquiries_admin_manage" on public.inquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant insert on public.inquiries to anon;
grant select, insert, update, delete on public.inquiries to authenticated;

-- التقييمات
alter table public.reviews enable row level security;
drop policy if exists "reviews_admin_manage" on public.reviews;
create policy "reviews_admin_manage" on public.reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;

-- السيارات وصورها
alter table public.cars enable row level security;
drop policy if exists "cars_admin_manage" on public.cars;
create policy "cars_admin_manage" on public.cars for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.cars to anon;
grant select, insert, update, delete on public.cars to authenticated;

alter table public.car_images enable row level security;
drop policy if exists "granato_admin_manage_images" on public.car_images;
create policy "granato_admin_manage_images" on public.car_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.car_images to anon;
grant select, insert, update, delete on public.car_images to authenticated;

-- فحص (شغّله بعد ذلك على حدة): يجب أن يظهر حسابك بدور admin
-- select id, role from public.profiles;
-- select tablename, policyname, cmd from pg_policies where tablename in ('inquiries','reviews','cars','car_images') order by 1,2;
