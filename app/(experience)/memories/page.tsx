import { MemoriesScene } from "@/components/memories/MemoriesScene";
import { getContent } from "@/lib/content/store";

export default async function MemoriesPage() {
  const content = await getContent();
  return <MemoriesScene content={content.memories} />;
}
