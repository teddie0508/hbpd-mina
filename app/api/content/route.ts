import { NextResponse } from "next/server";

import { isEditor } from "@/lib/auth";
import { getContent, saveContent, storageMode } from "@/lib/content/store";
import type { SiteContent } from "@/lib/content/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isEditor())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  return NextResponse.json({
    content: await getContent(),
    storage: storageMode(),
  });
}

export async function PUT(request: Request) {
  if (!(await isEditor())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  let incoming: SiteContent;
  try {
    incoming = (await request.json()) as SiteContent;
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  try {
    const saved = await saveContent(incoming);
    return NextResponse.json({ content: saved, storage: storageMode() });
  } catch (error) {
    console.error("[content] lưu thất bại:", error);
    // Đây là endpoint riêng của một người đã đăng nhập, nên trả nguyên lý do
    // ra giao diện có ích hơn nhiều so với một câu "Không lưu được" chung chung.
    const reason =
      error instanceof Error && error.message
        ? error.message
        : "Lỗi không rõ nguyên nhân";
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
