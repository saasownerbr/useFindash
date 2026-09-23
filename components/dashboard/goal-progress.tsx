import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/finance";

export function GoalProgress({ currentRevenue, goal }: { currentRevenue: number; goal: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Meta de faturamento do mês</span>
          {goal > 0 ? (
            <span className="text-muted-foreground">
              {formatCurrencyBRL(currentRevenue)} / {formatCurrencyBRL(goal)}
            </span>
          ) : (
            <span className="text-muted-foreground">Meta não configurada</span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          {goal > 0 && (
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (currentRevenue / goal) * 100)}%` }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
