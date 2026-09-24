import {
  BarChart3,
  Calculator,
  DollarSign,
  LifeBuoy,
  Package,
  Settings,
  SlidersHorizontal,
  ShoppingCart,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Items sharing a group sit together; the sidebar draws a separator between groups. */
  group: "overview" | "operation" | "management" | "account";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, group: "overview" },
  { label: "Estoque", href: "/estoque", icon: Package, group: "operation" },
  { label: "Calculadora", href: "/calculadora", icon: Calculator, group: "operation" },
  // Straight to the wizard: /vendas only redirects there, which costs a second round trip per tap.
  { label: "Vendas", href: "/vendas/nova", icon: ShoppingCart, group: "operation" },
  { label: "Clientes", href: "/clientes", icon: Users, group: "operation" },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign, group: "management" },
  { label: "Inputs", href: "/inputs", icon: SlidersHorizontal, group: "management" },
  { label: "Rankings", href: "/rankings", icon: Trophy, group: "management" },
  { label: "Configurações", href: "/configuracoes", icon: Settings, group: "account" },
  { label: "Suporte", href: "/suporte", icon: LifeBuoy, group: "account" },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
