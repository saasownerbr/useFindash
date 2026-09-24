"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-[#1E1E1E] bg-[#0D0D0D] px-3 pb-4 md:flex">
      <div className="mb-2 flex p-5">
        <Logo size="sm" />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item, index) => {
          const active = isActiveRoute(pathname, item.href);
          const newGroup = index > 0 && NAV_ITEMS[index - 1].group !== item.group;
          return (
            <Fragment key={item.href}>
              {newGroup && <div role="separator" className="my-2 border-b border-[#1E1E1E]" />}
              <Link
                href={item.href}
                prefetch={true}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] border-l-2 px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "border-l-primary bg-[rgba(218,232,120,0.08)] font-semibold text-primary"
                    : "border-l-transparent font-medium text-[#606060] hover:bg-card hover:text-[#D0D0D0]"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
