"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { MusicContent, Track } from "@/lib/content/schema";

interface AudioApi {
  tracks: Track[];
  current: Track | null;
  index: number;
  playing: boolean;
  /** Đã từng phát ít nhất một lần — trước đó trình duyệt vẫn còn chặn. */
  unlocked: boolean;
  volume: number;
  muted: boolean;
  /** Đang xáo thứ tự bài hay đi theo đúng danh sách đã soạn. */
  shuffle: boolean;
  /** Đã mở trình phát ra lần nào chưa — /hub dựa vào đây để cất dòng nhắc đi. */
  playerOpened: boolean;
  markPlayerOpened: () => void;
  /** Gọi TRỰC TIẾP trong handler của cú chạm đầu tiên, nếu không iOS sẽ chặn. */
  start: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  select: (index: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioApi | null>(null);

/** Nhớ bài đang nghe khi tải lại trang (hiếm, nhưng đỡ khó chịu). */
const STATE_KEY = "mina.audio";

/** Xáo bài kiểu Fisher–Yates. Trả về mảng mới, không đụng mảng gốc. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function AudioProvider({
  music,
  children,
}: {
  music: MusicContent;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Thứ tự đang dùng để nghe.
   *
   * Khởi tạo bằng ĐÚNG thứ tự đã soạn, không xáo ngay — máy chủ và trình
   * duyệt phải dựng ra cùng một HTML, xáo ở đây là lệch hydration ngay. Việc
   * xáo dời sang useEffect bên dưới, tức là sau khi hydrate xong.
   */
  const [tracks, setTracks] = useState<Track[]>(music.tracks);
  const [shuffle, setShuffleState] = useState(music.shuffle);
  const [playerOpened, setPlayerOpened] = useState(false);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [volume, setVolumeState] = useState(music.volume);
  const [muted, setMuted] = useState(false);
  /**
   * Đang tự chuyển bài vì bài trước vừa hết.
   *
   * Phải là ref chứ không được trông vào state `playing`: có trình duyệt bắn
   * kèm sự kiện `pause` ngay sau `ended`, mà `onPause` thì đặt `playing` về
   * false. Thế là trong cùng một lượt cập nhật, bài có sang nhưng khối nạp
   * nguồn lại thấy `playing === false` nên không phát tiếp — danh sách nhạc
   * lặng luôn từ bài thứ hai, đúng kiểu "hết bài đầu là im".
   */
  const tuChuyenBai = useRef(false);

  /** Lần tải trang này có đang dở một bài không, để thử phát tiếp. */
  const shouldResume = useRef(false);
  /** Nghe dở tới giây thứ mấy, để phát tiếp đúng chỗ chứ không quay về đầu. */
  const resumeTime = useRef(0);

  const current = tracks[index] ?? null;
  const currentRef = useRef(current);
  currentRef.current = current;

  /** Đổi khi bạn thêm/bớt/đổi thứ tự bài ở /customize. */
  const trackSig = music.tracks.map((t) => t.id).join("|");
  const restored = useRef(false);
  /**
   * Thứ tự nghe đã chốt cho TAB này, lưu bằng danh sách ID.
   *
   * sessionStorage sống theo tab: mở tab mới là trống trơn nên xáo lại từ
   * đầu, còn tải lại trang trong tab cũ thì đọc được thứ tự cũ và giữ nguyên.
   * Chuyển trang trong tab thì AudioProvider nằm ở layout nên không dựng lại,
   * nhạc chạy liền mạch.
   */
  const thuTuCuaTab = useRef<string[] | null>(null);

  // Dựng thứ tự nghe, và khôi phục bài dở sau khi tải lại trang.
  //
  // Ghi nhớ theo ID của bài, KHÔNG phải theo vị trí. Trước đây lưu vị trí nên
  // sau khi đổi thứ tự ở /customize, trình duyệt khôi phục đúng "vị trí số N"
  // mà chỗ đó giờ đã là bài khác — nhìn như thay đổi thứ tự không có tác dụng.
  // Xoá bớt bài còn tệ hơn: vị trí cũ trỏ ra ngoài danh sách, current thành
  // null và cả trình phát biến mất. Giờ càng phải theo ID: bật xáo là thứ tự
  // chẳng còn liên quan gì tới danh sách đã soạn nữa.
  useEffect(() => {
    const theoId = new Map(music.tracks.map((t) => [t.id, t]));

    /** Dựng lại thứ tự từ danh sách ID, chỉ nhận khi khớp trọn vẹn. */
    const dungLaiTu = (ids: string[] | null): Track[] | null => {
      if (!ids || ids.length !== music.tracks.length) return null;
      const out = ids
        .map((id) => theoId.get(id))
        .filter((t): t is Track => Boolean(t));
      // Lệch một bài nghĩa là danh sách vừa bị sửa ở /customize — lúc đó phải
      // dựng thứ tự mới chứ không cố ghép vào cái cũ.
      return out.length === music.tracks.length ? out : null;
    };

    // Lần đầu thì lấy bài dở trong sessionStorage; những lần sau (danh sách
    // vừa đổi ở /customize) thì giữ nguyên bài đang nghe.
    let wantedId: string | undefined = currentRef.current?.id;

    if (!restored.current) {
      restored.current = true;
      wantedId = undefined;
      try {
        const raw = sessionStorage.getItem(STATE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as {
            trackId?: string;
            order?: string[];
            shuffle?: boolean;
            volume?: number;
            muted?: boolean;
            playing?: boolean;
            time?: number;
          };

          // Chỉ nhận lại thứ tự cũ khi tuỳ chọn xáo bài không đổi. Bật/tắt ở
          // /customize thì lần mở kế tiếp phải dựng lại thứ tự mới.
          if (Array.isArray(saved.order) && saved.shuffle === music.shuffle) {
            thuTuCuaTab.current = saved.order;
          }

          if (typeof saved.trackId === "string") wantedId = saved.trackId;
          if (typeof saved.volume === "number") setVolumeState(saved.volume);
          if (typeof saved.muted === "boolean") setMuted(saved.muted);
          if (saved.playing) shouldResume.current = true;
          if (typeof saved.time === "number") resumeTime.current = saved.time;
        }
      } catch {
        // sessionStorage bị chặn (chế độ riêng tư) — bỏ qua, không ảnh hưởng gì.
      }
    }

    // Thứ tự đã chốt cho tab này. Chốt vào ref chứ không tính lại mỗi lượt:
    // effect này chạy hai lần ở chế độ dev, mà `shuffled()` thì lần nào cũng
    // ra một kết quả khác — tính lại là lần chạy thứ hai xáo đè lên lần đầu,
    // và cả công nhớ thứ tự thành vô nghĩa.
    let order = dungLaiTu(thuTuCuaTab.current);
    if (!order) {
      order = music.shuffle ? shuffled(music.tracks) : music.tracks;
    }
    thuTuCuaTab.current = order.map((t) => t.id);

    const found = wantedId ? order.findIndex((t) => t.id === wantedId) : -1;

    setShuffleState(music.shuffle);
    setTracks(order);
    // Bài cũ bị xoá thì quay về đầu danh sách, không để trỏ vào chỗ trống.
    // Khi đang bật xáo, "đầu danh sách" chính là một bài ngẫu nhiên.
    setIndex(found >= 0 ? found : 0);
    // Cố ý bám `trackSig` chứ không bám thẳng `music.tracks`: mảng đó là một
    // object mới sau mỗi lần máy chủ dựng lại, bám vào nó thì chỉ cần khối cha
    // vẽ lại là danh sách bị xáo lại từ đầu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackSig, music.shuffle]);

  // Danh sách ngắn lại mà con trỏ còn ở xa thì kéo về đầu, tránh mất trình phát.
  useEffect(() => {
    if (tracks.length > 0 && index >= tracks.length) setIndex(0);
  }, [tracks.length, index]);

  const persist = useCallback(() => {
    try {
      sessionStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          trackId: current?.id,
          // Nhớ luôn thứ tự đang dùng, để tải lại trang trong cùng tab thì
          // không bị xáo lại từ đầu.
          order: tracks.map((t) => t.id),
          shuffle: music.shuffle,
          volume,
          muted,
          playing,
          time: audioRef.current?.currentTime ?? 0,
        }),
      );
    } catch {
      /* bỏ qua */
    }
  }, [current?.id, tracks, music.shuffle, volume, muted, playing]);

