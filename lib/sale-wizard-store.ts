import { create } from "zustand";

export type WizardAccessory = {
  accessoryId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
};

export type WizardProduct = {
  id: string;
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

type SaleWizardState = {
  customer: WizardCustomer;
  product: WizardProduct;
  productSkipped: boolean;
  accessories: WizardAccessory[];
  saleChannel: string;
  sellerId: string;
  paymentMethod: string;
  installments: number;
  /** Total typed in step 4; null follows product + accessories automatically. */
  saleTotal: number | null;
  setCustomer: (customer: WizardCustomer) => void;
  setProduct: (product: WizardProduct) => void;
  skipProduct: () => void;
  addAccessory: (accessory: WizardAccessory) => void;
  updateAccessoryQuantity: (accessoryId: string, quantity: number) => void;
  removeAccessory: (accessoryId: string) => void;
  setDetails: (details: { saleChannel: string; sellerId: string; paymentMethod: string; installments: number }) => void;
  setSaleTotal: (saleTotal: number | null) => void;
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
  reset: () => set(initialState),
}));
