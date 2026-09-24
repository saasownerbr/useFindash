"use client";

import { useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { APPLE_CATALOG, searchModels } from "@/lib/apple-catalog";
import { cn } from "@/lib/utils";

interface ModelComboboxProps {
  id?: string;
  value: string;
  /** Called on every keystroke and when a suggestion is picked. */
  onChange: (value: string) => void;
  /** Called only when a suggestion is picked. */
  onSelect?: (model: string) => void;
  /** Models to search; defaults to the Apple catalog. */
  models?: string[];
  placeholder?: string;
  className?: string;
}

/** Text field that filters the model list as you type, with no network calls. */
export function ModelCombobox({
  id,
  value,
  onChange,
  onSelect,
  models = APPLE_CATALOG.map((m) => m.model),
  placeholder = "Digite para buscar (ex: 13 Pro)",
  className,
}: ModelComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => searchModels(value, models), [value, models]);

  function pick(model: string) {
    onChange(model);
    onSelect?.(model);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open && matches[highlight]) {
      e.preventDefault();
      pick(matches[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delay so a click on a suggestion lands before the list closes.
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[#2A2A2A] bg-[#1A1A1A] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {matches.map((model, index) => (
            <li
              key={model}
              role="option"
              aria-selected={index === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => pick(model)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-foreground",
                index === highlight && "bg-primary/15 text-primary"
              )}
            >
              {model}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
