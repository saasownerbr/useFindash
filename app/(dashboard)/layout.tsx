import type { ReactNode } from "react";

import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

// Sidebar and bottom nav are both rendered and switched by CSS, so the mobile
// nav is in the server HTML and tappable before hydration instead of mounting
// only after a media query runs on the client.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Same 250ms ease-in-out as the sidebar's width, so the content moves with it. */}
      <main className="min-w-0 p-3 pb-24 transition-[margin-left] duration-[250ms] ease-in-out md:ml-[var(--sidebar-w)] md:p-8">
        {children}
      </main>
      <MobileNav />
      <Toaster />
    </div>
  );
}
