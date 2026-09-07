"use client";

import type { ReactNode } from "react";

import {
  SCALE_MAX,
  SCALE_MIN,
  TYPE_ROLES,
  WEIGHT_OPTIONS,
  type FontSet,
  type TypeRole,
  type TypeSet,
} from "@/lib/content/schema";
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

const ROLE_LABEL: Record<TypeRole, string> = {
  heading: "Tiêu đề",
  body: "Đoạn văn",
  accent: "Chữ ký / ghi chú",
};

const WEIGHT_LABEL: Record<number, string> = {
  300: "300 — mảnh",
  400: "400 — thường",
  500: "500 — hơi đậm",
  600: "600 — đậm vừa",
  700: "700 — đậm",
  800: "800 — rất đậm",
};

/**
 * Chỉnh cách trình bày chữ của một khối: mặt chữ, cỡ, độ đậm và nghiêng,
 * riêng cho từng vai trò (tiêu đề / đoạn văn / chữ ký).
 *
 * Font không có bảng dấu tiếng Việt vẫn được giữ lại — nhiều font script đẹp
 * nhất chỉ có Latin, hợp cho tiêu đề tiếng Anh — nhưng được đánh dấu rõ, vì
 * dùng nhầm cho chữ tiếng Việt là vỡ hết dấu.
 */
export function TypographyPicker({
  fonts,
  type,
  onFontsChange,
  onTypeChange,
  sampleText,
}: {
  fonts: FontSet;
  type: TypeSet;
  onFontsChange: (value: FontSet) => void;
  onTypeChange: (value: TypeSet) => void;
  /** Câu mẫu để xem thử — nên có dấu tiếng Việt. */
  sampleText: string;
}) {
  const categories = [...new Set(FONTS.map((f) => f.category))];

  const patchRole = (role: TypeRole, patch: Partial<TypeSet[TypeRole]>) =>
    onTypeChange({ ...type, [role]: { ...type[role], ...patch } });

  return (
    <div className="space-y-5">
      {TYPE_ROLES.map((role) => {
        const font = getFont(fonts[role]);
        const style = type[role];

        return (
          <div key={role} className="border-mist/10 rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-cream/85 text-xs font-medium tracking-wide">
                {ROLE_LABEL[role]}
              </span>
              {!font.vietnamese ? (
                <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                  không có dấu tiếng Việt
                </span>
              ) : null}
            </div>

            <select
              value={fonts[role]}
              onChange={(e) =>
                onFontsChange({ ...fonts, [role]: e.target.value })
              }
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

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-mist/70 mb-1 block text-[11px]">
                  Cỡ chữ
                </span>
                <Slider
                  value={style.scale}
                  min={SCALE_MIN}
                  max={SCALE_MAX}
                  step={0.05}
                  onChange={(scale) => patchRole(role, { scale })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
              </label>

              <label className="block">
                <span className="text-mist/70 mb-1 block text-[11px]">
                  Độ đậm
                </span>
                <select
                  value={style.weight}
                  onChange={(e) =>
                    patchRole(role, { weight: Number(e.target.value) })
                  }
                  className={INPUT}
                >
                  {WEIGHT_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {WEIGHT_LABEL[w] ?? w}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={style.italic}
                onChange={(e) => patchRole(role, { italic: e.target.checked })}
                className="accent-gold size-4 cursor-pointer"
              />
              <span className="text-cream/85 text-sm">Chữ nghiêng</span>
            </label>

            {/* Xem thử đúng mặt chữ, cỡ, độ đậm và độ nghiêng đang chọn. */}
            <p
              className="text-cream/85 border-mist/10 bg-base/40 mt-3 truncate rounded-lg border px-3 py-2"
              style={{
                fontFamily: fontStack(fonts[role]),
                fontSize: `${style.scale * 1.15}rem`,
                fontWeight: style.weight,
                fontStyle: style.italic ? "italic" : "normal",
              }}
            >
              {sampleText}
            </p>

            <p className="text-mist/45 mt-1.5 text-[11px] leading-relaxed">
              Font chỉ có sẵn một nét thì trình duyệt sẽ tự làm đậm hoặc nghiêng
              giả — nhìn thô hơn font có nét thật.
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
