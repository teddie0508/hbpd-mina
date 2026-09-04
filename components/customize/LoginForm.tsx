"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Không đăng nhập được");
        setPassword("");
        return;
      }

      router.replace("/customize");
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-cream text-2xl font-medium tracking-tight">
        Khu chỉnh sửa
      </h1>
      <p className="text-mist/70 mt-2 text-sm">
        Chỉ mình bạn vào đây. Mina xem trang ở địa chỉ gốc.
      </p>

      {!configured ? (
        <p className="border-gold/40 bg-gold/10 text-gold mt-6 rounded-lg border px-3 py-2.5 text-xs leading-relaxed">
          Chưa đặt <code>CUSTOMIZE_PASSWORD</code> và <code>AUTH_SECRET</code>{" "}
          trong biến môi trường, nên khu này đang khoá hoàn toàn. Thêm hai biến
          đó trong phần Settings của project trên Vercel rồi deploy lại.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="password"
            className="text-mist/80 mb-1.5 block text-xs tracking-wide uppercase"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-mist/25 bg-base/60 text-cream placeholder:text-mist/40 focus:border-gold/60 focus:ring-gold/30 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="bg-gold text-deep hover:bg-gold/90 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Đang kiểm tra..." : "Vào"}
        </button>
      </form>
    </div>
  );
}
