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
   * Dòng ghi chú của tấm ảnh, kiểu "19/08 — lần đầu gặp em". Hiện ngay dưới
   * ảnh khi xem phóng to; để trống thì chỉ có ảnh.
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
   * KHÔNG BAO GIỜ để danh sách này rơi xuống trình duyệt — `forLanding()` chỉ
   * gửi `PublicPassphrase` (không có trường này), và phần so đáp án nằm trong
   * Server Action. Nếu không thì chỉ cần
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
  /** Dòng nhắc kèm mũi tên chỉ vào trình phát nhạc. Để trống là tắt hẳn. */
  musicHint: string;
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

/**
 * Ô viết thư ở cuối trang Hoa, để Mina nhắn lại vài dòng.
 * Thư gửi đi nằm trong hộp thư riêng (lib/inbox.ts), KHÔNG nằm trong nội dung.
 */
export interface ReplyContent {
  enabled: boolean;
  title: string;
  placeholder: string;
  sendLabel: string;
  /** Hiện ra thay cho ô viết sau khi gửi xong. */
  thanks: string;
}

export interface FlowersContent {
  heading: string;
  intro: string;
  shuffleLabel: string;
  /** Chữ trên nút nhỏ dẫn tới bó hoa thật (the REAL flower). */
  secretLabel: string;
  finale: {
    polaroid: ImageAsset | null;
    caption: string;
    closing: string;
  };
  reply: ReplyContent;
  fonts: FontSet;
  typography: TypeSet;
}

/**
 * Chú gấu Teddie đi theo Mina qua từng trang.
 *
 * Ảnh do bạn tải lên (nền trong suốt), còn phần chuyển động nằm ở lớp bọc bên
 * ngoài: trôi lên xuống, nghiêng qua lại, nảy khi chạm vào. Nhờ vậy ảnh tĩnh
 * vẫn sống mà không cần ảnh động hay thư viện hoạt hình nào.
 */
export interface TeddieSpot {
  /** null = trang này không có gấu. */
  image: ImageAsset | null;
  /** Chạm vào gấu là sang câu tiếp; hết thì quay lại câu đầu. */
  lines: string[];
}

export interface TeddieContent {
  enabled: boolean;
  /**
   * Dòng nhắc kèm mũi tên chỉ vào gấu, để Mina biết là chạm được.
   * Chỉ hiện tới lần chạm đầu tiên, rồi thôi hẳn cho cả phiên. Để trống là tắt.
   */
  tapHint: string;
  hub: TeddieSpot;
  message: TeddieSpot;
  memories: TeddieSpot;
  flowers: TeddieSpot;
  /**
   * Font riêng cho gấu, KHÔNG mượn font của từng trang.
   *
   * Gấu là một nhân vật đi xuyên suốt bốn trang nên phải có một giọng nói duy
   * nhất. Mượn font từng trang thì giọng nó đổi theo mỗi trang, mà tệ hơn là
   * rơi vào những font không dành cho cỡ chữ nhỏ: font body của trang kỷ niệm
   * là một serif nét mảnh, đặt bong bóng thoại 14px lên điện thoại là đọc
   * không ra.
   */
  fonts: FontSet;
  typography: TypeSet;
}

/**
 * Gấu đứng ở màn đếm ngược, cho những ngày chờ đỡ trống.
 *
 * Mỗi lần tải trang, máy chủ bốc ngẫu nhiên MỘT ảnh và MỘT câu (xem
 * `pickWaitingTeddie`). Bốc ở máy chủ chứ không ở trình duyệt: bốc ở trình
 * duyệt thì HTML hai bên lệch nhau, và cả hai danh sách phải gửi xuống hết.
 */
export interface WaitingTeddieContent {
  enabled: boolean;
  images: ImageAsset[];
  lines: string[];
}

export interface MusicContent {
  /** Nhạc luôn cần một cú chạm để phát (trình duyệt chặn autoplay); cú chạm đó là lúc mở phong bì. */
  startOnEnvelopeOpen: boolean;
  /** 0..1 */
  volume: number;
  loopPlaylist: boolean;
  /** Mở trang là bốc ngẫu nhiên một bài, và xáo luôn thứ tự cả danh sách. */
  shuffle: boolean;
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
  teddie: TeddieContent;
  waitingTeddie: WaitingTeddieContent;
}

/** Lớp hỏi tên, bỏ danh sách đáp án. */
export type PublicPassphrase = Omit<PassphraseContent, "answers">;

