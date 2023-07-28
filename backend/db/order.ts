import * as pg from 'pg';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  Order,
  OrderFilters,
  UpdateResult,
} from '../../structures/resource';

export async function createOrder(db: pg.Pool, order: Order) {
  const {
    rows: [result],
  } = await db.query<CreateResult>(SQL`
    WITH stats1 AS (
      SELECT
        coalesce(sum(product.price * line_item.quantity), 0) as subtotal,
        coalesce(sum(product.weight * line_item.quantity), 0) as total_weight
      FROM jsonb_to_recordset(${JSON.stringify(
        order.line_items
      )}) AS line_item (
        product_id bigint,
        quantity bigint
      )
      JOIN product ON line_item.product_id = product.id
    ), stats2 AS (
      SELECT
        stats1.subtotal + weight_bracket_of_order.fee AS total_price
      FROM stats1
      CROSS JOIN (
        SELECT id
        FROM fee_schedule_state
        ORDER BY timestamp DESC
        LIMIT 1
      ) fee_schedule_state_latest
      CROSS JOIN LATERAL (
        SELECT wb.fee
        FROM weight_bracket wb
        CROSS JOIN fee_schedule_state_latest fssl
        WHERE wb.fee_schedule_state_id = fssl.id
          AND wb.lower_bound < stats1.total_weight
        ORDER BY wb.lower_bound ASC
        LIMIT 1
      ) weight_bracket_of_order
    ), new_order AS (
      INSERT INTO "order" DEFAULT VALUES
      RETURNING id
    ), new_order_state AS (
      INSERT INTO order_state (
        order_id,
        auth_number,
        cc_last_four,
        shipping_address,
        status,
        total_price
      )
      SELECT
        new_order.id,
        ${order.auth_number},
        ${order.cc_last_four},
        ${order.shipping_address},
        ${order.status},
        stats2.total_price
      FROM new_order
      CROSS JOIN stats2
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
      FROM jsonb_to_recordset(${JSON.stringify(order.line_items)}) AS line_item
      (
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
  return result;
}

export async function readOrder(db: pg.Pool, id: number) {
  const {
    rows: [order],
  } = await db.query<Order>(SQL`
    WITH latest_order_state AS (
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
      coalesce(line_items, array[]::jsonb) as line_items
    FROM latest_order_state
    LEFT JOIN LATERAL (
      SELECT
        jsonb_agg(jsonb_build_object(
          'product_id', osli.product_id,
          'quantity', osli.quantity
        )) AS line_items
      FROM order_state_line_item osli
      WHERE osli.order_state_id = latest_order_state.id
    ) line_item_agg ON TRUE
    WHERE deleted = false
  `);
  return order;
}

export async function updateOrder(
  db: pg.Pool,
  id: number,
  existing: Order,
  update: Order
) {
  const {
    rows: [result],
  } = await db.query<UpdateResult>(SQL`
    WITH stats1 AS (
      SELECT
        coalesce(sum(
          product.price * line_item.quantity
        ), 0) as subtotal,
        coalesce(sum(
          product.weight * line_item.quantity
        ), 0) as total_weight
      FROM jsonb_to_recordset(${JSON.stringify(update.line_items)}) AS line_item
        (
          product_id bigint,
          quantity bigint
        )
      JOIN product ON line_item.product_id = product.id
    ), stats2 AS (
      SELECT
        stats1.subtotal + weight_bracket_of_order.fee AS total_price
      FROM stats1
      CROSS JOIN (
        SELECT id
        FROM fee_schedule_state
        ORDER BY timestamp DESC
        LIMIT 1
      ) existing_fee_schedule_state
      CROSS JOIN LATERAL (
        SELECT wb.fee
        FROM weight_bracket wb
        CROSS JOIN existing_fee_schedule_state efss
        WHERE wb.fee_schedule_state_id = efss.id
          AND wb.lower_bound < stats1.total_weight
        ORDER BY wb.lower_bound ASC
        LIMIT 1
      ) weight_bracket_of_order
    ), existing_order_state AS (
      SELECT *
      FROM order_state
      WHERE order_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 1
    ), new_order_state AS (
      INSERT INTO order_state (
        order_id,
        auth_number,
        cc_last_four,
        shipping_address,
        status,
        total_price,
        deleted
      )
      SELECT
        ${id},
        ${update.auth_number},
        ${update.cc_last_four},
        ${update.shipping_address},
        ${update.status},
        ${update.deleted},
        stats2.total_price
      FROM existing_order_state existing
      CROSS JOIN stats2
      -- Ideally, a subquery here would validate the TS variable "existing"
      -- against the order_state_line_items associated with SQL "existing"
      WHERE existing.auth_number = ${existing.auth_number}
        AND existing.cc_last_four = ${existing.cc_last_four}
        AND existing.shipping_address = ${existing.shipping_address}
        AND existing.status = ${existing.status}
        AND existing.deleted = ${existing.deleted}
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
      FROM jsonb_to_recordset(${JSON.stringify(update.line_items)}) AS line_item
      (
        product_id bigint,
        quantity bigint
      )
      CROSS JOIN new_order_state
      RETURNING true AS success
    )
    SELECT nos.success AND nosli.success AS success
    FROM new_order_state nos
    CROSS JOIN new_order_state_line_item nosli
  `);
  return result;
}

export async function listOrders(db: pg.Pool, _filters: OrderFilters) {
  // TODO(nevada): Implement filtering
  const { rows: orders } = await db.query<Order>(SQL`
    WITH latest AS (
      SELECT DISTINCT ON (order_id)
        *
      FROM order_state
      ORDER BY timestamp DESC
    )
    SELECT
      auth_number,
      cc_last_four,
      shipping_address,
      status,
      line_items
    FROM latest
    LEFT JOIN LATERAL (
      SELECT
        coalesce(jsonb_agg(jsonb_build_object(
          'product_id', osli.product_id,
          'quantity', osli.quantity
        )), array[]::jsonb) AS line_items
      FROM order_state_line_item osli
      WHERE osli.order_state_id = latest.id
    ) line_item_agg ON TRUE
    WHERE deleted = false
  `);
  return orders;
}
