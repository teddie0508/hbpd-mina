"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Những phần tử Tab tới được, theo thứ tự trong DOM.
 *
 * Phải lọc thêm `tabIndex >= 0`: selector `button:not([disabled])` vẫn khớp
 * nút có tabindex="-1", mà cả hai hộp thoại đều có đúng một nút như thế — lớp
 * nền bấm-để-đóng phủ kín màn hình. Không lọc thì Tab từ nút cuối vòng về
 * chính cái nút vô hình đó thay vì về ô đầu tiên.
 */
function focusables(box: HTMLElement): HTMLElement[] {
  return Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // Chỉ tính những phần tử đang hiện; nút ẩn thì Tab không tới được.
    (el) => el.tabIndex >= 0 && el.getClientRects().length > 0,
  );
}

/**
 * Giữ focus bàn phím bên trong một hộp thoại đang mở, và trả focus về đúng
 * chỗ cũ khi đóng.
 *
 * Thiếu cả hai thì người dùng bàn phím (hay trình đọc màn hình) bấm Tab là
 * nhảy ra các nút nằm KHUẤT sau lớp phủ, và đóng hộp thoại xong focus rơi về
 * đầu trang — phải Tab lại từ đầu mới tới được tấm ảnh vừa xem.
 *
 * @param active Hộp thoại đang mở. Lúc chuyển sang true thì ghi nhớ phần tử
 *               đang có focus; lúc thôi (hoặc gỡ khỏi trang) thì trả focus về đó.
 * @param initialFocus Phần tử nhận focus đầu tiên. Bỏ trống: phần tử bấm được
 *               đầu tiên. `false`: không tự đưa focus — dành cho nơi tự lo việc
 *               này (ô nhập của panel hỏi tên chờ hoạt cảnh xong mới focus).
 */
export function useFocusTrap(
  container: RefObject<HTMLElement | null>,
  active: boolean,
  initialFocus?: RefObject<HTMLElement | null> | false,
): void {
  useEffect(() => {
    if (!active) return;

    const truocDo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (initialFocus !== false) {
      const box = container.current;
      const target =
        initialFocus?.current ?? (box ? focusables(box)[0] : undefined);
      target?.focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      const box = container.current;
      if (e.key !== "Tab" || !box) return;

      const items = focusables(box);
      if (items.length === 0) return;

      const dau = items[0];
      const cuoi = items[items.length - 1];
      const dang = document.activeElement;
      const oNgoai = !box.contains(dang);

      if (e.shiftKey && (dang === dau || oNgoai)) {
        e.preventDefault();
        cuoi.focus();
      } else if (!e.shiftKey && (dang === cuoi || oNgoai)) {
        e.preventDefault();
        dau.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Trả focus về chỗ cũ, nếu chỗ đó vẫn còn trên trang.
      if (truocDo && document.contains(truocDo)) {
        truocDo.focus({ preventScroll: true });
      }
    };
    // `container` và `initialFocus` là ref, không đổi giữa các lần dựng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
