import "server-only";

import { del } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";

import { BLOB_PREFIX } from "./blob-paths";
import { MAX_REPLY_CHARS } from "./content/schema";
import { listAll, putJson, readBlobJson, usingBlob } from "./content/store";

/**
 * Hộp thư: thư Mina gửi lại từ trang Hoa, cộng một nhật ký nhỏ (lúc mở phong
 * bì, lúc tới màn kết).
 *
 * Mỗi mục là MỘT tệp riêng, không gom vào một tệp chung. Gom chung thì mỗi lần
 * ghi phải đọc – sửa – ghi lại, hai lần ghi sát nhau là lần sau đè mất lần
 * trước; đúng loại lỗi mất dữ liệu không để lại dấu vết. Tệp riêng thì không
 * có gì để mà đè.
 *
 * Nằm ngoài nội dung trang (content/) nên lưu hay khôi phục bản nội dung cũ
 * không bao giờ đụng tới thư, và nút dọn tệp chỉ quét uploads/ nên cũng không.
 */
export const INBOX_PREFIX = `${BLOB_PREFIX}inbox/`;

export type InboxKind = "reply" | "opened" | "finale";

export interface InboxEntry {
  /** Định danh để xoá. */
  pathname: string;
  kind: InboxKind;
  at: string;
  /** Chỉ thư mới có. */
  text?: string;
  /** Do chính bạn tạo ra lúc xem thử hoặc diễn tập, không phải Mina. */
  preview: boolean;
}

/** `<loại>-<13 chữ số mốc thời gian>-<6 ký tự ngẫu nhiên>.json` — không có `/`, nên không lách ra ngoài thư mục được. */
const NAME_RE = /^(reply|opened|finale)-(\d{13})-[0-9a-f]{6}\.json$/;

/** Chặn trên, để một ai đó biết tên Mina cũng không đổ đầy kho được. */
const MAX_ENTRIES = 500;

const LOCAL_DIR = path.join(process.cwd(), ".data", "inbox");

interface Ref {
  pathname: string;
  url: string;
}

function nameOf(pathname: string): string {
  return pathname.slice(INBOX_PREFIX.length);
}

async function listRefs(): Promise<Ref[]> {
  if (usingBlob()) {
    return (await listAll(INBOX_PREFIX)).filter((b) =>
      NAME_RE.test(nameOf(b.pathname)),
    );
  }
  try {
    const files = await fs.readdir(LOCAL_DIR);
    return files
      .filter((f) => NAME_RE.test(f))
      .map((f) => ({ pathname: `${INBOX_PREFIX}${f}`, url: "" }));
  } catch {
    return [];
  }
}

async function readRef(ref: Ref): Promise<unknown | null> {
  if (usingBlob()) return readBlobJson(ref);
  try {
    const raw = await fs.readFile(path.join(LOCAL_DIR, nameOf(ref.pathname)));
    return JSON.parse(raw.toString("utf8")) as unknown;
  } catch {
    return null;
  }
}

/**
 * Loại và mốc thời gian lấy từ TÊN tệp, không tin phần thân: tên do máy chủ
 * đặt, còn thân tệp thì đọc lên từ kho.
 */
function toEntry(pathname: string, raw: unknown): InboxEntry | null {
  const m = nameOf(pathname).match(NAME_RE);
  if (!m) return null;
  const body = (raw ?? {}) as {
    at?: unknown;
    text?: unknown;
    preview?: unknown;
  };

  return {
    pathname,
    kind: m[1] as InboxKind,
    at:
      typeof body.at === "string" && !Number.isNaN(Date.parse(body.at))
        ? body.at
        : new Date(Number(m[2])).toISOString(),
    text: typeof body.text === "string" ? body.text : undefined,
    preview: body.preview === true,
  };
}

export async function addEntry(
  kind: InboxKind,
  data: { text?: string; preview: boolean },
): Promise<void> {
  if (!usingBlob() && process.env.VERCEL) {
    throw new Error("Chưa nối Blob Storage, không lưu được thư.");
  }
  if ((await listRefs()).length >= MAX_ENTRIES) {
    throw new Error("Hộp thư đã đầy.");
  }

  const stamp = String(Date.now()).padStart(13, "0");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  const name = `${kind}-${stamp}-${rand}.json`;
  const body = JSON.stringify({
    kind,
    at: new Date().toISOString(),
    text: data.text?.slice(0, MAX_REPLY_CHARS),
    preview: data.preview,
  });

  if (usingBlob()) {
    await putJson(`${INBOX_PREFIX}${name}`, body);
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, name), body, "utf8");
}

/** Mọi mục trong hộp thư, mới nhất đứng đầu. */
export async function listEntries(): Promise<InboxEntry[]> {
  const refs = await listRefs();
  const entries = await Promise.all(
    refs.map(async (ref) => toEntry(ref.pathname, await readRef(ref))),
  );
  return entries
    .filter((e): e is InboxEntry => e !== null)
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

export async function deleteEntry(pathname: string): Promise<void> {
  // Nhận tham số từ trình duyệt gửi lên: đúng tiền tố và đúng mẫu tên, không
  // thì từ chối — hàm này mà nhận đường dẫn tuỳ ý là xoá được cả nội dung trang.
  if (!pathname.startsWith(INBOX_PREFIX) || !NAME_RE.test(nameOf(pathname))) {
    throw new Error("Đường dẫn không hợp lệ.");
  }
  if (usingBlob()) {
    await del(pathname);
    return;
  }
  await fs.unlink(path.join(LOCAL_DIR, nameOf(pathname)));
}
