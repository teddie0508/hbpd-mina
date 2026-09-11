import { NextResponse } from "next/server";

import { checkPassword, createSession, destroySession } from "@/lib/auth";
import {
  blockedFor,
  clientKey,
  recordFailure,
  recordSuccess,
} from "@/lib/rate-limit";

/** Trễ nhẹ khi sai mật khẩu, để dò mật khẩu bằng máy đắt hơn hẳn. */
const WRONG_PASSWORD_DELAY_MS = 700;

/** Còn lại từng này lần thử thì bắt đầu cảnh báo. */
const WARN_WHEN_REMAINING = 3;

function tooMany(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  return NextResponse.json(
    { error: `Sai quá nhiều lần. Thử lại sau ${minutes} phút nữa.` },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(ms / 1000)) },
    },
  );
}

export async function POST(request: Request) {
  const key = clientKey(request);

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  // Từ đây tới lúc ghi nhận lần sai KHÔNG được có await nào xen vào.
  //
  // JavaScript chạy tuần tự, nên đoạn đồng bộ này là nguyên khối: 100 request
  // bắn cùng lúc vẫn phải lần lượt đi qua đây, và cái thứ 11 chắc chắn thấy đã
  // bị khoá. Bản trước chỉ có độ trễ 700ms — chèn độ trễ đó vào TRƯỚC bước kiểm
  // thì cả 100 cùng chờ song song rồi cùng lọt qua, độ trễ thành vô nghĩa.
  const blocked = blockedFor(key);
  if (blocked > 0) return tooMany(blocked);

  if (!checkPassword(password)) {
    const { blockedMs, remaining } = recordFailure(key);
    await new Promise((resolve) =>
      setTimeout(resolve, WRONG_PASSWORD_DELAY_MS),
    );
    if (blockedMs > 0) return tooMany(blockedMs);

    const error =
      remaining <= WARN_WHEN_REMAINING
        ? `Mật khẩu không đúng. Còn ${remaining} lần thử trước khi bị khoá 10 phút.`
        : "Mật khẩu không đúng";
    return NextResponse.json({ error }, { status: 401 });
  }

  recordSuccess(key);
  await createSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
