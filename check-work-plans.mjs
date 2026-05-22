import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
// Parse the URL to extract components
const url = new URL(dbUrl);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || "4000"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
});

// Check existing plans
const [rows] = await conn.execute("SELECT id, name, project_type FROM work_plans ORDER BY id");
console.log("Existing work plans:", JSON.stringify(rows, null, 2));

// Check which types are missing
const existingTypes = rows.map(r => r.project_type);
const requiredTypes = ["صناعي", "سكن خاص", "استثماري", "تجاري"];
const missingTypes = requiredTypes.filter(t => !existingTypes.includes(t));
console.log("Missing types:", missingTypes);

await conn.end();
