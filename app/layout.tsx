import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/auth-provider";
import { SIDEBAR_BOOT_SCRIPT } from "@/lib/sidebar";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "useFindash",
  description: "Gestão Inteligente para Lojistas de iPhone",
  // ?v= busts the browser's favicon cache; bump it whenever the icons change.
  icons: {
    icon: [{ url: "/favicon.svg?v=5", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png?v=5",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  colorScheme: "dark",
  // Lets env(safe-area-inset-bottom) keep the bottom nav clear of the iPhone home indicator.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The boot scripts may add the "light" class and data-sidebar before React hydrates.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT + SIDEBAR_BOOT_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
