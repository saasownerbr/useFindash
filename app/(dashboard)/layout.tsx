"use client";

import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      <main className={`flex-1 p-8 ${isMobile ? "pb-24" : ""}`}>{children}</main>
      {isMobile && <MobileNav />}
      <Toaster />
    </div>
  );
}
