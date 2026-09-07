import "server-only";

import { isEditor } from "./auth";
import { getContent } from "./content/store";

/**
 * Trang đã mở khoá chưa.
 *
 * Phải kiểm ở MỌI trang trong, không chỉ trang bìa. Trước đây chỉ "/" kiểm,
 * nên gõ thẳng /hub là xem được hết dù đồng hồ còn đang đếm ngược.
 *
 * Đã đăng nhập thì luôn qua được, để bạn xem trước bất cứ lúc nào mà không
 * cần thêm tham số gì trên URL.
 */
export async function isLocked(): Promise<boolean> {
  const content = await getContent();
  const revealAt = content.countdown.revealAt;

  if (!revealAt) return false;
  if (Date.now() >= new Date(revealAt).getTime()) return false;

  return !(await isEditor());
}
