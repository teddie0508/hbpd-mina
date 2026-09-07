"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isEditor } from "@/lib/auth";
import type { SiteContent } from "@/lib/content/schema";
import { CONTENT_TAG, saveContent, storageMode } from "@/lib/content/store";
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
 * Cố tình là Server Action chứ không phải Route Handler: chỉ trong Server
 * Action mới gọi được `updateTag`, và đó là cách duy nhất Next 16 bảo đảm
 * "ghi xong đọc lại là thấy ngay". `revalidateTag` dùng ở Route Handler chỉ
 * đánh dấu hết hạn, nên lưu xong tải lại trang vẫn ra nội dung cũ một lúc —
 * đúng triệu chứng đã gặp: báo thành công mà không thấy gì đổi.
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

    // Xoá cache ngay lập tức. Phải gọi SAU khi ghi xong, nếu không lần đọc
    // kế tiếp có thể nạp lại đúng bản cũ vào cache.
    updateTag(CONTENT_TAG);

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
 * Bật chế độ xem như Mina: tạm thời bỏ đặc quyền của tài khoản chỉnh sửa để
 * thấy đúng những gì người ngoài thấy. Không có cái này thì cứ đăng nhập là
 * đi xuyên qua khoá, chẳng có cách nào kiểm tra cổng đếm ngược có đóng thật.
 */
export async function viewAsGuest(): Promise<void> {
  if (!(await isEditor())) return;
  (await cookies()).set(GUEST_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: GUEST_MAX_AGE,
  });
  redirect("/");
}

export async function stopViewingAsGuest(): Promise<void> {
  (await cookies()).delete(GUEST_COOKIE);
  redirect("/customize");
}
