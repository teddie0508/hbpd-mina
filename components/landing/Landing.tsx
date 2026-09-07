"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAudio } from "@/components/providers/AudioProvider";
import { Ambience } from "@/components/ui/Ambience";
import { WarmFlash } from "@/components/ui/WarmFlash";
import type { SiteContent } from "@/lib/content/schema";
import { fontVars } from "@/lib/theme";

import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";

export function Landing({
  content,
  lockedOnServer,
}: {
  content: SiteContent;
  /** Máy chủ đã tính sẵn còn khoá hay không, để lần dựng đầu không bị nhấp nháy. */
  lockedOnServer: boolean;
}) {
  const router = useRouter();
  const audio = useAudio();
  const reduced = useReducedMotion();
  const [locked, setLocked] = useState(lockedOnServer);
  const [opening, setOpening] = useState(false);

  const unlock = useCallback(() => setLocked(false), []);

  // Nạp sẵn /hub ngay từ lúc vào trang. Đợi tới lúc chạm mới nạp thì
  // mạng yếu sẽ hụt một nhịp ngay giữa chuyển cảnh.
  useEffect(() => {
    router.prefetch("/hub");
  }, [router]);

  const handleOpen = useCallback(() => {
    // Phải gọi ngay trong cú chạm, đây là lần duy nhất iOS cho phép bật nhạc.
    if (content.music.startOnEnvelopeOpen) audio.start();
    setOpening(true);
  }, [audio, content.music.startOnEnvelopeOpen]);

  const handleFinished = useCallback(() => router.push("/hub"), [router]);

  return (
    <main
      style={fontVars(content.landing.fonts, content.landing.typography)}
      className="vignette relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-[max(4rem,env(safe-area-inset-bottom))]"
    >
      <Ambience />

      <div className="relative z-10 w-full max-w-xl">
        <AnimatePresence mode="wait">
          {locked && content.countdown.revealAt ? (
            <motion.div key="countdown" exit={{ opacity: 0, y: -20 }}>
              <Countdown
                content={content.countdown}
                targetIso={content.countdown.revealAt}
                onUnlock={unlock}
              />
            </motion.div>
          ) : (
            <motion.div
              key="envelope"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <h1 className="font-heading text-cream text-[calc(clamp(2.2rem,9vw,4.5rem)*var(--fz-heading,1))] leading-[1.15] text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                {content.landing.headline}
              </h1>

              <Envelope
                monogram={content.recipientName.slice(0, 1).toUpperCase()}
                onOpen={handleOpen}
                onFinished={handleFinished}
              />

              <motion.p
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="font-accent text-cream/85 text-[calc(clamp(0.95rem,3.4vw,1.25rem)*var(--fz-accent,1))]"
              >
                {content.landing.subline}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Portal ra <body>: đặt trong phong bì thì bị perspective giam lại,
          chỉ phủ đúng khung phong bì thay vì cả màn hình. */}
      <WarmFlash
        show={opening}
        duration={reduced ? 0.3 : 0.95}
        delay={reduced ? 0.05 : 0.55}
      />
    </main>
  );
}
