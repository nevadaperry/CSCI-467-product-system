import axios, { AxiosError, AxiosResponse } from 'axios';
import {
  CreateResult,
  Customer,
  CustomerFilters,
  DeleteResult,
  FeeSchedule,
  Order,
  OrderFilters,
  Product,
  ProductFilters,
  UpdateResult,
} from '../../shared/resource';

const BACKEND_PORT_LOCAL_ONLY = 4000;

const apiUrl = {
  development: `http://localhost:${BACKEND_PORT_LOCAL_ONLY}`,
  test: `http://localhost:${BACKEND_PORT_LOCAL_ONLY}`,
  production: 'https://product-system.onrender.com',
}[process.env.NODE_ENV!];
if (!apiUrl) {
  throw new Error(`Unexpected NODE_ENV: ${process.env.NODE_ENV}`);
}

async function handleApiResponse<T>(fn: () => Promise<AxiosResponse<T, any>>) {
  try {
    return (await fn()).data;
  } catch (e: any) {
    const axiosError = e as AxiosError;
    console.log('axiosError:', JSON.stringify(axiosError, null, 2));
    throw new Error(
      `Error from server: ${JSON.stringify(axiosError.response?.data, null, 2)}`
    );
  }
}

export async function createProduct(product: Product) {
  return await handleApiResponse(
    async () =>
      await axios.post<CreateResult<Product>>(`${apiUrl}/product`, product)
  );
}
export async function readProduct(id: number) {
  return await handleApiResponse(
    async () => await axios.get<Product>(`${apiUrl}/product/${id}`)
  );
}
export async function updateProduct(
  id: number,
  existing: Product,
  update: Product
) {
  return await handleApiResponse(
    async () =>
      await axios.put<UpdateResult>(`${apiUrl}/product/${id}`, {
        existing,
        update,
      })
  );
}
export async function deleteProduct(id: number, existing: Product) {
  return await handleApiResponse(
    async () =>
      await axios.put<DeleteResult>(`${apiUrl}/product/${id}/delete`, {
        existing,
      })
  );
}
export async function listProducts(filters: ProductFilters) {
  return await handleApiResponse(
    async () =>
      await axios.get<Product[]>(`${apiUrl}/product-list`, { params: filters })
  );
}

export async function createCustomer(customer: Customer) {
  return await handleApiResponse(
    async () =>
      await axios.post<CreateResult<Customer>>(`${apiUrl}/customer`, customer)
  );
}
export async function readCustomer(id: number) {
  return await handleApiResponse(
    async () => await axios.get<UpdateResult>(`${apiUrl}/customer/${id}`)
  );
}
export async function updateCustomer(
  id: number,
  existing: Customer,
  update: Customer
) {
  return await handleApiResponse(
    async () =>
      await axios.put<UpdateResult>(`${apiUrl}/customer/${id}`, {
        existing,
        update,
      })
  );
}
export async function deleteCustomer(id: number, existing: Customer) {
  return await handleApiResponse(
    async () =>
      await axios.put<DeleteResult>(`${apiUrl}/customer/${id}/delete`, {
        existing,
      })
  );
}
export async function listCustomers(filters: CustomerFilters) {
  return await handleApiResponse(
    async () =>
      await axios.get<Customer[]>(`${apiUrl}/customer-list`, {
        params: filters,
      })
  );
}

export async function createOrder(order: Order) {
  return await handleApiResponse(
    async () => await axios.post<CreateResult<Order>>(`${apiUrl}/order`, order)
  );
}
export async function readOrder(id: number) {
  return await handleApiResponse(
    async () => await axios.get<Order>(`${apiUrl}/order/${id}`)
  );
}
export async function updateOrder(id: number, existing: Order, update: Order) {
  return await handleApiResponse(
    async () =>
      await axios.put<UpdateResult>(`${apiUrl}/order/${id}`, {
        existing,
        update,
      })
  );
}
// TODO(nevada): Write deleteOrder on the backend
/*export async function deleteOrder(id: number, existing: Order) {
  return await handleApiResponse(async () =>
    await axios.put<DeleteResult>(`${apiUrl}/order/${id}/delete`, {
      existing,
    })
  );
}*/
export async function listOrders(filters: OrderFilters) {
  return await handleApiResponse(
    async () =>
      await axios.get<Order[]>(`${apiUrl}/order-list`, {
        params: filters,
      })
  );
}

export async function readFeeSchedule() {
  return await handleApiResponse(
    async () => await axios.get<FeeSchedule>(`${apiUrl}/fee-schedule`)
  );
}
export async function updateFeeSchedule(
  existing: FeeSchedule,
  update: FeeSchedule
) {
  return await handleApiResponse(
    async () =>
      await axios.put<UpdateResult>(`${apiUrl}/fee-schedule`, {
        existing,
        update,
      })
  );
}
