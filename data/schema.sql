-- After making any edits, you should create and run a migration in Supabase

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
  quantity bigint NOT NULL
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
  email text NOT NULL
);
CREATE INDEX customer_state_customer_id_timestamp ON customer_state (customer_id, timestamp);


CREATE TYPE order_status AS ENUM('authorized', 'shipped');
CREATE TABLE order (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customer ON DELETE RESTRICT
);
CREATE TABLE order_state (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES order(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  auth_number text NOT NULL,
  cc_last_four char(4) NOT NULL,
  shipping_address text NOT NULL,
  status order_status NOT NULL,
  total_price numeric(11,2) NOT NULL -- Should be sum of line items + S&H
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


CREATE TABLE fee_schedule_state (
  id bigserial PRIMARY KEY,
  fee_schedule_id bigint NOT NULL REFERENCES fee_schedule(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  weight_brackets jsonb NOT NULL -- Not a proper data model but saves time
);
CREATE INDEX fee_schedule_state_timestamp ON fee_schedule_state (timestamp);
