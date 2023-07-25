import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { ProductUpdate } from '../data/resource';
import SQL from 'pg-template-tag';

export async function someTestEndpoint(
  request: hapi.Request,
  h: hapi.ResponseToolkit,
  db: pg.Pool
): Promise<hapi.ResponseObject> {
  return await updateProduct(h, db, {
    product_id: 4,
    part_number: 7,
    description: 'some description',
    weight: 44.33,
    picture_url: 'http://example.com',
    price: 55.66,
    quantity: 8,
  });
}

export async function updateProduct(
  h: hapi.ResponseToolkit,
  db: pg.Pool,
  params: ProductUpdate
) {
  const { rows } = await db.query(SQL`
    INSERT INTO product_state (
      product_id,
      part_number,
      description,
      weight,
      picture_url,
      price,
      quantity
    )
    SELECT
      ${params.product_id},
      ${params.part_number},
      ${params.description},
      ${params.weight},
      ${params.picture_url},
      ${params.price},
      ${params.quantity}
    FROM (
      SELECT *
      FROM product_state
      WHERE product_id = ${params.product_id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    WHERE latest.part_number = ${params.part_number}
      AND latest.description = ${params.description}
      AND latest.weight = ${params.weight}
      AND latest.picture_url = ${params.picture_url}
      AND latest.price = ${params.price}
      AND latest.quantity = ${params.quantity}
    RETURNING id
  `);

  if (!rows[0]?.id) {
    return h
      .response(
        `Product has changed since the page was loaded. Please reload and try again.`
      )
      .code(409);
  }

  return h.response('Updated successfully.').code(204);
}
