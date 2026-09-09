import { FlowersScene } from "@/components/flowers/FlowersScene";
import { redirect } from "next/navigation";

import { getContent } from "@/lib/content/store";
import { isSealed } from "@/lib/gate";

// Đọc cookie và giờ hiện tại để kiểm khoá, nên không prerender tĩnh được.
export const dynamic = "force-dynamic";

export default async function FlowersPage() {
  // Chưa tới ngày mở, hoặc chưa trả lời được lớp hỏi tên, thì đá về trang
  // bìa — không cho gõ thẳng URL vào xem lén.
  if (await isSealed()) redirect("/");

  const content = await getContent();
  return <FlowersScene content={content.flowers} />;
}
