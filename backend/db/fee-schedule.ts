import * as pg from 'pg';
import SQL from 'pg-template-tag';
import { FeeSchedule, UpdateResult } from '../../shared/resource';

export async function readFeeSchedule(db: pg.Pool, _id: number) {
  const {
    rows: [feeSchedule],
  } = await db.query<FeeSchedule>(SQL`
    SELECT
      coalesce(jsonb_agg(jsonb_build_object(
        'lower_bound', wb.lower_bound,
        'fee', wb.fee
      )), '[]'::jsonb) AS weight_brackets
    FROM fee_schedule_state fss
    CROSS JOIN LATERAL (
      SELECT *
      FROM weight_bracket wb
      WHERE wb.fee_schedule_state_id = fss.id
      ORDER BY wb.lower_bound ASC
    ) wb
    WHERE fss.is_latest = true
  `);
  return feeSchedule;
}

export async function updateFeeSchedule(
  db: pg.Pool,
  _id: any,
  _existing: any,
  update: FeeSchedule
) {
  // TODO: Actually validate against `existing`
  const {
    rows: [result],
  } = await db.query<UpdateResult>(SQL`
    WITH resource AS (
      SELECT true AS exists
      FROM fee_schedule_state
      WHERE is_latest = true
    ), unmarked AS (
      UPDATE fee_schedule_state
      SET is_latest = false
      WHERE is_latest = true
      RETURNING true AS success
    ), inserted_fss AS (
      INSERT INTO fee_schedule_state DEFAULT VALUES
      RETURNING id
    ), updated AS (
      INSERT INTO weight_bracket (
        fee_schedule_state_id,
        lower_bound,
        fee
      )
      SELECT
        inserted_fss.id,
        wb.lower_bound,
        wb.fee
      FROM inserted_fss
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(
        update.weight_brackets
      )}::jsonb) AS wb (
        lower_bound numeric(11,2),
        fee numeric(11,2)
      )
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
