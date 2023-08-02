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
  /**
   * This is returned by API read responses for convenience.
   */
  product?: Product;
}
export type OrderStatus = 'authorized' | 'shipped';
export interface Order {
  id?: number;
  customer_id: number;
  shipping_address: string;
  line_items: OrderLineItem[];
  /**
   * This must be provided by the frontend on create requests.
   */
  cc_full?: {
    digits: string;
    exp: string;
    cvv: string;
    cardholder_name: string;
  };
  /**
   * This is set by the backend to 'authorized' if payment processing
   * succeeds, and returned by API read responses.
   */
  status?: OrderStatus;
  /**
   * This is set by the backend if payment processing succeeds, and returned by
   * API read responses.
   */
  auth_number?: string;
  /**
   * This is returned by API read responses.
   */
  cc_last_four?: string;
  /**
   * This is set by the db when the resource is created, and returned by API
   * read responses for convenience.
   */
  date_placed?: Date;
  /**
   * These properties are returned by API read responses for convenience.
   */
  total_price?: number;
  customer_name?: string;
  customer_email?: string;
}
export interface OrderFilters {
  date_lower_bound?: Date;
  date_upper_bound?: Date;
  status?: OrderStatus;
  price_lower_bound?: number;
  price_upper_bound?: number;
}

export interface WeightBracket {
  lower_bound: number;
  fee: number;
}
export interface FeeSchedule {
  weight_brackets: WeightBracket[];
}

export interface Watermark {
  legacy_pkey: number;
}
