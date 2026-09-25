import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const ZERO = /^0+([.,]0*)?$/;

/**
 * Numeric fields showing 0 empty out on focus so the user types straight away, and get the 0 back on blur if
 * nothing was typed. Only the DOM value changes (no change event), so controlled inputs that map "" to 0 and
 * react-hook-form registrations both keep their value until the user actually types.
 */
function clearZeroOnFocus(event: React.FocusEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  if (!ZERO.test(input.value)) return;
  input.dataset.zeroCleared = input.value;
  input.value = "";
}

function restoreZeroOnBlur(event: React.FocusEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const cleared = input.dataset.zeroCleared;
  if (cleared === undefined) return;
  delete input.dataset.zeroCleared;
  if (input.value === "") input.value = cleared;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, onFocus, onBlur, ...props }, ref) => {
  const numeric = type === "number" || props.inputMode === "decimal" || props.inputMode === "numeric";
  return (
    <input
      type={type}
      className={cn(
        "flex h-[42px] w-full rounded-[10px] border border-border bg-[#111111] px-3 py-2 text-sm text-foreground placeholder:text-[#505050] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      onFocus={(event) => {
        if (numeric) clearZeroOnFocus(event);
        onFocus?.(event);
      }}
      // Restore first so a registered field's onBlur validates the 0, not "".
      onBlur={(event) => {
        if (numeric) restoreZeroOnBlur(event);
        onBlur?.(event);
      }}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
