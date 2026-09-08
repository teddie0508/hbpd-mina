"use client";

import { useId, useRef, useState } from "react";

import {
  ASPECT_CSS,
  SLOT_ASPECT,
  SLOT_MAX_EDGE,
  type ImageAsset,
  type ImageSlot,
} from "@/lib/content/schema";
import { cx } from "@/lib/cx";
import { isPlaceholder } from "@/lib/placeholder";

import { CropDialog } from "./CropDialog";
import { useUploadFile } from "./upload";

/**
 * Một ô ảnh: chọn tệp -> cắt đúng tỉ lệ -> tải lên -> trả về ImageAsset.
 * Tỉ lệ lấy từ SLOT_ASPECT nên không bao giờ lệch với chỗ sẽ hiển thị.
 */
export function ImageField({
  slot,
  value,
  onChange,
  onRemove,
  label,
  noteHint,
}: {
  slot: ImageSlot;
  value: ImageAsset | null;
  onChange: (image: ImageAsset) => void;
  onRemove?: () => void;
  label?: string;
  /** Có giá trị thì hiện thêm ô ghi chú mặt sau, dùng làm gợi ý trong ô. */
  noteHint?: string;
}) {
  const aspect = SLOT_ASPECT[slot];
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Bề ngang thật của ảnh đang dùng, đọc được sau khi trình duyệt tải xong. */
  const [naturalWidth, setNaturalWidth] = useState(0);
  const altId = useId();
  const uploadFile = useUploadFile();

  async function handleCropped(blob: Blob) {
    setPending(null);
    setBusy(true);
    setError(null);
    try {
      const url = await uploadFile(blob, "images");
      onChange({
        id: value?.id ?? crypto.randomUUID(),
        url,
        alt: value && !isPlaceholder(value) ? value.alt : (label ?? "Ảnh"),
        aspect,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải lên được");
    } finally {
      setBusy(false);
    }
  }

  const placeholder = isPlaceholder(value);
  const recommended = SLOT_MAX_EDGE[slot];
  // Dưới ba phần tư mức khuyến nghị thì mắt đã bắt đầu thấy mờ trên màn Retina.
  const tooSmall = naturalWidth > 0 && naturalWidth < recommended * 0.75;

  return (
    <div className="space-y-2">
      <div
        className={cx(
          "border-mist/20 bg-base/40 relative overflow-hidden rounded-lg border",
          placeholder && "border-dashed",
        )}
        style={{ aspectRatio: ASPECT_CSS[aspect] }}
      >
        {value ? (
          // Ảnh xem trước trong trình sửa: dùng <img> thường cho nhẹ, vì ảnh
          // vừa tải lên chưa kịp qua bộ tối ưu của Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.url}
            alt={value.alt}
            className="size-full object-cover"
            onLoad={(e) => setNaturalWidth(e.currentTarget.naturalWidth)}
          />
        ) : (
          <div className="text-mist/40 grid size-full place-items-center text-xs">
            Chưa có ảnh
          </div>
        )}

        {busy ? (
          <div className="text-cream absolute inset-0 grid place-items-center bg-black/60 text-xs">
            Đang tải lên...
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
        >
          {value && !placeholder ? "Đổi ảnh" : "Chọn ảnh"}
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="border-mist/25 text-mist/70 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:border-red-400/50 hover:text-red-300"
          >
            Xoá
          </button>
        ) : null}
      </div>

      {value ? (
        <div>
          <label htmlFor={altId} className="sr-only">
            Mô tả ảnh
          </label>
          <input
            id={altId}
            type="text"
            value={value.alt}
            placeholder="Mô tả ảnh (cho trình đọc màn hình)"
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            className="border-mist/15 bg-base/40 text-cream/80 placeholder:text-mist/35 focus:border-gold/40 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
          />
        </div>
      ) : null}

      {value && noteHint ? (
        <input
          type="text"
          value={value.note ?? ""}
          placeholder={noteHint}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          className="border-gold/20 bg-base/40 text-gold/85 placeholder:text-mist/35 focus:border-gold/50 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
        />
      ) : null}

      {placeholder ? (
        <p className="text-[11px] text-amber-300/70">Đang là ảnh giữ chỗ</p>
      ) : null}

      {/* Khâu cắt không bao giờ phóng to ảnh, nên ảnh gốc nhỏ là chịu mờ.
          Báo ngay ở đây, chứ để phát hiện lúc xem trang chính thì đã muộn. */}
      {!placeholder && tooSmall ? (
        <p className="text-[11px] leading-relaxed text-amber-300/80">
          Ảnh này chỉ rộng {naturalWidth}px, nên có thể hơi mờ trên màn hình sắc
          nét. Chỗ này nên dùng ảnh gốc rộng từ {recommended}px trở lên.
        </p>
      ) : null}
      {error ? <p className="text-[11px] text-red-300">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Xoá value để chọn lại đúng tệp vừa rồi vẫn kích hoạt onChange.
          e.target.value = "";
          if (file) setPending(file);
        }}
      />

      {pending ? (
        <CropDialog
          file={pending}
          aspect={aspect}
          maxLongEdge={SLOT_MAX_EDGE[slot]}
          onCancel={() => setPending(null)}
          onDone={handleCropped}
        />
      ) : null}
    </div>
  );
}
