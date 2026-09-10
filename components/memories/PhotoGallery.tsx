"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  ASPECT_CSS,
  ASPECT_VALUE,
  type ImageAsset,
} from "@/lib/content/schema";

/** Kéo ngang quá chừng này (px) thì tính là muốn lật sang tấm khác. */
const SWIPE_PX = 70;

function ArrowIcon({ back = false }: { back?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={back ? "size-5" : "size-5 rotate-180"}
      aria-hidden
    >
      <path d="M15 5.5 8.5 12l6.5 6.5" />
    </svg>
  );
}

function RoundButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`border-cream/25 bg-deep/70 text-cream/85 hover:border-gold/60 hover:text-gold focus-visible:ring-gold/60 grid size-11 place-items-center rounded-full border transition-colors outline-none focus-visible:ring-2 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

/**
 * Xem ảnh phóng to phủ kín màn hình, ghi chú nằm ngay dưới ảnh.
 *
 * Dựng qua portal ra thẳng <body>. Bắt buộc, không phải cho gọn: từng tấm ảnh
 * trên khối nằm trong một thẻ có `perspective`, mà perspective biến phần tử
 * cha thành containing block của `position: fixed` — để nguyên tại chỗ thì lớp
 * phủ co lại đúng bằng tấm ảnh 150px thay vì phủ cả màn hình.
 */
export function PhotoGallery({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: ImageAsset[];
  /** null = đang đóng. */
  index: number | null;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const open = index !== null;

  const step = useCallback(
    (delta: number) => {
      if (index === null || photos.length === 0) return;
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndex],
  );

  // Phím tắt quen tay: Esc để đóng, mũi tên để lật ảnh.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  // Khoá cuộn nền trong lúc xem ảnh, kẻo kéo ảnh lại làm trang phía sau trôi.
  useEffect(() => {
    if (!open) return;
    const truoc = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = truoc;
    };
  }, [open]);

  if (!mounted) return null;

  const photo = index === null ? null : photos[index];

  return createPortal(
    <AnimatePresence>
      {photo ? (
        <motion.div
          key="gallery"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh phóng to"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="bg-base/95 fixed inset-0 z-[80] flex flex-col"
        >
          {/* Bấm ra vùng trống là đóng. Nút phủ kín nền, ảnh nằm đè lên trên. */}
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="absolute inset-0 cursor-zoom-out"
          />

          <div className="pointer-events-none relative flex flex-1 flex-col items-center justify-center gap-5 px-4 py-[max(4.5rem,env(safe-area-inset-top))]">
            <GalleryPhoto
              photo={photo}
              onSwipe={step}
              // Key theo id để đổi ảnh là chạy lại hoạt cảnh vào.
              key={photo.id}
            />

            {photo.note?.trim() ? (
              <p className="font-accent text-cream/85 pointer-events-auto max-w-md text-center text-[calc(clamp(0.95rem,3.4vw,1.15rem)*var(--fz-accent,1))] leading-snug text-balance">
                {photo.note.trim()}
              </p>
            ) : null}

            {photos.length > 1 ? (
              <div className="pointer-events-auto flex items-center gap-5">
                <RoundButton label="Ảnh trước" onClick={() => step(-1)}>
                  <ArrowIcon back />
                </RoundButton>
                <span className="text-cream/55 text-xs tabular-nums">
                  {(index ?? 0) + 1} / {photos.length}
                </span>
                <RoundButton label="Ảnh sau" onClick={() => step(1)}>
                  <ArrowIcon />
                </RoundButton>
              </div>
            ) : null}
          </div>

          <div className="pointer-events-auto absolute top-0 right-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
            <RoundButton label="Đóng" onClick={onClose}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                className="size-5"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </RoundButton>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function GalleryPhoto({
  photo,
  onSwipe,
}: {
  photo: ImageAsset;
  onSwipe: (delta: number) => void;
}) {
  const reduced = useReducedMotion();
  const ratio = ASPECT_VALUE[photo.aspect];

  return (
    <motion.div
      className="pointer-events-auto relative shrink-0 overflow-hidden rounded-sm shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]"
      style={{
        // Chặn cả hai chiều: chặn mỗi bề ngang thì ảnh cao quá màn hình,
        // chặn mỗi chiều cao thì màn hẹp lại tràn ngang. Nhân với tỉ lệ khung
        // để quy chiều cao về bề ngang.
        width: `min(92vw, 44rem, calc(62vh * ${ratio}))`,
        aspectRatio: ASPECT_CSS[photo.aspect],
      }}
      initial={{ opacity: 0, scale: reduced ? 1 : 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduced ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_PX) onSwipe(1);
        else if (info.offset.x > SWIPE_PX) onSwipe(-1);
      }}
    >
      <Image
        src={photo.url}
        alt={photo.alt}
        fill
        sizes="(max-width: 768px) 92vw, 704px"
        quality={90}
        priority
        className="pointer-events-none object-cover select-none"
      />
    </motion.div>
  );
}
