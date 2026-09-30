"use client";

import { useState } from "react";

import { secureLegacyNow } from "@/app/customize/(editor)/actions";

import { SectionCard } from "./fields";

type Ket = { tone: "ok" | "warn" | "err"; message: string };

const MAU: Record<Ket["tone"], string> = {
  ok: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  warn: "border-amber-400/45 bg-amber-500/10 text-amber-100",
  err: "border-red-400/45 bg-red-500/10 text-red-100",
};

/**
 * Dời bản lưu cũ nhất khỏi đường dẫn cố định trong kho.
 *
 * Bấm tay chứ không chạy ngầm: việc này có xoá tệp, nên phải thấy rõ kết quả.
 * Chạy lại bao nhiêu lần cũng được — không còn gì để dời thì nó báo "kho sạch".
 */
export function SecurityCard() {
  const [busy, setBusy] = useState(false);
  const [ket, setKet] = useState<Ket | null>(null);

  async function run() {
    setBusy(true);
    setKet(null);
    try {
      setKet(await secureLegacyNow());
    } catch {
      setKet({
        tone: "err",
        message: "Không gọi được máy chủ, thử lại sau một chút.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      title="Dọn chỗ hở trong kho"
      description="Bản lưu từ thời đầu nằm ở một đường dẫn cố định ai cũng đoán được nếu biết tên kho, mà trong đó có cả lá thư và đáp án mật khẩu. Nút này chép nó sang chỗ kín hơn, đọc lại cho khớp từng chữ, rồi mới xoá bản cũ — hỏng ở bước nào thì dừng và giữ nguyên, không mất gì."
    >
      {ket ? (
        <p
          className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${MAU[ket.tone]}`}
        >
          {ket.message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold self-start rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
      >
        {busy ? "Đang dọn..." : "Kiểm tra và dọn"}
      </button>
    </SectionCard>
  );
}
