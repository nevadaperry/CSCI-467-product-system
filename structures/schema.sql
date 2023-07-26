-- After making any edits, you should create and run a migration in Supabase

-- Aim: Although we could have just thrown everything in tables matching
-- the project requirements, our data and transaction model aims to provide
-- these qualities as well:
-- 
-- 1. Traceability: Each resource contains a full history in the form of states.
-- 2. Atomicity: All CRUD operations are performed as single statements that
--    guarantee complete success or failure.

CREATE TABLE product (
  id bigserial PRIMARY KEY
);
CREATE TABLE product_state (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  part_number bigint NOT NULL,
  description text NOT NULL,
  weight numeric(11,2) NOT NULL,
  picture_url text NOT NULL,
  price numeric(11,2) NOT NULL,
  quantity bigint NOT NULL,
  deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX product_state_product_id_timestamp ON product_state (product_id, timestamp);


CREATE TABLE customer (
  id bigserial PRIMARY KEY
);
CREATE TABLE customer_state (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL, -- Ideally, we would add a unique constraint on (email)
  -- where is_latest = true
  deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX customer_state_customer_id_timestamp ON customer_state (customer_id, timestamp);


CREATE TYPE order_status AS ENUM('authorized', 'shipped');
CREATE TABLE "order" (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customer(id) ON DELETE RESTRICT
);
CREATE TABLE order_state (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  auth_number text NOT NULL,
  cc_last_four char(4) NOT NULL,
  shipping_address text NOT NULL,
  status order_status NOT NULL,
  total_price numeric(11,2) NOT NULL, -- Should equal sum of line items + S&H
  deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX order_state_order_id_timestamp ON order_state (order_id, timestamp);
CREATE INDEX order_state_timestamp ON order_state (timestamp);
CREATE INDEX order_state_status ON order_state (status);
CREATE INDEX order_state_total_price ON order_state (total_price);
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
  weight_brackets jsonb NOT NULL, -- Not a proper data model but saves dev time
);
CREATE INDEX fee_schedule_state_timestamp ON fee_schedule_state (timestamp);
