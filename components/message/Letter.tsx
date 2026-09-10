"use client";

import { WordsReveal } from "@/components/ui/WordsReveal";

/** Một bông hoa nhỏ: năm cánh quanh một nhuỵ. */
function Blossom({
  x,
  y,
  r = 5,
  rot = 0,
}: {
  x: number;
  y: number;
  r?: number;
  rot?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx={0}
          cy={-r * 0.82}
          rx={r * 0.52}
          ry={r * 0.82}
          transform={`rotate(${angle})`}
          fill="var(--bloom)"
        />
      ))}
      <circle r={r * 0.3} fill="var(--bloom-heart)" />
    </g>
  );
}

/**
 * Nhành hoa ở góc trên bên phải tờ giấy.
 *
 * viewBox cố ý bẹt (220×100) chứ không vuông: nhành hoa càng cao thì càng
 * phải chừa nhiều lề trên cho chữ khỏi chui xuống dưới nó, mà lề trên lại
 * phải là bội số của --rule để dòng kẻ không lệch.
 */
function BlossomBranch() {
  return (
    <svg
      viewBox="0 0 220 100"
      aria-hidden
      className="pointer-events-none absolute -top-1 -right-2 w-[46%] max-w-[250px] sm:w-[54%]"
      style={
        {
          "--branch": "color-mix(in srgb, var(--c-ink) 62%, var(--c-gold))",
          "--bloom": "color-mix(in srgb, white 78%, var(--c-paper))",
          "--bloom-heart": "color-mix(in srgb, var(--c-gold) 70%, #9e4a22)",
          "--leaf": "color-mix(in srgb, var(--c-gold) 42%, #9e4a22)",
        } as React.CSSProperties
      }
    >
      <g
        fill="none"
        stroke="var(--branch)"
        strokeLinecap="round"
        strokeWidth="2.1"
      >
        <path d="M219 6 C 196 16, 172 22, 148 33 C 126 43, 104 54, 78 72" />
        <path d="M170 23 C 172 37, 178 48, 192 57" strokeWidth="1.5" />
        <path d="M126 45 C 120 58, 118 68, 124 80" strokeWidth="1.5" />
        <path d="M196 12 C 204 20, 210 24, 216 25" strokeWidth="1.3" />
      </g>

      {/* Lá nhỏ màu gạch, rải dọc theo nhành. */}
      <g fill="var(--leaf)">
        <ellipse
          cx={186}
          cy={17}
          rx={6}
          ry={3}
          transform="rotate(-24 186 17)"
        />
        <ellipse
          cx={149}
          cy={35}
          rx={5.5}
          ry={2.8}
          transform="rotate(18 149 35)"
        />
        <ellipse
          cx={192}
          cy={58}
          rx={5}
          ry={2.6}
          transform="rotate(62 192 58)"
        />
        <ellipse
          cx={124}
          cy={81}
          rx={5}
          ry={2.6}
          transform="rotate(-8 124 81)"
        />
        <ellipse
          cx={99}
          cy={62}
          rx={4.6}
          ry={2.4}
          transform="rotate(34 99 62)"
        />
      </g>

      <Blossom x={205} y={9} r={6.5} rot={12} />
      <Blossom x={176} y={26} r={7.5} rot={-20} />
      <Blossom x={158} y={44} r={5.5} rot={40} />
      <Blossom x={134} y={38} r={6.8} rot={-6} />
      <Blossom x={113} y={58} r={6} rot={26} />
      <Blossom x={86} y={70} r={7} rot={-32} />

      {/* Vài cánh rụng lơ lửng phía dưới, cho góc giấy đỡ trống. */}
      <g fill="var(--bloom)" opacity={0.9}>
        <ellipse
          cx={62}
          cy={88}
          rx={3.4}
          ry={2.1}
          transform="rotate(28 62 88)"
        />
        <ellipse
          cx={143}
          cy={70}
          rx={3}
          ry={1.9}
          transform="rotate(-14 143 70)"
        />
        <ellipse
          cx={168}
          cy={86}
          rx={2.8}
          ry={1.8}
          transform="rotate(46 168 86)"
        />
      </g>
    </svg>
  );
}

/**
 * Đoạn lời nhắn được đặt lên một tờ giấy viết thư có dòng kẻ.
 *
 * Tờ giấy cao thấp theo đúng lượng chữ, không cố định chiều cao.
 *
 * Chỗ dễ sai duy nhất: dòng kẻ và chữ phải cùng một nhịp. `--rule` là bước
 * kẻ, đồng thời là line-height của mọi dòng chữ bên trong, và khoảng cách
 * giữa hai đoạn cũng đúng bằng một --rule. Chỉ cần một chỗ dùng line-height
 * khác là từ đó trở xuống chữ trôi khỏi dòng kẻ.
 */
export function Letter({
  paragraphs,
  signature,
}: {
  paragraphs: string[];
  signature: string;
}) {
  return (
    <article
      className="letter-paper relative mx-auto max-w-2xl overflow-hidden rounded-[3px] shadow-[0_26px_60px_-26px_rgba(0,0,0,0.8)]"
      style={
        {
          // Bước kẻ co giãn cùng cỡ chữ, để tỉ lệ dòng luôn khoảng 1.75 dù
          // màn hình rộng hay hẹp, và dù bạn có chỉnh cỡ chữ ở /customize.
          "--rule": "calc(clamp(1.75rem, 5.9vw, 2rem) * var(--fz-body, 1))",
        } as React.CSSProperties
      }
    >
      {/* Khung viền mảnh chạy quanh mép giấy. */}
      <span
        aria-hidden
        className="border-ink/25 pointer-events-none absolute inset-2 border sm:inset-2.5"
      />

      <BlossomBranch />

      {/* Lề trên phải đủ chứa nhành hoa: nhành cao bằng 100/220 bề ngang của
          nó, nên màn rộng (nhành 250px → 114px) cần bốn dòng kẻ, màn hẹp thì
          ba là vừa. Lề trên đặt bao nhiêu cũng không làm lệch dòng kẻ, vì
          background-origin tính từ mép trong. */}
      <div className="letter-ruled relative px-6 pt-[calc(var(--rule)*3)] pb-[calc(var(--rule)*1.5)] sm:px-10 sm:pt-[calc(var(--rule)*4)]">
        {paragraphs.map((paragraph, i) => (
          <WordsReveal
            key={i}
            text={paragraph}
            delay={i * 0.15}
            className="font-body text-ink/85 mb-[var(--rule)] text-[calc(clamp(1rem,3.4vw,1.15rem)*var(--fz-body,1))] leading-[var(--rule)] text-pretty"
          />
        ))}

        {signature ? (
          <p className="font-accent text-ink/70 text-right text-[calc(clamp(1.05rem,3.8vw,1.45rem)*var(--fz-accent,1))] leading-[var(--rule)]">
            {signature}
          </p>
        ) : null}
      </div>
    </article>
  );
}
