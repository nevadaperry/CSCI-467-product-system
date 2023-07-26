import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import {
  testEndpointThatCreatesProduct,
  testEndpointThatUpdatesProduct,
} from './endpoints';

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
        return h.response(String(err)).code(500);
      }
    };
  }

  server.route({
    method: 'GET',
    path: '/test-endpoint-that-creates-product',
    handler: wrap(testEndpointThatCreatesProduct),
  });

  server.route({
    method: 'GET',
    path: '/test-endpoint-that-updates-product',
    handler: wrap(testEndpointThatUpdatesProduct),
  });
}
