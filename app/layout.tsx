import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/auth-provider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "useFindash",
  description: "Gestão Inteligente para Lojistas de iPhone",
  icons: {
    icon: [
      { url: "/favicon.svg?v=3", type: "image/svg+xml" },
      { url: "/favicon.png?v=3", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png?v=3",
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
    // The boot script may add the "light" class before React hydrates.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
