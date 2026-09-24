import { UsedDeviceCalculator } from "@/components/calculadora/used-device-calculator";
import { PageContainer } from "@/components/ui/page-container";

export default function CalculadoraPage() {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Calculadora de Seminovo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Avalie um aparelho antes de comprar: faça o checkup e veja quanto pagar no máximo.
        </p>
      </div>
      <UsedDeviceCalculator />
    </PageContainer>
  );
}
