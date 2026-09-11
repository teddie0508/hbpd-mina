"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import type { CountdownContent } from "@/lib/content/schema";
import { fontVars } from "@/lib/theme";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingUntil(target: number, now: number): Remaining {
  const ms = Math.max(0, target - now);
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Màn hình chờ trước ngày mở. Đúng thời khắc thì tự gọi onUnlock,
 * không cần tải lại trang.
 */
export function Countdown({
  content,
  targetIso,
  serverNow,
  onUnlock,
}: {
  content: CountdownContent;
  targetIso: string;
  /**
   * Giờ của máy chủ lúc dựng trang, tính bằng ms.
   *
   * Đếm theo đồng hồ của điện thoại thì lệch: điện thoại nhanh 30 giây là
   * đồng hồ về 0 trước máy chủ 30 giây — phong bì hiện ra, Mina nhập tên, rồi
   * bị cổng khoá trên máy chủ đá ngược về màn đếm ngược; màn này lại thấy
   * 00:00 nên lại mở phong bì... cứ thế giật qua giật lại đúng vào khoảnh khắc
   * quan trọng nhất. Đếm theo giờ máy chủ thì hai bên luôn cùng một nhịp.
   */
  serverNow: number;
  onUnlock: () => void;
}) {
  const target = new Date(targetIso).getTime();
  // Đồng hồ chỉ chạy sau khi mount, tránh lệch giữa HTML dựng ở máy chủ và trình duyệt.
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    // Độ lệch đo một lần lúc trang vừa lên. Số đo này luôn chậm hơn giờ máy
    // chủ thật một khoảng bằng thời gian tải trang, nên đồng hồ về 0 muộn hơn
    // một chút chứ không bao giờ sớm hơn — đúng chiều an toàn, vì mở SỚM mới
    // là thứ gây giật qua giật lại.
    const lech = serverNow - Date.now();
    // Chỉ báo mở khoá một lần. Hẹn giờ vẫn chạy trong lúc màn này làm hoạt
    // cảnh biến đi, mà mỗi lần báo là trang bìa gọi router.refresh().
    let daBao = false;

    const tick = () => {
      const now = Date.now() + lech;
      setLeft(remainingUntil(target, now));
      if (now >= target && !daBao) {
        daBao = true;
        onUnlock();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target, serverNow, onUnlock]);

  const units: Array<{ value: number; label: string; pulse?: boolean }> = [
    { value: left?.days ?? 0, label: "ngày" },
    { value: left?.hours ?? 0, label: "giờ" },
    { value: left?.minutes ?? 0, label: "phút" },
    // Chỉ ô giây nảy. Cho cả bốn ô cùng nảy thì thành giật, không ra nhịp thở.
    { value: left?.seconds ?? 0, label: "giây", pulse: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={fontVars(content.fonts, content.typography)}
      className="flex flex-col items-center gap-8 text-center"
    >
      <div className="space-y-3">
        <h1 className="font-heading text-cream text-[calc(clamp(2rem,7vw,3.5rem)*var(--fz-heading,1))] leading-tight">
          {content.title}
        </h1>
        <p className="font-body text-mist/80 measure mx-auto text-[calc(clamp(0.9rem,2.6vw,1.05rem)*var(--fz-body,1))]">
          {content.subtitle}
        </p>
      </div>

      <div
        className="flex items-start gap-2 sm:gap-4"
        role="timer"
        aria-live="off"
        aria-label="Thời gian còn lại"
      >
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-start gap-2 sm:gap-4">
            {i > 0 ? (
              <span className="font-body text-gold/35 pt-1 text-[calc(clamp(1.6rem,5vw,2.4rem)*var(--fz-body,1))] leading-none">
                :
              </span>
            ) : null}
            <div className="flex flex-col items-center gap-1">
              {/* Ô giây nảy một nhịp mỗi lần đổi số, cho đồng hồ có hơi thở.
                  Đổi key theo giá trị nên motion dựng lại và chạy initial. */}
              <motion.span
                key={unit.pulse ? unit.value : undefined}
                initial={unit.pulse ? { scale: 1.12 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 15 }}
                className="font-body border-gold/20 bg-deep/50 text-gold grid min-w-[2.6em] place-items-center rounded-xl border px-2 py-2 text-[calc(clamp(1.6rem,6vw,2.8rem)*var(--fz-body,1))] leading-none tabular-nums"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {left === null ? "--" : String(unit.value).padStart(2, "0")}
              </motion.span>
              <span className="font-body text-mist/60 text-[calc(0.65rem*var(--fz-body,1))] tracking-[0.18em] uppercase">
                {unit.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Phong bì khoá: gợi ý có thứ gì đó đang đợi mà chưa mở được.
          Lơ lửng bằng CSS, không bằng motion — vòng lặp vô hạn. */}
      <div
        aria-hidden
        className="drift-y relative mt-2 h-16 w-24 opacity-40"
        style={
          { "--float-y": "-6px", "--float-dur": "4.5s" } as React.CSSProperties
        }
      >
        <svg viewBox="0 0 96 64" fill="none" className="size-full">
          <rect
            x="2"
            y="2"
            width="92"
            height="60"
            rx="6"
            stroke="color-mix(in srgb, var(--c-mist) 40%, transparent)"
            strokeWidth="2"
          />
          {/* Nắp thư: một đường gấp khúc, không phải hình bị cắt. */}
          <path
            d="M2 8 L48 40 L94 8"
            stroke="color-mix(in srgb, var(--c-mist) 40%, transparent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="48"
            cy="36"
            r="6"
            fill="color-mix(in srgb, var(--c-gold) 50%, transparent)"
          />
        </svg>
      </div>
    </motion.div>
  );
}
