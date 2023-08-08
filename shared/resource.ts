export type CreateResult<T> = {
  id: number;
} & Partial<T>;
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
export interface ProductFilters {
  id?: string;
  description?: string;
}

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
export const orderStatuses = ['authorized', 'shipped'] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export interface Order {
  id?: number;
  shipping_address: string;
  line_items: OrderLineItem[];
  /**
   * Either customer_id or (customer_name and customer_email) must be specified
   * on API create requests. Name and email are returned by API read responses
   * for convenience.
   */
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
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
   * This is calculated by the backend from the prices of products and fee
   * from the fee schedule at the time the order is placed. Returned by API read
   * responses.
   */
  total_price?: number;
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
  date_placed?: string;
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
