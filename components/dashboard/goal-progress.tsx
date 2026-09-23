import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/finance";

export function GoalProgress({ currentRevenue, goal }: { currentRevenue: number; goal: number }) {
  const percentage = goal > 0 ? Math.min(100, (currentRevenue / goal) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta de Faturamento</span>
          <span className="text-lg font-bold text-primary">{percentage.toFixed(0)}%</span>
        </div>
        <div className="mb-3">
          {goal > 0 ? (
            <div className="h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#2A2A2A" }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  background: "linear-gradient(90deg, #3B82F6 0%, #10B981 100%)",
                  borderRadius: "999px",
                }}
              />
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatCurrencyBRL(currentRevenue)} atingido
          </span>
          <span className="text-muted-foreground">
            Meta: {formatCurrencyBRL(goal)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
