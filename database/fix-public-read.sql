-- =====================================================================
-- Sidahmed-auto — إصلاح قراءة السيارات للزوار (الهاتف / أي جهاز غير الأدمن)
-- Supabase → SQL Editor → الصق ثم Run. آمن لإعادة التشغيل ولا يحذف أي بيانات.
-- =====================================================================

-- 1) دالة الأدمن (SECURITY DEFINER حتى لا تفشل عند الزائر)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- 2) تفعيل RLS
alter table public.cars        enable row level security;
alter table public.car_images  enable row level security;
alter table public.reviews     enable row level security;

-- 3) سياسات القراءة العامة (نزيل النسخ القديمة بكل أسمائها ثم ننشئ واحدة نظيفة)
drop policy if exists "cars_public_read"            on public.cars;
drop policy if exists "cars_public_read_published"  on public.cars;
create policy "cars_public_read" on public.cars for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "car_images_public_read"           on public.car_images;
drop policy if exists "car_images_public_read_published" on public.car_images;
create policy "car_images_public_read" on public.car_images for select to anon, authenticated
  using (exists (select 1 from public.cars c where c.id = car_images.car_id and (c.status = 'published' or public.is_admin())));

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select to anon, authenticated
  using (approved = true or public.is_admin());

-- 4) صلاحيات SELECT للزائر (بدون أي كتابة)
grant select on public.cars, public.car_images, public.reviews to anon, authenticated;

-- 5) فحص (شغّله بعد ذلك على حدة): يجب أن يظهر عدد السيارات المنشورة
-- select status, count(*) from public.cars group by status;
-- select policyname, cmd, roles from pg_policies where tablename in ('cars','car_images','reviews');
