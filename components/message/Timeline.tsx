"use client";

import { Polaroid } from "@/components/ui/Polaroid";
import type { TimelineContent, TimelineEntry } from "@/lib/content/schema";
import { cx } from "@/lib/cx";
import { useInView } from "@/lib/useInView";

/**
 * Đường mốc "chúng mình", nằm ngay dưới lá thư.
 *
 * Một đường kẻ dọc, mỗi mốc là một chấm: ngày, một dòng tiêu đề, vài dòng kể
 * thêm, và một tấm ảnh nhỏ nếu có. Mốc CUỐI được làm nổi hơn — nó là đích đến
 * của cả con đường.
 *
 * Hiện dần bằng CSS (`tl-line`, `tl-dot`, `tl-text` trong globals.css), JavaScript
 * chỉ gắn thêm class khi mốc cuộn tới: lá thư phía trên đã dài sẵn, không nên
 * thêm hàng trăm phần tử hoạt ảnh chạy trên luồng chính nữa.
 */
export function Timeline({ content }: { content: TimelineContent }) {
  const entries = content.entries.filter(
    (e) => e.date.trim() || e.title.trim() || e.note.trim() || e.photo,
  );
  if (!content.enabled || entries.length === 0) return null;

  return (
    <section className="mt-20 sm:mt-24">
      {content.heading.trim() ? (
        <h2 className="font-heading text-cream text-center text-[calc(clamp(1.5rem,5.5vw,2.4rem)*var(--fz-heading,1))] leading-tight text-balance">
          {content.heading}
        </h2>
      ) : null}

      <ol className="mx-auto mt-10 max-w-xl sm:mt-12">
        {entries.map((entry, i) => (
          <Row
            key={entry.id}
            entry={entry}
            index={i}
            last={i === entries.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

function Row({
  entry,
  index,
  last,
}: {
  entry: TimelineEntry;
  index: number;
  last: boolean;
}) {
  const [ref, inView] = useInView<HTMLLIElement>();

  return (
    <li
      ref={ref}
      className={cx(
        "tl-entry grid grid-cols-[1.25rem_1fr] gap-x-4 sm:grid-cols-[1.5rem_1fr] sm:gap-x-6",
        inView && "tl-in",
        last ? "pb-0" : "pb-10 sm:pb-12",
      )}
    >
      {/* Cột trái: chấm mốc, và đoạn đường kẻ nối xuống mốc sau. */}
      <div aria-hidden className="relative flex justify-center">
        <span
          className={cx(
            "tl-dot relative z-10 mt-2 block rounded-full",
            last ? "bg-gold size-3.5" : "bg-gold/70 size-2.5",
          )}
          style={
            last
              ? {
                  boxShadow:
                    "0 0 0 5px color-mix(in srgb, var(--c-gold) 16%, transparent), 0 0 18px color-mix(in srgb, var(--c-gold) 45%, transparent)",
                }
              : undefined
          }
        />
        {!last ? (
          <span className="tl-line bg-gold/25 absolute top-7 bottom-0 left-1/2 w-px -translate-x-1/2" />
        ) : null}
      </div>

      <div className="tl-text pb-1">
        {entry.date.trim() ? (
          <p className="font-accent text-gold/85 text-[calc(0.95rem*var(--fz-accent,1))] tracking-wide">
            {entry.date}
          </p>
        ) : null}

        {entry.title.trim() ? (
          <h3
            className={cx(
              "font-heading text-cream mt-1 leading-snug text-balance",
              last
                ? "text-[calc(clamp(1.3rem,5.2vw,1.8rem)*var(--fz-heading,1))]"
                : "text-[calc(clamp(1.1rem,4.4vw,1.45rem)*var(--fz-heading,1))]",
            )}
          >
            {entry.title}
          </h3>
        ) : null}

        {entry.note.trim() ? (
          <p className="font-body text-cream/75 mt-2 text-[calc(clamp(0.9rem,3.3vw,1rem)*var(--fz-body,1))] leading-relaxed text-pretty">
            {entry.note}
          </p>
        ) : null}

        {entry.photo ? (
          <div className="mt-4 w-[9.5rem] sm:w-[11rem]">
            {/* Nghiêng so le hai bên cho giống ảnh dán tay vào sổ. */}
            <Polaroid
              image={entry.photo}
              rotate={index % 2 === 0 ? -2.5 : 2.5}
              sizes="(max-width: 640px) 152px, 176px"
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
