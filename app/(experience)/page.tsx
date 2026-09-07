import { Landing } from "@/components/landing/Landing";
import { getContent } from "@/lib/content/store";
import { isLocked } from "@/lib/gate";

// Phụ thuộc vào giờ hiện tại và cookie đăng nhập, nên không cache được.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [content, locked] = await Promise.all([getContent(), isLocked()]);

  // Không còn cần ?preview=1: cứ đăng nhập ở /customize là xem trước được
  // toàn bộ trang, kể cả các trang trong.
  return <Landing content={content} lockedOnServer={locked} />;
}
