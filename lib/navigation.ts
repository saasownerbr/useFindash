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
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Estoque", href: "/estoque", icon: Package },
  { label: "Calculadora", href: "/calculadora", icon: Calculator },
  // Straight to the wizard: /vendas only redirects there, which costs a second round trip per tap.
  { label: "Vendas", href: "/vendas/nova", icon: ShoppingCart },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "Inputs", href: "/inputs", icon: SlidersHorizontal },
  { label: "Rankings", href: "/rankings", icon: Trophy },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
  { label: "Suporte", href: "/suporte", icon: LifeBuoy },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
