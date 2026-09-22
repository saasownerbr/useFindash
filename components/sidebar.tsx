"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col gap-1 border-r border-border bg-card p-4">
      <span className="mb-4 px-2 text-lg font-bold text-foreground">useFindash</span>
      {NAV_ITEMS.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              active && "bg-primary/10 text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
