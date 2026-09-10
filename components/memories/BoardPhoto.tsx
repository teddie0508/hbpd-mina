"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { ASPECT_CSS, type ImageAsset } from "@/lib/content/schema";

/** Lật xem mặt sau bao lâu thì tự úp lại. Đủ để đọc một dòng ghi chú ngắn. */
const FLIP_BACK_MS = 3000;

/**
 * Một tấm ảnh trên khối kỷ niệm.
 *
 * Chia làm bốn lớp riêng biệt, cố ý không gộp:
 *  - lớp ngoài cùng (do khối cha dựng) lo vị trí bằng class Tailwind
 *  - lớp hiện dần, có delay so le giữa các tấm
 *  - lớp nghiêng theo con trỏ và phóng khi rê chuột, KHÔNG delay
 *  - lớp trong cùng lo lật mặt sau
 *
 * Hai lý do phải tách:
 *  - `motion` ghi thẳng `transform` vào style, gộp lại là cái sau xoá cái trước.
 *  - `transition` áp cho MỌI chuyển động của cùng một phần tử. Gộp lớp hiện
 *    dần với lớp hover thì cái delay so le lúc vào trang dính luôn vào hover:
 *    rê chuột vào tấm cuối phải đợi hơn nửa giây nó mới chịu phóng.
 */
export function BoardPhoto({
  photo,
  rotate,
  delay,
  tiltX,
  tiltY,
}: {
  photo: ImageAsset;
  /** Độ nghiêng cố định của tấm ảnh, tính bằng độ. */
  rotate: number;
  delay: number;
  /** Con trỏ đang lệch bao nhiêu so với tâm khối, khoảng -1 đến 1. */
  tiltX: number;
  tiltY: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const reduced = useReducedMotion();

  const note = photo.note?.trim();
  const canFlip = Boolean(note);

  // Đọc xong dòng ghi chú thì tự úp lại, khỏi phải bấm lần nữa.
  //
  // Hẹn giờ gắn vào chính trạng thái đang lật, không gắn vào cú bấm: bấm lật
  // lại bằng tay giữa chừng thì effect dọn luôn cái hẹn giờ cũ, không còn cái
  // nào lơ lửng để lát nữa úp nhầm tấm đang mở.
  useEffect(() => {
    if (!flipped) return;
    const id = window.setTimeout(() => setFlipped(false), FLIP_BACK_MS);
    return () => window.clearTimeout(id);
  }, [flipped]);

  return (
    <motion.div
      className="gpu"
      style={{ perspective: 700 }}
      initial={{ opacity: 0, scale: 0.82, rotate }}
      whileInView={{ opacity: 1, scale: 1, rotate }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        // Nghiêng nhẹ theo con trỏ. Mỗi tấm lệch một chút theo độ nghiêng sẵn
        // có của nó, để cả khối chuyển động không đều tăm tắp như một mảng.
        animate={{
          rotateY: reduced ? 0 : tiltX * 7 + rotate * 0.2,
          rotateX: reduced ? 0 : -tiltY * 7,
        }}
        whileHover={{ scale: 1.09, zIndex: 30 }}
        transition={{
          // Nghiêng theo con trỏ đi bằng lò xo cho mượt và luôn đuổi kịp.
          rotateX: { type: "spring", stiffness: 120, damping: 20 },
          rotateY: { type: "spring", stiffness: 120, damping: 20 },
          // Phóng khi rê chuột: nhanh và KHÔNG delay, để rê từ tấm này sang
          // tấm kia là đổi ngay chứ không phải đợi tấm cũ thu về.
          scale: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
        }}
      >
        <motion.div
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => canFlip && setFlipped((f) => !f)}
          role={canFlip ? "button" : undefined}
          tabIndex={canFlip ? 0 : undefined}
          // Nút bật/tắt thì phải khai aria-pressed, không thì trình đọc màn
          // hình chỉ đọc được "nút", không biết ảnh đang ngửa hay đang úp.
          aria-pressed={canFlip ? flipped : undefined}
          aria-label={canFlip ? `Lật ảnh: ${photo.alt}` : undefined}
          onKeyDown={(e) => {
            if (!canFlip) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
        >
          {/* Mặt trước */}
          <div
            className="bg-paper rounded-[2px] p-1.5 shadow-[0_8px_22px_-6px_rgba(0,0,0,0.6)] md:p-[6%]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: ASPECT_CSS[photo.aspect] }}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 44vw, 200px"
                quality={90}
                className="object-cover"
              />
            </div>

            {/* Góc gấp nhỏ, dấu hiệu duy nhất cho biết tấm này lật được. */}
            {canFlip ? (
              <span
                aria-hidden
                className="border-b-gold/70 absolute right-0 bottom-0 size-0 border-r-[14px] border-b-[14px] border-r-transparent"
              />
            ) : null}
          </div>

          {/* Mặt sau: xoay sẵn 180° để khi lật xong nó quay đúng chiều. */}
          {canFlip ? (
            <div
              className="paper absolute inset-0 grid place-items-center rounded-[2px] px-2 shadow-[0_8px_22px_-6px_rgba(0,0,0,0.6)]"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="font-accent text-ink/85 text-center text-[clamp(0.6rem,1.1vw,0.85rem)] leading-snug text-balance">
                {note}
              </p>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
