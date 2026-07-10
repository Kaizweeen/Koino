import { DevotionFlow } from "@/components/DevotionFlow";
import { DEVOTIONS } from "@/lib/devotions/content";
import { getTodayDevotion } from "@/lib/devotions/select";

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const devotion = getTodayDevotion(DEVOTIONS, today);
  return <DevotionFlow devotion={devotion} />;
}
