import { Landing } from "@/components/landing/Landing";
import { forLanding } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";
import { isLocked, needsPassphrase } from "@/lib/gate";

// Phụ thuộc vào giờ hiện tại và cookie đăng nhập, nên không cache được.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [content, locked, askName] = await Promise.all([
    getContent(),
    isLocked(),
    needsPassphrase(),
  ]);

  // Cứ đăng nhập ở /customize là xem trước được toàn bộ trang, kể cả các
  // trang trong.
  //
  // forLanding() chỉ lấy đúng những trường trang bìa cần. Mọi thứ truyền vào
  // client component nằm nguyên trong HTML, mà đây là trang người lạ vào được
  // trước ngày mở — xem chú thích ở lib/content/schema.ts.
  return (
    <Landing
      data={forLanding(content)}
      lockedOnServer={locked}
      askNameOnServer={askName}
      serverNow={Date.now()}
    />
  );
}
