
export type View = 'dashboard' | 'inventory' | 'sales' | 'members' | 'settings';

export interface Product {
  id: string;
  name: string;
  category: string;
  openingStock: number;
  stockBought: number;
  unitPrice: number;
  sellingPrice: number;
  lowStockThreshold?: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  saleDate: string; // ISO string
  totalRevenue: number;
  totalCost: number;
  profit: number;
  soldBy: string;
  costCode?: string;
  appliedOfferId?: string;
  appliedOfferName?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  sex: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  idType: 'Passport' | 'National ID' | 'Driving License' | 'Other';
  idNumber: string;
  membershipFee: number;
  joinDate: string; // ISO string
}

export interface CostCode {
  code: string;
  value: number;
}

export interface SpecialOffer {
  id: string;
  productId: string;
  name: string;
  type: 'BOGO' | 'BULK_DISCOUNT';
  buyQuantity: number;
  getQuantity?: number;
  payForQuantity?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface AppTheme {
    primaryColor: string;
    buttonStyle: 'solid' | 'outline';
}
