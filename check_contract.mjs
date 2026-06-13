import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== العقد CON-2026-67F ===');
const [rows] = await conn.execute(
  "SELECT id, template_type, template, service, type, LENGTH(terms_text) as terms_len, SUBSTRING(terms_text, 1, 300) as terms_preview FROM contracts WHERE id = 'CON-2026-67F'"
);
console.log(JSON.stringify(rows, null, 2));

console.log('\n=== جميع قوالب العقود ===');
const [templates] = await conn.execute(
  "SELECT id, name, service_type, building_type, LENGTH(content) as content_len, SUBSTRING(content, 1, 100) as content_preview FROM contract_templates"
);
console.log(JSON.stringify(templates, null, 2));

await conn.end();
