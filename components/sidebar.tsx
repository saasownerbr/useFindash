"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card px-4 pb-4">
      {/* 20px above the logo, 24px between it and the first menu item. */}
      <div className="flex justify-center px-2 pb-6 pt-5">
        <Logo size="sm" />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                active && "bg-primary/10 text-primary"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
