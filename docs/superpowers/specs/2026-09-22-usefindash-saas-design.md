# useFindash — SaaS completo — spec de implementação

> Status: aprovado para virar plano de implementação. Este documento formaliza o
> spec técnico fornecido pelo usuário em 2026-09-22, resolvendo os pontos que
> ficaram em aberto (ver seção 9) e servindo de base para o `writing-plans`.

## 1. Visão geral

useFindash é um SaaS multi-tenant para lojistas de iPhone no Brasil: estoque
(novo/seminovo), checkup e precificação de seminovos, vendas, CRM (LTV,
upgrade, aniversário) e BI financeiro (DRE, CMV, CAC, ROAS, comissões,
rankings). Cada lojista é uma *store*; um usuário pode pertencer a uma ou
mais stores.

## 2. Stack técnica

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui, tema dark fixo (tokens na seção 10)
- Supabase: Postgres + RLS + Supabase Auth (magic link)
- Resend para todo email transacional, incluindo o magic link (substitui SMTP padrão do Supabase)
- Zod para validação, React Hook Form para formulários
- Recharts para gráficos
- Zustand para estado global (client-side: wizard de venda, filtros de tabela, etc.)
- Deploy: Vercel, com Vercel Cron Jobs para os jobs periódicos
- Repositório: Git local nesta pasta (GitHub/push só quando o usuário pedir explicitamente)

## 3. Arquitetura multi-tenant e RLS

- `store_id` é a chave de isolamento em toda tabela de dados de negócio.
- RLS habilitado em todas as tabelas; policy padrão:
  `auth.uid() IN (SELECT user_id FROM store_users WHERE store_id = [tabela].store_id)`
- Operações de escrita sensíveis (config da loja, cadastro de vendedor, tabela
  de referência de preço) exigem `role IN ('owner','admin')` em `store_users`.
- Toda query do lado servidor (route handlers / server actions) recebe a
  sessão do usuário e resolve `store_id` a partir dela — nunca aceita
  `store_id` vindo do cliente sem validar contra `store_users`.

## 4. Modelo de dados (migrations Supabase)

Schema conforme fornecido, com tipos e defaults explícitos:

**stores**: id uuid pk, name text not null, logo_url text, monthly_revenue_goal numeric default 0, stock_alert_days integer default 30, upgrade_alert_months integer default 20, created_at timestamptz default now()

**store_users**: id uuid pk, store_id uuid fk→stores, user_id uuid fk→auth.users, role text check in ('owner','admin','seller'), commission_rate numeric default 0, name text not null, created_at timestamptz default now()

**products** (estoque): id uuid pk, store_id uuid fk, imei text unique nullable (null para lote de novos sem IMEI individual), model text not null, storage text not null, color text, type text check in ('new','semi_novo'), status text check in ('available','reserved','sold') default 'available', acquisition_cost numeric not null, repair_cost numeric default 0, suggested_price numeric, final_price numeric, grade text check in ('A+','A','B','C','sucata'), supplier text, purchase_date date, days_in_stock integer (mantido por cron diário, não gerado por trigger de banco — ver seção 8), checkup_data jsonb, created_at timestamptz default now()

**accessories**: id uuid pk, store_id uuid fk, name text not null, category text, quantity integer default 0, cost numeric not null, sale_price numeric not null, created_at timestamptz default now()

**customers**: id uuid pk, store_id uuid fk, name text not null, whatsapp text not null, birthdate date, acquisition_channel text, ltv numeric default 0 (mantido por trigger/recalculo em cada venda), created_at timestamptz default now()

**sales**: id uuid pk, store_id uuid fk, customer_id uuid fk, seller_id uuid fk→store_users, product_id uuid fk nullable (venda só de acessório), sale_channel text check in ('instagram','whatsapp','pdv','referral','paid_traffic'), sale_price numeric not null, payment_method text, installments integer default 1, acquisition_cost numeric not null (copiado do produto no momento da venda), gross_margin numeric (coluna gerada: sale_price - acquisition_cost - repair_cost), commission_amount numeric, sold_at timestamptz default now()

**sale_accessories**: id uuid pk, sale_id uuid fk, accessory_id uuid fk, quantity integer not null, unit_price numeric not null

**price_reference**: id uuid pk, store_id uuid fk, model text not null, storage text not null, base_price numeric not null, grade_multiplier_a_plus numeric default 0.92, grade_multiplier_a numeric default 0.82, grade_multiplier_b numeric default 0.68, grade_multiplier_c numeric default 0.48, updated_at timestamptz default now()

