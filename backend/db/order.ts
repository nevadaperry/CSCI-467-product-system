import * as pg from 'pg';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  Order,
  OrderFilters,
  UpdateResult,
} from '../../shared/resource';
import axios from 'axios';

function validateOrder(order: Order) {
  if (!order) throw new Error(`Missing entire order`);
  if (!order.customer_id) throw new Error(`Missing customer_id`);
  if (!order.shipping_address) throw new Error(`Missing shipping_address`);
  if ((order.line_items?.length ?? 0) === 0)
    throw new Error(`Missing line_items`);
  if (!order.cc_full?.digits) throw new Error(`Missing cc_full.digits`);
  if (!order.cc_full?.exp) throw new Error(`Missing cc_full.exp`);
  if (!order.cc_full?.cvv) throw new Error(`Missing cc_full.cvv`);
  if (!order.cc_full?.cardholder_name)
    throw new Error(`Missing cc_full.cardholder_name`);
}

export async function createOrder(db: pg.Pool, order: Order) {
  validateOrder(order);

  const {
    rows: [orderMeta],
  } = await db.query<{
    id: number;
    total_price: number;
  }>(SQL`
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
    )
    SELECT
      new_order.id,
      stats_2.total_price
    FROM new_order
    CROSS JOIN stats_1
    CROSS JOIN stats_2
  `);

  const { data: paymentResult } = await axios.post<{
    brand: string;
    authorization: string;
    timeStamp: number;
    _id: string;
  }>(`http://blitz.cs.niu.edu/CreditCard/`, {
    vendor: 'VE762-33',
    trans: orderMeta.id,
    amount: orderMeta.total_price,
    cc: order.cc_full!.digits,
    name: order.cc_full!.cardholder_name,
    exp: order.cc_full!.exp,
  });

  const {
    rows: [finalResult],
  } = await db.query<CreateResult>(SQL`
    WITH new_order_state AS (
      INSERT INTO order_state (
        order_id,
        total_price,
        auth_number,
        cc_last_four,
        shipping_address,
        status,
        date_placed
      )
      VALUES (
        ${orderMeta.id},
        ${orderMeta.total_price},
        ${paymentResult.authorization},
        ${order.cc_full!.digits.slice(-4)},
        ${order.shipping_address},
        'authorized',
        to_timestamp(${paymentResult.timeStamp})
      )
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
    SELECT order_id AS id
    FROM new_order_state
    LEFT JOIN associated_line_item ON TRUE
  `);
  return finalResult;
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
      stats_2.total_price,
      c.name as customer_name,
      c.email as customer_email
    FROM order_state os
    JOIN "order" o ON os.order_id = o.id
    JOIN customer c ON o.customer_id = c.id
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
    WITH stats_1 AS (
      SELECT
        os.order_id,
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
      GROUP BY 1
    ), stats_2 AS (
      SELECT
        stats_1.order_id,
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
    JOIN stats_1 ON stats_1.order_id = o.id
    JOIN stats_2 ON stats_2.order_id = o.id
    WHERE os.is_latest = true
      AND os.deleted = false
  `);
  return orders;
}
