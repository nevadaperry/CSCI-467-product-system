import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { addRoutes } from './routes';

(async () => {
  // Stored in Render or can be supplied locally
  if (!process.env.PG_PASSWORD) {
    throw new Error(`Missing env var PG_PASSWORD`);
  }
  console.log(`Connecting to Postgres`);
  const db = new pg.Pool({
    host: 'db.slvnhlweeidvyjhyyzlx.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.PG_PASSWORD,
  });
  await db.connect();
  console.log(`Successfully connected to Postgres`);

  console.log(`Starting Hapi server`);
  const server = hapi.server({
    port: 3000,
    host: 'localhost',
  });
  addRoutes(server, db);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
})();

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});
