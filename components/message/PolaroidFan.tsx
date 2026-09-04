"use client";

import { motion } from "motion/react";

import { Polaroid } from "@/components/ui/Polaroid";
import type { ImageAsset } from "@/lib/content/schema";
import { cx } from "@/lib/cx";

/** Càng nhiều ảnh thì mỗi tấm càng nhỏ lại, để hàng ảnh luôn vừa màn hình. */
const WIDTH_BY_COUNT: Record<number, string> = {
  1: "w-[min(64vw,20rem)]",
  2: "w-[min(46vw,16rem)]",
  3: "w-[min(38vw,13.5rem)]",
  4: "w-[min(32vw,11.5rem)]",
  5: "w-[min(28vw,10rem)]",
};

/** Nghiêng và lệch cao thấp xen kẽ, cho giống ảnh vừa được bày ra bàn. */
const ROTATE = [-7, 5, -4, 8, -6];
const OFFSET_Y = ["1.5rem", "-0.75rem", "1.75rem", "-0.5rem", "1.25rem"];

/**
 * Vài tấm polaroid xếp chồng hơi lệch nhau ở đầu trang Lời nhắn.
 * Nhận tối đa 5 ảnh (MAX_MESSAGE_PHOTOS).
 */
export function PolaroidFan({ photos }: { photos: ImageAsset[] }) {
  if (photos.length === 0) return null;

  const count = Math.min(photos.length, 5);
  const width = WIDTH_BY_COUNT[count] ?? WIDTH_BY_COUNT[5];

  return (
    <div className="flex items-center justify-center">
      {photos.slice(0, 5).map((photo, i) => (
        <motion.div
          key={photo.id}
          className={cx(width, i > 0 && "-ml-[7%]")}
          style={{
            marginTop: OFFSET_Y[i],
            // Tấm giữa nổi lên trên, hai bên lùi dần ra sau.
            zIndex: 10 - Math.abs(i - Math.floor((count - 1) / 2)),
          }}
          initial={{ opacity: 0, y: 40, rotate: ROTATE[i] * 2.2, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{
            duration: 0.85,
            delay: 0.25 + i * 0.13,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Polaroid
            image={photo}
            rotate={ROTATE[i]}
            float
            floatDelay={i * 0.6}
            priority={i < 2}
            sizes="(max-width: 640px) 46vw, 16rem"
          />
        </motion.div>
      ))}
    </div>
  );
}
