import { redirect } from "next/navigation";

import { isEditor } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Chốt chặn của khu chỉnh sửa.
 * Nằm trong route group (editor) chứ không phải ở app/customize/layout.tsx:
 * nếu đặt ở đó thì chính trang đăng nhập cũng bị chặn và sinh vòng chuyển hướng.
 * Route group không xuất hiện trong URL, nên trang bên trong vẫn là /customize.
 */
export default async function EditorGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await isEditor())) redirect("/customize/login");
  return children;
}
