# A LETTER FOR YOU — 20.11 (CLASS 9H2)

Trang web tri ân đặc biệt nhân ngày Nhà giáo Việt Nam 20/11 dành tặng cô giáo chủ nhiệm của tập thể lớp 9H2.
Dự án được thiết kế theo phong cách **Romantic Editorial & Vintage Stationery** (bức thư tay cổ điển, thiệp cưới hoa khô, giấy ngà, sáp niêm phong và hiệu ứng hoa rơi lãng mạn).

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Hiệu ứng phong bì mở đầu (Opening Envelope):**
   - Phong bì vintage với sáp niêm phong mang huy hiệu 9H2.
   - Nhạc hộp nhạc du dương tự động kích hoạt mượt mà khi người dùng nhấn "Mở lá thư tri ân".

2. **01 — Messages from Our Hearts (Lời chúc):**
   - Học sinh gửi lời chúc với bộ đếm ký tự (tối đa 1500 ký tự), xác thực hợp lệ, chống spam honeypot.
   - Hỗ trợ gửi ẩn danh hoặc để lại tên/tổ.
   - Bảng lời chúc dạng thiệp vintage ngẫu nhiên nghiêng nhẹ tự nhiên, có ghim cài.
   - Modal đọc thư chi tiết, thả cảm xúc đa dạng (❤️, 🌸, 🤗, 🥺, ✨) lưu trực tiếp vào cơ sở dữ liệu Supabase.
   - Bình luận/phản hồi lời chúc và nút báo cáo nội dung không phù hợp.

3. **02 — Our Little Chaos (Cuốn sổ lưu bút số - Memories):**
   - Bộ sưu tập ảnh & video kỷ niệm của lớp 9H2 (tiết học Toán, giờ ra chơi, sinh nhật cô, tập văn nghệ...).
   - Bố cục Polaroid scrapbook với băng dính washi và thẻ phân loại.
   - Lightbox toàn màn hình xem ảnh/video chất lượng cao với chú thích và điều hướng tới/lui.
   - Modal đóng góp kỷ niệm mới: hỗ trợ tải ảnh (tối đa 20MB) hoặc video (tối đa 50MB) lên **Supabase Storage** (hoặc dán liên kết URL).

4. **03 — Confession Room (Góc thú tội & Chuyện chưa kể):**
   - Không gian an toàn để học sinh chia sẻ những câu chuyện nghịch ngợm đáng yêu về đời sống học đường (quên bài tập Toán, ăn vụng, làm cô giận rồi hối hận...).
   - Thẻ ghi chú sticky note pastel, có ghim bấm và phân loại chủ đề.
   - Cảm xúc vui nhộn (😂, 🤝, ❤️, 🥺) và bình luận.
   - Kiểm duyệt trước khi xuất bản đảm bảo môi trường sư phạm trong sáng.

5. **04 — Our Gratitude (Bức thư tri ân):**
   - Bức thư cảm ơn chân thành gửi đến cô giáo chủ nhiệm dạy Toán.
   - Giữ trọn vẹn tinh thần nguyên bản: cảm ơn cô đã biến môn Toán khô khan thành những bài học cuốn hút; thấu hiểu những lúc cô nghiêm khắc hay quát nạt đều xuất phát từ tình thương và mong muốn học sinh tiến bộ; gửi lời chúc 20/11 dồi dào sức khỏe, niềm vui và nhiệt huyết với nghề giáo.
   - Hiệu ứng xuất hiện từng đoạn theo cuộn trang (scroll reveal) với sáp niêm phong và con dấu tập thể 9H2.

6. **05 — The Final Gift (Hộp quà tri ân):**
   - Hộp quà 3D vintage sang trọng với nơ lụa vàng và sáp niêm phong.
   - Hoạt ảnh mở nơ, nắp hộp bay lên kết hợp tung hoa chúc mừng rực rỡ.
   - Mở ra **Chứng nhận đặc biệt: "Người lái đò tuyệt vời nhất"** từ 45 học sinh lớp 9H2 cùng con dấu vàng kỷ niệm.
   - Nút gói lại quà, tung thêm hoa và quay lại viết lời chúc.

7. **Hộp nhạc nền (Background Music Box):**
   - Tổng hợp âm thanh hộp nhạc (Music Box) mộc mạc nguyên bản qua Web Audio API, không lo vi phạm bản quyền hay đứt gãy kết nối mạng.
   - Điều khiển Phát / Tạm dừng, Âm lượng và Tắt tiếng, ghi nhớ tùy chọn vào `localStorage`.

