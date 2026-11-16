create table public.greetings(
  id uuid primary key default gen_random_uuid(),
  author_name text check (author_name is null or char_length(author_name) <= 60),
  is_anonymous boolean not null default false,
  content text not null check (char_length(content) between 2 and 1500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz);
create table public.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.site_settings(key text primary key, value text not null);
insert into public.site_settings values ('teacher_name','Cô'),('allow_anonymous','true');

create function public.is_admin() returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from public.admins where user_id = auth.uid()) $$;

alter table public.greetings enable row level security;
alter table public.admins enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.greetings, public.site_settings, public.admins from anon, authenticated;
grant insert (author_name, is_anonymous, content) on public.greetings to anon, authenticated;
grant select (id, author_name, is_anonymous, content, created_at, status) on public.greetings to anon, authenticated;
grant update, delete on public.greetings to authenticated;
grant select on public.site_settings to anon, authenticated;
grant update, insert on public.site_settings to authenticated;
grant select on public.admins to authenticated;

create policy "public insert pending" on public.greetings for insert to anon, authenticated with check (status = 'pending');
create policy "public read approved" on public.greetings for select to anon, authenticated using (status = 'approved' or public.is_admin());
create policy "admin update" on public.greetings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete" on public.greetings for delete to authenticated using (public.is_admin());
create policy "settings read" on public.site_settings for select to anon, authenticated using (true);
create policy "settings admin write" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins self read" on public.admins for select to authenticated using (user_id = auth.uid());
-- Tạo admin đầu tiên: insert into public.admins select id from auth.users where email = 'email-cua-ban';
