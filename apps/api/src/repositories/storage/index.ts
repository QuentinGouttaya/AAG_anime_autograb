import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './db/schema.js';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
