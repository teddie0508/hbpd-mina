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

## Hai mươi bảy cái bẫy đã gặp, đừng dẫm lại

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

13. **Đã GỠ HẲN lớp cache nội dung giữa các request — đừng thêm lại.** `unstable_cache` gắn nhãn từng được thêm để đỡ một lượt gọi Blob, và nó đẻ ra bốn lỗi liên tiếp: lưu xong trang vẫn hiện nội dung cũ; thêm field mới vào schema là trang văng lỗi ngay sau deploy; phải bấm Lưu hai lần; icon đổi rồi mà trang vẫn vẽ bản cũ hơn một lần lưu. Trang chỉ có một người xem, vài chục mili giây không đáng đánh đổi lấy chuyện hiển thị sai. Nay đọc thẳng Blob mỗi request, kèm `?v=${Date.now()}` để CDN của Blob không có gì để trả về bản cũ (từng dùng `uploadedAt` từ `list()`, nhưng ngay sau khi ghi thì `list()` có lúc còn trả mốc cũ). `cache()` của React vẫn gộp trong cùng một request.

14. **Ảnh mờ là do ba chỗ cộng lại, sửa một chỗ không đủ.** (a) `sizes` khai nhỏ hơn bề ngang thật — dải phim khai 96px mà vẽ ra 111px, trình duyệt tải bản 96 rồi kéo giãn. (b) Cạnh dài nhất lúc cắt cào bằng 1600 cho mọi vị trí, trong khi ảnh nền trải hết 1024px CSS nên màn Retina cần ~2048 — nay mỗi vị trí một mức riêng trong `SLOT_MAX_EDGE`. (c) `next/image` nén lần hai ở mức mặc định 75, chồng lên lần nén WebP lúc cắt; nay dùng 90 (Next 16 bắt phải khai trong `images.qualities`). Cách kiểm: mở trang rồi so `getBoundingClientRect().width` với tham số `w=` trong `currentSrc` — tỉ lệ phải ≥ 2 để đủ cho màn Retina.

15. **Hoạt ảnh vẽ tay phải tính theo GIÂY, không theo khung hình.** `PetalStorm` từng nhân vận tốc với một hằng số cố định ở mỗi khung hình (`vx *= 0.985`) và dùng `dt` cứng bằng `1/60`. Trên MacBook 60 Hz thì đúng; trên iPhone 15 Pro Max — màn 120 Hz — Safari gọi gấp đôi số khung hình, nên cánh hoa bị hãm nhanh gấp đôi và chỉ đi được nửa quãng đường trong cùng khoảng thời gian. Nhìn ra **y hệt máy bị giật, dù máy không rớt lấy một khung hình nào**. Nay `dt` lấy từ `now - last` (chặn trên 50 ms), còn mọi hệ số hãm đổi sang "còn lại bao nhiêu sau một giây" rồi `Math.pow(hệ_số, dt)`. Dấu hiệu nhận ra bệnh này: cuộn trang vẫn mượt mà riêng hoạt ảnh thì ì — cuộn do luồng ghép ảnh lo, nên cuộn mượt tức là máy còn khoẻ, lỗi nằm trong phép tính từng khung hình.

16. **`backdrop-filter` bắt Safari lọc lại nền mỗi khi thứ nằm dưới nó đổi.** Trình phát nhạc `fixed z-50` có `backdrop-blur-md` và nằm đè lên mọi trang; màn mưa hoa vẽ ở `z-40`, tức là nằm trong "hậu cảnh" của trình phát — mỗi khung hình của canvas là một lần Safari phải làm mờ lại vùng đó. Sửa hai đường: canvas lên `z-[60]` (trên trình phát, và trông cũng hợp lý hơn vì hoa phủ kín màn), còn `backdrop-blur` chỉ bật từ `sm:` trở lên, dưới đó dùng nền đục hơn (`bg-deep/90`) cho gần như y hệt mà không tốn gì.

