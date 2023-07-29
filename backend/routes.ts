import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { readFeeSchedule, updateFeeSchedule } from './db/fee-schedule';
import {
  createProduct,
  listProducts,
  readProduct,
  updateProduct,
  deleteProduct,
} from './db/product';
import {
  createCustomer,
  listCustomers,
  readCustomer,
  updateCustomer,
  deleteCustomer,
} from './db/customer';
import { createOrder, listOrders, readOrder, updateOrder } from './db/order';
import { generateWrappers } from './wrappers';

export async function addRoutes(server: hapi.Server, db: pg.Pool) {
  const routePrefix = '';
  const { wrapCreate, wrapRead, wrapUpdate, wrapDelete, wrapList } =
    generateWrappers(db);

  server.route({
    method: '*',
    path: `${routePrefix}/{any*}`,
    handler: function (request, h) {
      return h.response('Endpoint not found.').code(404);
    },
  });

  server.route({
    method: 'POST',
    path: `${routePrefix}/product`,
    handler: wrapCreate(createProduct),
  });
  server.route({
    method: 'GET',
    path: `${routePrefix}/product/{id}`,
    handler: wrapRead(readProduct),
  });
  server.route({
    method: 'PUT',
    path: `${routePrefix}/product/{id}`,
    handler: wrapUpdate(updateProduct),
  });
  server.route({
    method: 'PUT',
    path: `${routePrefix}/product/{id}/delete`,
    handler: wrapDelete(deleteProduct),
  });
  server.route({
    method: 'GET',
    path: `${routePrefix}/product`,
    handler: wrapList(listProducts),
  });

  server.route({
    method: 'POST',
    path: `${routePrefix}/customer`,
    handler: wrapCreate(createCustomer),
  });
  server.route({
    method: 'GET',
    path: `${routePrefix}/customer/{id}`,
    handler: wrapRead(readCustomer),
  });
  server.route({
    method: 'PUT',
    path: `${routePrefix}/customer/{id}`,
    handler: wrapUpdate(updateCustomer),
  });
  server.route({
    method: 'PUT',
    path: `${routePrefix}/customer/{id}/delete`,
    handler: wrapDelete(deleteCustomer),
  });
  server.route({
    method: 'GET',
    path: `${routePrefix}/customer`,
    handler: wrapList(listCustomers),
  });

  server.route({
    method: 'POST',
    path: `${routePrefix}/order`,
    handler: wrapCreate(createOrder),
  });
  server.route({
    method: 'GET',
    path: `${routePrefix}/order/{id}`,
    handler: wrapRead(readOrder),
  });
  server.route({
    method: 'PUT',
    path: `${routePrefix}/order/{id}`,
    handler: wrapUpdate(updateOrder),
  });
  // TODO(nevada): Write deleteOrder()
  /*server.route({
    method: 'PUT',
    path: `${routePrefix}/order/{id}/delete`,
    handler: wrapDelete(deleteOrder),
  });*/
  server.route({
    method: 'GET',
    path: `${routePrefix}/order`,
    handler: wrapList(listOrders),
  });

  server.route({
    method: 'GET',
    path: `${routePrefix}/fee-schedule`,
    handler: wrapRead(readFeeSchedule),
  });
  server.route({
    method: 'PUT',
    path: `${routePrefix}/fee-schedule`,
    handler: wrapUpdate(updateFeeSchedule),
  });
}
