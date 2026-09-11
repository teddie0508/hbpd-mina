"use client";

import { useState } from "react";

import { sendReply } from "@/app/(experience)/actions";
import { MAX_REPLY_CHARS, type ReplyContent } from "@/lib/content/schema";

/**
 * Tấm giấy nhỏ ở cuối trang Hoa để Mina viết lại vài dòng.
 *
 * Chữ trong ô nhập tối thiểu 16px: Safari trên iPhone tự phóng to cả trang
 * mỗi khi chạm vào một ô nhập có chữ nhỏ hơn thế, rồi không tự thu lại.
 */
export function ReplyBox({ content }: { content: ReplyContent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending || !text.trim()) return;

    setSending(true);
    setError(null);
    try {
      const res = await sendReply(text);
      if (res.ok) {
        setSent(true);
        setText("");
      } else {
        // Giữ nguyên chữ đã viết khi gửi hỏng — mất thư đang viết dở mới là tệ nhất.
        setError(res.error ?? "Chưa gửi được, thử lại nhé.");
      }
    } catch {
      setError("Mạng đang chập chờn, thử lại sau một chút nhé.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="paper w-full max-w-md rounded-2xl px-5 py-6 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.75)] sm:px-6">
      {sent ? (
        <div role="status" className="text-center">
          <p className="font-accent text-ink text-[calc(clamp(1.05rem,3.8vw,1.25rem)*var(--fz-accent,1))] leading-snug text-balance">
            {content.thanks}
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-ink/55 hover:text-ink focus-visible:ring-gold/50 mt-4 rounded text-xs underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2"
          >
            Viết thêm
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="reply-text"
            className="font-accent text-ink block text-center text-[calc(clamp(1.05rem,3.8vw,1.25rem)*var(--fz-accent,1))] leading-snug text-balance"
          >
            {content.title}
          </label>

          <textarea
            id="reply-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            rows={5}
            maxLength={MAX_REPLY_CHARS}
            placeholder={content.placeholder}
            className="border-ink/20 bg-cream/60 text-ink placeholder:text-ink/35 focus:border-gold focus:ring-gold/35 font-body mt-4 w-full resize-y rounded-xl border px-4 py-3 text-[calc(clamp(1rem,3.6vw,1.05rem)*var(--fz-body,1))] leading-relaxed outline-none focus:ring-2"
          />

          <div className="mt-1 flex items-start justify-between gap-3 text-[11px]">
            <p aria-live="polite" className="min-h-4 text-[#a4442f]">
              {error}
            </p>
            <span className="text-ink/40 shrink-0 tabular-nums">
              {text.length}/{MAX_REPLY_CHARS}
            </span>
          </div>

          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-ink/90 text-cream hover:bg-ink focus-visible:ring-gold mt-3 w-full rounded-xl px-4 py-3 text-sm tracking-wide transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Đang gửi..." : content.sendLabel}
          </button>
        </form>
      )}
    </div>
  );
}
