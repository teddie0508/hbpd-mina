"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { SiteContent } from "@/lib/content/schema";
import { cx } from "@/lib/cx";

import {
  FlowersPanel,
  GeneralPanel,
  HubPanel,
  LandingPanel,
  MemoriesPanel,
  MessagePanel,
  MusicPanel,
} from "./panels";

const TABS = [
  { key: "general", label: "Chung" },
  { key: "landing", label: "Bìa" },
  { key: "hub", label: "Lựa chọn" },
  { key: "message", label: "Lời nhắn" },
  { key: "memories", label: "Kỷ niệm" },
  { key: "flowers", label: "Hoa" },
  { key: "music", label: "Nhạc" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function EditorShell({
  initial,
  storage,
}: {
  initial: SiteContent;
  storage: "blob" | "local";
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<TabKey>("general");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const patch = useCallback(
    (next: Partial<SiteContent>) => setDraft((d) => ({ ...d, ...next })),
    [],
  );

  // Nhắc trước khi đóng tab nếu còn thay đổi chưa lưu.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Không lưu được");
      }
      setSavedAt(new Date().toLocaleTimeString("vi-VN"));
      // Đồng bộ lại initial để cờ "chưa lưu" tắt đi.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/customize/login");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
      <header className="bg-deep/95 border-mist/12 sticky top-0 z-20 -mx-4 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-cream text-sm font-medium">
              Chỉnh sửa nội dung
            </h1>
            <p className="text-mist/55 mt-0.5 text-[11px]">
              {storage === "blob"
                ? "Đang lưu lên Vercel Blob"
                : "Đang lưu vào .data/content.json ở máy"}
              {savedAt ? ` · đã lưu lúc ${savedAt}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/?preview=1"
              target="_blank"
              className="border-mist/25 text-cream/80 hover:border-gold/50 hover:text-gold rounded-lg border px-3 py-1.5 text-xs transition-colors"
            >
              Xem trang
            </Link>
            <button
              type="button"
              onClick={logout}
              className="border-mist/25 text-mist/70 hover:text-cream rounded-lg border px-3 py-1.5 text-xs transition-colors"
            >
              Thoát
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="bg-gold text-deep hover:bg-gold/90 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Đang lưu..." : dirty ? "Lưu thay đổi" : "Đã lưu"}
            </button>
          </div>
        </div>

        <nav className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cx(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors",
                tab === item.key
                  ? "bg-gold/15 text-gold"
                  : "text-mist/70 hover:bg-cream/5 hover:text-cream",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      <main className="mt-5">
        {tab === "general" ? (
          <GeneralPanel content={draft} onChange={patch} />
        ) : null}
        {tab === "landing" ? (
          <LandingPanel
            value={draft.landing}
            onChange={(p) => patch({ landing: { ...draft.landing, ...p } })}
          />
        ) : null}
        {tab === "hub" ? (
          <HubPanel
            value={draft.hub}
            onChange={(p) => patch({ hub: { ...draft.hub, ...p } })}
          />
        ) : null}
        {tab === "message" ? (
          <MessagePanel
            value={draft.message}
            onChange={(p) => patch({ message: { ...draft.message, ...p } })}
          />
        ) : null}
        {tab === "memories" ? (
          <MemoriesPanel
            value={draft.memories}
            onChange={(p) => patch({ memories: { ...draft.memories, ...p } })}
          />
        ) : null}
        {tab === "flowers" ? (
          <FlowersPanel
            value={draft.flowers}
            onChange={(p) => patch({ flowers: { ...draft.flowers, ...p } })}
          />
        ) : null}
        {tab === "music" ? (
          <MusicPanel
            value={draft.music}
            onChange={(p) => patch({ music: { ...draft.music, ...p } })}
          />
        ) : null}
      </main>
    </div>
  );
}