**monthly_inputs**: id uuid pk, store_id uuid fk, month date not null (primeiro dia do mês), paid_traffic_investment numeric default 0, leads_instagram integer default 0, leads_whatsapp integer default 0, leads_pdv integer default 0, leads_referral integer default 0, created_at timestamptz default now()

**cost_entries**: id uuid pk, store_id uuid fk, type text check in ('fixed','variable','marketing','supplier'), description text not null, amount numeric not null, date date not null, month date not null, created_at timestamptz default now()

Nota: `gross_margin` como coluna gerada (`GENERATED ALWAYS AS ... STORED`) só é
viável se `acquisition_cost` e `repair_cost` já estiverem congelados na linha
de `sales` no momento do insert (é o caso — são copiados do produto). `days_in_stock`
e `ltv` não usam colunas geradas porque dependem de "agora"/agregação
cross-tabela; são recalculados por job/trigger (seção 8).

## 5. Regras de negócio críticas

**CMV mensal**: soma de `acquisition_cost + repair_cost` de todos os `products`
vendidos no mês, filtrado por `sales.sold_at` (não é o que foi pago a
fornecedor no mês — é o custo dos aparelhos que saíram do estoque).

**Custo médio ponderado (lotes de novos sem IMEI)**: ao vender uma unidade de
um lote, `custo_unitário = Σ(quantity × unit_cost das entradas do modelo) / (quantidade em estoque + quantidade já vendida)`.

**Margem bruta** (por venda): `sale_price - acquisition_cost - repair_cost`.
**Margem líquida** (mensal): `Σ margem_bruta do mês - custos fixos - custos variáveis - comissões`.

**CAC por canal**: `CAC_paid_traffic = paid_traffic_investment / nº vendas com sale_channel = 'paid_traffic' no mês`. Canais orgânicos têm CAC = 0.

**ROAS**: `receita de vendas com sale_channel = 'paid_traffic' / paid_traffic_investment`.

**LTV do cliente**: soma de `sale_price` de todas as vendas daquele `customer_id`.

**Taxa de retenção**: `clientes com >1 compra / clientes com ≥1 compra no período`.

**Janela de upgrade**: clientes cuja última venda foi há ≥ X meses
(`stores.upgrade_alert_months`, configurável por loja) → alerta no dashboard +
email semanal (seção 8).

**Grade do checkup**: score 0–100 mapeia para grade:
- 90–100 → A+, 75–89 → A, 55–74 → B, 35–54 → C, <35 → sucata
- iCloud com conta ativa → produto **bloqueado**, não pode entrar no estoque disponível até a conta ser removida (checkup reavaliado), independente da pontuação.

Pesos e pontuação exatos (fornecidos pelo usuário em 2026-09-22, substituem os
pesos-default provisórios da primeira versão deste documento):

| Categoria | Peso máx. | Opções e pontos |
|---|---|---|
| Tela | 30 | Genuína impecável 30 · genuína c/ arranhões leves 22 · genuína c/ arranhões visíveis 15 · paralela funcional 12 · paralela c/ problema de cor/toque 6 · trincada sem afetar uso 5 · trincada afetando uso 0 |
| Bateria | 25 | Genuína >90% 25 · genuína 85–90% 20 · genuína 80–85% 14 · trocada peça boa >85% 12 · <80% qualquer origem 4 |
| Biometria | 20 | Funcionando normalmente 20 · falhas ocasionais 8 · não funciona 0 |
| Câmeras | 12 | Todas funcionando 12 · arranhão na lente sem afetar qualidade 9 · problema de qualidade/foco 4 · não funciona 0 |
| Estrutura | 8 | Intacta sem marcas 8 · arranhões imperceptíveis 6 · arranhões visíveis 4 · amassado leve 2 · amassado grave 0 |
| iCloud | bloqueante | Conta removida → liberado · conta ativa → bloqueia o produto (ver acima) |
| Histórico de serviço | modificador | Original ou peça Apple → sem desconto · peça terceiro → **-5 pontos no score final** |

Soma das 5 categorias pontuáveis = até 95; o modificador de histórico de
serviço (peça terceiro, -5) é aplicado depois, podendo levar o score a até
100 só quando não há desconto. Todo o resultado do formulário (respostas +
score + grade) é salvo integralmente em `products.checkup_data` (jsonb).

