/**
 * Toàn bộ nội dung của trang được mô tả bằng object này.
 * Trang chính chỉ đọc; trang /customize là nơi duy nhất ghi.
 * Thêm field ở đây -> nhớ thêm giá trị mặc định trong defaults.ts.
 */

/** Tỉ lệ khung ảnh, dùng cho cả hiển thị lẫn khung cắt ảnh ở /customize. */
export type AspectRatio = "1:1" | "4:5" | "3:4" | "4:3" | "16:9" | "9:16";

export const ASPECT_VALUE: Record<AspectRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

/** Giá trị đặt thẳng vào CSS `aspect-ratio`. */
export const ASPECT_CSS: Record<AspectRatio, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "3:4": "3 / 4",
  "4:3": "4 / 3",
  "16:9": "16 / 9",
  "9:16": "9 / 16",
};

export interface ImageAsset {
  id: string;
  url: string;
  alt: string;
  /**
   * Dòng ghi chú ở mặt sau tấm ảnh, kiểu "19/08 — lần đầu gặp em".
   * Để trống thì ảnh không lật được.
   *
   * Không bắt buộc vì ảnh lưu từ trước không có trường này; mọi chỗ đọc phải
   * lường trước giá trị undefined.
   */
  note?: string;
  /** Tỉ lệ ảnh đã được cắt theo, để trang chính render đúng khung. */
  aspect: AspectRatio;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

/** Mỗi khối nội dung tự chọn font riêng. Giá trị là `key` trong lib/fonts.ts. */
export interface FontSet {
  /** Tiêu đề lớn. */
  heading: string;
  /** Đoạn văn dài. */
  body: string;
  /** Chữ ký, caption, dòng nhấn nhá. */
  accent: string;
}

/** Cách trình bày một vai trò chữ: to nhỏ, đậm nhạt, nghiêng hay không. */
export interface TypeStyle {
  /**
   * Hệ số nhân cỡ chữ so với thiết kế gốc. 1 = giữ nguyên.
   * Dùng hệ số thay vì px tuyệt đối để chữ vẫn co giãn theo bề ngang màn hình:
   * mỗi chỗ đã có sẵn một clamp() riêng, hệ số chỉ nhân lên trên đó.
   */
  scale: number;
  /** 300..800. Font không có sẵn nét đó thì trình duyệt tự làm đậm/mảnh giả. */
  weight: number;
  italic: boolean;
}

export interface TypeSet {
  heading: TypeStyle;
  body: TypeStyle;
  accent: TypeStyle;
}

export const TYPE_ROLES = ["heading", "body", "accent"] as const;
export type TypeRole = (typeof TYPE_ROLES)[number];

/** Khoảng cho phép của hệ số cỡ chữ. */
export const SCALE_MIN = 0.7;
export const SCALE_MAX = 1.6;

export const WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800] as const;

export interface ThemeColors {
  /** Nền sâu nhất của trang. */
  base: string;
  /** Nền phụ, dùng cho vignette và khối nổi. */
  deep: string;
  /** Màu giấy / thẻ / polaroid. */
  paper: string;
  /** Chữ trên nền giấy. */
  ink: string;
  /** Chữ trên nền tối. */
  cream: string;
  /** Màu nhấn chính (vàng đồng). */
  gold: string;
  /** Màu nhấn phụ (xanh lá dịu). */
  sage: string;
  /** Xám khói cho viền và chữ mờ. */
  mist: string;
}

/**
 * Lớp hỏi tên hiện ra sau khi chạm phong bì.
 *
 * Gọi là "mật khẩu" cho vui chứ mục đích là tạo bất ngờ, nên: gõ hoa hay
 * thường, có dấu hay không dấu đều qua (xem `lib/passphrase.ts`), và ô nhập
 * để chữ hiện rõ chứ không che bằng dấu chấm.
 */
export interface PassphraseContent {
  enabled: boolean;
  title: string;
  /** Dòng gợi ý ngay dưới ô nhập. */
  hint: string;
  placeholder: string;
  submitLabel: string;
  /** Hiện khi trả lời sai. */
  errorText: string;
  /**
   * Các đáp án được chấp nhận.
   *
   * KHÔNG BAO GIỜ để danh sách này rơi xuống trình duyệt — `forClient()` cắt
   * nó đi, và phần so đáp án nằm trong Server Action. Nếu không thì chỉ cần
   * mở View Source là thấy hết, hỏng mất bất ngờ.
   */
  answers: string[];
}

export interface LandingContent {
  headline: string;
  subline: string;
  passphrase: PassphraseContent;
  fonts: FontSet;
  typography: TypeSet;
}

export interface CountdownContent {
  /** ISO 8601 kèm offset, vd "2025-11-02T00:00:00+07:00". null = mở khoá luôn. */
  revealAt: string | null;
  title: string;
  subtitle: string;
  /** Dòng hiện đúng lúc đồng hồ về 0, trước khi chuyển sang phong bì. */
  unlockedNote: string;
  /** Font riêng: màn này luôn là tiếng Việt nên mặc định chọn font có dấu. */
  fonts: FontSet;
  typography: TypeSet;
}

