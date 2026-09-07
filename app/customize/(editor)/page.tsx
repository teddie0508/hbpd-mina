import { EditorShell } from "@/components/customize/EditorShell";
import { getContentFresh, storageMode } from "@/lib/content/store";
import { FONTS, googleFontsHref } from "@/lib/fonts";

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  // Đọc bỏ qua cache: trình sửa phải luôn hiện đúng bản máy chủ đang giữ,
  // vì đây chính là chỗ bạn nhìn vào để biết lưu đã ăn hay chưa.
  const content = await getContentFresh();

  // Nạp toàn bộ font trong registry để ô xem thử hiện đúng mặt chữ.
  // Chỉ trang này mới nặng như vậy; trang Mina xem chỉ tải đúng font đang dùng.
  const allFonts = googleFontsHref(FONTS.map((f) => f.key));

  return (
    <>
      {allFonts ? <link rel="stylesheet" href={allFonts} /> : null}
      <EditorShell initial={content} storage={storageMode()} />
    </>
  );
}
