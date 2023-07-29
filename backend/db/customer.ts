import * as pg from 'pg';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  Customer,
  CustomerFilters,
  DeleteResult,
  UpdateResult,
} from '../../shared/resource';

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
      ${customer.email},
    FROM new_customer
    RETURNING customer_id AS id
  `);
  return result;
}

export async function readCustomer(db: pg.Pool, id: number) {
  const {
    rows: [customer],
  } = await db.query<Customer>(SQL`
    SELECT
      customer_id AS id,
      name,
      email
    FROM customer_state
    WHERE customer_id = ${id}
      AND is_latest = true
      AND deleted = false
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
    WITH resource AS (
      SELECT true AS exists
      FROM customer_state
      WHERE customer_id = ${id}
        AND is_latest = true
        AND deleted = false
    ), unmarked AS (
      UPDATE customer_state
      SET is_latest = false
      WHERE customer_id = ${id}
        AND is_latest = true
        AND deleted = false
        AND name = ${existing.name}
        AND email = ${existing.email}
      RETURNING true AS success
    ), updated AS (
      INSERT INTO customer_state (
        customer_id,
        name,
        email
      )
      SELECT
        ${id},
        ${update.name},
        ${update.email}
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

export async function deleteCustomer(
  db: pg.Pool,
  id: number,
  existing: Customer
) {
  const {
    rows: [result],
  } = await db.query<DeleteResult>(SQL`
    WITH resource AS (
      SELECT true AS exists
      FROM customer_state
      WHERE customer_id = ${id}
        AND is_latest = true
        AND deleted = false
    ), unmarked AS (
      UPDATE customer_state
      SET is_latest = false
      WHERE customer_id = ${id}
        AND is_latest = true
        AND deleted = false
        AND name = ${existing.name}
        AND email = ${existing.email}
      RETURNING true AS success
    ), deleted AS (
      INSERT INTO customer_state (
        customer_id,
        name,
        email,
        deleted
      )
      SELECT
        ${id},
        ${existing.name},
        ${existing.email},
        true
      FROM unmarked
      RETURNING true AS success
    )
    SELECT
      coalesce(resource.exists, false) as exists,
      coalesce(deleted.success, false) as success
    FROM (SELECT) dummy_row
    LEFT JOIN resource ON TRUE
    LEFT JOIN unmarked ON TRUE
    LEFT JOIN deleted ON TRUE
  `);
  return result;
}

export async function listCustomers(db: pg.Pool, _filters: CustomerFilters) {
  const { rows: customers } = await db.query<Customer>(SQL`
    SELECT
      customer_id AS id,
      name,
      email
    FROM customer_state
    WHERE is_latest = true
      AND deleted = false
  `);
  return customers;
}
