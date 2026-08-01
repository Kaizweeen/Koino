import { TabBar } from "@/components/TabBar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-sm flex-col bg-paper shadow-column">
      <div className="flex-1">{children}</div>
      <TabBar />
    </div>
  );
}
