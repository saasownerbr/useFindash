"use client";

import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

import { currentTheme, type Theme } from "@/lib/theme";

export function Toaster() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    window.addEventListener("themechange", sync);
    return () => window.removeEventListener("themechange", sync);
  }, []);

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border text-foreground",
          success: "text-success",
          error: "text-danger",
        },
      }}
    />
  );
}
