import * as pg from 'pg';
import SQL from 'pg-template-tag';
import { Product, ProductUpdate } from '../../structures/resource';

export async function createProduct(db: pg.Pool, product: Product) {
  const {
    rows: [row],
  } = await db.query<{ product_id: number }>(SQL`
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

  return row.product_id;
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

export async function updateProduct(
  db: pg.Pool,
  update: ProductUpdate,
  existing: Product
) {
  const {
    rows: [row],
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
      ${update.product_id},
      ${update.part_number},
      ${update.description},
      ${update.weight},
      ${update.picture_url},
      ${update.price},
      ${update.quantity}
    FROM (
      SELECT *
      FROM product_state
      WHERE product_id = ${update.product_id}
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

  return row?.success;
}

export async function deleteProduct(db: pg.Pool, id: number) {
  const {
    rows: [row],
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

  return row?.success;
}
