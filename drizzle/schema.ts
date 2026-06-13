import {
  int, mysqlEnum, mysqlTable, text, timestamp, varchar,
  float, tinyint, bigint
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Dynamic Engineering System Tables ─────────────────────────────────────────

export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 32 }).notNull().default(""),
  phone2: varchar("phone2", { length: 32 }).default(""),
  civilId: varchar("civil_id", { length: 32 }).default(""),
  email: varchar("email", { length: 320 }).default(""),
  type: varchar("type", { length: 32 }).notNull().default("individual"),
  governorate: varchar("governorate", { length: 64 }).default(""),
  area: varchar("area", { length: 128 }).default(""),
  block: varchar("block", { length: 32 }).default(""),
  plot: varchar("plot", { length: 32 }).default(""),
  parcelArea: float("parcel_area").default(0),
  parcelShape: varchar("parcel_shape", { length: 64 }).default(""),
  parcelFacing: varchar("parcel_facing", { length: 64 }).default(""),
  ownershipDoc: varchar("ownership_doc", { length: 128 }).default(""),
  ownershipDate: varchar("ownership_date", { length: 32 }).default(""),
  spouseName: varchar("spouse_name", { length: 128 }).default(""),
  spouseCivilId: varchar("spouse_civil_id", { length: 32 }).default(""),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  rating: int("rating").default(5),
  notes: text("notes").default(""),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
  projectType: varchar("project_type", { length: 64 }).default(""),
  serviceType: varchar("service_type", { length: 64 }).default(""),
  projectSummary: text("project_summary").default(""),
  leadId: varchar("lead_id", { length: 64 }).default(""),
  totalContractsValue: float("total_contracts_value").default(0),
  totalPaid: float("total_paid").default(0),
  totalRemaining: float("total_remaining").default(0),
});

export const crmLeads = mysqlTable("crm_leads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 32 }).default(""),
  type: varchar("type", { length: 64 }).default(""),
  source: varchar("source", { length: 64 }).default(""),
  referralName: varchar("referral_name", { length: 128 }).default(""),
  serviceType: varchar("service_type", { length: 64 }).default(""),
  governorate: varchar("governorate", { length: 64 }).default(""),
  area: varchar("area", { length: 128 }).default(""),
  likelyContract: varchar("likely_contract", { length: 64 }).default(""),
  expectedRevenue: varchar("expected_revenue", { length: 32 }).default("0"),
  probability: int("probability").default(10),
  priority: int("priority").default(0),
  expectedClosing: varchar("expected_closing", { length: 32 }).default(""),
  notes: text("notes").default(""),
  stage: varchar("stage", { length: 64 }).default("استفسار جديد"),
  tags: text("tags").default("[]"),
  quotations: int("quotations").default(0),
  date: varchar("date", { length: 32 }).notNull(),
  civilId: varchar("civil_id", { length: 32 }).default(""),
  plotNumber: varchar("plot_number", { length: 32 }).default(""),
  parcelNumber: varchar("parcel_number", { length: 32 }).default(""),
  landArea: float("land_area").default(0),
  assignedTo: varchar("assigned_to", { length: 64 }).default(""),
  isArchived: tinyint("is_archived").default(0),
  archivedAt: varchar("archived_at", { length: 32 }).default(""),
  archivedReason: varchar("archived_reason", { length: 255 }).default(""),
});

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  clientId: varchar("client_id", { length: 64 }),
  client: text("client").notNull().default(""),
  type: varchar("type", { length: 64 }).notNull().default("سكن خاص"),
  serviceType: varchar("service_type", { length: 64 }).notNull().default("بناء جديد"),
  area: varchar("area", { length: 128 }).default(""),
  quotation: varchar("quotation", { length: 64 }).default(""),
  progress: int("progress").notNull().default(0),
  currentPhase: int("current_phase").notNull().default(0),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
  contractId: varchar("contract_id", { length: 64 }).default(""),
  leadId: varchar("lead_id", { length: 64 }).default(""),
  status: varchar("status", { length: 64 }).default("جديد"),
  notes: text("notes").default(""),
  notesUpdatedAt: bigint("notes_updated_at", { mode: "number" }),
});

