"use server";

import { cookies } from "next/headers";

import { getContent } from "@/lib/content/store";
import { PASS_COOKIE, PASS_MAX_AGE } from "@/lib/gate";
import { matchesAnswer } from "@/lib/passphrase";

/**
 * Kiểm tên gõ ở trang bìa.
 *
 * Cố ý làm ở máy chủ chứ không so ngay trong trình duyệt: so ở trình duyệt
 * thì danh sách đáp án phải gửi xuống, mà mọi thứ gửi xuống đều nằm trong
 * HTML — mở View Source là hết bất ngờ.
 */
export async function tryPassphrase(guess: string): Promise<boolean> {
  if (typeof guess !== "string") return false;

  const content = await getContent();
  const { enabled, answers } = content.landing.passphrase;

  // Tắt lớp này ở /customize thì coi như ai gõ gì cũng qua.
  if (!enabled) return true;
  if (!matchesAnswer(guess, answers)) return false;

  (await cookies()).set(PASS_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: PASS_MAX_AGE,
  });

  return true;
}
