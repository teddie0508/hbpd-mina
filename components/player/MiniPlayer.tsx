"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useAudio } from "@/components/providers/AudioProvider";
import { cx } from "@/lib/cx";

import {
  DiscIcon,
  ListIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  ShuffleIcon,
  VolumeIcon,
} from "./icons";

/**
 * Trình phát nhỏ ở góc trên bên phải.
 * Thu gọn: chỉ một nút tròn hình đĩa than, xoay khi đang phát.
 * Mở ra: tên bài + prev/play/next + âm lượng + danh sách bài.
 */
export function MiniPlayer() {
  const audio = useAudio();
  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Báo cho cả cây biết trình phát đã được mở ít nhất một lần. /hub dựa vào
  // đây để cất dòng nhắc "bấm vào đây đổi bài" đi.
  const { markPlayerOpened } = audio;
  useEffect(() => {
    if (open) markPlayerOpened();
  }, [open, markPlayerOpened]);

  // Bấm ra ngoài hoặc nhấn Esc thì thu gọn lại, tránh che mất nội dung.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setShowList(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowList(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (audio.tracks.length === 0) return null;

  const multi = audio.tracks.length > 1;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed top-0 right-0 z-50 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          // Làm mờ hậu cảnh chỉ bật từ màn hình vừa trở lên. Trên iPhone,
          // backdrop-filter buộc Safari lọc lại vùng sau trình phát mỗi lần
          // thứ nằm dưới nó thay đổi — mà trình phát thì nằm đè lên mọi trang,
          // kể cả lúc cánh hoa đang bay kín màn hình. Nền đục hơn một chút
          // cho kết quả gần như y hệt mà không tốn gì.
          className="border-gold/25 bg-deep/90 text-cream sm:bg-deep/70 flex items-center gap-1 overflow-hidden rounded-full border px-1 py-1 shadow-lg shadow-black/30 sm:backdrop-blur-md"
        >
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="controls"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                {multi ? (
                  <PlayerButton label="Bài trước" onClick={audio.prev}>
                    <PrevIcon />
                  </PlayerButton>
                ) : null}

                <div className="max-w-28 min-w-0 px-1 sm:max-w-44">
                  <p className="truncate text-[11px] leading-tight font-medium sm:text-xs">
                    {audio.current?.title ?? "—"}
                  </p>
                  {audio.current?.artist ? (
                    <p className="text-mist/70 truncate text-[10px] leading-tight">
                      {audio.current.artist}
                    </p>
                  ) : null}
                </div>

                {multi ? (
                  <PlayerButton label="Bài sau" onClick={audio.next}>
                    <NextIcon />
                  </PlayerButton>
                ) : null}

                <PlayerButton
                  label={audio.muted ? "Bật tiếng" : "Tắt tiếng"}
                  onClick={audio.toggleMute}
                >
                  <VolumeIcon muted={audio.muted} />
                </PlayerButton>

                {/* Thanh âm lượng chỉ hiện trên thiết bị có chuột; điện thoại đã có nút cứng. */}
                <input
                  type="range"
                  aria-label="Âm lượng"
                  min={0}
                  max={1}
                  step={0.01}
                  value={audio.muted ? 0 : audio.volume}
                  onChange={(e) => audio.setVolume(Number(e.target.value))}
                  className="accent-gold hidden h-1 w-16 cursor-pointer sm:block"
                />

                {multi ? (
                  <PlayerButton
                    label={audio.shuffle ? "Tắt xáo bài" : "Xáo bài"}
                    active={audio.shuffle}
                    onClick={() => audio.setShuffle(!audio.shuffle)}
                  >
                    <ShuffleIcon />
                  </PlayerButton>
                ) : null}

                {multi ? (
                  <PlayerButton
                    label="Danh sách bài"
                    active={showList}
                    onClick={() => setShowList((v) => !v)}
                  >
                    <ListIcon />
                  </PlayerButton>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <PlayerButton
            label={audio.playing ? "Tạm dừng" : "Phát"}
            onClick={() => {
              if (!open) setOpen(true);
              audio.toggle();
            }}
            solid
          >
            {audio.playing ? <PauseIcon /> : <PlayIcon />}
          </PlayerButton>

          <button
            type="button"
            aria-label={open ? "Thu gọn trình phát" : "Mở trình phát"}
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v);
              setShowList(false);
            }}
            className="text-gold hover:bg-gold/10 grid size-9 shrink-0 place-items-center rounded-full transition-colors"
          >
            <motion.span
              className="block size-5"
              animate={{ rotate: audio.playing ? 360 : 0 }}
              transition={
                audio.playing
                  ? { repeat: Infinity, ease: "linear", duration: 6 }
                  : { duration: 0.3 }
              }
            >
              <DiscIcon />
            </motion.span>
          </button>
        </motion.div>

        <AnimatePresence>
          {open && showList ? (
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="border-gold/25 bg-deep/95 sm:bg-deep/85 max-h-64 w-56 origin-top-right overflow-y-auto rounded-2xl border p-1.5 shadow-xl shadow-black/40 sm:backdrop-blur-md"
            >
              {audio.tracks.map((track, i) => (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => audio.select(i)}
                    className={cx(
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors",
                      i === audio.index
                        ? "bg-gold/15 text-gold"
                        : "text-cream/80 hover:bg-cream/5",
                    )}
                  >
                    <span className="w-4 shrink-0 text-center text-[10px] tabular-nums opacity-60">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{track.title}</span>
                      {track.artist ? (
                        <span className="block truncate text-[10px] opacity-60">
                          {track.artist}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlayerButton({
  label,
  onClick,
  children,
  solid = false,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  solid?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
        solid
          ? "bg-gold/90 text-deep hover:bg-gold"
          : active
            ? "bg-gold/20 text-gold"
            : "text-cream/75 hover:bg-cream/10 hover:text-cream",
      )}
    >
      <span className="block size-4">{children}</span>
    </button>
  );
}
