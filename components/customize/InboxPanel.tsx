"use client";

import { useCallback, useEffect, useState } from "react";

import { deleteInboxEntry, listInbox } from "@/app/customize/(editor)/actions";
import type { ReplyContent } from "@/lib/content/schema";
import type { InboxEntry } from "@/lib/inbox";

import { Field, SectionCard, TextArea, TextInput, Toggle } from "./fields";

const MOMENT_LABEL: Record<Exclude<InboxEntry["kind"], "reply">, string> = {
  opened: "Mở phong bì",
  finale: "Tới màn kết ở trang Hoa",
};

/** Luôn theo giờ Việt Nam, bất kể máy đang mở /customize đặt múi giờ nào. */
function thoiGian(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function PreviewTag() {
  return (
    <span className="border-mist/25 text-mist/60 ml-2 rounded border px-1.5 py-0.5 text-[10px] tracking-wide">
      bạn xem thử
    </span>
  );
}

/**
 * Tab Hồi âm: đọc thư Mina gửi, xem nhật ký, và chỉnh ô viết thư.
 *
 * Thư và nhật ký đọc thẳng từ hộp thư mỗi lần mở tab, KHÔNG nằm trong bản
 * nháp — nên không cần bấm Lưu để thấy thư mới, và lưu nội dung cũng không
 * bao giờ đè mất thư. Chỉ phần chữ của ô viết thư mới cần Lưu.
 */
export function InboxPanel({
  value,
  onChange,
}: {
  value: ReplyContent;
  onChange: (patch: Partial<ReplyContent>) => void;
}) {
  const [entries, setEntries] = useState<InboxEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await listInbox();
    if (res.ok) {
      setEntries(res.entries ?? []);
      setError(null);
    } else {
      setEntries([]);
      setError(res.error ?? "Không đọc được hộp thư.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function remove(entry: InboxEntry) {
    const ok = window.confirm(
      entry.kind === "reply"
        ? "Xoá hẳn lá thư này? Không lấy lại được."
        : "Xoá dòng nhật ký này?",
    );
    if (!ok) return;

    setBusy(entry.pathname);
    const res = await deleteInboxEntry(entry.pathname);
    setBusy(null);
    if (res.ok) {
      setEntries((list) =>
        list ? list.filter((e) => e.pathname !== entry.pathname) : list,
      );
    } else {
      setError(res.error ?? "Không xoá được.");
    }
  }

  const replies = entries?.filter((e) => e.kind === "reply") ?? [];
  const moments = entries?.filter((e) => e.kind !== "reply") ?? [];

  const deleteButton = (entry: InboxEntry) => (
    <button
      type="button"
      onClick={() => void remove(entry)}
      disabled={busy !== null}
      className="text-mist/50 shrink-0 text-[11px] underline-offset-4 transition-colors hover:text-red-200 hover:underline disabled:opacity-40"
    >
      {busy === entry.pathname ? "Đang xoá..." : "Xoá"}
    </button>
  );

  return (
    <div className="space-y-5">
      <SectionCard
        title="Thư Mina gửi"
        description="Viết từ ô ở cuối trang Hoa. Lưu riêng tư, chỉ đọc được ở đây khi đã đăng nhập."
      >
        {error ? (
          <p className="border-mist/25 text-mist/70 rounded-lg border border-dashed px-3 py-2 text-xs">
            {error}
          </p>
        ) : null}

        {entries === null ? (
          <p className="text-mist/50 text-xs">Đang mở hộp thư...</p>
        ) : replies.length === 0 ? (
          <p className="text-mist/50 text-xs">Chưa có thư nào.</p>
        ) : (
          <ul className="space-y-3">
            {replies.map((entry) => (
              <li
                key={entry.pathname}
                className="border-gold/25 bg-gold/5 rounded-xl border px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-mist/70 text-[11px]">
                    {thoiGian(entry.at)}
                    {entry.preview ? <PreviewTag /> : null}
                  </p>
                  {deleteButton(entry)}
                </div>
                <p className="text-cream/90 mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {entry.text}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => void refresh()}
          className="text-mist/60 hover:text-cream self-start text-xs underline underline-offset-4 transition-colors"
        >
          Xem có thư mới không
        </button>
      </SectionCard>

      <SectionCard
        title="Nhật ký"
        description="Lúc Mina mở phong bì và lúc tới được màn kết ở trang Hoa — mỗi thứ ghi tối đa một lần cho mỗi tab. Bạn đăng nhập mà xem bình thường thì không ghi; bật “Xem như Mina” hoặc đang diễn tập thì có ghi, kèm nhãn “bạn xem thử”."
      >
        {entries === null ? null : moments.length === 0 ? (
          <p className="text-mist/50 text-xs">Chưa có gì.</p>
        ) : (
          <ul className="divide-mist/10 divide-y">
            {moments.map((entry) => (
              <li
                key={entry.pathname}
                className="flex items-center justify-between gap-3 py-2"
              >
                <p className="text-cream/85 text-sm">
                  <span className="text-mist/60 mr-3 text-xs tabular-nums">
                    {thoiGian(entry.at)}
                  </span>
                  {entry.kind === "reply" ? null : MOMENT_LABEL[entry.kind]}
                  {entry.preview ? <PreviewTag /> : null}
                </p>
                {deleteButton(entry)}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Ô viết thư ở cuối trang Hoa"
        description="Hiện ra dưới lời chúc, sau màn mưa hoa. Sửa chữ xong nhớ bấm Lưu thay đổi."
      >
        <Toggle
          checked={value.enabled}
          onChange={(enabled) => onChange({ enabled })}
          label="Cho Mina viết thư lại"
        />
        {value.enabled ? (
          <>
            <Field label="Dòng mời viết">
              <TextInput
                value={value.title}
                onChange={(title) => onChange({ title })}
              />
            </Field>
            <Field label="Chữ mờ trong ô viết">
              <TextInput
                value={value.placeholder}
                onChange={(placeholder) => onChange({ placeholder })}
              />
            </Field>
            <Field label="Chữ trên nút gửi">
              <TextInput
                value={value.sendLabel}
                onChange={(sendLabel) => onChange({ sendLabel })}
              />
            </Field>
            <Field label="Lời cảm ơn sau khi gửi">
              <TextArea
                rows={2}
                value={value.thanks}
                onChange={(thanks) => onChange({ thanks })}
              />
            </Field>
          </>
        ) : null}
      </SectionCard>
    </div>
  );
}
