import type { OrderStatus } from "@/lib/constants";

export interface SelectedOption {
  option_name: string;
  value_name: string;
  extra_price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_options: SelectedOption[];
  note: string | null;
}

export interface Order {
  id: string;
  order_code: string;
  status: OrderStatus;
  total_amount: number;
  pickup_name: string | null;
  note: string | null;
  customer_ref: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: SelectedOption[];
  note?: string;
}
