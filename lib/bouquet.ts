/**
 * Sinh bó hoa ngẫu nhiên từ một con số seed.
 * Cùng seed thì ra đúng cùng một bó — nhờ vậy HTML dựng ở máy chủ và ở trình
 * duyệt khớp nhau, mà bấm "đổi bó" vẫn ra bó hoàn toàn khác.
 */

export type FlowerKind = "daisy" | "tulip" | "rose" | "berry";

export interface Leaf {
  /** Vị trí trên thân, 0 = gốc, 1 = ngọn. */
  at: number;
  side: 1 | -1;
  size: number;
  tilt: number;
}

export interface Stem {
  id: string;
  /** Độ lệch so với phương thẳng đứng; âm là ngả trái. */
  angle: number;
  length: number;
  /** Độ cong của thân. */
  bend: number;
  width: number;
  stemColor: string;
  leaves: Leaf[];
  kind: FlowerKind;
  size: number;
  petals: number;
  petalColor: string;
  centerColor: string;
  spin: number;
}

export interface Bouquet {
  seed: number;
  stems: Stem[];
  ribbonColor: string;
  wrapColor: string;
}

/**
 * Khung nhìn được cắt vừa khít phần có hình.
 * Cành dài nhất ~178 đơn vị, ngả tối đa 62°, bông bán kính tối đa ~21:
 * mép ngang xa nhất là 170 ± (sin 62° × 158 + 21) ≈ 9 và 330, nên bề ngang 340
 * là vừa đủ. minY 55 cắt bỏ khoảng trống thừa phía trên.
 */
export const BOUQUET_VIEWBOX = { minX: 0, minY: 45, width: 360, height: 275 };
export const BOUQUET_BASE = { x: 180, y: 265 };

/** Màu cánh hoa: giữ trong tông xanh - vàng - be để hợp phần còn lại của trang. */
const PETAL_COLORS = [
  "#EBCE8A",
  "#F4E7CC",
  "#AFC9B9",
  "#93B3C6",
  "#DCCDB4",
  "#F1F0E9",
  "#C9A94F",
  "#BFD6C6",
];

const CENTER_COLORS = ["#C79A3C", "#E4D3A6", "#8FA98F", "#D8C08A"];
const STEM_COLORS = ["#4F7362", "#5E8571", "#6B9179", "#456254"];
const RIBBON_COLORS = ["#D2AC5E", "#A8C3B4", "#DCCDB4", "#8FB0C4"];
const WRAP_COLORS = ["#F0E7D6", "#E7DCC6", "#EFEFE7"];

const KINDS: FlowerKind[] = ["daisy", "daisy", "tulip", "rose", "berry"];

/** mulberry32 — nhỏ gọn, phân bố đủ tốt cho việc trang trí. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateBouquet(seed: number): Bouquet {
  const random = makeRandom(seed);
  const pick = <T>(list: T[]): T => list[Math.floor(random() * list.length)];
  const between = (min: number, max: number) => min + random() * (max - min);

  const count = Math.round(between(13, 19));
  const spread = between(46, 62);

  const stems: Stem[] = Array.from({ length: count }, (_, i) => {
    // Rải đều theo hình quạt rồi thêm nhiễu, để bó không bị đối xứng cứng nhắc.
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = (t - 0.5) * 2 * spread + between(-5, 5);

    // Cành giữa vươn cao hơn cành mép, cho bó có vòm.
    const heightBias = 1 - Math.abs(t - 0.5) * 0.85;
    const length = between(96, 132) + heightBias * between(24, 46);

    const kind = pick(KINDS);
    const leafCount = Math.round(between(1, 3));

    return {
      id: `s${i}`,
      angle,
      length,
      bend: between(-22, 22),
      width: between(2.2, 3.4),
      stemColor: pick(STEM_COLORS),
      leaves: Array.from({ length: leafCount }, () => ({
        at: between(0.3, 0.72),
        side: random() < 0.5 ? -1 : 1,
        size: between(12, 20),
        tilt: between(-24, 24),
      })),
      kind,
      // Bán kính hình vẽ xấp xỉ bằng size, nên đây cũng là nửa bề ngang bông hoa.
      size: kind === "berry" ? between(12, 18) : between(16, 26),
      petals: Math.round(between(5, 9)),
      petalColor: pick(PETAL_COLORS),
      centerColor: pick(CENTER_COLORS),
      spin: between(0, 360),
    };
  });

  // Cành ngắn vẽ trước để cành cao nổi lên trên.
  stems.sort((a, b) => b.length - a.length);

  return {
    seed,
    stems,
    ribbonColor: pick(RIBBON_COLORS),
    wrapColor: pick(WRAP_COLORS),
  };
}

/**
 * Làm tròn trước khi số chạm vào DOM.
 * Math.sin/cos có thể lệch đúng một chữ số cuối giữa Node và trình duyệt,
 * đủ để React kêu hydration mismatch.
 */
export const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Điểm ngọn của một cành, nơi đặt bông hoa. */
export function stemTip(stem: Stem): { x: number; y: number } {
  const rad = (stem.angle * Math.PI) / 180;
  return {
    x: round3(BOUQUET_BASE.x + Math.sin(rad) * stem.length),
    y: round3(BOUQUET_BASE.y - Math.cos(rad) * stem.length),
  };
}

/** Đường cong của thân, từ gốc bó lên tới ngọn. */
export function stemPath(stem: Stem): string {
  const tip = stemTip(stem);
  const midX = (BOUQUET_BASE.x + tip.x) / 2;
  const midY = (BOUQUET_BASE.y + tip.y) / 2;
  // Đẩy điểm điều khiển theo phương vuông góc với thân để tạo độ cong.
  const rad = (stem.angle * Math.PI) / 180;
  const cx = midX + Math.cos(rad) * stem.bend;
  const cy = midY + Math.sin(rad) * stem.bend;
  return `M ${BOUQUET_BASE.x} ${BOUQUET_BASE.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
}

/** Điểm đặt lá, nội suy trên đường cong bậc hai của thân. */
export function leafPoint(stem: Stem, leaf: Leaf): { x: number; y: number } {
  const tip = stemTip(stem);
  const rad = (stem.angle * Math.PI) / 180;
  const midX = (BOUQUET_BASE.x + tip.x) / 2;
  const midY = (BOUQUET_BASE.y + tip.y) / 2;
  const cx = midX + Math.cos(rad) * stem.bend;
  const cy = midY + Math.sin(rad) * stem.bend;

  const t = leaf.at;
  const inv = 1 - t;
  return {
    x: round3(inv * inv * BOUQUET_BASE.x + 2 * inv * t * cx + t * t * tip.x),
    y: round3(inv * inv * BOUQUET_BASE.y + 2 * inv * t * cy + t * t * tip.y),
  };
}

/** Seed mới cho mỗi lần bấm "đổi bó". */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}
