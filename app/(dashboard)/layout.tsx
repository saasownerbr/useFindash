import type { ReactNode } from "react";

import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

// Sidebar and bottom nav are both rendered and switched by CSS, so the mobile
// nav is in the server HTML and tappable before hydration instead of mounting
// only after a media query runs on the client.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="min-w-0 flex-1 p-8 pb-24 md:pb-8">{children}</main>
      <MobileNav />
      <Toaster />
    </div>
  );
}
