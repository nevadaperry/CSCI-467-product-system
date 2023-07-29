import * as mysql from 'mysql';
import * as pg from 'pg';
import { promisify } from 'node:util';
import { createProduct } from '../db/product';
import { readWatermark, updateWatermark } from '../db/watermark';

export async function pullLegacyData(db: pg.Pool) {
  console.log('Running job to pull new data from the legacy db.');

  const legacyDb = mysql.createConnection({
    host: 'blitz.cs.niu.edu',
    user: 'student',
    password: 'student',
  });
  await promisify(legacyDb.connect).bind(legacyDb)();

  const watermark = (await readWatermark(db)) ?? { legacy_pkey: 0 };
  const newProducts = (await promisify(legacyDb.query).bind(legacyDb)(`
    SELECT
      number,
      description,
      price,
      weight,
      pictureURL AS picture_url
    FROM csci467.parts
    WHERE number > ${watermark.legacy_pkey}
    ORDER BY number ASC
  `)) as {
    number: any;
    description: any;
    price: any;
    weight: any;
    picture_url: any;
  }[];

  for (const newProduct of newProducts) {
    try {
      await createProduct(db, {
        part_number: newProduct.number,
        description: newProduct.description,
        weight: newProduct.weight,
        picture_url: newProduct.picture_url,
        price: newProduct.price,
        quantity: 0,
      });
    } catch (e) {
      console.warn(`Error from createProduct in pullLegacyData: `, e);
    }
  }

  if (newProducts.length > 0) {
    updateWatermark(db, {
      legacy_pkey: newProducts
        .map((product) => +product.number)
        .sort()
        .reverse()[0],
    });
  }

  console.log(
    `Retrieved ${newProducts.length} new products and added them to the db.`
  );
}
