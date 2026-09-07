/**
 * Đường dẫn trong Blob store. KHÔNG đánh dấu server-only: trình duyệt cũng
 * cần các hằng số này để tự tải tệp thẳng lên Blob.
 */

/**
 * Tiền tố riêng của dự án.
 * Blob store dùng chung được cho nhiều dự án nên phải tách namespace, không
 * thì dự án khác ghi trùng đường dẫn là đè mất nội dung của nhau.
 */
export const BLOB_PREFIX = "mina/";

/** Nơi chứa ảnh và nhạc tải lên. Máy chủ chỉ cấp quyền ghi vào đúng đây. */
export const UPLOAD_PREFIX = `${BLOB_PREFIX}uploads/`;

export type UploadKind = "images" | "audio";

/** Đuôi tệp suy ra từ kiểu MIME; máy chủ và trình duyệt phải dùng chung bảng này. */
export const EXTENSION: Record<string, string> = {
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

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
];

/** Ảnh đã cắt sẵn ở trình duyệt nên không bao giờ to. */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
/** Nhạc: một bài mp3 chất lượng tốt tầm 5-12MB, để rộng ra cho thoải mái. */
export const MAX_AUDIO_BYTES = 40 * 1024 * 1024;

export function uploadPath(kind: UploadKind, mimeType: string): string {
  const ext = EXTENSION[mimeType] ?? "bin";
  return `${UPLOAD_PREFIX}${kind}/${crypto.randomUUID()}.${ext}`;
}
