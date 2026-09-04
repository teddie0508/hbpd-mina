import { FlowersScene } from "@/components/flowers/FlowersScene";
import { getContent } from "@/lib/content/store";

export default async function FlowersPage() {
  const content = await getContent();
  return <FlowersScene content={content.flowers} />;
}
