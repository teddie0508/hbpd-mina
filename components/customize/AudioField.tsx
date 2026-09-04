"use client";

import { useRef, useState } from "react";

/** Chọn và tải lên một file nhạc. Không cắt xén gì, gửi thẳng lên kho. */
export function AudioField({
  url,
  onChange,
}: {
  url: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Không tải lên được");
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải lên được");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio src={url} controls preload="none" className="h-9 w-full" />
      ) : (
        <p className="text-mist/45 border-mist/15 rounded-lg border border-dashed px-3 py-3 text-center text-xs">
          Chưa có file nhạc
        </p>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold w-full rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
      >
        {busy ? "Đang tải lên..." : url ? "Đổi file nhạc" : "Chọn file nhạc"}
      </button>

      {error ? <p className="text-[11px] text-red-300">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,.mp3,.m4a"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
