"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Menu, X } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryItems = NAV_ITEMS.slice(0, 5);
  const secondaryItems = NAV_ITEMS.slice(5);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          {primaryItems.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}

          {/* Menu button for secondary items */}
          {secondaryItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col items-center gap-1 px-3 py-2"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </nav>

      {/* Drawer for secondary items */}
      {menuOpen && secondaryItems.length > 0 && (
        <div className="fixed inset-0 top-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div className="absolute left-0 right-0 top-0 flex max-h-96 flex-col gap-4 border-b border-border bg-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center">
              <Logo size="sm" />
            </div>
            {secondaryItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
