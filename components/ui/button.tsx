import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary font-bold text-primary-foreground hover:bg-primary-hover",
        secondary: "border border-[#242424] bg-card text-foreground hover:border-primary hover:text-primary",
        ghost: "bg-transparent text-muted-foreground hover:text-foreground",
        danger: "border border-[rgba(239,68,68,0.20)] bg-[rgba(239,68,68,0.10)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.16)]",
      },
      size: {
        default: "h-[42px] px-4 py-2",
        sm: "h-8 px-3 text-xs",
        icon: "h-[42px] w-[42px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
