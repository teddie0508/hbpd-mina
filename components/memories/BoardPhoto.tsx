"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { ASPECT_CSS, type ImageAsset } from "@/lib/content/schema";

/**
 * Một tấm ảnh trên khối kỷ niệm.
 *
 * Chia làm ba lớp riêng biệt, cố ý không gộp:
 *  - lớp ngoài cùng (do khối cha dựng) lo vị trí bằng class Tailwind
 *  - lớp hiện dần, có delay so le giữa các tấm
 *  - lớp nghiêng theo con trỏ và phóng khi rê chuột, KHÔNG delay
 *
 * Hai lý do phải tách:
 *  - `motion` ghi thẳng `transform` vào style, gộp lại là cái sau xoá cái trước.
 *  - `transition` áp cho MỌI chuyển động của cùng một phần tử. Gộp lớp hiện
 *    dần với lớp hover thì cái delay so le lúc vào trang dính luôn vào hover:
 *    rê chuột vào tấm cuối phải đợi hơn nửa giây nó mới chịu phóng.
 *
 * Trước đây tấm ảnh lật được để xem ghi chú ở mặt sau. Bỏ rồi: ở cỡ chừng
 * 150px thì cả ảnh lẫn chữ đều bé quá. Giờ chạm vào là mở gallery phủ kín màn
 * hình, ghi chú nằm ngay dưới ảnh.
 */
export function BoardPhoto({
  photo,
  rotate,
  delay,
  tiltX,
  tiltY,
  onOpen,
}: {
  photo: ImageAsset;
  /** Độ nghiêng cố định của tấm ảnh, tính bằng độ. */
  rotate: number;
  delay: number;
  /** Con trỏ đang lệch bao nhiêu so với tâm khối, khoảng -1 đến 1. */
  tiltX: number;
  tiltY: number;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();
  const hasNote = Boolean(photo.note?.trim());

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
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Xem ảnh: ${photo.alt}`}
          className="group bg-paper focus-visible:ring-gold/70 relative block w-full cursor-zoom-in rounded-[2px] p-1.5 shadow-[0_8px_22px_-6px_rgba(0,0,0,0.6)] outline-none focus-visible:ring-2 md:p-[6%]"
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

            {/* Kính lúp hiện khi rê chuột — dấu hiệu duy nhất cho biết bấm
                được. Điện thoại không có trạng thái rê chuột, nên ở đó việc
                mách nước giao cho câu thoại của gấu Teddie. */}
            <span
              aria-hidden
              className="bg-ink/35 pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-cream size-1/4 min-w-4 drop-shadow"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5M11 8.5v5M8.5 11h5" />
              </svg>
            </span>
          </div>

          {/* Góc gấp nhỏ: tấm này có ghi chú kèm theo. */}
          {hasNote ? (
            <span
              aria-hidden
              className="border-b-gold/70 absolute right-0 bottom-0 size-0 border-r-[14px] border-b-[14px] border-r-transparent"
            />
          ) : null}
        </button>
      </motion.div>
    </motion.div>
  );
}
