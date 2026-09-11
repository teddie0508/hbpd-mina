/**
 * Tiếng giấy sột soạt khi phong bì mở, tổng hợp ngay trong trình duyệt.
 *
 * Không dùng tệp âm thanh, cũng không dùng thẻ <audio>: trên iPhone, phát một
 * thẻ <audio> thứ hai có thể làm thẻ đang phát nhạc bị dừng — mà nhạc bật đúng
 * trong cùng cú chạm đó. Web Audio chạy song song với <audio>, không tranh nhau.
 *
 * Cái giá: Web Audio trên iPhone tuân theo nút gạt im lặng. Máy đang gạt im
 * lặng thì nhạc vẫn phát nhưng tiếng giấy không kêu — hỏng thì im, không vỡ gì.
 */

let ctx: AudioContext | null = null;

type AudioCtor = typeof AudioContext;

function audioCtor(): AudioCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  );
}

/**
 * Mở khoá âm thanh — PHẢI gọi ngay trong cú chạm.
 *
 * Tiếng giấy chỉ vang lên lúc phong bì thật sự mở, tức sau khi trả lời tên,
 * sau một lượt chờ máy chủ; lúc đó cú chạm đã hết hiệu lực. Tạo sẵn và đánh
 * thức AudioContext từ cú chạm đầu tiên thì về sau phát lúc nào cũng được.
 */
export function primePaperSound(): void {
  try {
    const Ctor = audioCtor();
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    // iOS cũ chỉ thật sự mở khoá khi có một âm được phát trong cú chạm.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    src.connect(ctx.destination);
    src.start();
  } catch {
    /* không có âm thanh thì thôi */
  }
}

/**
 * Một đoạn tiếng giấy: nền xào xạc nhẹ cộng nhiều "hạt" lách tách ngắn.
 * Chính các hạt ngẫu nhiên đó làm tiếng ồn trắng nghe ra chất giấy.
 */
function crinkle(
  c: AudioContext,
  seconds: number,
  grains: number,
  bed: number,
): AudioBuffer {
  const sr = c.sampleRate;
  const len = Math.floor(seconds * sr);
  const buf = c.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);

  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = t < 0.08 ? t / 0.08 : Math.pow(1 - (t - 0.08) / 0.92, 1.6);
    d[i] = (Math.random() * 2 - 1) * bed * env;
  }

  for (let k = 0; k < grains; k++) {
    // Dồn hạt về nửa đầu: giấy kêu nhiều nhất lúc vừa bị kéo.
    const at = Math.floor(Math.pow(Math.random(), 1.4) * len * 0.92);
    const dur = Math.floor((0.003 + Math.random() * 0.014) * sr);
    const amp = 0.25 + Math.random() * 0.75;
    for (let j = 0; j < dur && at + j < len; j++) {
      d[at + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j / (dur * 0.35));
    }
  }

  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak;
  return buf;
}

function schedule(
  c: AudioContext,
  buf: AudioBuffer,
  at: number,
  band: [number, number],
  gain: number,
  dest: AudioNode,
): void {
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = band[0];
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = band[1];
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(hp).connect(lp).connect(g).connect(dest);
  src.start(at);
}

/**
 * Phát theo đúng nhịp hoạt cảnh của phong bì (components/landing/Envelope.tsx):
 * sáp vỡ ngay lập tức, nắp bắt đầu lật ở 0,22 giây, lá thư trồi lên ở 0,45 giây.
 */
export function playPaperSound(volume = 0.45): void {
  const c = ctx;
  if (!c) return;
  try {
    if (c.state !== "running") void c.resume().catch(() => {});
    const now = c.currentTime + 0.02;
    const out = c.createGain();
    out.gain.value = volume;
    out.connect(c.destination);

    // Sáp vỡ: một tiếng tách ngắn, sáng.
    schedule(c, crinkle(c, 0.07, 6, 0.15), now, [1800, 9000], 0.7, out);
    // Nắp lật: sột soạt dài, nhiều hạt.
    schedule(c, crinkle(c, 0.85, 70, 0.18), now + 0.22, [900, 6500], 1, out);
    // Lá thư trượt lên: xào nhẹ và trầm hơn.
    schedule(c, crinkle(c, 0.6, 22, 0.35), now + 0.45, [350, 2600], 0.5, out);
  } catch {
    /* không có âm thanh thì thôi */
  }
}
