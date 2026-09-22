# useFindash Foundation (Scaffold + Auth + Layout Shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working Next.js 14 app — scaffold, dark design system, Supabase auth (magic link) with multi-tenant onboarding, and the protected dashboard shell — as a deployable, testable slice. No business modules (estoque, vendas, etc.) yet; those are separate follow-up plans.

**Architecture:** Next.js 14 App Router + TypeScript, Tailwind CSS with shadcn/ui primitives on hand-authored dark tokens, Supabase (`@supabase/ssr`) for auth and data access split into browser/server/middleware clients, Zod + React Hook Form for all forms, Vitest for pure-logic unit tests (auth redirect rules, validation schemas, nav active-route logic). The Supabase project and schema already exist and are live (see spec); this plan only adds the app that talks to them.

**Tech Stack:** Next.js 14.2.x, React 18, TypeScript 5, Tailwind CSS 3, shadcn/ui (hand-added components, no CLI), @supabase/ssr + @supabase/supabase-js, Zod, React Hook Form + @hookform/resolvers, Vitest + @vitejs/plugin-react.

**Spec:** [docs/superpowers/specs/2026-09-22-usefindash-saas-design.md](../specs/2026-09-22-usefindash-saas-design.md)

## Global Constraints

- Next.js 14 with App Router and TypeScript (spec section 2).
- Tailwind CSS + shadcn/ui, dark theme fixed, no light/dark toggle (spec sections 2, 10).
- Design tokens (spec section 10): `--bg:#0F0F0F` `--card:#1A1A1A` `--border:#2A2A2A` `--primary:#3B82F6` `--success:#10B981` `--warning:#F59E0B` `--danger:#EF4444` `--text:#F8F8F8` `--text-secondary:#9CA3AF`.
- Supabase Auth via magic link; Resend replaces Supabase's default SMTP for all auth emails (spec sections 2, 8).
- `store_id` is the multi-tenant isolation key; every table-level policy already enforces `auth.uid() IN (SELECT user_id FROM store_users WHERE store_id = ...)` (spec section 3) — the app must never bypass this by trusting a client-supplied `store_id`.
- No IMEI lookup integration in v1 (spec section 7) — out of scope for this plan and all later ones until revisited.
- Zod for all validation, React Hook Form for all forms (spec section 2).
- Live project: Supabase project `useFindash` (`crfmlimzjcztzlvylrpf`, `https://crfmlimzjcztzlvylrpf.supabase.co`). Credentials already in `.env.local` (gitignored).

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `next-env.d.ts`
- Create: `.eslintrc.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css` (minimal placeholder; full tokens land in Task 2)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a runnable Next.js dev server on `http://localhost:3000`; `@/*` path alias resolving to the repo root, used by every later task's imports.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "usefindash",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.4",
    "zod": "^3.23.8",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "recharts": "^2.12.7",
    "zustand": "^4.5.5",
    "resend": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "lucide-react": "^0.446.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "@types/node": "^20.16.10",
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.13",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.15",
    "vitest": "^2.1.2",
    "@vitejs/plugin-react": "^4.3.1"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 5: Write `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 6: Write `app/globals.css` (placeholder)**

```css
html,
body {
  margin: 0;
  padding: 0;
}
```

- [ ] **Step 7: Write `app/layout.tsx`**

```tsx
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "useFindash",
  description: "Gestão inteligente para lojistas de iPhone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Write `app/page.tsx`**

```tsx
export default function RootPage() {
  return <p>useFindash</p>;
}
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: completes with a `node_modules/` directory and no errors (warnings are fine).

- [ ] **Step 10: Verify the dev server boots**

Run: `npm run dev` (in the background or a second terminal), then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: `200`. Stop the dev server afterward.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs next-env.d.ts .eslintrc.json app/layout.tsx app/page.tsx app/globals.css
git commit -m "feat: scaffold Next.js 14 project"
```

---

