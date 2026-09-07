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

## Mười hai cái bẫy đã gặp, đừng dẫm lại

1. **Không khai `--font-*` trong `@theme`.** Biến trong `@theme` nằm ở `:root` nên `var()` bị thay thế **ngay tại `:root`**; khối con đặt lại `--f-heading` sẽ vô tác dụng. Font phải khai bằng `@utility font-heading { font-family: var(--f-heading) }`.

2. **`motion` ghi `transform` inline sẽ đè mất `transform` của Tailwind và của SVG.** Đã dính hai lần: ảnh rải trong `MemoryBoard` và bông hoa trong `Bouquet` (tất cả dồn về gốc toạ độ). Luôn tách hai lớp — lớp ngoài tĩnh lo vị trí, lớp trong `motion` lo opacity/scale.

3. **Utility safe-area tự viết đè mất padding của Tailwind.** `.px-safe` nằm cùng `@layer utilities` nhưng đứng sau `px-5` nên thắng, đặt padding về 0. Đã bỏ hẳn; lề trái/phải xử lý một lần ở `body`, còn trên/dưới dùng `pb-[max(4rem,env(safe-area-inset-bottom))]` ngay trong class.

4. **`perspective` biến phần tử cha thành containing block của `position: fixed`.** Lớp loé sáng `fixed inset-0` trong phong bì co lại đúng bằng khung phong bì thay vì phủ màn hình, nên lúc chuyển sang /hub trông như trang bị vỡ. Lớp phủ toàn màn hình phải dựng bằng portal ra thẳng `<body>` — xem `components/ui/WarmFlash.tsx`. `transform` và `filter` cũng gây y hệt.

5. **`Math.sin/cos` lệch chữ số cuối giữa Node và trình duyệt** → cảnh báo hydration. Mọi số sinh ra từ lượng giác phải qua `round3()` trước khi vào DOM.

6. **Đừng đặt `force-dynamic` cho các trang chỉ đọc nội dung.** Mỗi lần chuyển trang máy chủ lại gọi Vercel Blob hai lượt trước khi trả HTML, và route động thì `<Link prefetch>` không nạp trước được — chuyển cảnh khựng hẳn khi mạng yếu. Cách đúng: bọc phần đọc trong `unstable_cache` gắn nhãn, `revalidateTag` khi lưu, và để trang dựng tĩnh. Riêng `/` vẫn phải động vì đọc cookie và giờ hiện tại. Lưu ý Next 16 đổi chữ ký thành `revalidateTag(tag, { expire: 0 })`.

7. **Chỉ cache dữ liệu thô, đừng cache kết quả đã trộn với defaults.** `unstable_cache` từng bọc cả `mergeIntoDefaults`, nên khi thêm field mới vào schema, bản nằm sẵn trong cache vẫn tính theo defaults cũ — vừa deploy xong là trang văng lỗi "Cannot read properties of undefined", mãi tới khi có ai bấm Lưu mới hết. Nay cache đúng phần đọc đĩa, còn trộn lại mỗi lần đọc.

8. **`revalidateTag` KHÔNG bảo đảm ghi xong đọc lại là thấy.** Nó chỉ đánh dấu hết hạn, nên lưu xong tải lại trang vẫn ra bản cũ một lúc — báo thành công mà tưởng như không có gì đổi. Muốn đọc-thấy-ngay phải dùng `updateTag`, mà hàm đó **chỉ chạy được trong Server Action**. Vì vậy đường lưu là Server Action (`app/customize/(editor)/actions.ts`) chứ không phải Route Handler. Trình sửa còn đọc qua `getContentFresh()` bỏ qua cache, vì đó là nơi bạn nhìn vào để kiểm chứng.

9. **JPEG không có kênh alpha.** Khâu cắt ảnh từng xuất JPEG nên icon đã xoá nền hiện ra với nền đen đặc. Nay xuất WebP (trình duyệt không hỗ trợ thì tự lùi về PNG — cũng có alpha).

10. **Vercel chặn request có body quá 4,5MB trước khi function kịp chạy** (`FUNCTION_PAYLOAD_TOO_LARGE`). Một file mp3 bình thường đã vượt ngưỡng, và giới hạn này là cứng, không chỉnh bằng cấu hình. Tệp phải đi **thẳng từ trình duyệt lên Blob** bằng `upload()` của `@vercel/blob/client`; function chỉ ký một token ngắn hạn (`app/api/upload-token/route.ts`). Nhớ chặn `pathname` trong `onBeforeGenerateToken`, vì token cho phép ghi vào đúng đường dẫn client yêu cầu — thiếu bước đó thì một pathname bịa ra ghi đè được lên chính file nội dung của trang. Đường `/api/upload` cũ chỉ còn dùng khi chạy ở máy.

11. **Chốt khoá phải đặt ở MỌI trang, không chỉ trang bìa.** Đăng nhập thì đi xuyên qua khoá, nên muốn kiểm tra cổng có đóng thật phải bật "Xem như Mina" (cookie `mina_as_guest`, tự hết hạn sau một giờ) — hoặc mở cửa sổ ẩn danh.

11b. **Chốt khoá cũ (giữ để đối chiếu).** Ban đầu chỉ `/` kiểm ngày mở, nên gõ thẳng `/hub` là xem được hết dù đồng hồ còn đang đếm ngược — đếm ngược thành vô nghĩa. Nay dùng chung `lib/gate.ts` ở cả năm trang. Hệ quả: bốn trang trong không còn dựng tĩnh được nữa (phải đọc cookie và giờ hiện tại). Đổi lại bỏ được `?preview=1`: cứ đăng nhập là xem trước được hết.

12. **Đừng để cờ "chưa lưu" phụ thuộc vào lần đọc lại từ máy chủ.** Cờ này từng so bản nháp với bản đọc lại; lần đọc đó trễ một nhịp là nút vẫn báo "Lưu thay đổi" và phải bấm lần hai. Nay so với chính bản mà lệnh ghi trả về.

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
- [x] Đã deploy: a-special-gift-to-my-love.vercel.app · Blob store dùng chung, tiền tố `mina/` · region SIN1

`.data/` đã gitignore nên không bao giờ lên Vercel — bản deploy tự dùng mặc định trong `defaults.ts`, tức đếm ngược tới 02/11/2026 có hiệu lực ngay.

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
