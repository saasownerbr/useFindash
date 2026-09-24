"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentMonthValue } from "@/components/ui/month-picker";
import { sumAccessorySales } from "@/lib/accessory-sales";
import { buildDRE } from "@/lib/dre";
import { formatCurrencyBRL } from "@/lib/finance";
import { goalPace } from "@/lib/revenue-goal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { revenueGoalSchema, type RevenueGoalInput } from "@/lib/validation/store-settings";

function currentMonthRange() {
  const month = currentMonthValue();
  const [year, mon] = month.split("-").map(Number);
  const next = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  return { start: `${month}-01`, end: `${next}-01` };
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-card-secondary p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** "Meta" tab in Financeiro: set the monthly revenue goal and follow the current month against it. */
export function RevenueGoalPanel({ storeId }: { storeId: string | null }) {
  const [goal, setGoal] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RevenueGoalInput>({
    resolver: zodResolver(revenueGoalSchema),
    defaultValues: { monthly_revenue_goal: 0 },
  });

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    const supabase = createClient();
    const { start, end } = currentMonthRange();
    Promise.all([
      supabase.from("stores").select("monthly_revenue_goal").eq("id", storeId).single(),
      supabase
        .from("sales")
        .select("acquisition_cost, repair_cost, gross_margin, commission_amount")
        .eq("store_id", storeId)
        .gte("sold_at", start)
        .lt("sold_at", end),
      sumAccessorySales(supabase, storeId, start, end),
    ]).then(([storeRes, salesRes, accessorySales]) => {
      if (cancelled) return;
      const storeGoal = Number(storeRes.data?.monthly_revenue_goal ?? 0);
      setGoal(storeGoal);
      reset({ monthly_revenue_goal: storeGoal });
      setRevenue(buildDRE(salesRes.data ?? [], [], accessorySales).revenue);
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, reset]);

  async function onSubmit(data: RevenueGoalInput) {
    if (!storeId) return;
    const { error } = await createClient().from("stores").update(data).eq("id", storeId);
    if (error) {
      toast.error("Não foi possível salvar. Só donos e administradores podem alterar a meta.");
      return;
    }
    setGoal(data.monthly_revenue_goal);
    toast.success("Meta de faturamento salva");
  }

  const pace = goal != null && revenue != null ? goalPace(revenue, goal) : null;
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

  return (
    <section className="space-y-6 rounded-xl bg-card shadow-card p-4 md:p-5">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="monthly_revenue_goal">Meta de faturamento mensal (R$)</Label>
          <Input
            id="monthly_revenue_goal"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            {...register("monthly_revenue_goal")}
          />
          {errors.monthly_revenue_goal && (
            <span className="text-xs text-danger">{errors.monthly_revenue_goal.message}</span>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting || !storeId}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>

      {!pace || goal == null || revenue == null ? (
        <div className="h-40 animate-pulse rounded-lg bg-background/60" />
      ) : (
        <>
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Atingido em {monthName}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {formatCurrencyBRL(revenue)}{" "}
                  <span className="text-base font-medium text-muted-foreground">de {formatCurrencyBRL(goal)}</span>
                </p>
              </div>
              <span className="text-2xl font-bold tabular-nums text-primary">{pace.percentage.toFixed(0)}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#242424]">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pace.percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Falta para a meta" value={formatCurrencyBRL(pace.remaining)} />
            <Stat
              label="Média diária necessária"
              value={pace.remaining > 0 ? formatCurrencyBRL(pace.dailyNeeded) : "Meta batida"}
              hint={`${pace.daysLeft} dia${pace.daysLeft > 1 ? "s" : ""} restantes no mês`}
            />
            <Stat
              label="Projeção no ritmo atual"
              value={formatCurrencyBRL(pace.projection)}
              hint={
                goal > 0
                  ? pace.projection >= goal
                    ? "Acima da meta"
                    : `${formatCurrencyBRL(goal - pace.projection)} abaixo da meta`
                  : undefined
              }
            />
          </div>
        </>
      )}
    </section>
  );
}
