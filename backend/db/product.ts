import * as pg from 'pg';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  Product,
  ProductFilters,
  UpdateResult,
} from '../../structures/resource';

export async function createProduct(db: pg.Pool, product: Product) {
  const {
    rows: [result],
  } = await db.query<CreateResult>(SQL`
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
      part_number,
      description,
      weight,
      picture_url,
      price,
      quantity
    FROM latest
    WHERE deleted = false
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
      ${update.part_number},
      ${update.description},
      ${update.weight},
      ${update.picture_url},
      ${update.price},
      ${update.quantity},
      ${update.deleted},
    FROM (
      SELECT *
      FROM product_state
      WHERE product_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    WHERE latest.part_number = ${existing.part_number}
      AND latest.description = ${existing.description}
      AND latest.weight = ${existing.weight}
      AND latest.picture_url = ${existing.picture_url}
      AND latest.price = ${existing.price}
      AND latest.quantity = ${existing.quantity}
      AND latest.deleted = ${existing.deleted}
    RETURNING true AS success
  `);
  return result;
}

export async function listProducts(db: pg.Pool, _filters: ProductFilters) {
  const { rows: products } = await db.query<Product>(SQL`
    WITH latest AS (
      SELECT DISTINCT ON (product_id)
        *
      FROM product_state
      ORDER BY product_id, timestamp DESC
    )
    SELECT
      part_number,
      description,
      weight,
      picture_url,
      price,
      quantity
    FROM latest
    WHERE deleted = false
  `);
  return products;
}

