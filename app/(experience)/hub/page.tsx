import { Hub } from "@/components/hub/Hub";
import { redirect } from "next/navigation";

import { Teddie } from "@/components/teddie/Teddie";

import { getContent } from "@/lib/content/store";
import { isSealed } from "@/lib/gate";

// Đọc cookie và giờ hiện tại để kiểm khoá, nên không prerender tĩnh được.
export const dynamic = "force-dynamic";

export default async function HubPage() {
  // Chưa tới ngày mở, hoặc chưa trả lời được lớp hỏi tên, thì đá về trang
  // bìa — không cho gõ thẳng URL vào xem lén.
  if (await isSealed()) redirect("/");

  const content = await getContent();
  return (
    <>
      <Hub content={content.hub} />
      {content.teddie.enabled ? <Teddie spot={content.teddie.hub} /> : null}
    </>
  );
}
