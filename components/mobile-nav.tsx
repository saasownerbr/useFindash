"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Menu,
  X,
} from "lucide-react";

const icons: { [key: string]: React.ReactNode } = {
  "/dashboard": <BarChart3 className="h-5 w-5" />,
  "/estoque": <Package className="h-5 w-5" />,
  "/vendas/nova": <ShoppingCart className="h-5 w-5" />,
  "/clientes": <Users className="h-5 w-5" />,
  "/financeiro": <DollarSign className="h-5 w-5" />,
};

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
                {icons[item.href] || <Menu className="h-5 w-5" />}
                <span className="hidden">{item.label}</span>
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
          <div className="absolute left-0 right-0 top-0 flex max-h-96 flex-col gap-2 border-b border-border bg-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
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
