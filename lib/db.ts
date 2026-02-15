import { Pool } from 'pg';

let pool: Pool;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
}
pool = global.pool;

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool, // Expose pool for transactions
};

// Add types for global caching in development
declare global {
  var pool: Pool | undefined;
}
