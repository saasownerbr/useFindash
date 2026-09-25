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
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 overflow-x-auto overflow-y-hidden border-t border-[#1E1E1E] bg-[#0D0D0D] pt-1 md:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex min-w-max flex-row items-center">
        {NAV_ITEMS.map((item) => {
          const active = pendingHref ? pendingHref === item.href : isActiveRoute(pathname, item.href);
          if (item.disabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className="flex min-h-[56px] min-w-[56px] cursor-not-allowed flex-col items-center justify-center gap-1 px-3 text-[#404040]"
              >
                <item.icon className="h-[22px] w-[22px]" aria-hidden />
                <span className="whitespace-nowrap text-[10px] font-normal">{item.label}</span>
              </span>
            );
          }
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
                // 56px minimum touch area; only the color marks the active module.
                "flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1 px-3 transition-colors duration-150 ease-in-out",
                active ? "text-primary" : "text-[#606060] hover:text-[#D0D0D0]"
              )}
            >
              <item.icon className="h-[22px] w-[22px]" aria-hidden />
              <span className={cn("whitespace-nowrap text-[10px]", active ? "font-semibold" : "font-normal")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
