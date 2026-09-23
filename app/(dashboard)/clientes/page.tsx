import { CustomerList } from "@/components/clientes/customer-list";

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Busque, filtre e acompanhe o relacionamento com seus clientes.</p>
      </div>
      <CustomerList />
    </div>
  );
}
