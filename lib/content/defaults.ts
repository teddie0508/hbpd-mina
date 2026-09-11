import { placeholderImage } from "../placeholder";
import {
  CONTENT_VERSION,
  SLOT_ASPECT,
  type ImageAsset,
  type SiteContent,
  type TypeSet,
  type ThemeColors,
} from "./schema";

/**
 * Cách trình bày mặc định: đúng như thiết kế gốc.
 * Mỗi khối giữ một bản sao riêng để chỉnh khối này không kéo theo khối kia.
 */
const baseType = (): TypeSet => ({
  heading: { scale: 1, weight: 400, italic: false },
  body: { scale: 1, weight: 400, italic: false },
  accent: { scale: 1, weight: 400, italic: false },
});

/** Ảnh giữ chỗ đúng tỉ lệ của một vị trí, dùng cho tới khi bạn tải ảnh thật lên. */
const ph = (
  slot: keyof typeof SLOT_ASPECT,
  id: string,
  label: string,
): ImageAsset => placeholderImage(id, SLOT_ASPECT[slot], label);

/**
 * Bảng màu mặc định: xanh rêu sâu + vàng đồng + giấy be, viền xám khói.
 * Đổi được ở /customize; đây chỉ là điểm khởi đầu.
 */
export const DEFAULT_THEME: ThemeColors = {
  base: "#0D2E2A",
  deep: "#071A18",
  paper: "#F5ECDC",
  ink: "#22322E",
  cream: "#F0E7D6",
  gold: "#DCB56A",
  sage: "#86AC98",
  mist: "#A7B7B0",
};

