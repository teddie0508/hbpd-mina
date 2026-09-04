"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SiteContent } from "@/lib/content/schema";

const ContentContext = createContext<SiteContent | null>(null);

export function ContentProvider({
  value,
  children,
}: {
  value: SiteContent;
  children: ReactNode;
}) {
  return <ContentContext value={value}>{children}</ContentContext>;
}

/** Nội dung trang, đọc từ bất kỳ client component nào. */
export function useContent(): SiteContent {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useContent phải nằm trong <ContentProvider>");
  return value;
}
