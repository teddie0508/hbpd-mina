import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

import { isEditor } from "@/lib/auth";
import {
  AUDIO_TYPES,
  EXTENSION,
  IMAGE_TYPES,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
} from "@/lib/blob-paths";

export const dynamic = "force-dynamic";

/**
 * Đường tải lên dùng khi chạy ở MÁY, nơi chưa có kho Blob.
 *
 * Bản deploy KHÔNG đi qua đây: Vercel chặn mọi request có body quá 4,5MB
 * trước khi function kịp chạy, mà một file mp3 bình thường đã vượt ngưỡng.
 * Ở đó trình duyệt tải thẳng lên Blob, xem app/api/upload-token/route.ts.
 */

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

  const isImage = IMAGE_TYPES.includes(file.type);
  const isAudio = AUDIO_TYPES.includes(file.type);
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
    // Ghi vào public/uploads để xem thử ngay, không cần token Blob.
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
