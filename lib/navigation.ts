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
