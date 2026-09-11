import { MiniPlayer } from "@/components/player/MiniPlayer";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { getContent } from "@/lib/content/store";
import { isLocked } from "@/lib/gate";

/**
 * Bọc riêng phần Mina sẽ xem.
 * Nhạc nằm ở đây (chứ không ở layout gốc) nên vẫn chạy liền mạch khi
 * chuyển giữa các trang, mà lại không lọt sang khu /customize.
 *
 * Mọi trang bên trong đều render động: chúng phải đọc cookie và giờ hiện tại
 * để kiểm cổng khoá (xem lib/gate.ts), nên không dựng tĩnh được.
 */
export default async function ExperienceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [content, locked] = await Promise.all([getContent(), isLocked()]);

  // Trang còn khoá thì KHÔNG gửi danh sách nhạc xuống.
  //
  // URL bài nhạc trỏ thẳng vào kho Blob, tức là để lộ tên miền của kho ngay
  // trên màn đếm ngược — trang duy nhất người lạ vào được trước ngày mở. Đã
  // kiểm bằng curl: tên miền kho hiện nguyên trong HTML. Tới giờ mở, màn đếm
  // ngược tự gọi router.refresh() nên danh sách nhạc về kịp, và trang bìa
  // đợi nó về rồi mới cho chạm phong bì.
  const music = locked ? { ...content.music, tracks: [] } : content.music;

  return (
    <AudioProvider music={music}>
      <div className="bg-base relative min-h-svh overflow-x-hidden">
        {children}
      </div>
      <MiniPlayer />
    </AudioProvider>
  );
}
