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
import { PetalStorm } from "./PetalStorm";

/** Seed cố định cho lần dựng đầu, để máy chủ và trình duyệt ra cùng một bó. */
const FIRST_SEED = 20261102;

/** Sau ngần này giây mà chưa ai để ý thì dòng chữ bí mật sáng lên một chút. */
const HINT_AFTER_MS = 30_000;

type Phase = "bouquet" | "storm" | "finale";

export function FlowersScene({ content }: { content: FlowersContent }) {
  const [seed, setSeed] = useState(FIRST_SEED);
  const [phase, setPhase] = useState<Phase>("bouquet");
  const [hinting, setHinting] = useState(false);

  const bouquet = useMemo(() => generateBouquet(seed), [seed]);
  const paragraphs = toParagraphs(content.intro);

  useEffect(() => {
    if (phase !== "bouquet") return;
    const id = window.setTimeout(() => setHinting(true), HINT_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

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

            <div className="mt-14">
              <BackLink />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dòng chữ bí mật: nấp ở góc, phải để ý mới thấy. */}
      {phase === "bouquet" ? (
        <motion.button
          type="button"
          onClick={() => setPhase("storm")}
          initial={{ opacity: 0 }}
          animate={{ opacity: hinting ? [0.22, 0.55, 0.22] : 0.16 }}
          transition={
            hinting
              ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 2, delay: 1.5 }
          }
          whileHover={{ opacity: 1 }}
          className="text-cream font-accent hover:text-gold fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 p-2 text-[calc(clamp(0.7rem,2.4vw,0.85rem)*var(--fz-accent,1))] tracking-wide italic transition-colors sm:right-5 sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          {content.secretLabel}
        </motion.button>
      ) : null}

      <PetalStorm
        active={phase === "storm"}
        onDone={() => setPhase("finale")}
      />
    </main>
  );
}

function Finale({ content }: { content: FlowersContent }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center"
    >
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

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
        className="font-heading text-gold mt-10 text-center text-[calc(clamp(1.7rem,6.5vw,2.8rem)*var(--fz-heading,1))] leading-tight text-balance"
      >
        {content.finale.closing}
      </motion.p>

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
