# 20.11 — A LETTER FOR YOU (9H2)
React + Vite + TypeScript · Supabase (Postgres, RLS, Auth, Storage) · deploy Render.

## 1. Supabase
1. Tạo project tại supabase.com. Lấy **Project URL** và **anon key** (Project Settings → API). Không bao giờ đưa `service_role` key vào frontend.
2. SQL Editor: chạy lần lượt `supabase/migrations/001_init.sql` rồi `002_media_memories_admin.sql`.
   - Tạo bucket riêng tư `media` (tối đa 50MB/tệp, chỉ JPG/PNG/WebP/MP4/WebM/MOV). Gói free của Supabase giới hạn dung lượng mỗi tệp, hãy kiểm tra giới hạn hiện tại trước khi cho nộp video dài.
   - Tệp tải lên là riêng tư; chỉ tệp thuộc bài **đã duyệt** (hoặc ảnh lớp ở Cài đặt) mới đọc được qua signed URL.
3. Authentication → Providers → Email: **tắt "Allow new users to sign up"** (tránh người lạ tự tạo tài khoản).
4. Tạo tài khoản admin: Authentication → Users → Add user (email + mật khẩu). Rồi SQL Editor:
   `insert into public.admins select id from auth.users where email = 'email-cua-ban';`

## 2. Chạy local
```
cp .env.example .env     # điền VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```
Trang admin: `/admin`. Mọi quyền được kiểm soát bằng RLS (bảng `admins` + hàm `is_admin()`), không chỉ ẩn trên giao diện.

## 3. Nhạc nền
Đặt tệp nhạc bạn có bản quyền vào `public/music.mp3` và đặt `VITE_MUSIC_URL=/music.mp3`. Nếu chưa đặt, nút nhạc bị vô hiệu hoá. Nhạc chỉ phát khi người dùng bấm.

## 4. Deploy Render
New → Blueprint (đọc `render.yaml`) hoặc Static Site: build `npm install && npm run build`, publish `dist`, rewrite `/*` → `/index.html` (cần cho `/admin`). Thêm biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MUSIC_URL`.

## 5. Cách học sinh gửi bài
- **Messages**: nhập tên (hoặc ẩn danh nếu admin cho phép), viết lời chúc, tuỳ chọn đính kèm ảnh/video (có xem trước + thanh tiến trình).
- **Memories / Confession Room**: tiêu đề, nội dung, ảnh/video, tên tuỳ chọn. Confession Room có quy tắc và phải tick cam kết.
- Mọi bài mới ở trạng thái **chờ duyệt**; admin duyệt ở `/admin` thì mới hiện công khai.
- Bình luận hiện ngay; một bình luận bị 3 thiết bị khác nhau báo cáo sẽ tự ẩn, admin xem lại ở tab Báo cáo.

## Bảo mật & giới hạn đã biết
- RLS bật trên mọi bảng; khách chỉ `INSERT` với trạng thái `pending`, chỉ đọc bài `approved` qua view không lộ tên người chọn ẩn danh.
- Giới hạn độ dài, trạng thái, loại tệp được ép ở cấp database/storage, không chỉ ở frontend.
- Văn bản người dùng luôn render dạng text (không dùng `dangerouslySetInnerHTML`).
- **Chưa có giới hạn tần suất theo IP**: hiện chỉ có honeypot, chống bấm gửi trùng, và 1 reaction/thiết bị (thiết bị nhận diện bằng ID lưu ở trình duyệt, có thể bị vượt qua). Nếu bị spam, thêm Edge Function hoặc bật CAPTCHA.
- Nếu upload thành công nhưng bước lưu bài thất bại, tệp mồ côi có thể còn trong bucket (dọn tay trong Storage).
- Chưa có ambient sound; mã chưa được build/test trên trình duyệt bởi tác giả, hãy chạy `npm run build` và thử các luồng chính trước khi dùng.
