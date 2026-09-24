"use client";

import { useEffect, useState } from "react";

import { ChannelRanking } from "@/components/rankings/channel-ranking";
import { ProductRanking } from "@/components/rankings/product-ranking";
import { SellerRanking } from "@/components/rankings/seller-ranking";
import { Label } from "@/components/ui/label";
import { MonthPicker, currentMonthValue } from "@/components/ui/month-picker";
import { PageContainer } from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
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
      const storeId = await getClientStoreId();
      if (!storeId || cancelled) {
        setLoading(false);
        return;
      }

      const { start, end } = monthRange(month);

      const [salesRes, sellersRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, seller_id, sale_price, gross_margin, commission_amount, sale_channel, products(model, storage), sale_accessories(quantity)")
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

      const salesForRanking = sales.map((s) => ({
        seller_id: s.seller_id,
        sale_price: s.sale_price,
        gross_margin: s.gross_margin ?? 0,
        commission_amount: s.commission_amount,
        sale_channel: s.sale_channel,
        model: (s.products as { model: string; storage: string } | null)?.model ?? null,
        storage: (s.products as { model: string; storage: string } | null)?.storage ?? null,
        accessoryCount: s.sale_accessories.reduce((sum, a) => sum + a.quantity, 0),
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
          <h1 className="text-[22px] font-bold text-foreground">Rankings</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Desempenho de vendedores, produtos e canais.</p>
        </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rankings-month">Mês</Label>
        <MonthPicker id="rankings-month" value={month} onChange={(v) => setMonth(v || currentMonthValue())} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-card shadow-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <SellerRanking rows={sellerRows} />
          <ProductRanking rows={productRows} />
          <ChannelRanking rows={channelRows} />
        </div>
      )}
      </div>
    </PageContainer>
  );
}
