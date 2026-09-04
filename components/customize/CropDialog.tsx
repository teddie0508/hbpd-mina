"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { ASPECT_VALUE, type AspectRatio } from "@/lib/content/schema";
import { cropToBlob } from "@/lib/crop";

/**
 * Hộp cắt ảnh. Mở ra ngay sau khi chọn tệp, ép đúng tỉ lệ của vị trí sẽ dùng,
 * nên ảnh trên trang chính không bao giờ bị méo hay cắt cụt ngoài ý muốn.
 */
export function CropDialog({
  file,
  aspect,
  onCancel,
  onDone,
}: {
  file: File;
  aspect: AspectRatio;
  onCancel: () => void;
  onDone: (blob: Blob) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<Area | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    // Thu hồi URL tạm, nếu không ảnh sẽ nằm lại trong bộ nhớ suốt phiên làm việc.
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleComplete = useCallback((_: Area, pixels: Area) => {
    areaRef.current = pixels;
  }, []);

  async function confirm() {
    if (!src || !areaRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await cropToBlob(src, areaRef.current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cắt được ảnh");
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cắt ảnh"
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
    >
      <div className="border-mist/15 flex items-center justify-between border-b px-4 py-3">
        <p className="text-cream text-sm">
          Cắt ảnh — tỉ lệ <span className="text-gold">{aspect}</span>
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-mist/70 hover:text-cream text-sm transition-colors"
        >
          Huỷ
        </button>
      </div>

      <div className="relative flex-1">
        {src ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT_VALUE[aspect]}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleComplete}
            showGrid
            restrictPosition
          />
        ) : null}
      </div>

      <div className="border-mist/15 space-y-3 border-t px-4 py-4">
        <label className="flex items-center gap-3">
          <span className="text-mist/70 w-16 shrink-0 text-xs">Phóng to</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="accent-gold h-1 flex-1 cursor-pointer"
          />
        </label>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="bg-gold text-deep hover:bg-gold/90 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {busy ? "Đang xử lý..." : "Dùng ảnh này"}
        </button>
      </div>
    </div>
  );
}
