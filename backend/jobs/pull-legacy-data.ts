import * as mysql from 'mysql';
import * as pg from 'pg';
import { promisify } from 'node:util';
import { connectToPostgres } from '../server';
import { Product } from '../../shared/resource';

const legacyDb = mysql.createConnection({
  host: 'blitz.cs.niu.edu',
  user: 'student',
  password: 'student',
});
await promisify(legacyDb.connect).bind(legacyDb)();

const mainDb = await connectToPostgres();
const {
  rows: [row],
} = await mainDb.query<{ legacy_pkey: number }>(`
  SELECT legacy_pkey
  FROM watermark_state
  ORDER BY timestamp DESC
  LIMIT 1
`);
const watermark = row?.legacy_pkey ?? 0;

const newProducts = (await promisify(legacyDb.query).bind(legacyDb)(`
  USE csci467;
  SELECT
    number,
    description,
    price,
    weight,
    "pictureURL"
  FROM parts
  WHERE number > ${watermark}
`)) as {
  number: number;
  description: string;
  price: number;
  weight: number;
  pictureURL: string;
}[];

for (const newProduct of newProducts) {
  const {
    number: part_number,
    description,
    price,
    weight,
    pictureURL: picture_url,
  } = newProduct;

  const result = await upsertProduct(mainDb, {
    part_number,
    description,
    weight,
    picture_url,
    price,
    quantity: 0,
    deleted: false,
  });
  if (!result) {
    throw new Error(`Failed to create`);
  }
}

await mainDb.query(`
  UPDATE 
  SET
`);

/**
 * Blind upsert, only intended for use in this job. Because it is idempotent,
 * we
 */
async function upsertProduct(db: pg.Pool, product: Product) {
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
    RETURNING new_product.id
  `);
  return result;
}
