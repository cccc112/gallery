import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

const globalForDb = global as unknown as { sql: postgres.Sql };

export const sql = globalForDb.sql || postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql;
}
