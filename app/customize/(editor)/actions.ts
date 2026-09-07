"use server";

import { updateTag } from "next/cache";

import { isEditor } from "@/lib/auth";
import type { SiteContent } from "@/lib/content/schema";
import { CONTENT_TAG, saveContent, storageMode } from "@/lib/content/store";

export interface SaveResult {
  ok: boolean;
  /** Lý do thất bại, viết cho người đọc chứ không phải cho máy. */
  error?: string;
  updatedAt?: string;
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
      updatedAt: saved.updatedAt,
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
