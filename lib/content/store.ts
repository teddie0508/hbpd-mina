import "server-only";

import { list, put } from "@vercel/blob";
import { revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { cloneDefaults } from "./defaults";
import { CONTENT_VERSION, type SiteContent } from "./schema";

/** Nhãn để xoá cache nội dung mỗi khi bạn bấm Lưu ở /customize. */
const CONTENT_TAG = "site-content";

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
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 10 });
    const found = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!found) return null;
    const res = await fetch(found.url, { cache: "no-store" });
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
const readCached = unstable_cache(
  async (): Promise<SiteContent> => mergeIntoDefaults(await readRaw()),
  ["site-content"],
  { tags: [CONTENT_TAG] },
);

/**
 * Nội dung hiện tại. `cache()` gộp thêm mọi lần gọi trong cùng một request
 * thành một lần duy nhất.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    return await readCached();
  } catch (err) {
    console.error("[content] không đọc được bản lưu, dùng mặc định:", err);
    return cloneDefaults();
  }
});

export async function saveContent(next: SiteContent): Promise<SiteContent> {
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

  // Xoá nhãn để các trang tĩnh dựng lại với nội dung mới ngay lần xem kế tiếp.
  // Next 16 bắt buộc có tham số thời hạn; expire 0 nghĩa là hết hiệu lực ngay,
  // để vừa bấm Lưu xong mở trang là thấy nội dung mới.
  revalidateTag(CONTENT_TAG, { expire: 0 });

  return payload;
}
