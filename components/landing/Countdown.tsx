"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { CountdownContent } from "@/lib/content/schema";
import {
  googleCalendarUrl,
  reminderDetails,
  reminderTimes,
} from "@/lib/reminder";
import { fontVars } from "@/lib/theme";

/** Bao nhiêu giây cuối thì chuyển sang con số lớn giữa màn hình. */
const FINAL_SECONDS = 10;
/** "Đến giờ rồi." đứng một nhịp bấy lâu rồi mới nhường chỗ cho phong bì. */
const NOTE_MS = 2200;
/** Còn chừng này thì xin giữ màn hình sáng. */
const WAKE_LOCK_MS = 3 * 60 * 1000;

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function split(ms: number): Remaining {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

/**
 * Màn hình chờ trước ngày mở. Đúng thời khắc thì tự mở, không cần tải lại.
 *
 * Ba giai đoạn:
 *  1. bình thường — bốn ô ngày/giờ/phút/giây, kèm nút nhắc lịch
 *  2. 10 giây cuối — một con số lớn giữa màn hình, mỗi giây nảy một nhịp
 *  3. về 0 — `unlockedNote` đứng một nhịp, rồi mới ra phong bì
 */
export function Countdown({
  content,
  targetIso,
  serverNow,
  onZero,
  onUnlock,
}: {
  content: CountdownContent;
  targetIso: string;
  /**
   * Giờ của máy chủ lúc dựng trang, tính bằng ms.
   *
   * Đếm theo đồng hồ của điện thoại thì lệch: điện thoại nhanh 30 giây là
   * đồng hồ về 0 trước máy chủ 30 giây — phong bì hiện ra, Mina nhập tên, rồi
   * bị cổng khoá trên máy chủ đá ngược về màn đếm ngược; màn này lại thấy
   * 00:00 nên lại mở phong bì... cứ thế giật qua giật lại đúng vào khoảnh khắc
   * quan trọng nhất. Đếm theo giờ máy chủ thì hai bên luôn cùng một nhịp.
   */
  serverNow: number;
  /**
   * Đúng lúc về 0. Trang bìa dùng để xin lại dữ liệu từ máy chủ (danh sách
   * nhạc) NGAY, trong lúc dòng "Đến giờ rồi." còn đang hiện — tới lúc phong
   * bì ra thì nhạc đã sẵn sàng.
   */
  onZero: () => void;
  /** Sau nhịp dừng ở 0: chuyển sang phong bì. */
  onUnlock: () => void;
}) {
  const reduced = useReducedMotion();
  const target = new Date(targetIso).getTime();
  const final = content.finalCountdown;
  // Đồng hồ chỉ chạy sau khi mount, tránh lệch giữa HTML dựng ở máy chủ và trình duyệt.
  const [msLeft, setMsLeft] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");

  const zeroRef = useRef(onZero);
  zeroRef.current = onZero;
  const unlockRef = useRef(onUnlock);
  unlockRef.current = onUnlock;
  // Để trong ref chứ không trong effect: về 0 là trang bìa xin lại dữ liệu từ
  // máy chủ, `serverNow` đổi, effect chạy lại — biến cục bộ trong effect mà
  // mất thì lại báo "về 0" lần nữa và hẹn giờ mở phong bì bị huỷ giữa chừng.
  const lechRef = useRef<number | null>(null);
  const daVe0 = useRef(false);
  const henMo = useRef<number | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    // Độ lệch đo một lần lúc trang vừa lên. Số đo này luôn chậm hơn giờ máy
    // chủ thật một khoảng bằng thời gian tải trang, nên đồng hồ về 0 muộn hơn
    // một chút chứ không bao giờ sớm hơn — đúng chiều an toàn.
    lechRef.current ??= serverNow - Date.now();

    const tick = () => {
      const left = target - (Date.now() + (lechRef.current ?? 0));
      setMsLeft(left);
      if (left <= 0 && !daVe0.current) {
        daVe0.current = true;
        zeroRef.current();
        henMo.current = window.setTimeout(
          () => unlockRef.current(),
          final ? NOTE_MS : 0,
        );
      }
    };
    tick();
    // 250ms chứ không 1000ms: ở 10 giây cuối, con số phải đổi đúng nhịp giây.
    // Hẹn 1000ms mà lệch pha với mốc giây thì có số đứng gần 2 giây, có số
    // chỉ lướt qua.
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [target, serverNow, final]);

  useEffect(
    () => () => {
      if (henMo.current !== null) window.clearTimeout(henMo.current);
    },
    [],
  );

  // Mấy phút cuối xin giữ màn hình sáng. iPhone mặc định tự khoá sau 30 giây
  // không chạm, đúng kiểu Mina mở trang lúc 23:59 rồi ngồi chờ — màn hình tắt
  // ngay trước 10 giây cuối. Máy không hỗ trợ thì thôi, không báo gì.
  const giuSang = msLeft !== null && msLeft > 0 && msLeft <= WAKE_LOCK_MS;
  useEffect(() => {
    if (!giuSang || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let xong = false;
    const xin = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (xong) void l.release();
          else lock = l;
        })
        .catch(() => {});
    };
    xin();
    // Chuyển app rồi quay lại là mất khoá, phải xin lại.
    document.addEventListener("visibilitychange", xin);
    return () => {
      xong = true;
      document.removeEventListener("visibilitychange", xin);
      void lock?.release().catch(() => {});
    };
  }, [giuSang]);

  const phase =
    msLeft === null
      ? "normal"
      : msLeft <= 0
        ? final
          ? "zero"
          : "normal"
        : final && msLeft <= FINAL_SECONDS * 1000
          ? "final"
          : "normal";

  const left = split(msLeft ?? 0);
  const units: Array<{ value: number; label: string; pulse?: boolean }> = [
    { value: left.days, label: "ngày" },
    { value: left.hours, label: "giờ" },
    { value: left.minutes, label: "phút" },
    // Chỉ ô giây nảy. Cho cả bốn ô cùng nảy thì thành giật, không ra nhịp thở.
    { value: left.seconds, label: "giây", pulse: true },
  ];

  const { reminder } = content;
  const showReminder =
    reminder.enabled &&
    origin !== "" &&
    msLeft !== null &&
    msLeft > reminder.leadMinutes * 60 * 1000;
  const times = reminderTimes(targetIso, reminder.leadMinutes);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={fontVars(content.fonts, content.typography)}
      className="flex flex-col items-center gap-8 text-center"
    >
      <motion.div
        className="space-y-3"
        // Về 0 thì tiêu đề lùi lại, nhường sân khấu cho dòng "Đến giờ rồi."
        animate={{ opacity: phase === "zero" ? 0.3 : 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-heading text-cream text-[calc(clamp(2rem,7vw,3.5rem)*var(--fz-heading,1))] leading-tight">
          {content.title}
        </h1>
        <p className="font-body text-mist/80 measure mx-auto text-[calc(clamp(0.9rem,2.6vw,1.05rem)*var(--fz-body,1))]">
          {content.subtitle}
        </p>
      </motion.div>

      {/* Chiều cao tối thiểu chung cho cả ba giai đoạn, để lúc đổi giai đoạn
          tiêu đề phía trên không bị giật lên giật xuống. */}
      <div className="flex min-h-[15rem] w-full flex-col items-center justify-center gap-8">
        {phase === "final" ? (
          <FinalNumber
            value={Math.ceil((msLeft ?? 0) / 1000)}
            reduced={Boolean(reduced)}
          />
        ) : phase === "zero" ? (
          <motion.p
            role="status"
            initial={reduced ? false : { opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-gold text-[calc(clamp(2.6rem,12vw,4.5rem)*var(--fz-heading,1))] leading-tight text-balance"
            style={{
              textShadow:
                "0 0 36px color-mix(in srgb, var(--c-gold) 40%, transparent)",
            }}
          >
            {content.unlockedNote}
          </motion.p>
        ) : (
          <>
            <div
              className="flex items-start gap-2 sm:gap-4"
              role="timer"
              aria-live="off"
              aria-label="Thời gian còn lại"
            >
              {units.map((unit, i) => (
                <div
                  key={unit.label}
                  className="flex items-start gap-2 sm:gap-4"
                >
                  {i > 0 ? (
                    <span className="font-body text-gold/35 pt-1 text-[calc(clamp(1.6rem,5vw,2.4rem)*var(--fz-body,1))] leading-none">
                      :
                    </span>
                  ) : null}
                  <div className="flex flex-col items-center gap-1">
                    {/* Ô giây nảy một nhịp mỗi lần đổi số, cho đồng hồ có hơi thở.
                        Đổi key theo giá trị nên motion dựng lại và chạy initial. */}
                    <motion.span
                      key={unit.pulse ? unit.value : undefined}
                      initial={unit.pulse ? { scale: 1.12 } : false}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 15,
                      }}
                      className="font-body border-gold/20 bg-deep/50 text-gold grid min-w-[2.6em] place-items-center rounded-xl border px-2 py-2 text-[calc(clamp(1.6rem,6vw,2.8rem)*var(--fz-body,1))] leading-none tabular-nums"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {msLeft === null
                        ? "--"
                        : String(unit.value).padStart(2, "0")}
                    </motion.span>
                    <span className="font-body text-mist/60 text-[calc(0.65rem*var(--fz-body,1))] tracking-[0.18em] uppercase">
                      {unit.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Phong bì khoá: gợi ý có thứ gì đó đang đợi mà chưa mở được.
                Lơ lửng bằng CSS, không bằng motion — vòng lặp vô hạn. */}
            <div
              aria-hidden
              className="drift-y relative h-16 w-24 opacity-40"
              style={
                {
                  "--float-y": "-6px",
                  "--float-dur": "4.5s",
                } as React.CSSProperties
              }
            >
              <svg viewBox="0 0 96 64" fill="none" className="size-full">
                <rect
                  x="2"
                  y="2"
                  width="92"
                  height="60"
                  rx="6"
                  stroke="color-mix(in srgb, var(--c-mist) 40%, transparent)"
                  strokeWidth="2"
                />
                {/* Nắp thư: một đường gấp khúc, không phải hình bị cắt. */}
                <path
                  d="M2 8 L48 40 L94 8"
                  stroke="color-mix(in srgb, var(--c-mist) 40%, transparent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="48"
                  cy="36"
                  r="6"
                  fill="color-mix(in srgb, var(--c-gold) 50%, transparent)"
                />
              </svg>
            </div>

            {showReminder ? (
              <div className="flex flex-col items-center gap-2">
                {/* Thẻ <a> thường, không `download`: Safari trên iPhone mở tệp
                    lịch thành bảng "Thêm vào Lịch"; gắn `download` thì nó
                    lặng lẽ lưu vào Tệp, chẳng ai thấy. */}
                <a
                  href="/api/reminder"
                  className="font-body border-gold/35 text-gold/90 hover:border-gold/70 hover:text-gold focus-visible:ring-gold/50 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[calc(0.9rem*var(--fz-body,1))] tracking-wide transition-colors outline-none focus-visible:ring-2"
                >
                  <BellIcon />
                  {reminder.label}
                </a>
                <a
                  href={googleCalendarUrl({
                    title: reminder.eventTitle,
                    start: times.start,
                    end: times.end,
                    details: reminderDetails(`${origin}/`),
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-mist/50 hover:text-mist/80 text-[11px] underline decoration-dotted underline-offset-4 transition-colors"
                >
                  hoặc thêm vào Google Calendar
                </a>
              </div>
            ) : null}
          </>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Con số lớn của 10 giây cuối.
 *
 * Mỗi giây: số mới phóng từ to về đúng cỡ, kèm một vòng sáng loang ra rồi tan.
 * Cả hai đều chạy MỘT lần theo key của con số, không có vòng lặp vô hạn nào.
 */
function FinalNumber({ value, reduced }: { value: number; reduced: boolean }) {
  return (
    <div
      role="timer"
      aria-label={`Còn ${value} giây`}
      className="relative grid size-[clamp(11rem,52vw,15rem)] place-items-center"
    >
      <span
        aria-hidden
        className="border-gold/15 absolute inset-[6%] rounded-full border"
      />
      {reduced ? null : (
        <span
          key={`vong-${value}`}
          aria-hidden
          className="final-ring border-gold/60 absolute inset-[6%] rounded-full border-2"
        />
      )}
      <motion.span
        key={value}
        initial={reduced ? false : { scale: 1.45, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="font-heading text-gold relative text-[calc(clamp(5.5rem,30vw,9.5rem)*var(--fz-heading,1))] leading-none tabular-nums"
        style={{
          textShadow:
            "0 0 32px color-mix(in srgb, var(--c-gold) 45%, transparent)",
        }}
      >
        {value}
      </motion.span>
    </div>
  );
}
