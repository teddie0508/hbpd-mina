"use client";

import {
  MAX_BOARDS,
  MAX_BOARD_PHOTOS,
  MAX_FILMSTRIP_PHOTOS,
  MAX_MESSAGE_PHOTOS,
  MAX_TRACKS,
  SLOT_ASPECT,
  type FlowersContent,
  type HubContent,
  type LandingContent,
  type MemoriesContent,
  type MemoryBoard,
  type MessageContent,
  type MusicContent,
  type SiteContent,
  type ThemeColors,
  type Track,
} from "@/lib/content/schema";
import { placeholderImage } from "@/lib/placeholder";

import { AudioField } from "./AudioField";
import { ImageField } from "./ImageField";
import { ImageListField } from "./ImageListField";
import {
  ColorInput,
  Field,
  TypographyPicker,
  SectionCard,
  Slider,
  TextArea,
  TextInput,
  Toggle,
} from "./fields";

const SAMPLE = "Chúc mừng sinh nhật, Mina";

/**
 * Ngày giờ luôn được lưu theo giờ Việt Nam, bất kể máy bạn đang đặt múi giờ nào.
 * Nhờ vậy đổi máy hay đi nước ngoài cũng không làm lệch thời điểm mở khoá.
 */
const VN_OFFSET = "+07:00";
const isoToInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
const inputToIso = (value: string) =>
  value ? `${value}:00${VN_OFFSET}` : null;

type Patch<T> = (patch: Partial<T>) => void;

