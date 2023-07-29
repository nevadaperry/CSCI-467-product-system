/**
 * Only for use by jobs to do incremental sync with external sources,
 * aka the legacy db.
 */

import * as pg from 'pg';
import SQL from 'pg-template-tag';
import { UpdateResult, Watermark } from '../../shared/resource';

export async function readWatermark(db: pg.Pool) {
  const {
    rows: [watermark],
  } = await db.query<Watermark>(SQL`
    SELECT legacy_pkey
    FROM watermark_state
    WHERE is_latest = true
  `);
  return watermark;
}

export async function updateWatermark(db: pg.Pool, update: Watermark) {
  const {
    rows: [result],
  } = await db.query<UpdateResult>(SQL`
    WITH resource AS (
      SELECT true AS exists
      FROM watermark_state
      WHERE is_latest = true
    ), unmarked AS (
      UPDATE watermark_state
      SET is_latest = false
      WHERE is_latest = true
      -- We don't validate the existing watermark here because watermarked
      -- operations should be idempotent.
      RETURNING true AS success
    ), updated AS (
      INSERT INTO watermark_state (legacy_pkey)
      SELECT ${update.legacy_pkey}
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
