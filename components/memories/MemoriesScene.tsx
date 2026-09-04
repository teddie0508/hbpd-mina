"use client";

import { Ambience } from "@/components/ui/Ambience";
import { BackLink } from "@/components/ui/BackLink";
import { Reveal } from "@/components/ui/Reveal";
import type { MemoriesContent } from "@/lib/content/schema";
import { toParagraphs } from "@/lib/text";
import { fontVars } from "@/lib/theme";

import { Filmstrip } from "./Filmstrip";
import { MemoryBoard } from "./MemoryBoard";

export function MemoriesScene({ content }: { content: MemoriesContent }) {
  const paragraphs = toParagraphs(content.intro);

  return (
    <main
      style={fontVars(content.fonts)}
      className="vignette relative min-h-svh overflow-x-hidden px-5 pt-20 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-8"
    >
      <Ambience />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Reveal from="none" duration={1}>
          <h1 className="font-heading text-cream text-center text-[clamp(2rem,7.5vw,3.6rem)] leading-tight text-balance">
            {content.heading}
          </h1>
        </Reveal>

        {/* Mở đầu: dải phim nằm cạnh tấm thiệp giấy. */}
        <section className="mt-12 flex flex-col items-center gap-6 sm:mt-16 md:flex-row md:items-stretch md:gap-0">
          <Filmstrip photos={content.filmstrip} />

          <Reveal
            from="left"
            delay={0.15}
            className="paper relative z-0 w-full rounded-xl px-6 py-8 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.7)] sm:px-10 sm:py-12 md:-ml-10 md:py-16 md:pl-16"
          >
            <div className="measure mx-auto space-y-6">
              {paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="font-body text-ink/85 text-center text-[clamp(0.98rem,3.2vw,1.1rem)] leading-[1.8] text-pretty"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Các khối ảnh, mỗi khối một ảnh nền riêng. */}
        <div className="mt-16 space-y-10 sm:mt-24 sm:space-y-14">
          {content.boards.map((board) => (
            <MemoryBoard key={board.id} board={board} />
          ))}
        </div>

        <div className="mt-16 sm:mt-20">
          <BackLink />
        </div>
      </div>
    </main>
  );
}
