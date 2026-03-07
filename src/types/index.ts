// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  sale_price?: number;
  imageUrl: string | string[];
  image_url?: string;
  quantity: number;
  expectedRestockDate?: string;
  allowPreOrder?: boolean;
  brand?: { _id: string; name: string } | string;
  category?: { _id: string; name: string } | string;
  is_featured?: boolean;
  description?: string;
  reviews?: number;
  comments?: unknown[];
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export type PreOrderType = 'OUT_OF_STOCK' | 'COMING_SOON';
export type PaymentOption = 'PAY_NOW' | 'PAY_LATER';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  image_url?: string;
  image?: string;
  quantity: number;
  availableStock: number;
  isPreOrder?: boolean;
  preOrderType?: PreOrderType;
  paymentOption?: PaymentOption;
  releaseDate?: string;
  addedAt?: string;
}

export interface PreOrderOptions {
  quantity: number;
  preOrderType: PreOrderType;
  paymentOption: PaymentOption;
  releaseDate?: string;
}

// ─── Brand ───────────────────────────────────────────────────────────────────

export interface Brand {
  _id: string;
  name: string;
  logoUrl?: string;
  slug?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: { _id: string; name: string } | null;
  brands?: { _id: string; name: string }[];
}

export interface HierarchicalCategory {
  _id: string;
  name: string;
  description?: string;
  brands: { _id: string; name: string }[];
  subcategories: {
    _id: string;
    name: string;
    description?: string;
    brands: { _id: string; name: string }[];
  }[];
}
