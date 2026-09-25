"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState, type FocusEvent, type MouseEvent } from "react";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { isSidebarCollapsed, setSidebarCollapsed } from "@/lib/sidebar";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/ui/logo";

// Collapsed-state styles key off data-sidebar on <html> (set before first paint),
// so the server HTML already renders in the right state.
const WHEN_COLLAPSED_HIDE = "[[data-sidebar=collapsed]_&]:hidden";
const WHEN_EXPANDED_HIDE = "hidden [[data-sidebar=collapsed]_&]:block";
const LABEL = "transition-opacity duration-[250ms] ease-in-out [[data-sidebar=collapsed]_&]:opacity-0";
const ROW = "flex w-full items-center gap-3 whitespace-nowrap rounded-[10px] border-l-2 px-[10px] py-2.5 text-sm transition-colors";

interface Tip {
  label: string;
  top: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // Fixed-position so the sidebar's own overflow can't clip it.
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    setCollapsed(isSidebarCollapsed());
  }, []);

  function toggle() {
    const next = !isSidebarCollapsed();
    setSidebarCollapsed(next);
    setCollapsed(next);
    setTip(null);
  }

  function showTip(label: string) {
    return (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
      if (!isSidebarCollapsed()) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setTip({ label, top: rect.top + rect.height / 2 });
    };
  }

  const hideTip = () => setTip(null);

  return (
    <>
      <aside
        onScroll={hideTip}
        className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w)] flex-col overflow-y-auto overflow-x-hidden border-r border-[#1E1E1E] bg-[#0D0D0D] px-3 pb-4 transition-[width] duration-[250ms] ease-in-out md:flex"
      >
        <div className="mb-2 flex h-[60px] shrink-0 items-center px-5 [[data-sidebar=collapsed]_&]:justify-center [[data-sidebar=collapsed]_&]:px-0">
          <Logo size="sm" className={WHEN_COLLAPSED_HIDE} />
          <LogoMark size={24} className={WHEN_EXPANDED_HIDE} />
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
                  onMouseEnter={showTip(item.label)}
                  onMouseLeave={hideTip}
                  onFocus={showTip(item.label)}
                  onBlur={hideTip}
                  className={cn(
                    ROW,
                    active
                      ? "border-l-primary bg-[rgba(218,232,120,0.08)] font-semibold text-primary"
                      : "border-l-transparent font-medium text-[#606060] hover:bg-card hover:text-[#D0D0D0]"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className={LABEL}>{item.label}</span>
                </Link>
              </Fragment>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onMouseEnter={showTip("Expandir menu")}
            onMouseLeave={hideTip}
            onFocus={showTip("Expandir menu")}
            onBlur={hideTip}
            className={cn(ROW, "border-l-transparent font-medium text-[#606060] hover:bg-card hover:text-[#D0D0D0]")}
          >
            <ChevronLeft className={cn("h-4 w-4 shrink-0", WHEN_COLLAPSED_HIDE)} aria-hidden />
            <ChevronRight className={cn("h-4 w-4 shrink-0", WHEN_EXPANDED_HIDE)} aria-hidden />
            <span className={LABEL}>Recolher menu</span>
          </button>
        </div>
      </aside>

      {tip && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-[8px] border border-[#242424] bg-[#1A1A1A] px-3 py-1.5 text-[13px] text-[#F0F0F0] md:block"
          style={{ top: tip.top, left: "calc(var(--sidebar-w) + 8px)" }}
        >
          {tip.label}
        </div>
      )}
    </>
  );
}
