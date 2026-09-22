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

**Grade do checkup**: cada item do checkup tem peso fixo; a soma pondera para
uma pontuação 0–100 que mapeia para grade:
- 90–100 → A+, 75–89 → A, 55–74 → B, 35–54 → C, <35 → sucata
- Se iCloud ativo/bloqueado → `status = blocked`ou equivalente, aparelho não pode ser vendido até resolução, independente da pontuação.

Pesos propostos (default, editável depois em Configurações — resolve o ponto
em aberto do spec original):
| Item | Peso |
|---|---|
| Saúde da bateria | 30% |
| Tela | 20% |
| Câmeras | 15% |
| Estrutura (chassi/tampa) | 15% |
| Histórico de serviço | 10% |
| Biometria (Face ID/Touch ID) | 10% |

**Preço sugerido**: busca `base_price` em `price_reference` para
model+storage da loja, aplica o `grade_multiplier_*` correspondente à grade
calculada.

**Comissão** (não detalhado no spec original — assumido): `commission_amount = sale_price × store_users.commission_rate` do vendedor daquela venda, calculado e gravado no momento do insert de `sales`.

## 6. Módulos e rotas (App Router)

```
/app/(auth)/login                          — magic link
/app/(auth)/onboarding                     — criação da store (nome, meta de faturamento)
/app/(dashboard)/                          — KPIs, gráficos, alertas (upgrade/aniversário)
/app/(dashboard)/estoque                   — aparelhos + acessórios (tabs)
/app/(dashboard)/estoque/checkup/[id]      — checkup de seminovo
/app/(dashboard)/vendas/nova               — wizard de venda em steps
/app/(dashboard)/clientes                  — CRM (lista + perfil)
/app/(dashboard)/financeiro                — DRE + lançamentos
/app/(dashboard)/rankings                  — vendedores, produtos, canais
/app/(dashboard)/configuracoes             — loja, vendedores, tabela de referência, alertas
```

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

Emails:
- Magic link de autenticação (via Resend, substituindo SMTP padrão do Supabase)
- Boas-vindas ao criar conta
- Alerta semanal de clientes em janela de upgrade: nome, modelo comprado, data da compra, WhatsApp
- Alerta de aniversários dos próximos 7 dias

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

## 9. Pontos do spec original resolvidos nesta sessão

| Ponto em aberto | Decisão |
|---|---|
| Lookup de IMEI via `consultaimei.net` | Removido do v1 — cadastro manual apenas (seção 7) |
| Pesos do checkup não numerados | Pesos default propostos na seção 5, ajustáveis depois |
| Provisionar Supabase real agora? | Não — apenas código + migrations; conexão a um projeto real fica a cargo do usuário |

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
- `.env.example` (sem valores): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`
- `.gitignore` incluindo `.env.local`, `node_modules`
- `README.md`: descrição, setup local, variáveis de ambiente, comandos de migration, configuração de Resend e Vercel
- Sem provisionamento real de Supabase/Vercel/GitHub nesta sessão — só os artefatos de configuração

## 12. Fora de escopo do v1

- Integração real de lookup de IMEI (seção 7)
- Billing/cobrança do plano
- Auditoria/histórico de alterações e permissões granulares além de owner/admin/seller
- Deploy real na Vercel e criação de repositório remoto no GitHub (feito sob pedido explícito futuro)

## 13. Ordem de execução

1. Setup Next.js 14 + TS + Tailwind + shadcn/ui
2. Schema Supabase: migrations + RLS
3. Autenticação (magic link + Resend)
4. Layout base (sidebar, shell autenticado)
5. Estoque (entrada de novos e seminovos, sem lookup de IMEI)
6. Checkup (cálculo de grade + preço sugerido)
7. Vendas (wizard em steps)
8. CRM de clientes (lista + perfil)
9. Financeiro (DRE + lançamentos)
10. Dashboard (KPIs + gráficos)
11. Rankings
12. Configurações
13. Cron jobs de alertas
14. Artefatos de deployment (vercel.json, README, .env.example, .gitignore)
