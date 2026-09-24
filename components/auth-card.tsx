import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";

export const authInputClass =
  "!h-11 !rounded-lg !border-[#242424] !bg-[#111111] !text-[#F0F0F0] placeholder:!text-[#666666]";

export function AuthCard({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F] px-4 py-10">
      <div className="w-full max-w-[400px] rounded-2xl border border-[#242424] bg-[#1A1A1A] p-6 sm:p-10">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
