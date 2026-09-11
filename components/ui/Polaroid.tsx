"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { ASPECT_CSS, type ImageAsset } from "@/lib/content/schema";
import { cx } from "@/lib/cx";

/**
 * Khung ảnh kiểu Polaroid: viền giấy dày, đáy dày hơn để có chỗ ghi chú.
 * Ảnh giữ đúng tỉ lệ đã cắt lúc tải lên nên không bao giờ bị méo.
 *
 * Lơ lửng bằng CSS keyframes chứ không bằng motion: đây là vòng lặp vô hạn,
 * mà trang Lời nhắn có tới năm tấm cùng trôi — năm vòng lặp trên luồng chính.
 * Góc nghiêng truyền vào qua --tilt vì CSS animation ghi đè toàn bộ transform:
 * không nhồi góc nghiêng vào keyframe thì tấm ảnh bị dựng thẳng đứng ngay lúc
 * bắt đầu trôi.
 */
export function Polaroid({
  image,
  caption,
  rotate = 0,
  className,
  sizes = "(max-width: 640px) 60vw, 320px",
  priority = false,
  float = false,
  floatDelay = 0,
}: {
  image: ImageAsset;
  caption?: ReactNode;
  /** Độ nghiêng, tính bằng độ. */
  rotate?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Trôi lên xuống rất chậm, cho ảnh có vẻ đang lơ lửng. */
  float?: boolean;
  floatDelay?: number;
}) {
  const style = {
    "--tilt": `${rotate}deg`,
    // Tư thế tĩnh khi không trôi; khi trôi thì keyframe drift-y lo, và nó
    // cũng đọc cùng --tilt nên hai bên luôn khớp góc.
    transform: `rotate(${rotate}deg)`,
    ...(float
      ? {
          "--float-dur": `${7 + floatDelay}s`,
          "--float-delay": `${floatDelay}s`,
        }
      : {}),
  } as CSSProperties;

  return (
    <figure
      className={cx(
        "bg-paper gpu relative m-0 rounded-[3px] p-[5%] pb-[13%] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)]",
        float && "drift-y",
        className,
      )}
      style={style}
    >
      <div
        className="bg-ink/10 relative w-full overflow-hidden"
        style={{ aspectRatio: ASPECT_CSS[image.aspect] }}
      >
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={90}
          className="object-cover"
        />
      </div>

      {caption ? (
        <figcaption className="font-accent text-ink/70 absolute inset-x-[6%] bottom-[3.5%] text-center text-[calc(clamp(0.7rem,2.4vw,0.95rem)*var(--fz-accent,1))] leading-tight">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
