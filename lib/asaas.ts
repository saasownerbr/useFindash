// Server-only Asaas API client. Docs: https://docs.asaas.com/reference

const BASE_URL =
  process.env.ASAAS_ENVIRONMENT === "production" ? "https://api.asaas.com/api/v3" : "https://sandbox.asaas.com/api/v3";

export async function asaasFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      access_token: process.env.ASAAS_API_KEY!,
      "Content-Type": "application/json",
      // Asaas rejects requests without a User-Agent.
      "User-Agent": "useFindash",
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
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

/** Reuses the Asaas customer with this email, or creates one. */
export async function findOrCreateCustomer(input: { name: string; email: string; cpfCnpj?: string | null }) {
  const found = await asaasFetch<AsaasList<{ id: string }>>(`/customers?email=${encodeURIComponent(input.email)}`);
  if (found.data[0]) return found.data[0].id;

  const created = await asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj?.replace(/\D/g, "") || undefined,
      notificationDisabled: false,
    }),
  });
  return created.id;
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
