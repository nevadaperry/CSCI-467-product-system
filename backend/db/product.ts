import * as pg from 'pg';
import * as hapi from '@hapi/hapi';
import SQL from 'pg-template-tag';
import { Product, ProductId, ProductUpdate } from '../../structures/resource';
import { http } from '../routes';

export async function createProduct(db: pg.Pool, product: Product) {
  const {
    rows: [result],
  } = await db.query<ProductId>(SQL`
    WITH new_product AS (
      INSERT INTO product DEFAULT VALUES
      RETURNING id
    )
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
      new_product.id,
      ${product.part_number},
      ${product.description},
      ${product.weight},
      ${product.picture_url},
      ${product.price},
      ${product.quantity}
    FROM new_product
    RETURNING product_id
  `);
  return result;
}
export async function httpCreateProduct(
  request: hapi.Request,
  h: hapi.ResponseToolkit,
  db: pg.Pool
): Promise<hapi.ResponseObject> {
  const result = await createProduct(db, request.payload as Product);
  if (!result) {
    return h
      .response(`Unexpected: Missing result from product creation`)
      .code(http.internalServerError);
  }
  return h.response(result);
}

export async function readProduct(db: pg.Pool, id: number) {
  const {
    rows: [product],
  } = await db.query<Product>(SQL`
    WITH latest AS (
      SELECT *
      FROM product_state
      WHERE product_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    )
    SELECT
      name,
      email
    FROM latest
    WHERE deleted = false
  `);
  return product;
}

export async function httpReadProduct(
  request: hapi.Request,
  h: hapi.ResponseToolkit,
  db: pg.Pool
): Promise<hapi.ResponseObject> {
  const product = await readProduct(db, request.params.id);
  if (!product) {
    return h
      .response(`Product with id ${request.params.id} not found.`)
      .code(http.notFound);
  }
  return h.response(product);
}

export async function updateProduct(
  db: pg.Pool,
  params: { existing: Product; update: ProductUpdate }
) {
  const { existing, update } = params;
  const {
    rows: [result],
  } = await db.query<{ success: boolean }>(SQL`
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
      ${update.id},
      ${update.part_number},
      ${update.description},
      ${update.weight},
      ${update.picture_url},
      ${update.price},
      ${update.quantity}
    FROM (
      SELECT *
      FROM product_state
      WHERE product_id = ${update.id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    WHERE latest.part_number = ${existing.part_number}
      AND latest.description = ${existing.description}
      AND latest.weight = ${existing.weight}
      AND latest.picture_url = ${existing.picture_url}
      AND latest.price = ${existing.price}
      AND latest.quantity = ${existing.quantity}
    RETURNING true AS success
  `);
  return result;
}

export async function httpUpdateProduct(
  request: hapi.Request,
  h: hapi.ResponseToolkit,
  db: pg.Pool
): Promise<hapi.ResponseObject> {
  const result = await updateProduct(
    db,
    request.payload as { existing: Product; update: ProductUpdate }
  );
  if (!result) {
    return h
      .response(
        `Product has changed since the page loaded. Your update was not applied. Please reload and try again.`
      )
      .code(http.conflict);
  }
  return h.response(result).code(http.noContent);
}

export async function deleteProduct(db: pg.Pool, id: number) {
  const {
    rows: [result],
  } = await db.query<{ success: boolean }>(SQL`
    INSERT INTO product_state (
      product_id,
      part_number,
      description,
      weight,
      picture_url,
      price,
      quantity,
      deleted
    )
    SELECT
      product_id,
      part_number,
      description,
      weight,
      picture_url,
      price,
      quantity,
      true
    FROM (
      SELECT *
      FROM product_state
      WHERE product_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    RETURNING true AS success
  `);
  return result;
}

export async function httpDeleteProduct(
  request: hapi.Request,
  h: hapi.ResponseToolkit,
  db: pg.Pool
): Promise<hapi.ResponseObject> {
  const result = await deleteProduct(db, request.params.id);
  if (!result) {
    return h
      .response(`Unexpected: Missing response from product deletion`)
      .code(http.internalServerError);
  }
  return h.response().code(http.noContent);
}
