import "server-only";

import { cookies } from "next/headers";

import { isEditor } from "./auth";
import { getContent } from "./content/store";

/**
 * Trang đã mở khoá chưa.
 *
 * Phải kiểm ở MỌI trang trong, không chỉ trang bìa. Trước đây chỉ "/" kiểm,
 * nên gõ thẳng /hub là xem được hết dù đồng hồ còn đang đếm ngược.
 *
 * Đã đăng nhập thì qua được, để bạn xem trước bất cứ lúc nào mà không cần
 * thêm tham số gì trên URL — TRỪ KHI đang bật chế độ "xem như Mina", lúc đó
 * cố tình chịu khoá như người ngoài để kiểm tra xem cổng có thật sự đóng.
 */
export async function isLocked(): Promise<boolean> {
  const content = await getContent();
  const revealAt = content.countdown.revealAt;

  if (!revealAt) return false;
  if (Date.now() >= new Date(revealAt).getTime()) return false;

  if (!(await isEditor())) return true;

  // Đang tự đặt mình vào vị trí người ngoài thì chịu khoá như người ngoài.
  return await isViewingAsGuest();
}

/** Cookie bật chế độ xem như khách. Tự hết hạn sau một giờ cho khỏi quên. */
export const GUEST_COOKIE = "mina_as_guest";
export const GUEST_MAX_AGE = 60 * 60;

export async function isViewingAsGuest(): Promise<boolean> {
  return (await cookies()).get(GUEST_COOKIE)?.value === "1";
}
