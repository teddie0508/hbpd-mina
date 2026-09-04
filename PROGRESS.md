# Tiến độ — trang sinh nhật Mina

Cập nhật: 04/09/2026. Sinh nhật: **02/11/2026**.

## Quyết định đã chốt

| Việc | Chốt |
|---|---|
| Stack | Next.js 16.3.4 (App Router, TS) · React 19 · Tailwind v4 qua PostCSS · `motion` · `react-easy-crop` · `@vercel/blob` · `jose` · Prettier |
| Lưu nội dung | **Vercel Blob** khi deploy; tự ghi ra `.data/content.json` khi chạy ở máy (không cần token) |
| Ngôn ngữ | Chủ yếu tiếng Việt, có chỗ trộn tiếng Anh → registry font đánh dấu font nào **không** có dấu tiếng Việt |
| Cổng vào | **Đếm ngược tới 02/11/2026 00:00 +07:00**, tự mở khi về 0. Xem trước bằng `/?preview=1` (phải đã đăng nhập) |
| Điều hướng | Route thật để nút Back và swipe-back của Safari hoạt động. `/hub`, `/message`, `/memories`, `/flowers` dựng **tĩnh** và được prefetch; chỉ `/` là động |
| Nhạc | `AudioProvider` ở layout route group `(experience)` → không đứt khi chuyển trang, không lọt sang `/customize`. Bật nhạc **ngay trong cú chạm mở phong bì** |
| Màu | Xanh rêu sâu + vàng đồng + giấy be + xám khói |

## Đã xong — Phase 0 đến 6

- [x] **0** — scaffold, Tailwind v4, Prettier, `.env.example`, `.claude/launch.json`
- [x] **1** — schema nội dung, registry 31 font, store Blob/local, auth, theme, `AudioProvider`, `MiniPlayer`
- [x] **2** — đếm ngược, phong bì vẽ bằng CSS + animation mở và "chui vào trong", hub 3 lựa chọn
- [x] **3** — Message: polaroid xếp chồng + bóng bay trái tim + lời nhắn + nút Back
- [x] **4** — Memories: dải phim + thiệp giấy + khối ảnh có ảnh nền thay được, ảnh rải kèm nét đứt (màn hẹp rơi về lưới 2 cột)
- [x] **5** — Flowers: bó hoa SVG sinh ngẫu nhiên theo seed, nút đổi bó, dòng chữ bí mật ở góc → mưa cánh hoa Canvas 2D → polaroid + lời kết
- [x] **6** — `/customize`: đăng nhập, 7 tab, sửa mọi text, đổi font từng khối (cảnh báo font không dấu), tải ảnh + **khung cắt đúng tỉ lệ**, danh sách nhạc, bảng màu

## Bản đồ file

```
app/
  layout.tsx                     theme + nạp Google Fonts động + ContentProvider
  globals.css                    biến màu/font, utility font-*, sprockets, vignette
  (experience)/                  phần Mina xem — AudioProvider; chỉ page.tsx là động
    page.tsx  hub/  message/  memories/  flowers/
  customize/
    layout.tsx                   khung chung, KHÔNG chặn
    (editor)/layout.tsx          chốt chặn đăng nhập
    (editor)/page.tsx            trình sửa
    login/page.tsx
  api/auth  api/content  api/upload
components/
  landing/  hub/  message/  memories/  flowers/  player/  providers/  ui/  customize/
lib/
  content/{schema,defaults,store}.ts
  {fonts,theme,auth,placeholder,bouquet,crop,text,cx}.ts
```

## Sáu cái bẫy đã gặp, đừng dẫm lại

1. **Không khai `--font-*` trong `@theme`.** Biến trong `@theme` nằm ở `:root` nên `var()` bị thay thế **ngay tại `:root`**; khối con đặt lại `--f-heading` sẽ vô tác dụng. Font phải khai bằng `@utility font-heading { font-family: var(--f-heading) }`.

2. **`motion` ghi `transform` inline sẽ đè mất `transform` của Tailwind và của SVG.** Đã dính hai lần: ảnh rải trong `MemoryBoard` và bông hoa trong `Bouquet` (tất cả dồn về gốc toạ độ). Luôn tách hai lớp — lớp ngoài tĩnh lo vị trí, lớp trong `motion` lo opacity/scale.

