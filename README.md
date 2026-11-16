# 20.11 — A LETTER FOR YOU (9H2)
React + Vite + TS, Supabase, deploy Render.

## Chạy local
1. `cp .env.example .env` và điền `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API; chỉ dùng anon key).
2. Supabase → SQL Editor: chạy `supabase/migrations/001_init.sql`.
3. `npm install && npm run dev`

## Duyệt lời chúc (tạm thời)
Lời chúc mới có `status = 'pending'`. Vào Supabase → Table Editor → `greetings`, đổi `status` thành `approved` để hiện công khai.
Tạo admin: `insert into public.admins select id from auth.users where email = 'email-cua-ban';`

## Deploy Render
New → Blueprint (đọc `render.yaml`) hoặc Static Site: build `npm install && npm run build`, publish `dist`, rewrite `/*` → `/index.html`. Thêm 2 biến môi trường VITE_* ở trên.

## Chưa làm
Upload ảnh/video (Supabase Storage), phần Memories + Confession Room, comment/reaction, báo cáo, trang /admin, nhạc nền. Phần hoa rơi, phong bì, thư tri ân, hộp quà và gửi lời chúc dạng chữ đã có.
