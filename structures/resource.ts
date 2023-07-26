export interface Product {
  part_number: number;
  description: string;
  weight: number;
  picture_url: string;
  price: number;
  quantity: number;
}
export type ProductUpdate = { product_id: number } & Product;

export interface Customer {
  name: string;
  email: string;
}
export type CustomerUpdate = { customer_id: number } & Customer;

export interface OrderLineItem {
  product_id: number;
  quantity: number;
}
export interface Order {
  auth_number: string;
  cc_last_four: string;
  shipping_address: string;
  status: 'authorized' | 'shipped';
  line_items: OrderLineItem[];
}
export type OrderUpdate = { order_id: number } & Order;

export interface FeeSchedule {
  weight_brackets: {
    weight_lower_bound: number;
    fee: number;
  }[];
}
