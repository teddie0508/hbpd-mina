import {
  ASPECT_VALUE,
  type AspectRatio,
  type ImageAsset,
} from "./content/schema";

/** Kích thước dài nhất của ảnh giữ chỗ; đủ nét trên màn Retina. */
const LONG_EDGE = 900;

const PLACEHOLDER_HOST = "placehold.co";

/** Màu ảnh giữ chỗ, viết không có dấu # theo yêu cầu của placehold.co. */
const PH_BG = "16332F";
const PH_FG = "D2AC5E";

export function placeholderSize(aspect: AspectRatio): {
  width: number;
  height: number;
} {
  const ratio = ASPECT_VALUE[aspect];
  return ratio >= 1
    ? { width: LONG_EDGE, height: Math.round(LONG_EDGE / ratio) }
    : { width: Math.round(LONG_EDGE * ratio), height: LONG_EDGE };
}

/**
 * Ảnh giữ chỗ đúng tỉ lệ, để bố cục hiện đủ khi chưa có ảnh thật.
 * Nhãn nên viết không dấu — placehold.co không dựng được dấu tiếng Việt.
 */
export function placeholderUrl(aspect: AspectRatio, label: string): string {
  const { width, height } = placeholderSize(aspect);
  const text = encodeURIComponent(label).replace(/%20/g, "+");
  // Đuôi .png là bắt buộc: mặc định placehold.co trả SVG, mà bộ tối ưu ảnh của
  // Next chặn SVG (chỉ mở được bằng dangerouslyAllowSVG — không đáng đánh đổi).
  return `https://${PLACEHOLDER_HOST}/${width}x${height}/${PH_BG}/${PH_FG}.png?text=${text}&font=lora`;
}

export function placeholderImage(
  id: string,
  aspect: AspectRatio,
  label: string,
): ImageAsset {
  return { id, url: placeholderUrl(aspect, label), alt: label, aspect };
}

/** Ảnh chưa được thay bằng ảnh thật — /customize dùng để nhắc còn thiếu gì. */
export function isPlaceholder(image: ImageAsset | null | undefined): boolean {
  return Boolean(image?.url.includes(PLACEHOLDER_HOST));
}
