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
 * Nhớ là đã chạm vào gấu chưa, dùng chung cho cả bốn trang.
 *
 * Phải nằm ở sessionStorage chứ không phải state: mỗi lần chuyển trang là
 * component này dựng lại từ đầu, mà đã biết gấu chạm được rồi thì không cần
 * ai nhắc lại ở ba trang còn lại nữa.
 */
const TAPPED_KEY = "mina.teddie.tapped";

/**
 * Nét vẽ tay uốn lượn, đi từ dòng chữ xuống trái vào chỗ gấu ngồi.
 *
 * Ngược hướng với mũi tên chỉ vào trình phát nhạc, nên toạ độ phải tính lại
 * hẳn chứ không lật gương được: tiếp tuyến ở cuối là P3 − P2 = (8, 46) −
 * (22, 40) = (−14, 6), tức chếch xuống bên trái chừng 157°, và hai vạch của
 * đầu mũi tên bám theo đúng con số đó.
 */
function CurlyArrowToBear() {
  return (
    <svg
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="note-nudge h-14 w-11 shrink-0"
      // Nhích về phía con gấu, tức xuống bên trái.
      style={{ "--nudge-x": "-4px", "--nudge-y": "2px" } as React.CSSProperties}
      aria-hidden
    >
      <path d="M42 14 C 31 10, 24 20, 29 28 C 34 36, 22 40, 8 46" />
      <path d="M12.6 39.4 L 8 46 L 15.9 47.2" />
    </svg>
  );
}

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
export function Teddie({
  spot,
  tapHint = "",
}: {
  spot: TeddieSpot;
  /** Dòng nhắc kèm mũi tên, chỉ hiện tới lần chạm đầu tiên. */
  tapHint?: string;
}) {
  const hop = useAnimationControls();
  const [showBubble, setShowBubble] = useState(false);
  const [showHint, setShowHint] = useState(false);
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

  // Nhắc "chạm thử đi", nhưng chỉ khi chưa từng chạm lần nào.
  //
  // Đọc sessionStorage trong effect chứ không trong lúc dựng: máy chủ không có
  // sessionStorage, đọc lúc dựng là HTML hai bên lệch nhau ngay.
  useEffect(() => {
    if (!tapHint.trim()) return;
    try {
      if (sessionStorage.getItem(TAPPED_KEY) === "1") return;
    } catch {
      // Chế độ riêng tư chặn sessionStorage — coi như chưa chạm, cùng lắm là
      // nhắc lại một lần nữa.
    }
    // Chờ con gấu chào xong đã rồi mới chen vào.
    const id = window.setTimeout(() => setShowHint(true), 2800);
    return () => window.clearTimeout(id);
  }, [tapHint]);

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

    // Đã biết gấu chạm được rồi thì thôi nhắc, ở cả những trang sau nữa.
    setShowHint(false);
    try {
      sessionStorage.setItem(TAPPED_KEY, "1");
    } catch {
      /* bỏ qua */
    }

    // Chạm vào là gọi bong bóng ra lại, phòng khi nó vừa tự thu đi.
    if (hasLines) openBubble();
  };

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex flex-col items-start gap-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <AnimatePresence>
        {showBubble && hasLines ? (
          <motion.div
            // Key CỐ ĐỊNH. AnimatePresence lo mỗi việc hiện ra và thu lại;
            // đổi key giữa chừng thì bong bóng cũ ở lại chờ chạy xong hoạt cảnh
            // biến đi trong khi bong bóng mới đã vào, hai cái xếp chồng nhau và
            // đội bố cục lên suốt một phần ba giây.
            key="bubble"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="paper relative ml-1 max-w-[13rem] rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-[0_10px_26px_-10px_rgba(0,0,0,0.7)] sm:max-w-[16rem]"
          >
            {/* Mỗi dòng gõ ở /customize là một dòng trong bong bóng, và tất cả
                hiện cùng lúc. Bản đầu cho chạm để lật sang câu tiếp — nghe thì
                hay, nhưng người viết gõ hai dòng nối nhau thành một ý lại chỉ
                thấy hiện một dòng, tưởng hỏng. */}
            <p className="font-accent text-ink/85 text-[0.82rem] leading-snug text-pretty sm:text-[0.92rem]">
              {lines.map((dong, i) => (
                <span key={i} className="block">
                  {dong}
                </span>
              ))}
            </p>
            {/* Đuôi bong bóng chỉ xuống phía con gấu. */}
            <span className="bg-paper absolute -bottom-1 left-3 size-3 rotate-45 rounded-[2px]" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* gap-2: đủ để đầu mũi tên dừng cách con gấu chừng 15px. Sát quá thì
          nét vẽ dính vào ảnh, nhìn như bị lỗi chứ không như đang chỉ. */}
      <div className="flex items-center gap-2">
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.86 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.75,
            delay: 0.9,
            ease: [0.34, 1.3, 0.64, 1],
          }}
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-3"
                  >
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
              aria-label={hasLines ? lines.join(". ") : "Teddie"}
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

        {/* Dòng nhắc chỉ vào gấu. Mũi tên đứng trước để nó nằm sát con gấu,
            chữ đẩy ra ngoài. */}
        <AnimatePresence>
          {showHint && tapHint.trim() ? (
            <motion.div
              key="taphint"
              aria-hidden
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-gold/75 flex items-center gap-1"
            >
              <CurlyArrowToBear />
              <p className="font-accent max-w-[9.5rem] text-[0.8rem] leading-snug text-balance sm:max-w-[12rem] sm:text-[0.9rem]">
                {tapHint}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
