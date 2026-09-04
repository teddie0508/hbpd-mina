"use client";

import { motion } from "motion/react";

import {
  BOUQUET_BASE,
  round3,
  BOUQUET_VIEWBOX,
  leafPoint,
  stemPath,
  stemTip,
  type Bouquet as BouquetData,
  type Stem,
} from "@/lib/bouquet";

/**
 * Vẽ một bó hoa đã được sinh sẵn.
 * Tất cả là SVG nên nét ở mọi kích thước và không cần file ảnh nào.
 */
export function Bouquet({ bouquet }: { bouquet: BouquetData }) {
  return (
    <motion.svg
      key={bouquet.seed}
      viewBox={`${BOUQUET_VIEWBOX.minX} ${BOUQUET_VIEWBOX.minY} ${BOUQUET_VIEWBOX.width} ${BOUQUET_VIEWBOX.height}`}
      className="h-auto w-full max-w-[min(86vw,30rem)] drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      role="img"
      aria-label="Bó hoa được ghép ngẫu nhiên"
    >
      {/* Thân và lá vẽ trước, để bông hoa luôn nằm trên cùng. */}
      <g>
        {bouquet.stems.map((stem) => (
          <StemArt key={stem.id} stem={stem} />
        ))}
      </g>

      <g>
        {bouquet.stems.map((stem, i) => {
          const tip = stemTip(stem);
          return (
            // Thẻ ngoài tĩnh, chỉ lo đặt vị trí bằng thuộc tính transform của SVG.
            // Gộp chung thì CSS transform do motion ghi ra sẽ đè mất thuộc tính này,
            // và mọi bông hoa dồn hết về gốc toạ độ.
            <g
              key={stem.id}
              transform={`translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)}) rotate(${stem.spin.toFixed(0)})`}
            >
              <motion.g
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.12 + i * 0.035,
                  ease: [0.34, 1.4, 0.64, 1],
                }}
                style={{ transformOrigin: "0px 0px" }}
              >
                <Flower stem={stem} />
              </motion.g>
            </g>
          );
        })}
      </g>

      <Wrap bouquet={bouquet} />
    </motion.svg>
  );
}

function StemArt({ stem }: { stem: Stem }) {
  return (
    <g>
      <motion.path
        d={stemPath(stem)}
        fill="none"
        stroke={stem.stemColor}
        strokeWidth={stem.width}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
      {stem.leaves.map((leaf, i) => {
        const point = leafPoint(stem, leaf);
        return (
          <motion.ellipse
            key={i}
            cx={0}
            cy={0}
            rx={leaf.size}
            ry={leaf.size * 0.38}
            fill={stem.stemColor}
            opacity={0.85}
            transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(${(leaf.tilt + leaf.side * 34).toFixed(0)}) translate(${(leaf.side * leaf.size).toFixed(1)} 0)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          />
        );
      })}
    </g>
  );
}

/** Bốn kiểu hoa, đủ để bó nào cũng khác bó nào mà vẫn cùng một ngôn ngữ hình. */
function Flower({ stem }: { stem: Stem }) {
  const { kind, size, petals, petalColor, centerColor } = stem;

  if (kind === "berry") {
    const dots = Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      return {
        x: round3(Math.cos(angle) * size * 0.55),
        y: round3(Math.sin(angle) * size * 0.55),
      };
    });
    return (
      <g>
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={size * 0.3}
            fill={petalColor}
          />
        ))}
        <circle cx={0} cy={0} r={size * 0.32} fill={centerColor} />
      </g>
    );
  }

  if (kind === "tulip") {
    return (
      <g>
        <path
          d={`M ${-size * 0.62} ${size * 0.2} C ${-size * 0.72} ${-size * 0.7}, ${size * 0.72} ${-size * 0.7}, ${size * 0.62} ${size * 0.2} C ${size * 0.3} ${size * 0.62}, ${-size * 0.3} ${size * 0.62}, ${-size * 0.62} ${size * 0.2} Z`}
          fill={petalColor}
        />
        <path
          d={`M ${-size * 0.2} ${size * 0.36} C ${-size * 0.34} ${-size * 0.5}, ${size * 0.34} ${-size * 0.5}, ${size * 0.2} ${size * 0.36} Z`}
          fill={centerColor}
          opacity={0.55}
        />
      </g>
    );
  }

  if (kind === "rose") {
    // Vài vòng cánh thu nhỏ dần, gợi hình xoáy của bông hồng.
    const rings = [1, 0.72, 0.48, 0.26];
    return (
      <g>
        {rings.map((scale, i) => (
          <circle
            key={i}
            cx={0}
            cy={0}
            r={size * 0.62 * scale}
            fill={i % 2 === 0 ? petalColor : centerColor}
            opacity={i === 0 ? 1 : 0.9}
          />
        ))}
        <path
          d={`M 0 ${-size * 0.2} A ${size * 0.2} ${size * 0.2} 0 1 1 ${-size * 0.01} ${-size * 0.2}`}
          fill="none"
          stroke={centerColor}
          strokeWidth={size * 0.09}
          opacity={0.7}
        />
      </g>
    );
  }

  // daisy
  return (
    <g>
      {Array.from({ length: petals }, (_, i) => {
        const angle = (360 / petals) * i;
        return (
          <ellipse
            key={i}
            cx={0}
            cy={-size * 0.52}
            rx={size * 0.24}
            ry={size * 0.52}
            fill={petalColor}
            transform={`rotate(${angle})`}
          />
        );
      })}
      <circle cx={0} cy={0} r={size * 0.3} fill={centerColor} />
    </g>
  );
}

/** Giấy gói và dải ruy băng buộc ở gốc bó. */
function Wrap({ bouquet }: { bouquet: BouquetData }) {
  const { x, y } = BOUQUET_BASE;
  return (
    <motion.g
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <path
        d={`M ${x - 44} ${y - 18} L ${x + 44} ${y - 18} L ${x + 19} ${y + 44} L ${x - 19} ${y + 44} Z`}
        fill={bouquet.wrapColor}
        opacity={0.92}
      />
      <path
        d={`M ${x - 44} ${y - 18} L ${x} ${y - 6} L ${x - 19} ${y + 44} Z`}
        fill="#000"
        opacity={0.07}
      />
      <rect
        x={x - 28}
        y={y - 4}
        width={56}
        height={9}
        rx={4.5}
        fill={bouquet.ribbonColor}
      />
      {/* Hai vòng nơ và hai dải rủ xuống. */}
      <ellipse
        cx={x - 13}
        cy={y + 1}
        rx={9}
        ry={6.5}
        fill={bouquet.ribbonColor}
      />
      <ellipse
        cx={x + 13}
        cy={y + 1}
        rx={9}
        ry={6.5}
        fill={bouquet.ribbonColor}
      />
      <path
        d={`M ${x - 3} ${y + 4} C ${x - 8} ${y + 18}, ${x - 14} ${y + 24}, ${x - 10} ${y + 34}`}
        fill="none"
        stroke={bouquet.ribbonColor}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      <path
        d={`M ${x + 3} ${y + 4} C ${x + 8} ${y + 18}, ${x + 15} ${y + 22}, ${x + 11} ${y + 33}`}
        fill="none"
        stroke={bouquet.ribbonColor}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
    </motion.g>
  );
}
