import { waitingTeddieImages } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";

export const dynamic = "force-dynamic";

/**
 * Ảnh gấu ở màn đếm ngược, phục vụ qua chính tên miền của trang.
 *
 * Màn đếm ngược là trang DUY NHẤT người lạ xem được trước ngày mở. Trỏ thẳng
 * vào Blob thì địa chỉ ảnh mang theo tên kho, mà biết tên kho là mò được các
 * tệp khác trong kho. Đi vòng qua đây thì trong HTML chỉ còn
 * /api/waiting-teddie/<số thứ tự>.
 *
 * Chỉ phục vụ đúng những ảnh trong danh sách gấu chờ, theo chỉ số — không
 * nhận đường dẫn tuỳ ý, nên không biến thành cái cổng tải hộ tệp bất kỳ.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ index: string }> },
) {
  const { index } = await params;
  const content = await getContent();
  if (!content.waitingTeddie.enabled) {
    return new Response("Không có gấu.", { status: 404 });
  }

  const images = waitingTeddieImages(content);
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= images.length) {
    return new Response("Không có ảnh này.", { status: 404 });
  }

  const { url } = images[i];
  if (!url.startsWith("https://") && !url.startsWith("/")) {
    return new Response("Đường dẫn ảnh không hợp lệ.", { status: 404 });
  }

  // Đọc rồi trả thẳng nội dung ảnh, KHÔNG chuyển hướng — kể cả với ảnh nằm
  // trong public/ lúc chạy ở máy. Bộ tối ưu ảnh của Next không đi theo
  // chuyển hướng: trả 307 là nó báo lỗi 400 và ô ảnh trống trơn.
  const goc = await fetch(new URL(url, request.url), { cache: "no-store" });
  if (!goc.ok || !goc.body) {
    return new Response("Không lấy được ảnh.", { status: 502 });
  }

  return new Response(goc.body, {
    headers: {
      "Content-Type": goc.headers.get("content-type") ?? "image/webp",
      // Ngắn thôi: đổi ảnh ở /customize là phải thấy ngay.
      "Cache-Control": "public, max-age=300",
    },
  });
}
