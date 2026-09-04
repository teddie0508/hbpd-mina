"use client";

import type { ReactNode } from "react";

import type { FontSet } from "@/lib/content/schema";
import { cx } from "@/lib/cx";
import { FONTS, FONT_CATEGORY_LABEL, fontStack, getFont } from "@/lib/fonts";

const INPUT =
  "w-full rounded-lg border border-mist/20 bg-base/50 px-3 py-2 text-sm text-cream placeholder:text-mist/35 outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-mist/80 mb-1.5 block text-xs tracking-wide">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="text-mist/50 mt-1.5 block text-[11px] leading-relaxed">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 6,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx(INPUT, "resize-y leading-relaxed")}
    />
  );
}

export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-mist/20 size-9 shrink-0 cursor-pointer rounded-lg border bg-transparent p-1"
        aria-label="Chọn màu"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(INPUT, "font-mono text-xs uppercase")}
      />
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format = (v: number) => v.toFixed(2),
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-gold h-1 flex-1 cursor-pointer"
      />
      <span className="text-mist/70 w-10 shrink-0 text-right text-xs tabular-nums">
        {format(value)}
      </span>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-gold size-4 cursor-pointer"
      />
      <span className="text-cream/85 text-sm">{label}</span>
    </label>
  );
}

const ROLE_LABEL: Record<keyof FontSet, string> = {
  heading: "Tiêu đề",
  body: "Đoạn văn",
  accent: "Chữ ký / ghi chú",
};

/**
 * Chọn font cho một khối. Font không có bảng dấu tiếng Việt vẫn được giữ lại
 * (nhiều font script đẹp nhất chỉ có Latin, hợp cho tiêu đề tiếng Anh) nhưng
 * được đánh dấu rõ, vì dùng nhầm cho chữ tiếng Việt là vỡ hết dấu.
 */
export function FontSetPicker({
  value,
  onChange,
  sampleText,
}: {
  value: FontSet;
  onChange: (value: FontSet) => void;
  /** Câu mẫu để xem thử — nên có dấu tiếng Việt. */
  sampleText: string;
}) {
  const categories = [...new Set(FONTS.map((f) => f.category))];

  return (
    <div className="space-y-4">
      {(Object.keys(ROLE_LABEL) as Array<keyof FontSet>).map((role) => {
        const font = getFont(value[role]);
        return (
          <div key={role}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-mist/80 text-xs tracking-wide">
                {ROLE_LABEL[role]}
              </span>
              {!font.vietnamese ? (
                <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                  không có dấu tiếng Việt
                </span>
              ) : null}
            </div>

            <select
              value={value[role]}
              onChange={(e) => onChange({ ...value, [role]: e.target.value })}
              className={INPUT}
            >
              {categories.map((category) => (
                <optgroup key={category} label={FONT_CATEGORY_LABEL[category]}>
                  {FONTS.filter((f) => f.category === category).map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                      {f.vietnamese ? "" : "  (chỉ Latin)"}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <p
              className="text-cream/85 border-mist/10 bg-base/40 mt-2 truncate rounded-lg border px-3 py-2 text-lg"
              style={{ fontFamily: fontStack(value[role]) }}
            >
              {sampleText}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-mist/12 bg-base/35 rounded-xl border p-5">
      <h2 className="text-cream text-sm font-medium">{title}</h2>
      {description ? (
        <p className="text-mist/60 mt-1 text-xs leading-relaxed">
          {description}
        </p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