export function GeneralPanel({
  content,
  onChange,
}: {
  content: SiteContent;
  onChange: (patch: Partial<SiteContent>) => void;
}) {
  const patchCountdown: Patch<SiteContent["countdown"]> = (patch) =>
    onChange({ countdown: { ...content.countdown, ...patch } });
  const patchTheme = (patch: Partial<ThemeColors>) =>
    onChange({ theme: { ...content.theme, ...patch } });

  const colorLabels: Array<[keyof ThemeColors, string, string]> = [
    ["base", "Nền chính", "Màu nền của hầu hết các trang"],
    ["deep", "Nền sâu", "Dùng cho viền tối và bóng đổ"],
    ["paper", "Giấy", "Polaroid, thiệp, phong bì"],
    ["ink", "Mực", "Chữ nằm trên nền giấy"],
    ["cream", "Kem", "Chữ nằm trên nền tối"],
    ["gold", "Vàng đồng", "Màu nhấn chính"],
    ["sage", "Xanh dịu", "Màu nhấn phụ"],
    ["mist", "Xám khói", "Viền và chữ mờ"],
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Thông tin chung">
        <Field label="Tên người nhận" hint="Dùng cho chữ trên sáp niêm phong.">
          <TextInput
            value={content.recipientName}
            onChange={(recipientName) => onChange({ recipientName })}
          />
        </Field>
        <Field label="Tiêu đề tab trình duyệt">
          <TextInput
            value={content.documentTitle}
            onChange={(documentTitle) => onChange({ documentTitle })}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Đếm ngược"
        description="Trước thời điểm này, ai vào link cũng chỉ thấy đồng hồ đếm ngược. Bạn xem trước được bằng /?preview=1."
      >
        <Field label="Mở khoá lúc (giờ Việt Nam)">
          <TextInput
            type="datetime-local"
            value={isoToInput(content.countdown.revealAt)}
            onChange={(value) =>
              patchCountdown({ revealAt: inputToIso(value) })
            }
          />
        </Field>
        <Toggle
          checked={content.countdown.revealAt === null}
          onChange={(off) =>
            patchCountdown({
              revealAt: off ? null : "2026-11-02T00:00:00+07:00",
            })
          }
          label="Bỏ đếm ngược, mở luôn"
        />
        <Field label="Tiêu đề màn chờ">
          <TextInput
            value={content.countdown.title}
            onChange={(title) => patchCountdown({ title })}
          />
        </Field>
        <Field label="Dòng phụ màn chờ">
          <TextArea
            rows={2}
            value={content.countdown.subtitle}
            onChange={(subtitle) => patchCountdown({ subtitle })}
          />
        </Field>
        <TypographyPicker
          fonts={content.countdown.fonts}
          type={content.countdown.typography}
          onFontsChange={(fonts) => patchCountdown({ fonts })}
          onTypeChange={(typography) => patchCountdown({ typography })}
          sampleText={content.countdown.title || SAMPLE}
        />
      </SectionCard>

      <SectionCard
        title="Bảng màu"
        description="Đổi ở đây là đổi cho toàn bộ trang."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {colorLabels.map(([key, label, hint]) => (
            <Field key={key} label={label} hint={hint}>
              <ColorInput
                value={content.theme[key]}
                onChange={(value) => patchTheme({ [key]: value })}
              />
            </Field>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function LandingPanel({
  value,
  onChange,
}: {
  value: LandingContent;
  onChange: Patch<LandingContent>;
}) {
  return (
    <SectionCard
      title="Trang bìa"
      description="Màn hình đầu tiên, có phong bì để chạm vào."
    >
      <Field
        label="Dòng tiêu đề"
        hint="Nếu để tiếng Anh thì dùng được cả những font script chỉ có Latin."
      >
        <TextInput
          value={value.headline}
          onChange={(headline) => onChange({ headline })}
        />
      </Field>
      <Field label="Dòng gợi ý dưới phong bì">
        <TextInput
          value={value.subline}
          onChange={(subline) => onChange({ subline })}
        />
      </Field>
      <TypographyPicker
        fonts={value.fonts}
        type={value.typography}
        onFontsChange={(fonts) => onChange({ fonts })}
        onTypeChange={(typography) => onChange({ typography })}
        sampleText={value.headline || SAMPLE}
      />
    </SectionCard>
  );
}

export function HubPanel({
  value,
  onChange,
}: {
  value: HubContent;
  onChange: Patch<HubContent>;
}) {
  return (
    <SectionCard
      title="Màn ba lựa chọn"
      description="Icon để trống sẽ hiện ô nét đứt giữ chỗ."
    >
      <Field label="Tiêu đề">
        <TextInput
          value={value.title}
          onChange={(title) => onChange({ title })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        {value.options.map((option, index) => (
          <div key={option.key} className="space-y-2">
            <TextInput
              value={option.label}
              onChange={(label) =>
                onChange({
                  options: value.options.map((o, i) =>
                    i === index ? { ...o, label } : o,
                  ),
                })
              }
            />
            <ImageField
              slot="hubIcon"
              label={option.label}
              value={option.icon}
              onChange={(icon) =>
                onChange({
                  options: value.options.map((o, i) =>
                    i === index ? { ...o, icon } : o,
                  ),
                })
              }
              onRemove={
                option.icon
                  ? () =>
                      onChange({
                        options: value.options.map((o, i) =>
                          i === index ? { ...o, icon: null } : o,
                        ),
                      })
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      <TypographyPicker
        fonts={value.fonts}
        type={value.typography}
        onFontsChange={(fonts) => onChange({ fonts })}
        onTypeChange={(typography) => onChange({ typography })}
        sampleText={value.title || SAMPLE}
      />
    </SectionCard>
  );
}

export function MessagePanel({
  value,
  onChange,
}: {
  value: MessageContent;
  onChange: Patch<MessageContent>;
}) {
  return (
    <div className="space-y-5">
      <SectionCard
        title="Ảnh đầu trang"
        description={`Xếp chồng kiểu polaroid, tỉ lệ ${SLOT_ASPECT.messagePhoto}. Tối đa ${MAX_MESSAGE_PHOTOS} tấm.`}
      >
        <ImageListField
          slot="messagePhoto"
          label="Ảnh"
          max={MAX_MESSAGE_PHOTOS}
          items={value.photos}
          onChange={(photos) => onChange({ photos })}
        />
      </SectionCard>

      <SectionCard title="Lời nhắn">
        <Field label="Tiêu đề">
          <TextInput
            value={value.heading}
            onChange={(heading) => onChange({ heading })}
          />
        </Field>
        <Field label="Nội dung" hint="Cách nhau một dòng trống để tách đoạn.">
          <TextArea
            rows={12}
            value={value.body}
            onChange={(body) => onChange({ body })}
          />
        </Field>
        <Field label="Ký tên">
          <TextInput
            value={value.signature}
            onChange={(signature) => onChange({ signature })}
          />
        </Field>
        <TypographyPicker
          fonts={value.fonts}
          type={value.typography}
          onFontsChange={(fonts) => onChange({ fonts })}
          onTypeChange={(typography) => onChange({ typography })}
          sampleText={value.heading || SAMPLE}
        />
      </SectionCard>
    </div>
  );
}

export function MemoriesPanel({
  value,
  onChange,
}: {
  value: MemoriesContent;
  onChange: Patch<MemoriesContent>;
}) {
  const patchBoard = (index: number, patch: Partial<MemoryBoard>) =>
    onChange({
      boards: value.boards.map((b, i) =>
        i === index ? { ...b, ...patch } : b,
      ),
    });

  const addBoard = () =>
    onChange({
      boards: [
        ...value.boards,
        {
          id: crypto.randomUUID(),
          title: "",
          background: placeholderImage(
            crypto.randomUUID(),
            SLOT_ASPECT.boardBackground,
            "Anh nen",
          ),
          backgroundDim: 0.55,
          photos: [],
        },
      ],
    });

  return (
    <div className="space-y-5">
      <SectionCard title="Phần mở đầu">
        <Field label="Tiêu đề">
          <TextInput
            value={value.heading}
            onChange={(heading) => onChange({ heading })}
          />
        </Field>
        <Field
          label="Đoạn mở đầu"
          hint="Cách nhau một dòng trống để tách đoạn."
        >
          <TextArea
            rows={8}
            value={value.intro}
            onChange={(intro) => onChange({ intro })}
          />
        </Field>
        <ImageListField
          slot="filmstrip"
          label="Ảnh dải phim"
          max={MAX_FILMSTRIP_PHOTOS}
          items={value.filmstrip}
          onChange={(filmstrip) => onChange({ filmstrip })}
        />
        <TypographyPicker
          fonts={value.fonts}
          type={value.typography}
          onFontsChange={(fonts) => onChange({ fonts })}
          onTypeChange={(typography) => onChange({ typography })}
          sampleText={value.heading || SAMPLE}
        />
      </SectionCard>

      {value.boards.map((board, index) => (
        <SectionCard
          key={board.id}
          title={`Khối ảnh ${index + 1}`}
          description={`Ảnh nền tỉ lệ ${SLOT_ASPECT.boardBackground}, ảnh nhỏ tỉ lệ ${SLOT_ASPECT.boardPhoto}.`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <TextInput
                value={board.title}
                placeholder="Tên khối (để trống nếu không cần)"
                onChange={(title) => patchBoard(index, { title })}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onChange({ boards: value.boards.filter((_, i) => i !== index) })
              }
              className="border-mist/25 text-mist/70 shrink-0 rounded-lg border px-3 py-2 text-xs transition-colors hover:border-red-400/50 hover:text-red-300"
            >
              Xoá khối
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-mist/80 mb-1.5 block text-xs">Ảnh nền</span>
              <ImageField
                slot="boardBackground"
                label="Ảnh nền"
                value={board.background}
                onChange={(background) => patchBoard(index, { background })}
                onRemove={
                  board.background
                    ? () => patchBoard(index, { background: null })
                    : undefined
                }
              />
            </div>
            <Field
              label="Độ phủ lên ảnh nền"
              hint="Cao thì ảnh nền mờ đi, ảnh nhỏ phía trên nổi rõ hơn."
            >
              <Slider
                value={board.backgroundDim}
                onChange={(backgroundDim) =>
                  patchBoard(index, { backgroundDim })
                }
              />
            </Field>
          </div>

          <ImageListField
            slot="boardPhoto"
            label="Ảnh trong khối"
            max={MAX_BOARD_PHOTOS}
            items={board.photos}
            onChange={(photos) => patchBoard(index, { photos })}
          />
        </SectionCard>
      ))}

      <button
        type="button"
        onClick={addBoard}
        disabled={value.boards.length >= MAX_BOARDS}
        className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold w-full rounded-xl border border-dashed py-3 text-sm transition-colors disabled:opacity-35"
      >
        Thêm khối ảnh ({value.boards.length}/{MAX_BOARDS})
      </button>
    </div>
  );
}

export function FlowersPanel({
  value,
  onChange,
}: {
  value: FlowersContent;
  onChange: Patch<FlowersContent>;
}) {
  const patchFinale = (patch: Partial<FlowersContent["finale"]>) =>
    onChange({ finale: { ...value.finale, ...patch } });

  return (
    <div className="space-y-5">
      <SectionCard title="Màn bó hoa">
        <Field label="Tiêu đề">
          <TextInput
            value={value.heading}
            onChange={(heading) => onChange({ heading })}
          />
        </Field>
        <Field label="Đoạn giới thiệu">
          <TextArea
            rows={5}
            value={value.intro}
            onChange={(intro) => onChange({ intro })}
          />
        </Field>
        <Field label="Chữ trên nút đổi bó">
          <TextInput
            value={value.shuffleLabel}
            onChange={(shuffleLabel) => onChange({ shuffleLabel })}
          />
        </Field>
        <Field
          label="Dòng chữ bí mật"
          hint="Nấp ở góc dưới bên phải, rất mờ. Sau 30 giây chưa ai bấm thì nó tự sáng lên chút để dễ thấy hơn."
        >
          <TextInput
            value={value.secretLabel}
            onChange={(secretLabel) => onChange({ secretLabel })}
          />
        </Field>
        <TypographyPicker
          fonts={value.fonts}
          type={value.typography}
          onFontsChange={(fonts) => onChange({ fonts })}
          onTypeChange={(typography) => onChange({ typography })}
          sampleText={value.heading || SAMPLE}
        />
      </SectionCard>

      <SectionCard
        title="Phần kết"
        description="Hiện ra sau khi cánh hoa tràn kín màn hình rồi trôi đi."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-mist/80 mb-1.5 block text-xs">
              Ảnh polaroid ({SLOT_ASPECT.finalePolaroid})
            </span>
            <ImageField
              slot="finalePolaroid"
              label="Ảnh Mina"
              value={value.finale.polaroid}
              onChange={(polaroid) => patchFinale({ polaroid })}
              onRemove={
                value.finale.polaroid
                  ? () => patchFinale({ polaroid: null })
                  : undefined
              }
            />
          </div>
          <div className="space-y-4">
            <Field label="Lời nhắn cuối">
              <TextArea
                rows={5}
                value={value.finale.caption}
                onChange={(caption) => patchFinale({ caption })}
              />
            </Field>
            <Field label="Câu kết">
              <TextInput
                value={value.finale.closing}
                onChange={(closing) => patchFinale({ closing })}
              />
            </Field>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function MusicPanel({
  value,
  onChange,
}: {
  value: MusicContent;
  onChange: Patch<MusicContent>;
}) {
  const patchTrack = (index: number, patch: Partial<Track>) =>
    onChange({
      tracks: value.tracks.map((t, i) =>
        i === index ? { ...t, ...patch } : t,
      ),
    });

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.tracks.length) return;
    const next = [...value.tracks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ tracks: next });
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Cách phát"
        description="Trình duyệt không cho tự phát nhạc khi vừa mở trang. Nhạc sẽ bắt đầu đúng lúc Mina chạm vào phong bì."
      >
        <Toggle
          checked={value.startOnEnvelopeOpen}
          onChange={(startOnEnvelopeOpen) => onChange({ startOnEnvelopeOpen })}
          label="Bật nhạc khi mở phong bì"
        />
        <Toggle
          checked={value.loopPlaylist}
          onChange={(loopPlaylist) => onChange({ loopPlaylist })}
          label="Hết danh sách thì quay lại bài đầu"
        />
        <Field label="Âm lượng mặc định">
          <Slider
            value={value.volume}
            onChange={(volume) => onChange({ volume })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Danh sách bài"
        description={`Tối đa ${MAX_TRACKS} bài. Nên dùng mp3 hoặc m4a.`}
      >
        {value.tracks.length === 0 ? (
          <p className="text-mist/45 border-mist/15 rounded-lg border border-dashed px-3 py-6 text-center text-xs">
            Chưa có bài nào — trình phát sẽ tự ẩn đi
          </p>
        ) : (
          <ul className="space-y-3">
            {value.tracks.map((track, index) => (
              <li
                key={track.id}
                className="border-mist/12 bg-base/40 space-y-3 rounded-lg border p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextInput
                    value={track.title}
                    placeholder="Tên bài"
                    onChange={(title) => patchTrack(index, { title })}
                  />
                  <TextInput
                    value={track.artist}
                    placeholder="Ca sĩ"
                    onChange={(artist) => patchTrack(index, { artist })}
                  />
                </div>

                <AudioField
                  url={track.url}
                  onChange={(url) => patchTrack(index, { url })}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="border-mist/20 text-mist/70 hover:text-cream flex-1 rounded border py-1 text-xs transition-colors disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === value.tracks.length - 1}
                    className="border-mist/20 text-mist/70 hover:text-cream flex-1 rounded border py-1 text-xs transition-colors disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        tracks: value.tracks.filter((_, i) => i !== index),
                      })
                    }
                    className="border-mist/20 text-mist/70 rounded border px-3 py-1 text-xs transition-colors hover:border-red-400/50 hover:text-red-300"
                  >
                    Xoá
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() =>
            onChange({
              tracks: [
                ...value.tracks,
                {
                  id: crypto.randomUUID(),
                  title: "Bài mới",
                  artist: "",
                  url: "",
                },
              ],
            })
          }
          disabled={value.tracks.length >= MAX_TRACKS}
          className="border-mist/25 text-cream/85 hover:border-gold/50 hover:text-gold w-full rounded-lg border border-dashed py-2.5 text-sm transition-colors disabled:opacity-35"
        >
          Thêm bài ({value.tracks.length}/{MAX_TRACKS})
        </button>
      </SectionCard>
    </div>
  );
}
