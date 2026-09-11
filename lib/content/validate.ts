import {
  MAX_BOARDS,
  MAX_BOARD_PHOTOS,
  MAX_FILMSTRIP_PHOTOS,
  MAX_MESSAGE_PHOTOS,
  MAX_TRACKS,
  SCALE_MAX,
  SCALE_MIN,
} from "./schema";

/**
 * Kiểm cấu trúc nội dung trước khi ghi.
 *
 * Trước đây máy chủ ghi thẳng bất cứ object nào trình sửa gửi lên. Chỉ người
 * đã đăng nhập mới gửi được, nên đây không phải chuyện chặn kẻ xấu — mà là
 * chặn chính mình: một tab mở từ trước khi đổi schema, một lỗi trong trình
 * sửa, hay một ô số nhận nhầm chữ, là ghi ra một bản làm vỡ trang chính. Khi
 * đọc lên, `mergeIntoDefaults` vá được trường THIẾU, nhưng không vá được
 * trường SAI KIỂU — `tracks: "abc"` là trình phát nhạc sập.
 *
 * Nguyên tắc: chặt với những gì trang chính dựa vào để vẽ (URL ảnh, tỉ lệ,
 * kiểu dữ liệu, giới hạn số lượng), rộng tay với chữ trang trí (alt, ghi chú).
 * Chặt quá thì một bản cũ hợp lệ không lưu lại được — tệ không kém.
 */

/** Trả về câu báo lỗi đầu tiên gặp phải, hoặc null nếu hợp lệ. */
type Check = (value: unknown, path: string) => string | null;

const MAX_TEXT = 20_000;
/** Thanh trượt có thể ra 1.0000000002 vì sai số dấu phẩy động. */
const EPSILON = 1e-6;

const text =
  (max = 500): Check =>
  (v, p) =>
    typeof v !== "string"
      ? `${p} phải là chữ`
      : v.length > max
        ? `${p} dài quá ${max} ký tự`
        : null;

const number =
  (min: number, max: number): Check =>
  (v, p) =>
    typeof v !== "number" || !Number.isFinite(v)
      ? `${p} phải là số`
      : v < min - EPSILON || v > max + EPSILON
        ? `${p} phải nằm trong khoảng ${min}–${max}`
        : null;

const bool: Check = (v, p) =>
  typeof v === "boolean" ? null : `${p} phải là bật hoặc tắt`;

const nullable =
  (check: Check): Check =>
  (v, p) =>
    v === null ? null : check(v, p);

const optional =
  (check: Check): Check =>
  (v, p) =>
    v === undefined ? null : check(v, p);

const oneOf =
  (values: readonly string[]): Check =>
  (v, p) =>
    typeof v === "string" && values.includes(v) ? null : `${p} không hợp lệ`;

const list =
  (item: Check, max: number): Check =>
  (v, p) => {
    if (!Array.isArray(v)) return `${p} phải là một danh sách`;
    if (v.length > max) return `${p} có quá ${max} mục`;
    for (let i = 0; i < v.length; i += 1) {
      const error = item(v[i], `${p}[${i + 1}]`);
      if (error) return error;
    }
    return null;
  };

const shape =
  (fields: Record<string, Check>): Check =>
  (v, p) => {
    if (typeof v !== "object" || v === null || Array.isArray(v)) {
      return `${p || "Nội dung"} phải là một khối dữ liệu`;
    }
    const record = v as Record<string, unknown>;
    for (const [key, check] of Object.entries(fields)) {
      const error = check(record[key], p ? `${p}.${key}` : key);
      if (error) return error;
    }
    return null;
  };

/**
 * Đường dẫn ảnh/nhạc: https (kho Blob, ảnh giữ chỗ) hoặc đường dẫn trong
 * trang (tệp tải lên khi chạy ở máy). Chặn chuỗi rỗng và mọi scheme khác:
 * next/image gặp URL lạ là ném lỗi, và cả trang đó sập theo.
 */
const url: Check = (v, p) =>
  typeof v === "string" &&
  v.length > 0 &&
  v.length < 2048 &&
  (v.startsWith("https://") || v.startsWith("/"))
    ? null
    : `${p} phải là đường dẫn https hoặc đường dẫn trong trang`;

