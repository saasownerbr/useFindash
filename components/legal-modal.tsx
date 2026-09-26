"use client";

export type LegalDocument = "terms" | "privacy";

const DOCUMENTS: Record<LegalDocument, { title: string; paragraphs: string[] }> = {
  terms: {
    title: "Termos de Uso — useFindash",
    paragraphs: [
      "O useFindash é uma plataforma de gestão financeira desenvolvida para lojistas de iPhone e eletrônicos. Ao criar uma conta, o usuário concorda com os seguintes termos.",
      "Uso da plataforma: o acesso é concedido mediante contratação de um dos planos disponíveis. O período de trial de 7 dias é gratuito e não exige cartão de crédito.",
      "Responsabilidade dos dados: o usuário é integralmente responsável pela veracidade das informações inseridas no sistema, incluindo dados de vendas, estoque e clientes.",
      "Propriedade intelectual: o useFindash e todos os seus componentes são de propriedade exclusiva da SINGLE Growth Advisory. É proibida a reprodução, cópia ou distribuição do sistema sem autorização expressa.",
      "Suspensão de conta: a SINGLE reserva o direito de suspender ou cancelar contas que violem estes termos, utilizem a plataforma para fins ilegais ou deixem de realizar o pagamento do plano contratado.",
      "Suporte: o atendimento é realizado via email com retorno em até 24 horas úteis em dias de semana.",
    ],
  },
  privacy: {
    title: "Política de Privacidade — useFindash",
    paragraphs: [
      "O useFindash respeita a privacidade dos seus usuários e está comprometido com a proteção dos dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
      "Dados coletados: nome da loja, endereço de email, dados de vendas, estoque e clientes inseridos pelo próprio usuário na plataforma.",
      "Uso dos dados: os dados são utilizados exclusivamente para o funcionamento do sistema e para melhorar a experiência do usuário. Nunca são vendidos ou compartilhados com terceiros.",
      "Armazenamento e segurança: os dados são armazenados de forma segura via Supabase com criptografia em repouso e em trânsito. O acesso é protegido por autenticação com senha.",
      "Retenção: os dados são mantidos enquanto a conta estiver ativa. Após o cancelamento, os dados são mantidos por 30 dias e então excluídos permanentemente.",
      "Direitos do usuário: o usuário pode solicitar a exportação, correção ou exclusão de seus dados a qualquer momento através do suporte em saas.owner.br@gmail.com.",
      "Cookies: o sistema utiliza apenas cookies essenciais para manter a sessão autenticada. Nenhum cookie de rastreamento ou publicidade é utilizado.",
    ],
  },
};

/** Terms / privacy text over the signup page. Closes on the overlay or the button only — never on ESC. */
export function LegalModal({ document, onClose }: { document: LegalDocument | null; onClose: () => void }) {
  if (!document) return null;
  const { title, paragraphs } = DOCUMENTS[document];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          margin: "auto",
          width: "calc(100% - 32px)",
          maxWidth: 560,
          maxHeight: "80vh",
          overflowY: "auto",
          background: "#1A1A1A",
          border: "1px solid #242424",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <h2 id="legal-modal-title" style={{ fontSize: 18, fontWeight: 700, color: "#F0F0F0", marginBottom: 20 }}>
          {title}
        </h2>
        <div style={{ fontSize: 14, color: "#D0D0D0", lineHeight: 1.7 }}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} style={{ marginBottom: 16 }}>
              {paragraph}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 24,
            background: "#dae878",
            color: "#111111",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
