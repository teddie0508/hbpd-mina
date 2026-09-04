/**
 * Danh sách font cho phép chọn ở /customize.
 * Font được nạp động bằng <link> Google Fonts dựng từ đúng những key đang dùng,
 * nên thêm font vào đây là dùng được ngay, không cần build lại gì khác.
 *
 * `vietnamese: false` = font KHÔNG có dấu tiếng Việt. Vẫn giữ lại vì nhiều font
 * script đẹp nhất chỉ có bảng Latin — hợp cho tiêu đề tiếng Anh.
 * Trang /customize sẽ gắn cảnh báo cho những font này.
 */

export type FontCategory = "script" | "hand" | "display" | "serif" | "sans";

export interface FontDef {
  key: string;
  label: string;
  family: string;
  /** Phần sau `family=` trong URL Google Fonts CSS2. */
  spec: string;
  category: FontCategory;
  vietnamese: boolean;
  /** Font dự phòng khi Google Fonts chưa tải xong. */
  fallback: string;
}

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const CURSIVE = "'Segoe Script', 'Snell Roundhand', cursive";

export const FONTS: FontDef[] = [
  // --- Script: có dấu tiếng Việt ---
  {
    key: "dancing",
    label: "Dancing Script",
    family: "Dancing Script",
    spec: "Dancing+Script:wght@400..700",
    category: "script",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "pacifico",
    label: "Pacifico",
    family: "Pacifico",
    spec: "Pacifico",
    category: "script",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "lobster",
    label: "Lobster",
    family: "Lobster",
    spec: "Lobster",
    category: "script",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "lobster-two",
    label: "Lobster Two",
    family: "Lobster Two",
    spec: "Lobster+Two:ital,wght@0,400;0,700;1,400;1,700",
    category: "script",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "charmonman",
    label: "Charmonman",
    family: "Charmonman",
    spec: "Charmonman:wght@400;700",
    category: "script",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "charm",
    label: "Charm",
    family: "Charm",
    spec: "Charm:wght@400;700",
    category: "script",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "sriracha",
    label: "Sriracha",
    family: "Sriracha",
    spec: "Sriracha",
    category: "script",
    vietnamese: true,
    fallback: CURSIVE,
  },

  // --- Script: CHỈ có Latin, không dấu tiếng Việt ---
  {
    key: "great-vibes",
    label: "Great Vibes",
    family: "Great Vibes",
    spec: "Great+Vibes",
    category: "script",
    vietnamese: false,
    fallback: CURSIVE,
  },
  {
    key: "parisienne",
    label: "Parisienne",
    family: "Parisienne",
    spec: "Parisienne",
    category: "script",
    vietnamese: false,
    fallback: CURSIVE,
  },
  {
    key: "sacramento",
    label: "Sacramento",
    family: "Sacramento",
    spec: "Sacramento",
    category: "script",
    vietnamese: false,
    fallback: CURSIVE,
  },
  {
    key: "allura",
    label: "Allura",
    family: "Allura",
    spec: "Allura",
    category: "script",
    vietnamese: false,
    fallback: CURSIVE,
  },
  {
    key: "alex-brush",
    label: "Alex Brush",
    family: "Alex Brush",
    spec: "Alex+Brush",
    category: "script",
    vietnamese: false,
    fallback: CURSIVE,
  },
  {
    key: "kaushan",
    label: "Kaushan Script",
    family: "Kaushan Script",
    spec: "Kaushan+Script",
    category: "script",
    vietnamese: false,
    fallback: CURSIVE,
  },
  {
    key: "caveat",
    label: "Caveat",
    family: "Caveat",
    spec: "Caveat:wght@400..700",
    category: "hand",
    vietnamese: false,
    fallback: CURSIVE,
  },

  // --- Viết tay: có dấu tiếng Việt ---
  {
    key: "mali",
    label: "Mali",
    family: "Mali",
    spec: "Mali:ital,wght@0,300;0,400;0,600;1,400",
    category: "hand",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "itim",
    label: "Itim",
    family: "Itim",
    spec: "Itim",
    category: "hand",
    vietnamese: true,
    fallback: CURSIVE,
  },
  {
    key: "patrick-hand",
    label: "Patrick Hand",
    family: "Patrick Hand",
    spec: "Patrick+Hand",
    category: "hand",
    vietnamese: true,
    fallback: CURSIVE,
  },

  // --- Display / Serif: có dấu tiếng Việt ---
  {
    key: "playfair",
    label: "Playfair Display",
    family: "Playfair Display",
    spec: "Playfair+Display:ital,wght@0,400..800;1,400..700",
    category: "display",
    vietnamese: true,
    fallback: SERIF,
  },
  {
    key: "cormorant",
    label: "Cormorant Garamond",
    family: "Cormorant Garamond",
    spec: "Cormorant+Garamond:ital,wght@0,300..700;1,300..700",
    category: "serif",
    vietnamese: true,
    fallback: SERIF,
  },
  {
    key: "eb-garamond",
    label: "EB Garamond",
    family: "EB Garamond",
    spec: "EB+Garamond:ital,wght@0,400..700;1,400..700",
    category: "serif",
    vietnamese: true,
    fallback: SERIF,
  },
  {
    key: "lora",
    label: "Lora",
    family: "Lora",
    spec: "Lora:ital,wght@0,400..700;1,400..700",
    category: "serif",
    vietnamese: true,
    fallback: SERIF,
  },
  {
    key: "noto-serif",
    label: "Noto Serif",
    family: "Noto Serif",
    spec: "Noto+Serif:ital,wght@0,300..700;1,300..700",
    category: "serif",
    vietnamese: true,
    fallback: SERIF,
  },
  {
    key: "yeseva",
    label: "Yeseva One",
    family: "Yeseva One",
    spec: "Yeseva+One",
    category: "display",
    vietnamese: true,
    fallback: SERIF,
  },
  {
    key: "bricolage",
    label: "Bricolage Grotesque",
    family: "Bricolage Grotesque",
    spec: "Bricolage+Grotesque:opsz,wght@10..48,300..800",
    category: "display",
    vietnamese: true,
    fallback: SANS,
  },

  // --- Sans: có dấu tiếng Việt ---
  {
    key: "be-vietnam",
    label: "Be Vietnam Pro",
    family: "Be Vietnam Pro",
    spec: "Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400",
    category: "sans",
    vietnamese: true,
    fallback: SANS,
  },
  {
    key: "quicksand",
    label: "Quicksand",
    family: "Quicksand",
    spec: "Quicksand:wght@300..700",
    category: "sans",
    vietnamese: true,
    fallback: SANS,
  },
  {
    key: "nunito",
    label: "Nunito",
    family: "Nunito",
    spec: "Nunito:ital,wght@0,300..800;1,300..700",
    category: "sans",
    vietnamese: true,
    fallback: SANS,
  },
  {
    key: "montserrat",
    label: "Montserrat",
    family: "Montserrat",
    spec: "Montserrat:ital,wght@0,300..800;1,300..700",
    category: "sans",
    vietnamese: true,
    fallback: SANS,
  },
  {
    key: "josefin",
    label: "Josefin Sans",
    family: "Josefin Sans",
    spec: "Josefin+Sans:ital,wght@0,300..700;1,300..700",
    category: "sans",
    vietnamese: true,
    fallback: SANS,
  },
  {
    key: "lexend",
    label: "Lexend",
    family: "Lexend",
    spec: "Lexend:wght@300..700",
    category: "sans",
    vietnamese: true,
    fallback: SANS,
  },
  {
    key: "manrope",
    label: "Manrope",
    family: "Manrope",
    spec: "Manrope:wght@300..800",
    category: "sans",
    vietnamese: true,
    fallback: SANS,
  },
];

const BY_KEY = new Map(FONTS.map((f) => [f.key, f]));

export const FALLBACK_FONT_KEY = "be-vietnam";

export function getFont(key: string): FontDef {
  return BY_KEY.get(key) ?? BY_KEY.get(FALLBACK_FONT_KEY)!;
}

/** Giá trị đặt thẳng vào CSS `font-family`. */
export function fontStack(key: string): string {
  const f = getFont(key);
  return `'${f.family}', ${f.fallback}`;
}

/**
 * Dựng URL Google Fonts cho đúng những font đang được dùng.
 * Trả về null nếu không có font nào (không render thẻ <link> thừa).
 */
export function googleFontsHref(keys: Iterable<string>): string | null {
  const specs = [...new Set([...keys].map((k) => getFont(k).spec))].sort();
  if (specs.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${specs
    .map((s) => `family=${s}`)
    .join("&")}&display=swap`;
}

export const FONT_CATEGORY_LABEL: Record<FontCategory, string> = {
  script: "Chữ ký / thư pháp",
  hand: "Viết tay",
  display: "Tiêu đề",
  serif: "Có chân",
  sans: "Không chân",
};
