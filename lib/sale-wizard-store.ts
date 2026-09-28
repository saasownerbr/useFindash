import { create } from "zustand";

import { newServicePart, serviceTotal, type ServicePart, type ServiceStatus } from "@/lib/services";

export type WizardAccessory = {
  accessoryId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** What one unit cost the store, for the CMV shown in the summary. */
  unitCost?: number;
  availableQuantity: number;
};

export type WizardProduct = {
  id: string;
  /** "apple" or "xiaomi": both brands share the products table and sell the same way. */
  brand: string;
  model: string;
  storage: string;
  color: string | null;
  imei: string | null;
  grade: string | null;
  acquisitionCost: number;
  repairCost: number;
  finalPrice: number | null;
  suggestedPrice: number | null;
} | null;

export type WizardCustomer = { id: string; name: string; whatsapp: string } | null;

/** Optional technical-assistance step between accessories and details. */
export type WizardService = {
  enabled: boolean;
  deviceDescription: string;
  /** One of SERVICE_TYPES, or OTHER_SERVICE_TYPE with customServiceType typed in. */
  serviceType: string;
  customServiceType: string;
  parts: ServicePart[];
  laborCost: number;
  notes: string;
  status: ServiceStatus;
};

export function emptyService(): WizardService {
  return {
    enabled: false,
    deviceDescription: "",
    serviceType: "",
    customServiceType: "",
    parts: [newServicePart()],
    laborCost: 0,
    notes: "",
    // Sold and paid in the sale: finished unless the seller says it is still in the bench.
    status: "completed",
  };
}

/** What the service adds to the sale total; 0 while the toggle is off. */
export function wizardServiceTotal(service: WizardService): number {
  return service.enabled ? serviceTotal(service.parts, service.laborCost) : 0;
}

type SaleWizardState = {
  customer: WizardCustomer;
  product: WizardProduct;
  productSkipped: boolean;
  accessories: WizardAccessory[];
  saleChannel: string;
  sellerId: string;
  paymentMethod: string;
  installments: number;
  service: WizardService;
  /** Total typed in step 4; null follows product + accessories + service automatically. */
  saleTotal: number | null;
  setCustomer: (customer: WizardCustomer) => void;
  setProduct: (product: WizardProduct) => void;
  skipProduct: () => void;
  addAccessory: (accessory: WizardAccessory) => void;
  updateAccessoryQuantity: (accessoryId: string, quantity: number) => void;
  removeAccessory: (accessoryId: string) => void;
  setDetails: (details: { saleChannel: string; sellerId: string; paymentMethod: string; installments: number }) => void;
  setSaleTotal: (saleTotal: number | null) => void;
  setService: (service: Partial<WizardService>) => void;
  reset: () => void;
};

const initialState = {
  customer: null as WizardCustomer,
  product: null as WizardProduct,
  productSkipped: false,
  accessories: [] as WizardAccessory[],
  saleChannel: "",
  sellerId: "",
  paymentMethod: "",
  installments: 1,
  saleTotal: null as number | null,
  service: emptyService(),
};

export const useSaleWizardStore = create<SaleWizardState>((set) => ({
  ...initialState,
  setCustomer: (customer) => set({ customer }),
  // Changing what is sold drops a typed total, so step 4 recomputes it.
  setProduct: (product) => set({ product, productSkipped: false, saleTotal: null }),
  skipProduct: () => set({ product: null, productSkipped: true, saleTotal: null }),
  addAccessory: (accessory) =>
    set((state) => {
      const existingIndex = state.accessories.findIndex((a) => a.accessoryId === accessory.accessoryId);
      if (existingIndex === -1) {
        return { accessories: [...state.accessories, accessory], saleTotal: null };
      }
      const updated = [...state.accessories];
      updated[existingIndex] = accessory;
      return { accessories: updated, saleTotal: null };
    }),
  updateAccessoryQuantity: (accessoryId, quantity) =>
    set((state) => ({
      accessories: state.accessories.map((a) => (a.accessoryId === accessoryId ? { ...a, quantity } : a)),
      saleTotal: null,
    })),
  removeAccessory: (accessoryId) =>
    set((state) => ({ accessories: state.accessories.filter((a) => a.accessoryId !== accessoryId), saleTotal: null })),
  setDetails: (details) => set(details),
  setSaleTotal: (saleTotal) => set({ saleTotal }),
  // A change to what the service costs changes the sale value, so a typed total gives way to the new automatic one.
  setService: (service) =>
    set((state) => {
      const changesValue = "enabled" in service || "parts" in service || "laborCost" in service;
      return { service: { ...state.service, ...service }, ...(changesValue ? { saleTotal: null } : {}) };
    }),
  reset: () => set({ ...initialState, service: emptyService() }),
}));
