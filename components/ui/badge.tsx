import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", {
  variants: {
    variant: {
      default: "border-transparent bg-[#242424] text-[#D0D0D0]",
      success: "border-transparent bg-[rgba(16,185,129,0.10)] text-[#10B981]",
      warning: "border-transparent bg-[rgba(245,158,11,0.10)] text-[#F59E0B]",
      danger: "border-transparent bg-[rgba(239,68,68,0.10)] text-[#EF4444]",
      primary: "border-transparent bg-[rgba(218,232,120,0.10)] text-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
