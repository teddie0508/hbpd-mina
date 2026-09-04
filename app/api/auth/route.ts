import { NextResponse } from "next/server";

import { checkPassword, createSession, destroySession } from "@/lib/auth";

/** Trễ nhẹ khi sai mật khẩu, để dò mật khẩu bằng máy đắt hơn hẳn. */
const WRONG_PASSWORD_DELAY_MS = 700;

export async function POST(request: Request) {
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

  if (!checkPassword(password)) {
    await new Promise((resolve) =>
      setTimeout(resolve, WRONG_PASSWORD_DELAY_MS),
    );
    return NextResponse.json({ error: "Mật khẩu không đúng" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
