"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { endRehearsal, startRehearsal } from "@/app/customize/(editor)/actions";

import { SectionCard } from "./fields";

const CHOICES = [15, 30, 60] as const;

/**
 * Nút diễn tập 0h.
 *
 * Khoảnh khắc chuyển từ đếm ngược sang phong bì là chỗ dồn nhiều thứ nhất —
 * đồng hồ về 0, xin lại nhạc từ máy chủ, hỏi tên, bật nhạc trong cú chạm — mà
 * lại chỉ xảy ra đúng một lần. Diễn tập cho chạy lại khoảnh khắc đó bao nhiêu
 * lần cũng được, không phải sửa ngày mở rồi nhớ sửa lại.
 */
export function RehearsalCard({ rehearsalAt }: { rehearsalAt: string | null }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number>(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null tới khi vào trình duyệt, để HTML máy chủ và trình duyệt khớp nhau.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!rehearsalAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [rehearsalAt]);

  async function start() {
    setBusy(true);
    setError(null);
    // Mở tab NGAY trong cú bấm. Đợi máy chủ trả lời xong mới mở thì cú bấm đã
    // hết hiệu lực, trình duyệt coi đó là cửa sổ tự bật và chặn.
    const tab = window.open("about:blank", "_blank");
    const res = await startRehearsal(seconds);
    setBusy(false);

    if (!res.ok) {
      tab?.close();
      setError(res.error ?? "Không bắt đầu được.");
      return;
    }
    if (tab) tab.location.href = "/";
    router.refresh();
  }

  async function stop() {
    setBusy(true);
    await endRehearsal();
    setBusy(false);
    router.refresh();
  }

  const conLai =
    rehearsalAt && now !== null
      ? Math.max(0, Math.ceil((Date.parse(rehearsalAt) - now) / 1000))
      : null;

  return (
    <SectionCard
      title="Diễn tập 0h"
      description="Cho trang bìa đếm ngược vài chục giây rồi tự mở khoá, hỏi tên lại từ đầu — y như đêm sinh nhật. Nội dung đã lưu không bị đổi, chỉ trình duyệt này thấy, và tự hết sau 15 phút. Trang bìa dùng bản ĐÃ LƯU, nên có sửa gì thì lưu trước rồi hãy diễn tập."
    >
      {error ? (
        <p className="border-mist/25 text-mist/70 rounded-lg border border-dashed px-3 py-2 text-xs">
          {error}
        </p>
      ) : null}

      {rehearsalAt ? (
        <div className="space-y-3">
          <p className="text-sm text-amber-200">
            {conLai === null
              ? "Đang diễn tập..."
              : conLai > 0
                ? `Đang diễn tập — trang bìa mở khoá sau ${conLai} giây.`
                : "Đã qua giờ mở khoá — phong bì, hỏi tên và nhạc đang chạy như thật."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              target="_blank"
              className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold rounded-lg border px-3 py-1.5 text-xs transition-colors"
            >
              Mở trang bìa
            </Link>
            <button
              type="button"
              onClick={() => void start()}
              disabled={busy}
              className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
            >
              Diễn tập lại ({seconds} giây)
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              disabled={busy}
              className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200 transition-colors hover:bg-amber-400/20 disabled:opacity-40"
            >
              Kết thúc diễn tập
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-mist/70 text-xs">Mở khoá sau</span>
          {CHOICES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeconds(s)}
              aria-pressed={seconds === s}
              className={
                seconds === s
                  ? "bg-gold/15 text-gold rounded-lg px-2.5 py-1 text-xs"
                  : "text-mist/70 hover:text-cream rounded-lg px-2.5 py-1 text-xs"
              }
            >
              {s} giây
            </button>
          ))}
          <button
            type="button"
            onClick={() => void start()}
            disabled={busy}
            className="bg-gold text-deep hover:bg-gold/90 ml-auto rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
          >
            {busy ? "Đang chuẩn bị..." : "Bắt đầu diễn tập"}
          </button>
        </div>
      )}
    </SectionCard>
  );
}
