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

/** Nhớ bài đang nghe khi chuyển trang bằng cách tải lại (hiếm, nhưng đỡ khó chịu). */
const STATE_KEY = "mina.audio";

export function AudioProvider({
  music,
  children,
}: {
  music: MusicContent;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracks = music.tracks;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [volume, setVolumeState] = useState(music.volume);
  const [muted, setMuted] = useState(false);

  const current = tracks[index] ?? null;

  // Khôi phục bài và âm lượng sau khi tải lại trang.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        index?: number;
        volume?: number;
        muted?: boolean;
      };
      if (typeof saved.index === "number") setIndex(saved.index);
      if (typeof saved.volume === "number") setVolumeState(saved.volume);
      if (typeof saved.muted === "boolean") setMuted(saved.muted);
    } catch {
      // sessionStorage bị chặn (chế độ riêng tư) — bỏ qua, không ảnh hưởng gì.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STATE_KEY,
        JSON.stringify({ index, volume, muted }),
      );
    } catch {
      /* bỏ qua */
    }
  }, [index, volume, muted]);

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
  const firstRun = useRef(true);
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    el.load();
    if (playing) playCurrent();
    // Chỉ chạy khi đổi bài, không chạy khi bấm tạm dừng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const api = useMemo<AudioApi>(
    () => ({
      tracks,
      current,
      index,
      playing,
      unlocked,
      volume,
      muted,
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
