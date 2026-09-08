"use client";

import { useEffect, useRef } from "react";

const PETAL_COLORS = [
  "#EBCE8A",
  "#F4E7CC",
  "#AFC9B9",
  "#93B3C6",
  "#DCCDB4",
  "#F1F0E9",
];

interface Petal {
  x: number;
  y: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  alpha: number;
  /** Lệch pha để mỗi cánh đưa qua đưa lại một nhịp riêng. */
  phase: number;
  sway: number;
}

/**
 * Vài cánh hoa trôi rất chậm ở màn kết, để khung hình còn thở chứ không đứng im.
 *
 * Vẽ bằng Canvas như màn mưa hoa, nhưng thưa hơn nhiều và chạy mãi. Vài chục
 * phần tử DOM cứ nhích một chút mỗi khung hình sẽ bắt Safari tính lại bố cục
 * liên tục; canvas thì chỉ tô lại đúng một lớp.
 */
export function PetalDrift() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

    const make = (atTop: boolean): Petal => ({
      x: Math.random() * width,
      y: atTop ? -20 - Math.random() * height * 0.4 : Math.random() * height,
      vy: 12 + Math.random() * 16,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.7,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      alpha: 0.28 + Math.random() * 0.34,
      phase: Math.random() * Math.PI * 2,
      sway: 8 + Math.random() * 14,
    });

    // Thưa thôi: đây là nền cho lời chúc, không phải màn pháo hoa.
    const count = width < 640 ? 12 : 20;
    const petals = Array.from({ length: count }, () => make(false));

    let raf = 0;
    let last = 0;

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);

      for (const p of petals) {
        p.y += p.vy * dt;
        p.x += Math.sin(t * 0.6 + p.phase) * p.sway * dt;
        p.rot += p.vrot * dt;

        // Rơi hết màn thì thả lại từ trên xuống.
        if (p.y > height + 30) Object.assign(p, make(true));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
