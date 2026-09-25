// Checkup weights and grade bands follow the spec (docs/superpowers/specs, section 5). Serious defects score
// negative points so one of them drags an otherwise perfect device down instead of just adding nothing.

export type Grade = "A+" | "A" | "B" | "C" | "sucata";

interface Option<K extends string> {
  key: K;
  label: string;
  points: number;
}

export const SCREEN_OPTIONS = [
  { key: "genuine_flawless", label: "Genuína impecável", points: 30 },
  { key: "genuine_light_scratches", label: "Genuína com arranhões leves", points: 22 },
  { key: "genuine_visible_scratches", label: "Genuína com arranhões visíveis", points: 15 },
  { key: "aftermarket_ok", label: "Paralela funcional", points: 12 },
  { key: "aftermarket_issues", label: "Paralela com problemas", points: 6 },
  { key: "cracked_usable", label: "Trincada sem afetar uso", points: 5 },
  { key: "cracked_unusable", label: "Trincada afetando uso", points: -15 },
] as const satisfies readonly Option<string>[];

export const BATTERY_OPTIONS = [
  { key: "genuine_above_90", label: "Genuína acima de 90%", points: 25 },
  { key: "genuine_85_90", label: "Genuína 85 a 90%", points: 20 },
  { key: "genuine_80_85", label: "Genuína 80 a 85%", points: 14 },
  { key: "replaced_good", label: "Trocada com peça boa acima de 85%", points: 12 },
  { key: "below_80", label: "Abaixo de 80% qualquer origem", points: -10 },
] as const satisfies readonly Option<string>[];

export const BIOMETRICS_OPTIONS = [
  { key: "working", label: "Funcionando normalmente", points: 20 },
  { key: "intermittent", label: "Com falhas ocasionais", points: 8 },
  { key: "broken", label: "Não funciona", points: -20 },
] as const satisfies readonly Option<string>[];

export const CAMERA_OPTIONS = [
  { key: "all_working", label: "Todas funcionando", points: 12 },
  { key: "lens_scratch", label: "Arranhão na lente", points: 9 },
  { key: "quality_issue", label: "Problema de qualidade", points: 4 },
  { key: "broken", label: "Não funciona", points: -15 },
] as const satisfies readonly Option<string>[];

export const BODY_OPTIONS = [
  { key: "intact", label: "Intacta sem marcas", points: 8 },
  { key: "invisible_scratches", label: "Arranhões imperceptíveis", points: 6 },
  { key: "visible_scratches", label: "Arranhões visíveis", points: 4 },
  { key: "light_dent", label: "Amassado leve", points: 2 },
  { key: "heavy_dent", label: "Amassado grave ou deformação", points: -20 },
] as const satisfies readonly Option<string>[];

export const ICLOUD_OPTIONS = [
  { key: "removed", label: "Conta removida" },
  { key: "active", label: "Conta ativa" },
] as const;

/** An active iCloud account already blocks the purchase; the score drops too so the result reads as unviable. */
export const ICLOUD_ACTIVE_PENALTY = 50;

/** Below this score the device has critical damage: scrap, with a "do not buy" warning. */
export const CRITICAL_SCORE = 10;

export const SERVICE_OPTIONS = [
  { key: "original", label: "Original", penalty: 0 },
  { key: "apple_part", label: "Peça Apple autorizada", penalty: 0 },
  { key: "third_party", label: "Peça de terceiro", penalty: 5 },
] as const;

type KeyOf<T extends readonly { key: string }[]> = T[number]["key"];

export interface CheckupAnswers {
  screen: KeyOf<typeof SCREEN_OPTIONS> | null;
  battery: KeyOf<typeof BATTERY_OPTIONS> | null;
  biometrics: KeyOf<typeof BIOMETRICS_OPTIONS> | null;
  camera: KeyOf<typeof CAMERA_OPTIONS> | null;
  body: KeyOf<typeof BODY_OPTIONS> | null;
  icloud: KeyOf<typeof ICLOUD_OPTIONS> | null;
  service: KeyOf<typeof SERVICE_OPTIONS> | null;
}

export const EMPTY_ANSWERS: CheckupAnswers = {
  screen: null,
  battery: null,
  biometrics: null,
  camera: null,
  body: null,
  icloud: null,
  service: null,
};