export const contracts = mysqlTable("contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  quotationId: varchar("quotation_id", { length: 64 }),
  projectId: varchar("project_id", { length: 64 }),
  clientId: varchar("client_id", { length: 64 }),
  client: text("client").notNull().default(""),
  template: varchar("template", { length: 128 }).default(""),
  type: varchar("type", { length: 64 }).default(""),
  service: varchar("service", { length: 64 }).default(""),
  package: varchar("package", { length: 128 }).default(""),
  status: varchar("status", { length: 32 }).notNull().default("مسودة"),
  date: varchar("date", { length: 32 }).notNull(),
  amount: varchar("amount", { length: 32 }).default("0"),
  civilId: varchar("civil_id", { length: 32 }).default(""),
  area: varchar("area", { length: 128 }).default(""),
  block: varchar("block", { length: 32 }).default(""),
  plot: varchar("plot", { length: 32 }).default(""),
  leadId: varchar("lead_id", { length: 64 }).default(""),
  templateType: varchar("template_type", { length: 64 }).default(""),
  termsText: text("terms_text").default(""),
  signingDate: varchar("signing_date", { length: 32 }).default(""),
  signedFileUrl: text("signed_file_url").default(""),
});

export const quotations = mysqlTable("quotations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  clientId: varchar("client_id", { length: 64 }),
  client: text("client").notNull().default(""),
  type: varchar("type", { length: 64 }).notNull().default("سكن خاص"),
  service: varchar("service", { length: 64 }).notNull().default("بناء جديد"),
  package: varchar("package", { length: 128 }).default(""),
  amount: varchar("amount", { length: 32 }).default("0"),
  status: varchar("status", { length: 32 }).notNull().default("مسودة"),
  date: varchar("date", { length: 32 }).notNull(),
  civilId: varchar("civil_id", { length: 32 }).default(""),
  governorate: varchar("governorate", { length: 64 }).default(""),
  area: varchar("area", { length: 128 }).default(""),
  landArea: varchar("land_area", { length: 32 }).default(""),
  block: varchar("block", { length: 32 }).default(""),
  suburb: varchar("suburb", { length: 64 }).default(""),
  plot: varchar("plot", { length: 32 }).default(""),
  surveyPlan: varchar("survey_plan", { length: 128 }).default(""),
  projectId: varchar("project_id", { length: 64 }),
  leadId: varchar("lead_id", { length: 64 }).default(""),
  validityDays: int("validity_days").default(30),
  expiryDate: varchar("expiry_date", { length: 32 }).default(""),
  featuresJson: text("features_json").default(""), // JSON array of custom features
});

export const phases = mysqlTable("phases", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  order: int("order").notNull().default(0),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  phaseId: int("phase_id").notNull(),
  name: text("name").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  assignee: varchar("assignee", { length: 128 }).default(""),
  description: text("description").default(""),
  priority: int("priority").default(0),
  deadline: varchar("deadline", { length: 32 }).default(""),
  order: int("order").notNull().default(0),
  dependsOn: int("depends_on").default(0),
  autoCreated: tinyint("auto_created").default(0),
  estimatedDays: int("estimated_days").default(0),
});

export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("project_id", { length: 64 }),
  clientId: varchar("client_id", { length: 64 }),
  client: text("client").notNull().default(""),
  project: text("project").default(""),
  status: varchar("status", { length: 32 }).notNull().default("مسودة"),
  date: varchar("date", { length: 32 }).notNull(),
  dueDate: varchar("due_date", { length: 32 }).default(""),
  subtotal: float("subtotal").default(0),
  taxRate: float("tax_rate").default(15),
  taxAmount: float("tax_amount").default(0),
  total: float("total").default(0),
  notes: text("notes").default(""),
  contractId: varchar("contract_id", { length: 64 }),
  paymentType: varchar("payment_type", { length: 32 }).default("other"),
  paymentMethod: varchar("payment_method", { length: 32 }).default(""),
  invoiceNumber: varchar("invoice_number", { length: 64 }).default(""),
});

export const invoiceLines = mysqlTable("invoice_lines", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoice_id", { length: 64 }).notNull(),
  product: text("product").notNull().default(""),
  description: text("description").default(""),
  quantity: float("quantity").default(1),
  price: float("price").default(0),
  taxPercent: float("tax_percent").default(15),
  total: float("total").default(0),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 64 }),
  projectId: varchar("project_id", { length: 64 }),
  name: text("name").notNull(),
  category: varchar("category", { length: 64 }).default(""),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  fileName: varchar("file_name", { length: 256 }).default(""),
  fileSize: varchar("file_size", { length: 32 }).default(""),
  uploadedAt: varchar("uploaded_at", { length: 32 }).default(""),
  url: text("url").default(""),
  mimeType: varchar("mime_type", { length: 128 }).default(""),
  fileExtension: varchar("file_extension", { length: 16 }).default(""),
});

