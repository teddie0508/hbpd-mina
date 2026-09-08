"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { Ambience } from "@/components/ui/Ambience";
import { BackLink } from "@/components/ui/BackLink";
import { Polaroid } from "@/components/ui/Polaroid";
import { generateBouquet, randomSeed } from "@/lib/bouquet";
import type { FlowersContent } from "@/lib/content/schema";
import { toParagraphs } from "@/lib/text";
import { fontVars } from "@/lib/theme";

import { Bouquet } from "./Bouquet";
import { PetalDrift } from "./PetalDrift";
import { PetalStorm } from "./PetalStorm";

/** Seed cố định cho lần dựng đầu, để máy chủ và trình duyệt ra cùng một bó. */
const FIRST_SEED = 20261102;

type Phase = "bouquet" | "storm" | "finale";

export function FlowersScene({ content }: { content: FlowersContent }) {
  const [seed, setSeed] = useState(FIRST_SEED);
  const [phase, setPhase] = useState<Phase>("bouquet");

  const bouquet = useMemo(() => generateBouquet(seed), [seed]);
  const paragraphs = toParagraphs(content.intro);

  return (
    <main
      style={fontVars(content.fonts, content.typography)}
      className="vignette relative min-h-svh overflow-hidden px-5 pt-20 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-8"
    >
      <Ambience />

      <AnimatePresence mode="wait">
        {phase === "finale" ? (
          <Finale key="finale" content={content} />
        ) : (
          <motion.div
            key="bouquet"
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: "easeIn" }}
            className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading text-cream text-center text-[calc(clamp(2rem,7vw,3.2rem)*var(--fz-heading,1))] leading-tight text-balance"
            >
              {content.heading}
            </motion.h1>

            <div className="measure mt-6 space-y-4">
              {paragraphs.map((paragraph, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.2 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="font-body text-cream/80 text-center text-[calc(clamp(0.95rem,3.2vw,1.08rem)*var(--fz-body,1))] leading-[1.8] text-pretty"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <div className="mt-8 flex w-full justify-center">
              <Bouquet bouquet={bouquet} />
            </div>

            <button
              type="button"
              onClick={() => setSeed(randomSeed())}
              className="group border-gold/30 text-cream/85 hover:border-gold/60 hover:text-gold focus-visible:ring-gold/60 mt-8 inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm tracking-wide transition-colors outline-none focus-visible:ring-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 transition-transform duration-500 group-hover:rotate-180"
                aria-hidden
              >
                <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
                <path d="M20 4v4.5h-4.5" />
                <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
                <path d="M4 20v-4.5h4.5" />
              </svg>
              {content.shuffleLabel}
            </button>

            {/* Nút bí mật đứng giữa hai nút kia. Trước đây nó nấp ở góc màn
                hình, mờ 16% — kín tới mức chính người làm ra cũng không thấy.
                Giờ vẫn khác hẳn hai nút còn lại để gợi tò mò, nhưng không còn
                phải đi tìm. */}
            <motion.button
              type="button"
              onClick={() => setPhase("storm")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group border-gold/60 bg-gold/10 text-gold hover:bg-gold/20 focus-visible:ring-gold/60 relative mt-4 inline-flex items-center gap-2.5 overflow-hidden rounded-full border px-6 py-3 text-[clamp(0.95rem,3.2vw,1.1rem)] tracking-wide italic shadow-[0_0_24px_-6px_var(--c-gold)] transition-colors outline-none focus-visible:ring-2"
            >
              {/* Vệt sáng quét ngang rất chậm, để mắt bắt được là có gì đó ở đây.
                  Chạy bằng `x` chứ không phải `left`: `left` là thuộc tính bố
                  cục, trình duyệt phải tính lại bố cục của nút ở MỌI khung hình,
                  lặp vô hạn suốt lúc màn hoa đang mở. `x` là phép biến hình,
                  card đồ hoạ lo trọn. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <motion.span
                  className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,transparent_38%,color-mix(in_srgb,var(--c-gold)_45%,transparent)_50%,transparent_62%)]"
                  // Độ nghiêng phải giao cho motion chứ không dùng class
                  // skew-x-*: motion ghi thẳng `transform` khi chạy `x`, ghi
                  // đè luôn transform của Tailwind và vệt sáng mất hẳn nét xiên.
                  style={{ skewX: -20 }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    repeatDelay: 3.4,
                    ease: "easeInOut",
                  }}
                />
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4 shrink-0"
                aria-hidden
              >
                <path d="M12 2.6c1.3 3 4 5.7 7 7-3 1.3-5.7 4-7 7-1.3-3-4-5.7-7-7 3-1.3 5.7-4 7-7Z" />
              </svg>
              {content.secretLabel}
            </motion.button>

            <div className="mt-10">
              <BackLink />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PetalStorm
        active={phase === "storm"}
        onDone={() => setPhase("finale")}
      />
    </main>
  );
}

/** Nhành lá nhỏ hai bên câu chúc, như vòng nguyệt quế thu gọn. */
function Sprig({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 60"
      aria-hidden
      className="text-gold/55 hidden h-16 w-6 shrink-0 sm:block"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M18 4 C 10 18, 8 38, 12 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {[10, 20, 30, 40].map((y, i) => (
        <ellipse
          key={i}
          cx={16 - i * 1.2}
          cy={y + 4}
          rx={5.5 - i * 0.4}
          ry={2.1}
          fill="currentColor"
          opacity={0.75}
          transform={`rotate(${-32 + i * 4} ${16 - i * 1.2} ${y + 4})`}
        />
      ))}
    </svg>
  );
}

function Finale({ content }: { content: FlowersContent }) {
  // Màn mưa hoa còn nhạt dần thêm gần hai giây nữa sau khi phần kết hiện ra.
  // Chờ nó tắt hẳn rồi mới thả lớp cánh hoa trôi, để không có lúc nào hai tấm
  // canvas phủ kín màn hình cùng tô một lượt.
  const [drifting, setDrifting] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setDrifting(true), 1800);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center"
    >
      {/* Cánh hoa còn sót lại trôi lác đác, nối tiếp màn mưa hoa vừa rồi. */}
      {drifting ? <PetalDrift /> : null}

      {/* Quầng sáng ấm sau tấm ảnh, để mắt dừng lại đúng chỗ đó.
          Trước đây quầng này là một khối 320 px kèm bộ lọc làm mờ 64 px, lại
          vừa phóng to dần — Safari phải dựng lại toàn bộ vết mờ ở từng khung
          hình, một trong những việc nặng nhất trên iOS. Giờ độ mềm nằm luôn
          trong các mốc màu của gradient: nhìn y hệt mà không còn bộ lọc nào. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--c-gold) 24%, transparent) 0%, color-mix(in srgb, var(--c-gold) 13%, transparent) 32%, color-mix(in srgb, var(--c-gold) 4%, transparent) 58%, transparent 78%)",
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.2, ease: "easeOut" }}
      />
      {content.finale.polaroid ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.86, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-[min(62vw,17rem)]"
        >
          <Polaroid
            image={content.finale.polaroid}
            rotate={-2.5}
            float
            priority
            sizes="(max-width: 640px) 62vw, 17rem"
          />
        </motion.div>
      ) : null}

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="font-body text-cream/85 measure mt-10 text-center text-[calc(clamp(1rem,3.4vw,1.15rem)*var(--fz-body,1))] leading-[1.85] text-pretty"
      >
        {content.finale.caption}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 flex items-center justify-center gap-4"
      >
        <Sprig />
        <p className="font-heading text-gold text-center text-[calc(clamp(1.7rem,6.5vw,2.8rem)*var(--fz-heading,1))] leading-tight text-balance">
          {content.finale.closing}
        </p>
        <Sprig flip />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.6 }}
        className="mt-14"
      >
        <BackLink />
      </motion.div>
    </motion.div>
  );
}
