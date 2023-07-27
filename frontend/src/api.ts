import axios from 'axios';
import {
  Customer,
  CustomerUpdate,
  FeeSchedule,
  Order,
  OrderUpdate,
  Product,
  ProductId,
  ProductUpdate,
} from '../../structures/resource';

const apiUrl = '/api';

async function createProduct(product: Product) {
  return await axios.post<ProductId>(`${apiUrl}/product`, product);
}
async function readProduct(id: number) {
  return await axios.get<Product>(`${apiUrl}/product/${id}`);
}
async function updateProduct(params: {
  existing: Product;
  update: ProductUpdate;
}) {
  return await axios.put(`${apiUrl}/product`, params);
}
async function deleteProduct(id: number) {
  return await axios.delete(`${apiUrl}/product/${id}`);
}

async function createCustomer(customer: Customer) {
  return await axios.post(`${apiUrl}/customer`, customer);
}
async function readCustomer(id: number) {
  return await axios.get(`${apiUrl}/customer/${id}`);
}
async function updateCustomer(params: {
  existing: Customer;
  update: CustomerUpdate;
}) {
  return await axios.put(`${apiUrl}/customer`, params);
}
async function deleteCustomer(id: number) {
  return await axios.delete(`${apiUrl}/customer/${id}`);
}

async function createOrder(order: Order) {
  return await axios.post(`${apiUrl}/order`, order);
}
async function readOrder(id: number) {
  return await axios.get(`${apiUrl}/order/${id}`);
}
async function updateOrder(params: { existing: Order; update: OrderUpdate }) {
  return await axios.put(`${apiUrl}/order`, params);
}
async function deleteOrder(id: number) {
  return await axios.delete(`${apiUrl}/order/${id}`);
}

async function readFeeSchedule() {
  return await axios.get(`${apiUrl}/fee-schedule`);
}
async function updateFeeSchedule(feeSchedule: FeeSchedule) {
  return await axios.put(`${apiUrl}/fee-schedule`, feeSchedule);
}
