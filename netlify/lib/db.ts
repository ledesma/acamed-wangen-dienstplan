import postgres from 'postgres';
 
// DATABASE_URL should be Supabase's *Transaction Pooler* connection string
// (port 6543), which is what you want from short-lived Netlify Functions.
// Example: postgresql://postgres.xxxx:[PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:6543/postgres
//
// `prepare: false` is required when using the transaction pooler (pgbouncer),
// since pgbouncer in transaction mode does not support prepared statements.
const connectionString = process.env.DATABASE_URL;
 
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
 
export const sql = postgres(connectionString, {
  prepare: false,
});
 