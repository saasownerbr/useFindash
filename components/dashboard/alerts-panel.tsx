import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function AlertsPanel({
  upgradeWindowCount,
  birthdaysCount,
  staleStockCount,
}: {
  upgradeWindowCount: number;
  birthdaysCount: number;
  staleStockCount: number;
}) {
  const rows = [
    {
      label: "Clientes em janela de upgrade",
      count: upgradeWindowCount,
      href: "/clientes",
    },
    {
      label: "Aniversários nos próximos 7 dias",
      count: birthdaysCount,
      href: "/clientes",
    },
    {
      label: "Aparelhos parados no estoque",
      count: staleStockCount,
      href: "/estoque",
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Alertas</p>
        <div className="space-y-2">
          {rows.map((row) => (
            <Link
              key={row.label}
              href={row.href}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-secondary/40"
            >
              <span className={row.count > 0 ? "text-foreground" : "text-muted-foreground"}>{row.label}</span>
              <Badge variant={row.count > 0 ? "warning" : "default"}>{row.count}</Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
