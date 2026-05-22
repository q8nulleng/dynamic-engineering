/**
 * Migration: Add client_phone and assigned_to columns to appointments table
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

// Parse mysql2 URL
const conn = await mysql.createConnection(url);

try {
  console.log("Adding client_phone column...");
  await conn.execute("ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `client_phone` varchar(32) DEFAULT ''");
  console.log("✓ client_phone added");
} catch (e) {
  if (e.message?.includes("Duplicate column")) {
    console.log("client_phone already exists, skipping");
  } else {
    console.error("client_phone error:", e.message);
  }
}

try {
  console.log("Adding assigned_to column...");
  await conn.execute("ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `assigned_to` varchar(128) DEFAULT ''");
  console.log("✓ assigned_to added");
} catch (e) {
  if (e.message?.includes("Duplicate column")) {
    console.log("assigned_to already exists, skipping");
  } else {
    console.error("assigned_to error:", e.message);
  }
}

await conn.end();
console.log("Migration complete!");
