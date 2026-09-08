"use client";

import { useEffect, useRef, useState } from "react";

/** Cánh hoa lấy đúng tông của bó hoa, để hai phần trông cùng một thế giới. */
const PETAL_COLORS = [
  "#EBCE8A",
  "#F4E7CC",
  "#AFC9B9",
  "#93B3C6",
  "#DCCDB4",
  "#F1F0E9",
  "#C9A94F",
];

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  alpha: number;
  /** Lệch pha để mỗi cánh đảo qua lại một nhịp khác nhau. */
  phase: number;
}

/** Mốc thời gian của cả màn, tính bằng giây. */
const RUSH_UNTIL = 1.3;
const DRIFT_FROM = 2.4;
const FADE_FROM = 3.0;
const FADE_OVER = 1.8;

/*
 * Mọi hằng số chuyển động dưới đây tính theo GIÂY, không theo khung hình.
 *
 * Bản đầu tiên nhân vận tốc với một con số cố định ở mỗi khung hình. Trên màn
 * 60 Hz thì đúng, nhưng iPhone 15 Pro Max là màn 120 Hz: Safari gọi gấp đôi
 * số khung hình, nên cánh hoa bị hãm nhanh gấp đôi và chỉ đi được nửa quãng
 * đường trong cùng khoảng thời gian. Nhìn ra đúng như máy đang giật, dù máy
 * không rớt lấy một khung hình nào.
 */
/** Sau một giây, vận tốc lao vào chỉ còn lại chừng này. */
const RUSH_KEEP = 0.4025;
/** Pha lửng lơ bám theo vận tốc đích nhanh cỡ nào (phần còn lại sau một giây). */
const DRIFT_KEEP = 0.0247;
const DRIFT_SWAY = 100;
const DRIFT_FALL = 233;
/** Pha trôi đi: rơi nhanh dần và tản ngang. */
const TAIL_GRAVITY = 34;
const TAIL_SWAY = 96;
const TAIL_KEEP = 0.74;

/**
 * Hàng trăm cánh hoa ùa vào lấp kín màn hình rồi trôi đi.
 * Vẽ bằng Canvas 2D chứ không phải DOM — vài trăm phần tử DOM sẽ làm
 * Safari trên iPhone khựng, còn canvas thì chạy mượt.
 */
