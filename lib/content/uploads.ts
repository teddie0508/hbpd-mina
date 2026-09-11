/**
 * Gom mọi đường dẫn tệp tải lên mà một bản nội dung đang trỏ tới.
 *
 * Đi đệ quy qua toàn bộ object thay vì liệt kê từng chỗ có ảnh hay nhạc. Liệt
 * kê thì chỉ cần sau này thêm một chỗ dùng ảnh mới vào schema mà quên cập nhật
 * danh sách, là tệp đang dùng bị coi là thừa và bị xoá — thứ lỗi không cứu lại
 * được. Quét hết mọi chuỗi thì không bao giờ sót.
 *
 * Tách riêng khỏi store.ts (vốn đánh dấu server-only) để kiểm được bằng Node.
 */
export function collectUploadPaths(
  value: unknown,
  prefix: string,
  out: Set<string> = new Set(),
): Set<string> {
  if (typeof value === "string") {
    const at = value.indexOf(prefix);
    // URL đầy đủ của Blob là https://<kho>/<đường dẫn>; cắt từ tiền tố trở đi
    // là ra đúng đường dẫn trong kho. Bỏ query và hash nếu có.
    if (at >= 0) out.add(value.slice(at).split(/[?#]/)[0]);
  } else if (Array.isArray(value)) {
    for (const item of value) collectUploadPaths(item, prefix, out);
  } else if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectUploadPaths(item, prefix, out);
    }
  }
  return out;
}
