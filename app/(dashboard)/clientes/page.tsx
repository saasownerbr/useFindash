import { CustomerList } from "@/components/clientes/customer-list";
import { PageContainer } from "@/components/ui/page-container";

export default function ClientesPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Clientes</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Busque, filtre e acompanhe o relacionamento com seus clientes.</p>
        </div>
        <CustomerList />
      </div>
    </PageContainer>
  );
}
