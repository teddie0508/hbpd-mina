"use client";

import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { tryPassphrase } from "@/app/(experience)/actions";
import type { PassphraseContent } from "@/lib/content/schema";
import { cx } from "@/lib/cx";

/**
 * Tấm thiệp nhỏ hỏi tên, hiện ra sau khi chạm phong bì.
 *
 * Dựng qua portal ra thẳng <body> vì cùng lý do với `WarmFlash`: phong bì có
 * `perspective`, mà bất kỳ tổ tiên nào có transform/filter/perspective cũng
 * biến thành containing block của `position: fixed`. Đứng ngoài <body> thì
 * chắc chắn phủ đúng cả màn hình.
 */
export function NameGate({
  config,
  open,
  onPassed,
  onDismiss,
}: {
  config: PassphraseContent;
  open: boolean;
  /** Trả lời đúng. Bên ngoài lo mở phong bì tiếp. */
  onPassed: () => void;
  /** Bấm ra ngoài hoặc bấm Esc. */
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <GatePanel config={config} onPassed={onPassed} onDismiss={onDismiss} />
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function GatePanel({
  config,
  onPassed,
  onDismiss,
}: {
  config: PassphraseContent;
  onPassed: () => void;
  onDismiss: () => void;
}) {
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [wrong, setWrong] = useState(false);
  // Cú lắc khi trả lời sai, gọi tay chứ không gắn vào state.
  //
  // Cách đầu tiên là đổi `key` của khối bọc để React dựng lại và chạy lại
  // hoạt cảnh. Chạy thì có chạy, nhưng dựng lại khối bọc là dựng lại luôn cả
  // ô nhập bên trong: mất con trỏ, và trên điện thoại là **sập bàn phím ngay
  // sau lần gõ sai đầu tiên**. Điều khiển thẳng thì không đụng gì tới DOM.
  const shake = useAnimationControls();

  useEffect(() => {
    // Chờ hết hoạt cảnh mở panel rồi mới đưa con trỏ vào: bật bàn phím giữa
    // lúc panel đang phóng to làm Safari trên iPhone giật một nhịp.
    const id = window.setTimeout(() => inputRef.current?.focus(), 420);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (checking || !value.trim()) return;

    setChecking(true);
    setWrong(false);

    const ok = await tryPassphrase(value);

    if (ok) {
      // Không tắt `checking`: panel sắp biến mất, để nút ở trạng thái đang
      // chạy sẽ không kịp nhấp nháy một cái trước khi bay đi.
      onPassed();
      return;
    }

    setChecking(false);
    setWrong(true);
    // Bôi đen chữ cũ để gõ đè được ngay, không phải xoá từng ký tự.
    inputRef.current?.select();
    if (!reduced) {
      shake.start({
        x: [0, -9, 8, -6, 4, 0],
        transition: { duration: 0.42, ease: "easeInOut" },
      });
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.15 : 0.35, ease: "easeOut" }}
    >
      {/* Nền tối bấm được để đóng lại, phòng khi cô ấy muốn ngắm phong bì thêm. */}
      <button
        type="button"
        aria-label="Đóng"
        onClick={onDismiss}
        className="bg-base/80 absolute inset-0 cursor-default"
      />

      <motion.form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="namegate-title"
        className="paper relative w-full max-w-sm rounded-2xl px-6 py-7 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.75)]"
        initial={{ opacity: 0, y: 18, scale: reduced ? 1 : 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: reduced ? 1 : 0.97 }}
        transition={{
          duration: reduced ? 0.15 : 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <h2
          id="namegate-title"
          className="font-heading text-ink text-center text-[calc(clamp(1.5rem,6vw,2rem)*var(--fz-heading,1))] leading-tight"
        >
          {config.title}
        </h2>

        {/* Lắc nhẹ khi sai. */}
        <motion.div animate={shake} className="mt-5">
          <input
            ref={inputRef}
            // Cố ý KHÔNG dùng type="password": đây là trò tạo bất ngờ, che chữ
            // bằng dấu chấm chỉ làm khó người gõ chứ chẳng giấu ai.
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (wrong) setWrong(false);
            }}
            placeholder={config.placeholder}
            aria-label={config.title}
            aria-invalid={wrong}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            className="border-ink/20 bg-cream/60 text-ink placeholder:text-ink/35 focus:border-gold focus:ring-gold/35 w-full rounded-xl border px-4 py-3 text-center text-[calc(clamp(1rem,4vw,1.15rem)*var(--fz-body,1))] outline-none focus:ring-2"
          />
        </motion.div>

        {/* Một thẻ <p> duy nhất, đổi chữ và đổi màu — cố ý KHÔNG dùng
            AnimatePresence để chuyển giữa hai câu.
            `mode="wait"` bắt câu cũ chạy xong hoạt cảnh biến đi thì câu mới
            mới được gắn vào; máy nào hoạt ảnh bị bóp (tắt tăng tốc phần cứng,
            tab đang ẩn) là câu báo sai không bao giờ hiện ra. Đây là đường
            phản hồi duy nhất của panel nên nó phải hiện ngay, không phụ thuộc
            vào bất cứ hoạt ảnh nào. Cảm giác chuyển đã có cú lắc lo rồi. */}
        <div className="mt-3 min-h-[1.5rem] text-center">
          <p
            aria-live="polite"
            className={cx(
              "font-accent text-[0.95rem] transition-colors duration-200",
              wrong ? "text-[#a4442f]" : "text-ink/60",
            )}
          >
            {wrong ? config.errorText : config.hint}
          </p>
        </div>

        <button
          type="submit"
          disabled={checking || !value.trim()}
          className="bg-ink/90 text-cream hover:bg-ink focus-visible:ring-gold mt-5 w-full rounded-xl px-4 py-3 text-sm tracking-wide transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {checking ? "Đang mở..." : config.submitLabel}
        </button>
      </motion.form>
    </motion.div>
  );
}
