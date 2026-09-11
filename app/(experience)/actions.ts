"use server";

import { cookies, headers } from "next/headers";

import { isEditor } from "@/lib/auth";
import { MAX_REPLY_CHARS } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";
import {
  PASS_COOKIE,
  PASS_MAX_AGE,
  isSealed,
  isViewingAsGuest,
} from "@/lib/gate";
import { addEntry } from "@/lib/inbox";
import { matchesAnswer } from "@/lib/passphrase";
import { blockedFor, ipFromHeaders, recordFailure } from "@/lib/rate-limit";

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

/**
 * Chặn gửi dồn: mỗi lượt gửi tính là một lượt trong bộ đếm dùng chung với
 * đăng nhập, tức tối đa 10 lượt mỗi 10 phút cho một địa chỉ IP. Tên hàm
 * `recordFailure` ở đây nghĩa là "đã dùng một lượt", không phải "sai".
 */
async function useTurn(scope: string): Promise<boolean> {
  const key = `${scope}:${ipFromHeaders(await headers())}`;
  if (blockedFor(key) > 0) return false;
  recordFailure(key);
  return true;
}

export interface ReplyResult {
  ok: boolean;
  error?: string;
}

/** Thư Mina viết ở cuối trang Hoa. */
export async function sendReply(text: string): Promise<ReplyResult> {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, error: "Viết gì đó đã nhé :>" };
  }
  if (text.length > MAX_REPLY_CHARS) {
    return { ok: false, error: `Dài quá ${MAX_REPLY_CHARS} ký tự rồi.` };
  }

  // Cùng một cổng với các trang trong: chưa tới ngày hoặc chưa trả lời được
  // tên thì không gửi được — không để người lạ gửi thẳng vào hộp thư.
  if (await isSealed()) {
    return { ok: false, error: "Chưa tới lúc gửi thư đâu." };
  }
  const content = await getContent();
  if (!content.flowers.reply.enabled) {
    return { ok: false, error: "Hộp thư đang đóng." };
  }
  if (!(await useTurn("reply"))) {
    return { ok: false, error: "Gửi nhiều quá rồi, đợi một lát nhé." };
  }

  try {
    await addEntry("reply", { text: text.trim(), preview: await isEditor() });
    return { ok: true };
  } catch (error) {
    console.error("[inbox] không lưu được thư:", error);
    return {
      ok: false,
      error: "Thư chưa gửi đi được, thử lại sau một chút nhé.",
    };
  }
}

/**
 * Ghi nhật ký: mở phong bì, tới màn kết.
 *
 * Bạn đăng nhập mà xem bình thường thì KHÔNG ghi, kẻo nhật ký toàn là lượt
 * kiểm tra của chính bạn. Bật "xem như Mina" hoặc đang diễn tập thì có ghi,
 * kèm cờ `preview` để trong /customize tách ra được.
 */
export async function noteMoment(kind: "opened" | "finale"): Promise<void> {
  if (kind !== "opened" && kind !== "finale") return;
  if (await isSealed()) return;

  const editor = await isEditor();
  if (editor && !(await isViewingAsGuest())) return;
  if (!(await useTurn("moment"))) return;

  try {
    await addEntry(kind, { preview: editor });
  } catch (error) {
    console.error("[inbox] không ghi được nhật ký:", error);
  }
}
