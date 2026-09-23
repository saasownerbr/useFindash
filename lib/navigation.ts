import {
  BarChart3,
  Calculator,
  DollarSign,
  Package,
  Settings,
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
  { label: "Vendas", href: "/vendas", icon: ShoppingCart },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "Rankings", href: "/rankings", icon: Trophy },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
