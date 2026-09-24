"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyBRL } from "@/lib/finance";
import type { Grade } from "@/lib/used-device-calculator";
import { cn } from "@/lib/utils";

const GRADE_COLORS: Record<Grade, string> = {
  "A+": "#10B981",
  A: "#10B981",
  B: "#3B82F6",
  C: "#F59E0B",
  sucata: "#EF4444",
};

function scoreColor(score: number) {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(score);
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#2A2A2A" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(score, 100) / 100)}
          style={{ transition: "stroke-dashoffset 300ms ease, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-[11px] text-[#6B7280]">de 100</span>
      </div>
    </div>
  );
}

export interface ResultsPanelProps {
  score: number;
  grade: Grade;
  answered: number;
  total: number;
  blocked: boolean;
  referencePrice: number;
  multiplier: number;
  resalePrice: number;
  repairTotal: number;
  minMargin: number;
  maxPurchaseCost: number;
  marginValue: number;
  marginPercent: number;
  offerPrice: string;
  onOfferPriceChange: (value: string) => void;
  canAddToStock: boolean;
  addDisabledReason: string | null;
  onAddToStock: () => void;
}

export function ResultsPanel(props: ResultsPanelProps) {
  const hasPrice = props.referencePrice > 0;
  const incomplete = props.answered < props.total;
  const worthBuying = props.maxPurchaseCost > 0;

  return (
    <div className="space-y-4">
      {props.blocked && (
        <div role="alert" className="flex gap-3 rounded-xl border border-danger/60 bg-danger/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="font-semibold text-danger">Aparelho bloqueado — não recomendado para compra</p>
            <p className="mt-1 text-[#FCA5A5]">A conta iCloud está ativa. Só avalie de novo depois que o cliente remover a conta.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-5">
        <ScoreRing score={props.score} />
        <div>
          <p className="text-xs text-muted-foreground">Grade</p>
          <p className="text-4xl font-bold leading-tight" style={{ color: GRADE_COLORS[props.grade] }}>
            {props.grade === "sucata" ? "Sucata" : props.grade}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {incomplete ? `Checkup: ${props.answered} de ${props.total} itens` : "Checkup completo"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">Preço de revenda sugerido</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {hasPrice ? formatCurrencyBRL(props.resalePrice) : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">Pagar no máximo</p>
          <p
            className={cn(
              "mt-1 text-xl font-bold tabular-nums",
              !hasPrice ? "text-foreground" : worthBuying ? "text-success" : "text-danger"
            )}
          >
            {hasPrice ? (worthBuying ? formatCurrencyBRL(props.maxPurchaseCost) : "Não compensa") : "—"}
          </p>
        </div>
      </div>

      {!hasPrice && (
        <p className="text-xs text-[#6B7280]">
          Informe o preço de mercado de referência para ver os valores. Cadastre preços em Inputs → Tabela de Preços
          para preencher automaticamente.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="offerPrice">Valor que você pretende pagar (opcional)</Label>
        <Input
          id="offerPrice"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder={hasPrice && worthBuying ? `Até ${formatCurrencyBRL(props.maxPurchaseCost)}` : "R$ 0,00"}
          value={props.offerPrice}
          onChange={(e) => props.onOfferPriceChange(e.target.value)}
        />
      </div>

      <div className="rounded-lg bg-background/60 p-3">
        <p className="text-xs text-muted-foreground">
          Margem estimada {props.offerPrice ? "com o valor informado" : "pagando o máximo"}
        </p>
        <p
          className={cn(
            "mt-1 text-lg font-bold tabular-nums",
            props.marginValue < 0 ? "text-danger" : "text-foreground"
          )}
        >
          {hasPrice ? `${formatPercent(props.marginPercent)} · ${formatCurrencyBRL(props.marginValue)}` : "—"}
        </p>
      </div>

      <table className="w-full text-sm">
        <caption className="mb-2 text-left text-xs text-muted-foreground">Como chegamos nesse valor</caption>
        <tbody className="divide-y divide-border">
          <tr>
            <td className="py-2 text-muted-foreground">Preço de referência de mercado</td>
            <td className="py-2 text-right tabular-nums">{formatCurrencyBRL(props.referencePrice)}</td>
          </tr>
          <tr>
            <td className="py-2 text-muted-foreground">Multiplicador do grade</td>
            <td className="py-2 text-right tabular-nums">{formatPercent(props.multiplier)}</td>
          </tr>
          <tr>
            <td className="py-2 text-muted-foreground">Preço de revenda sugerido</td>
            <td className="py-2 text-right tabular-nums">{formatCurrencyBRL(props.resalePrice)}</td>
          </tr>
          <tr>
            <td className="py-2 text-muted-foreground">Custo total de reparo</td>
            <td className="py-2 text-right tabular-nums">− {formatCurrencyBRL(props.repairTotal)}</td>
          </tr>
          <tr>
            <td className="py-2 text-muted-foreground">Margem mínima configurada</td>
            <td className="py-2 text-right tabular-nums">{formatPercent(props.minMargin)}</td>
          </tr>
          <tr>
            <td className="py-2 font-semibold text-foreground">Custo máximo para compra</td>
            <td className={cn("py-2 text-right font-bold tabular-nums", worthBuying ? "text-success" : "text-danger")}>
              {formatCurrencyBRL(props.maxPurchaseCost)}
            </td>
          </tr>
        </tbody>
      </table>

      <div>
        <Button className="w-full" disabled={!props.canAddToStock} onClick={props.onAddToStock}>
          Adicionar ao Estoque com este custo
        </Button>
        {props.addDisabledReason && <p className="mt-2 text-xs text-[#6B7280]">{props.addDisabledReason}</p>}
      </div>
    </div>
  );
}
