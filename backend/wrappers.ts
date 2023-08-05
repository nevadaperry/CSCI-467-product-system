import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { CreateResult, UpdateResult, DeleteResult } from '../shared/resource';

const http = {
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

function handleEndpointError(h: hapi.ResponseToolkit, e: any) {
  // If an endpoint throws an exception, this allows the user to see it
  return h.response(String(e)).code(http.internalServerError);
}

export function generateWrappers(db: pg.Pool) {
  return {
    wrapCreate: function <ResourceType>(
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
    },

    wrapRead: function <ResourceType>(
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
    },

    wrapUpdate: function <ResourceType>(
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
          const result = await endpoint(
            db,
            request.params.id,
            existing,
            update
          );
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
    },

    wrapDelete: function <ResourceType>(
      endpoint: (
        db: pg.Pool,
        id: number,
        existing: ResourceType
      ) => Promise<DeleteResult>
    ) {
      return async function (request: hapi.Request, h: hapi.ResponseToolkit) {
        try {
          const result = await endpoint(
            db,
            request.params.id,
            request.payload as ResourceType
          );
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
    },

    wrapList: function <FilterType, ResourceType>(
      endpoint: (db: pg.Pool, filters: FilterType) => Promise<ResourceType[]>
    ) {
      return async function (request: hapi.Request, h: hapi.ResponseToolkit) {
        try {
          const result = await endpoint(db, request.query as FilterType);
          if (!result) {
            return h
              .response(`Didn't receive any response from search`)
              .code(http.internalServerError);
          }
          return h.response(result);
        } catch (e: any) {
          return handleEndpointError(h, e);
        }
      };
    },
  };
}
