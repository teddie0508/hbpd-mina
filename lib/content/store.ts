import "server-only";

import { del, get, list, put } from "@vercel/blob";
import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { isEditor } from "../auth";
import { BLOB_PREFIX, UPLOAD_PREFIX } from "../blob-paths";
import { cloneDefaults } from "./defaults";
import { CONTENT_VERSION, type SiteContent } from "./schema";
import { collectUploadPaths } from "./uploads";

const CONTENT_PREFIX = `${BLOB_PREFIX}content/`;

/**
 * Bản lưu của thời kỳ ghi đè lên một đường dẫn cố định.
 *
 * Nó là PUBLIC, nằm ở một đường dẫn ai cũng đoán được: chỉ cần biết tên miền
 * của kho — lộ ra qua bất kỳ URL ảnh hay nhạc nào — là đọc được toàn bộ nội
 * dung. Lần lưu đầu tiên ở chế độ private sẽ chép nó sang LEGACY_PRIVATE_PATH,
 * đọc lại cho khớp nguyên văn, rồi mới xoá bản public (xem `secureLegacy`).
 */
const LEGACY_PUBLIC_PATH = `${CONTENT_PREFIX}site.json`;

/** Bản sao private của bản cũ nhất. Phao cứu sinh, không bao giờ bị dọn. */
const LEGACY_PRIVATE_PATH = `${CONTENT_PREFIX}site-legacy.json`;

/** `site-<13 chữ số mốc thời gian>-<6 ký tự ngẫu nhiên>.json` */
const VERSION_RE = /^site-\d{13}-[0-9a-f]{6}\.json$/;

/**
 * Giữ lại bao nhiêu bản lưu gần nhất.
 *
 * Từng để 3, và đó là quá ít: lỡ tay lưu đè một bản hỏng thì chỉ cần lưu thêm
 * ba lần nữa là bản tốt cuối cùng bị dọn mất. Mỗi bản chỉ vài chục KB.
 */
const KEEP_VERSIONS = 20;

/**
 * Nhớ tạm nội dung bao lâu cho NGƯỜI XEM.
 *
 * Không nhớ thì mỗi lượt xem trang — cộng thêm mỗi lần <Link> nạp trước một
 * trang — là một lượt `list()` của Blob, loại thao tác bị tính hạn mức. Cái
 * giá: bạn sửa xong, Mina có thể thấy thay đổi trễ tối đa 30 giây.
 *
 * NGƯỜI SỬA thì luôn đọc thẳng từ kho, không bao giờ qua lớp nhớ tạm này. Cả
 * chuỗi lỗi "lưu rồi mà không thấy đổi" trước đây đều từ chỗ người sửa bị cho
 * đọc bản cũ; giữ nguyên điều đó là giữ được bài học.
 */
const VIEWER_MEMO_MS = 30_000;

/** Tệp tải lên trong khoảng này thì không dọn — có thể đang nằm trong bản nháp chưa lưu. */
const UPLOAD_GRACE_MS = 24 * 60 * 60 * 1000;

const LOCAL_PATH = path.join(process.cwd(), ".data", "content.json");

