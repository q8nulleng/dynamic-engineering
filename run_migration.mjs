import { createRequire } from 'module';
import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const sql = readFileSync('./drizzle/0011_curious_mad_thinker.sql', 'utf-8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

const pool = await mysql.createPool(process.env.DATABASE_URL);

for (const stmt of statements) {
  try {
    console.log('Running:', stmt.substring(0, 80) + '...');
    await pool.execute(stmt);
    console.log('  ✓ OK');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.message?.includes('Duplicate column')) {
      console.log('  ⚠ Column already exists, skipping');
    } else {
      console.error('  ✗ Error:', err.message);
    }
  }
}

await pool.end();
console.log('Migration complete!');
