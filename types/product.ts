export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  name: string;
  extra_price: number;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  type: "select" | "multi";
  values: ProductOptionValue[];
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  options?: ProductOption[];
}