export type HubKey = "message" | "memories" | "flowers";

export interface HubOption {
  key: HubKey;
  label: string;
  /** null = hiện ô placeholder chờ bạn tải icon lên. */
  icon: ImageAsset | null;
}

export interface HubContent {
  title: string;
  options: HubOption[];
  fonts: FontSet;
  typography: TypeSet;
}

export interface MessageContent {
  /** Polaroid xếp chồng ở đầu trang. Tối đa MAX_MESSAGE_PHOTOS. */
  photos: ImageAsset[];
  heading: string;
  /** Ngăn đoạn bằng dòng trống. */
  body: string;
  signature: string;
  fonts: FontSet;
  typography: TypeSet;
}

export interface MemoryBoard {
  id: string;
  title: string;
  /** Ảnh nền của cả khối. null = dùng màu nền phẳng. */
  background: ImageAsset | null;
  /** 0..1 — độ phủ màu nền lên ảnh background cho chữ dễ đọc. */
  backgroundDim: number;
  /** Ảnh vuông rải quanh khối. Tối đa MAX_BOARD_PHOTOS. */
  photos: ImageAsset[];
}

export interface MemoriesContent {
  heading: string;
  intro: string;
  /** Ảnh dải phim bên trái phần intro. */
  filmstrip: ImageAsset[];
  boards: MemoryBoard[];
  fonts: FontSet;
  typography: TypeSet;
}

export interface FlowersContent {
  heading: string;
  intro: string;
  shuffleLabel: string;
  /** Dòng chữ bí mật nấp ở góc màn hình. */
  secretLabel: string;
  finale: {
    polaroid: ImageAsset | null;
    caption: string;
    closing: string;
  };
  fonts: FontSet;
  typography: TypeSet;
}

export interface MusicContent {
  /** Nhạc luôn cần một cú chạm để phát (trình duyệt chặn autoplay); cú chạm đó là lúc mở phong bì. */
  startOnEnvelopeOpen: boolean;
  /** 0..1 */
  volume: number;
  loopPlaylist: boolean;
  tracks: Track[];
}

export interface SiteContent {
  /** Tăng khi đổi cấu trúc để biết bản lưu cũ cần nâng cấp. */
  version: number;
  updatedAt: string;
  recipientName: string;
  documentTitle: string;
  theme: ThemeColors;
  countdown: CountdownContent;
  landing: LandingContent;
  hub: HubContent;
  message: MessageContent;
  memories: MemoriesContent;
  flowers: FlowersContent;
  music: MusicContent;
}

/**
 * Bản nội dung an toàn để gửi xuống trình duyệt.
 *
 * Cả `<ContentProvider>` ở layout gốc lẫn trang bìa đều đẩy nguyên object này
 * vào payload của React, tức là nó nằm sẵn trong HTML ai xem cũng đọc được.
 * Đáp án của lớp hỏi tên phải cắt đi trước, không thì mở View Source là biết
 * ngay phải gõ gì.
 */
export function forClient(content: SiteContent): SiteContent {
  return {
    ...content,
    landing: {
      ...content.landing,
      passphrase: { ...content.landing.passphrase, answers: [] },
    },
  };
}

export const CONTENT_VERSION = 1;

export const MAX_MESSAGE_PHOTOS = 5;
export const MAX_BOARD_PHOTOS = 8;
export const MAX_FILMSTRIP_PHOTOS = 6;
export const MAX_BOARDS = 6;
export const MAX_TRACKS = 12;

/** Tỉ lệ bắt buộc cho từng chỗ dùng ảnh — khung cắt ở /customize đọc bảng này. */
export const SLOT_ASPECT = {
  messagePhoto: "4:5",
  hubIcon: "1:1",
  filmstrip: "1:1",
  boardPhoto: "1:1",
  boardBackground: "16:9",
  finalePolaroid: "4:5",
} as const satisfies Record<string, AspectRatio>;

export type ImageSlot = keyof typeof SLOT_ASPECT;

/**
 * Cạnh dài nhất khi lưu ảnh, riêng cho từng vị trí.
 *
 * Cắt theo chỗ sẽ dùng chứ không cào bằng: ảnh nền trải rộng cả khối nên cần
 * nhiều điểm ảnh hơn hẳn, còn icon thì to cũng chẳng để làm gì. Con số đặt
 * bằng bề ngang lớn nhất mà ảnh được vẽ ra, nhân đôi cho màn Retina.
 */
export const SLOT_MAX_EDGE: Record<ImageSlot, number> = {
  // Trải hết bề ngang khối (tối đa 1024) → cần khoảng 2048 trên màn Retina.
  boardBackground: 2560,
  // Polaroid rộng nhất khoảng 272 → 544 là đủ, để dư cho thoải mái.
  messagePhoto: 1400,
  finalePolaroid: 1400,
  // Ảnh vuông nhỏ trong khối và trên dải phim.
  boardPhoto: 900,
  filmstrip: 600,
  hubIcon: 512,
};