export const DEFAULT_CONTENT: SiteContent = {
  version: CONTENT_VERSION,
  updatedAt: new Date(0).toISOString(),
  recipientName: "Mina",
  documentTitle: "For Mina",
  shareDescription: "Có một thứ đang đợi em.",

  theme: DEFAULT_THEME,

  countdown: {
    revealAt: "2026-11-02T00:00:00+07:00",
    title: "Sắp tới rồi",
    subtitle: "Có một thứ đang đợi em. Quay lại đúng ngày nhé.",
    unlockedNote: "Đến giờ rồi.",
    fonts: { heading: "cormorant", body: "be-vietnam", accent: "mali" },
    typography: baseType(),
  },

  landing: {
    headline: "Happy Birthday, Mina",
    subline: "chạm vào phong bì nhé...",
    passphrase: {
      enabled: true,
      title: "Khoan đã nào...",
      hint: "Gợi ý: đây là tên 1 người teddie rất yêu :>",
      placeholder: "tên người đó là...",
      submitLabel: "Mở thư",
      errorText: "Chưa đúng rồi, thử lại xem :>",
      // Gõ hoa hay thường, có dấu hay không dấu đều qua được.
      answers: ["mina", "my", "nguyễn huyền my", "huyền my", "naiuoy"],
    },
    fonts: { heading: "great-vibes", body: "be-vietnam", accent: "mali" },
    typography: baseType(),
  },

  hub: {
    title: "Gifts for you",
    options: [
      { key: "message", label: "Lời nhắn", icon: null },
      { key: "memories", label: "Kỷ niệm", icon: null },
      { key: "flowers", label: "Hoa", icon: null },
      // icon: null -> hiện ô chờ, bạn tải icon riêng lên ở /customize
    ],
    musicHint: "nếu yêu muốn đổi bài nhạc khác mà yêu muốn",
    fonts: { heading: "pacifico", body: "be-vietnam", accent: "cormorant" },
    typography: baseType(),
  },

  message: {
    photos: [
      ph("messagePhoto", "msg-1", "Anh 1"),
      ph("messagePhoto", "msg-2", "Anh 2"),
    ],
    heading: "Chúc mừng sinh nhật, em yêu.",
    body: [
      "Hôm nay là ngày của em, và anh thật sự không biết phải bắt đầu từ đâu để nói hết được anh biết ơn thế nào khi có em trong đời.",
      "Cảm ơn em vì đã chọn anh mỗi ngày. Cảm ơn vì sự kiên nhẫn, vì đã ở lại kể cả những hôm mọi thứ chẳng dễ dàng gì. Chúng mình không hoàn hảo, nhưng chúng mình là thật — và với anh, thế là đủ đặc biệt rồi.",
      "Chúc em một tuổi mới thật nhiều sức khoẻ, thật nhiều tiếng cười, và luôn được yêu thương đúng như cách em xứng đáng.",
    ].join("\n\n"),
    signature: "— của em",
    fonts: { heading: "dancing", body: "mali", accent: "cormorant" },
    typography: baseType(),
  },

  memories: {
    heading: "Memories Made With You",
    intro: [
      "Mỗi tấm ảnh ở đây là một câu chuyện — một khoảnh khắc đầy tiếng cười mà anh sẽ giữ mãi. Nhìn lại, anh mới thấy chúng mình đã đi cùng nhau nhiều đến thế nào.",
      "Từ những ngày bình thường nhất đến những chuyến đi khó quên nhất, kỷ niệm nào cũng đặc biệt chỉ vì nó có em. Cảm ơn em, và mình còn nhiều năm nữa để làm thêm thật nhiều kỷ niệm.",
    ].join("\n\n"),
    filmstrip: [
      ph("filmstrip", "film-1", "1"),
      ph("filmstrip", "film-2", "2"),
      ph("filmstrip", "film-3", "3"),
      ph("filmstrip", "film-4", "4"),
    ],
    boards: [
      {
        id: "board-1",
        title: "Những ngày có nhau",
        background: ph("boardBackground", "board-1-bg", "Anh nen"),
        backgroundDim: 0.55,
        photos: [
          ph("boardPhoto", "b1-1", "1"),
          ph("boardPhoto", "b1-2", "2"),
          ph("boardPhoto", "b1-3", "3"),
          ph("boardPhoto", "b1-4", "4"),
          ph("boardPhoto", "b1-5", "5"),
          ph("boardPhoto", "b1-6", "6"),
        ],
      },
    ],
    fonts: { heading: "pacifico", body: "cormorant", accent: "mali" },
    typography: baseType(),
  },

  flowers: {
    heading: "Hoa cho em",
    intro: [
      "Nếu được, anh đã muốn tận tay đưa em bó hoa này và nhìn em cười.",
      "Chưa làm được thì tạm nhận bó hoa này nhé — bấm đổi bao nhiêu lần cũng được, không bó nào giống bó nào cả.",
    ].join("\n\n"),
    shuffleLabel: "Đổi bó khác",
    secretLabel: "the REAL flower",
    finale: {
      polaroid: ph("finalePolaroid", "finale", "Mina"),
      caption:
        "Thật ra sau này, anh có tặng em hàng chục hàng trăm bó hoa đi nữa, cũng chỉ để nhận ra rằng: em mới là bông hoa đẹp nhất.",
      closing: "Chúc mừng sinh nhật, Mina.",
    },
    reply: {
      enabled: true,
      title: "Em có muốn nhắn lại gì cho anh không?",
      placeholder: "Viết gì cũng được, chỉ mình anh đọc thôi...",
      sendLabel: "Gửi cho anh",
      thanks: "Anh nhận được rồi nè. Cảm ơn em nhiều lắm ♥",
    },
    fonts: { heading: "dancing", body: "mali", accent: "cormorant" },
    typography: baseType(),
  },

  // Ảnh để null: trang nào chưa tải gấu lên thì không hiện gì cả, chứ không
  // bày ra một ô giữ chỗ xám giữa màn hình.
  teddie: {
    enabled: true,
    tapHint: "yêu thử click vào chú gấu đi :>",
    hub: {
      image: null,
      lines: ["Chọn đi em, cái nào cũng của em cả."],
    },
    message: {
      image: null,
      lines: ["Đoạn này anh viết lâu lắm đấy.", "Đọc chậm thôi nhé."],
    },
    memories: {
      image: null,
      // Câu này còn làm một việc nữa: không có ai chỉ thì chẳng ai biết bấm
      // vào ảnh là xem to được.
      lines: ["Bấm vào ảnh đi, xem to hơn được đấy."],
    },
    flowers: {
      image: null,
      // Tương tự, đây là chỗ duy nhất gợi ra nút "the REAL flower".
      lines: ["Anh còn giấu một bó nữa cơ...", "Tìm kỹ đi, gần lắm."],
    },
    // Mali: nét tròn, thân thiện, có đủ dấu tiếng Việt và quan trọng nhất là
    // đọc được ở cỡ nhỏ — đúng thứ một bong bóng thoại cần.
    fonts: { heading: "mali", body: "mali", accent: "mali" },
    typography: baseType(),
  },

  // Chưa có ảnh thì màn đếm ngược không có gấu, giống gấu ở các trang trong.
  waitingTeddie: {
    enabled: true,
    images: [],
    lines: [
      "Chưa tới đâu, đợi thêm chút nữa nhé.",
      "Anh cũng đang đếm từng ngày đây.",
      "Đoán thử xem trong phong bì có gì?",
      "Hôm nay em ăn gì chưa đó?",
    ],
  },

  music: {
    startOnEnvelopeOpen: true,
    volume: 0.55,
    loopPlaylist: true,
    shuffle: false,
    tracks: [],
  },
};

/** Bản sao sâu, để không ai lỡ tay sửa vào hằng số gốc. */
export function cloneDefaults(): SiteContent {
  return structuredClone(DEFAULT_CONTENT);
}
