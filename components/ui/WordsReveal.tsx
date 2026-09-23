"use client";

import { motion, useReducedMotion } from "motion/react";
import { Fragment } from "react";

/**
 * Hiện dần từng chữ, như đang được viết ra.
 *
 * Tách theo khoảng trắng chứ không theo từng ký tự: từng ký tự sẽ đẻ ra hàng
 * nghìn phần tử cho một đoạn văn dài, và mắt cũng không đọc theo ký tự.
 *
 * Hai chỗ dễ sai:
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
  const words = text.split(/\s+/).filter(Boolean);

  if (reduced) return <p className={className}>{text}</p>;

  return (
    <motion.p
      className={className}
      initial="an"
      whileInView="hien"
      viewport={{ once: true, amount: 0, margin: "0px 0px -20% 0px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            className="inline-block"
            variants={{
              an: { opacity: 0, y: "0.4em" },
              hien: { opacity: 1, y: "0em" },
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>{" "}
        </Fragment>
      ))}
    </motion.p>
  );
}
