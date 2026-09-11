"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";

import { ASPECT_VALUE, type AspectRatio } from "@/lib/content/schema";
import { cropToBlob } from "@/lib/crop";
import { useFocusTrap } from "@/lib/useFocusTrap";

/**
 * Hộp cắt ảnh. Mở ra ngay sau khi chọn tệp, ép đúng tỉ lệ của vị trí sẽ dùng,
 * nên ảnh trên trang chính không bao giờ bị méo hay cắt cụt ngoài ý muốn.
 *
 * Hai nút Huỷ và "Dùng ảnh này" nằm ở thanh TRÊN, không ở đáy. Trên iPhone,
 * thanh công cụ nổi của Safari đè lên đáy màn hình, và bản trước để nút xác
 * nhận ở đó: cắt xong không có chỗ nào để bấm. Mép trên thì luôn nhìn thấy.
 * Đáy chỉ còn thanh phóng to — bị che một chút vẫn còn cách chụm hai ngón.
 *
 * Dựng qua portal ra thẳng <body>: hộp nằm trong ô ảnh, mà chỉ cần một tổ
 * tiên nào đó có transform hay backdrop-filter là `position: fixed` bị giam
 * vào khung của tổ tiên đó thay vì phủ cả màn hình.
 */
export function CropDialog({
  file,
  aspect,
  maxLongEdge,
  onCancel,
  onDone,
}: {
  file: File;
  aspect: AspectRatio;
  /** Cạnh dài nhất của ảnh kết quả, lấy theo vị trí sẽ dùng. */
  maxLongEdge: number;
  onCancel: () => void;
  onDone: (blob: Blob) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<Area | null>(null);
  const khungRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useFocusTrap(khungRef, mounted);

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

  // Khoá cuộn nền: kéo ảnh trên điện thoại mà trang phía sau trôi theo thì
  // thanh địa chỉ của Safari co giãn liên tục, cả hộp nhảy lên nhảy xuống.
  useEffect(() => {
    const truoc = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = truoc;
    };
  }, []);

  const handleComplete = useCallback((_: Area, pixels: Area) => {
    areaRef.current = pixels;
  }, []);

  async function confirm() {
    if (!src || !areaRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await cropToBlob(src, areaRef.current, maxLongEdge));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cắt được ảnh");
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      ref={khungRef}
      role="dialog"
      aria-modal="true"
      aria-label="Cắt ảnh"
      className="customize-root fixed inset-0 z-[90] flex flex-col overscroll-contain bg-black/90"
    >
      <div className="border-mist/15 bg-deep/95 flex items-center gap-2 border-b px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 sm:px-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-mist/80 hover:text-cream focus-visible:ring-gold/50 shrink-0 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2"
        >
          Huỷ
        </button>

        <p className="text-cream min-w-0 flex-1 truncate text-center text-sm">
          Cắt ảnh · <span className="text-gold">{aspect}</span>
        </p>

        <button
          type="button"
          onClick={() => void confirm()}
          disabled={busy || !src}
          className="bg-gold text-deep hover:bg-gold/90 focus-visible:ring-cream/60 shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
        >
          {busy ? "Đang xử lý..." : "Dùng ảnh này"}
        </button>
      </div>

      {error ? (
        <p className="bg-red-500/15 px-4 py-2 text-center text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {/* min-h-0: thiếu nó thì con của flex không chịu co lại nhỏ hơn nội
          dung, ảnh dọc cao sẽ đẩy thanh phóng to ra khỏi màn hình. */}
      <div className="relative min-h-0 flex-1">
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

      <div className="border-mist/15 bg-deep/95 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <label className="flex items-center gap-3">
          <span className="text-mist/70 w-16 shrink-0 text-xs">Phóng to</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="accent-gold h-6 flex-1 cursor-pointer"
          />
        </label>
        <p className="text-mist/45 mt-1.5 text-center text-[11px]">
          Kéo để dời ảnh, chụm hai ngón để phóng to.
        </p>
      </div>
    </div>,
    document.body,
  );
}
