import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h2
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3",
        className
      )}
    >
      {children}
    </h2>
  );
}
