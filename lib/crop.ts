/** Vùng cắt do react-easy-crop trả về, tính bằng pixel của ảnh gốc. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Dùng khi bên gọi không nói rõ. Từng vị trí có mức riêng trong SLOT_MAX_EDGE. */
const DEFAULT_LONG_EDGE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không đọc được ảnh"));
    image.src = src;
  });
}

/**
 * Cắt ảnh ngay trên trình duyệt rồi mới tải lên.
 * Nhờ vậy ảnh lưu trữ đã đúng tỉ lệ của vị trí sẽ dùng, trang chính không bao
 * giờ phải co kéo ảnh, và file gửi lên cũng nhẹ hơn nhiều so với ảnh gốc.
 */
export async function cropToBlob(
  imageSrc: string,
  area: CropArea,
  /** Cạnh dài nhất của ảnh kết quả; lấy theo vị trí sẽ dùng. */
  maxLongEdge = DEFAULT_LONG_EDGE,
  /**
   * WebP chứ KHÔNG phải JPEG.
   * JPEG không có kênh alpha, nên icon nền trong suốt sẽ bị ép phẳng lên nền
   * canvas và biến thành nền đen đặc. WebP giữ được độ trong, mà file lại
   * nhẹ hơn JPEG cùng chất lượng.
   *
   * Trình duyệt nào không mã hoá được WebP thì theo chuẩn sẽ tự lùi về PNG —
   * cũng có alpha, nên trong mọi trường hợp ảnh đều không mất nền trong suốt.
   */
  mimeType = "image/webp",
  quality = 0.9,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  // Thu nhỏ nếu vùng cắt lớn hơn mức cần thiết, giữ nguyên tỉ lệ.
  const scale = Math.min(1, maxLongEdge / Math.max(area.width, area.height));
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không dựng được canvas");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Không cắt được ảnh")),
      mimeType,
      quality,
    );
  });
}
