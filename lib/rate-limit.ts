import "server-only";

/**
 * Chặn dò mật khẩu: sai 10 lần trong 10 phút là khoá 10 phút.
 *
 * GIỚI HẠN, nói thẳng: bộ đếm nằm trong bộ nhớ của một phiên bản máy chủ.
 * Trên Vercel, request được gom vào các phiên bản đang chạy sẵn và mỗi phiên
 * bản xử lý nhiều request cùng lúc, nên một kẻ dò bằng script từ một chỗ gần
 * như luôn trúng cùng một bộ đếm — chặn được. Nhưng nếu máy chủ vừa khởi động
 * lại, hoặc bị dồn sang một phiên bản mới, bộ đếm bắt đầu lại từ 0. Muốn chặn
 * tuyệt đối phải có kho dữ liệu dùng chung (ví dụ Upstash Redis). Với một
 * trang chỉ một người đăng nhập, cộng thêm mật khẩu dài, mức này là đủ.
 */

/** Sai tới lần thứ mấy thì khoá. */
const MAX_FAILS = 10;
/** Đếm các lần sai trong khoảng thời gian này. */
const WINDOW_MS = 10 * 60 * 1000;
/** Khoá bao lâu. */
const BLOCK_MS = 10 * 60 * 1000;

interface Entry {
  fails: number;
  firstFailAt: number;
  blockedUntil: number;
}

const entries = new Map<string, Entry>();

/** Định danh người gửi: địa chỉ IP mà Vercel ghi vào header. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  return ip || "khong-ro";
}

/** Dọn các mục đã hết hạn, để bộ đếm không phình mãi theo thời gian. */
function prune(now: number): void {
  for (const [key, entry] of entries) {
    if (entry.blockedUntil <= now && now - entry.firstFailAt > WINDOW_MS) {
      entries.delete(key);
    }
  }
}

/** Còn bị khoá bao nhiêu ms nữa. 0 là không bị khoá. */
export function blockedFor(key: string, now = Date.now()): number {
  const entry = entries.get(key);
  return entry && entry.blockedUntil > now ? entry.blockedUntil - now : 0;
}

/**
 * Ghi nhận một lần sai.
 *
 * Trả về số ms bị khoá (0 nếu chưa tới ngưỡng) và số lần còn được thử.
 */
export function recordFailure(
  key: string,
  now = Date.now(),
): { blockedMs: number; remaining: number } {
  prune(now);

  let entry = entries.get(key);
  if (!entry || now - entry.firstFailAt > WINDOW_MS) {
    entry = { fails: 0, firstFailAt: now, blockedUntil: 0 };
    entries.set(key, entry);
  }

  entry.fails += 1;
  if (entry.fails >= MAX_FAILS) {
    entry.blockedUntil = now + BLOCK_MS;
    // Hết khoá thì được thử lại đủ 10 lần, không bị khoá tiếp ngay lần đầu.
    entry.fails = 0;
    entry.firstFailAt = now;
  }

  return {
    blockedMs: blockedFor(key, now),
    remaining: MAX_FAILS - entry.fails,
  };
}

/** Đăng nhập đúng thì xoá sạch bộ đếm của người đó. */
export function recordSuccess(key: string): void {
  entries.delete(key);
}
