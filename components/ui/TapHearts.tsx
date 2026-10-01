"use client";

import { useEffect, useRef, useState } from "react";

/** Trái tim sống bao lâu rồi gỡ khỏi trang. Khớp với keyframes tap-heart. */
const HEART_MS = 1100;
/** Giữ tối đa bấy nhiêu quả cùng lúc, để chạm liên tục cũng không phình DOM. */
const MAX_HEARTS = 10;

interface Heart {
  id: number;
  x: number;
  y: number;
  /** Độ lệch ngang lúc bay lên, để các quả toè ra chứ không xếp hàng dọc. */
  dx: number;
  r: number;
}

/**
 * Chạm vào bất cứ đâu là một trái tim nhỏ bay lên rồi tan.
 *
 * Nghe `pointerdown` ở cấp window nên bắt được cả chạm lẫn bấm chuột, và
 * không chặn thao tác nào: lớp vẽ tim luôn `pointer-events-none`.
 *
 * Bỏ qua khi đang gõ trong ô nhập — lúc đó Mina đang viết thư lại cho bạn,
 * mỗi phím một quả tim thì thành phiền chứ không còn dễ thương.
 */
export function TapHearts() {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const dem = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;

      const id = (dem.current += 1);
      const heart: Heart = {
        id,
        x: e.clientX,
        y: e.clientY,
        dx: Math.round((Math.random() - 0.5) * 52),
        r: Math.round((Math.random() - 0.5) * 44),
      };
      setHearts((xs) => [...xs.slice(-(MAX_HEARTS - 1)), heart]);
      window.setTimeout(
        () => setHearts((xs) => xs.filter((h) => h.id !== id)),
        HEART_MS,
      );
    };

    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[95] overflow-hidden"
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          className="tap-heart text-gold absolute block"
          style={
            {
              left: h.x,
              top: h.y,
              marginLeft: "-0.5rem",
              marginTop: "-0.5rem",
              "--dx": `${h.dx}px`,
              "--r": `${h.r}deg`,
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path d="M12 21s-7.5-4.6-9.4-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.4 12c-1.9 4.4-9.4 9-9.4 9Z" />
          </svg>
        </span>
      ))}
    </div>
  );
}
