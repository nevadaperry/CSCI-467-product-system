import * as pg from 'pg';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  Order,
  OrderFilters,
  UpdateResult,
} from '../../shared/resource';

export async function createOrder(db: pg.Pool, order: Order) {
  const {
    rows: [result],
  } = await db.query<CreateResult>(SQL`
    WITH new_order AS (
      INSERT INTO "order" (customer_id)
      VALUES (${order.customer_id})
      RETURNING id
    ), stats_1 AS (
      SELECT
        coalesce(sum(ps.price * line_item.quantity), 0) as subtotal,
        coalesce(sum(ps.weight * line_item.quantity), 0) as total_weight
      FROM new_order
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(order.line_items)})
        AS line_item (
          product_id bigint,
          quantity bigint
        )
      JOIN product_state ps
        ON line_item.product_id = ps.product_id
        AND ps.is_latest = true
        AND ps.deleted = false
    ), stats_2 AS (
      SELECT
        stats_1.subtotal + weight_bracket_of_order.fee AS total_price
      FROM stats_1
      CROSS JOIN LATERAL (
        SELECT wb.fee
        FROM fee_schedule_state fss
        JOIN weight_bracket wb ON wb.fee_schedule_state_id = fss.id
        WHERE fss.is_latest = true
          AND wb.lower_bound < stats_1.total_weight
        ORDER BY wb.lower_bound DESC
        LIMIT 1
      ) weight_bracket_of_order
    ), new_order_state AS (
      INSERT INTO order_state (
        order_id,
        auth_number,
        cc_last_four,
        shipping_address,
        status,
        date_placed,
        total_price
      )
      SELECT
        new_order.id,
        ${order.auth_number},
        ${order.cc_last_four},
        ${order.shipping_address},
        ${order.status},
        now(),
        stats_2.total_price
      FROM new_order
      CROSS JOIN stats_2
      RETURNING id, order_id
    ), associated_line_item AS (
      INSERT INTO order_state_line_item (
        order_state_id,
        product_id,
        quantity
      )
      SELECT
        new_order_state.id,
        line_item.product_id,
        line_item.quantity
      FROM new_order_state
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(order.line_items)})
        AS line_item (
          product_id bigint,
          quantity bigint
        )
      RETURNING true AS success
    )
    SELECT new_order_state.order_id AS id
    FROM new_order
    LEFT JOIN new_order_state ON TRUE
    LEFT JOIN associated_line_item ON TRUE
  `);
  return result;
}

export async function readOrder(db: pg.Pool, id: number) {
  const {
    rows: [order],
  } = await db.query<Order>(SQL`
    WITH stats_1 AS (
      SELECT
        coalesce(jsonb_agg(jsonb_build_object(
          'product_id', osli.product_id,
          'quantity', osli.quantity,
          'product', jsonb_build_object(
            'id', ps.product_id,
            'part_number', ps.part_number,
            'description', ps.description,
            'weight', ps.weight,
            'picture_url', ps.picture_url,
            'price', ps.price,
            'quantity', ps.quantity
          )
        )), '[]'::jsonb) AS line_items,
        coalesce(sum(ps.price * osli.quantity), 0) as subtotal,
        coalesce(sum(ps.weight * osli.quantity), 0) as total_weight
      FROM order_state os
      LEFT JOIN order_state_line_item osli ON osli.order_state_id = os.id
      LEFT JOIN product_state ps
        ON osli.product_id = ps.product_id
        AND ps.is_latest = true
        AND ps.deleted = false
      WHERE os.order_id = ${id}
    ), stats_2 AS (
      SELECT
        stats_1.subtotal + weight_bracket_of_order.fee AS total_price
      FROM stats_1
      CROSS JOIN LATERAL (
        SELECT wb.fee
        FROM fee_schedule_state fss
        JOIN weight_bracket wb ON wb.fee_schedule_state_id = fss.id
        WHERE fss.is_latest = true
          AND wb.lower_bound < stats_1.total_weight
        ORDER BY wb.lower_bound DESC
        LIMIT 1
      ) weight_bracket_of_order
    )
    SELECT
      o.id,
      o.customer_id,
      os.auth_number,
      os.cc_last_four,
      os.shipping_address,
      os.status,
      os.date_placed,
      stats_1.line_items,
      stats_2.total_price
    FROM order_state os
    JOIN "order" o ON os.order_id = o.id
    CROSS JOIN stats_1
    CROSS JOIN stats_2
    WHERE os.order_id = ${id}
      AND os.is_latest = true
      AND os.deleted = false
  `);
  return order;
}

