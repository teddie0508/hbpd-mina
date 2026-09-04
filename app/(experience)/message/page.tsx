import { MessageScene } from "@/components/message/MessageScene";
import { getContent } from "@/lib/content/store";

export default async function MessagePage() {
  const content = await getContent();
  return <MessageScene content={content.message} />;
}
