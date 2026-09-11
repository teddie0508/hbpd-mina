"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAudio } from "@/components/providers/AudioProvider";
import { Teddie } from "@/components/teddie/Teddie";
import { Ambience } from "@/components/ui/Ambience";
import { WarmFlash } from "@/components/ui/WarmFlash";
import type { LandingData, WaitingTeddiePick } from "@/lib/content/schema";
import { noteOnce } from "@/lib/moments";
import { fontVars } from "@/lib/theme";

import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { NameGate } from "./NameGate";

export function Landing({
  data,
  lockedOnServer,
  askNameOnServer,
  serverNow,
  teddie,
}: {
  /** Chỉ những trường trang bìa cần — xem `forLanding` trong schema.ts. */
  data: LandingData;
  /** Máy chủ đã tính sẵn còn khoá hay không, để lần dựng đầu không bị nhấp nháy. */
  lockedOnServer: boolean;
  /** Chạm phong bì xong còn phải hỏi tên nữa không. */
  askNameOnServer: boolean;
  /** Giờ máy chủ lúc dựng trang, để đồng hồ đếm ngược không lệch theo điện thoại. */
  serverNow: number;
  /** Gấu ở màn đếm ngược, máy chủ đã bốc sẵn ảnh và câu. null = không có. */
  teddie: WaitingTeddiePick | null;
}) {
  const router = useRouter();
  const audio = useAudio();
  const reduced = useReducedMotion();
  const [locked, setLocked] = useState(lockedOnServer);
  const [opening, setOpening] = useState(false);
  const [needName, setNeedName] = useState(askNameOnServer);
  const [asking, setAsking] = useState(false);
  const daLamMoi = useRef(false);
  // Chờ nhạc có giới hạn: mạng rớt đúng lúc hết đếm ngược thì router.refresh()
  // không bao giờ về, và phong bì không được phép khoá cứng vì chuyện đó.
  const [hetChoNhac, setHetChoNhac] = useState(false);

  const unlock = useCallback(() => {
    setLocked(false);
    // Lúc trang còn khoá, máy chủ cố ý KHÔNG gửi danh sách nhạc xuống (xem
    // app/(experience)/layout.tsx). Tới giờ mở thì xin lại dữ liệu từ máy chủ
    // — lúc này máy chủ đã thấy hết khoá nên gửi đủ. Chỉ gọi đúng một lần.
    if (!daLamMoi.current) {
      daLamMoi.current = true;
      router.refresh();
      window.setTimeout(() => setHetChoNhac(true), 5000);
    }
  }, [router]);

  // Nạp sẵn /hub ngay từ lúc vào trang. Đợi tới lúc chạm mới nạp thì
  // mạng yếu sẽ hụt một nhịp ngay giữa chuyển cảnh.
  useEffect(() => {
    router.prefetch("/hub");
  }, [router]);

  // Có nhạc, nhưng danh sách bài chưa về: vừa hết đếm ngược và router.refresh()
  // đang chạy. Chạm phong bì lúc này thì audio.start() không có bài nào để
  // phát, mà cơ hội bật nhạc hợp lệ trên iOS chỉ có đúng cú chạm đó — lỡ là
  // mất. Phong bì mất gần một giây để hiện ra, nhạc về kịp trước khi kịp chạm.
  const choNhac =
    data.startOnEnvelopeOpen &&
    data.hasMusic &&
    audio.tracks.length === 0 &&
    !hetChoNhac;

  const handleRequestOpen = useCallback(() => {
    if (choNhac) return;

    // Nhạc phải bật NGAY ở đây, kể cả khi còn phải hỏi tên.
    //
    // iOS chỉ cho phát tiếng từ bên trong một cử chỉ thật của người dùng, mà
    // "bên trong" tính rất chặt: bấm nút trong panel rồi đợi máy chủ trả lời
    // là đã qua một lượt await, cử chỉ hết hiệu lực và nhạc sẽ câm. Nên cứ
    // bật từ cú chạm phong bì — nhạc chạy nền trong lúc cô ấy gõ tên cũng
    // hợp cảnh.
    if (data.startOnEnvelopeOpen) audio.start();

    if (needName) {
      setAsking(true);
      return;
    }
    setOpening(true);
  }, [audio, choNhac, data.startOnEnvelopeOpen, needName]);

  // Trả lời đúng: đóng panel rồi mở phong bì luôn, không bắt chạm lại lần nữa.
  const handlePassed = useCallback(() => {
    setNeedName(false);
    setAsking(false);
    setOpening(true);
  }, []);

  const handleFinished = useCallback(() => router.push("/hub"), [router]);

  // Nhật ký: phong bì bắt đầu mở — dù đi qua lớp hỏi tên hay không.
  useEffect(() => {
    if (opening) noteOnce("opened");
  }, [opening]);

  return (
    <main
      style={fontVars(data.landing.fonts, data.landing.typography)}
      className="vignette relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-[max(4rem,env(safe-area-inset-bottom))]"
    >
      <Ambience />

      <div className="relative z-10 w-full max-w-xl">
        <AnimatePresence mode="wait">
          {locked && data.countdown.revealAt ? (
            <motion.div key="countdown" exit={{ opacity: 0, y: -20 }}>
              <Countdown
                content={data.countdown}
                targetIso={data.countdown.revealAt}
                serverNow={serverNow}
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
                {data.landing.headline}
              </h1>

              <Envelope
                monogram={data.recipientName.slice(0, 1).toUpperCase()}
                opened={opening}
                onRequestOpen={handleRequestOpen}
                onFinished={handleFinished}
              />

              {/* Nhịp thở bằng CSS, không bằng motion: vòng lặp vô hạn. */}
              <p className="breathe-opacity font-accent text-cream/85 text-[calc(clamp(0.95rem,3.4vw,1.25rem)*var(--fz-accent,1))]">
                {data.landing.subline}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NameGate
        config={data.landing.passphrase}
        open={asking}
        onPassed={handlePassed}
        onDismiss={() => setAsking(false)}
      />

      {/* Gấu chỉ đứng ở màn đếm ngược. Hết giờ thì `locked` về false ngay
          trên trình duyệt và gấu lui đi, nhường chỗ cho phong bì. */}
      {locked && data.countdown.revealAt && teddie ? (
        <Teddie
          spot={teddie.spot}
          fonts={teddie.fonts}
          typography={teddie.typography}
          tapHint={teddie.tapHint}
        />
      ) : null}

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
