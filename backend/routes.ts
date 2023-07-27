import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { httpReadFeeSchedule, httpUpdateFeeSchedule } from './db/fee-schedule';
import {
  httpCreateProduct,
  httpDeleteProduct,
  httpReadProduct,
  httpUpdateProduct,
} from './db/product';

export const http = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  internalServerError: 500,
};

export async function addRoutes(server: hapi.Server, db: pg.Pool) {
  /**
   * Use this to wrap the endpoints so they have access to hapi.ResponseToolkit
   * and pg.Pool
   */
  function wrap(
    endpoint: (
      request: hapi.Request,
      h: hapi.ResponseToolkit,
      db: pg.Pool
    ) => Promise<hapi.ResponseObject>
  ) {
    return async (request: hapi.Request, h: hapi.ResponseToolkit) => {
      try {
        return await endpoint(request, h, db);
      } catch (err: any) {
        // If the endpoint throws an exception, this allows the user to see it
        return h.response(String(err)).code(http.internalServerError);
      }
    };
  }

  server.route({
    method: 'POST',
    path: '/product',
    handler: wrap(httpCreateProduct),
  });
  server.route({
    method: 'GET',
    path: '/product/{id}',
    handler: wrap(httpReadProduct),
  });
  server.route({
    method: 'PUT',
    path: '/product/{id}',
    handler: wrap(httpUpdateProduct),
  });
  server.route({
    method: 'DELETE',
    path: '/product/{id}',
    handler: wrap(httpDeleteProduct),
  });

  server.route({
    method: 'POST',
    path: '/customer',
    handler: wrap(httpCreateCustomer),
  });
  server.route({
    method: 'GET',
    path: '/customer/{id}',
    handler: wrap(httpReadCustomer),
  });
  server.route({
    method: 'PUT',
    path: '/customer/{id}',
    handler: wrap(httpUpdateCustomer),
  });
  server.route({
    method: 'DELETE',
    path: '/customer/{id}',
    handler: wrap(httpDeleteCustomer),
  });

  server.route({
    method: 'POST',
    path: '/order',
    handler: wrap(httpCreateOrder),
  });
  server.route({
    method: 'GET',
    path: '/order/{id}',
    handler: wrap(httpReadOrder),
  });
  server.route({
    method: 'PUT',
    path: '/order/{id}',
    handler: wrap(httpUpdateOrder),
  });
  server.route({
    method: 'DELETE',
    path: '/order/{id}',
    handler: wrap(httpDeleteOrder),
  });

  server.route({
    method: 'GET',
    path: '/fee-schedule',
    handler: wrap(httpReadFeeSchedule),
  });
  server.route({
    method: 'PUT',
    path: '/fee-schedule',
    handler: wrap(httpUpdateFeeSchedule),
  });
}
