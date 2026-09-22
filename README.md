# useFindash

SaaS de gestão para lojas revendedoras de iPhone no Brasil — estoque, checkup
de seminovos, vendas, CRM de clientes e BI financeiro.

Ver o design completo em
[docs/superpowers/specs/2026-09-22-usefindash-saas-design.md](docs/superpowers/specs/2026-09-22-usefindash-saas-design.md).

## Stack

Next.js 14 (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Supabase
(Postgres + RLS + Auth), Resend (email transacional), Zod, React Hook Form,
Recharts, Zustand, Vercel (hosting + cron jobs).

## Setup local

```bash
npm install
cp .env.example .env.local   # preencha as variáveis abaixo
npm run dev
```

Abra http://localhost:3000.

## Variáveis de ambiente

| Variável | Onde conseguir |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API (chave `anon`/publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (chave `service_role`, **secreta**, nunca no client) |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` em dev; a URL da Vercel em produção |

## Banco de dados (migrations)

O schema vive em `supabase/migrations/*.sql`, aplicado em ordem. Para aplicar
num projeto Supabase (via Supabase CLI, com o projeto já linkado):

```bash
supabase db push
```

As migrations já foram aplicadas ao projeto Supabase `useFindash`
(`crfmlimzjcztzlvylrpf`) usado em desenvolvimento.

## Resend (email transacional)

1. Crie uma conta em resend.com e verifique um domínio de envio.
2. Gere uma API key e coloque em `RESEND_API_KEY`.
3. Configure o SMTP customizado do Supabase (Dashboard → Authentication →
   Settings → SMTP Settings) apontando para `smtp.resend.com`, usuário
   `resend`, senha = a API key — isso faz o magic link de login sair pelo
   Resend em vez do SMTP padrão do Supabase.

## Deploy (Vercel)

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel deploy
```

`vercel.json` com os cron jobs de alertas é adicionado num plano posterior,
junto com as rotas `/api/cron/*` que eles chamam.

## Testes

```bash
npm test        # roda uma vez
npm run test:watch
```

## Status

Este é o plano de fundação: scaffold, autenticação (magic link + onboarding)
e o shell do dashboard. Os módulos de negócio (estoque, checkup, vendas,
clientes, financeiro, dashboard com KPIs, rankings, configurações, cron
jobs) são implementados em planos separados — ver
`docs/superpowers/plans/`.
