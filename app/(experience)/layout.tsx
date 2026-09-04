import { MiniPlayer } from "@/components/player/MiniPlayer";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { getContent } from "@/lib/content/store";

/*
 * Cố tình KHÔNG đặt force-dynamic ở đây.
 * /hub, /message, /memories, /flowers được dựng tĩnh nên <Link prefetch> nạp
 * trước trọn vẹn và chuyển trang là tức thì, không chờ mạng.
 * Nội dung vẫn cập nhật ngay sau khi bấm Lưu, nhờ revalidateTag trong
 * lib/content/store.ts. Riêng trang bìa "/" vẫn động vì phải đọc cookie
 * và giờ hiện tại cho phần đếm ngược.
 */

/**
 * Bọc riêng phần Mina sẽ xem.
 * Nhạc nằm ở đây (chứ không ở layout gốc) nên vẫn chạy liền mạch khi
 * chuyển giữa các trang, mà lại không lọt sang khu /customize.
 */
export default async function ExperienceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = await getContent();

  return (
    <AudioProvider music={content.music}>
      <div className="bg-base relative min-h-svh overflow-x-hidden">
        {children}
      </div>
      <MiniPlayer />
    </AudioProvider>
  );
}
