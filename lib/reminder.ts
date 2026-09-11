/**
 * Lời nhắc thêm vào lịch điện thoại. Dùng chung cho tệp .ics (máy chủ dựng)
 * và đường dẫn Google Calendar (trình duyệt dựng), để hai bên luôn cùng giờ.
 */

/** Sự kiện kéo dài qua giờ mở một chút, cho ô lịch không mỏng như sợi chỉ. */
const TAIL_MS = 15 * 60 * 1000;

export function reminderTimes(revealIso: string, leadMinutes: number) {
  const reveal = Date.parse(revealIso);
  return { start: reveal - leadMinutes * 60 * 1000, end: reveal + TAIL_MS };
}

/** `20261101T165500Z` — giờ UTC, lịch của máy tự đổi ra giờ địa phương. */
export function utcStamp(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function reminderDetails(url: string): string {
  return `Chuông reo là mở trang này ngay nhé, đừng để lỡ những giây cuối:\n${url}`;
}

export function googleCalendarUrl(opts: {
  title: string;
  start: number;
  end: number;
  details: string;
}): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${utcStamp(opts.start)}/${utcStamp(opts.end)}`,
    details: opts.details,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Gập dòng theo chuẩn iCalendar: tối đa 75 BYTE một dòng, dòng nối bắt đầu
 * bằng một dấu cách. Tính theo byte chứ không theo ký tự — một chữ tiếng Việt
 * có dấu là 2–3 byte, đếm ký tự thì dòng dài quá chuẩn và vài ứng dụng lịch
 * cắt ngang giữa một chữ.
 */
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    // Dòng nối đã tốn một byte cho dấu cách ở đầu.
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += size;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(opts: {
  uid: string;
  title: string;
  details: string;
  url: string;
  start: number;
  end: number;
  now: number;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//teddie//hpbd-mina//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${utcStamp(opts.now)}`,
    `DTSTART:${utcStamp(opts.start)}`,
    `DTEND:${utcStamp(opts.end)}`,
    `SUMMARY:${escapeText(opts.title)}`,
    `DESCRIPTION:${escapeText(opts.details)}`,
    `URL:${opts.url}`,
    // Chuông reo đúng lúc sự kiện bắt đầu, tức trước giờ mở `leadMinutes` phút.
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(opts.title)}`,
    "TRIGGER;RELATED=START:PT0S",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