8. **Hiệu ứng hoa rơi liên tục (Floral Drift):**
   - Hoa bó 💐 và hoa hồng 🌹 luân phiên rơi nhẹ nhàng xuyên suốt website.
   - Tự động tạm dừng khi ẩn tab trình duyệt để tiết kiệm pin/CPU, tuân thủ `prefers-reduced-motion`.
   - Có nút bật/tắt tiện lợi trên thanh điều hướng.

9. **Trang quản trị toàn diện (Admin Panel — `/admin`):**
   - Xác thực bảo mật qua Supabase Auth + kiểm tra quyền `public.is_admin()`.
   - Thống kê tổng quan (số lời chúc, confession, kỷ niệm, báo cáo vi phạm).
   - Duyệt / Từ chối / Xóa lời chúc và confession.
   - Quản lý tải lên và xóa tệp kỷ niệm trên Supabase Storage.
   - Xử lý các báo cáo vi phạm từ người dùng.
   - Tùy chỉnh danh xưng cô giáo và bật/tắt gửi ẩn danh.

---

## 🛠 CÔNG NGHỆ SỬ DỤNG

- **Frontend:** React 18, TypeScript, Vite 5
- **Styling:** Vanilla CSS cao cấp với hệ thống CSS Variables, không phụ thuộc thư viện UI cồng kềnh
- **Backend / Database:** Supabase (PostgreSQL với Row Level Security)
- **Lưu trữ tệp:** Supabase Storage (Bucket `memories`)
- **Hosting:** Render Static Site

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL

### 1. Chuẩn bị mã nguồn
```bash
git clone https://github.com/sillfrog999/20-11.git
cd 20-11/site
```

### 2. Thiết lập biến môi trường
Tạo tệp `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Điền thông tin API từ Supabase (Dashboard → Project Settings → API):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Cài đặt thư viện và khởi chạy
```bash
npm install
npm run dev
```
Mở trình duyệt tại `http://localhost:5173`.

---

## 🗄 HƯỚNG DẪN CẤU HÌNH SUPABASE

Vào Supabase Dashboard của bạn, mở mục **SQL Editor** và lần lượt chạy 2 file migration trong thư mục `supabase/migrations/`:

1. **Chạy `001_init.sql`:** Khởi tạo bảng `greetings`, `admins`, `site_settings` và các quyền RLS cơ bản.
2. **Chạy `002_extended_features.sql`:** Khởi tạo bảng `memories`, `confessions`, `comments`, `reactions`, `reports` và cấu hình storage bucket `memories`.

### Tạo tài khoản quản trị (Admin):
1. Vào Supabase Dashboard → **Authentication** → **Users** → Nhấn **Add User** (hoặc tạo tài khoản qua form đăng ký).
2. Mở **SQL Editor** và cấp quyền admin cho email vừa tạo:
```sql
insert into public.admins select id from auth.users where email = 'email-cua-ban@gmail.com';
```
3. Sau đó, bạn có thể truy cập `/admin` trên website và đăng nhập để duyệt lời chúc, confession và quản lý hình ảnh.

---

## 🌐 DEPLOY LÊN RENDER (STATIC SITE)

Dự án đã có cấu hình sẵn tệp `render.yaml`. Bạn có thể triển khai qua Render theo 2 cách:

### Cách 1: Render Blueprint (Tự động)
1. Kết nối kho lưu trữ GitHub `sillfrog999/20-11` với tài khoản Render.
2. Chọn **New +** → **Blueprint** → Chọn repository. Render sẽ tự động đọc `site/render.yaml`.
3. Điền 2 biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong bảng điều khiển Render.

### Cách 2: Render Static Site (Thủ công)
- **Root Directory:** `site`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Redirects / Rewrites:**
  - Type: `Rewrite`
  - Source: `/*`
  - Destination: `/index.html`
- **Environment Variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## ❤️ BẢN QUYỀN & LỜI CẢM ƠN

Dự án được xây dựng với tất cả sự trân trọng và biết ơn sâu sắc nhất của 45 học sinh **Lớp 9H2** gửi tặng Cô giáo Chủ nhiệm kính yêu nhân ngày 20/11/2026.
Chân thành cảm ơn cô vì đã luôn đồng hành, dìu dắt và truyền cảm hứng cho chúng em trên từng chặng đường trưởng thành!
