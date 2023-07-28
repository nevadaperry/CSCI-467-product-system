import * as pg from 'pg';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  Customer,
  CustomerFilters,
  UpdateResult,
} from '../../structures/resource';

export async function createCustomer(db: pg.Pool, customer: Customer) {
  const {
    rows: [result],
  } = await db.query<CreateResult>(SQL`
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
  return result;
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
  id: number,
  existing: Customer,
  update: Customer
) {
  const {
    rows: [result],
  } = await db.query<UpdateResult>(SQL`
    INSERT INTO customer_state (
      customer_id,
      name,
      email,
      deleted
    )
    SELECT
      ${id},
      ${update.name},
      ${update.email},
      ${update.deleted}
    FROM (
      SELECT *
      FROM customer_state
      WHERE customer_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    WHERE latest.name = ${existing.name}
      AND latest.email = ${existing.email}
      AND latest.deleted = ${existing.deleted}
    RETURNING true AS success
  `);
  return result;
}

export async function listCustomers(db: pg.Pool, _filters: CustomerFilters) {
  const { rows: customers } = await db.query<Customer>(SQL`
    WITH latest AS (
      SELECT DISTINCT ON (customer_id) *
      FROM customer_state
      ORDER BY timestamp DESC
    )
    SELECT
      name,
      email
    FROM latest
    WHERE deleted = false
  `);
  return customers;
}
