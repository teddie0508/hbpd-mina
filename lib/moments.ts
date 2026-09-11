"use client";

import { noteMoment } from "@/app/(experience)/actions";

/**
 * Ghi một dòng nhật ký, mỗi loại tối đa một lần cho mỗi tab.
 *
 * Nhớ bằng sessionStorage, nên chạy hai lượt effect của React ở chế độ dev,
 * hay quay lại trang Hoa lần nữa trong cùng tab, cũng chỉ ghi một dòng. Mở tab
 * mới vào hôm khác thì ghi dòng mới — đúng thứ muốn biết.
 */
export function noteOnce(kind: "opened" | "finale"): void {
  try {
    const key = `mina.moment.${kind}`;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Chế độ riêng tư chặn sessionStorage: vẫn ghi, cùng lắm trùng một dòng.
  }
  // Nhật ký là phụ: hỏng thì thôi, không bao giờ được làm phiền Mina.
  noteMoment(kind).catch(() => {});
}
