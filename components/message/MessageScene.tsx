"use client";

import { motion } from "motion/react";

import { Ambience } from "@/components/ui/Ambience";
import { BackLink } from "@/components/ui/BackLink";
import { HeartBalloons } from "@/components/ui/HeartBalloons";
import { Reveal } from "@/components/ui/Reveal";
import type { MessageContent } from "@/lib/content/schema";
import { fontVars } from "@/lib/theme";
import { toParagraphs } from "@/lib/text";

import { PolaroidFan } from "./PolaroidFan";

export function MessageScene({ content }: { content: MessageContent }) {
  const paragraphs = toParagraphs(content.body);

  return (
    <main
      style={fontVars(content.fonts)}
      className="vignette relative min-h-svh overflow-x-hidden px-5 pt-20 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-8"
    >
      <Ambience />

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        {/* Ảnh mở đầu, kèm bóng bay trôi hai bên. */}
        <section className="relative pb-4">
          <HeartBalloons />
          <PolaroidFan photos={content.photos} />
        </section>

        <Reveal delay={0.15} className="mt-14 text-center sm:mt-20">
          <h1 className="font-heading text-cream text-[clamp(1.9rem,6.5vw,3.2rem)] leading-[1.25] text-balance">
            {content.heading}
          </h1>
        </Reveal>

        <Flourish />

        <div className="measure mx-auto mt-10 space-y-7 sm:mt-12">
          {paragraphs.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.06} amount={0.15}>
              <p className="font-body text-cream/85 text-center text-[clamp(1rem,3.4vw,1.15rem)] leading-[1.85] text-pretty">
                {paragraph}
              </p>
            </Reveal>
          ))}
        </div>

        {content.signature ? (
          <Reveal delay={0.1} className="mt-12 text-center">
            <p className="font-accent text-gold/90 text-[clamp(1.1rem,4vw,1.6rem)]">
              {content.signature}
            </p>
          </Reveal>
        ) : null}

        <div className="mt-16 sm:mt-20">
          <BackLink />
        </div>
      </div>
    </main>
  );
}

/** Hoa văn ngăn giữa tiêu đề và phần chữ. */
function Flourish() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scaleX: 0.3 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-8 flex w-40 items-center gap-2"
    >
      <span className="via-gold/45 h-px flex-1 bg-gradient-to-r from-transparent to-transparent" />
      <svg
        viewBox="0 0 24 24"
        className="text-gold/60 size-3.5 shrink-0"
        aria-hidden
      >
        <path
          d="M12 3.5c1.6 3.6 4.9 6.9 8.5 8.5-3.6 1.6-6.9 4.9-8.5 8.5-1.6-3.6-4.9-6.9-8.5-8.5 3.6-1.6 6.9-4.9 8.5-8.5Z"
          fill="currentColor"
        />
      </svg>
      <span className="via-gold/45 h-px flex-1 bg-gradient-to-r from-transparent to-transparent" />
    </motion.div>
  );
}
