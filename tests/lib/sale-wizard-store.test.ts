import { describe, it, expect, beforeEach } from "vitest";

import { useSaleWizardStore } from "@/lib/sale-wizard-store";

const accessory = { accessoryId: "acc-1", name: "Capinha", quantity: 1, unitPrice: 30, availableQuantity: 5 };

describe("useSaleWizardStore addAccessory", () => {
  beforeEach(() => {
    useSaleWizardStore.getState().reset();
  });

  it("adds a new accessory", () => {
    useSaleWizardStore.getState().addAccessory(accessory);
    expect(useSaleWizardStore.getState().accessories).toEqual([accessory]);
  });

  it("updates the quantity when the same accessory is added again, instead of ignoring it", () => {
    useSaleWizardStore.getState().addAccessory(accessory);
    useSaleWizardStore.getState().addAccessory({ ...accessory, quantity: 3 });
    expect(useSaleWizardStore.getState().accessories).toEqual([{ ...accessory, quantity: 3 }]);
  });
});

describe("useSaleWizardStore saleTotal", () => {
  beforeEach(() => {
    useSaleWizardStore.getState().reset();
  });

  it("drops a typed total when the accessories change, so step 4 recomputes it", () => {
    useSaleWizardStore.getState().setSaleTotal(2500);
    useSaleWizardStore.getState().addAccessory(accessory);
    expect(useSaleWizardStore.getState().saleTotal).toBeNull();
  });
});
