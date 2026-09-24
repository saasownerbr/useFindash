"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

// Every module sits in one horizontally scrolling bar; there is no overflow menu.
export function MobileNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  // The tapped item lights up right away instead of waiting for the route to load.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
    // Keep the current module visible when it lives at the end of the bar.
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <nav
      aria-label="Menu principal"
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 overflow-x-auto overflow-y-hidden border-t border-[#2A2A2A] bg-[#1A1A1A] pt-2 md:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex min-w-max flex-row items-center px-4">
        {NAV_ITEMS.map((item) => {
          const active = pendingHref ? pendingHref === item.href : isActiveRoute(pathname, item.href);
          return (
            <Link
              key={item.href}
              ref={isActiveRoute(pathname, item.href) ? activeRef : undefined}
              href={item.href}
              prefetch={true}
              onClick={() => {
                if (!isActiveRoute(pathname, item.href)) setPendingHref(item.href);
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-4 py-2",
                active ? "bg-[rgba(59,130,246,0.12)] text-[#3B82F6]" : "text-[#6B7280]"
              )}
            >
              <item.icon className="h-[22px] w-[22px]" aria-hidden />
              <span className={cn("whitespace-nowrap text-[10px]", active ? "font-semibold" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
