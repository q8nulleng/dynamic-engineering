import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== محتوى قالب "عقد إشراف - سكن خاص" (id=6) - أول 3000 حرف ===');
const [rows] = await conn.execute(
  "SELECT content FROM contract_templates WHERE id = 6"
);
if (rows[0]) {
  console.log(rows[0].content.substring(0, 3000));
}

await conn.end();
