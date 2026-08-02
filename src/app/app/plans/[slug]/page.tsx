import { PlanView } from "@/components/PlanView";
import { PLANS } from "@/lib/plans";

export function generateStaticParams() {
  return PLANS.map((p) => ({ slug: p.slug }));
}

export default function PlanPage({ params }: { params: { slug: string } }) {
  return <PlanView slug={params.slug} />;
}