**Preço sugerido**: busca `base_price` em `price_reference` para
model+storage da loja, aplica o `grade_multiplier_*` correspondente à grade
calculada.

**Comissão**: `commission_amount = sale_price × store_users.commission_rate` do
vendedor daquela venda (`seller_id`), calculado e gravado no momento do
insert de `sales`. Confirmado pelo usuário em 2026-09-22 (coincide com o que
já estava assumido nesta versão do spec).

## 6. Módulos e rotas (App Router)

```
/app/(auth)/login                            — magic link
/app/(auth)/onboarding                       — criação da store (nome, meta de faturamento)
/app/(dashboard)/dashboard                   — KPIs, gráficos, alertas, barra de meta
/app/(dashboard)/estoque                     — aparelhos + acessórios (tabs)
/app/(dashboard)/estoque/checkup/[productId] — checkup de seminovo
/app/(dashboard)/vendas/nova                 — wizard de venda em 5 passos
/app/(dashboard)/clientes                    — CRM (lista + perfil)
/app/(dashboard)/financeiro                  — DRE + lançamentos
/app/(dashboard)/rankings                    — vendedores, produtos, canais
/app/(dashboard)/configuracoes               — loja, vendedores, tabela de referência, alertas
```

Nota de implementação: `(dashboard)` é um *route group* do Next.js App
Router — não adiciona segmento à URL. A página de dashboard precisa viver em
`app/(dashboard)/dashboard/page.tsx` (não em `app/(dashboard)/page.tsx`, que
colidiria com a rota raiz `/`). Já implementado corretamente no plano de
fundação (ver `docs/superpowers/plans/2026-09-22-foundation-auth-layout.md`).

Toda rota sob `(dashboard)` é protegida por middleware que verifica sessão
Supabase + resolve a store ativa do usuário (redireciona para onboarding se
não houver nenhuma).

## 7. Cadastro de aparelho (IMEI) — decisão v1

**Sem lookup externo de IMEI.** O endpoint originalmente citado
(`consultaimei.net`) não é uma API pública verificada; o usuário optou por
**remover essa integração do v1** em vez de mockar. Cadastro de aparelho
(novo ou seminovo) é 100% manual: modelo, armazenamento, cor, custo etc.
digitados no formulário. O campo `imei` continua existindo no schema (único,
nullable) para digitação manual. Uma integração de lookup fica fora de
escopo até haver um provedor real confirmado.

## 8. Emails (Resend) e jobs periódicos (Vercel Cron)

Emails (assuntos exatos fornecidos pelo usuário em 2026-09-22):
- Magic link de autenticação — subject "Seu acesso ao useFindash", template clean com botão de acesso (via Resend, substituindo SMTP padrão do Supabase)
- Boas-vindas após onboarding — subject "Bem-vindo ao useFindash", com nome da loja e link para o dashboard
- Alerta semanal de clientes em janela de upgrade — toda segunda 8h, lista com nome, modelo comprado, data da compra, WhatsApp
- Alerta diário de aniversários dos próximos 7 dias — todo dia 7h

Cron jobs (`vercel.json`):
```json
{
  "crons": [
    { "path": "/api/cron/upgrade-alerts", "schedule": "0 8 * * 1" },
    { "path": "/api/cron/birthday-alerts", "schedule": "0 7 * * *" },
    { "path": "/api/cron/update-stock-days", "schedule": "0 6 * * *" }
  ]
}
```
`update-stock-days` recalcula `products.days_in_stock` para todo produto com
`status = 'available'` (hoje − `purchase_date`).

**Segurança dos crons**: cada rota `/api/cron/*` valida o header
`Authorization` contra um secret guardado em `CRON_SECRET` (nova variável de
ambiente) antes de executar — rejeita qualquer chamada sem o header correto,
evitando disparo por terceiros que descubram a URL.

## 9. Pontos do spec original resolvidos nesta sessão

| Ponto em aberto | Decisão |
|---|---|
| Lookup de IMEI via `consultaimei.net` | Removido do v1 — cadastro manual apenas (seção 7) |
| Pesos do checkup não numerados | Resolvido — pesos e pontuação exatos fornecidos pelo usuário em 2026-09-22, documentados na seção 5 (substituem os defaults provisórios usados até então) |
| Provisionar Supabase real agora? | Não inicialmente — depois revertido: projeto Supabase real (`useFindash`, `crfmlimzjcztzlvylrpf`) foi provisionado e o schema completo + RLS já estão aplicados nele |
| Cobrança / plano pago | Fora de escopo até segunda ordem. Registro é 100% aberto: qualquer pessoa cria conta só com email, sem verificação de pagamento, sem plano, sem bloqueio de funcionalidade. Nenhuma lógica de billing/assinatura deve ser criada agora — integração com Asaas é uma fase futura de refinamento, explicitamente fora deste spec |

