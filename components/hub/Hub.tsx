"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import type { HubContent, HubKey } from "@/lib/content/schema";
import { fontVars } from "@/lib/theme";
import { Ambience } from "@/components/ui/Ambience";
import { WarmFlash } from "@/components/ui/WarmFlash";

const HREF: Record<HubKey, string> = {
  message: "/message",
  memories: "/memories",
  flowers: "/flowers",
};

/** Ba lựa chọn sau khi đã "chui" vào trong phong bì. */
export function Hub({ content }: { content: HubContent }) {
  return (
    <main
      style={fontVars(content.fonts)}
      className="vignette relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-[max(5rem,env(safe-area-inset-bottom))]"
    >
      <Ambience />

      {/* Bắt đầu ở trạng thái sáng rồi tan dần — nối liền vào cú loé
          lúc mở phong bì, nên mắt không thấy mối nối giữa hai trang. */}
      <WarmFlash show={false} fadeIn={false} duration={0.9} />

      <div className="relative z-10 w-full max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-cream mb-12 text-center text-[clamp(2rem,7vw,3.4rem)] leading-tight sm:mb-16"
        >
          {content.title}
        </motion.h1>

        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {content.options.map((option, i) => (
            <motion.li
              key={option.key}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: 0.55 + i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={HREF[option.key]}
                prefetch
                className="group focus-visible:ring-gold/60 flex flex-col items-center gap-4 rounded-3xl p-4 outline-none focus-visible:ring-2"
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="relative grid size-32 place-items-center sm:size-36"
                >
                  {/* Quầng sáng nở ra khi rê chuột / chạm. */}
                  <span className="bg-gold/0 group-hover:bg-gold/10 absolute inset-0 rounded-full blur-2xl transition-colors duration-500" />

                  {option.icon ? (
                    <Image
                      src={option.icon.url}
                      alt={option.icon.alt || option.label}
                      width={288}
                      height={288}
                      className="relative size-full object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                      priority={i === 0}
                    />
                  ) : (
                    <IconPlaceholder label={option.label} />
                  )}
                </motion.div>

                <span className="font-body text-cream/90 group-hover:text-gold text-[clamp(1.05rem,3.4vw,1.35rem)] tracking-wide transition-colors">
                  {option.label}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </main>
  );
}

/** Ô chờ icon: giữ đúng chỗ và đúng kích thước cho tới khi bạn tải icon thật lên. */
function IconPlaceholder({ label }: { label: string }) {
  return (
    <span className="border-mist/25 text-mist/45 relative grid size-full place-items-center gap-1 rounded-2xl border-2 border-dashed">
      <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
        <path
          d="m4 17 4.6-4.4a1.6 1.6 0 0 1 2.2 0L15 16.6m1.4-1.3a1.6 1.6 0 0 1 2.2 0L21 17.6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Chưa có icon cho {label}</span>
    </span>
  );
}
