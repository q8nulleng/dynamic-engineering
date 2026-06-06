import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`packages\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`price\` varchar(32) NOT NULL,
    \`building_type\` varchar(64) NOT NULL,
    \`service_type\` varchar(64) NOT NULL,
    \`level\` varchar(64) NOT NULL DEFAULT '-',
    \`features\` text NOT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT (now()),
    \`updated_at\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`packages_id\` PRIMARY KEY(\`id\`)
  )`);
  console.log('✅ packages table created successfully');
} catch (err) {
  console.error('❌ Error:', err.message);
}
await conn.end();
