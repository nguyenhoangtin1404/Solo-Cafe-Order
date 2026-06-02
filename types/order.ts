import type { OrderStatus, PaymentMethod } from "@/lib/constants";

// DB-facing: shape trả về từ Supabase khi join order_items với options
export interface SelectedOption {
  option_name: string;
  value_name: string;
  extra_price: number;
}

// Cart-facing: lưu cả ID (để submit) lẫn display fields (để render)
export interface CartSelectedOption {
  optionId: string;
  valueId: string;
  optionName: string;
  valueName: string;
  extraPrice: number;
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
  payment_method: PaymentMethod;
  total_amount: number;
  pickup_name: string | null;
  note: string | null;
  customer_ref: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[]; // luôn populated khi fetch — dùng Partial<Order> nếu chưa join
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: CartSelectedOption[]; // default [] khi không có options
  note: string | null; // null = không có note, consistent với validator output và DB
}
