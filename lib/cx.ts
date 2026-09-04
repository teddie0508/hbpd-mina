type ClassValue = string | false | null | undefined;

/** Nối class có điều kiện. Nhỏ gọn, đủ dùng, khỏi kéo thêm thư viện. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
