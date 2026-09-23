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
  salePrice: number;
  setCustomer: (customer: WizardCustomer) => void;
  setProduct: (product: WizardProduct) => void;
  skipProduct: () => void;
  addAccessory: (accessory: WizardAccessory) => void;
  updateAccessoryQuantity: (accessoryId: string, quantity: number) => void;
  removeAccessory: (accessoryId: string) => void;
  setDetails: (details: { saleChannel: string; sellerId: string; paymentMethod: string; installments: number }) => void;
  setSalePrice: (salePrice: number) => void;
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
  salePrice: 0,
};

export const useSaleWizardStore = create<SaleWizardState>((set) => ({
  ...initialState,
  setCustomer: (customer) => set({ customer }),
  setProduct: (product) => set({ product, productSkipped: false, salePrice: product?.finalPrice ?? product?.suggestedPrice ?? 0 }),
  skipProduct: () => set({ product: null, productSkipped: true }),
  addAccessory: (accessory) =>
    set((state) => ({
      accessories: state.accessories.some((a) => a.accessoryId === accessory.accessoryId)
        ? state.accessories
        : [...state.accessories, accessory],
    })),
  updateAccessoryQuantity: (accessoryId, quantity) =>
    set((state) => ({
      accessories: state.accessories.map((a) => (a.accessoryId === accessoryId ? { ...a, quantity } : a)),
    })),
  removeAccessory: (accessoryId) =>
    set((state) => ({ accessories: state.accessories.filter((a) => a.accessoryId !== accessoryId) })),
  setDetails: (details) => set(details),
  setSalePrice: (salePrice) => set({ salePrice }),
  reset: () => set(initialState),
}));
