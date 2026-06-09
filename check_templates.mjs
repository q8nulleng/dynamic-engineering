import { getDb } from './server/db/mysql.js';
import { contractTemplates } from './drizzle/schema.js';

const db = getDb();
const rows = await db.select().from(contractTemplates);
console.log(`Total templates: ${rows.length}`);
for (const r of rows) {
  console.log(`\n=== ID=${r.id} | Name=${r.name} ===`);
  console.log(`  scopeOfWork length: ${r.scopeOfWork?.length || 0}`);
  console.log(`  terms length: ${r.terms?.length || 0}`);
  console.log(`  party1Obligations length: ${r.party1Obligations?.length || 0}`);
  console.log(`  party2Obligations length: ${r.party2Obligations?.length || 0}`);
  console.log(`  paymentSchedule length: ${r.paymentSchedule?.length || 0}`);
  console.log(`  content length: ${r.content?.length || 0}`);
  console.log(`  notes length: ${r.notes?.length || 0}`);
  if (r.scopeOfWork) console.log(`  scopeOfWork preview: ${r.scopeOfWork.slice(0,150)}`);
  if (r.content) console.log(`  content preview: ${r.content.slice(0,150)}`);
}
process.exit(0);
