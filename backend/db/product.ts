import * as pg from 'pg';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  DeleteResult,
  Product,
  ProductFilters,
  UpdateResult,
} from '../../shared/resource';

export async function createProduct(db: pg.Pool, product: Product) {
  const {
    rows: [result],
  } = await db.query<CreateResult<Product>>(SQL`
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
    RETURNING product_id AS id
  `);
  return result;
}

/**
 * Only for backend use
 */
export async function upsertProduct(db: pg.Pool, product: Product) {
  const {
    rows: [result],
  } = await db.query<CreateResult<Product>>(SQL`
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
    ON CONFLICT (part_number) WHERE is_latest DO UPDATE SET
      description = excluded.description,
      weight = excluded.weight,
      picture_url = excluded.picture_url,
      price = excluded.price
      -- (Don't change the inventory quantity)
    RETURNING product_id AS id
  `);
  return result;
}

export async function readProduct(db: pg.Pool, id: number) {
  const {
    rows: [product],
  } = await db.query<Product>(SQL`
    SELECT
      product_id AS id,
      part_number,
      description,
      weight,
      picture_url,
      price,
      quantity
    FROM product_state
    WHERE product_id = ${id}
      AND is_latest = true
      AND deleted = false
  `);
  return product;
}

export async function updateProduct(
  db: pg.Pool,
  id: number,
  existing: Product,
  update: Product
) {
  const {
    rows: [result],
  } = await db.query<UpdateResult>(SQL`
    WITH resource AS (
      SELECT true AS exists
      FROM product_state
      WHERE product_id = ${id}
        AND is_latest = true
        AND deleted = false
    ), unmarked AS (
      UPDATE product_state
      SET is_latest = false
      WHERE product_id = ${id}
        AND is_latest = true
        AND deleted = false
        AND part_number = ${existing.part_number}
        AND description = ${existing.description}
        AND weight = ${existing.weight}
        AND picture_url = ${existing.picture_url}
        AND price = ${existing.price}
        AND quantity = ${existing.quantity}
      RETURNING true AS success
    ), updated AS (
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
        ${id},
        ${update.part_number},
        ${update.description},
        ${update.weight},
        ${update.picture_url},
        ${update.price},
        ${update.quantity}
      FROM unmarked
      RETURNING true AS success
    )
    SELECT
      coalesce(resource.exists, false) as exists,
      coalesce(updated.success, false) as success
    FROM (SELECT) dummy_row
    LEFT JOIN resource ON TRUE
    LEFT JOIN unmarked ON TRUE
    LEFT JOIN updated ON TRUE
  `);
  return result;
}

export async function deleteProduct(
  db: pg.Pool,
  id: number,
  existing: Product
) {
  const {
    rows: [result],
  } = await db.query<DeleteResult>(SQL`
    WITH resource AS (
      SELECT true AS exists
      FROM product_state
      WHERE product_id = ${id}
        AND is_latest = true
        AND deleted = false
    ), unmarked AS (
      UPDATE product_state
      SET is_latest = false
      WHERE product_id = ${id}
        AND is_latest = true
        AND deleted = false
        AND part_number = ${existing.part_number}
        AND description = ${existing.description}
        AND weight = ${existing.weight}
        AND picture_url = ${existing.picture_url}
        AND price = ${existing.price}
        AND quantity = ${existing.quantity}
      RETURNING true AS success
    ), deleted AS (
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
        ${id},
        ${existing.part_number},
        ${existing.description},
        ${existing.weight},
        ${existing.picture_url},
        ${existing.price},
        ${existing.quantity},
        true
      FROM unmarked
      RETURNING true AS success
    )
    SELECT
      coalesce(resource.exists, false) as exists,
      coalesce(updated.success, false) as success
    FROM (SELECT) dummy_row
    LEFT JOIN resource ON TRUE
    LEFT JOIN unmarked ON TRUE
    LEFT JOIN updated ON TRUE
  `);
  return result;
}

export async function listProducts(db: pg.Pool, filters: ProductFilters) {
  console.log(JSON.stringify(filters));
  const { rows: products } = await db.query<Product>(SQL`
    SELECT
      product_id AS id,
      part_number,
      description,
      weight,
      picture_url,
      price,
      quantity
    FROM product_state
    WHERE is_latest = true
      AND deleted = false
      AND part_number::text ilike ${`%${filters.id ?? ''}%`}::text
      AND description::text ilike ${`%${filters.description ?? ''}%`}::text
  `);
  return products;
}
