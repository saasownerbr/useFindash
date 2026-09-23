"use client";

import { useEffect, useState } from "react";

import { ChannelRanking } from "@/components/rankings/channel-ranking";
import { ProductRanking } from "@/components/rankings/product-ranking";
import { SellerRanking } from "@/components/rankings/seller-ranking";
import { Label } from "@/components/ui/label";
import { MonthPicker, currentMonthValue } from "@/components/ui/month-picker";
import { PageContainer } from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/client";
import { getActiveStoreId } from "@/lib/supabase/store";
import { rankChannels, rankProducts, rankSellers, type ChannelRankRow, type ProductRankRow, type SellerRankRow } from "@/lib/rankings";

function monthRange(month: string) {
  const start = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  return { start, end: `${nextMonth}-01` };
}

export default function RankingsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [sellerRows, setSellerRows] = useState<SellerRankRow[]>([]);
  const [productRows, setProductRows] = useState<ProductRankRow[]>([]);
  const [channelRows, setChannelRows] = useState<ChannelRankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const storeId = await getActiveStoreId(supabase, user.id);
      if (!storeId || cancelled) {
        setLoading(false);
        return;
      }

      const { start, end } = monthRange(month);

      const [salesRes, sellersRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, seller_id, sale_price, gross_margin, commission_amount, sale_channel, products(model, storage)")
          .eq("store_id", storeId)
          .gte("sold_at", start)
          .lt("sold_at", end),
        supabase.from("store_users").select("id, name").eq("store_id", storeId),
      ]);

      if (cancelled) return;

      if (salesRes.error || sellersRes.error) {
        setError("Não foi possível carregar os rankings deste mês.");
        setLoading(false);
        return;
      }

      const sales = salesRes.data ?? [];
      const saleIds = sales.map((s) => s.id);

      let accessoryCountBySale = new Map<string, number>();
      if (saleIds.length > 0) {
        const { data: saleAccessories } = await supabase
          .from("sale_accessories")
          .select("sale_id, quantity")
          .in("sale_id", saleIds);
        accessoryCountBySale = new Map();
        for (const row of saleAccessories ?? []) {
          accessoryCountBySale.set(row.sale_id, (accessoryCountBySale.get(row.sale_id) ?? 0) + row.quantity);
        }
      }

      const salesForRanking = sales.map((s) => ({
        seller_id: s.seller_id,
        sale_price: s.sale_price,
        gross_margin: s.gross_margin ?? 0,
        commission_amount: s.commission_amount,
        sale_channel: s.sale_channel,
        model: (s.products as { model: string; storage: string } | null)?.model ?? null,
        storage: (s.products as { model: string; storage: string } | null)?.storage ?? null,
        accessoryCount: accessoryCountBySale.get(s.id) ?? 0,
      }));

      setSellerRows(rankSellers(salesForRanking, sellersRes.data ?? []));
      setProductRows(rankProducts(salesForRanking));
      setChannelRows(rankChannels(salesForRanking));
      setError(null);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [month]);

  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rankings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Desempenho de vendedores, produtos e canais.</p>
        </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rankings-month">Mês</Label>
        <MonthPicker id="rankings-month" value={month} onChange={(v) => setMonth(v || currentMonthValue())} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Vendedores</h2>
            <SellerRanking rows={sellerRows} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Produtos</h2>
            <ProductRanking rows={productRows} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Canais</h2>
            <ChannelRanking rows={channelRows} />
          </section>
        </>
      )}
      </div>
    </PageContainer>
  );
}
