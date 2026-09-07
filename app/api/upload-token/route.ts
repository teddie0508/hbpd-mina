import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { isEditor } from "@/lib/auth";
import {
  AUDIO_TYPES,
  IMAGE_TYPES,
  MAX_AUDIO_BYTES,
  UPLOAD_PREFIX,
} from "@/lib/blob-paths";

export const dynamic = "force-dynamic";

/**
 * Cấp token để trình duyệt tải tệp THẲNG lên Blob, không đi qua function.
 *
 * Vercel chặn mọi request có body quá 4,5MB trước khi function kịp chạy
 * (FUNCTION_PAYLOAD_TOO_LARGE) — một file mp3 bình thường đã vượt ngưỡng đó.
 * Đây là giới hạn cứng của nền tảng, không chỉnh bằng cấu hình được, nên tệp
 * phải đi thẳng từ trình duyệt tới kho. Function chỉ còn việc ký một token
 * ngắn hạn, và request đó chỉ nặng vài trăm byte.
 */
export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isEditor())) {
          throw new Error("Chưa đăng nhập");
        }

        // Token cho phép ghi vào đúng đường dẫn client yêu cầu, nên phải chặn
        // ở đây: thiếu bước này thì một pathname bịa ra có thể ghi đè lên
        // chính file nội dung của trang.
        if (!pathname.startsWith(UPLOAD_PREFIX)) {
          throw new Error("Đường dẫn không được phép");
        }

        return {
          allowedContentTypes: [...IMAGE_TYPES, ...AUDIO_TYPES],
          maximumSizeInBytes: MAX_AUDIO_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      // Vercel gọi ngược về đây khi tải xong. Không cần làm gì: URL đã được
      // trả thẳng cho trình duyệt và lưu vào nội dung khi bạn bấm Lưu.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[upload-token] thất bại:", error);
    const reason =
      error instanceof Error && error.message
        ? error.message
        : "Không cấp được quyền tải lên";
    return NextResponse.json({ error: reason }, { status: 400 });
  }
}
