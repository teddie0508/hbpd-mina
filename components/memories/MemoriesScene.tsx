"use client";

import { motion } from "motion/react";

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
      style={fontVars(content.fonts, content.typography)}
      className="vignette relative min-h-svh overflow-x-hidden px-5 pt-20 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-8"
    >
      <Ambience />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Reveal from="none" duration={1}>
          <h1 className="font-heading text-cream text-center text-[calc(clamp(2rem,7.5vw,3.6rem)*var(--fz-heading,1))] leading-tight text-balance">
            {content.heading}
          </h1>
        </Reveal>

        {/* Mở đầu: dải phim nằm cạnh tấm thiệp giấy. */}
        <section className="mt-12 flex flex-col items-center gap-6 sm:mt-16 md:flex-row md:items-stretch md:gap-0">
          <Filmstrip photos={content.filmstrip} />

          <Reveal
            from="none"
            delay={0.15}
            className="paper relative z-0 w-full rounded-xl px-6 py-8 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.7)] sm:px-10 sm:py-12 md:-ml-10 md:py-16 md:pl-16"
          >
            <div className="measure mx-auto space-y-6">
              {paragraphs.map((paragraph, i) => (
                // Đoạn lẻ trượt vào từ trái, đoạn chẵn từ phải, so le nhau.
                // Quãng đường dài và tiết chậm để chữ trôi vào chứ không giật.
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -56 : 56 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 1.1,
                    delay: 0.35 + i * 0.22,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-body text-ink/85 text-center text-[calc(clamp(0.98rem,3.2vw,1.1rem)*var(--fz-body,1))] leading-[1.8] text-pretty"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </Reveal>
        </section>
      </div>

      {/* Khối ảnh cố ý rộng hơn phần chữ.
          Ảnh rải trên khối chỉ chiếm 12–17% bề ngang khối, nên bề ngang khối
          là thứ quyết định từng tấm to hay nhỏ — kẹp chung max-w-5xl với phần
          chữ thì mỗi tấm chỉ còn khoảng 150px, ảnh chụp màn hình tin nhắn đọc
          không nổi. Phần chữ vẫn giữ nguyên bề ngang cũ cho dễ đọc. */}
      <div className="relative z-10 mx-auto mt-16 w-full max-w-5xl space-y-10 sm:mt-24 sm:space-y-14 lg:max-w-6xl xl:max-w-[84rem]">
        {content.boards.map((board) => (
          <MemoryBoard key={board.id} board={board} />
        ))}
      </div>

      <div className="relative z-10 mx-auto mt-16 w-full max-w-5xl sm:mt-20">
        <BackLink />
      </div>
    </main>
  );
}