/** Màu: không cho dấu chấm phẩy hay nháy — màu đi thẳng vào thuộc tính style. */
const color: Check = (v, p) =>
  typeof v === "string" && /^[#a-zA-Z0-9(),.%\s-]{1,40}$/.test(v)
    ? null
    : `${p} không phải một mã màu hợp lệ`;

const isoDate: Check = (v, p) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v))
    ? null
    : `${p} không phải một mốc thời gian hợp lệ`;

const aspect = oneOf(["1:1", "4:5", "3:4", "4:3", "16:9", "9:16"]);

const image = shape({
  id: text(200),
  url,
  // Chữ trang trí: thiếu cũng không làm vỡ gì, nên không bắt buộc.
  alt: optional(text(500)),
  note: optional(text(500)),
  aspect,
});

const fontSet = shape({
  heading: text(80),
  body: text(80),
  accent: text(80),
});

const typeStyle = shape({
  scale: number(SCALE_MIN, SCALE_MAX),
  weight: number(100, 900),
  italic: bool,
});

const typeSet = shape({
  heading: typeStyle,
  body: typeStyle,
  accent: typeStyle,
});

const styled = { fonts: fontSet, typography: typeSet };

const siteContent = shape({
  recipientName: text(100),
  documentTitle: text(200),

  theme: shape({
    base: color,
    deep: color,
    paper: color,
    ink: color,
    cream: color,
    gold: color,
    sage: color,
    mist: color,
  }),

  countdown: shape({
    revealAt: nullable(isoDate),
    title: text(300),
    subtitle: text(1000),
    unlockedNote: text(300),
    ...styled,
  }),

  landing: shape({
    headline: text(300),
    subline: text(500),
    passphrase: shape({
      enabled: bool,
      title: text(200),
      hint: text(500),
      placeholder: text(200),
      submitLabel: text(100),
      errorText: text(300),
      answers: list(text(200), 50),
    }),
    ...styled,
  }),

  hub: shape({
    title: text(300),
    options: list(
      shape({
        key: oneOf(["message", "memories", "flowers"]),
        label: text(100),
        icon: nullable(image),
      }),
      3,
    ),
    musicHint: text(500),
    ...styled,
  }),

  message: shape({
    photos: list(image, MAX_MESSAGE_PHOTOS),
    heading: text(500),
    body: text(MAX_TEXT),
    signature: text(300),
    ...styled,
  }),

  memories: shape({
    heading: text(300),
    intro: text(MAX_TEXT),
    filmstrip: list(image, MAX_FILMSTRIP_PHOTOS),
    boards: list(
      shape({
        id: text(200),
        title: text(300),
        background: nullable(image),
        backgroundDim: number(0, 1),
        photos: list(image, MAX_BOARD_PHOTOS),
      }),
      MAX_BOARDS,
    ),
    ...styled,
  }),

  flowers: shape({
    heading: text(300),
    intro: text(MAX_TEXT),
    shuffleLabel: text(100),
    secretLabel: text(100),
    finale: shape({
      polaroid: nullable(image),
      caption: text(2000),
      closing: text(300),
    }),
    ...styled,
  }),

  music: shape({
    startOnEnvelopeOpen: bool,
    volume: number(0, 1),
    loopPlaylist: bool,
    shuffle: bool,
    tracks: list(
      shape({
        id: text(200),
        title: text(300),
        artist: text(300),
        url,
      }),
      MAX_TRACKS,
    ),
  }),

  teddie: (() => {
    const spot = shape({
      image: nullable(image),
      lines: list(text(300), 20),
    });
    return shape({
      enabled: bool,
      tapHint: text(300),
      hub: spot,
      message: spot,
      memories: spot,
      flowers: spot,
      ...styled,
    });
  })(),
});

/**
 * Kiểm một bản nội dung sắp được ghi.
 * Trả về câu báo lỗi đọc được cho người (kèm vị trí trường sai), hoặc null.
 */
export function validateContent(value: unknown): string | null {
  return siteContent(value, "");
}
