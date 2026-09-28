/** Assistência técnica: service types, statuses and totals shared by the sale wizard and /assistencia. */

export const SERVICE_TYPES = [
  "Troca de tela",
  "Troca de bateria",
  "Troca de câmera",
  "Reparo de biometria (Face ID / Touch ID)",
  "Troca de conector de carga",
  "Reparo de placa",
  "Limpeza interna",
  "Desbloqueio",
] as const;

/** Select value for a service type the user types in. */
export const OTHER_SERVICE_TYPE = "Outro";

export const SERVICE_STATUSES = ["pending", "in_progress", "completed", "delivered"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluído",
  delivered: "Entregue",
};

/** Pendente amber, Em andamento blue, Concluído green, Entregue gray. */
export const SERVICE_STATUS_COLORS: Record<ServiceStatus, { color: string; background: string }> = {
  pending: { color: "#F59E0B", background: "rgba(245,158,11,0.12)" },
  in_progress: { color: "#3B82F6", background: "rgba(59,130,246,0.12)" },
  completed: { color: "#10B981", background: "rgba(16,185,129,0.12)" },
  delivered: { color: "#9CA3AF", background: "rgba(156,163,175,0.12)" },
};

/** Only a finished service is revenue (dashboard, DRE, LTV). */
export const REVENUE_STATUSES: ServiceStatus[] = ["completed", "delivered"];

export function isServiceStatus(value: unknown): value is ServiceStatus {
  return (SERVICE_STATUSES as readonly unknown[]).includes(value);
}

export type ServicePart = { id: string; name: string; value: number };

export function newServicePart(): ServicePart {
  return { id: Math.random().toString(36).slice(2), name: "", value: 0 };
}

const cents = (value: number) => Math.round(value * 100) / 100;

export function partsTotal(parts: Pick<ServicePart, "value">[]): number {
  return cents(parts.reduce((sum, part) => sum + (Number.isFinite(part.value) ? Math.max(0, part.value) : 0), 0));
}

export function serviceTotal(parts: Pick<ServicePart, "value">[], laborCost: number): number {
  return cents(partsTotal(parts) + Math.max(0, Number.isFinite(laborCost) ? laborCost : 0));
}

/** The service type to save: the chosen option, or what was typed under "Outro". */
export function resolveServiceType(selected: string, custom: string): string {
  return selected === OTHER_SERVICE_TYPE ? custom.trim() : selected.trim();
}

/** parts_replaced as stored: named parts only, values as numbers (the database trigger sums them into parts_cost). */
export function partsForStorage(parts: ServicePart[]): { name: string; value: number }[] {
  return parts
    .filter((part) => part.name.trim() !== "" || part.value > 0)
    .map((part) => ({ name: part.name.trim() || "Peça", value: cents(Math.max(0, part.value)) }));
}

/** Parts read back from the database, tolerating anything unexpected in the jsonb column. */
export function partsFromStorage(value: unknown): { name: string; value: number }[] {
  if (!Array.isArray(value)) return [];
  return value.map((part) => ({
    name: typeof part?.name === "string" ? part.name : "Peça",
    value: Number(part?.value) || 0,
  }));
}

export type ServiceRevenue = { revenue: number; cost: number; count: number };
export const NO_SERVICE_REVENUE: ServiceRevenue = { revenue: 0, cost: 0, count: 0 };

/** Revenue (total), CMV (parts) and count of the finished services in a list. */
export function sumServiceRevenue(
  services: { status: string; total_cost: number | null; parts_cost: number | null }[]
): ServiceRevenue {
  return services
    .filter((s) => (REVENUE_STATUSES as string[]).includes(s.status))
    .reduce(
      (acc, s) => ({
        revenue: acc.revenue + Number(s.total_cost ?? 0),
        cost: acc.cost + Number(s.parts_cost ?? 0),
        count: acc.count + 1,
      }),
      { ...NO_SERVICE_REVENUE }
    );
}
