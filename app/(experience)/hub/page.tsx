import { Hub } from "@/components/hub/Hub";
import { redirect } from "next/navigation";

import { getContent } from "@/lib/content/store";
import { isLocked } from "@/lib/gate";

// Đọc cookie và giờ hiện tại để kiểm khoá, nên không prerender tĩnh được.
export const dynamic = "force-dynamic";

export default async function HubPage() {
  // Chưa tới ngày mở mà chưa đăng nhập thì đá về trang bìa, không cho xem lén.
  if (await isLocked()) redirect("/");

  const content = await getContent();
  return <Hub content={content.hub} />;
}
