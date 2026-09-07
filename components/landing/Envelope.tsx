"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Thời lượng bản rút gọn, dùng khi máy bật "giảm chuyển động". */
const REDUCED_EXIT = 0.5;

/**
 * Phong bì đóng, chạm vào thì bung sáp niêm phong, lật nắp, lá thư trồi lên
 * rồi phóng to nuốt trọn màn hình — cảm giác như đang chui vào bên trong.
 *
 * Toàn bộ vẽ bằng CSS nên nét ở mọi độ phân giải và đổi màu theo theme,
 * không phụ thuộc file ảnh nào.
 */
export function Envelope({
  monogram,
  onOpen,
  onFinished,
}: {
  /** Chữ khắc trên sáp niêm phong. */
  monogram: string;
  /** Chạy ngay trong cú chạm — chỗ duy nhất iOS cho phép bật nhạc.
   *  Cũng là lúc phía ngoài bật lớp loé sáng: lớp đó KHÔNG đặt được ở đây,
   *  vì phần tử cha có perspective nên "fixed" bám vào khung phong bì
   *  chứ không phải viewport (perspective tạo containing block cho fixed). */
  onOpen: () => void;
  /** Chạy khi animation kết thúc, để chuyển sang trang tiếp theo. */
  onFinished: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const reduced = useReducedMotion();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const t = (seconds: number) => seconds;

  function handleOpen() {
    if (opened) return;
    setOpened(true);
    onOpen();

    // Máy bật "giảm chuyển động" thì dùng hẳn một kịch bản khác: chỉ mờ dần
    // rồi sang trang. Trước đây tôi tua nhanh chính hoạt cảnh cũ gấp bảy lần
    // rồi chuyển trang ngay lập tức, nên nó bị cắt ngang giữa chừng — nhìn
    // như trang bị giật chứ không phải như một lựa chọn có chủ đích.
    if (reduced) {
      timerRef.current = window.setTimeout(onFinished, REDUCED_EXIT * 1000);
    }
  }

  return (
    <div
      className="relative w-full"
      style={{ perspective: "1400px", perspectiveOrigin: "50% 38%" }}
    >
      <motion.div
        className="gpu relative mx-auto w-[min(78vw,26rem)]"
        style={{ transformStyle: "preserve-3d" }}
        animate={
          opened
            ? reduced
              ? { opacity: 0 }
              : // Phóng tới 5 lần là đủ cảm giác "chui vào trong"; trước đây
                // để 7.5 nên máy tắt tăng tốc phần cứng phải dựng ảnh to gấp
                // rưỡi mà cuối cùng lớp loé sáng cũng che gần hết.
                { scale: [1, 0.96, 5], opacity: [1, 1, 0] }
            : { scale: 1, opacity: 1 }
        }
        transition={
          reduced
            ? { duration: REDUCED_EXIT * 0.8, ease: "easeOut" }
            : {
                duration: t(1.5),
                times: [0, 0.35, 1],
                delay: opened ? t(0.55) : 0,
                ease: [0.55, 0, 0.35, 1],
              }
        }
        onAnimationComplete={() => {
          // Bản rút gọn tự hẹn giờ riêng ở handleOpen.
          if (opened && !reduced) onFinished();
        }}
      >
        <button
          type="button"
          onClick={handleOpen}
          disabled={opened}
          aria-label="Mở phong bì"
          className="group relative block aspect-[1.5/1] w-full cursor-pointer disabled:cursor-default"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Bóng đổ mềm dưới đáy, cho phong bì có trọng lượng. */}
          <span className="absolute inset-x-6 -bottom-4 -z-10 h-8 rounded-[50%] bg-black/45 blur-xl" />

          {/* Thân sau — nền của cả phong bì. */}
          <span
            className="absolute inset-0 rounded-lg"
            style={{
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--c-paper) 92%, var(--c-ink)), color-mix(in srgb, var(--c-paper) 74%, var(--c-ink)))",
              boxShadow:
                "inset 0 0 40px color-mix(in srgb, var(--c-ink) 20%, transparent), 0 18px 40px -12px rgba(0,0,0,0.55)",
            }}
          />

          {/* Lá thư trồi lên khi nắp đã mở. */}
          <motion.span
            className="absolute inset-x-[7%] top-[7%] block h-[86%] origin-bottom rounded-md"
            style={{
              zIndex: 10,
              background:
                "linear-gradient(175deg, color-mix(in srgb, var(--c-paper) 96%, white), var(--c-paper))",
              boxShadow:
                "0 6px 18px color-mix(in srgb, var(--c-ink) 25%, transparent)",
            }}
            animate={
              opened && !reduced
                ? { y: "-34%", scale: 1.04 }
                : { y: "0%", scale: 1 }
            }
            transition={{
              duration: t(0.7),
              delay: t(0.45),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Vài dòng chữ gợi ý, mờ dần khi lá thư trồi lên. */}
            <motion.span
              className="absolute inset-x-[14%] top-[16%] block space-y-[0.45rem]"
              animate={{ opacity: opened && !reduced ? 0.9 : 0 }}
              transition={{ duration: t(0.4), delay: t(0.6) }}
            >
              {[100, 88, 94, 72].map((w, i) => (
                <span
                  key={i}
                  className="bg-ink/20 block h-[2px] rounded-full"
                  style={{ width: `${w}%` }}
                />
              ))}
            </motion.span>
          </motion.span>

          {/* Mặt trước với mép chữ V, che phần dưới lá thư. */}
          <span
            className="absolute inset-0"
            style={{
              zIndex: 20,
              clipPath: "polygon(0 4%, 50% 52%, 100% 4%, 100% 100%, 0 100%)",
              borderRadius: "0.5rem",
              background:
                "linear-gradient(200deg, color-mix(in srgb, var(--c-paper) 99%, white), color-mix(in srgb, var(--c-paper) 86%, var(--c-sage)))",
              // clip-path cắt mất box-shadow, nên dùng drop-shadow để mép V vẫn có bóng.
              filter: "drop-shadow(0 -3px 4px rgba(0,0,0,0.14))",
            }}
          />

          {/* Nắp phong bì — lật quanh cạnh trên. */}
          <motion.span
            className="absolute inset-x-0 top-0 block h-[52%] origin-top"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--c-paper) 97%, white), color-mix(in srgb, var(--c-paper) 80%, var(--c-sage)))",
              borderTopLeftRadius: "0.5rem",
              borderTopRightRadius: "0.5rem",
              transformStyle: "preserve-3d",
              filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.18))",
            }}
            animate={
              opened && !reduced
                ? { rotateX: -174, zIndex: [30, 30, 5] }
                : { rotateX: 0, zIndex: 30 }
            }
            transition={{
              duration: t(0.85),
              delay: t(0.22),
              times: [0, 0.45, 0.5],
              ease: [0.7, 0, 0.3, 1],
            }}
          />

          {/* Sáp niêm phong ở đỉnh chữ V — vỡ ra trước khi nắp lật. */}
          <motion.span
            className="absolute top-[52%] left-1/2 grid aspect-square w-[16%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{
              zIndex: 40,
              background:
                "radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--c-gold) 92%, white), color-mix(in srgb, var(--c-gold) 62%, var(--c-ink)))",
              boxShadow:
                "0 2px 8px color-mix(in srgb, var(--c-ink) 45%, transparent), inset 0 -2px 6px color-mix(in srgb, var(--c-ink) 30%, transparent)",
            }}
            animate={
              opened && !reduced
                ? {
                    scale: [1, 1.18, 0.2],
                    opacity: [1, 1, 0],
                    rotate: [0, -8, 16],
                  }
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{
              duration: t(0.4),
              times: [0, 0.35, 1],
              ease: "easeIn",
            }}
          >
            <span
              className="font-accent text-[calc(clamp(0.7rem,2.6vw,1.05rem)*var(--fz-accent,1))] leading-none"
              style={{
                color: "color-mix(in srgb, var(--c-ink) 55%, var(--c-gold))",
              }}
            >
              {monogram}
            </span>
          </motion.span>
        </button>
      </motion.div>
    </div>
  );
}
