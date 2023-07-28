export interface CreateResult {
  id: number;
}
export interface UpdateResult {
  success: true;
}

export interface Product {
  part_number: number;
  description: string;
  weight: number;
  picture_url: string;
  price: number;
  quantity: number;
  deleted: boolean;
}
export interface ProductFilters {}

export interface Customer {
  name: string;
  email: string;
  deleted: boolean;
}
export interface CustomerFilters {}

export interface OrderLineItem {
  product_id: number;
  quantity: number;
}
export type OrderStatus = 'authorized' | 'shipped';
export interface Order {
  auth_number: string;
  cc_last_four: string;
  shipping_address: string;
  status: OrderStatus;
  line_items: OrderLineItem[];
  deleted: boolean;
}
export interface OrderFilters {
  date_lower_bound: Date;
  date_upper_bound: Date;
  status: OrderStatus;
  price_lower_bound: number;
  price_upper_bound: number;
}

export interface WeightBracket {
  lower_bound: number;
  fee: number;
}
export interface FeeSchedule {
  weight_brackets: WeightBracket[];
}
