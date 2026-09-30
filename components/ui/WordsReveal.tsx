"use client";

import { useReducedMotion } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";

/**
 * Hiện dần từng chữ, như đang được viết ra.
 *
 * Phần chạy nằm ở CSS (xem `word-in` trong globals.css), JavaScript chỉ làm
 * đúng một việc: đoạn văn cuộn tới thì gắn thêm class `words-in`.
 *
 * Bản đầu cho mỗi chữ là một `motion.span` với variants. Đẹp, nhưng lá thư
 * dài 10 nghìn ký tự là 2400 phần tử motion: dựng trang mất hơn hai giây,
 * ngốn 46MB, và lúc cuộn thì hàng chục chữ cùng chạy trên luồng chính nên
 * máy yếu là giật. Hiệu ứng nhìn y hệt, chỉ đổi chỗ chạy.
 *
 * Hai chỗ dễ sai, vẫn nguyên như cũ:
 *  - Khoảng trắng giữa các chữ phải là text node nằm NGOÀI thẻ inline-block.
 *    Nhét nó vào trong thì trình duyệt mất chỗ xuống dòng và cả đoạn tràn ra.
 *  - Chỉ chạy opacity và dịch dọc. Thêm blur cho từng chữ nhìn thì mềm hơn
 *    thật, nhưng một đoạn sáu chục chữ là sáu chục lớp làm mờ chạy cùng lúc,
 *    điện thoại gánh không nổi.
 */
export function WordsReveal({
  text,
  className,
  delay = 0,
  /** Giây giữa hai chữ liền nhau. Nhỏ thôi, không thì đọc sốt ruột. */
  stagger = 0.035,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const [hien, setHien] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || hien) return;

    // Lề âm 10% ở đáy: đợi đoạn văn nhô lên khỏi mép dưới rồi mới chạy. KHÔNG
    // dùng ngưỡng theo phần trăm chiều cao khối — xem chú thích ở Reveal.tsx.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHien(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, hien]);

  if (reduced) return <p className={className}>{text}</p>;

  const words = text.split(/\s+/).filter(Boolean);

  return (
    <p
      ref={ref}
      className={cx("words-reveal", hien && "words-in", className)}
      style={
        {
          "--word-step": `${stagger}s`,
          "--word-delay": `${delay}s`,
        } as React.CSSProperties
      }
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
            className="inline-block"
            style={{ "--i": i } as React.CSSProperties}
          >
            {word}
          </span>{" "}
        </Fragment>
      ))}
    </p>
  );
}
