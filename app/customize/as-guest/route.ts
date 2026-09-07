import { NextResponse } from "next/server";

import { isEditor } from "@/lib/auth";
import { GUEST_COOKIE, GUEST_MAX_AGE } from "@/lib/gate";

export const dynamic = "force-dynamic";

/**
 * Bật chế độ xem như Mina rồi mở trang bìa.
 *
 * Cố tình là một đường dẫn thường chứ không phải Server Action, để nút bên
 * trình sửa chỉ cần là thẻ <a target="_blank">. Mở tab mới bằng liên kết thật
 * thì không bao giờ bị trình duyệt chặn, còn gọi window.open sau một lần await
 * thì đã ra ngoài ngữ cảnh cú bấm và hay bị chặn như cửa sổ quảng cáo.
 */
export async function GET(request: Request) {
  if (!(await isEditor())) {
    return NextResponse.redirect(new URL("/customize/login", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(GUEST_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: GUEST_MAX_AGE,
  });
  return response;
}
