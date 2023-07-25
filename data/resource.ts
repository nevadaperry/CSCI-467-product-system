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

export interface Order {
  order_id: number;
  line_items: { product_id: number; quantity: number }[];
  auth_number: string;
  status: 'authorized' | 'shipped';
}
export type OrderUpdate = { order_id: number } & Order;
