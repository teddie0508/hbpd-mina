"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { TeddieSpot } from "@/lib/content/schema";

/** Bong bóng thoại tự thu lại sau chừng này, để nó không đứng chắn mãi. */
const BUBBLE_MS = 6500;

/** Hướng bay của ba quả tim, tính bằng px theo trục ngang. */
const HEART_DRIFT = [-16, 4, 20];

/**
 * Chú gấu Teddie ngồi ở góc dưới bên trái, đi theo Mina qua từng trang.
 *
 * Ảnh là ảnh tĩnh do bạn tải lên, còn cảm giác "sống" đến từ ba lớp chuyển
 * động chồng lên nhau, cố ý tách riêng vì cả `motion` lẫn CSS đều ghi vào
 * thuộc tính `transform` — gộp chung là lớp sau xoá lớp trước:
 *
 *  1. lớp ngoài cùng: hiện ra lúc vào trang (motion, chạy một lần)
 *  2. lớp giữa: thở — trôi lên xuống và nghiêng qua lại (CSS, lặp vô hạn nên
 *     phải nằm ở luồng ghép ảnh, không chiếm luồng chính)
 *  3. lớp trong: nảy khi được chạm vào (motion, gọi tay)
 *
 * Cú nảy dùng kiểu squash & stretch của phim hoạt hình: bẹp xuống lấy đà, vọt
 * lên thì kéo dài ra, chạm đất lại bẹp một nhịp nhỏ. Chính chỗ méo hình đó
 * làm một tấm ảnh phẳng trông như có trọng lượng.
 */
export function Teddie({ spot }: { spot: TeddieSpot }) {
  const hop = useAnimationControls();
  const [line, setLine] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  /** Tăng mỗi lần chạm để mấy quả tim được dựng lại và bay lại từ đầu. */
  const [burst, setBurst] = useState(0);
  const hideTimer = useRef<number | null>(null);

  const lines = spot.lines.filter((l) => l.trim());
  const hasLines = lines.length > 0;

  const openBubble = useCallback(() => {
    setShowBubble(true);
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setShowBubble(false),
      BUBBLE_MS,
    );
  }, []);

  // Chào một câu khi vào trang, rồi tự im.
  useEffect(() => {
    if (!hasLines) return;
    const id = window.setTimeout(openBubble, 1400);
    return () => window.clearTimeout(id);
  }, [hasLines, openBubble]);

  useEffect(
    () => () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  if (!spot.image) return null;

  const handleTap = () => {
    void hop.start({
      y: [0, 2, -18, 0, 0],
      scaleX: [1, 1.12, 0.94, 1.06, 1],
      scaleY: [1, 0.86, 1.1, 0.95, 1],
      transition: { duration: 0.72, ease: [0.34, 1.2, 0.64, 1] },
    });
    setBurst((n) => n + 1);
    if (hasLines) {
      setLine((i) => (i + 1) % lines.length);
      openBubble();
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex flex-col items-start gap-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <AnimatePresence>
        {showBubble && hasLines ? (
          <motion.div
            // Key CỐ ĐỊNH, không gắn theo câu đang hiện.
            //
            // Gắn theo câu thì mỗi lần chạm là AnimatePresence coi như một
            // bong bóng khác: bong bóng cũ ở lại chờ chạy xong hoạt cảnh biến
            // đi trong khi bong bóng mới đã vào, hai cái xếp chồng nhau và đội
            // bố cục lên suốt một phần ba giây. Giữ một bong bóng rồi đổi chữ
            // bên trong thì không có lúc nào tồn tại hai cái.
            key="bubble"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="paper relative ml-1 max-w-[13rem] rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-[0_10px_26px_-10px_rgba(0,0,0,0.7)] sm:max-w-[16rem]"
          >
            <p className="font-accent text-ink/85 text-[0.82rem] leading-snug text-pretty sm:text-[0.92rem]">
              {lines[line]}
            </p>
            {/* Đuôi bong bóng chỉ xuống phía con gấu. */}
            <span className="bg-paper absolute -bottom-1 left-3 size-3 rotate-45 rounded-[2px]" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.86 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.9, ease: [0.34, 1.3, 0.64, 1] }}
        className="pointer-events-auto relative"
      >
        {/* Tim bay lên mỗi lần được chạm. Key đổi theo lượt chạm nên chúng
            được dựng lại và chạy lại từ đầu; ở đây không có ô nhập nào nên
            việc dựng lại là vô hại. */}
        {burst > 0 ? (
          <span
            key={burst}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-2 flex justify-center"
          >
            {HEART_DRIFT.map((drift, i) => (
              <span
                key={i}
                className="teddie-heart text-gold absolute block"
                style={
                  {
                    "--heart-x": `${drift}px`,
                    animationDelay: `${i * 0.12}s`,
                  } as React.CSSProperties
                }
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
                  <path d="M12 21s-7.5-4.6-9.4-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.4 12c-1.9 4.4-9.4 9-9.4 9Z" />
                </svg>
              </span>
            ))}
          </span>
        ) : null}

        <span className="teddie-float block">
          <motion.button
            type="button"
            animate={hop}
            onClick={handleTap}
            aria-label={hasLines ? lines[line] : "Teddie"}
            className="focus-visible:ring-gold/60 block cursor-pointer rounded-full outline-none focus-visible:ring-2"
          >
            <Image
              src={spot.image.url}
              alt={spot.image.alt || "Teddie"}
              width={256}
              height={256}
              sizes="(max-width: 640px) 96px, 128px"
              quality={90}
              className="size-24 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] sm:size-32"
            />
          </motion.button>
        </span>
      </motion.div>
    </div>
  );
}
