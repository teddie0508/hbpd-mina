import { getContent } from "@/lib/content/store";
import { buildIcs, reminderDetails, reminderTimes } from "@/lib/reminder";

export const dynamic = "force-dynamic";

/**
 * Tệp lịch (.ics) cho nút "Nhắc em lúc 0h".
 *
 * Trên iPhone, Safari mở thẳng tệp này thành bảng "Thêm vào Lịch" kèm chuông
 * báo; Android tải về rồi mở bằng ứng dụng lịch. Không khoá sau cổng nào: tệp
 * chỉ chứa giờ mở (màn đếm ngược vốn đã hiện) và đường dẫn trang.
 */
export async function GET(request: Request) {
  const content = await getContent();
  const { revealAt, reminder } = content.countdown;
  if (!revealAt || !reminder.enabled) {
    return new Response("Không có lời nhắc nào.", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const url = `${origin}/`;
  const { start, end } = reminderTimes(revealAt, reminder.leadMinutes);

  const body = buildIcs({
    // UID cố định theo giờ mở: bấm thêm lần nữa thì lịch cập nhật sự kiện cũ
    // thay vì đẻ ra một sự kiện trùng.
    uid: `mina-reveal-${Date.parse(revealAt)}@${new URL(origin).host}`,
    title: reminder.eventTitle,
    details: reminderDetails(url),
    url,
    start,
    end,
    now: Date.now(),
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nhac-em-0h.ics"',
      "Cache-Control": "no-store",
    },
  });
}
