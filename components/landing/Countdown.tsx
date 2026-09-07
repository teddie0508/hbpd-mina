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
  onUnlock,
}: {
  content: CountdownContent;
  targetIso: string;
  onUnlock: () => void;
}) {
  const target = new Date(targetIso).getTime();
  // Đồng hồ chỉ chạy sau khi mount, tránh lệch giữa HTML dựng ở máy chủ và trình duyệt.
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setLeft(remainingUntil(target, now));
      if (now >= target) onUnlock();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target, onUnlock]);

  const units: Array<{ value: number; label: string }> = [
    { value: left?.days ?? 0, label: "ngày" },
    { value: left?.hours ?? 0, label: "giờ" },
    { value: left?.minutes ?? 0, label: "phút" },
    { value: left?.seconds ?? 0, label: "giây" },
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
              <span
                className="font-body border-gold/20 bg-deep/50 text-gold grid min-w-[2.6em] place-items-center rounded-xl border px-2 py-2 text-[calc(clamp(1.6rem,6vw,2.8rem)*var(--fz-body,1))] leading-none tabular-nums"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {left === null ? "--" : String(unit.value).padStart(2, "0")}
              </span>
              <span className="font-body text-mist/60 text-[calc(0.65rem*var(--fz-body,1))] tracking-[0.18em] uppercase">
                {unit.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Phong bì khoá: gợi ý có thứ gì đó đang đợi mà chưa mở được. */}
      <motion.div
        aria-hidden
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative mt-2 h-16 w-24 opacity-40"
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
      </motion.div>
    </motion.div>
  );
}