17. **Đừng phóng to một phần tử đang có `filter: blur()`.** Quầng sáng ở màn kết là khối 320px kèm `blur-3xl` (64px) lại vừa chạy `scale` 1,6 giây — Safari phải dựng lại toàn bộ vết mờ ở từng khung hình, một trong những việc nặng nhất trên iOS. Đưa độ mềm vào thẳng các mốc màu của `radial-gradient` là hết bộ lọc mà nhìn không khác.

18. **Đừng chạy hoạt ảnh trên `left` / `top` / `width` / `height`.** Vệt sáng quét ngang nút "the REAL flower" từng chạy `animate={{ left: [...] }}`, lặp vô hạn suốt lúc màn hoa đang mở — mỗi khung hình là một lần tính lại bố cục. Đổi sang `x` (phép biến hình, card đồ hoạ lo trọn); muốn phần trăm tính theo bề ngang của nút thì bọc trong một khối `absolute inset-0 overflow-hidden` rồi cho vệt sáng rộng `w-full` và chạy `x: ["-100%", "100%"]`. Kèm theo là cái bẫy `transform` quen thuộc: `motion` ghi thẳng `transform` khi chạy `x`, ghi đè luôn class `skew-x-*` của Tailwind — độ nghiêng phải giao cho motion qua `style={{ skewX: -20 }}`.

19. **Đừng để một hoạt cảnh tự hủy ngay lúc nó gọi `onDone`.** `PetalStorm` từng nhận `active={phase === "storm"}`; gọi `onDone` là khối cha đổi cảnh, `active` thành false, canvas bị gỡ ngay — nên đoạn nhạt dần 1,8 giây không bao giờ chạy và cánh hoa biến mất phựt một cái. Nay component tự giữ vòng đời bằng state `running` của chính nó, `active` chỉ dùng để khởi động. Đổi lại phải có lưới an toàn riêng để dọn (`fallbackEnd`), vì khi tab bị ẩn thì `requestAnimationFrame` đứng hẳn và vòng lặp không bao giờ tự kết thúc.

20. **Đừng để hai canvas phủ kín màn hình cùng tô một lượt.** Mưa hoa còn nhạt dần gần hai giây sau khi màn kết hiện ra, mà màn kết lại thả tiếp lớp cánh hoa trôi — đúng lúc nặng nhất thì có hai lớp toàn màn hình cùng chạy. Lớp trôi nay chờ 1,8 giây rồi mới gắn vào. Trên điện thoại cả hai lớp cũng hạ tỉ lệ điểm ảnh xuống 1,5 thay vì 2 (cánh hoa vốn mềm và mờ, mắt không nhận ra, mà số điểm ảnh phải tô chỉ còn hơn một nửa).

21. **Đừng đổi `key` để chạy lại một hoạt ảnh nếu bên trong có ô nhập.** Cú lắc báo sai của panel hỏi tên ban đầu chạy bằng cách tăng `key` của khối bọc cho React dựng lại. Lắc thì có lắc, nhưng dựng lại khối bọc là dựng lại luôn ô nhập bên trong: mất con trỏ, và trên điện thoại là **sập bàn phím ngay sau lần gõ sai đầu tiên**. Dùng `useAnimationControls()` rồi `controls.start(...)` thì không đụng gì tới DOM.

22. **Đường phản hồi cho người dùng không được phụ thuộc vào hoạt ảnh.** Câu báo "sai rồi" từng nằm trong `AnimatePresence mode="wait"`: câu cũ phải chạy xong hoạt cảnh biến đi thì câu mới mới được gắn vào. Máy nào hoạt ảnh bị bóp là câu báo không bao giờ hiện. Chữ báo lỗi giờ nằm trong một thẻ `<p>` cố định, chỉ đổi nội dung và màu.

23. **Nhạc phải bật đúng trong cú chạm phong bì, kể cả khi còn lớp hỏi tên.** iOS chỉ cho phát tiếng từ bên trong một cử chỉ thật, mà bấm nút trong panel rồi `await` máy chủ là đã qua một lượt — cử chỉ hết hiệu lực, nhạc câm. Nên `audio.start()` gọi ngay lúc chạm phong bì, trước cả khi biết cô ấy có trả lời đúng hay không.

