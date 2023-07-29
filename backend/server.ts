import * as hapi from '@hapi/hapi';
import * as pg from 'pg';
import { addRoutes } from './routes';
import Bree from 'bree';

(async () => {
  // Stored in Render or can be supplied locally
  if (!process.env.PG_PASSWORD) {
    throw new Error(`Missing env var PG_PASSWORD`);
  }

  const bree = new Bree({
    jobs: [
      /*{
        name: 'pull-legacy-data',
        cron: '0 0 * * *',
      },*/
    ],
  });
  bree.start(); // async

  const db = await connectToPostgres();

  console.log(`Starting Hapi server`);
  const server = hapi.server({
    port: process.env.PORT ?? 3001,
    host: '0.0.0.0',
    routes: {
      cors: {
        // TODO: Fix this. Should it be product-system-frontend.onrender.com?
        origin: ['*'],
      },
    },
  });
  addRoutes(server, db);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
})();

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

export async function connectToPostgres() {
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
  return db;
}