function pointsOf(options: readonly { key: string; points: number }[], key: string | null) {
  return key === null ? 0 : options.find((o) => o.key === key)?.points ?? 0;
}

export function computeScore(answers: CheckupAnswers) {
  const raw =
    pointsOf(SCREEN_OPTIONS, answers.screen) +
    pointsOf(BATTERY_OPTIONS, answers.battery) +
    pointsOf(BIOMETRICS_OPTIONS, answers.biometrics) +
    pointsOf(CAMERA_OPTIONS, answers.camera) +
    pointsOf(BODY_OPTIONS, answers.body);
  const penalty =
    (SERVICE_OPTIONS.find((o) => o.key === answers.service)?.penalty ?? 0) +
    (answers.icloud === "active" ? ICLOUD_ACTIVE_PENALTY : 0);
  const answered = Object.values(answers).filter((v) => v !== null).length;

  return {
    // May be negative: serious defects subtract points.
    score: raw - penalty,
    answered,
    total: Object.keys(answers).length,
    complete: answered === Object.keys(answers).length,
    blocked: answers.icloud === "active",
    // Only a finished checkup: an empty or half-filled form also sums under 10.
    critical: answered === Object.keys(answers).length && raw - penalty < CRITICAL_SCORE,
  };
}

export function gradeFromScore(score: number): Grade {
  if (score >= 90) return "A+";
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "sucata";
}

export interface GradeMultipliers {
  aPlus: number;
  a: number;
  b: number;
  c: number;
}

export const DEFAULT_MULTIPLIERS: GradeMultipliers = { aPlus: 0.92, a: 0.82, b: 0.68, c: 0.48 };

export function multiplierFor(grade: Grade, multipliers: GradeMultipliers) {
  switch (grade) {
    case "A+":
      return multipliers.aPlus;
    case "A":
      return multipliers.a;
    case "B":
      return multipliers.b;
    case "C":
      return multipliers.c;
    default:
      return 0;
  }
}

export type RepairKey = "screen" | "battery" | "biometrics" | "camera";

export const REPAIR_LABELS: Record<RepairKey, string> = {
  screen: "Troca de tela",
  battery: "Troca de bateria",
  biometrics: "Reparo de biometria",
  camera: "Reparo de câmera",
};

export function suggestedRepairs(answers: CheckupAnswers, batteryPercent: number | null): RepairKey[] {
  const repairs: RepairKey[] = [];
  if (
    answers.screen === "aftermarket_ok" ||
    answers.screen === "aftermarket_issues" ||
    answers.screen === "cracked_usable" ||
    answers.screen === "cracked_unusable"
  ) {
    repairs.push("screen");
  }
  if (answers.battery === "below_80" || (batteryPercent !== null && batteryPercent < 80)) {
    repairs.push("battery");
  }
  if (answers.biometrics === "intermittent" || answers.biometrics === "broken") {
    repairs.push("biometrics");
  }
  if (answers.camera === "quality_issue" || answers.camera === "broken") {
    repairs.push("camera");
  }
  return repairs;
}

export interface PricingInput {
  referencePrice: number;
  grade: Grade;
  multipliers: GradeMultipliers;
  repairTotal: number;
  minMargin: number;
  /** What the store actually intends to pay; margin is estimated at the max cost when absent. */
  offerPrice: number | null;
}

export function computePricing(input: PricingInput) {
  const multiplier = multiplierFor(input.grade, input.multipliers);
  const resalePrice = input.referencePrice * multiplier;
  // Scrap has no resale value, so the suggested price is zero rather than minus the repairs.
  const maxPurchaseCost = input.grade === "sucata" ? 0 : resalePrice - input.repairTotal - resalePrice * input.minMargin;
  const purchaseCost = input.offerPrice ?? maxPurchaseCost;
  const marginValue = resalePrice - input.repairTotal - purchaseCost;
  const marginPercent = resalePrice > 0 ? marginValue / resalePrice : 0;

  return { multiplier, resalePrice, maxPurchaseCost, marginValue, marginPercent };
}

/** IMEI check digit (Luhn). */
export function isValidImei(imei: string) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = Number(imei[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
