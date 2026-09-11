"use server";

import { cookies } from "next/headers";

import { isEditor } from "@/lib/auth";
import { UPLOAD_PREFIX } from "@/lib/blob-paths";
import type { SiteContent } from "@/lib/content/schema";
import {
  deleteUnusedUploads,
  findUnusedUploads,
  getContent,
  listVersions,
  readVersion,
  saveContent,
  storageMode,
  type ContentVersion,
  type UnusedUpload,
} from "@/lib/content/store";
import { validateContent } from "@/lib/content/validate";
import {
  GUEST_COOKIE,
  GUEST_MAX_AGE,
  PASS_COOKIE,
  REHEARSAL_COOKIE,
  REHEARSAL_MAX_AGE,
} from "@/lib/gate";
import { deleteEntry, listEntries, type InboxEntry } from "@/lib/inbox";

const HET_PHIEN = "Phiên đăng nhập đã hết hạn. Tải lại trang và đăng nhập lại.";

export interface SaveResult {
  ok: boolean;
  /** Lý do thất bại, viết cho người đọc chứ không phải cho máy. */
  error?: string;
  /** Bản máy chủ vừa ghi. Trình sửa lấy đúng bản này làm mốc so sánh. */
  content?: SiteContent;
  storage?: "blob" | "local";
  /** Đã có một bản khác được lưu sau lúc trình sửa này mở ra. */
  conflict?: { savedAt: string };
  /** Lưu được, nhưng có điều cần biết. */
  warning?: string;
}

/**
 * Lưu nội dung.
 *
 * Hai lớp chặn trước khi ghi:
 *
 * 1. Kiểm cấu trúc (lib/content/validate.ts) — một payload sai kiểu ghi ra là
 *    trang chính vỡ.
 *
 * 2. Chống ghi đè. Trình sửa gửi kèm `baseUpdatedAt`: mốc của bản mà nó đang
 *    sửa dựa trên. Trên kho mà đã có bản mới hơn thì từ chối và báo lại, trừ
 *    khi bạn bấm "Vẫn lưu đè". Không có lớp này thì mở hai tab /customize,
 *    lưu ở tab mới rồi lỡ tay lưu ở tab cũ là mọi thay đổi ở tab mới bay mất
 *    mà không một lời cảnh báo.
 */
export async function saveSiteContent(
  content: SiteContent,
  options: { baseUpdatedAt: string; force?: boolean },
): Promise<SaveResult> {
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };

  const loi = validateContent(content);
  if (loi) {
    return { ok: false, error: `Dữ liệu không hợp lệ ở ${loi}.` };
  }

  if (!options?.force) {
    const hienTai = await getContent();
    // So "mới hơn" chứ không so "khác". `list()` của Blob có lúc trả về trễ
    // một nhịp, chưa thấy tệp vừa ghi xong: vừa lưu xong mà lưu tiếp ngay thì
    // máy chủ đọc ra bản CŨ HƠN mốc của trình sửa. So "khác" là báo xung đột
    // oan đúng lúc đang lưu liên tục — lặp lại y hệt lỗi "lưu lần hai không
    // ăn" từng gặp. Chuỗi ISO cùng định dạng nên so chuỗi là so thời gian.
    if (hienTai.updatedAt > (options?.baseUpdatedAt ?? "")) {
      return {
        ok: false,
        conflict: { savedAt: hienTai.updatedAt },
        error: "Đã có một bản mới hơn được lưu từ nơi khác.",
      };
    }
  }

  try {
    const { content: saved, privacy } = await saveContent(content);
    return {
      ok: true,
      content: saved,
      storage: storageMode(),
      warning:
        privacy === "public"
          ? "Kho Blob chưa nhận tệp private, nên bản này vẫn lưu ở chế độ public — ai biết đường dẫn vẫn đọc được. Báo lại để kiểm cấu hình kho."
          : undefined,
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
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };
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
 * bản nháp; phải tự bấm Lưu thì mới thành bản hiện hành.
 */
export async function loadSavedVersion(pathname: string): Promise<{
  ok: boolean;
  content?: SiteContent;
  error?: string;
}> {
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };
  if (typeof pathname !== "string") {
    return { ok: false, error: "Đường dẫn bản lưu không hợp lệ." };
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

/**
 * Diễn tập 0h: cho trang bìa đếm ngược tới một mốc giả vài chục giây nữa.
 *
 * Không đụng tới nội dung đã lưu — chỉ đặt cookie, và cookie đó chỉ có tác
 * dụng khi đã đăng nhập (xem `rehearsalRevealAt`). Kèm theo: bật "xem như Mina"
 * và xoá cookie đã trả lời tên, để đi lại đúng từng bước như lần đầu.
 */
export async function startRehearsal(
  seconds: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };
  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds < 5 ||
    seconds > 600
  ) {
    return { ok: false, error: "Số giây không hợp lệ." };
  }

  const jar = await cookies();
  jar.set(REHEARSAL_COOKIE, String(Date.now() + Math.round(seconds) * 1000), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: REHEARSAL_MAX_AGE,
  });
  jar.set(GUEST_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: GUEST_MAX_AGE,
  });
  jar.delete(PASS_COOKIE);
  return { ok: true };
}

export async function endRehearsal(): Promise<void> {
  if (!(await isEditor())) return;
  const jar = await cookies();
  jar.delete(REHEARSAL_COOKIE);
  jar.delete(GUEST_COOKIE);
}

/** Thư Mina gửi và nhật ký. */
export async function listInbox(): Promise<{
  ok: boolean;
  entries?: InboxEntry[];
  error?: string;
}> {
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };
  try {
    return { ok: true, entries: await listEntries() };
  } catch (error) {
    console.error("[inbox] không đọc được hộp thư:", error);
    return { ok: false, error: "Không đọc được hộp thư." };
  }
}

export async function deleteInboxEntry(
  pathname: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };
  if (typeof pathname !== "string") {
    return { ok: false, error: "Đường dẫn không hợp lệ." };
  }
  try {
    await deleteEntry(pathname);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không xoá được.",
    };
  }
}

/** Tìm ảnh và nhạc không còn bản lưu nào dùng tới. Chỉ tìm, chưa xoá. */
export async function scanUnusedUploads(): Promise<{
  ok: boolean;
  files?: UnusedUpload[];
  error?: string;
}> {
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };
  if (storageMode() !== "blob") {
    return {
      ok: false,
      error:
        "Chạy ở máy thì tệp nằm trong public/uploads — xoá tay thư mục đó là được.",
    };
  }
  try {
    return { ok: true, files: await findUnusedUploads() };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Không quét được kho tệp.",
    };
  }
}

/** Xoá những tệp đã xem trong danh sách mà đến giờ vẫn còn thừa. */
export async function removeUnusedUploads(pathnames: string[]): Promise<{
  ok: boolean;
  deleted?: number;
  error?: string;
}> {
  if (!(await isEditor())) return { ok: false, error: HET_PHIEN };
  if (
    !Array.isArray(pathnames) ||
    !pathnames.every(
      (p) => typeof p === "string" && p.startsWith(UPLOAD_PREFIX),
    )
  ) {
    return { ok: false, error: "Danh sách tệp không hợp lệ." };
  }
  try {
    return { ok: true, deleted: await deleteUnusedUploads(pathnames) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Không xoá được tệp.",
    };
  }
}
