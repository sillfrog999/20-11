-- Greetings: media
alter table public.greetings
  add column media_path text check (media_path is null or media_path ~ '^u/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov)$'),
  add column media_type text check (media_type in ('image','video'));
grant insert (media_path, media_type) on public.greetings to anon, authenticated;
grant select (media_path, media_type) on public.greetings to anon, authenticated;
grant select on public.greetings to authenticated;

-- Memories + Confession Room
create table public.memories(
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'memory' check (kind in ('memory','confession')),
  title text not null check (char_length(title) between 2 and 100),
  content text check (content is null or char_length(content) <= 2000),
  author_name text check (author_name is null or char_length(author_name) <= 60),
  is_anonymous boolean not null default false,
  media_path text check (media_path is null or media_path ~ '^u/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov)$'),
  media_type text check (media_type in ('image','video')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  check (content is not null or media_path is not null));
create table public.comments(
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  author_name text check (author_name is null or char_length(author_name) <= 60),
  content text not null check (char_length(content) between 1 and 500),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now());
create table public.reactions(
  memory_id uuid not null references public.memories(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 8 and 64),
  primary key (memory_id, device_id));
create table public.reports(
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('greeting','memory','comment')),
  target_id uuid not null,
  reason text not null check (reason in ('inappropriate','bullying','private','spam')),
  device_id text not null check (char_length(device_id) between 8 and 64),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, device_id));

alter table public.memories enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
revoke all on public.memories, public.comments, public.reactions, public.reports from anon, authenticated;

create function public.is_approved_memory(p uuid) returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from public.memories where id = p and status = 'approved') $$;
create function public.media_is_public(p text) returns boolean language sql security definer set search_path=public stable
as $$ select exists(select 1 from public.memories where media_path = p and status = 'approved')
   or exists(select 1 from public.greetings where media_path = p and status = 'approved')
   or exists(select 1 from public.site_settings where key = 'final_media_path' and value = p) $$;

-- Public views (hide real names of anonymous authors, never expose pending rows)
create view public.memories_public as
  select m.id, m.kind, m.title, m.content,
         case when m.is_anonymous then null else m.author_name end as author_name,
         m.media_path, m.media_type, m.created_at,
         (select count(*) from public.reactions r where r.memory_id = m.id)::int as likes,
         (select count(*) from public.comments c where c.memory_id = m.id and c.status = 'visible')::int as comments
  from public.memories m where m.status = 'approved';
create view public.comments_public as
  select id, memory_id, coalesce(nullif(author_name,''), 'Một học sinh 9H2') as author_name, content, created_at
  from public.comments where status = 'visible' and public.is_approved_memory(memory_id);
grant select on public.memories_public, public.comments_public to anon, authenticated;

-- Writes
grant insert (kind, title, content, author_name, is_anonymous, media_path, media_type) on public.memories to anon, authenticated;
grant select, update, delete on public.memories to authenticated;
grant insert (memory_id, author_name, content) on public.comments to anon, authenticated;
grant select, update, delete on public.comments to authenticated;
grant insert (target_type, target_id, reason, device_id) on public.reports to anon, authenticated;
grant select, delete on public.reports to authenticated;

create policy "memories insert pending" on public.memories for insert to anon, authenticated with check (status = 'pending');
create policy "memories admin all" on public.memories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "comments insert" on public.comments for insert to anon, authenticated with check (status = 'visible' and public.is_approved_memory(memory_id));
create policy "comments admin all" on public.comments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reports insert" on public.reports for insert to anon, authenticated with check (true);
create policy "reports admin read" on public.reports for select to authenticated using (public.is_admin());
create policy "reports admin delete" on public.reports for delete to authenticated using (public.is_admin());

-- Like toggle (no direct table access for visitors)
create function public.toggle_reaction(p_memory uuid, p_device text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if char_length(p_device) not between 8 and 64 then raise exception 'bad device'; end if;
  if not public.is_approved_memory(p_memory) then raise exception 'not found'; end if;
  delete from public.reactions where memory_id = p_memory and device_id = p_device;
  if found then return false; end if;
  insert into public.reactions values (p_memory, p_device);
  return true;
end $$;
grant execute on function public.toggle_reaction(uuid, text) to anon, authenticated;

-- Auto-hide a comment once 3 different devices report it (admin still reviews)
create function public.on_report() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.target_type = 'comment' and (select count(*) from public.reports where target_type = 'comment' and target_id = new.target_id) >= 3 then
    update public.comments set status = 'hidden' where id = new.target_id;
  end if;
  return new;
end $$;
create trigger reports_after_insert after insert on public.reports for each row execute function public.on_report();

-- Storage: private bucket, uploads limited by type/size/path; reads only for approved media (or admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media','media',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types, public = false;
create policy "media upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'media' and name ~ '^u/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov)$');
create policy "media read approved" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media' and (public.is_admin() or public.media_is_public(name)));
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

insert into public.site_settings values
  ('final_message','Chúng em kính chúc cô luôn mạnh khỏe, hạnh phúc và giữ mãi nhiệt huyết với nghề giáo.'),
  ('final_media_path','')
on conflict (key) do nothing;