/**
 * Đúng những gì trang bìa cần — KHÔNG gì hơn.
 *
 * Mọi thứ truyền vào client component đều nằm nguyên trong HTML gửi xuống,
 * mở View Source là đọc được. Trang bìa lại là trang duy nhất người lạ vào
 * được TRƯỚC ngày mở. Bản trước gửi cả SiteContent xuống (chỉ cắt đáp án của
 * lớp hỏi tên), và đã kiểm bằng curl: cài một chuỗi bí mật vào lá thư, khoá
 * đếm ngược tới năm 2030, chuỗi đó vẫn hiện nguyên trong HTML của màn đếm
 * ngược — cả lá thư, lời kết bó hoa, ghi chú ảnh đều đọc được từ trước.
 *
 * Nên ở đây liệt kê TỪNG trường được phép đi, chứ không lấy cả khối rồi cắt
 * bớt: thêm trường mới vào schema mà quên cắt thì nó lọt xuống ngay, còn liệt
 * kê thế này thì trường mới mặc định KHÔNG đi.
 */
export interface LandingData {
  recipientName: string;
  landing: {
    headline: string;
    subline: string;
    passphrase: PublicPassphrase;
    fonts: FontSet;
    typography: TypeSet;
  };
  countdown: CountdownContent;
  /** Có bật nhạc ngay lúc chạm phong bì không. */
  startOnEnvelopeOpen: boolean;
  /**
   * Có bài nhạc nào không. Chỉ gửi có hay không, KHÔNG gửi URL — trang còn
   * khoá thì danh sách bài không được xuống tới trình duyệt.
   */
  hasMusic: boolean;
}

export function forLanding(content: SiteContent): LandingData {
  const { headline, subline, fonts, typography } = content.landing;
  const { enabled, title, hint, placeholder, submitLabel, errorText } =
    content.landing.passphrase;

  return {
    recipientName: content.recipientName,
    landing: {
      headline,
      subline,
      passphrase: { enabled, title, hint, placeholder, submitLabel, errorText },
      fonts,
      typography,
    },
    countdown: content.countdown,
    startOnEnvelopeOpen: content.music.startOnEnvelopeOpen,
    hasMusic: content.music.tracks.length > 0,
  };
}

export const CONTENT_VERSION = 1;

export const MAX_MESSAGE_PHOTOS = 5;
export const MAX_BOARD_PHOTOS = 8;
export const MAX_FILMSTRIP_PHOTOS = 6;
export const MAX_BOARDS = 6;
export const MAX_TRACKS = 12;
export const MAX_WAITING_TEDDIE_IMAGES = 8;
export const MAX_WAITING_TEDDIE_LINES = 60;
/** Thư Mina gửi lại: đủ dài cho vài đoạn, không đủ để ai đó đổ rác vào kho. */
export const MAX_REPLY_CHARS = 2000;

/** Gấu ở màn đếm ngược đã được bốc sẵn cho lần tải trang này. */
export interface WaitingTeddiePick {
  spot: TeddieSpot;
  fonts: FontSet;
  typography: TypeSet;
  tapHint: string;
}

/**
 * Bốc ngẫu nhiên một ảnh và một câu cho gấu ở màn đếm ngược.
 *
 * Bỏ qua ảnh giữ chỗ: nút "Thêm ảnh" ở /customize chèn sẵn một ô placehold.co,
 * chưa kịp tải ảnh thật mà lưu thì Mina sẽ thấy một ô vuông xám thay cho gấu.
 * Giọng nói (font) và dòng nhắc dùng chung với gấu ở các trang trong — cùng
 * một nhân vật.
 */
export function pickWaitingTeddie(
  content: SiteContent,
): WaitingTeddiePick | null {
  const { enabled, images, lines } = content.waitingTeddie;
  const anhThat = images.filter(
    (img) => !img.url.startsWith("https://placehold.co/"),
  );
  const cau = lines.map((l) => l.trim()).filter(Boolean);
  if (!enabled || anhThat.length === 0) return null;

  const boc = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

  return {
    spot: { image: boc(anhThat), lines: cau.length > 0 ? [boc(cau)] : [] },
    fonts: content.teddie.fonts,
    typography: content.teddie.typography,
    tapHint: content.teddie.tapHint,
  };
}

/** Tỉ lệ bắt buộc cho từng chỗ dùng ảnh — khung cắt ở /customize đọc bảng này. */
export const SLOT_ASPECT = {
  messagePhoto: "4:5",
  hubIcon: "1:1",
  filmstrip: "1:1",
  boardPhoto: "1:1",
  boardBackground: "16:9",
  finalePolaroid: "4:5",
  teddie: "1:1",
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
  // Bấm vào là xem phóng to tới 704 CSS px, màn Retina 2x cần ~1400.
  // Ảnh tải lên từ trước vẫn giữ nguyên; muốn nét hơn thì tải lại tấm đó.
  boardPhoto: 1600,
  filmstrip: 600,
  hubIcon: 512,
  // Gấu vẽ rộng nhất 128 CSS px -> 512 là đủ cho màn Retina, để dư một bậc.
  teddie: 700,
};
