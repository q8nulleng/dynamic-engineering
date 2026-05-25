import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || "4000"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
});

// Create project_briefs table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS project_briefs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    owner_name VARCHAR(256) DEFAULT '',
    owner_phone VARCHAR(32) DEFAULT '',
    governorate VARCHAR(64) DEFAULT '',
    area VARCHAR(128) DEFAULT '',
    block VARCHAR(32) DEFAULT '',
    plot VARCHAR(32) DEFAULT '',
    auto_number VARCHAR(32) DEFAULT '',
    plot_area VARCHAR(32) DEFAULT '',
    plot_shape VARCHAR(64) DEFAULT '',
    north_direction VARCHAR(32) DEFAULT '',
    architectural_style VARCHAR(64) DEFAULT '',
    floors_count INT DEFAULT 0,
    floors_details LONGTEXT,
    sketch_data LONGTEXT,
    notes LONGTEXT,
    created_at VARCHAR(32) NOT NULL,
    updated_at VARCHAR(32) DEFAULT ''
  )
`);
console.log("✓ project_briefs table created");

// Create project_meetings table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS project_meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    date VARCHAR(32) NOT NULL,
    attendees LONGTEXT,
    agreed LONGTEXT,
    changes LONGTEXT,
    status VARCHAR(32) DEFAULT 'pending',
    notes LONGTEXT,
    created_at VARCHAR(32) NOT NULL
  )
`);
console.log("✓ project_meetings table created");

await conn.end();
console.log("Done!");
