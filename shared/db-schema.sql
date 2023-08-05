/*
 * Aim: Our data/transaction model aims to provide these qualities:
 * 
 * 1. Traceability: Each resource contains a full history in the form of states.
 * 2. Atomicity: All CRUD operations are performed as single statements.
 * 3. No race conditions: Update and delete operations validate what the client
 *    believes is the current state before taking action.
 *
 * Limitations: Our create operations are not idempotent. Ideally, we would
 * issue "voucher" ids to each client that they could use to idempotently create
 * resources.
 */

CREATE TABLE product (
  id bigserial PRIMARY KEY
);
CREATE TABLE product_state (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true,
  deleted boolean NOT NULL DEFAULT false
  -- Main fields
  part_number bigint NOT NULL,
  description text NOT NULL,
  weight numeric(11,2) NOT NULL,
  picture_url text NOT NULL,
  price numeric(11,2) NOT NULL,
  quantity bigint NOT NULL
);
CREATE INDEX product_state_product_id_timestamp ON product_state (product_id, timestamp);
CREATE INDEX product_state_product_id_is_latest ON product_state (product_id, is_latest);
CREATE UNIQUE INDEX product_state_part_number__where__is_latest ON product_state (part_number) WHERE is_latest;
-- Only allow one state per product to have is_latest = true
CREATE UNIQUE INDEX product_state_product_id__where__is_latest ON product_state (product_id) WHERE is_latest;



CREATE TABLE customer (
  id bigserial PRIMARY KEY
);
CREATE TABLE customer_state (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true,
  deleted boolean NOT NULL DEFAULT false,
  -- Main fields
  name text NOT NULL,
  email text NOT NULL
);
CREATE INDEX customer_state_customer_id_timestamp ON customer_state (customer_id, timestamp);
CREATE INDEX customer_state_customer_id_is_latest ON customer_state (customer_id, is_latest);
CREATE UNIQUE INDEX customer_state_email__where__is_latest ON customer_state (email) WHERE is_latest;
-- Only allow one state per customer to have is_latest = true
CREATE UNIQUE INDEX customer_state_customer_id__where__is_latest ON customer_state (customer_id) WHERE is_latest;



CREATE TYPE order_status AS ENUM('authorized', 'shipped');
CREATE TABLE "order" (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customer(id) ON DELETE RESTRICT
);
CREATE TABLE order_state (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true,
  deleted boolean NOT NULL DEFAULT false,
  -- Main fields
  auth_number text NOT NULL,
  cc_last_four char(4) NOT NULL,
  shipping_address text NOT NULL,
  status order_status NOT NULL,
  -- Canonically represents total of line items + fee from fee schedule at the
  -- time the order was placed. Total price should never be recomputed in case
  -- the product prices or fee schedule change.
  total_price numeric(11,2) NOT NULL,
  date_placed timestamptz NOT NULL
);
CREATE INDEX order_state_order_id_timestamp ON order_state (order_id, timestamp);
CREATE INDEX order_state_order_id_is_latest ON order_state (order_id, is_latest);
-- Only allow one state per order to have is_latest = true
CREATE UNIQUE INDEX order_state_order_id__where__is_latest ON order_state (order_id) WHERE is_latest;
-- Search filters
CREATE INDEX order_state_is_latest_status ON order_state (is_latest, status);
CREATE INDEX order_state_is_latest_total_price ON order_state (is_latest, total_price);
CREATE INDEX order_state_is_latest_date_placed ON order_state (is_latest, date_placed);

CREATE TABLE order_state_line_item (
  id bigserial PRIMARY KEY,
  order_state_id bigint NOT NULL REFERENCES order_state(id) ON DELETE RESTRICT,
  product_id bigint NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  quantity bigint NOT NULL
);
CREATE INDEX order_state_line_item_order_state_id ON order_state_line_item (order_state_id);



-- This table maintains the existence of a single global "fee schedule"
CREATE TABLE fee_schedule_state (
  id bigserial PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true
);
CREATE INDEX fee_schedule_state_timestamp ON fee_schedule_state (timestamp);
CREATE INDEX fee_schedule_state_is_latest ON fee_schedule_state (is_latest);
-- Only allow one fee_schedule_state to have is_latest = true
CREATE UNIQUE INDEX fee_schedule_state__where__is_latest ON fee_schedule_state (is_latest) WHERE is_latest; 

CREATE TABLE weight_bracket (
  id bigserial PRIMARY KEY,
  fee_schedule_state_id bigint NOT NULL REFERENCES fee_schedule_state(id) ON DELETE RESTRICT,
  lower_bound numeric(11,2) NOT NULL,
  fee numeric(11,2) NOT NULL
);
CREATE UNIQUE INDEX weight_bracket_fee_schedule_state_id_lower_bound ON weight_bracket (fee_schedule_state_id, lower_bound);



-- This table maintains the existence of a single global "watermark"
CREATE TABLE watermark_state (
  id bigserial PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true,
  legacy_pkey bigint NOT NULL
);
CREATE INDEX watermark_state_timestamp ON watermark_state (timestamp);
CREATE INDEX watermark_state_is_latest ON watermark_state (is_latest);
-- Only allow one watermark_state to have is_latest = true
CREATE UNIQUE INDEX watermark_state__where__is_latest ON watermark_state (is_latest) WHERE is_latest;
