import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
      <Toaster />
    </div>
  );
}
