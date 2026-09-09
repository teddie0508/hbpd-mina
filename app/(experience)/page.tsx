import { Landing } from "@/components/landing/Landing";
import { forClient } from "@/lib/content/schema";
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

  // Không còn cần ?preview=1: cứ đăng nhập ở /customize là xem trước được
  // toàn bộ trang, kể cả các trang trong.
  //
  // forClient() cắt danh sách đáp án của lớp hỏi tên: nội dung truyền vào
  // client component nằm nguyên trong HTML, để lọt là hết bất ngờ.
  return (
    <Landing
      content={forClient(content)}
      lockedOnServer={locked}
      askNameOnServer={askName}
    />
  );
}