## 10. Design system

Tema dark fixo (sem toggle):
```
--bg: #0F0F0F        --success: #10B981
--surface/card: #1A1A1A   --warning: #F59E0B
--border: #2A2A2A    --danger: #EF4444
--primary: #3B82F6   --text: #F8F8F8
                      --text-secondary: #9CA3AF
```
shadcn/ui como base de componentes, tema customizado com os tokens acima.
Formulários com validação visual em tempo real (Zod + RHF). Loading states em
toda operação assíncrona. Toast para feedback de ações. Gráficos via
Recharts.

## 11. Deployment e configuração de repositório

- `vercel.json` com os 3 crons da seção 8
- `supabase/migrations/*.sql` com o schema completo, em ordem de dependência
- `.env.example` (sem valores): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`
- `.gitignore` incluindo `.env.local`, `node_modules`
- `README.md`: descrição, setup local, variáveis de ambiente, comandos de migration, configuração de Resend e Vercel

**Atualizado em 2026-09-22 — provisionamento real confirmado pelo usuário:**
- Repositório GitHub (`saasownerbr/useFindash`) conectado como remote; push
  depende de um token com permissão de escrita (`Contents: Read and write`
  no fine-grained PAT).
- Projeto Vercel conectado ao repositório GitHub, com **deploy automático a
  cada push na branch `main`/`master`**. Variáveis de ambiente configuradas
  no projeto Vercel (mesmas do `.env.local`, mais `CRON_SECRET`).
- **Deploy incremental**: primeiro deploy funcional assim que login +
  dashboard vazio estiverem prontos (fim do plano de fundação), mesmo sem os
  módulos de negócio. Cada módulo subsequente concluído gera um novo deploy,
  para que o produto seja testável em produção incrementalmente — não
  esperar o sistema "completo" para publicar.

## 12. Fora de escopo do v1

- Integração real de lookup de IMEI (seção 7)
- **Billing/cobrança/planos**: registro é 100% aberto — qualquer pessoa cria
  conta só com email, sem verificação de pagamento, sem plano, sem bloqueio
  de funcionalidade. Nenhuma lógica de assinatura/cobrança deve ser
  construída agora. Integração com Asaas é uma fase de refinamento futura,
  explicitamente fora deste spec até novo pedido.
- Auditoria/histórico de alterações e permissões granulares além de owner/admin/seller

## 13. Ordem de execução

1. Setup Next.js 14 + TS + Tailwind + shadcn/ui — ✅ feito (plano de fundação)
2. Repositório GitHub conectado + push inicial — ✅ feito (`saasownerbr/useFindash`, branch `master`)
3. Projeto Vercel conectado ao GitHub com deploy automático em push para main — ✅ feito (projeto `singlehub/usefindash`, conectado automaticamente ao criar via `vercel link`)
4. Variáveis de ambiente configuradas na Vercel — ✅ feito (todas as 6: Supabase URL/anon/service-role, Resend, APP_URL, CRON_SECRET — ambiente Production)
5. Schema Supabase: migrations + RLS — ✅ feito (aplicado no projeto real)
6. Autenticação (magic link + Resend) — ✅ feito (plano de fundação); SMTP customizado com domínio Resend pendente (usuário ainda sem domínio próprio — Supabase usa SMTP padrão por enquanto)
7. Layout base (sidebar, shell autenticado) — ✅ feito (plano de fundação)
8. Primeiro deploy funcional na Vercel (login + dashboard vazio) — ✅ feito, **https://usefindash.vercel.app** está no ar
9. Estoque (entrada de novos e seminovos, sem lookup de IMEI) + deploy
10. Checkup (cálculo de grade + preço sugerido, pesos da seção 5) + deploy
11. Vendas (wizard em 5 passos) + deploy
12. CRM de clientes (lista + perfil) + deploy
13. Financeiro (DRE + lançamentos) + deploy
14. Dashboard (KPIs + gráficos) + deploy
15. Rankings + deploy
16. Configurações + deploy
17. Cron jobs de alertas (com validação `CRON_SECRET`) + deploy
18. Refinamento futuro (fora deste spec): domínio Resend próprio, integração de pagamento Asaas
