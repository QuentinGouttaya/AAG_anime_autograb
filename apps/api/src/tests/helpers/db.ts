import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../../repositories/storage/db/schema.js';

// Connects to the same DB defined in your all.env
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const testDb: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export async function cleanDatabase() {
  // RESTART IDENTITY resets your serial primary keys back to 1
  await testDb.execute(sql`
    TRUNCATE TABLE 
      subscription_episodes, 
      subscriptions, 
      episodes, 
      series 
    RESTART IDENTITY CASCADE;
  `);
}