### Task 2: Design tokens and Tailwind theme

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: Tailwind utility classes (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-primary`/`text-primary`, `bg-secondary`, `text-success`, `text-warning`, `text-danger`) that every later UI task uses. These exact class names are the contract — don't rename them in later tasks.

- [ ] **Step 1: Write `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Write `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--primary))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 6%;
  --foreground: 0 0% 97%;
  --card: 0 0% 10%;
  --card-foreground: 0 0% 97%;
  --border: 0 0% 16%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 16%;
  --secondary-foreground: 0 0% 97%;
  --muted: 0 0% 16%;
  --muted-foreground: 218 11% 65%;
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --danger: 0 84% 60%;
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

- [ ] **Step 4: Update `app/page.tsx` to prove the tokens work**

```tsx
export default function RootPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-foreground">
        useFindash
      </p>
    </main>
  );
}
```

- [ ] **Step 5: Verify visually**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: near-black page (`#0F0F0F`) with a slightly lighter card (`#1A1A1A`) showing "useFindash" in near-white text. Stop the dev server afterward.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts postcss.config.js app/globals.css app/page.tsx
git commit -m "feat: add dark design tokens and Tailwind theme"
```

---

### Task 3: shadcn/ui primitives

**Files:**
- Create: `lib/utils.ts`
- Create: `components.json`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/card.tsx`

**Interfaces:**
- Consumes: Tailwind tokens from Task 2 (`bg-primary`, `bg-card`, `border-border`, etc.).
- Produces: `cn()` from `@/lib/utils`; `Button` (props: `variant: "default"|"secondary"|"ghost"|"danger"`, `size: "default"|"sm"|"icon"`, `asChild?: boolean`), `Input`, `Label`, `Card`/`CardHeader`/`CardTitle`/`CardContent` from `@/components/ui/*` — every later form/page task uses these.

- [ ] **Step 1: Write `lib/utils.ts`**

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Write `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 3: Write `components/ui/button.tsx`**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        danger: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        icon: "h-10 w-10",
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
```

- [ ] **Step 4: Write `components/ui/input.tsx`**

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 5: Write `components/ui/label.tsx`**

```tsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn("text-sm font-medium text-foreground", className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 6: Write `components/ui/card.tsx`**

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border border-border bg-card text-foreground", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
```

- [ ] **Step 7: Install Radix peer deps and verify build**

Run: `npm install` (picks up `@radix-ui/react-slot`, `@radix-ui/react-label`, `class-variance-authority` already in `package.json` from Task 1), then `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add lib/utils.ts components.json components/ui
git commit -m "feat: add shadcn/ui primitives (button, input, label, card)"
```

---

### Task 4: Auth redirect logic (TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/auth/resolve-redirect.ts`
- Test: `tests/lib/auth/resolve-redirect.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `resolveAuthRedirect(pathname: string, isAuthenticated: boolean, hasStore: boolean | null): string | null` — Task 5's `middleware.ts` calls this directly; the signature and null-means-"don't redirect" contract must stay exactly this shape.

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/lib/auth/resolve-redirect.test.ts
import { describe, expect, it } from "vitest";

import { resolveAuthRedirect } from "@/lib/auth/resolve-redirect";

describe("resolveAuthRedirect", () => {
  it("sends unauthenticated users on protected routes to /login", () => {
    expect(resolveAuthRedirect("/dashboard", false, null)).toBe("/login");
  });

  it("lets unauthenticated users reach /login", () => {
    expect(resolveAuthRedirect("/login", false, null)).toBeNull();
  });

  it("sends authenticated users without a store from /dashboard to /onboarding", () => {
    expect(resolveAuthRedirect("/dashboard", true, false)).toBe("/onboarding");
  });

  it("sends authenticated users with a store away from /login to /dashboard", () => {
    expect(resolveAuthRedirect("/login", true, true)).toBe("/dashboard");
  });

  it("lets authenticated users with a store stay on /dashboard", () => {
    expect(resolveAuthRedirect("/dashboard", true, true)).toBeNull();
  });

  it("keeps authenticated users with a store off /onboarding", () => {
    expect(resolveAuthRedirect("/onboarding", true, true)).toBe("/dashboard");
  });

  it("lets authenticated users without a store stay on /onboarding", () => {
    expect(resolveAuthRedirect("/onboarding", true, false)).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth/resolve-redirect.test.ts`
Expected: FAIL — `Cannot find module '@/lib/auth/resolve-redirect'`.

- [ ] **Step 4: Write the implementation**

