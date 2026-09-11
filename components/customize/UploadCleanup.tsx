"use client";

import { useState } from "react";

import {
  removeUnusedUploads,
  scanUnusedUploads,
} from "@/app/customize/(editor)/actions";
import type { UnusedUpload } from "@/lib/content/store";

import { SectionCard } from "./fields";

type State =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "found"; files: UnusedUpload[] }
  | { kind: "deleting"; files: UnusedUpload[] }
  | { kind: "done"; deleted: number }
  | { kind: "error"; message: string };

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Dọn ảnh và nhạc không còn dùng.
 *
 * Cố ý làm hai bước, bấm tay: tìm trước, xem danh sách, rồi mới xoá. Xoá tệp
 * trong kho là không lấy lại được, nên không có chuyện tự động dọn ngầm.
 */
export function UploadCleanup() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function scan() {
    setState({ kind: "scanning" });
    const res = await scanUnusedUploads();
    setState(
      res.ok
        ? { kind: "found", files: res.files ?? [] }
        : { kind: "error", message: res.error ?? "Không quét được." },
    );
  }

  async function remove(files: UnusedUpload[]) {
    const ok = window.confirm(
      `Xoá hẳn ${files.length} tệp khỏi kho? Việc này không hoàn tác được.`,
    );
    if (!ok) return;

    setState({ kind: "deleting", files });
    const res = await removeUnusedUploads(files.map((f) => f.pathname));
    setState(
      res.ok
        ? { kind: "done", deleted: res.deleted ?? 0 }
        : { kind: "error", message: res.error ?? "Không xoá được." },
    );
  }

  const files =
    state.kind === "found" || state.kind === "deleting" ? state.files : [];
  const tongDungLuong = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <SectionCard
      title="Dọn tệp không dùng"
      description="Ảnh và nhạc bị thay hay bị xoá khỏi nội dung vẫn nằm lại trong kho. Chỉ xoá tệp mà không bản lưu nào — kể cả các bản trong lịch sử — còn dùng, và bỏ qua tệp tải lên trong 24 giờ qua, phòng khi nó đang nằm trong bản nháp chưa lưu."
    >
      {state.kind === "error" ? (
        <p className="border-mist/25 text-mist/70 rounded-lg border border-dashed px-3 py-2 text-xs">
          {state.message}
        </p>
      ) : null}

      {state.kind === "done" ? (
        <p className="text-xs text-emerald-200/90">
          Đã xoá {state.deleted} tệp.
        </p>
      ) : null}

      {state.kind === "found" && files.length === 0 ? (
        <p className="text-mist/60 text-xs">Kho sạch, không có tệp nào thừa.</p>
      ) : null}

      {files.length > 0 ? (
        <div className="space-y-2">
          <p className="text-cream/85 text-sm">
            {files.length} tệp thừa, tổng {mb(tongDungLuong)}.
          </p>
          <ul className="text-mist/55 max-h-32 overflow-y-auto font-mono text-[11px] leading-relaxed">
            {files.map((f) => (
              <li key={f.pathname} className="truncate">
                {f.pathname.split("/").slice(-2).join("/")} · {mb(f.size)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void scan()}
          disabled={state.kind === "scanning" || state.kind === "deleting"}
          className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
        >
          {state.kind === "scanning" ? "Đang tìm..." : "Tìm tệp không dùng"}
        </button>

        {files.length > 0 ? (
          <button
            type="button"
            onClick={() => void remove(files)}
            disabled={state.kind === "deleting"}
            className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-200 transition-colors hover:bg-red-500/10 disabled:opacity-40"
          >
            {state.kind === "deleting"
              ? "Đang xoá..."
              : `Xoá ${files.length} tệp`}
          </button>
        ) : null}
      </div>
    </SectionCard>
  );
}
