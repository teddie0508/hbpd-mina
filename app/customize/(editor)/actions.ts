"use server";

import { cookies } from "next/headers";

import { isEditor } from "@/lib/auth";
import type { SiteContent } from "@/lib/content/schema";
import {
  listVersions,
  readVersion,
  saveContent,
  storageMode,
  type ContentVersion,
} from "@/lib/content/store";
import { GUEST_COOKIE, GUEST_MAX_AGE } from "@/lib/gate";

export interface SaveResult {
  ok: boolean;
  /** Lý do thất bại, viết cho người đọc chứ không phải cho máy. */
  error?: string;
  /** Bản máy chủ vừa ghi. Trình sửa lấy đúng bản này làm mốc so sánh. */
  content?: SiteContent;
  storage?: "blob" | "local";
}

/**
 * Lưu nội dung.
 *
 * Là Server Action để trả thẳng bản vừa ghi về cho trình sửa làm mốc so
 * sánh, khỏi phải đọc lại từ máy chủ. Không còn cache giữa các request nào
 * cần xoá: lần đọc kế tiếp luôn lấy thẳng từ kho.
 */
export async function saveSiteContent(
  content: SiteContent,
): Promise<SaveResult> {
  if (!(await isEditor())) {
    return {
      ok: false,
      error: "Phiên đăng nhập đã hết hạn. Tải lại trang và đăng nhập lại.",
    };
  }

  if (!content || typeof content !== "object") {
    return { ok: false, error: "Dữ liệu gửi lên không hợp lệ." };
  }

  try {
    const saved = await saveContent(content);

    return {
      ok: true,
      content: saved,
      storage: storageMode(),
    };
  } catch (error) {
    console.error("[content] lưu thất bại:", error);
    return {
      ok: false,
      error:
        error instanceof Error && error.message
          ? error.message
          : "Lỗi không rõ nguyên nhân.",
    };
  }
}

/**
 * Bật/tắt chế độ xem như Mina.
 *
 * Không redirect: trình sửa giữ bản nháp trong bộ nhớ trình duyệt, tải lại
 * trang là mất sạch phần đang gõ dở. Bên gọi chỉ cần router.refresh() để lấy
 * lại trạng thái mới, cách đó không dựng lại cây component nên bản nháp còn
 * nguyên.
 *
 * Cookie dùng chung cho cả trình duyệt, nên bật ở tab này thì tab kia chỉ
 * cần tải lại là thấy đúng những gì Mina thấy.
 */
export async function setGuestPreview(on: boolean): Promise<void> {
  if (!(await isEditor())) return;

  const jar = await cookies();
  if (on) {
    jar.set(GUEST_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      maxAge: GUEST_MAX_AGE,
    });
  } else {
    jar.delete(GUEST_COOKIE);
  }
}

/** Danh sách các bản đã lưu, để lỡ tay ghi đè thì còn đường lùi. */
export async function listSavedVersions(): Promise<{
  ok: boolean;
  versions?: ContentVersion[];
  error?: string;
}> {
  if (!(await isEditor())) {
    return { ok: false, error: "Phiên đăng nhập đã hết hạn." };
  }
  if (storageMode() !== "blob") {
    return {
      ok: false,
      error:
        "Chạy ở máy thì nội dung ghi thẳng vào .data/content.json, không có lịch sử bản lưu.",
    };
  }
  try {
    return { ok: true, versions: await listVersions() };
  } catch (error) {
    console.error("[content] không liệt kê được bản lưu:", error);
    return { ok: false, error: "Không đọc được danh sách bản lưu." };
  }
}

/**
 * Đọc một bản cũ ra để xem lại.
 *
 * CHỈ ĐỌC, không ghi đè gì cả. Bên gọi nạp nội dung này vào trình sửa như một
 * bản nháp; phải tự bấm Lưu thì mới thành bản hiện hành. Nhờ vậy xem nhầm bản
 * cũng không mất gì.
 */
export async function loadSavedVersion(pathname: string): Promise<{
  ok: boolean;
  content?: SiteContent;
  error?: string;
}> {
  if (!(await isEditor())) {
    return { ok: false, error: "Phiên đăng nhập đã hết hạn." };
  }
  try {
    return { ok: true, content: await readVersion(pathname) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Không đọc được bản lưu này.",
    };
  }
}
