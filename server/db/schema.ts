import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  phone2: text("phone2").default(""),
  civilId: text("civil_id").default(""),
  email: text("email").default(""),
  type: text("type").notNull().default("individual"), // individual | company | heirs
  governorate: text("governorate").default(""),
  area: text("area").default(""),
  block: text("block").default(""),
  plot: text("plot").default(""),
  parcelArea: real("parcel_area").default(0),
  parcelShape: text("parcel_shape").default(""),
  parcelFacing: text("parcel_facing").default(""),
  ownershipDoc: text("ownership_doc").default(""),
  ownershipDate: text("ownership_date").default(""),
  spouseName: text("spouse_name").default(""),
  spouseCivilId: text("spouse_civil_id").default(""),
  status: text("status").notNull().default("active"), // active | completed | pending
  rating: integer("rating").default(5),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull(),
  projectType: text("project_type").default(""),
  serviceType: text("service_type").default(""),
  projectSummary: text("project_summary").default(""),
  // Issue #9 — cross-module linking
  leadId: text("lead_id").default(""),         // FK → crm_leads.id (no .references() — circular)
  totalContractsValue: real("total_contracts_value").default(0),
  totalPaid: real("total_paid").default(0),
  totalRemaining: real("total_remaining").default(0),
});

export const crmLeads = sqliteTable("crm_leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").default(""),
  type: text("type").default(""),
  source: text("source").default(""),          // whatsapp|call|instagram|referral|visit
  serviceType: text("service_type").default(""),
  governorate: text("governorate").default(""),
  area: text("area").default(""),
  likelyContract: text("likely_contract").default(""),
  expectedRevenue: text("expected_revenue").default("0"),
  probability: integer("probability").default(10),
  priority: integer("priority").default(0),
  expectedClosing: text("expected_closing").default(""),
  notes: text("notes").default(""),
  stage: text("stage").default("استفسار جديد"),
  tags: text("tags").default("[]"),
  quotations: integer("quotations").default(0),
  date: text("date").notNull(),
  civilId: text("civil_id").default(""),
  // Issue #9 — new fields
  plotNumber: text("plot_number").default(""),
  landArea: real("land_area").default(0),
  assignedTo: text("assigned_to").default(""),
});

export const quotations = sqliteTable("quotations", {
  id: text("id").primaryKey(),
  clientId: text("client_id").references(() => clients.id),
  client: text("client").notNull().default(""),
  type: text("type").notNull().default("سكن خاص"),
  service: text("service").notNull().default("بناء جديد"),
  package: text("package").default(""),
  amount: text("amount").default("0"),
  status: text("status").notNull().default("مسودة"), // مسودة|مرسل|مقبول|مرفوض|تم التعاقد|منتهي
  date: text("date").notNull(),
  civilId: text("civil_id").default(""),
  governorate: text("governorate").default(""),
  area: text("area").default(""),
  landArea: text("land_area").default(""),
  block: text("block").default(""),
  suburb: text("suburb").default(""),
  plot: text("plot").default(""),
  surveyPlan: text("survey_plan").default(""),
  projectId: text("project_id").references(() => projects.id),
  // Issue #9 — cross-module linking
  leadId: text("lead_id").default(""),         // FK → crm_leads.id
  validityDays: integer("validity_days").default(30),
  expiryDate: text("expiry_date").default(""),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  clientId: text("client_id").references(() => clients.id),
  client: text("client").notNull().default(""),
  type: text("type").notNull().default("سكن خاص"),
  serviceType: text("service_type").notNull().default("بناء جديد"),
  area: text("area").default(""),
  quotation: text("quotation").default(""),
  progress: integer("progress").notNull().default(0),
  currentPhase: integer("current_phase").notNull().default(0),
  createdAt: text("created_at").notNull(),
  // Issue #9 — cross-module linking
  contractId: text("contract_id").default(""), // FK → contracts.id (no .references() — circular)
  leadId: text("lead_id").default(""),          // FK → crm_leads.id
  status: text("status").default("جديد"),       // جديد|جارٍ|بلدية|إشراف|معلّق|مكتمل|مُقفل
});

