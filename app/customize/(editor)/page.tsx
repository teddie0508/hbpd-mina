import { EditorShell } from "@/components/customize/EditorShell";
import { getContent, storageMode } from "@/lib/content/store";
import { isViewingAsGuest, rehearsalRevealAt } from "@/lib/gate";
import { FONTS, googleFontsHref } from "@/lib/fonts";

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  const [content, asGuest, rehearsalAt] = await Promise.all([
    getContent(),
    isViewingAsGuest(),
    rehearsalRevealAt(),
  ]);

  // Nạp toàn bộ font trong registry để ô xem thử hiện đúng mặt chữ.
  // Chỉ trang này mới nặng như vậy; trang Mina xem chỉ tải đúng font đang dùng.
  const allFonts = googleFontsHref(FONTS.map((f) => f.key));

  return (
    <>
      {allFonts ? <link rel="stylesheet" href={allFonts} /> : null}
      <EditorShell
        initial={content}
        storage={storageMode()}
        asGuest={asGuest}
        rehearsalAt={rehearsalAt}
      />
    </>
  );
}
