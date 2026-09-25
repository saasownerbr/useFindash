"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { GoalCard } from "@/components/dashboard/goal-card";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MetricCards, type PaidTrafficMetrics } from "@/components/dashboard/metric-cards";
import { ChartSkeleton } from "@/components/dashboard/skeleton-cards";
import { PeriodSelector } from "@/components/period-selector";
import { PageContainer } from "@/components/ui/page-container";
import { sumAccessorySales } from "@/lib/accessory-sales";
import { isBirthdayWithinDays, isInUpgradeWindow } from "@/lib/customer-alerts";
import { fetchCostEntries } from "@/lib/cost-entries";
import { buildDRE, NO_COSTS, periodCosts, type DRE } from "@/lib/dre";
import { calculateAverageTicket, calculateCAC, calculateRetentionRate } from "@/lib/finance";
import { usePeriodFilterStore } from "@/lib/period-filter-store";
import { firstOfMonth, previousCalendarMonth, previousRange } from "@/lib/period";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { stockDays } from "@/lib/urgent-actions";

// Recharts is most of this page's JavaScript; loading it on demand lets the page open right away.
const RevenueLineChart = dynamic(
  () => import("@/components/dashboard/revenue-line-chart").then((m) => m.RevenueLineChart),
  { ssr: false, loading: ChartSkeleton }
);
const PaymentMethodsChart = dynamic(
  () => import("@/components/dashboard/payment-methods-chart").then((m) => m.PaymentMethodsChart),
  { ssr: false, loading: ChartSkeleton }
);

type Sale = {
  sale_price: number;
  acquisition_cost: number;
  repair_cost: number;
  gross_margin: number | null;
  commission_amount: number | null;
  sale_channel: string;
  sold_at: string;
  customer_id: string;
  payment_method: string | null;
};

const SALE_FIELDS =
  "sale_price, acquisition_cost, repair_cost, gross_margin, commission_amount, sale_channel, sold_at, customer_id, payment_method";

const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const TODAY_LABEL = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

/** Calendar month in local (store) time, so a sale at 22:00 on the 30th stays in its month. */
function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}


