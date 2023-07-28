import axios, { AxiosResponse } from 'axios';
import {
  CreateResult,
  Customer,
  CustomerFilters,
  FeeSchedule,
  Order,
  OrderFilters,
  Product,
  ProductFilters,
  UpdateResult,
} from '../../structures/resource';

const apiUrl = {
  development: 'http://localhost:3001',
  test: 'http://localhost:3001',
  production: 'https://product-system.onrender.com',
}[process.env.NODE_ENV!];
if (!apiUrl) {
  throw new Error(`Unexpected NODE_ENV: ${process.env.NODE_ENV}`);
}

function handleApiResponse(response: AxiosResponse) {
  return response.data;
}

export async function createProduct(product: Product) {
  return handleApiResponse(
    await axios.post<CreateResult>(`${apiUrl}/product`, product)
  );
}
export async function readProduct(id: number) {
  return handleApiResponse(await axios.get<Product>(`${apiUrl}/product/${id}`));
}
export async function updateProduct(
  id: number,
  existing: Product,
  update: Product
) {
  return handleApiResponse(
    await axios.put<UpdateResult>(`${apiUrl}/product/${id}`, {
      existing,
      update,
    })
  );
}
export async function deleteProduct(id: number, existing: Product) {
  return await updateProduct(id, existing, { ...existing, deleted: true });
}
export async function listProducts(filters: ProductFilters) {
  return handleApiResponse(
    await axios.get<Product[]>(`${apiUrl}/product`, { params: filters })
  );
}

export async function createCustomer(customer: Customer) {
  return handleApiResponse(
    await axios.post<CreateResult>(`${apiUrl}/customer`, customer)
  );
}
export async function readCustomer(id: number) {
  return handleApiResponse(
    await axios.get<UpdateResult>(`${apiUrl}/customer/${id}`)
  );
}
export async function updateCustomer(
  id: number,
  existing: Customer,
  update: Customer
) {
  return handleApiResponse(
    await axios.put<UpdateResult>(`${apiUrl}/customer/${id}`, {
      existing,
      update,
    })
  );
}
export async function deleteCustomer(id: number, existing: Customer) {
  return await updateCustomer(id, existing, { ...existing, deleted: true });
}
export async function listCustomers(filters: CustomerFilters) {
  return handleApiResponse(
    await axios.get<Customer[]>(`${apiUrl}/customer`, {
      params: filters,
    })
  );
}

export async function createOrder(order: Order) {
  return handleApiResponse(
    await axios.post<CreateResult>(`${apiUrl}/order`, order)
  );
}
export async function readOrder(id: number) {
  return handleApiResponse(await axios.get<Order>(`${apiUrl}/order/${id}`));
}
export async function updateOrder(id: number, existing: Order, update: Order) {
  return handleApiResponse(
    await axios.put<UpdateResult>(`${apiUrl}/order/${id}`, {
      existing,
      update,
    })
  );
}
export async function deleteOrder(id: number, existing: Order) {
  return await updateOrder(id, existing, { ...existing, deleted: true });
}
export async function listOrders(filters: OrderFilters) {
  return handleApiResponse(
    await axios.get<Order[]>(`${apiUrl}/order`, {
      params: filters,
    })
  );
}

export async function readFeeSchedule() {
  return handleApiResponse(
    await axios.get<FeeSchedule>(`${apiUrl}/fee-schedule`)
  );
}
export async function updateFeeSchedule(
  existing: FeeSchedule,
  update: FeeSchedule
) {
  return handleApiResponse(
    await axios.put<UpdateResult>(`${apiUrl}/fee-schedule`, {
      existing,
      update,
    })
  );
}