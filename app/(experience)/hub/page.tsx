import { Hub } from "@/components/hub/Hub";
import { getContent } from "@/lib/content/store";

export default async function HubPage() {
  const content = await getContent();
  return <Hub content={content.hub} />;
}
