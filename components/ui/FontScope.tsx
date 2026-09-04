import type { ReactNode } from "react";

import type { FontSet } from "@/lib/content/schema";
import { fontVars } from "@/lib/theme";

/**
 * Bọc một khối để nó dùng bộ font riêng.
 * Bên trong cứ dùng class `font-heading`, `font-body`, `font-accent` như thường.
 */
export function FontScope({
  fonts,
  children,
  className,
  as: Tag = "div",
}: {
  fonts: FontSet;
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "article" | "header";
}) {
  return (
    <Tag style={fontVars(fonts)} className={className}>
      {children}
    </Tag>
  );
}
