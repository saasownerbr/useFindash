"use client";

import { useEffect, useState } from "react";

import { AccountCard } from "@/components/configuracoes/account-card";
import { SellerList } from "@/components/configuracoes/seller-list";
import { StoreProfileCard } from "@/components/configuracoes/store-profile-card";
import { PageContainer } from "@/components/ui/page-container";
import { getClientStoreId } from "@/lib/supabase/client-store";

export default function ConfiguracoesPage() {
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getClientStoreId().then((id) => {
      if (!cancelled) setStoreId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conta, loja e vendedores.</p>
      </div>

      <div className="space-y-6">
        <AccountCard />
        <StoreProfileCard storeId={storeId} />
        <SellerList storeId={storeId} />
      </div>
    </PageContainer>
  );
}
