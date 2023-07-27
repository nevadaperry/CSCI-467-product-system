export interface ProductId {
  id: number;
}
export interface Product {
  part_number: number;
  description: string;
  weight: number;
  picture_url: string;
  price: number;
  quantity: number;
}
export type ProductUpdate = ProductId & Product;

export interface CustomerId {
  id: number;
}
export interface Customer {
  name: string;
  email: string;
}
export type CustomerUpdate = CustomerId & Customer;

export interface OrderLineItem {
  product_id: number;
  quantity: number;
}
export interface OrderId {
  id: number;
}
export interface Order {
  auth_number: string;
  cc_last_four: string;
  shipping_address: string;
  status: 'authorized' | 'shipped';
  line_items: OrderLineItem[];
}
export type OrderUpdate = OrderId & Order;

export interface WeightBracket {
  lower_bound: number;
  fee: number;
}
export interface FeeSchedule {
  weight_brackets: WeightBracket[];
}
