import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";
import { seedDatabase } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "..", "dynamic.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function initDb() {
  const migrationsFolder = path.join(__dirname, "migrations");
  try {
    migrate(db, { migrationsFolder });
  } catch {
    // migrations folder may not exist yet on first run — create tables manually
    createTables();
  }
  // Runtime migrations — add columns safely (idempotent)
  const addCol = (sql: string) => { try { sqlite.exec(sql); } catch { /* already exists */ } };

  // clients — Issue #9
  addCol("ALTER TABLE clients ADD COLUMN governorate TEXT DEFAULT ''");
  addCol("ALTER TABLE clients ADD COLUMN lead_id TEXT DEFAULT ''");
  addCol("ALTER TABLE clients ADD COLUMN total_contracts_value REAL DEFAULT 0");
  addCol("ALTER TABLE clients ADD COLUMN total_paid REAL DEFAULT 0");
  addCol("ALTER TABLE clients ADD COLUMN total_remaining REAL DEFAULT 0");
  addCol("ALTER TABLE clients ADD COLUMN project_summary TEXT DEFAULT ''");

  // crm_leads — create + Issue #9 new fields
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS crm_leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      type TEXT DEFAULT '',
      source TEXT DEFAULT '',
      service_type TEXT DEFAULT '',
      governorate TEXT DEFAULT '',
      area TEXT DEFAULT '',
      likely_contract TEXT DEFAULT '',
      expected_revenue TEXT DEFAULT '0',
      probability INTEGER DEFAULT 10,
      priority INTEGER DEFAULT 0,
      expected_closing TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      stage TEXT DEFAULT 'استفسار جديد',
      tags TEXT DEFAULT '[]',
      quotations INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      civil_id TEXT DEFAULT '',
      plot_number TEXT DEFAULT '',
      land_area REAL DEFAULT 0,
      assigned_to TEXT DEFAULT ''
    )`);
  } catch { /* already exists */ }
  addCol("ALTER TABLE crm_leads ADD COLUMN plot_number TEXT DEFAULT ''");
  addCol("ALTER TABLE crm_leads ADD COLUMN land_area REAL DEFAULT 0");
  addCol("ALTER TABLE crm_leads ADD COLUMN assigned_to TEXT DEFAULT ''");

  // quotations — Issue #9
  addCol("ALTER TABLE quotations ADD COLUMN lead_id TEXT DEFAULT ''");
  addCol("ALTER TABLE quotations ADD COLUMN validity_days INTEGER DEFAULT 30");
  addCol("ALTER TABLE quotations ADD COLUMN expiry_date TEXT DEFAULT ''");

  // contracts — Issue #9
  addCol("ALTER TABLE contracts ADD COLUMN lead_id TEXT DEFAULT ''");
  addCol("ALTER TABLE contracts ADD COLUMN template_type TEXT DEFAULT ''");
  addCol("ALTER TABLE contracts ADD COLUMN terms_text TEXT DEFAULT ''");
  addCol("ALTER TABLE contracts ADD COLUMN signing_date TEXT DEFAULT ''");

  // projects — Issue #9
  addCol("ALTER TABLE projects ADD COLUMN contract_id TEXT DEFAULT ''");
  addCol("ALTER TABLE projects ADD COLUMN lead_id TEXT DEFAULT ''");
  addCol("ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'جديد'");

  // Fix seeded project statuses that got 'جديد' default when column was added to existing DB
  const fixedStatuses: [string, string][] = [
    ["S00048", "جارٍ"], ["S00049", "جارٍ"], ["S00050", "جارٍ"], ["S00045", "إشراف"],
  ];
  for (const [id, status] of fixedStatuses) {
    try { sqlite.exec(`UPDATE projects SET status = '${status}' WHERE id = '${id}' AND status = 'جديد'`); } catch { /* ignore */ }
  }

  // tasks — Issue #9
  addCol("ALTER TABLE tasks ADD COLUMN depends_on INTEGER DEFAULT 0");
  addCol("ALTER TABLE tasks ADD COLUMN auto_created INTEGER DEFAULT 0");
  addCol("ALTER TABLE tasks ADD COLUMN estimated_days INTEGER DEFAULT 0");

  // invoices — Issue #9
  addCol("ALTER TABLE invoices ADD COLUMN contract_id TEXT DEFAULT ''");
  addCol("ALTER TABLE invoices ADD COLUMN payment_type TEXT DEFAULT 'other'");
  addCol("ALTER TABLE invoices ADD COLUMN payment_method TEXT DEFAULT ''");
  addCol("ALTER TABLE invoices ADD COLUMN invoice_number TEXT DEFAULT ''");

  // contract_templates — Issue #16
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS contract_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      building_type TEXT NOT NULL DEFAULT '',
      service_type TEXT NOT NULL DEFAULT '',
      scope_of_work TEXT DEFAULT '',
      terms TEXT DEFAULT '',
      party1_obligations TEXT DEFAULT '',
      party2_obligations TEXT DEFAULT '',
      payment_schedule TEXT DEFAULT '',
      duration TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      is_default INTEGER DEFAULT 0
    )`);
  } catch { /* already exists */ }

  seedDatabase(db);
}

function createTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      phone2 TEXT DEFAULT '',
      civil_id TEXT DEFAULT '',
      email TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'individual',
      governorate TEXT DEFAULT '',
      area TEXT DEFAULT '',
      block TEXT DEFAULT '',
      plot TEXT DEFAULT '',
      parcel_area REAL DEFAULT 0,
      parcel_shape TEXT DEFAULT '',
      parcel_facing TEXT DEFAULT '',
      ownership_doc TEXT DEFAULT '',
      ownership_date TEXT DEFAULT '',
      spouse_name TEXT DEFAULT '',
      spouse_civil_id TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      rating INTEGER DEFAULT 5,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      project_type TEXT DEFAULT '',
      service_type TEXT DEFAULT '',
      lead_id TEXT DEFAULT '',
      total_contracts_value REAL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      total_remaining REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crm_leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      type TEXT DEFAULT '',
      source TEXT DEFAULT '',
      service_type TEXT DEFAULT '',
      governorate TEXT DEFAULT '',
      area TEXT DEFAULT '',
      likely_contract TEXT DEFAULT '',
      expected_revenue TEXT DEFAULT '0',
      probability INTEGER DEFAULT 10,
      priority INTEGER DEFAULT 0,
      expected_closing TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      stage TEXT DEFAULT 'استفسار جديد',
      tags TEXT DEFAULT '[]',
      quotations INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      civil_id TEXT DEFAULT '',
      plot_number TEXT DEFAULT '',
      land_area REAL DEFAULT 0,
      assigned_to TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id),
      client TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'سكن خاص',
      service_type TEXT NOT NULL DEFAULT 'بناء جديد',
      area TEXT DEFAULT '',
      quotation TEXT DEFAULT '',
      progress INTEGER NOT NULL DEFAULT 0,
      current_phase INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      contract_id TEXT DEFAULT '',
      lead_id TEXT DEFAULT '',
      status TEXT DEFAULT 'جديد'
    );

    CREATE TABLE IF NOT EXISTS phases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      "order" INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase_id INTEGER NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      assignee TEXT DEFAULT '',
      description TEXT DEFAULT '',
      priority INTEGER DEFAULT 0,
      deadline TEXT DEFAULT '',
      "order" INTEGER NOT NULL DEFAULT 0,
      depends_on INTEGER DEFAULT 0,
      auto_created INTEGER DEFAULT 0,
      estimated_days INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      client TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'سكن خاص',
      service TEXT NOT NULL DEFAULT 'بناء جديد',
      package TEXT DEFAULT '',
      amount TEXT DEFAULT '0',
      status TEXT NOT NULL DEFAULT 'مسودة',
      date TEXT NOT NULL,
      civil_id TEXT DEFAULT '',
      governorate TEXT DEFAULT '',
      area TEXT DEFAULT '',
      land_area TEXT DEFAULT '',
      block TEXT DEFAULT '',
      suburb TEXT DEFAULT '',
      plot TEXT DEFAULT '',
      survey_plan TEXT DEFAULT '',
      project_id TEXT REFERENCES projects(id),
      lead_id TEXT DEFAULT '',
      validity_days INTEGER DEFAULT 30,
      expiry_date TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      quotation_id TEXT REFERENCES quotations(id),
      project_id TEXT REFERENCES projects(id),
      client_id TEXT REFERENCES clients(id),
      client TEXT NOT NULL DEFAULT '',
      template TEXT DEFAULT '',
      type TEXT DEFAULT '',
      service TEXT DEFAULT '',
      package TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'مسودة',
      date TEXT NOT NULL,
      amount TEXT DEFAULT '0',
      civil_id TEXT DEFAULT '',
      area TEXT DEFAULT '',
      block TEXT DEFAULT '',
      plot TEXT DEFAULT '',
      lead_id TEXT DEFAULT '',
      template_type TEXT DEFAULT '',
      terms_text TEXT DEFAULT '',
      signing_date TEXT DEFAULT '',
      signed_file_url TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id),
      client_id TEXT REFERENCES clients(id),
      client TEXT NOT NULL DEFAULT '',
      project TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'مسودة',
      date TEXT NOT NULL,
      due_date TEXT DEFAULT '',
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 15,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      contract_id TEXT REFERENCES contracts(id),
      payment_type TEXT DEFAULT 'other',
      payment_method TEXT DEFAULT '',
      invoice_number TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '',
      quantity REAL DEFAULT 1,
      price REAL DEFAULT 0,
      tax_percent REAL DEFAULT 15,
      total REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT REFERENCES clients(id),
      project_id TEXT REFERENCES projects(id),
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      file_name TEXT DEFAULT '',
      file_size TEXT DEFAULT '',
      uploaded_at TEXT DEFAULT '',
      url TEXT DEFAULT ''
    );
  `);
}

export { sqlite };
