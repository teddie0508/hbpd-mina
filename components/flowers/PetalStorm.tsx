"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      // Bỏ qua hoạt cảnh, vào thẳng phần kết.
      const id = window.setTimeout(() => doneRef.current(), 250);
      return () => window.clearTimeout(id);
    }

    // Giới hạn tỉ lệ điểm ảnh ở 2: màn Retina đẹp mà không phải vẽ thừa.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

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
    const count = width < 640 ? 130 : 260;
    const petals: Petal[] = Array.from({ length: count }, () =>
      spawn(width, height),
    );

    let raf = 0;
    let start = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      doneRef.current();
    };

    // Lưới an toàn: nếu tab bị ẩn giữa chừng, trình duyệt dừng requestAnimationFrame
    // và onDone sẽ không bao giờ chạy — Mina sẽ kẹt lại ở màn hình trống.
    // Hẹn giờ độc lập bảo đảm phần kết luôn hiện ra.
    const fallback = window.setTimeout(finish, (FADE_FROM + 0.8) * 1000);

    const frame = (now: number) => {
      if (!start) start = now;
      const elapsed = (now - start) / 1000;
      // Chốt bước thời gian để một khung hình rớt không làm cánh hoa nhảy vọt.
      const dt = Math.min(1 / 30, 1 / 60);

      ctx.clearRect(0, 0, width, height);

      const fade =
        elapsed < FADE_FROM
          ? 1
          : Math.max(0, 1 - (elapsed - FADE_FROM) / FADE_OVER);

      for (const petal of petals) {
        if (elapsed < RUSH_UNTIL) {
          // Giai đoạn ùa vào: bay nhanh về giữa rồi chậm dần.
          petal.vx *= 0.985;
          petal.vy *= 0.985;
        } else if (elapsed < DRIFT_FROM) {
          // Lửng lơ, đảo qua lại.
          petal.vx =
            petal.vx * 0.94 + Math.sin(elapsed * 1.6 + petal.phase) * 6;
          petal.vy = petal.vy * 0.94 + 14;
        } else {
          // Trôi đi: rơi xuống và tản ra hai bên.
          petal.vy += 34 * dt * 60 * dt;
          petal.vx += Math.sin(elapsed * 2 + petal.phase) * 1.6;
          petal.vx *= 0.995;
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
      }
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
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
