"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

import { formatCurrencyBRL } from "@/lib/finance";
import { formatPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import {
  buildUrgentActions,
  initialUrgentState,
  type BirthdayAction,
  type UpgradeAction,
  type UrgentSale,
  type UrgentTab,
} from "@/lib/urgent-actions";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

const STORAGE_KEY = "clientes_urgent_actions";

const YELLOW_BADGE = "bg-[rgba(245,158,11,0.10)] text-[#F59E0B]";
const GREEN_BADGE = "bg-[rgba(16,185,129,0.10)] text-[#10B981]";

function readStored(): { expanded?: boolean; tab?: UrgentTab } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStored(value: { expanded: boolean; tab: UrgentTab }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the block still works, it just won't remember.
  }
}

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", className)}>{children}</span>;
}

function WhatsAppAction({ phone, name, hint }: { phone: string; name: string; hint: string }) {
  const href = whatsappLink(phone);
  return (
    <div className="mt-3">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir conversa no WhatsApp com ${name}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(37,211,102,0.20)] bg-[rgba(37,211,102,0.10)] px-3.5 py-2 text-[13px] font-medium text-[#25D366] transition-colors hover:bg-[rgba(37,211,102,0.18)]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">Sem WhatsApp cadastrado</span>
      )}
      <p className="mt-1.5 text-[11px] text-[#808080]">{hint}</p>
    </div>
  );
}

function ActionCard({ name, badge, children }: { name: string; badge: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#242424] bg-[#1A1A1A] p-4 transition-colors duration-200 hover:border-[#dae878]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dae878] text-sm font-bold text-[#111111]">
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{name}</p>
          <div className="mt-1">{badge}</div>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-[13px] text-muted-foreground">{children}</div>
    </div>
  );
}

function deviceLabel(device: { model: string; storage: string } | null, withStorage: boolean) {
  if (!device) return "Nenhum iPhone comprado na loja";
  return withStorage && device.storage ? `${device.model} · ${device.storage}` : device.model;
}

function BirthdayCard({ action }: { action: BirthdayAction }) {
  const { customer, daysLeft } = action;
  return (
    <ActionCard
      name={customer.name}
      badge={
        daysLeft === 0 ? (
          <Pill className={YELLOW_BADGE}>Aniversário hoje</Pill>
        ) : (
          <span className="text-xs text-muted-foreground">
            Aniversário em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
          </span>
        )
      }
    >
      <p>{deviceLabel(action.device, false)}</p>
      <p className="tabular-nums">{customer.whatsapp ? formatPhone(customer.whatsapp) : "—"}</p>
      <WhatsAppAction phone={customer.whatsapp} name={customer.name} hint="Parabenize e ofereça uma condição especial" />
    </ActionCard>
  );
}

function UpgradeCard({ action }: { action: UpgradeAction }) {
  const { customer } = action;
  return (
    <ActionCard
      name={customer.name}
      badge={<Pill className={GREEN_BADGE}>Usando há {action.monthsUsing} meses</Pill>}
    >
      <p>{deviceLabel(action.device, true)}</p>
      <p>
        Ticket médio <span className="tabular-nums text-foreground">{formatCurrencyBRL(action.averageTicket)}</span>
        {" · "}LTV <span className="tabular-nums text-foreground">{formatCurrencyBRL(Number(customer.ltv))}</span>
      </p>
      <p className="tabular-nums">{customer.whatsapp ? formatPhone(customer.whatsapp) : "—"}</p>
      <WhatsAppAction phone={customer.whatsapp} name={customer.name} hint="Momento ideal para oferecer upgrade" />
    </ActionCard>
  );
}

/**
 * "Ações Urgentes" at the top of Clientes: this week's birthdays and customers due for an upgrade, each with a
 * WhatsApp shortcut. Opens expanded on the right tab when reached from a dashboard alert (?filter=...).
 */
export function UrgentActions() {
  const [state, setState] = useState<{ expanded: boolean; tab: UrgentTab }>({ expanded: false, tab: "birthday" });
  const [lists, setLists] = useState<{ birthdays: BirthdayAction[]; upgrades: UpgradeAction[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(initialUrgentState(new URLSearchParams(window.location.search).get("filter"), readStored()));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const storeId = await getClientStoreId();
      if (!storeId || cancelled) return;
      const supabase = createClient();
      const [storeRes, customersRes, salesRes] = await Promise.all([
        supabase.from("stores").select("upgrade_alert_months").eq("id", storeId).single(),
        supabase.from("customers").select("id, name, whatsapp, birthdate, ltv").eq("store_id", storeId),
        supabase.from("sales").select("customer_id, sold_at, product_id, products(model, storage)").eq("store_id", storeId),
      ]);
      if (cancelled) return;
      if (storeRes.error || customersRes.error || salesRes.error) {
        setError("Não foi possível carregar as ações urgentes.");
        return;
      }
      setLists(
        buildUrgentActions(
          customersRes.data ?? [],
          (salesRes.data ?? []) as UrgentSale[],
          storeRes.data.upgrade_alert_months ?? 20
        )
      );
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function update(next: Partial<{ expanded: boolean; tab: UrgentTab }>) {
    setState((prev) => {
      const merged = { ...prev, ...next };
      saveStored(merged);
      return merged;
    });
  }

  const birthdays = lists?.birthdays ?? [];
  const upgrades = lists?.upgrades ?? [];
  const active = state.tab === "birthday" ? birthdays : upgrades;

  return (
    <section aria-label="Ações Urgentes" className="rounded-xl border border-[#242424] bg-card shadow-card">
      <button
        type="button"
        onClick={() => update({ expanded: !state.expanded })}
        aria-expanded={state.expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left md:px-5"
      >
        <span className="text-[15px] font-semibold text-foreground">Ações Urgentes</span>
        <span className="flex items-center gap-2">
          {lists && (
            <>
              <Pill className={YELLOW_BADGE}>
                {birthdays.length} {birthdays.length === 1 ? "aniversário" : "aniversários"}
              </Pill>
              <Pill className={GREEN_BADGE}>
                {upgrades.length} {upgrades.length === 1 ? "upgrade" : "upgrades"}
              </Pill>
            </>
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", state.expanded && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {state.expanded && (
        <div className="border-t border-[#242424] px-4 pb-4 pt-3 md:px-5 md:pb-5">
          <div role="tablist" className="mb-4 flex gap-1">
            {(
              [
                ["birthday", "Aniversários", birthdays.length],
                ["upgrade", "Upgrade", upgrades.length],
              ] as const
            ).map(([tab, label, count]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={state.tab === tab}
                onClick={() => update({ tab })}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  state.tab === tab ? "bg-[#242424] text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label} <span className="tabular-nums text-muted-foreground">({count})</span>
              </button>
            ))}
          </div>

          {error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : !lists ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl bg-[#1A1A1A]" />
              ))}
            </div>
          ) : active.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {state.tab === "birthday"
                ? "Nenhum aniversário nos próximos 7 dias."
                : "Nenhum cliente em janela de upgrade no momento."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {state.tab === "birthday"
                ? birthdays.map((action) => <BirthdayCard key={action.customer.id} action={action} />)
                : upgrades.map((action) => <UpgradeCard key={action.customer.id} action={action} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