export function PetalStorm({
  active,
  onDone,
}: {
  active: boolean;
  /** Gọi khi cánh hoa đã trôi gần hết, để lộ phần nội dung phía sau. */
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Tự giữ vòng đời của mình. Nếu chỉ nghe theo `active` thì đúng lúc gọi
  // onDone là khối cha đổi cảnh, `active` thành false, canvas bị gỡ ngay —
  // đoạn nhạt dần bên dưới không bao giờ được chạy, cánh hoa biến mất phựt
  // một cái.
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (active) setRunning(true);
  }, [active]);

  useEffect(() => {
    if (!running) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      // Bỏ qua hoạt cảnh, vào thẳng phần kết.
      const id = window.setTimeout(() => {
        doneRef.current();
        setRunning(false);
      }, 250);
      return () => window.clearTimeout(id);
    }

    let width = window.innerWidth;
    let height = window.innerHeight;
    // Màn hẹp là điện thoại: hạ tỉ lệ điểm ảnh xuống 1,5 thay vì 2. Cánh hoa
    // vốn mềm và mờ nên mắt không nhận ra, mà số điểm ảnh phải tô ở mỗi khung
    // hình chỉ còn hơn một nửa.
    const small = width < 640;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Màn hẹp thì ít cánh hơn, vừa đủ dày mà không tốn pin.
    const count = small ? 100 : 260;
    const petals: Petal[] = Array.from({ length: count }, () =>
      spawn(width, height),
    );

    let raf = 0;
    let start = 0;
    let last = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      doneRef.current();
    };

    // Lưới an toàn: nếu tab bị ẩn giữa chừng, trình duyệt dừng requestAnimationFrame
    // và onDone sẽ không bao giờ chạy — Mina sẽ kẹt lại ở màn hình trống.
    // Hai cái hẹn giờ độc lập bảo đảm phần kết luôn hiện ra và canvas luôn được dọn.
    const fallbackDone = window.setTimeout(finish, (FADE_FROM + 0.8) * 1000);
    const fallbackEnd = window.setTimeout(
      () => setRunning(false),
      (FADE_FROM + FADE_OVER + 1) * 1000,
    );

    const frame = (now: number) => {
      if (!start) {
        start = now;
        last = now;
      }
      const elapsed = (now - start) / 1000;
      // Bước thời gian thật, chặn trên 50 ms phòng khi máy vừa khựng một nhịp.
      const dt = Math.min(0.05, (now - last) / 1000) || 1 / 60;
      last = now;

      const rushKeep = Math.pow(RUSH_KEEP, dt);
      const driftCatch = 1 - Math.pow(DRIFT_KEEP, dt);
      const tailKeep = Math.pow(TAIL_KEEP, dt);

      ctx.clearRect(0, 0, width, height);

      const fade =
        elapsed < FADE_FROM
          ? 1
          : Math.max(0, 1 - (elapsed - FADE_FROM) / FADE_OVER);

      for (const petal of petals) {
        if (elapsed < RUSH_UNTIL) {
          // Giai đoạn ùa vào: bay nhanh về giữa rồi chậm dần.
          petal.vx *= rushKeep;
          petal.vy *= rushKeep;
        } else if (elapsed < DRIFT_FROM) {
          // Lửng lơ, đảo qua lại: bám dần về một vận tốc đích.
          const swayTo = Math.sin(elapsed * 1.6 + petal.phase) * DRIFT_SWAY;
          petal.vx += (swayTo - petal.vx) * driftCatch;
          petal.vy += (DRIFT_FALL - petal.vy) * driftCatch;
        } else {
          // Trôi đi: rơi xuống và tản ra hai bên.
          petal.vy += TAIL_GRAVITY * dt;
          petal.vx += Math.sin(elapsed * 2 + petal.phase) * TAIL_SWAY * dt;
          petal.vx *= tailKeep;
        }

        petal.x += petal.vx * dt;
        petal.y += petal.vy * dt;
        petal.rot += petal.vrot * dt;

        const alpha = petal.alpha * fade;
        if (alpha <= 0.01) continue;

        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = petal.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, petal.size, petal.size * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed >= FADE_FROM) finish();

      if (elapsed < FADE_FROM + FADE_OVER) {
        raf = requestAnimationFrame(frame);
      } else {
        setRunning(false);
      }
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallbackDone);
      window.clearTimeout(fallbackEnd);
      window.removeEventListener("resize", resize);
    };
  }, [running]);

  if (!running) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Nằm TRÊN cả trình phát nhạc (z-50). Không phải để cho đẹp: trình phát
      // có lớp làm mờ hậu cảnh, mà hậu cảnh là mọi thứ được vẽ dưới nó. Để
      // canvas ở dưới thì Safari phải làm mờ lại vùng đó ở từng khung hình của
      // màn mưa hoa — đúng thứ khiến iPhone khựng.
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}

/** Sinh một cánh hoa ngoài rìa màn hình, lao về phía giữa. */
function spawn(width: number, height: number): Petal {
  const edge = Math.floor(Math.random() * 4);
  const margin = 60;
  let x = 0;
  let y = 0;
  if (edge === 0) {
    x = Math.random() * width;
    y = -margin;
  } else if (edge === 1) {
    x = width + margin;
    y = Math.random() * height;
  } else if (edge === 2) {
    x = Math.random() * width;
    y = height + margin;
  } else {
    x = -margin;
    y = Math.random() * height;
  }

  // Nhắm về một điểm quanh giữa màn hình, lệch ngẫu nhiên cho khỏi đều tăm tắp.
  const targetX = width * (0.3 + Math.random() * 0.4);
  const targetY = height * (0.3 + Math.random() * 0.4);
  const dx = targetX - x;
  const dy = targetY - y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 620 + Math.random() * 520;

  return {
    x,
    y,
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
    size: 6 + Math.random() * 9,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 4,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    alpha: 0.75 + Math.random() * 0.25,
    phase: Math.random() * Math.PI * 2,
  };
}
