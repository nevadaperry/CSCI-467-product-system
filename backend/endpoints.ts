import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { createProduct, updateProduct } from './db/product';

export async function testEndpointThatCreatesProduct(
  request: hapi.Request,
  h: hapi.ResponseToolkit,
  db: pg.Pool
): Promise<hapi.ResponseObject> {
  const productId = await createProduct(db, {
    part_number: 7,
    description: 'some description',
    weight: 44.33,
    picture_url: 'http://example.com',
    price: 55.66,
    quantity: 8,
  });

  return h
    .response(`Created product; new id ${JSON.stringify(productId)}`)
    .code(201);
}

export async function testEndpointThatUpdatesProduct(
  request: hapi.Request,
  h: hapi.ResponseToolkit,
  db: pg.Pool
): Promise<hapi.ResponseObject> {
  const success = await updateProduct(
    db,
    {
      product_id: -1,
      part_number: 7,
      description: 'some description',
      weight: 44.33,
      picture_url: 'http://example.com',
      price: 55.66,
      quantity: 8,
    },
    {
      part_number: 7,
      description: 'some description',
      weight: 44.33,
      picture_url: 'http://example.com',
      price: 55.66,
      quantity: 8,
    }
  );

  return h.response(`Updated product`).code(204);
}
