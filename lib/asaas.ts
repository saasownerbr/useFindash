// Server-only Asaas API client. Docs: https://docs.asaas.com/reference

// Production has no /api segment (api.asaas.com/api/v3 answers 404); the sandbox keeps it.
const PRODUCTION_URL = "https://api.asaas.com/v3";
const SANDBOX_URL = "https://sandbox.asaas.com/api/v3";

/** The key as pasted in the dashboard, without stray quotes or whitespace. */
export function asaasApiKey(raw: string | undefined = process.env.ASAAS_API_KEY): string {
  return (raw ?? "").trim().replace(/^["']|["']$/g, "");
}

/**
 * Asaas keys carry their environment ($aact_prod_… or $aact_hmlg_…), and a key sent to the other environment fails
 * with invalid_environment. So the key decides; ASAAS_ENVIRONMENT only matters for keys without that marker.
 */
export function asaasBaseUrl(key: string = asaasApiKey(), environment = process.env.ASAAS_ENVIRONMENT): string {
  if (key.startsWith("$aact_prod_")) return PRODUCTION_URL;
  if (key.startsWith("$aact_hmlg_")) return SANDBOX_URL;
  const env = (environment ?? "").trim().replace(/^["']|["']$/g, "").toLowerCase();
  return ["production", "prod", "producao", "produção"].includes(env) ? PRODUCTION_URL : SANDBOX_URL;
}

export async function asaasFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const key = asaasApiKey();
  const res = await fetch(`${asaasBaseUrl(key)}${path}`, {
    ...options,
    headers: {
      access_token: key,
      "Content-Type": "application/json",
      // Asaas rejects requests without a User-Agent.
      "User-Agent": "useFindash",
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    // Method, path and status make an empty-bodied failure (401/404) readable in the logs. No key in here.
    throw new Error(`Asaas ${options?.method ?? "GET"} ${path.split("?")[0]} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string | null;
  value: number;
  status: string;
  dueDate: string;
  invoiceUrl: string;
}

interface AsaasList<T> {
  data: T[];
}

/**
 * The Asaas customer to bill: the one already linked to the store, else the one with this email, else a new one.
 * Asaas only charges customers with a CPF/CNPJ, so an existing customer gets the store's document too.
 */
export async function ensureCustomer(input: {
  customerId?: string | null;
  name: string;
  email: string;
  cpfCnpj: string;
}): Promise<string> {
  const body = JSON.stringify({ name: input.name, email: input.email, cpfCnpj: input.cpfCnpj.replace(/\D/g, "") });

  let id = input.customerId ?? null;
  if (!id) {
    const found = await asaasFetch<AsaasList<{ id: string }>>(`/customers?email=${encodeURIComponent(input.email)}`);
    id = found.data[0]?.id ?? null;
  }
  if (id) {
    // Current docs update with PUT; older accounts of the v3 API only accept POST on the same path.
    await asaasFetch(`/customers/${id}`, { method: "PUT", body }).catch(() =>
      asaasFetch(`/customers/${id}`, { method: "POST", body })
    );
    return id;
  }
  return (await asaasFetch<{ id: string }>("/customers", { method: "POST", body })).id;
}

/** The charge the customer should pay now: the oldest overdue/pending one, else the latest. */
export async function currentSubscriptionPayment(subscriptionId: string): Promise<AsaasPayment | null> {
  const list = await asaasFetch<AsaasList<AsaasPayment>>(`/subscriptions/${subscriptionId}/payments`);
  const open = list.data
    .filter((p) => p.status === "OVERDUE" || p.status === "PENDING")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return open[0] ?? list.data[0] ?? null;
}

/** Today (or today + days) in Brazil, as Asaas' YYYY-MM-DD due date. */
export function brazilDate(addDays = 0, now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + addDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(shifted);
}