export async function updateOrder(
  db: pg.Pool,
  id: number,
  existing: Order,
  update: Order
) {
  // TODO(nevada): Validate `existing.line_items`
  const {
    rows: [result],
  } = await db.query<UpdateResult>(SQL`
    WITH resource AS (
      SELECT true AS exists
      FROM order_state
      WHERE order_id = ${id}
        AND is_latest = true
        AND deleted = false
    ), unmarked AS (
      UPDATE order_state
      SET is_latest = false
      WHERE order_id = ${id}
        AND is_latest = true
        AND deleted = false
        AND auth_number = ${existing.auth_number}
        AND cc_last_four = ${existing.cc_last_four}
        AND shipping_address = ${existing.shipping_address}
        AND status = ${existing.status}
      RETURNING true AS success
    ), stats_1 AS (
      SELECT
        coalesce(sum(ps.price * line_item.quantity), 0) as subtotal,
        coalesce(sum(ps.weight * line_item.quantity), 0) as total_weight
      FROM unmarked
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(update.line_items)})
        AS line_item (
          product_id bigint,
          quantity bigint
        )
      JOIN product_state
        ON line_item.product_id = ps.product_id
        AND ps.is_latest = true
        AND ps.deleted = false
    ), stats_2 AS (
      SELECT
        stats_1.subtotal + weight_bracket_of_order.fee AS total_price
      FROM stats_1
      CROSS JOIN LATERAL (
        SELECT wb.fee
        FROM fee_schedule_state fss
        JOIN weight_bracket wb ON wb.fee_schedule_state_id = efss.id
        WHERE fss.is_latest = true
          AND fss.deleted = false
          AND wb.lower_bound < stats_1.total_weight
        ORDER BY wb.lower_bound DESC
        LIMIT 1
      ) weight_bracket_of_order
    ), updated_order_state AS (
      INSERT INTO order_state (
        order_id,
        auth_number,
        cc_last_four,
        shipping_address,
        status,
        date_placed,
        total_price
      )
      SELECT
        ${id},
        ${update.auth_number},
        ${update.cc_last_four},
        ${update.shipping_address},
        ${update.status},
        ${update.date_placed},
        stats_2.total_price
      FROM stats_2
      RETURNING true AS success, id
    ), associated_line_item AS (
      INSERT INTO order_state_line_item (
        order_state_id,
        product_id,
        quantity
      )
      SELECT
        updated_order_state.id,
        line_item.product_id,
        line_item.quantity
      FROM updated_order_state
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(update.line_items)})
        AS line_item (
          product_id bigint,
          quantity bigint
        )
      RETURNING true AS success
    )
    SELECT
      coalesce(resource.exists, false) as exists,
      coalesce(updated.success, false) as success
    FROM (SELECT) dummy_row
    LEFT JOIN resource ON TRUE
    LEFT JOIN unmarked ON TRUE
    LEFT JOIN updated_order_state updated ON TRUE
    LEFT JOIN associated_line_item ON TRUE
  `);
  return result;
}

// TODO(nevada): Write deleteOrder()

export async function listOrders(db: pg.Pool, _filters: OrderFilters) {
  // TODO(nevada): Implement filtering
  const { rows: orders } = await db.query<Order>(SQL`
    SELECT
      order_id AS id,
      auth_number,
      cc_last_four,
      shipping_address,
      status,
      date_placed,
      coalesce(line_items, '[]'::jsonb) AS line_items
    FROM order_state
    LEFT JOIN LATERAL (
      SELECT
        jsonb_agg(jsonb_build_object(
          'product_id', osli.product_id,
          'quantity', osli.quantity
        )) AS line_items
      FROM order_state_line_item osli
      WHERE osli.order_state_id = order_state.id
    ) line_item_agg ON TRUE
    WHERE is_latest = true
      AND deleted = false
  `);
  return orders;
}
