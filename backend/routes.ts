import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { readFeeSchedule, updateFeeSchedule } from './db/fee-schedule';
import {
  createProduct,
  listProducts,
  readProduct,
  updateProduct,
} from './db/product';
import { CreateResult, UpdateResult } from '../structures/resource';
import {
  createCustomer,
  listCustomers,
  readCustomer,
  updateCustomer,
} from './db/customer';
import { createOrder, listOrders, readOrder, updateOrder } from './db/order';

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
  const routePrefix = '';

  function handleEndpointError(h: hapi.ResponseToolkit, e: any) {
    // If an endpoint throws an exception, this allows the user to see it
    return h.response(String(e)).code(http.internalServerError);
  }

  function wrapCreate<ResourceType>(
    endpoint: (db: pg.Pool, payload: ResourceType) => Promise<CreateResult>
  ) {
    return async function (request: hapi.Request, h: hapi.ResponseToolkit) {
      try {
        const result = await endpoint(db, request.payload as ResourceType);
        if (!result) {
          return h
            .response(`Didn't receive result from creating resource.`)
            .code(http.internalServerError);
        }
        return h.response(result);
      } catch (e: any) {
        return handleEndpointError(h, e);
      }
    };
  }
  function wrapRead<ResourceType>(
    endpoint: (db: pg.Pool, id: number) => Promise<ResourceType>
  ) {
    return async function (request: hapi.Request, h: hapi.ResponseToolkit) {
      try {
        const result = await endpoint(db, request.params.id);
        if (!result) {
          return h.response(`Couldn't find resource.`).code(http.notFound);
        }
        return h.response(result);
      } catch (e: any) {
        return handleEndpointError(h, e);
      }
    };
  }
  function wrapUpdate<ResourceType>(
    endpoint: (
      db: pg.Pool,
      id: number,
      existing: ResourceType,
      update: ResourceType
    ) => Promise<UpdateResult>
  ) {
    return async function (request: hapi.Request, h: hapi.ResponseToolkit) {
      try {
        const { existing, update } = request.payload as {
          existing: ResourceType;
          update: ResourceType;
        };
        const result = await endpoint(db, request.params.id, existing, update);
        if (!result) {
          return h
            .response(
              `Resource does not exist or has changed since you last loaded it. Please reload and try again.`
            )
            .code(http.conflict);
        }
        return h.response(result);
      } catch (e: any) {
        return handleEndpointError(h, e);
      }
    };
  }
  function wrapList<FilterType, ResourceType>(
    endpoint: (db: pg.Pool, filters: FilterType) => Promise<ResourceType[]>
  ) {
    return async function (request: hapi.Request, h: hapi.ResponseToolkit) {
      try {
        const result = await endpoint(db, request.params as FilterType);
        if (!result) {
          return h
            .response(`Didn't receive response from search`)
            .code(http.internalServerError);
        }
        return h.response(result);
      } catch (e: any) {
        return handleEndpointError(h, e);
      }
    };
  }

  server.route({
    method: '*',
    path: `${routePrefix}/{any*}`,
    handler: function (request, h) {
      return h.response('Endpoint not found.').code(http.notFound);
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
