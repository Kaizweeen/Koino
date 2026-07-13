import { TabBar } from "@/components/TabBar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col border-x border-black/5 bg-paper">
      <div className="flex-1">{children}</div>
      <TabBar />
    </div>
  );
}