interface BlobRef {
  pathname: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

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

/** Bản cũ nhất còn giữ, ưu tiên bản đã chuyển sang private. */
function legacyBlob<T extends { pathname: string }>(blobs: T[]): T | undefined {
  return (
    blobs.find((b) => b.pathname === LEGACY_PRIVATE_PATH) ??
    blobs.find((b) => b.pathname === LEGACY_PUBLIC_PATH)
  );
}

function isLegacyPath(pathname: string): boolean {
  return pathname === LEGACY_PRIVATE_PATH || pathname === LEGACY_PUBLIC_PATH;
}

/**
 * Có token Blob thì dùng Vercel Blob (bản deploy).
 * Không có thì ghi ra .data/content.json ngay trong máy, để `npm run dev`
 * chạy được mà không cần cấu hình gì.
 */
export function usingBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function storageMode(): "blob" | "local" {
  return usingBlob() ? "blob" : "local";
}

/**
 * Liệt kê TOÀN BỘ tệp dưới một tiền tố, đi qua hết các trang kết quả.
 *
 * `list()` trả kết quả theo tên tăng dần mà bản lưu mới nhất lại có tên lớn
 * nhất — nếu vì lý do gì số tệp vượt một trang, chỉ đọc trang đầu là đọc trúng
 * bản CŨ. Đi hết các trang thì không bao giờ dính.
 */
export async function listAll(prefix: string): Promise<BlobRef[]> {
  const out: BlobRef[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: 1000, cursor });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
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

/* ---------------------------------------------------------------------------
   Đọc và ghi từng tệp JSON trong kho
   ------------------------------------------------------------------------ */

/** Đọc một tệp private qua API có token. null nếu không đọc được. */
async function readPrivateJson(pathname: string): Promise<unknown | null> {
  try {
    const res = await get(pathname, { access: "private", useCache: false });
    if (res && res.statusCode === 200) {
      return (await new Response(res.stream).json()) as unknown;
    }
  } catch {
    // Không phải tệp private, hoặc kho không hỗ trợ — bên gọi tự lùi.
  }
  return null;
}

/**
 * Đọc nội dung JSON của một tệp trong kho, bất kể nó private hay public.
 *
 * Bản lưu mới là private, bản lưu cũ là public. Thử đường private trước —
 * đó là đường của bản hiện hành — hỏng thì lùi về đọc thẳng URL công khai.
 */
export async function readBlobJson(blob: {
  pathname: string;
  url: string;
}): Promise<unknown | null> {
  const riengTu = await readPrivateJson(blob.pathname);
  if (riengTu !== null) return riengTu;

  try {
    const res = await fetch(blob.url, { cache: "no-store" });
    if (res.ok) return (await res.json()) as unknown;
  } catch {
    /* bỏ qua */
  }
  return null;
}

/**
 * Ghi một tệp JSON, ưu tiên private.
 *
 * Chưa kiểm được trên kho thật (máy phát triển không có token Blob), nên cố ý
 * làm phòng thủ: kho không nhận private thì vẫn lưu được ở chế độ public, và
 * bên gọi được báo lại để hiện cảnh báo — chứ không bao giờ để nút Lưu hỏng.
 */
export async function putJson(
  pathname: string,
  body: string,
): Promise<"private" | "public"> {
  try {
    await put(pathname, body, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    return "private";
  } catch (err) {
    console.error("[content] không ghi được tệp private, lùi về public:", err);
  }

  await put(pathname, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return "public";
}

/* ---------------------------------------------------------------------------
   Nội dung hiện hành
   ------------------------------------------------------------------------ */

async function readRaw(): Promise<unknown | null> {
  if (usingBlob()) {
    const blobs = await listAll(CONTENT_PREFIX);
    const legacy = legacyBlob(blobs);
    const candidates = [...sortedVersions(blobs), ...(legacy ? [legacy] : [])];

    // Bản mới nhất không đọc được thì lùi dần về bản trước, chứ không rơi
    // thẳng về nội dung mặc định — rơi về mặc định là Mina thấy một trang
    // trống trơn toàn ảnh giữ chỗ.
    for (const blob of candidates) {
      const data = await readBlobJson(blob);
      if (data !== null) return data;
      console.error(`[content] không đọc được ${blob.pathname}, thử bản trước`);
    }
    return null;
  }

  try {
    return JSON.parse(await fs.readFile(LOCAL_PATH, "utf8")) as unknown;
  } catch {
    return null;
  }
}

let viewerMemo: { at: number; raw: unknown } | null = null;

function stampOf(raw: unknown): string {
  const v = (raw as { updatedAt?: unknown } | null)?.updatedAt;
  return typeof v === "string" ? v : "";
}

async function readFresh(): Promise<unknown | null> {
  const raw = await readRaw();
  // Không nhớ kết quả rỗng: một lần đọc lỗi thoáng qua không được phép biến
  // thành 30 giây Mina nhìn thấy nội dung mặc định.
  //
  // Cũng không để bản cũ hơn đè lên bản đang nhớ: `list()` có lúc chưa thấy
  // tệp vừa ghi, mà saveContent đã nhớ sẵn đúng bản vừa ghi rồi.
  if (raw !== null && stampOf(raw) >= stampOf(viewerMemo?.raw)) {
    viewerMemo = { at: Date.now(), raw };
  }
  return raw;
}

async function readForViewer(): Promise<unknown | null> {
  // Chỉ nhớ tạm khi dùng Blob — thứ bị tính hạn mức. Đọc file ở máy thì rẻ,
  // mà nhớ tạm lại khiến sửa tay .data/content.json phải chờ 30 giây mới thấy.
  if (
    usingBlob() &&
    viewerMemo &&
    Date.now() - viewerMemo.at < VIEWER_MEMO_MS
  ) {
    return viewerMemo.raw;
  }
  return readFresh();
}

/**
 * Nội dung hiện tại.
 *
 * Người sửa luôn đọc thẳng từ kho; người xem đọc qua lớp nhớ tạm 30 giây (xem
 * VIEWER_MEMO_MS). `cache()` của React gộp mọi lần gọi trong cùng một request
 * thành một lượt đọc duy nhất.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  // Hỏi quyền NGOÀI khối try/catch: isEditor() đọc cookies(), mà cookies() là
  // API động của Next — bọc trong try/catch là nuốt mất tín hiệu Next dùng để
  // biết trang phải render động.
  const editor = await isEditor();

  try {
    return mergeIntoDefaults(
      editor ? await readFresh() : await readForViewer(),
    );
  } catch (err) {
    console.error("[content] không đọc được bản lưu, dùng mặc định:", err);
    return cloneDefaults();
  }
});

/* ---------------------------------------------------------------------------
   Lịch sử bản lưu
   ------------------------------------------------------------------------ */

export interface ContentVersion {
  /** Đường dẫn trong kho Blob, dùng làm định danh khi đọc lại. */
  pathname: string;
  /** Mốc lưu. */
  savedAt: string;
  sizeKb: number;
  /** Bản đang được trang chính dùng. */
  current: boolean;
  /** Bản của thời kỳ ghi đè một đường dẫn cố định — cũ nhất, không bao giờ bị dọn. */
  legacy: boolean;
}

/** Các bản đã lưu, mới nhất đứng đầu; bản cũ nhất luôn nằm cuối. */
export async function listVersions(): Promise<ContentVersion[]> {
  if (!usingBlob()) return [];

  const blobs = await listAll(CONTENT_PREFIX);
  const out: ContentVersion[] = sortedVersions(blobs).map((b, i) => ({
    pathname: b.pathname,
    // Tên file dạng site-<13 chữ số>-<6 ký tự>.json
    savedAt: new Date(
      Number(versionName(b.pathname).slice(5, 18)),
    ).toISOString(),
    sizeKb: Math.round(b.size / 1024),
    current: i === 0,
    legacy: false,
  }));

  const legacy = legacyBlob(blobs);
  if (legacy) {
    // Bản sao private mang giờ tải lên là lúc chép sang, không phải lúc bạn
    // lưu thật — lấy giờ ghi trong chính nội dung cho khỏi hiện nhầm "hôm nay".
    const data = (await readBlobJson(legacy)) as { updatedAt?: unknown } | null;
    const ghiTrongNoiDung =
      typeof data?.updatedAt === "string" &&
      !Number.isNaN(Date.parse(data.updatedAt))
        ? data.updatedAt
        : null;

    out.push({
      pathname: legacy.pathname,
      savedAt: ghiTrongNoiDung ?? new Date(legacy.uploadedAt).toISOString(),
      sizeKb: Math.round(legacy.size / 1024),
      current: out.length === 0,
      legacy: true,
    });
  }

  return out;
}

/** Đọc lại một bản cũ. Chỉ đọc, KHÔNG ghi đè gì. */
export async function readVersion(pathname: string): Promise<SiteContent> {
  // Chặn đường dẫn lạ: hàm này nhận tham số từ trình duyệt gửi lên.
  const hopLe =
    pathname.startsWith(CONTENT_PREFIX) &&
    (VERSION_RE.test(versionName(pathname)) || isLegacyPath(pathname));
  if (!hopLe) throw new Error("Đường dẫn bản lưu không hợp lệ.");

  const blobs = await listAll(CONTENT_PREFIX);
  const found = blobs.find((b) => b.pathname === pathname);
  if (!found) throw new Error("Không tìm thấy bản lưu này nữa.");

  const data = await readBlobJson(found);
  if (data === null) throw new Error("Không đọc được bản lưu.");
  return mergeIntoDefaults(data);
}

/* ---------------------------------------------------------------------------
   Ghi
   ------------------------------------------------------------------------ */

/**
 * Dọn các bản lưu cũ, giữ lại vài bản gần nhất.
 *
 * Không bao giờ được để hỏng cả lượt lưu: nội dung đã ghi xong rồi, dọn dẹp
 * thất bại thì cùng lắm là thừa vài file vài chục KB. Hai bản cũ nhất không
 * khớp VERSION_RE nên không bao giờ lọt vào đây.
 */
async function pruneOldVersions(): Promise<void> {
  try {
    const stale = sortedVersions(await listAll(CONTENT_PREFIX)).slice(
      KEEP_VERSIONS,
    );
    if (stale.length === 0) return;
    await del(stale.map((b) => b.pathname));
  } catch (err) {
    console.error("[content] không dọn được bản lưu cũ:", err);
  }
}

/**
 * Chuyển bản cũ nhất từ public sang private.
 *
 * Làm theo đúng thứ tự an toàn: chép sang bản private → đọc lại bản private
 * → khớp nguyên văn với bản gốc → lúc đó mới xoá bản public. Hỏng ở bất kỳ
 * bước nào thì dừng, để nguyên bản public: lộ còn hơn mất.
 *
 * Cố ý KHÔNG đi qua putJson — putJson lùi về public khi private hỏng, mà ở
 * đây lùi về public là tạo thêm một bản sao public thứ hai.
 */
async function secureLegacy(): Promise<void> {
  try {
    const blobs = await listAll(CONTENT_PREFIX);
    const cu = blobs.find((b) => b.pathname === LEGACY_PUBLIC_PATH);
    if (!cu) return;

    const data = await readBlobJson(cu);
    if (data === null) return;
    const goc = JSON.stringify(data, null, 2);

    await put(LEGACY_PRIVATE_PATH, goc, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const kiemLai = await readPrivateJson(LEGACY_PRIVATE_PATH);
    if (kiemLai === null || JSON.stringify(kiemLai, null, 2) !== goc) return;

    await del(cu.pathname);
    console.info(
      "[content] đã chuyển bản cũ nhất sang private, xoá bản public",
    );
  } catch (err) {
    console.error("[content] chưa chuyển được bản cũ nhất sang private:", err);
  }
}

export interface SaveOutcome {
  content: SiteContent;
  /** Tệp vừa ghi ở chế độ nào. "public" nghĩa là kho chưa nhận private. */
  privacy: "private" | "public" | "local";
}

export async function saveContent(next: SiteContent): Promise<SaveOutcome> {
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

  // Bỏ bản nhớ tạm TRƯỚC khi ghi: ghi xong mà lỗi ở bước sau thì ít nhất lần
  // đọc kế tiếp cũng đi thẳng vào kho.
  viewerMemo = null;

  if (usingBlob()) {
    // Mỗi lần lưu là một đường dẫn mới, KHÔNG ghi đè lên đường dẫn cũ.
    //
    // `cacheControlMaxAge` của Blob không nhận giá trị dưới 60 giây, và CDN
    // của Blob không tính query string vào khoá cache, nên ghi đè một đường
    // dẫn cố định là đọc lại ra bản cũ trong vòng một phút. Đường dẫn mới thì
    // không có gì để mà cũ.
    const stamp = String(Date.now()).padStart(13, "0");
    const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
    const privacy = await putJson(
      `${CONTENT_PREFIX}site-${stamp}-${rand}.json`,
      body,
    );

    viewerMemo = { at: Date.now(), raw: payload };
    await pruneOldVersions();
    // Kho đã nhận private thì tiện tay đóng nốt lỗ hổng của bản cũ nhất.
    if (privacy === "private") await secureLegacy();

    return { content: payload, privacy };
  }

  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, body, "utf8");
  viewerMemo = { at: Date.now(), raw: payload };
  return { content: payload, privacy: "local" };
}

/* ---------------------------------------------------------------------------
   Dọn tệp tải lên không còn dùng
   ------------------------------------------------------------------------ */

export interface UnusedUpload {
  pathname: string;
  size: number;
}

/**
 * Tìm ảnh và nhạc không còn bản lưu nào trỏ tới.
 *
 * "Còn dùng" tính trên MỌI bản đang giữ trong lịch sử, không chỉ bản hiện
 * hành: xoá theo bản hiện hành thì lát nữa khôi phục một bản cũ là ảnh vỡ hết.
 * Và nếu có bất kỳ bản lưu nào không đọc được thì dừng hẳn — không biết nó
 * trỏ tới tệp nào thì không được phép đoán là thừa.
 */
export async function findUnusedUploads(): Promise<UnusedUpload[]> {
  if (!usingBlob()) return [];

  const contentBlobs = await listAll(CONTENT_PREFIX);
  const legacy = legacyBlob(contentBlobs);
  const nguon = [...sortedVersions(contentBlobs), ...(legacy ? [legacy] : [])];

  const dangDung = new Set<string>();
  for (const blob of nguon) {
    const data = await readBlobJson(blob);
    if (data === null) {
      throw new Error(
        `Không đọc được bản lưu ${versionName(blob.pathname)}, nên dừng dọn cho an toàn.`,
      );
    }
    collectUploadPaths(data, UPLOAD_PREFIX, dangDung);
  }

  const now = Date.now();
  return (await listAll(UPLOAD_PREFIX))
    .filter((b) => !dangDung.has(b.pathname))
    .filter((b) => now - new Date(b.uploadedAt).getTime() >= UPLOAD_GRACE_MS)
    .map((b) => ({ pathname: b.pathname, size: b.size }));
}

/**
 * Xoá những tệp bạn đã xem trong danh sách VÀ đến giờ vẫn còn thừa.
 *
 * Tính lại từ đầu ngay lúc xoá chứ không tin danh sách gửi lên: giữa lúc xem
 * và lúc bấm xoá, bạn có thể đã lưu một bản dùng lại đúng tệp đó.
 */
export async function deleteUnusedUploads(
  pathnames: string[],
): Promise<number> {
  const choPhep = new Set(pathnames);
  const xoa = (await findUnusedUploads())
    .filter((u) => choPhep.has(u.pathname))
    .map((u) => u.pathname);

  for (let i = 0; i < xoa.length; i += 100) {
    await del(xoa.slice(i, i + 100));
  }
  return xoa.length;
}
