"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listSavedVersions,
  loadSavedVersion,
} from "@/app/customize/(editor)/actions";
import type { SiteContent } from "@/lib/content/schema";
import type { ContentVersion } from "@/lib/content/store";
import { cx } from "@/lib/cx";

import { SectionCard } from "./fields";

function gioPhut(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Lịch sử các bản đã lưu, kèm nút nạp lại một bản cũ.
 *
 * Nạp lại CHỈ đổ nội dung vào trình sửa như một bản nháp — phải tự bấm "Lưu
 * thay đổi" thì nó mới thành bản hiện hành. Cố ý làm hai bước: xem nhầm bản
 * thì không mất gì, và bản đang hỏng cũng vẫn còn nguyên trong danh sách
 * phòng khi nạp nhầm rồi lại muốn quay về.
 */
export function VersionHistory({
  onLoad,
}: {
  onLoad: (content: SiteContent) => void;
}) {
  const [versions, setVersions] = useState<ContentVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await listSavedVersions();
    if (res.ok) {
      setVersions(res.versions ?? []);
      setError(null);
    } else {
      setVersions([]);
      setError(res.error ?? "Không đọc được danh sách bản lưu.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleLoad(v: ContentVersion) {
    setBusy(v.pathname);
    const res = await loadSavedVersion(v.pathname);
    setBusy(null);
    if (res.ok && res.content) {
      onLoad(res.content);
      setError(null);
    } else {
      setError(res.error ?? "Không nạp được bản này.");
    }
  }

  return (
    <SectionCard
      title="Lịch sử bản lưu"
      description="Mỗi lần bấm Lưu là một bản riêng. Lỡ ghi đè nhầm thì nạp lại bản cũ ở đây — nạp xong nhớ bấm Lưu thay đổi để chốt."
    >
      {error ? (
        <p className="border-mist/25 text-mist/70 rounded-lg border border-dashed px-3 py-2 text-xs">
          {error}
        </p>
      ) : null}

      {versions === null ? (
        <p className="text-mist/50 text-xs">Đang đọc...</p>
      ) : versions.length === 0 && !error ? (
        <p className="text-mist/50 text-xs">Chưa có bản lưu nào.</p>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.pathname}
              className={cx(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                v.current ? "border-gold/40 bg-gold/5" : "border-mist/15",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-cream/90 text-sm">
                  {gioPhut(v.savedAt)}
                  {v.current ? (
                    <span className="text-gold ml-2 text-[11px] tracking-wide">
                      đang dùng
                    </span>
                  ) : null}
                  {v.legacy ? (
                    <span className="text-mist/60 ml-2 text-[11px] tracking-wide">
                      bản cũ nhất
                    </span>
                  ) : null}
                </p>
                <p className="text-mist/50 text-[11px]">{v.sizeKb} KB</p>
              </div>

              <button
                type="button"
                onClick={() => handleLoad(v)}
                disabled={busy !== null}
                className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold shrink-0 rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
              >
                {busy === v.pathname ? "Đang nạp..." : "Nạp vào trình sửa"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => void refresh()}
        className="text-mist/60 hover:text-cream self-start text-xs underline underline-offset-4 transition-colors"
      >
        Đọc lại danh sách
      </button>
    </SectionCard>
  );
}
