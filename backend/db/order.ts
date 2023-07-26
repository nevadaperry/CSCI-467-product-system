import * as pg from 'pg';
import SQL from 'pg-template-tag';
import { Order, OrderUpdate } from '../../structures/resource';

export async function createOrder(db: pg.Pool, order: Order) {
  const {
    rows: [row],
  } = await db.query<{ order_id: number }>(SQL`
    WITH new_order AS (
      INSERT INTO "order" DEFAULT VALUES
      RETURNING id
    ), new_order_state AS (
      INSERT INTO order_state (
        order_id,
        auth_number,
        cc_last_four,
        shipping_address,
        status
      )
      SELECT
        new_order.id,
        ${order.auth_number},
        ${order.cc_last_four},
        ${order.shipping_address},
        ${order.status}
      FROM new_order
      RETURNING id
    ), new_order_state_line_item AS (
      INSERT INTO order_state_line_item (
        order_state_id,
        product_id,
        quantity
      )
      SELECT
        new_order_state.order_state_id,
        line_item.product_id,
        line_item.quantity
      FROM jsonb_to_recordset(${JSON.stringify(
        order.line_items
      )}) AS line_item (
        product_id bigint,
        quantity bigint
      )
      CROSS JOIN new_order_state
    )
    SELECT new_order.id AS order_id
    FROM new_order
    -- Ensure all chained inserts execute
    CROSS JOIN new_order_state_line_item
  `);

  return row?.order_id;
}

export async function readOrder(db: pg.Pool, id: number) {
  const {
    rows: [order],
  } = await db.query<Order>(SQL`
    WITH latest AS (
      SELECT *
      FROM order_state
      WHERE order_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    )
    SELECT
      auth_number,
      cc_last_four,
      shipping_address,
      status,
      coalesce(line_items, array[]::json[]) as line_items
    FROM latest latest_order_state
    LEFT JOIN LATERAL (
      SELECT
        json_agg(json_build_object(
          'product_id', osli.product_id,
          'quantity', osli.quantity
        )) AS line_items
      FROM latest
      LEFT JOIN order_state_line_item osli
        ON osli.order_state_id = latest_order_state.id
    ) line_item_agg ON TRUE
    WHERE deleted = false
  `);

  return order;
}

export async function updateOrder(
  db: pg.Pool,
  existing: Order,
  update: OrderUpdate
) {
  const {
    rows: [row],
  } = await db.query<{ success: boolean }>(SQL`
    WITH new_order_state AS (
      INSERT INTO order_state (
        order_id,
        auth_number,
        cc_last_four,
        shipping_address,
        status
      )
      SELECT
        ${update.order_id},
        ${update.auth_number},
        ${update.cc_last_four},
        ${update.shipping_address},
        ${update.status}
      FROM (
        SELECT *
        FROM order_state
        WHERE order_id = ${update.order_id}
        ORDER BY timestamp DESC
        LIMIT 1
      ) latest
      -- Ideally, a lateral subquery here would validate "existing.line_items"
      -- against the order_state_line_items associated with "latest"
      WHERE latest.auth_number = ${existing.auth_number}
        AND latest.cc_last_four = ${existing.cc_last_four}
        AND latest.shipping_address = ${existing.shipping_address}
        AND latest.status = ${existing.status}
      RETURNING true AS success
    ), new_order_state_line_item AS (
      INSERT INTO order_state_line_item (
        order_state_id,
        product_id,
        quantity
      )
      SELECT
        new_order_state.order_state_id,
        line_item.product_id,
        line_item.quantity
      FROM jsonb_to_recordset(${JSON.stringify(
        update.line_items
      )}) AS line_item (
        product_id bigint,
        quantity bigint
      )
      CROSS JOIN new_order_state
    )
    SELECT something AS success
    -- TODO
  `);

  return row?.success;
}

/* TODO
export async function deleteOrder(db: pg.Pool, id: number) {
  const {
    rows: [row],
  } = await db.query<{ success: boolean }>(SQL`
    INSERT INTO order_state (
      order_id,
      name,
      email,
      deleted
    )
    SELECT
      order_id,
      name,
      email,
      true
    FROM (
      SELECT *
      FROM order_state
      WHERE order_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    ) latest
    RETURNING true AS success
  `);

  return row?.success;
}
*/
