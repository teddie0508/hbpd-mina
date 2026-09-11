import { Landing } from "@/components/landing/Landing";
import { forLanding, pickWaitingTeddie } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";
import { isLocked, needsPassphrase, rehearsalRevealAt } from "@/lib/gate";

// Phụ thuộc vào giờ hiện tại và cookie đăng nhập, nên không cache được.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [content, locked, askName, rehearsal] = await Promise.all([
    getContent(),
    isLocked(),
    needsPassphrase(),
    rehearsalRevealAt(),
  ]);

  // Cứ đăng nhập ở /customize là xem trước được toàn bộ trang, kể cả các
  // trang trong.
  //
  // forLanding() chỉ lấy đúng những trường trang bìa cần. Mọi thứ truyền vào
  // client component nằm nguyên trong HTML, mà đây là trang người lạ vào được
  // trước ngày mở — xem chú thích ở lib/content/schema.ts.
  const data = forLanding(content);

  // Diễn tập 0h: đồng hồ đếm về mốc giả thay vì ngày thật. `isLocked()` cũng
  // đọc cùng mốc này, nên hai bên luôn khớp nhau.
  if (rehearsal) {
    data.countdown = { ...data.countdown, revealAt: rehearsal };
  }

  return (
    <Landing
      data={data}
      lockedOnServer={locked}
      askNameOnServer={askName}
      serverNow={Date.now()}
      // Chỉ bốc gấu khi còn khoá: mở rồi thì màn đếm ngược không hiện nữa.
      teddie={locked ? pickWaitingTeddie(content) : null}
    />
  );
}
