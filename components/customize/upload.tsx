"use client";

import { upload } from "@vercel/blob/client";
import { createContext, useCallback, useContext, type ReactNode } from "react";

import {
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  uploadPath,
  type UploadKind,
} from "@/lib/blob-paths";

export type StorageMode = "blob" | "local";

const StorageContext = createContext<StorageMode>("local");

export function StorageProvider({
  mode,
  children,
}: {
  mode: StorageMode;
  children: ReactNode;
}) {
  return <StorageContext value={mode}>{children}</StorageContext>;
}

/** Trên 6MB thì chia nhỏ tải song song, vừa nhanh hơn vừa tự thử lại phần lỗi. */
const MULTIPART_FROM = 6 * 1024 * 1024;

/**
 * Tải một tệp lên và trả về URL công khai.
 *
 * Khi đã deploy: trình duyệt tải THẲNG lên Blob. Bắt buộc phải vậy — Vercel
 * chặn mọi request có body quá 4,5MB trước khi function kịp chạy, mà một file
 * mp3 bình thường đã vượt ngưỡng đó.
 *
 * Khi chạy ở máy: không có kho Blob nên gửi qua /api/upload để ghi vào
 * public/uploads. Ở máy thì không vướng giới hạn nào của Vercel.
 */
export function useUploadFile() {
  const mode = useContext(StorageContext);

  return useCallback(
    async (file: Blob, kind: UploadKind): Promise<string> => {
      const limit = kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > limit) {
        throw new Error(
          `Tệp nặng ${(file.size / 1024 / 1024).toFixed(1)}MB, vượt mức cho phép ${Math.round(limit / 1024 / 1024)}MB.`,
        );
      }

      const pathname = uploadPath(kind, file.type);

      if (mode === "blob") {
        const result = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/upload-token",
          contentType: file.type,
          multipart: file.size > MULTIPART_FROM,
        });
        return result.url;
      }

      const form = new FormData();
      form.append(
        "file",
        new File([file], pathname.split("/").pop()!, { type: file.type }),
      );

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Không tải lên được");
      }
      const data = (await res.json()) as { url: string };
      return data.url;
    },
    [mode],
  );
}
