import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

import { isEditor } from "@/lib/auth";
import { BLOB_PREFIX, storageMode } from "@/lib/content/store";

export const dynamic = "force-dynamic";

/** Ảnh đã được cắt ở trình duyệt trước khi gửi lên, nên 8MB là thừa sức. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Một bài nhạc mp3 chất lượng khá tầm 8-12MB. */
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
]);

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

export async function POST(request: Request) {
  if (!(await isEditor())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu tệp" }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.has(file.type);
  const isAudio = AUDIO_TYPES.has(file.type);
  if (!isImage && !isAudio) {
    return NextResponse.json(
      { error: `Không nhận định dạng ${file.type || "không rõ"}` },
      { status: 415 },
    );
  }

  const limit = isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > limit) {
    return NextResponse.json(
      { error: `Tệp nặng quá ${Math.round(limit / 1024 / 1024)}MB` },
      { status: 413 },
    );
  }

  const kind = isImage ? "images" : "audio";
  const ext = EXTENSION[file.type] ?? "bin";
  // Tên ngẫu nhiên: tải lại cùng một ảnh vẫn ra URL mới, khỏi vướng cache cũ.
  const name = `${crypto.randomUUID()}.${ext}`;

  try {
    if (storageMode() === "blob") {
      const blob = await put(`${BLOB_PREFIX}uploads/${kind}/${name}`, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      });
      return NextResponse.json({ url: blob.url });
    }

    // Chạy ở máy: ghi vào public/uploads để xem thử ngay, không cần token Blob.
    const dir = path.join(process.cwd(), "public", "uploads", kind);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, name),
      Buffer.from(await file.arrayBuffer()),
    );
    return NextResponse.json({ url: `/uploads/${kind}/${name}` });
  } catch (error) {
    console.error("[upload] thất bại:", error);
    return NextResponse.json({ error: "Không tải lên được" }, { status: 500 });
  }
}
