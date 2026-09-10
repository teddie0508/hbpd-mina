import type { CSSProperties } from "react";

import { fontStack } from "./fonts";
import type {
  FontSet,
  SiteContent,
  ThemeColors,
  TypeSet,
} from "./content/schema";

/** Biến màu đặt trên <html>, mọi class Tailwind màu đều đọc từ đây. */
export function themeVars(theme: ThemeColors): CSSProperties {
  return {
    "--c-base": theme.base,
    "--c-deep": theme.deep,
    "--c-paper": theme.paper,
    "--c-ink": theme.ink,
    "--c-cream": theme.cream,
    "--c-gold": theme.gold,
    "--c-sage": theme.sage,
    "--c-mist": theme.mist,
  } as CSSProperties;
}

/**
 * Biến chữ đặt trên wrapper của từng khối: mặt chữ, độ đậm, nghiêng và hệ số cỡ.
 * Cỡ chữ đi qua hệ số chứ không phải giá trị tuyệt đối, để chữ vẫn co giãn
 * theo bề ngang màn hình như thiết kế gốc.
 */
export function fontVars(fonts: FontSet, type?: TypeSet): CSSProperties {
  const vars: Record<string, string | number> = {
    "--f-heading": fontStack(fonts.heading),
    "--f-body": fontStack(fonts.body),
    "--f-accent": fontStack(fonts.accent),
  };

  if (type) {
    for (const role of ["heading", "body", "accent"] as const) {
      vars[`--fz-${role}`] = type[role].scale;
      vars[`--fw-${role}`] = type[role].weight;
      vars[`--fi-${role}`] = type[role].italic ? "italic" : "normal";
    }
  }

  return vars as CSSProperties;
}

/** Mọi font đang được dùng, để chỉ tải đúng từng ấy family. */
export function usedFontKeys(content: SiteContent): string[] {
  const sets: FontSet[] = [
    content.countdown.fonts,
    content.landing.fonts,
    content.hub.fonts,
    content.message.fonts,
    content.memories.fonts,
    content.flowers.fonts,
    content.teddie.fonts,
  ];
  return [...new Set(sets.flatMap((s) => [s.heading, s.body, s.accent]))];
}