```ts
// lib/auth/resolve-redirect.ts
const PUBLIC_PATHS = ["/login", "/auth/callback"];

export function resolveAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
  hasStore: boolean | null
): string | null {
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!isAuthenticated) {
    return isPublicPath ? null : "/login";
  }

  if (isPublicPath) {
    return hasStore ? "/dashboard" : "/onboarding";
  }

  if (pathname.startsWith("/onboarding")) {
    return hasStore ? "/dashboard" : null;
  }

  if (hasStore === false) {
    return "/onboarding";
  }

  return null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth/resolve-redirect.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts lib/auth/resolve-redirect.ts tests/lib/auth/resolve-redirect.test.ts
git commit -m "feat: add auth redirect rules with tests"
```

---

### Task 5: Supabase clients and middleware

**Files:**
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `resolveAuthRedirect` from Task 4.
- Produces: `createClient()` (browser, from `@/lib/supabase/client`) and `createClient()` (server/Route Handlers, from `@/lib/supabase/server`) — both typed with `Database` from `@/lib/supabase/types`. Every later task that reads/writes Supabase data imports one of these two, never instantiates `createBrowserClient`/`createServerClient` directly.

- [ ] **Step 1: Write `lib/supabase/types.ts`**

Generated from the live schema (`crfmlimzjcztzlvylrpf`) — paste verbatim, do not hand-edit:

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accessories: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          id: string
          name: string
          quantity: number
          sale_price: number
          store_id: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string
          id?: string
          name: string
          quantity?: number
          sale_price: number
          store_id: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          sale_price?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accessories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_entries: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          month: string
          store_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description: string
          id?: string
          month: string
          store_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          month?: string
          store_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_entries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          acquisition_channel: string | null
          birthdate: string | null
          created_at: string
          id: string
          ltv: number
          name: string
          store_id: string
          whatsapp: string
        }
        Insert: {
          acquisition_channel?: string | null
          birthdate?: string | null
          created_at?: string
          id?: string
          ltv?: number
          name: string
          store_id: string
          whatsapp: string
        }
        Update: {
          acquisition_channel?: string | null
          birthdate?: string | null
          created_at?: string
          id?: string
          ltv?: number
          name?: string
          store_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_inputs: {
        Row: {
          created_at: string
          id: string
          leads_instagram: number
          leads_pdv: number
          leads_referral: number
          leads_whatsapp: number
          month: string
          paid_traffic_investment: number
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leads_instagram?: number
          leads_pdv?: number
          leads_referral?: number
          leads_whatsapp?: number
          month: string
          paid_traffic_investment?: number
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leads_instagram?: number
          leads_pdv?: number
          leads_referral?: number
          leads_whatsapp?: number
          month?: string
          paid_traffic_investment?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_inputs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      price_reference: {
        Row: {
          base_price: number
          grade_multiplier_a: number
          grade_multiplier_a_plus: number
          grade_multiplier_b: number
          grade_multiplier_c: number
          id: string
          model: string
          storage: string
          store_id: string
          updated_at: string
        }
        Insert: {
          base_price: number
          grade_multiplier_a?: number
          grade_multiplier_a_plus?: number
          grade_multiplier_b?: number
          grade_multiplier_c?: number
          id?: string
          model: string
          storage: string
          store_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          grade_multiplier_a?: number
          grade_multiplier_a_plus?: number
          grade_multiplier_b?: number
          grade_multiplier_c?: number
          id?: string
          model?: string
          storage?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_reference_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          acquisition_cost: number
          checkup_data: Json | null
          color: string | null
          created_at: string
          days_in_stock: number
          final_price: number | null
          grade: string | null
          id: string
          imei: string | null
          model: string
          purchase_date: string | null
          repair_cost: number
          status: string
          storage: string
          store_id: string
          suggested_price: number | null
          supplier: string | null
          type: string
        }
        Insert: {
          acquisition_cost: number
          checkup_data?: Json | null
          color?: string | null
          created_at?: string
          days_in_stock?: number
          final_price?: number | null
          grade?: string | null
          id?: string
          imei?: string | null
          model: string
          purchase_date?: string | null
          repair_cost?: number
          status?: string
          storage: string
          store_id: string
          suggested_price?: number | null
          supplier?: string | null
          type: string
        }
        Update: {
          acquisition_cost?: number
          checkup_data?: Json | null
          color?: string | null
          created_at?: string
          days_in_stock?: number
          final_price?: number | null
          grade?: string | null
          id?: string
          imei?: string | null
          model?: string
          purchase_date?: string | null
          repair_cost?: number
          status?: string
          storage?: string
          store_id?: string
          suggested_price?: number | null
          supplier?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_accessories: {
        Row: {
          accessory_id: string
          id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          accessory_id: string
          id?: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          accessory_id?: string
          id?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_accessories_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "accessories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_accessories_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          acquisition_cost: number
          commission_amount: number | null
          customer_id: string
          gross_margin: number | null
          id: string
          installments: number
          payment_method: string | null
          product_id: string | null
          repair_cost: number
          sale_channel: string
          sale_price: number
          seller_id: string
          sold_at: string
          store_id: string
        }
        Insert: {
          acquisition_cost?: number
          commission_amount?: number | null
          customer_id: string
          gross_margin?: number | null
          id?: string
          installments?: number
          payment_method?: string | null
          product_id?: string | null
          repair_cost?: number
          sale_channel: string
          sale_price: number
          seller_id: string
          sold_at?: string
          store_id: string
        }
        Update: {
          acquisition_cost?: number
          commission_amount?: number | null
          customer_id?: string
          gross_margin?: number | null
          id?: string
          installments?: number
          payment_method?: string | null
          product_id?: string | null
          repair_cost?: number
          sale_channel?: string
          sale_price?: number
          seller_id?: string
          sold_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "store_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          name: string
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          name: string
          role: string
          store_id: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          name?: string
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          monthly_revenue_goal: number
          name: string
          stock_alert_days: number
          upgrade_alert_months: number
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_revenue_goal?: number
          name: string
          stock_alert_days?: number
          upgrade_alert_months?: number
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_revenue_goal?: number
          name?: string
          stock_alert_days?: number
          upgrade_alert_months?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_store_with_owner: {
        Args: { monthly_goal?: number; owner_name: string; store_name: string }
        Returns: string
      }
      has_store_role: {
        Args: { roles: string[]; target_store_id: string }
        Returns: boolean
      }
      is_store_member: { Args: { target_store_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
```

- [ ] **Step 2: Write `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Write `lib/supabase/server.ts`**

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render; middleware refreshes the
            // session on every request, so this failure is safe to ignore.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Write `lib/supabase/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
```

- [ ] **Step 5: Write `middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";

import { resolveAuthRedirect } from "@/lib/auth/resolve-redirect";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);

  let hasStore: boolean | null = null;
  if (user) {
    const { count } = await supabase
      .from("store_users")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasStore = (count ?? 0) > 0;
  }

  const redirectTo = resolveAuthRedirect(request.nextUrl.pathname, !!user, hasStore);

  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 6: Verify the build and existing tests still pass**

Run: `npm run build && npx vitest run`
Expected: build succeeds; the 7 tests from Task 4 still pass (middleware isn't exercised by Vitest — it needs a running server, covered manually in Task 7).

- [ ] **Step 7: Commit**

```bash
git add lib/supabase middleware.ts
git commit -m "feat: add Supabase browser/server clients and auth middleware"
```

---

### Task 6: Login page (magic link)

**Files:**
- Create: `lib/validation/auth.ts`
- Test: `tests/lib/validation/auth.test.ts`
- Create: `app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `Label` (Task 3), `createClient` from `@/lib/supabase/client` (Task 5).
- Produces: `loginSchema` / `LoginInput` from `@/lib/validation/auth`, reused nowhere else in this plan but establishes the validation pattern later plans follow.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/validation/auth.test.ts
import { describe, expect, it } from "vitest";

import { loginSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid email", () => {
    expect(loginSchema.safeParse({ email: "dono@loja.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nao-e-email" }).success).toBe(false);
  });

  it("rejects an empty email", () => {
    expect(loginSchema.safeParse({ email: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/validation/auth.test.ts`
Expected: FAIL — `Cannot find module '@/lib/validation/auth'`.

- [ ] **Step 3: Write `lib/validation/auth.ts`**

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Digite seu email.").email("Digite um email válido."),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/validation/auth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write `app/(auth)/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Entrar no useFindash</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviamos um link de acesso para o seu email.
        </p>

        {status === "sent" ? (
          <p className="mt-6 text-sm text-success">Link enviado! Confira sua caixa de entrada.</p>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="voce@loja.com" {...register("email")} />
              {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar link de acesso"}
            </Button>
            {status === "error" && (
              <span className="text-xs text-danger">Não foi possível enviar o link. Tente novamente.</span>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify visually**

Run: `npm run dev`, open `http://localhost:3000/login`, submit a real email you can check.
Expected: page renders per the design tokens; after submit, either "Link enviado!" appears or (if Task 8's SMTP setup isn't done yet) Supabase still records the OTP request — check the Supabase Dashboard → Authentication → Users to confirm a magic-link request was logged. Stop the dev server afterward.

- [ ] **Step 7: Commit**

```bash
git add lib/validation/auth.ts tests/lib/validation/auth.test.ts "app/(auth)/login"
git commit -m "feat: add magic-link login page"
```

---

### Task 7: Auth callback route

**Files:**
- Create: `app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 5).
- Produces: the `/auth/callback` route that `emailRedirectTo` in Task 6 points to; nothing downstream depends on this file directly.

- [ ] **Step 1: Write `app/auth/callback/route.ts`**

```ts
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, go through `/login` with a real email, click the magic link from the inbox.
Expected: browser lands on `/dashboard` (which doesn't exist as a page yet — see Task 10 — so this will 404 until then; confirm instead that it redirects to `/onboarding` if `middleware.ts` from Task 5 is active and the user has no store yet, or a 404 on `/dashboard` if they do — either way, no redirect loop and no auth error). Stop the dev server afterward.

- [ ] **Step 3: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: add Supabase auth callback route"
```

---

### Task 8: Configure Resend as Supabase's SMTP provider (manual, dashboard-only)

This step has no code — Supabase's custom SMTP setting isn't exposed through the SQL migrations or MCP tools used elsewhere in this project, only through the Supabase Dashboard.

**Files:** none.

- [ ] **Step 1: Get Resend SMTP credentials**

In resend.com → Settings → SMTP: host `smtp.resend.com`, port `465` (or `587`), username `resend`, password = the Resend API key already in `.env.local` as `RESEND_API_KEY`.

- [ ] **Step 2: Configure Supabase**

In the Supabase Dashboard for project `useFindash` → Authentication → Settings → SMTP Settings: enable "Custom SMTP", fill in the host/port/username/password from Step 1, set sender email to an address on the verified Resend domain (e.g. `login@<seu-dominio-verificado>`), sender name `useFindash`.

- [ ] **Step 3: Verify**

Trigger a login from `/login` (Task 6) with a real email.
Expected: the magic-link email arrives and, in Resend's dashboard (Logs), shows a delivered email — confirming Supabase is now sending through Resend instead of its default limited-volume SMTP.

No commit — this task changes provider configuration only, not repo files.

---

### Task 9: Onboarding (create store)

**Files:**
- Create: `lib/validation/onboarding.ts`
- Test: `tests/lib/validation/onboarding.test.ts`
- Create: `app/(auth)/onboarding/page.tsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `Label` (Task 3), `createClient` from `@/lib/supabase/client` (Task 5), the `create_store_with_owner` RPC (already deployed — see spec section 3 / `lib/supabase/types.ts` `Functions`).
- Produces: `onboardingSchema` / `OnboardingInput` from `@/lib/validation/onboarding`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/validation/onboarding.test.ts
import { describe, expect, it } from "vitest";

import { onboardingSchema } from "@/lib/validation/onboarding";

describe("onboardingSchema", () => {
  it("accepts a valid store name and goal", () => {
    const result = onboardingSchema.safeParse({ storeName: "iStore Centro", monthlyRevenueGoal: 50000 });
    expect(result.success).toBe(true);
  });

  it("rejects a store name shorter than 2 characters", () => {
    expect(onboardingSchema.safeParse({ storeName: "a", monthlyRevenueGoal: 0 }).success).toBe(false);
  });

  it("rejects a negative goal", () => {
    expect(onboardingSchema.safeParse({ storeName: "iStore", monthlyRevenueGoal: -1 }).success).toBe(false);
  });

  it("coerces a numeric string goal", () => {
    const result = onboardingSchema.safeParse({ storeName: "iStore", monthlyRevenueGoal: "1000" });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/validation/onboarding.test.ts`
Expected: FAIL — `Cannot find module '@/lib/validation/onboarding'`.

- [ ] **Step 3: Write `lib/validation/onboarding.ts`**

```ts
import { z } from "zod";

export const onboardingSchema = z.object({
  storeName: z.string().trim().min(2, "Nome da loja precisa ter pelo menos 2 caracteres."),
  monthlyRevenueGoal: z.coerce.number().min(0, "A meta não pode ser negativa."),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/validation/onboarding.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write `app/(auth)/onboarding/page.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { monthlyRevenueGoal: 0 },
  });

  async function onSubmit(data: OnboardingInput) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase.rpc("create_store_with_owner", {
      store_name: data.storeName,
      owner_name: user.email ?? "Owner",
      monthly_goal: data.monthlyRevenueGoal,
    });

    if (error) {
      setError("root", { message: "Não foi possível criar a loja. Tente novamente." });
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Crie sua loja</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vamos configurar o essencial antes de você começar.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="storeName">Nome da loja</Label>
            <Input id="storeName" placeholder="Ex: iStore Centro" {...register("storeName")} />
            {errors.storeName && <span className="text-xs text-danger">{errors.storeName.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monthlyRevenueGoal">Meta de faturamento mensal (R$)</Label>
            <Input id="monthlyRevenueGoal" type="number" min={0} step="0.01" {...register("monthlyRevenueGoal")} />
            {errors.monthlyRevenueGoal && (
              <span className="text-xs text-danger">{errors.monthlyRevenueGoal.message}</span>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar loja"}
          </Button>
          {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify end-to-end manually**

Run: `npm run dev`, log in with a fresh email that has no store yet, submit the onboarding form.
Expected: redirected to `/dashboard` (404 until Task 10 — that's fine, confirm via Supabase Dashboard → Table Editor that a new `stores` row and a matching `store_users` row with `role = 'owner'` were created instead). Stop the dev server afterward.

- [ ] **Step 7: Commit**

```bash
git add lib/validation/onboarding.ts tests/lib/validation/onboarding.test.ts "app/(auth)/onboarding"
git commit -m "feat: add onboarding flow (create_store_with_owner)"
```

---

### Task 10: Dashboard shell (sidebar + protected layout)

**Files:**
- Create: `lib/navigation.ts`
- Test: `tests/lib/navigation.test.ts`
- Create: `components/sidebar.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`

**Note on routing:** `(dashboard)` is a route *group* — folders in parentheses don't add a URL segment, they only let sibling routes share `layout.tsx`. So the dashboard page must live at `app/(dashboard)/dashboard/page.tsx` to serve `/dashboard`; `app/(dashboard)/page.tsx` would incorrectly serve `/` and collide with the root page from Task 1. Later plans add `/estoque`, `/vendas`, etc. as further siblings inside the same `(dashboard)` group, each in their own real folder.

**Interfaces:**
- Consumes: `cn` (Task 3).
- Produces: `NAV_ITEMS: NavItem[]` and `isActiveRoute(pathname, href): boolean` from `@/lib/navigation` — later module plans (estoque, vendas, etc.) append their route to `NAV_ITEMS` rather than inventing a second nav list.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/navigation.test.ts
import { describe, expect, it } from "vitest";

import { isActiveRoute } from "@/lib/navigation";

describe("isActiveRoute", () => {
  it("matches an exact path", () => {
    expect(isActiveRoute("/estoque", "/estoque")).toBe(true);
  });

  it("matches a nested path", () => {
    expect(isActiveRoute("/estoque/checkup/123", "/estoque")).toBe(true);
  });

  it("does not match an unrelated path", () => {
    expect(isActiveRoute("/clientes", "/estoque")).toBe(false);
  });

  it("does not match a path that merely starts with the same letters", () => {
    expect(isActiveRoute("/estoquex", "/estoque")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/navigation.test.ts`
Expected: FAIL — `Cannot find module '@/lib/navigation'`.

- [ ] **Step 3: Write `lib/navigation.ts`**

```ts
export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Estoque", href: "/estoque" },
  { label: "Vendas", href: "/vendas" },
  { label: "Clientes", href: "/clientes" },
  { label: "Financeiro", href: "/financeiro" },
  { label: "Rankings", href: "/rankings" },
  { label: "Configurações", href: "/configuracoes" },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/navigation.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write `components/sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col gap-1 border-r border-border bg-card p-4">
      <span className="mb-4 px-2 text-lg font-bold text-foreground">useFindash</span>
      {NAV_ITEMS.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              active && "bg-primary/10 text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 6: Write `app/(dashboard)/layout.tsx`**

```tsx
import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 7: Write `app/(dashboard)/dashboard/page.tsx`**

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Os indicadores da loja aparecerão aqui.</p>
    </div>
  );
}
```

- [ ] **Step 8: Verify the full flow manually**

Run: `npm run dev`, log in as a user that already completed onboarding (from Task 9).
Expected: lands on `/dashboard` showing the sidebar (7 items, "Dashboard" highlighted) and the placeholder text — no redirect loop. Clicking other sidebar items 404s (their pages don't exist yet; that's expected — they're separate plans). Stop the dev server afterward.

- [ ] **Step 9: Commit**

```bash
git add lib/navigation.ts tests/lib/navigation.test.ts components/sidebar.tsx "app/(dashboard)"
git commit -m "feat: add protected dashboard shell with sidebar navigation"
```

(the quoted `"app/(dashboard)"` path stages both `layout.tsx` and the nested `dashboard/page.tsx`)

---

### Task 11: README and final verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing later tasks depend on — this is documentation only.

- [ ] **Step 1: Write `README.md`**

```markdown
# useFindash

SaaS de gestão para lojas revendedoras de iPhone no Brasil — estoque, checkup
de seminovos, vendas, CRM de clientes e BI financeiro.

Ver o design completo em
[docs/superpowers/specs/2026-09-22-usefindash-saas-design.md](docs/superpowers/specs/2026-09-22-usefindash-saas-design.md).

## Stack

Next.js 14 (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Supabase
(Postgres + RLS + Auth), Resend (email transacional), Zod, React Hook Form,
Recharts, Zustand, Vercel (hosting + cron jobs).

## Setup local

```bash
npm install
cp .env.example .env.local   # preencha as variáveis abaixo
npm run dev
```

Abra http://localhost:3000.

## Variáveis de ambiente

| Variável | Onde conseguir |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API (chave `anon`/publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (chave `service_role`, **secreta**, nunca no client) |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` em dev; a URL da Vercel em produção |

## Banco de dados (migrations)

O schema vive em `supabase/migrations/*.sql`, aplicado em ordem. Para aplicar
num projeto Supabase (via Supabase CLI, com o projeto já linkado):

```bash
supabase db push
```

As migrations já foram aplicadas ao projeto Supabase `useFindash`
(`crfmlimzjcztzlvylrpf`) usado em desenvolvimento.

## Resend (email transacional)

1. Crie uma conta em resend.com e verifique um domínio de envio.
2. Gere uma API key e coloque em `RESEND_API_KEY`.
3. Configure o SMTP customizado do Supabase (Dashboard → Authentication →
   Settings → SMTP Settings) apontando para `smtp.resend.com`, usuário
   `resend`, senha = a API key — isso faz o magic link de login sair pelo
   Resend em vez do SMTP padrão do Supabase.

## Deploy (Vercel)

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel deploy
```

`vercel.json` com os cron jobs de alertas é adicionado num plano posterior,
junto com as rotas `/api/cron/*` que eles chamam.

## Testes

```bash
npm test        # roda uma vez
npm run test:watch
```

## Status

Este é o plano de fundação: scaffold, autenticação (magic link + onboarding)
e o shell do dashboard. Os módulos de negócio (estoque, checkup, vendas,
clientes, financeiro, dashboard com KPIs, rankings, configurações, cron
jobs) são implementados em planos separados — ver
`docs/superpowers/plans/`.
```

- [ ] **Step 2: Full verification**

Run: `npm run build && npx vitest run`
Expected: build succeeds, all unit tests pass (7 + 3 + 4 + 4 = 18 tests across Tasks 4, 6, 9, 10).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add setup, env vars, and deployment instructions"
```

---

## After this plan

Follow-up plans (one per module, each producing working/testable software on
its own, per spec section 13's ordem de execução): Estoque, Checkup, Vendas,
Clientes/CRM, Financeiro, Dashboard KPIs, Rankings, Configurações, Cron jobs
+ transactional emails, then `vercel.json` + production deploy.
