"use client";

import { motion } from "motion/react";
import Link from "next/link";

/** Nút quay lại màn ba lựa chọn, đặt ở cuối mỗi trang. */
export function BackLink({ label = "Quay lại" }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-center"
    >
      <Link
        href="/hub"
        prefetch
        className="group border-gold/30 text-cream/85 hover:border-gold/60 hover:text-gold focus-visible:ring-gold/60 inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm tracking-wide transition-colors outline-none focus-visible:ring-2"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
          aria-hidden
        >
          <path d="M15 5.5 8.5 12l6.5 6.5" />
        </svg>
        {label}
      </Link>
    </motion.div>
  );
}