export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  leadId: varchar("lead_id", { length: 64 }),
  clientId: varchar("client_id", { length: 64 }),
  clientName: text("client_name").notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  time: varchar("time", { length: 16 }).notNull().default(""),
  clientPhone: varchar("client_phone", { length: 32 }).default(""),
  reason: varchar("reason", { length: 128 }).notNull().default(""),
  assignedTo: varchar("assigned_to", { length: 128 }).default(""),
  notes: text("notes").default(""),
  status: varchar("status", { length: 32 }).notNull().default("scheduled"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

// ── Project Briefs (نموذج طلبات المشروع) ──────────────────────────────────────
export const projectBriefs = mysqlTable("project_briefs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  // بيانات المالك
  ownerName: text("owner_name").default(""),
  ownerPhone: varchar("owner_phone", { length: 32 }).default(""),
  // بيانات القسيمة
  governorate: varchar("governorate", { length: 64 }).default(""),
  area: varchar("area", { length: 128 }).default(""),
  block: varchar("block", { length: 32 }).default(""),
  plot: varchar("plot", { length: 32 }).default(""),
  autoNumber: varchar("auto_number", { length: 32 }).default(""),
  plotArea: varchar("plot_area", { length: 32 }).default(""),
  plotShape: varchar("plot_shape", { length: 64 }).default(""),
  northDirection: varchar("north_direction", { length: 32 }).default(""),
  // الطابع المعماري
  architecturalStyle: varchar("architectural_style", { length: 64 }).default(""),
  floorsCount: int("floors_count").default(0),
  // تفاصيل الأدوار (JSON)
  floorsDetails: text("floors_details").default("[]"),
  // الكروكي (Canvas data URL)
  sketchData: text("sketch_data").default(""),
  // ملاحظات
  notes: text("notes").default(""),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
  updatedAt: varchar("updated_at", { length: 32 }).default(""),
});

// ── Phase Meta (حالة المراحل الفرعية) ──────────────────────────────────────────
export const phaseMeta = mysqlTable("phase_meta", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  phaseKey: varchar("phase_key", { length: 64 }).notNull(),
  data: text("data").default("{}"),
  updatedAt: varchar("updated_at", { length: 32 }).default(""),
});

