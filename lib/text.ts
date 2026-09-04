/**
 * Tách một khối chữ soạn ở /customize thành từng đoạn.
 * Ngăn đoạn bằng dòng trống; xuống dòng đơn vẫn nằm trong cùng một đoạn.
 */
export function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
