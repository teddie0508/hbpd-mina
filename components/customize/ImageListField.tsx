"use client";

import {
  SLOT_ASPECT,
  type ImageAsset,
  type ImageSlot,
} from "@/lib/content/schema";
import { placeholderImage } from "@/lib/placeholder";

import { ImageField } from "./ImageField";

/**
 * Danh sách ảnh có thêm / bớt / đổi thứ tự.
 * Thêm ảnh sẽ chèn một ô giữ chỗ đúng tỉ lệ, để bố cục trang chính không bao
 * giờ vỡ dù bạn chưa kịp chọn ảnh thật.
 */
export function ImageListField({
  slot,
  items,
  onChange,
  max,
  label,
}: {
  slot: ImageSlot;
  items: ImageAsset[];
  onChange: (items: ImageAsset[]) => void;
  max: number;
  label: string;
}) {
  const replaceAt = (index: number, image: ImageAsset) =>
    onChange(items.map((item, i) => (i === index ? image : item)));

  const removeAt = (index: number) =>
    onChange(items.filter((_, i) => i !== index));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () =>
    onChange([
      ...items,
      placeholderImage(
        crypto.randomUUID(),
        SLOT_ASPECT[slot],
        String(items.length + 1),
      ),
    ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-mist/80 text-xs tracking-wide">
          {label}{" "}
          <span className="text-mist/45">
            ({items.length}/{max})
          </span>
        </span>
        <button
          type="button"
          onClick={add}
          disabled={items.length >= max}
          className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-35"
        >
          Thêm ảnh
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-mist/45 border-mist/15 rounded-lg border border-dashed px-3 py-6 text-center text-xs">
          Chưa có ảnh nào
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <li key={item.id} className="space-y-1.5">
              <ImageField
                slot={slot}
                value={item}
                label={`${label} ${index + 1}`}
                onChange={(image) => replaceAt(index, image)}
                onRemove={() => removeAt(index)}
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Chuyển lên trước"
                  className="border-mist/20 text-mist/70 hover:text-cream flex-1 rounded border py-1 text-xs transition-colors disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Chuyển ra sau"
                  className="border-mist/20 text-mist/70 hover:text-cream flex-1 rounded border py-1 text-xs transition-colors disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
