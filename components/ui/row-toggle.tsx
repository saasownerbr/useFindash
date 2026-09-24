"use client";

import { useState, type HTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Mobile-only last cell of a `.rtable` row. Below 768px a row shows its two `.rt-key` cells;
 * this button reveals the others (each labelled by its `data-label`) under them.
 */
export function RowToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <td className="rt-toggle md:hidden">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        aria-expanded={open}
        className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary"
      >
        {open ? "Ocultar" : "Ver mais detalhes"}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
    </td>
  );
}

/** `<tr>` for a `.rtable` that manages its own "Ver mais detalhes" state on phones. */
export function ExpandableRow({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  const [open, setOpen] = useState(false);
  return (
    <tr data-open={open} {...props}>
      {children}
      <RowToggle open={open} onToggle={() => setOpen((o) => !o)} />
    </tr>
  );
}
