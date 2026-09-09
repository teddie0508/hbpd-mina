import type { CSSProperties } from "react";

import { cx } from "@/lib/cx";

/**
 * Vài đốm sáng trôi rất chậm phía sau nội dung, cho nền đỡ phẳng.
 *
 * Toạ độ cố định sẵn (không random) để HTML dựng ở máy chủ và ở trình duyệt
 * khớp nhau, tránh cảnh báo hydration.
 */
const MOTES = [
  { x: 12, y: 18, size: 3, delay: 0, drift: 26, duration: 17 },
  { x: 78, y: 12, size: 2, delay: 2.4, drift: -20, duration: 21 },
  { x: 32, y: 74, size: 4, delay: 1.1, drift: 18, duration: 19 },
  { x: 88, y: 62, size: 2.5, delay: 3.6, drift: -28, duration: 23 },
  { x: 58, y: 34, size: 2, delay: 0.8, drift: 22, duration: 25 },
  { x: 8, y: 52, size: 3, delay: 4.2, drift: -16, duration: 18 },
  { x: 68, y: 84, size: 2.5, delay: 1.9, drift: 24, duration: 22 },
  { x: 44, y: 8, size: 2, delay: 3.1, drift: -22, duration: 20 },
];

/**
 * Nền chung của cả năm trang.
 *
 * Chạy bằng CSS thuần, cố ý KHÔNG dùng `motion`. Trước đây mỗi đốm là một
 * `motion.span` lặp vô hạn: tám vòng lặp chạy trên luồng chính, ở mọi trang,
 * suốt thời gian trang mở — đúng luồng mà mưa hoa cũng đang dùng. CSS
 * keyframes chỉ động vào transform và opacity nên Safari đẩy hẳn xuống luồng
 * ghép ảnh.
 *
 * Đổi lại còn bỏ được cả "use client": component này giờ không kèm theo một
 * dòng JavaScript nào xuống trình duyệt. Máy bật "giảm chuyển động" vẫn được
 * tôn trọng, nhờ khối `prefers-reduced-motion` chung trong globals.css.
 */
export function Ambience({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Quầng sáng ấm ở giữa, giữ mắt vào trung tâm. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 40%, color-mix(in srgb, var(--c-sage) 12%, transparent), transparent 70%)",
        }}
      />

      {MOTES.map((mote, i) => (
        <span
          key={i}
          // Bốn đốm sau chỉ hiện từ màn vừa trở lên. Trên điện thoại vừa chật
          // vừa chẳng ai nhìn ra là có tám hay bốn.
          className={cx(
            "mote absolute rounded-full",
            i >= 4 && "hidden sm:block",
          )}
          style={
            {
              left: `${mote.x}%`,
              top: `${mote.y}%`,
              // Vẽ to hơn lõi sáng để chỗ gradient nhạt dần có đất diễn.
              width: mote.size * 2.6,
              height: mote.size * 2.6,
              animationDuration: `${mote.duration}s`,
              animationDelay: `${mote.delay}s`,
              "--mote-dx": `${mote.drift * 0.4}px`,
              "--mote-dy": `${-mote.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
