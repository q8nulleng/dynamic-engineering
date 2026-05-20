/**
 * Data Migration Script: SQLite → MySQL (TiDB Cloud)
 * Uses exact MySQL column names (snake_case as confirmed from DESCRIBE)
 */
import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
try {
  const env = readFileSync(path.join(__dirname, '.env'), 'utf-8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) process.env[key] = val;
  }
} catch {}

const SQLITE_PATH = path.join(__dirname, 'dynamic.db');
const MYSQL_URL = process.env.DATABASE_URL;

if (!MYSQL_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Map SQLite column names → MySQL column names
// MySQL uses snake_case throughout, SQLite may have camelCase in some tables
const columnMaps = {
  clients: {
    civilId: 'civil_id',
    parcelArea: 'parcel_area',
    parcelShape: 'parcel_shape',
    parcelFacing: 'parcel_facing',
    ownershipDoc: 'ownership_doc',
    ownershipDate: 'ownership_date',
    spouseName: 'spouse_name',
    spouseCivilId: 'spouse_civil_id',
    createdAt: 'created_at',
    projectType: 'project_type',
    serviceType: 'service_type',
    projectSummary: 'project_summary',
    leadId: 'lead_id',
    totalContractsValue: 'total_contracts_value',
    totalPaid: 'total_paid',
    totalRemaining: 'total_remaining',
  },
  crm_leads: {
    likelyContract: 'likely_contract',
    expectedRevenue: 'expected_revenue',
    expectedClosing: 'expected_closing',
    plotNumber: 'plot_number',
    landArea: 'land_area',
    assignedTo: 'assigned_to',
    serviceType: 'service_type',
    civilId: 'civil_id',
  },
  projects: {
    clientId: 'client_id',
    serviceType: 'service_type',
    currentPhase: 'current_phase',
    createdAt: 'created_at',
    contractId: 'contract_id',
    leadId: 'lead_id',
  },
  phases: {
    projectId: 'project_id',
  },
  tasks: {
    phaseId: 'phase_id',
    dependsOn: 'depends_on',
    autoCreated: 'auto_created',
    estimatedDays: 'estimated_days',
  },
  quotations: {
    clientId: 'client_id',
    serviceType: 'service_type',
    landArea: 'land_area',
    surveyPlan: 'survey_plan',
    projectId: 'project_id',
    leadId: 'lead_id',
    validityDays: 'validity_days',
    expiryDate: 'expiry_date',
    civilId: 'civil_id',
  },
  contracts: {
    quotationId: 'quotation_id',
    projectId: 'project_id',
    clientId: 'client_id',
    serviceType: 'service_type',
    leadId: 'lead_id',
    templateType: 'template_type',
    termsText: 'terms_text',
    signingDate: 'signing_date',
    signedFileUrl: 'signed_file_url',
    civilId: 'civil_id',
  },
  invoices: {
    projectId: 'project_id',
    clientId: 'client_id',
    dueDate: 'due_date',
    taxRate: 'tax_rate',
    taxAmount: 'tax_amount',
    paymentType: 'payment_type',
    paymentMethod: 'payment_method',
    invoiceNumber: 'invoice_number',
    contractId: 'contract_id',
  },
  invoice_lines: {
    invoiceId: 'invoice_id',
    taxPercent: 'tax_percent',
  },
  documents: {
    clientId: 'client_id',
    projectId: 'project_id',
    fileName: 'file_name',
    fileSize: 'file_size',
    uploadedAt: 'uploaded_at',
  },
  contract_templates: {
    buildingType: 'building_type',
    serviceType: 'service_type',
    scopeOfWork: 'scope_of_work',
    party1Obligations: 'party1_obligations',
    party2Obligations: 'party2_obligations',
    paymentSchedule: 'payment_schedule',
    isDefault: 'is_default',
    createdAt: 'created_at',
  },
};

function mapRow(table, row) {
  const map = columnMaps[table] || {};
  const mapped = {};
  for (const [k, v] of Object.entries(row)) {
    const newKey = map[k] || k;
    mapped[newKey] = v;
  }
  return mapped;
}

function buildInsert(table, row) {
  const keys = Object.keys(row);
  const cols = keys.map(k => `\`${k}\``).join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map(k => row[k]);
  return { sql: `INSERT IGNORE INTO \`${table}\` (${cols}) VALUES (${placeholders})`, values };
}

async function migrate() {
  console.log('🔄 Opening SQLite database...');
  const sqlite = new Database(SQLITE_PATH);

  console.log('🔄 Connecting to MySQL...');
  const conn = await mysql.createConnection(MYSQL_URL);

  const tables = [
    'clients',
    'crm_leads',
    'projects',
    'phases',
    'tasks',
    'quotations',
    'contracts',
    'invoices',
    'invoice_lines',
    'documents',
    'contract_templates',
  ];

  let totalMigrated = 0;

  for (const table of tables) {
    let rows;
    try {
      rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();
    } catch (e) {
      console.log(`⚠️  Table ${table} not found in SQLite, skipping`);
      continue;
    }

    if (rows.length === 0) {
      console.log(`⏭️  ${table}: 0 rows (skipping)`);
      continue;
    }

    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    for (const row of rows) {
      const mapped = mapRow(table, row);
      const { sql, values } = buildInsert(table, mapped);
      try {
        const [result] = await conn.execute(sql, values);
        if (result.affectedRows > 0) inserted++;
        else skipped++;
      } catch (e) {
        errors++;
        console.error(`  ❌ Error inserting into ${table}: ${e.message}`);
        console.error('     Row keys:', Object.keys(mapped).join(', '));
      }
    }
    const status = errors > 0 ? `⚠️` : `✅`;
    console.log(`${status} ${table}: ${inserted} inserted, ${skipped} skipped, ${errors} errors (total: ${rows.length})`);
    totalMigrated += inserted;
  }

  sqlite.close();
  await conn.end();

  console.log(`\n🎉 Migration complete! Total rows migrated: ${totalMigrated}`);
}

migrate().catch(e => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
