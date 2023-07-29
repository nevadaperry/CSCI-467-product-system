export interface CreateResult {
  id: number;
}
export interface UpdateResult {
  exists: boolean;
  success: boolean;
}
export interface DeleteResult {
  exists: boolean;
  success: boolean;
}

export interface Product {
  id?: number;
  part_number: number;
  description: string;
  weight: number;
  picture_url: string;
  price: number;
  quantity: number;
}
export interface ProductFilters {}

export interface Customer {
  id?: number;
  name: string;
  email: string;
}
export interface CustomerFilters {}

export interface OrderLineItem {
  product_id: number;
  quantity: number;
}
export type OrderStatus = 'authorized' | 'shipped';
export interface Order {
  id?: number;
  customer_id: number;
  auth_number: string;
  cc_last_four: string;
  shipping_address: string;
  status: OrderStatus;
  line_items: OrderLineItem[];
  /**
   * This is set by the db when the resource is created.
   */
  date_placed?: Date;
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
