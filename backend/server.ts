import * as hapi from '@hapi/hapi';
import * as inert from '@hapi/inert';
import * as pg from 'pg';
import { addRoutes } from './routes';
import { Agenda } from 'agenda';
const Agendash = require('agendash');
import { pullLegacyData } from './jobs/pull-legacy-data';

(async () => {
  const db = await connectToPostgres();
  const agenda = await startAgenda(db);

  console.log(`Starting Hapi server`);
  const server = hapi.server({
    port: process.env.PORT ?? 4000,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
    debug: {
      request: '*',
    },
  });
  await server.register(inert);
  if (agenda) {
    await server.register(
      Agendash(agenda, {
        middleware: 'hapi',
      })
    );
  }

  await addRoutes(server, db);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
})();

async function connectToPostgres() {
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
  return db;
}

async function startAgenda(db: pg.Pool) {
  // Stored in Render or can be supplied locally
  if (!process.env.MONGO_PASSWORD) {
    console.warn(
      `Missing env var MONGO_PASSWORD. Agenda jobs will not be run (this is fine for development).`
    );
    return;
  }
  console.log(`Starting Agenda`);
  const agenda = new Agenda({
    db: {
      address: `mongodb+srv://csci467:${process.env.MONGO_PASSWORD}@cluster0.iwr8tyo.mongodb.net/?retryWrites=true&w=majority`,
    },
  });
  agenda.define('pull-legacy-data', async () => {
    try {
      await pullLegacyData(db);
    } catch (e) {
      console.error(`Uncaught exception from pullLegacyData: `, e);
    }
  });
  await agenda.start();
  await agenda.every('0 0 * * *', 'pull-legacy-data');
  console.log(`Successfully started Agenda`);
  return agenda;
}
