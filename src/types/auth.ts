// ==========================================
// 1. Authentication & User Types
// ==========================================

export interface SignUpFormData {
  name: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  name: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  pharmacyName?: string | null;
  phoneNumber?: string | null;
  secondaryPhone?: string | null;
  address?: string | null;
  currencyName?: string | null;
  currencySymbol?: string | null;
  subscriptionActive?: boolean;
  logoUrl?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

export interface UserProfileData {
  name?: string;
  pharmacyName?: string;
  phoneNumber?: string;
  secondaryPhone?: string;
  address?: string;
  currencyName?: string;
  currencySymbol?: string;
  password?: string;
  logoUrl?: string;
  subscriptionActive?: boolean;
}

// ==========================================
// 2. Patient Types
// ==========================================

export interface Patient {
  id: string;
  ptid?: string | null;
  name: string;
  age: number;
  gender: string;
  phoneNumber: string;
  userId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PatientInput {
  name: string;
  age: string | number;
  gender: string;
  phoneNumber: string;
}

export interface PatientActionResponse {
  success: boolean;
  error?: string;
  data?: Patient | Patient[];
}

// ==========================================
// 3. Medicine & Batch Types
// ==========================================

export interface BatchExpiry {
  id: string;
  batchNumber: string;
  unitType: string;
  quantity: number;
  expiryDate: Date | string;
  medicineId?: string;
}

export interface BatchExpiryInput {
  id?: string;
  batchNumber: string;
  unitType: string;
  quantity: string | number;
  expiryDate: string;
}

export interface AddMedicinePayload {
  medicineInfo: {
    name: string;
    company: string;
    type: string;
  };
  counts: {
    noOfBoxes: string | number;
    stripsPerBox: string | number;
    tabletsPerBox: string | number;
    priceOfBox: string | number;
    priceOfStrip: string | number;
    priceOfTablet: string | number;
  };
  lowStock: {
    threshold: string | number;
    unit: string;
  };
  batches: BatchExpiryInput[];
}

export interface Medicine {
  id: string;
  name: string;
  company: string;
  type: string;

  noOfBoxes: number;
  stripsPerBox: number;
  tabletsPerBox: number;
  priceOfBox: number;
  priceOfStrip: number;
  priceOfTablet: number;

  lowStockThreshold: number;
  lowStockUnit: string;

  userId?: string | null;
  batches?: BatchExpiry[];

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface MedicineActionResponse {
  success: boolean;
  error?: string;
  data?: Medicine | Medicine[];
  count?: number;
}

// ==========================================
// 4. Billing & Draft Types
// ==========================================

export type UnitType = "BOX" | "STRIP" | "TABLET";

export interface BillItem {
  id: string;
  billId?: string;
  medicineId?: string | null;
  medicine?: Medicine | null;
  name: string;
  unitType: UnitType | string;
  quantity: number;
  price: number;
  discount: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
}

export interface Bill {
  id: string;
  patientId?: string | null;
  patient?: Patient | null;
  patientName: string;
  grossPrice: number;
  totalDiscount: number;
  netPrice: number;
  paymentMethod: string;
  isCancelled?: boolean;
  cancelRemark?: string | null;
  items: BillItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface DraftBillItem {
  id: string;
  draftBillId?: string;
  medicineId?: string | null;
  name: string;
  unitType: UnitType | string;
  quantity: number;
  price: number;
  discount: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
}

export interface DraftBill {
  id: string;
  patientId?: string | null;
  patientName: string;
  grossPrice: number;
  totalDiscount: number;
  netPrice: number;
  paymentMethod: string;
  items: DraftBillItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface BillItemPayload {
  medicineId: string;
  name: string;
  type: UnitType | string;
  quantity: number;
  price: number;
  discount: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface SaveBillPayload {
  patientId?: string;
  patientName: string;
  grossPrice: number;
  totalDiscount: number;
  netPrice: number;
  paymentMethod: string;
  items: BillItemPayload[];
}

export interface FoundPatient {
  id: string;
  ptid?: string;
  name: string;
  phoneNumber: string;
}

export interface FoundMedicine {
  id: string;
  name: string;
  company: string;
  type: string;
  priceOfBox: number;
  priceOfStrip: number;
  priceOfTablet: number;
  batches: {
    batchNumber: string;
    expiryDate: Date | string;
  }[];
}

export interface BillingActionResponse {
  success: boolean;
  error?: string;
  billId?: string;
  draftId?: string;
  data?: Bill | Bill[] | DraftBill | DraftBill[];
}