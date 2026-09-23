"use client";

import { useEffect, useMemo, useState } from "react";

import { AddToStockDialog } from "@/components/calculadora/add-to-stock-dialog";
import { OptionGroup } from "@/components/calculadora/option-group";
import { ResultsPanel } from "@/components/calculadora/results-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { modelOptions, normalizeKey, storageOptions } from "@/lib/iphone-models";
import { createClient } from "@/lib/supabase/client";
import { getActiveStoreId } from "@/lib/supabase/store";
import type { Tables } from "@/lib/supabase/types";
import {
  BATTERY_OPTIONS,
  BIOMETRICS_OPTIONS,
  BODY_OPTIONS,
  CAMERA_OPTIONS,
  DEFAULT_MULTIPLIERS,
  EMPTY_ANSWERS,
  ICLOUD_OPTIONS,
  REPAIR_LABELS,
  SCREEN_OPTIONS,
  SERVICE_OPTIONS,
  computePricing,
  computeScore,
  gradeFromScore,
  isValidImei,
  suggestedRepairs,
  type CheckupAnswers,
  type RepairKey,
} from "@/lib/used-device-calculator";

type PriceReference = Tables<"price_reference">;
type RepairCost = Tables<"repair_costs">;

const SERVICE_WITH_NOTES = SERVICE_OPTIONS.map((o) => ({
  key: o.key,
  label: o.label,
  note: o.penalty ? `−${o.penalty} pts` : "sem desconto",
}));

