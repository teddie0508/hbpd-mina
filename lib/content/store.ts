import "server-only";

import { del, list, put } from "@vercel/blob";
import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { BLOB_PREFIX } from "../blob-paths";
import { cloneDefaults } from "./defaults";
import { CONTENT_VERSION, type SiteContent } from "./schema";

const CONTENT_PREFIX = `${BLOB_PREFIX}content/`;

/**
 * Bản lưu của thời kỳ ghi đè lên một đường dẫn cố định. Chỉ còn dùng để đọc,
 * và chỉ khi chưa có bản đánh số nào — tức đúng một lần, ngay sau khi lên bản
 * này. Không bao giờ ghi vào nữa, cũng không xoá: giữ lại làm phao cứu sinh
 * nếu có lúc phải deploy lùi về bản code cũ.
 */
const LEGACY_BLOB_PATH = `${CONTENT_PREFIX}site.json`;

/** `site-<13 chữ số mốc thời gian>-<6 ký tự ngẫu nhiên>.json` */
const VERSION_RE = /^site-\d{13}-[0-9a-f]{6}\.json$/;

/** Giữ lại vài bản gần nhất phòng khi cần xem lại, còn đâu dọn sạch. */
const KEEP_VERSIONS = 3;

const LOCAL_PATH = path.join(process.cwd(), ".data", "content.json");

/** Tên file của bản lưu, tính trong thư mục nội dung. */
function versionName(pathname: string): string {
  return pathname.slice(CONTENT_PREFIX.length);
}

/**
 * Các bản đã lưu, mới nhất đứng đầu.
 *
 * Sắp theo chính tên file chứ không theo `uploadedAt`: mốc thời gian nằm
 * ngay trong tên, cố định 13 chữ số nên so chuỗi là ra đúng thứ tự, và không
 * phụ thuộc vào metadata mà `list()` có lúc trả về còn trễ một nhịp.
 */
function sortedVersions<T extends { pathname: string }>(blobs: T[]): T[] {
  return blobs
    .filter((b) => VERSION_RE.test(versionName(b.pathname)))
    .sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
}

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
    const { blobs } = await list({ prefix: CONTENT_PREFIX, limit: 100 });

    const newest =
      sortedVersions(blobs)[0] ??
      blobs.find((b) => b.pathname === LEGACY_BLOB_PATH);
    if (!newest) return null;

    // URL của bản đánh số chưa từng tồn tại trước lần lưu này, nên không có
    // bản cũ nào nằm sẵn ở CDN để trả về. `cache: "no-store"` chỉ để chặn
    // thêm lớp cache của Next.
    const res = await fetch(newest.url, { cache: "no-store" });
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
 * Nội dung hiện tại.
 *
 * Cố tình KHÔNG có lớp cache nào giữa các request. Từng bọc phần đọc trong
 * `unstable_cache` gắn nhãn để đỡ một lượt gọi Blob, nhưng lớp đó đẻ ra một
 * chuỗi lỗi khó chịu: lưu xong trang vẫn hiện nội dung cũ, thêm field mới vào
 * schema là trang văng lỗi ngay sau khi deploy, và gần nhất là icon đổi rồi mà
 * trang vẫn vẽ bản cũ hơn một lần lưu.
 *
 * Trang này chỉ có một người xem, khoản tiết kiệm vài chục mili giây không
 * đáng đánh đổi lấy chuyện nội dung hiển thị sai. `cache()` của React vẫn gộp
 * mọi lần gọi trong cùng một request thành một lượt đọc duy nhất.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    return mergeIntoDefaults(await readRaw());
  } catch (err) {
    console.error("[content] không đọc được bản lưu, dùng mặc định:", err);
    return cloneDefaults();
  }
});

/**
 * Dọn các bản lưu cũ, giữ lại vài bản gần nhất.
 *
 * Không bao giờ được để hỏng cả lượt lưu: nội dung đã ghi xong rồi, dọn dẹp
 * thất bại thì cùng lắm là thừa vài file vài chục KB.
 */
async function pruneOldVersions(): Promise<void> {
  try {
    const { blobs } = await list({ prefix: CONTENT_PREFIX, limit: 100 });
    const stale = sortedVersions(blobs).slice(KEEP_VERSIONS);
    if (stale.length === 0) return;
    await del(stale.map((b) => b.url));
  } catch (err) {
    console.error("[content] không dọn được bản lưu cũ:", err);
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
    // Mỗi lần lưu là một đường dẫn mới, KHÔNG ghi đè lên đường dẫn cũ.
    //
    // Trước đây luôn ghi đè `content/site.json` rồi trông vào
    // `cacheControlMaxAge: 0` để CDN đừng giữ bản cũ. Đọc kỹ tài liệu mới
    // thấy: "Cannot be set to a value lower than 1 minute" — số 0 bị nâng
    // thầm lên 60 giây. Thế là lưu lần đầu thì thấy đổi (bản cũ đã hết hạn từ
    // lâu), sửa tiếp rồi lưu ngay trong vòng một phút thì đọc lại vẫn ra bản
    // cũ, dù Blob đã ghi nhận đúng giờ lưu mới. Thêm `?v=<thời điểm>` vào URL
    // cũng không cứu được, vì CDN của Blob không tính query string vào khoá
    // cache.
    //
    // Đường dẫn mới thì không còn gì để mà cũ: URL chưa từng được yêu cầu,
    // và file cũng chưa từng bị ghi đè nên không dính chuyện kho lưu trữ đồng
    // bộ trễ. Nhờ vậy bỏ luôn được cacheControlMaxAge — cứ để mặc định,
    // nội dung ở một URL giờ là bất biến nên cache lâu lại càng tốt.
    const stamp = String(Date.now()).padStart(13, "0");
    const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6);

    await put(`${CONTENT_PREFIX}site-${stamp}-${rand}.json`, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    await pruneOldVersions();
  } else {
    await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
    await fs.writeFile(LOCAL_PATH, body, "utf8");
  }

  return payload;
}