24. **Nội dung truyền vào client component nằm nguyên trong HTML.** Danh sách đáp án của lớp hỏi tên phải đi qua `forClient()` để cắt trước khi vào `<ContentProvider>` và vào trang bìa; phần so đáp án nằm trong Server Action. Không thì mở View Source là thấy hết. Cách kiểm: `fetch('/')` rồi tìm chuỗi đáp án trong HTML trả về.

25. **`cacheControlMaxAge` của Vercel Blob KHÔNG nhận giá trị dưới 60 giây.** Tài liệu ghi rõ "Cannot be set to a value lower than 1 minute", nên số 0 truyền vào bị nâng thầm lên 60. Hệ quả rất dễ đổ oan cho chỗ khác: lưu lần đầu thì thấy đổi (bản cũ ở CDN đã hết hạn từ lâu), sửa tiếp rồi lưu ngay trong vòng một phút thì đọc lại vẫn ra bản cũ — trong khi Blob vẫn ghi nhận đúng giờ lưu mới, nên nhìn như "ghi được mà không ăn". Thêm `?v=<thời điểm>` vào URL cũng vô ích, CDN của Blob không tính query string vào khoá cache. Cách sửa: **mỗi lần lưu ghi ra một đường dẫn mới** (`content/site-<13 chữ số>-<6 ký tự>.json`), đọc thì `list()` cả thư mục rồi lấy tên file lớn nhất. URL chưa từng tồn tại thì không có bản cũ nào để mà trả về, và file không bị ghi đè nên cũng không dính chuyện kho lưu trữ đồng bộ trễ. Dọn bớt, giữ ba bản gần nhất.

26. **`AnimatePresence` mặc định chạy kiểu "sync": đổi `key` là hai bản cùng nằm trong DOM.** Bong bóng thoại của gấu từng gắn `key` theo câu đang hiện, nên mỗi lần chạm là bong bóng cũ ở lại chờ chạy xong hoạt cảnh biến đi trong khi bong bóng mới đã vào — hai cái xếp chồng, đội bố cục lên suốt một phần ba giây. Chỉ đổi nội dung thì giữ MỘT phần tử với key cố định; `key` chỉ nên đổi khi thật sự là hai thứ khác nhau. Cách kiểm: đếm số phần tử khớp trong DOM ngay sau khi đổi, phải bằng 1.

27. **Đừng chuẩn hoá dữ liệu ngay trong `onChange` của ô nhập.** Ô "mỗi dòng một mục" (lời thoại của gấu, danh sách đáp án mật khẩu) từng `trim()` rồi `filter(Boolean)` ở MỖI phím gõ. Hậu quả là ô gần như không gõ nổi mà nhìn thì tưởng ô bị hỏng: dấu cách vừa bấm bao giờ cũng là ký tự cuối nên bị `trim()` xoá ngay, còn Enter thì sinh ra một dòng rỗng và dòng đó bị `filter` xoá đúng lúc vừa sinh ra. Lúc gõ chỉ được tách thô (`split("
")`), dọn dẹp dời sang `onBlur`, và bên đọc lọc lại lần nữa cho chắc — xem `LinesArea`. Cách kiểm: gõ từng ký tự một chứ đừng gán thẳng cả chuỗi, vì gán thẳng thì không lộ lỗi. Lưu ý khi kiểm bằng script: React nghe `focusout` chứ không nghe `blur`, và pane ẩn thì `el.focus()`/`el.blur()` không sinh ra sự kiện thật.

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

## Hai cách kiểm tra dễ cho kết quả sai

- **Đừng tìm chuỗi nội dung trong HTML để đoán trang đang vẽ màn nào.** Cả nội dung đếm ngược lẫn nội dung phong bì đều được nhúng vào HTML dưới dạng dữ liệu, nên "Sắp tới rồi" luôn xuất hiện dù đang vẽ màn nào. Phải tìm dấu hiệu chỉ có ở một màn: `Mở phong bì` (nút phong bì) hoặc `role="timer"` (đồng hồ).
- **`fetch` tự đi theo chuyển hướng**, nên `r.status` là mã của trang đích chứ không phải 307. Muốn biết có bị chặn hay không thì xem `r.redirected` và `r.url`.

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