3. **Utility safe-area tự viết đè mất padding của Tailwind.** `.px-safe` nằm cùng `@layer utilities` nhưng đứng sau `px-5` nên thắng, đặt padding về 0. Đã bỏ hẳn; lề trái/phải xử lý một lần ở `body`, còn trên/dưới dùng `pb-[max(4rem,env(safe-area-inset-bottom))]` ngay trong class.

4. **`perspective` biến phần tử cha thành containing block của `position: fixed`.** Lớp loé sáng `fixed inset-0` trong phong bì co lại đúng bằng khung phong bì thay vì phủ màn hình, nên lúc chuyển sang /hub trông như trang bị vỡ. Lớp phủ toàn màn hình phải dựng bằng portal ra thẳng `<body>` — xem `components/ui/WarmFlash.tsx`. `transform` và `filter` cũng gây y hệt.

5. **`Math.sin/cos` lệch chữ số cuối giữa Node và trình duyệt** → cảnh báo hydration. Mọi số sinh ra từ lượng giác phải qua `round3()` trước khi vào DOM.

6. **Đừng đặt `force-dynamic` cho các trang chỉ đọc nội dung.** Mỗi lần chuyển trang máy chủ lại gọi Vercel Blob hai lượt trước khi trả HTML, và route động thì `<Link prefetch>` không nạp trước được — chuyển cảnh khựng hẳn khi mạng yếu. Cách đúng: bọc phần đọc trong `unstable_cache` gắn nhãn, `revalidateTag` khi lưu, và để trang dựng tĩnh. Riêng `/` vẫn phải động vì đọc cookie và giờ hiện tại. Lưu ý Next 16 đổi chữ ký thành `revalidateTag(tag, { expire: 0 })`.

Ngoài ra: `placehold.co` mặc định trả SVG mà bộ tối ưu ảnh của Next chặn SVG — URL ảnh giữ chỗ phải có đuôi `.png`.

## Ghi chú công cụ

Pane xem trước trong Claude Code **không chạy `requestAnimationFrame`** khi bị ẩn, nên mọi animation của `motion` đứng ở khung hình đầu và ảnh chụp trông như trang bị hỏng. Chèn stylesheet có `!important` để ép về trạng thái cuối (inline style của motion thua `!important`):

```js
let el = document.getElementById('__still');
if (!el) { el = document.createElement('style'); el.id = '__still'; document.head.appendChild(el); }
el.textContent = `
  *:not(.fixed):not([opacity]) { opacity: 1 !important }
  .fixed.inset-0 { opacity: 0 !important }
  div[style] { transform: none !important }
`;
```

## Việc còn lại

- [ ] **Phase 7** — chạy thử thật trên Safari macOS + iOS: animation mở phong bì, mưa cánh hoa ở 120Hz, nhạc bật đúng lúc chạm, xoay ngang
- [ ] Tạo Blob store trên Vercel, đặt `CUSTOMIZE_PASSWORD` + `AUTH_SECRET`, deploy
- [ ] Xoá `.data/` trước khi deploy để đếm ngược thật có hiệu lực

## Chạy ở máy

```bash
npm run dev
```

`.env.local` có sẵn `AUTH_SECRET` và `CUSTOMIZE_PASSWORD=mina-dev`.

`.data/content.json` (đã gitignore) đang đặt `countdown.revealAt = null` để bỏ qua đếm ngược lúc dev.

Lệnh khác: `npm run build`, `npm run typecheck`, `npm run format`.

## Còn chờ bạn

- 3 icon cho Message / Memories / Flowers — hiện là ô nét đứt giữ chỗ, tải lên ở tab "Lựa chọn"
- Ảnh thật — hiện dùng placehold.co đúng tỉ lệ từng vị trí
- File nhạc — danh sách rỗng nên `MiniPlayer` đang tự ẩn
- Repo GitHub tên `hbpd-mina` còn folder là `hpbd-mina`; git đã init nhưng **chưa có remote, chưa commit lần nào**
