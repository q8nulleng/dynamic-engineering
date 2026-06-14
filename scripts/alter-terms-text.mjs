// Load env from dotenv if available
import { createConnection } from "mysql2/promise";

// Try to load env from the running server's env
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set. Run with: DATABASE_URL=... node scripts/alter-terms-text.mjs");
  process.exit(1);
}

console.log("Connecting to database...");
const conn = await createConnection(dbUrl);

try {
  console.log("Altering contracts.terms_text column to LONGTEXT...");
  await conn.execute("ALTER TABLE contracts MODIFY COLUMN terms_text LONGTEXT");
  console.log("SUCCESS: contracts.terms_text changed to LONGTEXT");
  
  console.log("Altering contract_templates.content column to LONGTEXT...");
  await conn.execute("ALTER TABLE contract_templates MODIFY COLUMN content LONGTEXT");
  console.log("SUCCESS: contract_templates.content changed to LONGTEXT");
  
  // Verify
  const [rows] = await conn.execute("SHOW COLUMNS FROM contracts WHERE Field = 'terms_text'");
  console.log("Verification:", rows[0]);
} catch (e) {
  console.error("ERROR:", e.message);
} finally {
  await conn.end();
  process.exit(0);
}
