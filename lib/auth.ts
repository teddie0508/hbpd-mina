import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "mina_editor";
const ISSUER = "hpbd-mina";
const SESSION_DAYS = 30;

/** Mật khẩu dùng lúc dev khi chưa đặt biến môi trường. Không dùng ở production. */
const DEV_PASSWORD = "mina";
const DEV_SECRET = "dev-only-secret-do-not-use-in-production";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function secretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET ?? (isProd() ? "" : DEV_SECRET);
  if (!raw) throw new Error("Thiếu AUTH_SECRET");
  return new TextEncoder().encode(raw);
}

function expectedPassword(): string {
  return process.env.CUSTOMIZE_PASSWORD ?? (isProd() ? "" : DEV_PASSWORD);
}

/** So sánh không rò rỉ thời gian, tránh đoán mật khẩu theo độ trễ. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  // Vẫn quét hết cả hai kể cả khi độ dài khác nhau.
  let diff = ba.length ^ bb.length;
  const len = Math.max(ba.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export function checkPassword(input: string): boolean {
  const expected = expectedPassword();
  if (!expected) return false; // production chưa cấu hình -> khoá hẳn
  return safeEqual(input, expected);
}

export async function createSession(): Promise<void> {
  const token = await new SignJWT({ role: "editor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isEditor(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey(), { issuer: ISSUER });
    return true;
  } catch {
    return false;
  }
}

/** Production mà quên đặt env thì báo để hiện cảnh báo trên trang đăng nhập. */
export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.CUSTOMIZE_PASSWORD);
}
