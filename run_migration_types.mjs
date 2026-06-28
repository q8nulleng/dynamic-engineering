import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const pool = await mysql.createPool(process.env.DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS \`service_types\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`sort_order\` int DEFAULT 0,
    \`created_at\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`service_types_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`property_types\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`sort_order\` int DEFAULT 0,
    \`created_at\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`property_types_id\` PRIMARY KEY(\`id\`)
  )`,
  // Seed default service types
  `INSERT IGNORE INTO service_types (name, sort_order) VALUES
    ('بناء جديد', 1),
    ('هدم', 2),
    ('تعديل', 3),
    ('إضافة', 4),
    ('تعديل وإضافة', 5),
    ('إضافة مبنى قائم', 6),
    ('إضافة مبنى قائم بدون ترخيص', 7),
    ('إشراف', 8),
    ('تصميم واجهات', 9)`,
  // Seed default property types
  `INSERT IGNORE INTO property_types (name, sort_order) VALUES
    ('سكن خاص', 1),
    ('استثماري', 2),
    ('تجاري', 3),
    ('صناعي', 4),
    ('كروكي', 5)`
];

for (const stmt of statements) {
  try {
    await pool.execute(stmt);
    console.log('OK:', stmt.substring(0, 60).replace(/\s+/g, ' '));
  } catch(e) {
    console.error('ERR:', e.message);
  }
}

await pool.end();
console.log('Done!');
