"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
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
