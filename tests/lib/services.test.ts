import { describe, expect, it } from "vitest";

import {
  OTHER_SERVICE_TYPE,
  partsForStorage,
  partsFromStorage,
  partsTotal,
  resolveServiceType,
  serviceFieldsFromRecord,
  serviceTotal,
  sumServiceRevenue,
} from "@/lib/services";

describe("service totals", () => {
  it("sums parts and labor, ignoring negatives", () => {
    const parts = [
      { id: "a", name: "Tela", value: 450 },
      { id: "b", name: "Cola", value: 20.5 },
      { id: "c", name: "", value: -5 },
    ];
    expect(partsTotal(parts)).toBe(470.5);
    expect(serviceTotal(parts, 150)).toBe(620.5);
    expect(serviceTotal([], 0)).toBe(0);
  });

  it("keeps only filled part rows for storage", () => {
    expect(
      partsForStorage([
        { id: "a", name: " Tela original ", value: 450 },
        { id: "b", name: "", value: 0 },
      ])
    ).toEqual([{ name: "Tela original", value: 450 }]);
  });

  it("reads stored parts defensively", () => {
    expect(partsFromStorage(null)).toEqual([]);
    expect(partsFromStorage([{ name: "Bateria", value: "180" }])).toEqual([{ name: "Bateria", value: 180 }]);
  });

  it("uses the typed type under Outro", () => {
    expect(resolveServiceType(OTHER_SERVICE_TYPE, " Troca de alto-falante ")).toBe("Troca de alto-falante");
    expect(resolveServiceType("Troca de tela", "ignored")).toBe("Troca de tela");
  });

  it("counts only completed or delivered services as revenue", () => {
    const revenue = sumServiceRevenue([
      { status: "pending", total_cost: 300, parts_cost: 200 },
      { status: "in_progress", total_cost: 300, parts_cost: 200 },
      { status: "completed", total_cost: 600, parts_cost: 450 },
      { status: "delivered", total_cost: 100, parts_cost: 0 },
    ]);
    expect(revenue).toEqual({ revenue: 700, cost: 450, count: 2 });
  });
});

describe("serviceFieldsFromRecord", () => {
  const record = {
    device_description: "iPhone 13 128GB",
    service_type: "Troca de tela",
    parts_replaced: [{ name: "Tela original", value: 450 }],
    labor_cost: 150,
    notes: "Garantia 90 dias",
  };

  it("fills the form with a known service type and fresh part ids", () => {
    const fields = serviceFieldsFromRecord(record);
    expect(fields).toMatchObject({
      deviceDescription: "iPhone 13 128GB",
      serviceType: "Troca de tela",
      customServiceType: "",
      laborCost: 150,
      notes: "Garantia 90 dias",
    });
    expect(fields.parts).toHaveLength(1);
    expect(fields.parts[0]).toMatchObject({ name: "Tela original", value: 450 });
    expect(fields.parts[0].id).toBeTruthy();
  });

  it("puts an unlisted type under Outro and starts with one empty part when none were saved", () => {
    const fields = serviceFieldsFromRecord({ ...record, service_type: "Troca de alto-falante", parts_replaced: [], notes: null });
    expect(fields.serviceType).toBe(OTHER_SERVICE_TYPE);
    expect(fields.customServiceType).toBe("Troca de alto-falante");
    expect(fields.parts).toHaveLength(1);
    expect(fields.parts[0]).toMatchObject({ name: "", value: 0 });
    expect(fields.notes).toBe("");
  });
});