  useEffect(() => {
    persist();
  }, [persist]);

  // Ghi lại vị trí đang nghe vài giây một lần. Không bám sự kiện timeupdate vì
  // nó bắn liên tục mấy lần mỗi giây, ghi từng ấy lần là phí.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(persist, 2000);
    return () => window.clearInterval(id);
  }, [playing, persist]);

  // Nếu trang vừa bị tải lại giữa chừng — hay gặp nhất là khi có bản deploy
  // mới, Next thấy lệch phiên bản nên buộc phải tải lại toàn trang — thì thử
  // phát tiếp bài đang dở. Không có cách nào giữ được âm thanh qua một lần
  // tải lại, nên đây là mức tốt nhất có thể làm.
  //
  // Trình duyệt có quyền từ chối vì chưa có thao tác nào của người xem trong
  // lần tải này. Bị từ chối thì cứ để tạm dừng, cô ấy bấm nút phát là xong.
  useEffect(() => {
    if (!shouldResume.current) return;
    if (!current) return;
    shouldResume.current = false;

    const el = audioRef.current;
    if (!el) return;

    // Nhảy về đúng chỗ đang nghe dở. Phải đợi trình duyệt đọc xong thông tin
    // bài hát, đặt currentTime sớm quá là không ăn.
    const seek = () => {
      try {
        if (resumeTime.current > 0) el.currentTime = resumeTime.current;
      } catch {
        /* bỏ qua */
      }
    };
    if (el.readyState >= 1) seek();
    else el.addEventListener("loadedmetadata", seek, { once: true });

    void el
      .play()
      .then(() => {
        setPlaying(true);
        setUnlocked(true);
      })
      .catch(() => {
        // Bị chặn: giữ nguyên trạng thái tạm dừng, không báo lỗi gì cho người xem.
      });
  }, [current]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.volume = volume;
      el.muted = muted;
    }
  }, [volume, muted]);

  const playCurrent = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    const result = el.play();
    // Safari trả về promise; bị chặn thì giữ nguyên trạng thái tạm dừng.
    if (result && typeof result.catch === "function") {
      result
        .then(() => {
          setPlaying(true);
          setUnlocked(true);
        })
        .catch(() => setPlaying(false));
    } else {
      setPlaying(true);
      setUnlocked(true);
    }
  }, [current]);

  const start = useCallback(() => {
    if (!current) return;
    playCurrent();
  }, [current, playCurrent]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.paused) playCurrent();
    else {
      el.pause();
      setPlaying(false);
    }
  }, [current, playCurrent]);

  const step = useCallback(
    (delta: number) => {
      if (tracks.length === 0) return;
      setIndex((i) => {
        const next = i + delta;
        if (music.loopPlaylist) return (next + tracks.length) % tracks.length;
        return Math.min(Math.max(next, 0), tracks.length - 1);
      });
    },
    [tracks.length, music.loopPlaylist],
  );

  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const select = useCallback(
    (i: number) => {
      if (i < 0 || i >= tracks.length) return;
      setIndex(i);
      // Đổi bài từ danh sách nghĩa là muốn nghe luôn.
      setPlaying(true);
    },
    [tracks.length],
  );

  // Đổi bài: nạp nguồn mới rồi phát tiếp nếu đang trong trạng thái phát.
  //
  // Bám theo ID của bài chứ không bám theo vị trí. Xáo thứ tự làm vị trí đổi
  // trong khi vẫn là bài cũ; bám vị trí thì lần nào xáo cũng gọi el.load() và
  // bài đang nghe bị tua về đầu.
  const loadedId = useRef<string | null>(null);
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (loadedId.current === current.id) return;

    const first = loadedId.current === null;
    loadedId.current = current.id;
    if (first) return;

    // Phát tiếp khi ĐANG phát, hoặc khi đây là cú tự chuyển bài lúc bài trước
    // vừa hết — hai chuyện đó không phải một, xem chú thích ở `tuChuyenBai`.
    const phaiPhatTiep = playing || tuChuyenBai.current;
    tuChuyenBai.current = false;

    el.load();
    if (phaiPhatTiep) playCurrent();
    // Chỉ chạy khi đổi bài, không chạy khi bấm tạm dừng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const api = useMemo<AudioApi>(
    () => ({
      tracks,
      current,
      index,
      playing,
      unlocked,
      volume,
      muted,
      shuffle,
      playerOpened,
      markPlayerOpened: () => setPlayerOpened(true),
      start,
      toggle,
      next,
      prev,
      select,
      setVolume: setVolumeState,
      toggleMute: () => setMuted((m) => !m),
    }),
    [
      tracks,
      current,
      index,
      playing,
      unlocked,
      volume,
      muted,
      shuffle,
      playerOpened,
      start,
      toggle,
      next,
      prev,
      select,
    ],
  );

  return (
    <AudioContext value={api}>
      <audio
        ref={audioRef}
        src={current?.url}
        preload={unlocked ? "auto" : "none"}
        playsInline
        onEnded={() => {
          if (tracks.length <= 1) {
            if (music.loopPlaylist) playCurrent();
            else setPlaying(false);
            return;
          }
          if (!music.loopPlaylist && index === tracks.length - 1) {
            setPlaying(false);
            return;
          }
          // Ghi rõ ý định TRƯỚC khi đổi bài. Xem chú thích ở `tuChuyenBai`:
          // không thể trông vào state `playing` ở thời điểm này.
          tuChuyenBai.current = true;
          next();
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {children}
    </AudioContext>
  );
}

export function useAudio(): AudioApi {
  const value = useContext(AudioContext);
  if (!value) throw new Error("useAudio phải nằm trong <AudioProvider>");
  return value;
}
