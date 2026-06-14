import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Read DATABASE_URL from environment or try to find it
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

console.log('Connecting to DB...');
const conn = await mysql.createConnection(dbUrl);

const queries = [
  "ALTER TABLE `crm_leads` ADD COLUMN IF NOT EXISTS `civil_card_url` TEXT",
  "ALTER TABLE `crm_leads` ADD COLUMN IF NOT EXISTS `signed_contract_url` TEXT",
  "ALTER TABLE `crm_leads` ADD COLUMN IF NOT EXISTS `contract_signing_status` VARCHAR(32) DEFAULT 'مسودة'",
];

for (const q of queries) {
  try {
    await conn.execute(q);
    console.log('OK:', q.substring(0, 60));
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Already exists (skip):', q.substring(0, 60));
    } else {
      console.error('FAIL:', e.message);
    }
  }
}

await conn.end();
console.log('Done.');
