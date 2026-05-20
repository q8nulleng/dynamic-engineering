import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Load .env manually
try {
  const env = readFileSync('.env', 'utf-8');
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
} catch {}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

console.log('Connecting to MySQL...');
const conn = await mysql.createConnection(url);
const db = drizzle(conn);

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migration completed successfully!');
} catch (e) {
  console.error('❌ Migration error:', e.message);
  if (e.cause) console.error('Cause:', e.cause);
  if (e.sql) console.error('SQL:', e.sql);
  process.exit(1);
} finally {
  await conn.end();
}
