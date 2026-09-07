"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { saveSiteContent } from "@/app/customize/(editor)/actions";
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
      // Server Action chứ không phải fetch: chỉ ở đó mới gọi được updateTag,
      // thứ bảo đảm lưu xong tải lại là thấy ngay nội dung mới.
      const result = await saveSiteContent(draft);

      if (!result.ok) {
        setSave({ kind: "failed", reason: result.error ?? "Lưu thất bại." });
        return;
      }

      // Nhận lại dấu thời gian của máy chủ, để bản nháp và bản đã lưu khớp nhau.
      if (result.updatedAt) {
        const stamp = result.updatedAt;
        setDraft((d) => ({ ...d, updatedAt: stamp }));
      }

      setSave({
        kind: "saved",
        at: new Date(),
        storage: result.storage ?? storage,
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

      <SaveToast state={save} onDismiss={() => setSave({ kind: "idle" })} />
    </div>
  );
}

/** Bao lâu thì thông báo thành công tự biến mất. Lỗi thì giữ nguyên cho đọc kỹ. */
const SUCCESS_TIMEOUT_MS = 5000;

/**
 * Thông báo nổi ở góc dưới. Trước đây là dải nằm trên đầu trang, nhưng khi
 * đang cuộn ở giữa form thì bấm Lưu xong chẳng thấy gì — phải cuộn ngược lên
 * mới biết kết quả.
 */
function SaveToast({
  state,
  onDismiss,
}: {
  state: SaveState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (state.kind !== "saved") return;
    const id = window.setTimeout(onDismiss, SUCCESS_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [state, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:pr-6">
      <AnimatePresence>
        {state.kind === "idle" ? null : (
          <motion.div
            key={state.kind}
            role={state.kind === "failed" ? "alert" : "status"}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cx(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur",
              state.kind === "saved" &&
                "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
              state.kind === "failed" &&
                "border-red-400/45 bg-red-500/15 text-red-100",
              state.kind === "saving" &&
                "border-mist/25 bg-base/85 text-mist/85",
            )}
          >
            {state.kind === "saving" ? (
              <span
                aria-hidden
                className="border-mist/30 border-t-cream mt-0.5 size-4 shrink-0 animate-spin rounded-full border-2"
              />
            ) : (
              <span
                aria-hidden
                className="mt-0.5 shrink-0 text-base leading-none"
              >
                {state.kind === "saved" ? "✓" : "!"}
              </span>
            )}

            <div className="min-w-0 flex-1 text-sm">
              {state.kind === "saving" ? (
                <p className="font-medium">Đang lưu...</p>
              ) : state.kind === "saved" ? (
                <>
                  <p className="font-medium">
                    Đã lưu lúc {formatTime(state.at)}
                  </p>
                  <p className="mt-0.5 text-[12px] opacity-75">
                    {state.storage === "blob"
                      ? "Đã ghi lên Vercel Blob. Mở lại trang chính là thấy ngay."
                      : "Đã ghi vào .data/content.json trên máy này."}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Lưu thất bại</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed opacity-85">
                    {state.reason}
                  </p>
                </>
              )}
            </div>

            {state.kind === "saving" ? null : (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Đóng thông báo"
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
              >
                ✕
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
