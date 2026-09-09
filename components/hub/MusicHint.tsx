"use client";

import { AnimatePresence, motion } from "motion/react";

import { useAudio } from "@/components/providers/AudioProvider";

/**
 * Nét vẽ tay uốn lượn, đi từ dòng chữ lên phía trình phát nhạc.
 *
 * Đầu mũi tên đặt bằng tay chứ không dùng `marker`, và hướng của nó phải khớp
 * với tiếp tuyến của khúc cong cuối: P3 − P2 = (25, 5) − (31, 15) = (−6, −10),
 * tức chếch lên bên trái chừng 59°. Bản đầu tiên vẽ đường cong chỉ lên bên
 * PHẢI, trong khi trình phát nằm lên bên trái — mũi tên chỉ ra ngoài mép màn
 * hình. Đổi số ở đây thì phải tính lại hai vạch của đầu mũi tên theo.
 */
function CurlyArrow() {
  return (
    <svg
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="note-nudge h-14 w-11 shrink-0"
      aria-hidden
    >
      <path d="M8 60 C 24 59, 30 48, 20 41 C 10 34, 22 26, 32 24 C 38 22, 31 15, 25 5" />
      <path d="M32.1 8.6 L 25 5 L 24.9 13" />
    </svg>
  );
}

/**
 * Dòng nhắc chỉ vào trình phát nhạc, chỉ có ở /hub.
 *
 * Tự biến mất ngay khi trình phát được mở lần đầu — đã biết chỗ rồi thì không
 * cần ai chỉ nữa. `pointer-events-none` để nó không bao giờ ăn mất cú chạm
 * của trình phát nằm ngay bên trên.
 */
export function MusicHint({ text }: { text: string }) {
  const audio = useAudio();

  const show =
    Boolean(text.trim()) && audio.tracks.length > 0 && !audio.playerOpened;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="hint"
          aria-hidden
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{
            duration: 0.7,
            delay: 1.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          // Neo vào đúng góc trình phát, chừa sẵn chiều cao của nó ở trên.
          className="text-gold/75 pointer-events-none fixed top-0 right-0 z-40 flex items-start gap-1.5 pt-[calc(env(safe-area-inset-top)+4.2rem)] pr-3 sm:pr-4"
        >
          <p className="font-accent max-w-[10.5rem] pt-5 text-right text-[0.8rem] leading-snug text-balance sm:max-w-[13rem] sm:text-[0.9rem]">
            {text}
          </p>
          <CurlyArrow />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
