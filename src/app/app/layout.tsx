import { TabBar } from "@/components/TabBar";
import { SideRail } from "@/components/SideRail";
import { StorageNotice } from "@/components/StorageNotice";

/**
 * HubLayout — mobile keeps the floating phone-width paper column with a bottom
 * TabBar (unchanged). At lg and up the frame opens out: a quiet SideRail sits to
 * the left and the content area drops the max-width, paper fill, and column
 * shadow so each screen can lay itself out across the desktop canvas.
 */
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] lg:flex">
      <SideRail />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col bg-paper shadow-column lg:mx-0 lg:max-w-none lg:flex-1 lg:bg-transparent lg:shadow-none">
        <StorageNotice />
        <div className="flex-1">{children}</div>
        <TabBar />
      </div>
    </div>
  );
}
