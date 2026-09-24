"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { GoalProgress } from "@/components/dashboard/goal-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPicker, currentMonthValue } from "@/components/ui/month-picker";
import { sumAccessorySales } from "@/lib/accessory-sales";
import { buildDRE } from "@/lib/dre";
import { formatCurrencyBRL } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { revenueGoalSchema, type RevenueGoalInput } from "@/lib/validation/store-settings";

function monthRange(month: string) {
  const start = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  return { start, end: `${nextMonth}-01` };
}

function daysLeftInMonth(month: string, now = new Date()): number | null {
  if (month !== currentMonthValue()) return null;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  return lastDay - now.getDate() + 1;
}

/** "Meta" tab in Financeiro: edit the monthly revenue goal and track the month against it. */
export function RevenueGoalPanel({ storeId }: { storeId: string | null }) {
  const [month, setMonth] = useState(currentMonthValue());
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
    createClient()
      .from("stores")
      .select("monthly_revenue_goal")
      .eq("id", storeId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setGoal(data.monthly_revenue_goal);
        reset({ monthly_revenue_goal: data.monthly_revenue_goal });
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, reset]);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setRevenue(null);
    const { start, end } = monthRange(month);
    const supabase = createClient();
    Promise.all([
      supabase
        .from("sales")
        .select("acquisition_cost, repair_cost, gross_margin, commission_amount")
        .eq("store_id", storeId)
        .gte("sold_at", start)
        .lt("sold_at", end),
      sumAccessorySales(supabase, storeId, start, end),
    ]).then(([{ data: sales }, accessorySales]) => {
      if (!cancelled) setRevenue(buildDRE(sales ?? [], [], accessorySales).revenue);
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, month]);

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

  const remaining = goal != null && revenue != null ? Math.max(0, goal - revenue) : null;
  const daysLeft = daysLeftInMonth(month);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="meta-month">Mês</Label>
        <MonthPicker id="meta-month" value={month} onChange={(v) => setMonth(v || currentMonthValue())} />
      </div>

      {goal == null || revenue == null ? (
        <div className="h-28 animate-pulse rounded-xl bg-card" />
      ) : (
        <GoalProgress currentRevenue={revenue} goal={goal} />
      )}

      {remaining != null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Falta para a meta</p>
              <p className="text-xl font-bold text-foreground">{formatCurrencyBRL(remaining)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Necessário por dia</p>
              <p className="text-xl font-bold text-foreground">
                {daysLeft ? formatCurrencyBRL(remaining / daysLeft) : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {daysLeft ? `${daysLeft} dia${daysLeft > 1 ? "s" : ""} restantes no mês` : "Só para o mês atual"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <form
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
        onSubmit={handleSubmit(onSubmit)}
      >
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
          {isSubmitting ? "Salvando..." : "Salvar meta"}
        </Button>
      </form>
    </div>
  );
}