// ── Project Meetings (جلسات التصميم) ──────────────────────────────────────────
export const projectMeetings = mysqlTable("project_meetings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  attendees: text("attendees").default("[]"),
  agreed: text("agreed").default("[]"),
  changes: text("changes").default(""),
  status: varchar("status", { length: 32 }).default("pending"),
  notes: text("notes").default(""),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

// ── Work Plans (خطط العمل المركزية) ──────────────────────────────────────────
export const workPlans = mysqlTable("work_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  projectType: varchar("project_type", { length: 64 }).notNull().default(""),
  serviceType: varchar("service_type", { length: 64 }).default(""),
  description: text("description").default(""),
  isDefault: tinyint("is_default").default(0),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const workPlanPhases = mysqlTable("work_plan_phases", {
  id: int("id").autoincrement().primaryKey(),
  workPlanId: int("work_plan_id").notNull(),
  order: int("order").notNull().default(0),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
});

export const workPlanTasks = mysqlTable("work_plan_tasks", {
  id: int("id").autoincrement().primaryKey(),
  workPlanPhaseId: int("work_plan_phase_id").notNull(),
  order: int("order").notNull().default(0),
  name: text("name").notNull(),
  assignee: varchar("assignee", { length: 128 }).default(""),
  estimatedDays: int("estimated_days").default(0),
  description: text("description").default(""),
});

export const contractTemplates = mysqlTable("contract_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  buildingType: varchar("building_type", { length: 64 }).notNull().default(""),
  serviceType: varchar("service_type", { length: 64 }).notNull().default(""),
  scopeOfWork: text("scope_of_work").default(""),
  terms: text("terms").default(""),
  party1Obligations: text("party1_obligations").default(""),
  party2Obligations: text("party2_obligations").default(""),
  paymentSchedule: text("payment_schedule").default(""),
  duration: varchar("duration", { length: 64 }).default(""),
  notes: text("notes").default(""),
  content: text("content").default(""),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
  isDefault: tinyint("is_default").default(0),
});

// ── Employees / Staff Accounts ─────────────────────────────────────────────────
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: mysqlEnum("emp_role", [
    "admin",
    "accountant",
    "architect",
    "secretary",
    "structural",
    "draftsman",
    "facade_designer",
  ]).notNull().default("draftsman"),
  specialty: varchar("specialty", { length: 128 }).default(""),
  isActive: tinyint("is_active").notNull().default(1),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export const employeeSessions = mysqlTable("employee_sessions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  employeeId: int("employee_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Supervision Visit Reports ──────────────────────────────────────────────────
export const supervisionVisits = mysqlTable("supervision_visits", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  phaseId: int("phase_id").notNull(),
  visitDate: varchar("visit_date", { length: 32 }).notNull(),
  visitNumber: int("visit_number").notNull().default(1),
  constructionStage: varchar("construction_stage", { length: 128 }).notNull(),
  engineerName: varchar("engineer_name", { length: 128 }).default(""),
  contractorName: varchar("contractor_name", { length: 128 }).default(""),
  contractorPhone: varchar("contractor_phone", { length: 32 }).default(""),
  ownerName: varchar("owner_name", { length: 128 }).default(""),
  location: varchar("location", { length: 256 }).default(""),
  licenseNumber: varchar("license_number", { length: 64 }).default(""),
  stageKey: varchar("stage_key", { length: 64 }).default(""),
  generalNotes: text("general_notes").default(""),
  checklistData: text("checklist_data").notNull().default("{}"),
  itemNotes: text("item_notes").default("{}"),
  photoUrls: text("photo_urls").default("[]"),
  visitStatus: mysqlEnum("visit_status_v2", ["draft", "in_progress", "completed", "approved"]).notNull().default("in_progress"),
  status: mysqlEnum("visit_status", ["draft", "completed", "approved"]).notNull().default("draft"),
  pdfUrl: varchar("pdf_url", { length: 512 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SupervisionVisit = typeof supervisionVisits.$inferSelect;
export type InsertSupervisionVisit = typeof supervisionVisits.$inferInsert;

// ── Detailed Drawings (Electrical / Plumbing) ─────────────────────────────────
export const detailedDrawings = mysqlTable("detailed_drawings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  phaseId: int("phase_id").notNull(),
  drawingType: varchar("drawing_type", { length: 64 }).notNull(),
  assignedTo: varchar("assigned_to", { length: 128 }).default(""),
  assignedEmployeeId: int("assigned_employee_id"),
  status: mysqlEnum("drawing_status", ["pending", "in_progress", "completed", "approved"]).notNull().default("pending"),
  fileUrl: varchar("file_url", { length: 512 }).default(""),
  fileKey: varchar("file_key", { length: 256 }).default(""),
  notes: text("notes").default(""),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type DetailedDrawing = typeof detailedDrawings.$inferSelect;
export type InsertDetailedDrawing = typeof detailedDrawings.$inferInsert;

// ── Municipality Submission ────────────────────────────────────────────────────
export const municipalitySubmissions = mysqlTable("municipality_submissions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  phaseId: int("phase_id").notNull(),
  submittedAt: varchar("submitted_at", { length: 32 }).default(""),
  submittedBy: varchar("submitted_by", { length: 128 }).default(""),
  referenceNumber: varchar("reference_number", { length: 64 }).default(""),
  licenseReceivedAt: varchar("license_received_at", { length: 32 }).default(""),
  licenseNumber: varchar("license_number", { length: 64 }).default(""),
  licenseFileUrl: varchar("license_file_url", { length: 512 }).default(""),
  approvedPlanUrl: varchar("approved_plan_url", { length: 512 }).default(""),
  notes: text("notes").default(""),
  status: mysqlEnum("muni_status", ["not_submitted", "submitted", "license_received"]).notNull().default("not_submitted"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type MunicipalitySubmission = typeof municipalitySubmissions.$inferSelect;
export type InsertMunicipalitySubmission = typeof municipalitySubmissions.$inferInsert;

// ── Employee Notifications (إشعارات الموظفين) ─────────────────────────────────
export const employeeNotifications = mysqlTable("employee_notifications", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").default(""),
  relatedId: int("related_id"),
  isRead: tinyint("is_read").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type EmployeeNotification = typeof employeeNotifications.$inferSelect;
export type InsertEmployeeNotification = typeof employeeNotifications.$inferInsert;

// ── Packages (الباقات) ─────────────────────────────────────────────────────────
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  price: varchar("price", { length: 32 }).notNull(),
  buildingType: varchar("building_type", { length: 64 }).notNull(),
  serviceType: varchar("service_type", { length: 64 }).notNull(),
  level: varchar("level", { length: 64 }).notNull().default("-"),
  features: text("features").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;
