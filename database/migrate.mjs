import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import postgres from 'postgres';

const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(connectionString, {
  prepare: false,
  onnotice: () => {},
});

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS public._migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const [{ count: appliedCount }] = await sql`SELECT count(*)::int FROM public._migrations`;

  if (appliedCount === 0) {
    const [{ exists: usersExists }] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      )
    `;

    if (usersExists) {
      console.error(
        'Refusing to run: the database already has a schema (table "users" exists) ' +
          'but no migrations are recorded in "_migrations". This looks like a pre-existing, ' +
          'untracked database. Run database/baseline.sql once by hand against it to record the ' +
          'migrations it already has, then re-run this script.'
      );
      process.exit(1);
    }
  }

  const applied = new Set((await sql`SELECT name FROM public._migrations`).map((row) => row.name));

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  const pending = files.filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log('No pending migrations.');
  }

  for (const name of pending) {
    const filePath = path.join(migrationsDir, name);
    const query = readFileSync(filePath, 'utf8');

    console.log(`Applying ${name}...`);

    await sql.begin(async (tx) => {
      await tx.unsafe(query);
      await tx`INSERT INTO public._migrations (name) VALUES (${name})`;
    });

    console.log(`Applied ${name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
