import * as pg from 'pg';
import SQL from 'pg-template-tag';
import { FeeSchedule, UpdateResult } from '../../structures/resource';

export async function readFeeSchedule(db: pg.Pool, _id: number) {
  const {
    rows: [feeSchedule],
  } = await db.query<FeeSchedule>(SQL`
    WITH latest_fs AS (
      SELECT id
      FROM fee_schedule_state
      ORDER BY timestamp
      LIMIT 1
    ), result AS (
      SELECT
        coalesce(jsonb_agg(jsonb_build_object(
          'lower_bound', wb.lower_bound,
          'fee', wb.fee
        )), '[]'::jsonb) AS weight_brackets
      FROM latest_fs
      JOIN weight_bracket wb
        ON wb.fee_schedule_state_id = latest_fs.id
    )
    SELECT weight_brackets
    FROM result
    CROSS JOIN latest_fs
    WHERE latest_fs.* IS NOT NULL
  `);
  return feeSchedule;
}

export async function updateFeeSchedule(
  db: pg.Pool,
  _id: any,
  _existing: any,
  update: FeeSchedule
) {
  const {
    rows: [result],
  } = await db.query<UpdateResult>(SQL`
    WITH inserted_fs_state AS (
      -- Ideally, we would validate "existing.weight_brackets" against the
      -- weight brackets associated with "latest"
      INSERT INTO fee_schedule_state DEFAULT VALUES
      RETURNING id
    )
    INSERT INTO weight_bracket (
      fee_schedule_state_id,
      lower_bound,
      fee
    )
    SELECT
      inserted_fs_state.id,
      lower_bound,
      fee
    FROM jsonb_to_recordset(${JSON.stringify(
      update.weight_brackets
    )}) AS update (
      lower_bound numeric(11,2),
      fee numeric(11,2)
    )
    CROSS JOIN inserted_fs_state
    RETURNING true AS success
  `);
  return result;
}
