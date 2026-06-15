import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const sql = `ALTER TABLE \`crm_leads\` ADD COLUMN IF NOT EXISTS \`stage_changed_at\` varchar(32) DEFAULT ''`;

const pool = await mysql.createPool(process.env.DATABASE_URL);

try {
  console.log('Running:', sql);
  await pool.execute(sql);
  console.log('  ✓ OK');
} catch (err) {
  if (err.code === 'ER_DUP_FIELDNAME' || err.message?.includes('Duplicate column')) {
    console.log('  ⚠ Column already exists, skipping');
  } else {
    console.error('  ✗ Error:', err.message);
  }
}

await pool.end();
console.log('Migration complete!');