function toNumber(value: string) {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) ? n : null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function UsedDeviceCalculator() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [priceRefs, setPriceRefs] = useState<PriceReference[]>([]);
  const [repairCosts, setRepairCosts] = useState<RepairCost[]>([]);
  const [minMargin, setMinMargin] = useState(0.2);

  const [imei, setImei] = useState("");
  const [imeiNote, setImeiNote] = useState<{ tone: "info" | "warn"; text: string } | null>(null);
  const [model, setModel] = useState("");
  const [storage, setStorage] = useState("");
  const [referencePrice, setReferencePrice] = useState("");

  const [answers, setAnswers] = useState<CheckupAnswers>(EMPTY_ANSWERS);
  const [batteryPercent, setBatteryPercent] = useState("");
  const [batteryCycles, setBatteryCycles] = useState("");
  const [repairEdits, setRepairEdits] = useState<Partial<Record<RepairKey, string>>>({});
  const [offerPrice, setOfferPrice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const id = await getActiveStoreId(supabase, user.id);
      if (!id || cancelled) return;
      setStoreId(id);
      const [refs, costs, store] = await Promise.all([
        supabase.from("price_reference").select("*").eq("store_id", id),
        supabase.from("repair_costs").select("*").eq("store_id", id),
        supabase.from("stores").select("min_margin").eq("id", id).single(),
      ]);
      if (cancelled) return;
      setPriceRefs(refs.data ?? []);
      setRepairCosts(costs.data ?? []);
      if (store.data) setMinMargin(Number(store.data.min_margin));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const models = useMemo(() => modelOptions(priceRefs.map((r) => r.model)), [priceRefs]);
  const storages = useMemo(
    () =>
      storageOptions(
        model,
        priceRefs.filter((r) => normalizeKey(r.model) === normalizeKey(model)).map((r) => r.storage)
      ),
    [model, priceRefs]
  );
  const priceRef = priceRefs.find(
    (r) => normalizeKey(r.model) === normalizeKey(model) && normalizeKey(r.storage) === normalizeKey(storage)
  );
  const repairConfig = repairCosts.find((r) => normalizeKey(r.model) === normalizeKey(model));

  function selectDevice(nextModel: string, nextStorage: string) {
    setModel(nextModel);
    setStorage(nextStorage);
    const ref = priceRefs.find(
      (r) => normalizeKey(r.model) === normalizeKey(nextModel) && normalizeKey(r.storage) === normalizeKey(nextStorage)
    );
    setReferencePrice(ref ? String(ref.base_price) : "");
    setRepairEdits({});
  }

  async function handleImeiChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    setImei(digits);
    setImeiNote(null);
    if (digits.length < 15) return;
    if (!isValidImei(digits)) {
      setImeiNote({ tone: "warn", text: "Esse IMEI não confere (dígito verificador inválido). Confira no aparelho: *#06#." });
      return;
    }
    if (!storeId) return;
    const { data } = await createClient()
      .from("products")
      .select("model, storage, status")
      .eq("store_id", storeId)
      .eq("imei", digits)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) {
      setImeiNote({ tone: "info", text: "IMEI válido. Selecione o modelo e o armazenamento abaixo." });
      return;
    }
    selectDevice(data.model, data.storage);
    setImeiNote(
      data.status === "sold"
        ? { tone: "info", text: `Este aparelho já foi vendido pela sua loja: ${data.model} ${data.storage}.` }
        : { tone: "warn", text: `Este IMEI já está no seu estoque (${data.model} ${data.storage}).` }
    );
  }

  const setAnswer = <K extends keyof CheckupAnswers>(key: K) => (value: CheckupAnswers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const battery = toNumber(batteryPercent);
  const { score, answered, total, complete, blocked } = computeScore(answers);
  const grade = gradeFromScore(score);
  const repairs = suggestedRepairs(answers, battery);

  function configuredCost(key: RepairKey) {
    if (!repairConfig) return "";
    const value =
      key === "screen" ? repairConfig.screen_cost : key === "battery" ? repairConfig.battery_cost : key === "camera" ? repairConfig.camera_cost : null;
    return value === null ? "" : String(value);
  }
  const repairValue = (key: RepairKey) => repairEdits[key] ?? configuredCost(key);
  const repairTotal = repairs.reduce((sum, key) => sum + (toNumber(repairValue(key)) ?? 0), 0);

  const multipliers = priceRef
    ? {
        aPlus: priceRef.grade_multiplier_a_plus,
        a: priceRef.grade_multiplier_a,
        b: priceRef.grade_multiplier_b,
        c: priceRef.grade_multiplier_c,
      }
    : DEFAULT_MULTIPLIERS;
  const reference = toNumber(referencePrice) ?? 0;
  const pricing = computePricing({
    referencePrice: reference,
    grade,
    multipliers,
    repairTotal,
    minMargin,
    offerPrice: toNumber(offerPrice),
  });

  const addDisabledReason = blocked
    ? "Aparelho com iCloud ativo não pode entrar no estoque."
    : !complete
      ? `Responda todo o checkup para adicionar ao estoque (${answered} de ${total}).`
      : !model || !storage
        ? "Selecione modelo e armazenamento."
        : reference <= 0
          ? "Informe o preço de mercado de referência."
          : null;

  const checkupData = {
    source: "calculadora",
    evaluated_at: new Date().toISOString(),
    answers: { ...answers },
    battery_percent: battery,
    battery_cycles: toNumber(batteryCycles),
    score,
    grade,
    repairs: repairs.map((key) => ({ key, label: REPAIR_LABELS[key], cost: toNumber(repairValue(key)) ?? 0 })),
    repair_total: repairTotal,
    reference_price: reference,
    multiplier: pricing.multiplier,
    resale_price: pricing.resalePrice,
    min_margin: minMargin,
    max_purchase_cost: pricing.maxPurchaseCost,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="space-y-6">
        <Section title="Aparelho">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                inputMode="numeric"
                autoComplete="off"
                placeholder="15 dígitos — disque *#06# no aparelho"
                value={imei}
                onChange={(e) => handleImeiChange(e.target.value)}
              />
              {imeiNote && (
                <p className={imeiNote.tone === "warn" ? "text-xs text-warning" : "text-xs text-muted-foreground"}>
                  {imeiNote.text}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">Modelo</Label>
              <Select id="model" value={model} onChange={(e) => selectDevice(e.target.value, "")}>
                <option value="">Selecione o modelo</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="storage">Armazenamento</Label>
              <Select
                id="storage"
                value={storage}
                disabled={!model}
                onChange={(e) => selectDevice(model, e.target.value)}
              >
                <option value="">{model ? "Selecione" : "Escolha o modelo primeiro"}</option>
                {storages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="referencePrice">Preço de mercado de referência (R$)</Label>
              <Input
                id="referencePrice"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="R$ 0,00"
                value={referencePrice}
                onChange={(e) => setReferencePrice(e.target.value)}
              />
              <p className="text-xs text-[#6B7280]">
                {priceRef
                  ? "Preenchido pela sua tabela de preços. Pode editar."
                  : model && storage
                    ? "Esse modelo não está na sua tabela de preços. Digite o valor de mercado."
                    : "Preenchido automaticamente quando o modelo está na sua tabela de preços."}
              </p>
            </div>
          </div>
        </Section>

        <Section title="Checkup de qualidade">
          <div className="space-y-6">
            <OptionGroup label="Tela" name="screen" options={SCREEN_OPTIONS} value={answers.screen} onChange={setAnswer("screen")} />
            <div className="space-y-3">
              <OptionGroup
                label="Bateria"
                name="battery"
                options={BATTERY_OPTIONS}
                value={answers.battery}
                onChange={setAnswer("battery")}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="batteryPercent">Saúde da bateria (%)</Label>
                  <Input
                    id="batteryPercent"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    placeholder="Ex: 87"
                    value={batteryPercent}
                    onChange={(e) => setBatteryPercent(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="batteryCycles">Ciclos (opcional)</Label>
                  <Input
                    id="batteryCycles"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Ex: 420"
                    value={batteryCycles}
                    onChange={(e) => setBatteryCycles(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <OptionGroup
              label="Biometria (Face ID / Touch ID)"
              name="biometrics"
              options={BIOMETRICS_OPTIONS}
              value={answers.biometrics}
              onChange={setAnswer("biometrics")}
            />
            <OptionGroup label="Câmeras" name="camera" options={CAMERA_OPTIONS} value={answers.camera} onChange={setAnswer("camera")} />
            <OptionGroup label="Estrutura" name="body" options={BODY_OPTIONS} value={answers.body} onChange={setAnswer("body")} />
            <OptionGroup
              label="iCloud"
              name="icloud"
              options={ICLOUD_OPTIONS.map((o) => ({ ...o, note: o.key === "active" ? "bloqueia" : "liberado" }))}
              value={answers.icloud}
              onChange={setAnswer("icloud")}
              tone={(key) => (key === "active" ? "danger" : undefined)}
            />
            <OptionGroup
              label="Histórico de serviço"
              name="service"
              options={SERVICE_WITH_NOTES}
              value={answers.service}
              onChange={setAnswer("service")}
            />
          </div>
        </Section>

        <Section title="Reparos necessários">
          {repairs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum reparo sugerido. Os reparos aparecem aqui conforme o checkup indicar tela, bateria, biometria ou câmera
              com problema.
            </p>
          ) : (
            <div className="space-y-3">
              {repairs.map((key) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label htmlFor={`repair-${key}`} className="text-sm text-foreground">
                    {REPAIR_LABELS[key]}
                  </Label>
                  <Input
                    id={`repair-${key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="R$ 0,00"
                    className="w-40 text-right"
                    value={repairValue(key)}
                    onChange={(e) => setRepairEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-semibold text-foreground">Total de reparo</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {repairTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              {!repairConfig && model && (
                <p className="text-xs text-[#6B7280]">
                  Configure os custos de reparo deste modelo em Configurações → Calculadora para preencher automaticamente.
                </p>
              )}
            </div>
          )}
        </Section>
      </div>

      <aside className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 lg:sticky lg:top-6 lg:border-l-2 lg:border-l-[#3B82F6]">
        <h2 className="mb-4 text-base font-semibold text-foreground">Resultado</h2>
        <ResultsPanel
          score={score}
          grade={grade}
          answered={answered}
          total={total}
          blocked={blocked}
          referencePrice={reference}
          multiplier={pricing.multiplier}
          resalePrice={pricing.resalePrice}
          repairTotal={repairTotal}
          minMargin={minMargin}
          maxPurchaseCost={pricing.maxPurchaseCost}
          marginValue={pricing.marginValue}
          marginPercent={pricing.marginPercent}
          offerPrice={offerPrice}
          onOfferPriceChange={setOfferPrice}
          canAddToStock={addDisabledReason === null}
          addDisabledReason={addDisabledReason}
          onAddToStock={() => setDialogOpen(true)}
        />
      </aside>

      <AddToStockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        storeId={storeId}
        imei={imei}
        model={model}
        storage={storage}
        grade={grade}
        repairTotal={repairTotal}
        offerPrice={offerPrice}
        suggestedPrice={pricing.resalePrice}
        checkupData={checkupData}
      />
    </div>
  );
}
