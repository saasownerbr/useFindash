"use client";

import { useEffect, useState } from "react";

import { ChannelRanking } from "@/components/rankings/channel-ranking";
import { ProductRanking } from "@/components/rankings/product-ranking";
import { SellerRanking } from "@/components/rankings/seller-ranking";
import { PeriodSelector } from "@/components/period-selector";
import { PageContainer } from "@/components/ui/page-container";
import { usePeriodFilterStore } from "@/lib/period-filter-store";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { rankChannels, rankProducts, rankSellers, type ChannelRankRow, type ProductRankRow, type SellerRankRow } from "@/lib/rankings";

export default function RankingsPage() {
  const { startDate, endDate } = usePeriodFilterStore();
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
      if (!storeId || !startDate || !endDate || cancelled) {
        setLoading(false);
        return;
      }


      const [salesRes, sellersRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, seller_id, sale_price, gross_margin, commission_amount, sale_channel, products(model, storage), sale_accessories(quantity)")
          .eq("store_id", storeId)
          .gte("sold_at", startDate.toISOString())
          .lte("sold_at", endDate.toISOString()),
        supabase.from("store_users").select("id, name").eq("store_id", storeId),
      ]);

      if (cancelled) return;

      if (salesRes.error || sellersRes.error) {
        setError("Não foi possível carregar os rankings deste período.");
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
  }, [startDate, endDate]);

  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Rankings</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Desempenho de vendedores, produtos e canais.</p>
        </div>

      <PeriodSelector />

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
