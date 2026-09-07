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

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date; storage: "blob" | "local" }
  | { kind: "failed"; reason: string };

/**
 * So sánh bỏ qua `updatedAt`.
 * Trường đó do máy chủ tự đóng dấu mỗi lần lưu, nên nếu so cả nó thì vừa lưu
 * xong bản nháp đã lại khác bản trên máy chủ — nút lúc nào cũng báo "chưa lưu"
 * và không cách nào biết được đã lưu thành công hay chưa.
 */
function withoutTimestamp(content: SiteContent): string {
  const { updatedAt: _ignored, ...rest } = content;
  return JSON.stringify(rest);
}

function formatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

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
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  const dirty = withoutTimestamp(draft) !== withoutTimestamp(initial);

  const patch = useCallback((next: Partial<SiteContent>) => {
    setDraft((d) => ({ ...d, ...next }));
    // Vừa sửa tiếp thì thông báo cũ không còn đúng nữa.
    setSave((s) => (s.kind === "saved" ? { kind: "idle" } : s));
  }, []);

  // Nhắc trước khi đóng tab nếu còn thay đổi chưa lưu.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function handleSave() {
    if (save.kind === "saving") return;
    setSave({ kind: "saving" });

    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
        content?: SiteContent;
        storage?: "blob" | "local";
      } | null;

      if (!res.ok) {
        setSave({
          kind: "failed",
          reason: data?.error ?? `Máy chủ trả về lỗi ${res.status}`,
        });
        return;
      }

      // Nhận lại dấu thời gian của máy chủ, để bản nháp và bản đã lưu khớp nhau.
      if (data?.content?.updatedAt) {
        const stamp = data.content.updatedAt;
        setDraft((d) => ({ ...d, updatedAt: stamp }));
      }

      setSave({
        kind: "saved",
        at: new Date(),
        storage: data?.storage ?? storage,
      });
      router.refresh();
    } catch {
      setSave({
        kind: "failed",
        reason: "Không gọi được máy chủ — kiểm tra kết nối mạng rồi thử lại.",
      });
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
                ? "Lưu lên Vercel Blob"
                : "Lưu vào .data/content.json ở máy"}
              {" · "}
              {/* Dấu thời gian của bản máy chủ ĐANG phục vụ. Nếu bấm Lưu xong
                  mà số này không đổi thì tức là nội dung mới chưa tới nơi. */}
              bản trên máy chủ: {formatTime(initial.updatedAt)}
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
              onClick={handleSave}
              disabled={save.kind === "saving" || !dirty}
              className="bg-gold text-deep hover:bg-gold/90 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {save.kind === "saving"
                ? "Đang lưu..."
                : dirty
                  ? "Lưu thay đổi"
                  : "Không có thay đổi"}
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

      <SaveBanner state={save} onDismiss={() => setSave({ kind: "idle" })} />

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

/** Báo rõ đã lưu được hay không, và nếu không thì vì sao. */
function SaveBanner({
  state,
  onDismiss,
}: {
  state: SaveState;
  onDismiss: () => void;
}) {
  if (state.kind === "idle") return null;

  if (state.kind === "saving") {
    return (
      <p className="border-mist/25 bg-base/50 text-mist/80 mt-4 rounded-lg border px-3.5 py-2.5 text-sm">
        Đang lưu...
      </p>
    );
  }

  if (state.kind === "saved") {
    return (
      <div
        role="status"
        className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-2.5"
      >
        <span aria-hidden className="mt-0.5 text-emerald-300">
          ✓
        </span>
        <div className="min-w-0 flex-1 text-sm text-emerald-100">
          <p className="font-medium">
            Đã lưu thành công lúc {formatTime(state.at)}
          </p>
          <p className="mt-0.5 text-[12px] text-emerald-200/70">
            {state.storage === "blob"
              ? "Nội dung đã ghi lên Vercel Blob. Mở lại trang chính là thấy ngay."
              : "Đã ghi vào .data/content.json trên máy này."}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="shrink-0 text-emerald-200/60 transition-colors hover:text-emerald-100"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mt-4 flex items-start gap-3 rounded-lg border border-red-400/40 bg-red-400/10 px-3.5 py-2.5"
    >
      <span aria-hidden className="mt-0.5 text-red-300">
        !
      </span>
      <div className="min-w-0 flex-1 text-sm text-red-100">
        <p className="font-medium">Lưu thất bại</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-red-200/80">
          {state.reason}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        className="shrink-0 text-red-200/60 transition-colors hover:text-red-100"
      >
        ✕
      </button>
    </div>
  );
}
