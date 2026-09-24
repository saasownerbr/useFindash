"use client";

import { useEffect, useState } from "react";

import { ChannelBarChart } from "@/components/dashboard/channel-bar-chart";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { RevenueLineChart } from "@/components/dashboard/revenue-line-chart";
import { PaymentMethodsChart } from "@/components/dashboard/payment-methods-chart";
import { PeriodSelector } from "@/components/period-selector";
import { PageContainer } from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { sumAccessorySales } from "@/lib/accessory-sales";
import { buildDRE, type DRE } from "@/lib/dre";
import { calculateCAC, calculateRetentionRate } from "@/lib/finance";
import { SALE_CHANNELS } from "@/lib/validation/sale";
import { usePeriodFilterStore } from "@/lib/period-filter-store";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthStart(monthStr: string) {
  return `${monthStr}-01`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dre, setDre] = useState<DRE | null>(null);
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; revenue: number }[]>([]);
  const [channelData, setChannelData] = useState<{ channel: string; total: number }[]>([]);
  const [avgLtv, setAvgLtv] = useState(0);
  const [paidTrafficCac, setPaidTrafficCac] = useState(0);
  const [retentionRate, setRetentionRate] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState({ pix: 0, debit: 0, credit: 0 });

  const { startDate, endDate } = usePeriodFilterStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const storeId = await getClientStoreId();
      if (!storeId || cancelled) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const currentMonth = monthKey(now);
      const nextMonth = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)));
      const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

      // Use period filter dates if set
      const periodStart = startDate || sixMonthsAgo;
      const periodEnd = endDate || now;

      const [sixMonthSalesRes, periodSalesRes, costEntriesRes, customersRes, monthlyInputRes, accessorySales] = await Promise.all([
        supabase
          .from("sales")
          .select("id, sale_price, acquisition_cost, repair_cost, gross_margin, commission_amount, sale_channel, sold_at, customer_id, payment_method")
          .eq("store_id", storeId)
          .gte("sold_at", sixMonthsAgo.toISOString()),
        supabase
          .from("sales")
          .select("id, sale_price, acquisition_cost, repair_cost, gross_margin, commission_amount, sale_channel, sold_at, customer_id, payment_method")
          .eq("store_id", storeId)
          .gte("sold_at", periodStart.toISOString())
          .lte("sold_at", periodEnd.toISOString()),
        supabase.from("cost_entries").select("type, amount, month").eq("store_id", storeId).eq("month", monthStart(currentMonth)),
        supabase.from("customers").select("id, ltv").eq("store_id", storeId),
        supabase.from("monthly_inputs").select("*").eq("store_id", storeId).eq("month", monthStart(currentMonth)).maybeSingle(),
        sumAccessorySales(supabase, storeId, monthStart(currentMonth), monthStart(nextMonth)),
      ]);

      if (cancelled) return;

      if (sixMonthSalesRes.error || periodSalesRes.error || costEntriesRes.error) {
        setError("Não foi possível carregar os dados do dashboard.");
        setLoading(false);
        return;
      }

      const allSales = sixMonthSalesRes.data ?? [];
      const periodSales = periodSalesRes.data ?? [];
      const currentMonthSales = allSales.filter((s) => monthKey(new Date(s.sold_at)) === currentMonth);

      setDre(
        buildDRE(
          currentMonthSales,
          (costEntriesRes.data ?? []) as { type: "fixed" | "variable" | "marketing" | "supplier"; amount: number }[],
          accessorySales
        )
      );

      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        months.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
      }
      setRevenueByMonth(
        months.map((m) => {
          const salesInMonth = allSales.filter((s) => monthKey(new Date(s.sold_at)) === m);
          const revenue = salesInMonth.reduce(
            (sum, s) => sum + Number(s.sale_price),
            0
          );
          return { month: m, revenue };
        })
      );

      setChannelData(
        SALE_CHANNELS.map((channel) => ({
          channel,
          total: currentMonthSales.filter((s) => s.sale_channel === channel).length,
        }))
      );

      const customers = customersRes.data ?? [];
      const avgLtvValue = customers.length > 0 ? customers.reduce((sum, c) => sum + Number(c.ltv), 0) / customers.length : 0;
      setAvgLtv(avgLtvValue);

      const paidTrafficSalesCount = currentMonthSales.filter((s) => s.sale_channel === "paid_traffic").length;
      const paidTrafficInvestment = monthlyInputRes.data?.paid_traffic_investment ?? 0;
      const paidLeadsCount = (monthlyInputRes.data?.leads_instagram ?? 0) + (monthlyInputRes.data?.leads_whatsapp ?? 0);
      setPaidTrafficCac(calculateCAC(paidTrafficInvestment, paidTrafficSalesCount, paidLeadsCount));

      const salesCountByCustomer = new Map<string, number>();
      for (const sale of currentMonthSales) {
        salesCountByCustomer.set(sale.customer_id, (salesCountByCustomer.get(sale.customer_id) ?? 0) + 1);
      }
      setRetentionRate(
        calculateRetentionRate(Array.from(salesCountByCustomer.values()).map((count) => ({ salesCountInPeriod: count })))
      );

      // Calculate payment methods from period sales
      const paymentMethodsData = { pix: 0, debit: 0, credit: 0 };
      for (const sale of periodSales) {
        const method = sale.payment_method?.toLowerCase() || "pix";
        if (method.includes("pix")) paymentMethodsData.pix += Number(sale.sale_price);
        else if (method.includes("débito") || method.includes("debit")) paymentMethodsData.debit += Number(sale.sale_price);
        else if (method.includes("crédito") || method.includes("credit")) paymentMethodsData.credit += Number(sale.sale_price);
      }
      setPaymentMethods(paymentMethodsData);

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-card" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-md bg-card" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (!dre) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Configure sua loja para ver os indicadores aqui.
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Visão geral do desempenho da loja.</p>
          </div>
          <PeriodSelector />
        </div>

      <KpiCards dre={dre} />

      <PaymentMethodsChart data={paymentMethods} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueLineChart data={revenueByMonth} />
        <ChannelBarChart data={channelData} />
      </div>

      <MetricCards avgLtv={avgLtv} paidTrafficCac={paidTrafficCac} retentionRate={retentionRate} />
      </div>
    </PageContainer>
  );
}