function within(sale: Sale, start: Date, end: Date) {
  const t = new Date(sale.sold_at).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

interface DashboardData {
  storeName: string;
  dre: DRE;
  previousDre: DRE;
  previousSalesCount: number;
  goal: number;
  monthRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  paymentMethods: { pix: number; debit: number; credit: number };
  avgTicket: number;
  salesCount: number;
  paidTraffic: PaidTrafficMetrics;
  retentionRate: number;
  buyersCount: number;
  upgradeWindowCount: number;
  birthdaysCount: number;
  staleStockCount: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noStore, setNoStore] = useState(false);

  const { periodType, startDate, endDate } = usePeriodFilterStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const storeId = await getClientStoreId();
      if (cancelled) return;
      if (!storeId) {
        setNoStore(true);
        return;
      }

      const now = new Date();
      const periodEnd = endDate ?? now;
      const periodStart = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
      // "Este mês" compares with last month; other periods with the same number of days just before.
      // Both ends inclusive, like the current period.
      const sameLength = previousRange(periodStart, periodEnd);
      const prev =
        periodType === "month"
          ? previousCalendarMonth(periodStart)
          : { start: sameLength.start, end: new Date(sameLength.end.getTime() - 1) };

      const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const earliest = prev.start < sixMonthsAgo ? prev.start : sixMonthsAgo;

      // Everything in one parallel round (Supabase is ~300 ms away from Brazil).
      const [
        storeRes,
        salesRes,
        costsRes,
        customersRes,
        monthlyInputRes,
        deviceSalesRes,
        productsRes,
        accessoriesNow,
        accessoriesPrev,
        accessoriesMonth,
      ] = await Promise.all([
        supabase
          .from("stores")
          .select("name, monthly_revenue_goal, upgrade_alert_months, stock_alert_days")
          .eq("id", storeId)
          .single(),
        supabase.from("sales").select(SALE_FIELDS).eq("store_id", storeId).gte("sold_at", earliest.toISOString()),
        fetchCostEntries(supabase, storeId, prev.start, periodEnd),
        supabase.from("customers").select("id, birthdate").eq("store_id", storeId),
        supabase
          .from("monthly_inputs")
          .select("paid_traffic_investment")
          .eq("store_id", storeId)
          .eq("month", firstOfMonth(now))
          .maybeSingle(),
        supabase
          .from("sales")
          .select("customer_id, sold_at")
          .eq("store_id", storeId)
          .not("product_id", "is", null)
          .order("sold_at", { ascending: false }),
        supabase.from("products").select("days_in_stock, purchase_date").eq("store_id", storeId).eq("status", "available"),
        sumAccessorySales(supabase, storeId, periodStart.toISOString(), periodEnd.toISOString()),
        sumAccessorySales(supabase, storeId, prev.start.toISOString(), prev.end.toISOString()),
        sumAccessorySales(supabase, storeId, monthStartDate.toISOString(), nextMonthDate.toISOString()),
      ]);

      if (cancelled) return;
      if (storeRes.error || salesRes.error || costsRes.error || customersRes.error) {
        setError("Não foi possível carregar os dados do dashboard.");
        return;
      }

      const sales = (salesRes.data ?? []) as Sale[];
      const periodSales = sales.filter((s) => within(s, periodStart, periodEnd));
      const previousSales = sales.filter((s) => within(s, prev.start, prev.end));

      const currentMonth = monthKey(now);
      const monthSales = sales.filter((s) => monthKey(new Date(s.sold_at)) === currentMonth);

      const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const key = monthKey(date);
        return {
          month: MONTH_LABEL.format(date).replace(".", ""),
          revenue: sales.filter((s) => monthKey(new Date(s.sold_at)) === key).reduce((sum, s) => sum + Number(s.sale_price), 0),
        };
      });

      const paymentMethods = { pix: 0, debit: 0, credit: 0 };
      for (const sale of periodSales) {
        const method = sale.payment_method?.toLowerCase() || "pix";
        if (method.includes("pix")) paymentMethods.pix += Number(sale.sale_price);
        else if (method.includes("débito") || method.includes("debit")) paymentMethods.debit += Number(sale.sale_price);
        else if (method.includes("crédito") || method.includes("credit")) paymentMethods.credit += Number(sale.sale_price);
      }

      const customers = customersRes.data ?? [];
      const salesByCustomer = new Map<string, number>();
      for (const sale of periodSales) salesByCustomer.set(sale.customer_id, (salesByCustomer.get(sale.customer_id) ?? 0) + 1);

      const paidTrafficSalesCount = monthSales.filter((s) => s.sale_channel === "paid_traffic").length;
      const investment = Number(monthlyInputRes.data?.paid_traffic_investment ?? 0);

      // Newest first, so the first sale seen per customer is their latest iPhone.
      const lastDeviceSale = new Map<string, string>();
      for (const sale of deviceSalesRes.data ?? []) {
        if (!lastDeviceSale.has(sale.customer_id)) lastDeviceSale.set(sale.customer_id, sale.sold_at);
      }
      const store = storeRes.data;
      const monthDre = buildDRE(monthSales, NO_COSTS, accessoriesMonth);
      // Same functions and inputs as the DRE (Financeiro), so both agree for any period.
      const dre = buildDRE(periodSales, periodCosts(costsRes.entries, periodStart, periodEnd), accessoriesNow);

      setError(null);
      setData({
        storeName: store.name,
        dre,
        previousDre: buildDRE(previousSales, periodCosts(costsRes.entries, prev.start, prev.end), accessoriesPrev),
        previousSalesCount: previousSales.length,
        goal: Number(store.monthly_revenue_goal ?? 0),
        monthRevenue: monthDre.revenue,
        revenueByMonth,
        paymentMethods,
        avgTicket: calculateAverageTicket(dre.revenue, periodSales.length),
        salesCount: periodSales.length,
        paidTraffic: {
          cac: calculateCAC(investment, paidTrafficSalesCount),
          salesCount: paidTrafficSalesCount,
          investment,
        },
        retentionRate: calculateRetentionRate(Array.from(salesByCustomer.values()).map((count) => ({ salesCountInPeriod: count }))),
        buyersCount: salesByCustomer.size,
        upgradeWindowCount: customers.filter((c) =>
          isInUpgradeWindow(lastDeviceSale.get(c.id) ?? null, store.upgrade_alert_months ?? 20)
        ).length,
        birthdaysCount: customers.filter((c) => isBirthdayWithinDays(c.birthdate, 7)).length,
        staleStockCount: (productsRes.data ?? []).filter((p) => stockDays(p) > (store.stock_alert_days ?? 30)).length,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [periodType, startDate, endDate]);

  return (
    <PageContainer>
      <div className="space-y-4 md:space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground">
              {data ? `Olá, ${data.storeName}` : "Olá"}
            </h1>
            <p className="mt-1 text-[13px] capitalize text-muted-foreground">{TODAY_LABEL.format(new Date())}</p>
          </div>
          <PeriodSelector />
        </header>

        {error && <p className="text-sm text-danger">{error}</p>}

        {noStore ? (
          <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            Configure sua loja para ver os indicadores aqui.
          </div>
        ) : !data ? (
          <DashboardSkeleton />
        ) : (
          <>
            <KpiCards
              dre={data.dre}
              previous={data.previousDre}
              salesCount={data.salesCount}
              previousSalesCount={data.previousSalesCount}
            />

            <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <RevenueLineChart data={data.revenueByMonth} />
              </div>
              <div className="flex flex-col gap-3 md:gap-4 lg:col-span-2">
                <GoalCard revenue={data.monthRevenue} goal={data.goal} />
                <PaymentMethodsChart data={data.paymentMethods} />
              </div>
            </div>

            <MetricCards
              avgTicket={data.avgTicket}
              salesCount={data.salesCount}
              paidTraffic={data.paidTraffic}
              retentionRate={data.retentionRate}
              buyersCount={data.buyersCount}
            />

            <AlertsPanel
              upgradeWindowCount={data.upgradeWindowCount}
              birthdaysCount={data.birthdaysCount}
              staleStockCount={data.staleStockCount}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[112px] animate-pulse rounded-xl bg-card last:col-span-2 xl:last:col-span-1" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-5">
        <div className="h-[240px] animate-pulse rounded-xl bg-card md:h-[330px] lg:col-span-3" />
        <div className="h-[240px] animate-pulse rounded-xl bg-card md:h-[330px] lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}
