import { SupportForm } from "@/components/suporte/support-form";
import { PageContainer } from "@/components/ui/page-container";

export default function SuportePage() {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nossa equipe retorna via WhatsApp em até 24 horas úteis.</p>
      </div>
      <SupportForm />
    </PageContainer>
  );
}
