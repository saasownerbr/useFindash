import { SaleWizard } from "@/components/vendas/sale-wizard";
import { PageContainer } from "@/components/ui/page-container";

export default function NovaVendaPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Nova venda</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Registre uma venda em 5 passos — o cliente fica sempre visível ao lado.</p>
        </div>
        <SaleWizard />
      </div>
    </PageContainer>
  );
}
