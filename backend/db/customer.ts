import * as pg from 'pg';
import SQL from 'pg-template-tag';
import { Customer, CustomerUpdate } from '../../structures/resource';

export async function createCustomer(db: pg.Pool, customer: Customer) {
  const {
    rows: [row],
  } = await db.query<{ customer_id: number }>(SQL`
    WITH new_customer AS (
      INSERT INTO customer DEFAULT VALUES
      RETURNING id
    )
    INSERT INTO customer_state (
      customer_id,
      name,
      email
    )
    SELECT
      new_customer.id,
      ${customer.name},
      ${customer.email}
    FROM new_customer
    RETURNING customer_id
  `);

  return row?.customer_id;
}

export async function readCustomer(db: pg.Pool, id: number) {
  const {
    rows: [customer],
  } = await db.query<Customer>(SQL`
    WITH latest AS (
      SELECT *
      FROM customer_state
      WHERE customer_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    )
    SELECT
      name,
      email
    FROM latest
    WHERE deleted = false
  `);

  return customer;
}

export async function updateCustomer(
  db: pg.Pool,
  existing: Customer,
  update: CustomerUpdate
) {
  const {
    rows: [row],
  } = await db.query<{ success: boolean }>(SQL`
    INSERT INTO customer_state (
      customer_id,
      name,
      email
    )
    SELECT
      ${update.id},
      ${update.name},
      ${update.email}
    FROM (
      SELECT *
      FROM customer_state
      WHERE customer_id = ${update.id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    WHERE latest.name = ${existing.name}
      AND latest.email = ${existing.email}
    RETURNING true AS success
  `);

  return row?.success;
}

export async function deleteCustomer(db: pg.Pool, id: number) {
  const {
    rows: [row],
  } = await db.query<{ success: boolean }>(SQL`
    INSERT INTO customer_state (
      customer_id,
      name,
      email,
      deleted
    )
    SELECT
      customer_id,
      name,
      email,
      true
    FROM (
      SELECT *
      FROM customer_state
      WHERE customer_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    RETURNING true AS success
  `);

  return row?.success;
}
