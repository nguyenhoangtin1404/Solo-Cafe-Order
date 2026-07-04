import type { OrderStatus, PaymentMethod } from "@/lib/constants";
import type { BankTransferInfo } from "@/lib/config/bank";

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
  /** UUID, chỉ trả về cho customer lúc đặt hàng — không expose qua dashboard API hay realtime. */
  cancel_token?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  pickup_name: string | null;
  note: string | null;
  customer_ref: string | null;
  cancelled_by: "customer" | "owner" | null;
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
  imageUrl?: string | null;
}

export interface OrderItemSummary {
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_options: SelectedOption[];
  note: string | null;
  image_url?: string | null;
}

export type { BankTransferInfo };

export interface OrderSuccessData {
  order_code: string;
  cancel_token: string; // UUID — stored locally so cancel requests can be authenticated
  total_amount: number;
  payment_method: PaymentMethod;
  wait_estimate: string;
  pickup_name: string | null;
  items: OrderItemSummary[];
  bank_transfer_info: BankTransferInfo | null;
}

