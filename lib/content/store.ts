import "server-only";

import { list, put } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { cloneDefaults } from "./defaults";
import { CONTENT_VERSION, type SiteContent } from "./schema";

/** Nhãn để xoá cache nội dung mỗi khi bấm Lưu ở /customize. */
export const CONTENT_TAG = "site-content";

/**
 * Tiền tố riêng của dự án trong Blob store.
 * Một store dùng chung được cho nhiều dự án, nên phải tách namespace —
 * không thì dự án khác ghi trùng đường dẫn là đè mất nội dung của nhau.
 */
export const BLOB_PREFIX = "mina/";

const BLOB_PATH = `${BLOB_PREFIX}content/site.json`;
const LOCAL_PATH = path.join(process.cwd(), ".data", "content.json");

/**
 * Có token Blob thì dùng Vercel Blob (bản deploy).
 * Không có thì ghi ra .data/content.json ngay trong máy, để `npm run dev`
 * chạy được mà không cần cấu hình gì.
 */
function usingBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function storageMode(): "blob" | "local" {
  return usingBlob() ? "blob" : "local";
}

/**
 * Trộn bản đã lưu lên trên giá trị mặc định, để thêm field mới vào schema
 * không làm hỏng nội dung bạn đã soạn từ trước.
 */
function mergeIntoDefaults(saved: unknown): SiteContent {
  const base = cloneDefaults();
  if (!saved || typeof saved !== "object") return base;

  const merge = (target: unknown, source: unknown): unknown => {
    if (Array.isArray(source)) return source;
    if (source === null) return null;
    if (typeof source !== "object") return source;
    if (
      typeof target !== "object" ||
      target === null ||
      Array.isArray(target)
    ) {
      return source;
    }
    const out: Record<string, unknown> = {
      ...(target as Record<string, unknown>),
    };
    for (const [key, value] of Object.entries(
      source as Record<string, unknown>,
    )) {
      if (!(key in out)) continue; // bỏ qua field lạ / đã bị gỡ khỏi schema
      out[key] = merge(out[key], value);
    }
    return out;
  };

  const merged = merge(base, saved) as SiteContent;
  merged.version = CONTENT_VERSION;
  return merged;
}

async function readRaw(): Promise<unknown | null> {
  if (usingBlob()) {
    // list() gọi thẳng API của Blob nên luôn trả về thông tin mới nhất.
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 10 });
    const found = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!found) return null;

    // Vì ghi đè cùng một đường dẫn nên URL không bao giờ đổi, mà Blob phục vụ
    // file qua CDN. `cache: "no-store"` chỉ chặn cache phía Next, không xoá
    // được bản cũ đang nằm ở CDN edge — nên vừa lưu xong đọc lại vẫn ra nội
    // dung cũ. Gắn thêm dấu thời gian tải lên để mỗi lần lưu là một URL khác.
    const stamp = new Date(found.uploadedAt).getTime();
    const res = await fetch(`${found.url}?v=${stamp}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  }

  try {
    return JSON.parse(await fs.readFile(LOCAL_PATH, "utf8")) as unknown;
  } catch {
    return null;
  }
}

/**
 * Đọc và ghi nhớ giữa các request, cho tới khi `saveContent` xoá nhãn.
 * Không có lớp này thì mỗi lần chuyển trang máy chủ lại phải gọi Vercel Blob
 * hai lượt trước khi trả HTML, và các trang buộc phải render động nên
 * `prefetch` không nạp trước được — chuyển cảnh sẽ khựng khi mạng yếu.
 */
/**
 * CHỈ cache phần đọc dữ liệu thô, không cache kết quả đã trộn với defaults.
 *
 * Trộn xong rồi mới cache là một cái bẫy: thêm field mới vào schema thì bản
 * nằm sẵn trong cache vẫn là bản tính theo defaults cũ, nên vừa deploy xong
 * trang sẽ nhận object thiếu field và văng lỗi, mãi tới khi có ai bấm Lưu.
 * Trộn lại mỗi lần đọc thì field mới luôn có mặt ngay, mà vẫn không tốn thêm
 * lượt gọi mạng nào.
 */
const readRawCached = unstable_cache(
  async (): Promise<unknown | null> => readRaw(),
  ["site-content", String(CONTENT_VERSION)],
  { tags: [CONTENT_TAG] },
);

/**
 * Nội dung hiện tại. `cache()` gộp thêm mọi lần gọi trong cùng một request
 * thành một lần duy nhất.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    return mergeIntoDefaults(await readRawCached());
  } catch (err) {
    console.error("[content] không đọc được bản lưu, dùng mặc định:", err);
    return cloneDefaults();
  }
});

/**
 * Đọc thẳng, không qua cache. Chỉ dùng cho /customize: trình sửa là nơi bạn
 * nhìn vào để biết máy chủ đang giữ bản nào, nên nó không được phép nói dối.
 */
export async function getContentFresh(): Promise<SiteContent> {
  try {
    return mergeIntoDefaults(await readRaw());
  } catch (err) {
    console.error("[content] không đọc được bản lưu, dùng mặc định:", err);
    return cloneDefaults();
  }
}

export async function saveContent(next: SiteContent): Promise<SiteContent> {
  // Trên Vercel, filesystem chỉ đọc. Không có token Blob mà cứ ghi file thì
  // sẽ ném lỗi EROFS rất khó hiểu, nên chặn sớm và nói thẳng nguyên nhân.
  //
  // Nhận biết bằng biến VERCEL chứ không phải NODE_ENV: chạy bản production
  // ngay trên máy cũng có NODE_ENV=production, mà ở đó ghi file vẫn bình thường.
  if (!usingBlob() && process.env.VERCEL) {
    throw new Error(
      "Chưa nối Blob Storage (thiếu BLOB_READ_WRITE_TOKEN), nên không lưu được. " +
        "Vào Vercel → Storage → Connect, nhớ tick ô tạo read-write token, rồi Redeploy.",
    );
  }

  const payload: SiteContent = {
    ...next,
    version: CONTENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const body = JSON.stringify(payload, null, 2);

  if (usingBlob()) {
    await put(BLOB_PATH, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } else {
    await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
    await fs.writeFile(LOCAL_PATH, body, "utf8");
  }

  // Việc xoá cache KHÔNG làm ở đây.
  // revalidateTag chỉ đánh dấu hết hạn chứ không đảm bảo lần đọc kế tiếp đã
  // thấy bản mới, nên lưu xong tải lại ngay vẫn ra nội dung cũ. Muốn đọc-thấy-
  // ngay thì phải dùng updateTag, mà hàm đó chỉ chạy được trong Server Action.
  // Xem app/customize/(editor)/actions.ts.
  return payload;
}
