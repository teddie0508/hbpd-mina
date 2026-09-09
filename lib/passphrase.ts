/**
 * Chuẩn hoá câu trả lời trước khi so.
 *
 * Đây là lớp khoá để tạo bất ngờ chứ không phải để bảo mật, nên nguyên tắc là
 * gõ kiểu gì đúng ý cũng phải cho qua:
 *  - hoa hay thường đều được
 *  - có dấu hay không dấu đều được ("nguyễn huyền my" = "nguyen huyen my"),
 *    vì bàn phím điện thoại có lúc tự bỏ dấu, mà cô ấy cũng có thể gõ vội
 *  - thừa khoảng trắng ở đầu, ở cuối hay ở giữa đều được
 *
 * `đ` phải xử lý riêng: nó là một ký tự độc lập trong Unicode chứ không phải
 * "d + dấu", nên NFD không tách ra được.
 */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/** Câu trả lời có nằm trong danh sách được chấp nhận không. */
export function matchesAnswer(guess: string, answers: string[]): boolean {
  const normalized = normalizeAnswer(guess);
  if (!normalized) return false;
  return answers.some((answer) => normalizeAnswer(answer) === normalized);
}
