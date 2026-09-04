import type { CSSProperties } from "react";

import { fontStack } from "./fonts";
import type { FontSet, SiteContent, ThemeColors } from "./content/schema";

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

/** Biến font đặt trên wrapper của từng khối, để mỗi khối một bộ font riêng. */
export function fontVars(fonts: FontSet): CSSProperties {
  return {
    "--f-heading": fontStack(fonts.heading),
    "--f-body": fontStack(fonts.body),
    "--f-accent": fontStack(fonts.accent),
  } as CSSProperties;
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
  ];
  return [...new Set(sets.flatMap((s) => [s.heading, s.body, s.accent]))];
}
