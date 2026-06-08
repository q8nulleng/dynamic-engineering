import mysql from './node_modules/mysql2/promise.js';
import crypto from 'crypto';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check existing employees
const [rows] = await conn.query('SELECT id, name, emp_role, specialty FROM employees ORDER BY id');
console.log('Existing employees:', JSON.stringify(rows, null, 2));

// Check if nawaf already exists
const [existing] = await conn.query("SELECT id FROM employees WHERE name LIKE '%نواف%'");
if (existing.length > 0) {
  console.log('نواف already exists:', existing);
} else {
  // Add nawaf - using a simple hash for password
  const passwordHash = crypto.createHash('sha256').update('nawaf123').digest('hex');
  await conn.query(
    `INSERT INTO employees (name, email, password_hash, emp_role, specialty, is_active) 
     VALUES (?, ?, ?, ?, ?, 1)`,
    ['م. نواف', 'nawaf@dynamic-eng.kw', passwordHash, 'admin', 'مدير المكتب']
  );
  console.log('تم إضافة المهندس نواف بنجاح');
}

await conn.end();
