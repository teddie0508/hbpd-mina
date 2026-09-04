import { Landing } from "@/components/landing/Landing";
import { isEditor } from "@/lib/auth";
import { getContent } from "@/lib/content/store";

// Phụ thuộc vào thời điểm hiện tại và cookie đăng nhập, nên không cache được.
export const dynamic = "force-dynamic";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [content, params] = await Promise.all([getContent(), searchParams]);

  // ?preview=1 cho phép bạn xem trước khi chưa tới ngày — nhưng phải đã đăng nhập,
  // để người khác đoán được link cũng không mở sớm được.
  const canPreview = params.preview === "1" && (await isEditor());

  const revealAt = content.countdown.revealAt;
  const lockedOnServer =
    !canPreview &&
    Boolean(revealAt) &&
    Date.now() < new Date(revealAt!).getTime();

  return <Landing content={content} lockedOnServer={lockedOnServer} />;
}
