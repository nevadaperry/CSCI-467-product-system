import * as pg from 'pg';
import { MailtrapClient } from 'mailtrap';
import SQL from 'pg-template-tag';
import {
  CreateResult,
  Order,
  OrderFilters,
  UpdateResult,
  orderStatuses,
} from '../../shared/resource';
import axios from 'axios';
import { upsertCustomer } from './customer';

function validateOrder(order: Order) {
  if (!order) throw new Error(`Missing entire order`);
  if (!order.shipping_address) throw new Error(`Missing shipping_address`);
  if ((order.line_items?.length ?? 0) === 0)
    throw new Error(`Missing line_items`);
  if (!order.cc_full?.digits) throw new Error(`Missing cc_full.digits`);
  if (order.cc_full.digits.match('^[0-9]{4}.[0-9]{4}.[0-9]{4}.[0-9]{4}$')) {
    order.cc_full.digits = `${order.cc_full.digits.slice(
      0,
      4
    )}${order.cc_full.digits.slice(5, 9)}${order.cc_full.digits.slice(
      10,
      14
    )}${order.cc_full.digits.slice(15, 19)}`;
  } else if (order.cc_full.digits.match('^[0-9]{16}$')) {
    // It's fine as is
  } else {
    throw new Error(`Expected XXXX-XXXX-XXXX-XXXX card number`);
  }
  if (!order.cc_full?.exp) throw new Error(`Missing cc_full.exp`);
  if (order.cc_full.exp.match('^[0-9]{2}.[0-9]{2}$')) {
    // Replace MM/YY with MM/YYYY
    order.cc_full.exp = `${order.cc_full.exp.slice(
      0,
      2
    )}/20${order.cc_full.exp.slice(3, 5)}`;
  } else if (order.cc_full.exp.match('^[0-9]{2}/[0-9]{4}$')) {
    // It's fine as-is
  } else {
    throw new Error(`Expected MM/YY or MM/YYYY expiration date`);
  }
  if (!order.cc_full?.cvv) throw new Error(`Missing cc_full.cvv`);
  if (!order.cc_full?.cardholder_name)
    throw new Error(`Missing cc_full.cardholder_name`);
}

export async function createOrder(db: pg.Pool, order: Order) {
  validateOrder(order);

  const customerId = await (async () => {
    if (order.customer_name && order.customer_email) {
      const customer = await upsertCustomer(db, {
        name: order.customer_name,
        email: order.customer_email,
      });
      return customer.id;
    }
    if (order.customer_id) {
      return order.customer_id;
    }
    throw new Error(
      `Missing (customer_id) and (customer_name, customer_email). Need one of the two options.`
    );
  })();

  const {
    rows: [orderMeta],
  } = await db.query<{
    id: number;
    total_price: number;
  }>(SQL`
    WITH new_order AS (
      INSERT INTO "order" (customer_id)
      VALUES (${customerId})
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

  if (!paymentResult.authorization) {
    throw new Error(
      `Our payment processor declined your purchase. Details: ${JSON.stringify(
        paymentResult,
        null,
        2
      )}`
    );
  }

  const {
    rows: [createResult],
  } = await db.query<CreateResult<Order>>(SQL`
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
        to_timestamp(${paymentResult.timeStamp} / 1000.0)
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

  // TODO(nevada): Make this a job enqueue to improve durability
  (async () => {
    try {
      if (!process.env.MAILTRAP_TOKEN) {
        throw new Error(
          `Missing MAILTRAP_TOKEN in createOrder(). Order confirmation email will not be sent.`
        );
      }
      const mailtrapClient = new MailtrapClient({
        endpoint: 'https://send.api.mailtrap.io/',
        token: process.env.MAILTRAP_TOKEN,
      });
      const emailText = `Your order #${orderMeta.id} is confirmed.
Shipping address: ${order.shipping_address}
Date placed: ${new Date()}
Line items: ${(JSON.stringify(order.line_items), null, 2)}
Total price: ${orderMeta.total_price}`;
      await mailtrapClient.send({
        from: {
          email: 'mailtrap@productsystem.store',
          name: 'Product System',
        },
        to: [
          {
            email: order.customer_email!,
          },
        ],
        subject: 'Order confirmed!',
        text: emailText,
      });
    } catch (e) {
      console.error(e);
    }
  })();

  return { ...createResult, auth_number: paymentResult.authorization };
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
        AND os.is_latest = true
        AND os.deleted = false
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
      --stats_2.total_price,
      os.total_price,
      cs.name as customer_name,
      cs.email as customer_email
    FROM order_state os
    JOIN "order" o
      ON os.order_id = o.id
    JOIN customer_state cs
      ON o.customer_id = cs.customer_id
      AND cs.is_latest
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

  if (existing.status === 'authorized' && update.status === 'shipped') {
    // TODO(nevada): Make this a job enqueue to improve durability
    (async () => {
      try {
        if (!process.env.MAILTRAP_TOKEN) {
          throw new Error(
            `Missing MAILTRAP_TOKEN in createOrder(). Order confirmation email will not be sent.`
          );
        }
        const mailtrapClient = new MailtrapClient({
          endpoint: 'https://send.api.mailtrap.io/',
          token: process.env.MAILTRAP_TOKEN,
        });
        const emailText = `Your order #${id} has been shipped!
Shipping address: ${update.shipping_address}
Date placed: ${update.date_placed}
Line items: ${(JSON.stringify(update.line_items), null, 2)}
Total price: ${update.total_price}`;
        await mailtrapClient.send({
          from: {
            email: 'mailtrap@productsystem.store',
            name: 'Product System',
          },
          to: [
            {
              email: update.customer_email!,
            },
          ],
          subject: 'Order shipped!',
          text: emailText,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }

  return result;
}

// TODO(nevada): Write deleteOrder()

export async function listOrders(db: pg.Pool, filters: OrderFilters) {
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
      --stats_2.total_price
      os.total_price,
      cs.name as customer_name,
      cs.email as customer_email
    FROM order_state os
    JOIN "order" o ON os.order_id = o.id
    JOIN stats_1 ON stats_1.order_id = o.id
    JOIN stats_2 ON stats_2.order_id = o.id
    JOIN customer_state cs ON cs.customer_id = o.customer_id
      AND cs.is_latest = true AND cs.deleted = false
    WHERE os.is_latest = true
      AND os.status = ANY(${
        filters.status ? [filters.status] : orderStatuses
      }::order_status[])
      AND os.total_price >= ${filters.price_lower_bound ?? 0}
      AND os.total_price <= ${filters.price_upper_bound ?? 999999999.99}
      AND date_trunc('day', os.date_placed)
        >= date_trunc('day', ${filters.date_lower_bound ?? '1900-01-01'}::date)
      AND date_trunc('day', os.date_placed)
        <= date_trunc('day', ${filters.date_upper_bound ?? '9999-12-31'}::date)
      AND os.deleted = false
    ORDER BY o.id ASC
  `);
  return orders;
}
