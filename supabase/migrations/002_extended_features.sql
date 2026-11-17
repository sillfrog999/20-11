-- Migration 002: Extended Features for 20.11 - Class 9H2
-- Memories, Confessions, Comments, Reactions, Reports, and Storage Configuration

-- 1. MEMORIES TABLE (Digital Scrapbook)
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  caption text not null,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  thumbnail_url text,
  author_name text check (author_name is null or char_length(author_name) <= 60),
  tag text not null default 'Khoảnh khắc',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 2. CONFESSIONS TABLE (Góc thú tội & kỷ niệm nghịch ngợm)
create table if not exists public.confessions (
  id uuid primary key default gen_random_uuid(),
  pen_name text not null default 'Ẩn danh 9H2' check (char_length(pen_name) between 1 and 60),
  category text not null default 'Kỷ niệm' check (char_length(category) between 1 and 50),
  content text not null check (char_length(content) between 2 and 1500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

-- 3. COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('greeting', 'confession', 'memory')),
  target_id uuid not null,
  author_name text not null check (char_length(author_name) between 1 and 60),
  content text not null check (char_length(content) between 1 and 500),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- 4. REACTIONS TABLE
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('greeting', 'confession', 'memory')),
  target_id uuid not null,
  reaction_type text not null check (reaction_type in ('heart', 'flower', 'hug', 'tear', 'sparkle', 'laugh', 'agree')),
  client_hash text not null,
  created_at timestamptz not null default now(),
  constraint unique_reaction unique (target_type, target_id, client_hash, reaction_type)
);

-- 5. REPORTS TABLE
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('greeting', 'confession', 'comment')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 200),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

-- INDEXES FOR PERFORMANCE
create index if not exists idx_memories_sort on public.memories (sort_order asc, created_at desc);
create index if not exists idx_confessions_status on public.confessions (status, created_at desc);
create index if not exists idx_comments_target on public.comments (target_type, target_id, created_at asc);
create index if not exists idx_reactions_target on public.reactions (target_type, target_id);
create index if not exists idx_reports_status on public.reports (status, created_at desc);

-- ENABLE ROW LEVEL SECURITY
alter table public.memories enable row level security;
alter table public.confessions enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;

-- GRANTS
revoke all on public.memories, public.confessions, public.comments, public.reactions, public.reports from anon, authenticated;

grant select on public.memories to anon, authenticated;
grant insert, update, delete on public.memories to authenticated;

grant insert (pen_name, category, content) on public.confessions to anon, authenticated;
grant select (id, pen_name, category, content, status, created_at) on public.confessions to anon, authenticated;
grant update, delete on public.confessions to authenticated;

grant insert (target_type, target_id, author_name, content) on public.comments to anon, authenticated;
grant select on public.comments to anon, authenticated;
grant update, delete on public.comments to authenticated;

grant insert (target_type, target_id, reaction_type, client_hash) on public.reactions to anon, authenticated;
grant select on public.reactions to anon, authenticated;
grant delete on public.reactions to anon, authenticated;

grant insert (target_type, target_id, reason, details) on public.reports to anon, authenticated;
grant select, update, delete on public.reports to authenticated;

-- POLICIES

-- Memories: anyone can read; only admins can insert, update, delete
create policy "public read memories" on public.memories for select to anon, authenticated using (true);
create policy "admin insert memories" on public.memories for insert to authenticated with check (public.is_admin());
create policy "admin update memories" on public.memories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete memories" on public.memories for delete to authenticated using (public.is_admin());

-- Confessions: public insert pending; public read approved (or admin); admin update/delete
create policy "public insert pending confessions" on public.confessions for insert to anon, authenticated with check (status = 'pending');
create policy "public read approved confessions" on public.confessions for select to anon, authenticated using (status = 'approved' or public.is_admin());
create policy "admin update confessions" on public.confessions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete confessions" on public.confessions for delete to authenticated using (public.is_admin());

-- Comments: public insert; public read approved; admin manage
create policy "public insert comments" on public.comments for insert to anon, authenticated with check (status = 'approved');
create policy "public read comments" on public.comments for select to anon, authenticated using (status = 'approved' or public.is_admin());
create policy "admin manage comments" on public.comments for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Reactions: anyone can insert and read
create policy "public read reactions" on public.reactions for select to anon, authenticated using (true);
create policy "public insert reactions" on public.reactions for insert to anon, authenticated with check (true);
create policy "public delete own reaction" on public.reactions for delete to anon, authenticated using (true);

-- Reports: anyone can insert report; only admin can read and update
create policy "public insert reports" on public.reports for insert to anon, authenticated with check (status = 'pending');
create policy "admin read reports" on public.reports for select to authenticated using (public.is_admin());
create policy "admin update reports" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete reports" on public.reports for delete to authenticated using (public.is_admin());

-- 6. STORAGE BUCKET CONFIGURATION (for Supabase Storage)
-- Run this block if the 'memories' bucket has not been created yet in Supabase Dashboard
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do update set public = true;

create policy "public read memories bucket" on storage.objects for select to anon, authenticated using (bucket_id = 'memories');
create policy "admin upload memories bucket" on storage.objects for insert to authenticated with check (bucket_id = 'memories' and public.is_admin());
create policy "admin delete memories bucket" on storage.objects for delete to authenticated using (bucket_id = 'memories' and public.is_admin());