export const contracts = sqliteTable("contracts", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id").references(() => quotations.id),
  projectId: text("project_id").references(() => projects.id),
  clientId: text("client_id").references(() => clients.id),
  client: text("client").notNull().default(""),
  template: text("template").default(""),
  type: text("type").default(""),
  service: text("service").default(""),
  package: text("package").default(""),
  status: text("status").notNull().default("مسودة"), // مسودة|نشط|معلّق|مكتمل|ملغي
  date: text("date").notNull(),
  amount: text("amount").default("0"),
  civilId: text("civil_id").default(""),
  area: text("area").default(""),
  block: text("block").default(""),
  plot: text("plot").default(""),
  // Issue #9 — new fields
  leadId: text("lead_id").default(""),          // FK → crm_leads.id
  templateType: text("template_type").default(""),
  termsText: text("terms_text").default(""),
  signingDate: text("signing_date").default(""),
  signedFileUrl: text("signed_file_url").default(""),
});

export const phases = sqliteTable("phases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phaseId: integer("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // done|in_progress|blocked|pending
  assignee: text("assignee").default(""),
  description: text("description").default(""),
  priority: integer("priority").default(0),
  deadline: text("deadline").default(""),
  order: integer("order").notNull().default(0),
  // Issue #9 — new fields
  dependsOn: integer("depends_on").default(0), // FK → tasks.id (0 = no dependency)
  autoCreated: integer("auto_created").default(0), // 0|1 boolean
  estimatedDays: integer("estimated_days").default(0),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id),
  clientId: text("client_id").references(() => clients.id),
  client: text("client").notNull().default(""),
  project: text("project").default(""),
  status: text("status").notNull().default("مسودة"), // مسودة|مرسلة|مدفوعة جزئياً|مدفوعة|متأخرة|ملغاة
  date: text("date").notNull(),
  dueDate: text("due_date").default(""),
  subtotal: real("subtotal").default(0),
  taxRate: real("tax_rate").default(15),
  taxAmount: real("tax_amount").default(0),
  total: real("total").default(0),
  notes: text("notes").default(""),
  // Issue #9 — new fields
  contractId: text("contract_id").references(() => contracts.id),
  paymentType: text("payment_type").default("other"), // first|second|third|other
  paymentMethod: text("payment_method").default(""),  // cash|transfer|knet|cheque
  invoiceNumber: text("invoice_number").default(""),  // DYN-INV-2026-001
});

export const invoiceLines = sqliteTable("invoice_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  product: text("product").notNull().default(""),
  description: text("description").default(""),
  quantity: real("quantity").default(1),
  price: real("price").default(0),
  taxPercent: real("tax_percent").default(15),
  total: real("total").default(0),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id").references(() => clients.id),
  projectId: text("project_id").references(() => projects.id),
  name: text("name").notNull(),
  category: text("category").default(""),
  status: text("status").notNull().default("pending"), // pending|received|missing
  fileName: text("file_name").default(""),
  fileSize: text("file_size").default(""),
  uploadedAt: text("uploaded_at").default(""),
  url: text("url").default(""),
});

export const contractTemplates = sqliteTable("contract_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  buildingType: text("building_type").notNull().default(""),
  serviceType: text("service_type").notNull().default(""),
  scopeOfWork: text("scope_of_work").default(""),
  terms: text("terms").default(""),
  party1Obligations: text("party1_obligations").default(""),
  party2Obligations: text("party2_obligations").default(""),
  paymentSchedule: text("payment_schedule").default(""),
  duration: text("duration").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull(),
  isDefault: integer("is_default").default(0),
});

// ── Type exports ──────────────────────────────────────────────────────────────
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Phase = typeof phases.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type CrmLead = typeof crmLeads.$inferSelect;
export type NewCrmLead = typeof crmLeads.$inferInsert;
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type NewContractTemplate = typeof contractTemplates.$inferInsert;
