import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { clients, projects, phases, tasks, quotations, contracts, invoices, invoiceLines, crmLeads, documents, contractTemplates } from "./schema.js";
import { eq } from "drizzle-orm";
import * as schema from "./schema.js";

export function seedDatabase(db: BetterSQLite3Database<typeof schema>) {
  const existingClients = db.select().from(clients).limit(1).all();
  if (existingClients.length === 0) {
    seedClientsAndProjects(db);
  }

  const existingContracts = db.select().from(contracts).limit(1).all();
  if (existingContracts.length === 0) {
    seedContractsAndInvoices(db);
  }

  const existingLeads = db.select().from(crmLeads).limit(1).all();
  if (existingLeads.length === 0) {
    seedCrmLeads(db);
  }

  const existingDocuments = db.select().from(documents).limit(1).all();
  if (existingDocuments.length === 0) {
    seedDocuments(db);
  }

  const existingTemplates = db.select().from(contractTemplates).limit(1).all();
  if (existingTemplates.length === 0) {
    seedContractTemplates(db);
  }
}

function seedClientsAndProjects(db: BetterSQLite3Database<typeof schema>) {

  // ── Clients ────────────────────────────────────────────────────────────
  const seedClients = [
    {
      id: "C001", name: "فهد عبدالله العتيبي", phone: "96650001111", phone2: "96550001112",
      civilId: "291010101010", email: "fahad@example.com", type: "individual" as const,
      area: "خيطان", block: "3", plot: "45", parcelArea: 400, parcelShape: "مستطيل",
      parcelFacing: "شمال", ownershipDoc: "طابو", ownershipDate: "2018-03-15",
      spouseName: "نورة العتيبي", spouseCivilId: "291020202020",
      status: "active" as const, rating: 5, notes: "عميل VIP", createdAt: "2024-01-10",
      projectType: "سكن خاص", serviceType: "بناء جديد",
      leadId: "L001", totalContractsValue: 2200, totalPaid: 2200, totalRemaining: 0,
    },
    {
      id: "C002", name: "محمد يوسف الرشيدي", phone: "96650002222", phone2: "",
      civilId: "285030303030", email: "mohammed@example.com", type: "individual" as const,
      area: "الفروانية", block: "7", plot: "12", parcelArea: 375, parcelShape: "مربع",
      parcelFacing: "جنوب", ownershipDoc: "طابو", ownershipDate: "2020-06-20",
      spouseName: "", spouseCivilId: "", status: "active" as const, rating: 4,
      notes: "", createdAt: "2024-02-15", projectType: "سكن خاص", serviceType: "تعديل وإضافة",
      leadId: "", totalContractsValue: 500, totalPaid: 50, totalRemaining: 450,
    },
    {
      id: "C003", name: "ورثة عبدالحميد خميس الخميس", phone: "96650003333", phone2: "",
      civilId: "265040404040", email: "", type: "heirs" as const,
      area: "القادسية", block: "2", plot: "88", parcelArea: 500, parcelShape: "مستطيل",
      parcelFacing: "شرق", ownershipDoc: "حكم محكمة", ownershipDate: "2015-11-30",
      spouseName: "", spouseCivilId: "", status: "active" as const, rating: 3,
      notes: "ملف الورثة يحتاج توثيق", createdAt: "2024-03-01",
      projectType: "استثماري", serviceType: "بناء جديد",
      leadId: "", totalContractsValue: 0, totalPaid: 0, totalRemaining: 0,
    },
    {
      id: "C004", name: "شركة الخليج للتطوير العقاري", phone: "96522334455", phone2: "",
      civilId: "205050505050", email: "info@khaleej-dev.com", type: "company" as const,
      area: "الشويخ الصناعي", block: "1", plot: "33", parcelArea: 2000, parcelShape: "مستطيل",
      parcelFacing: "غرب", ownershipDoc: "طابو تجاري", ownershipDate: "2019-08-10",
      spouseName: "", spouseCivilId: "", status: "active" as const, rating: 4,
      notes: "شركة كبيرة - متعددة المشاريع", createdAt: "2024-01-05",
      projectType: "تجاري", serviceType: "بناء جديد",
      leadId: "L004", totalContractsValue: 2000, totalPaid: 1050, totalRemaining: 950,
    },
    {
      id: "C005", name: "عبدالله سرحان فلاح اليبسلي", phone: "96650005555", phone2: "",
      civilId: "278060606060", email: "abdallah@example.com", type: "individual" as const,
      area: "ضاحية صباح السالم", block: "5", plot: "101", parcelArea: 450, parcelShape: "مربع",
      parcelFacing: "شمال شرق", ownershipDoc: "طابو", ownershipDate: "2021-02-14",
      spouseName: "", spouseCivilId: "", status: "completed" as const, rating: 5,
      notes: "مشروع منجز", createdAt: "2023-06-01",
      projectType: "سكن خاص", serviceType: "بناء جديد",
      leadId: "", totalContractsValue: 250, totalPaid: 250, totalRemaining: 0,
    },
  ];
  db.insert(clients).values(seedClients).run();

  // ── Projects + Phases + Tasks ──────────────────────────────────────────
  const seedProjects = [
    {
      id: "S00048", name: "بناء جديد سكن خاص - العتيبي", clientId: "C001",
      client: "فهد العتيبي", type: "سكن خاص", serviceType: "بناء جديد",
      area: "الجهراء", quotation: "S00048", progress: 55, currentPhase: 3,
      createdAt: "2024-09-01", contractId: "CON-2026-002", leadId: "L001", status: "جارٍ",
    },
    {
      id: "S00049", name: "بناء جديد تجاري - الخليج", clientId: "C004",
      client: "شركة الخليج", type: "تجاري", serviceType: "بناء جديد",
      area: "حولي", quotation: "S00049", progress: 30, currentPhase: 1,
      createdAt: "2024-10-15", contractId: "CON-2026-003", leadId: "L004", status: "جارٍ",
    },
    {
      id: "S00047", name: "تعديل وإضافة سكن خاص - مشرف", clientId: "C002",
      client: "تهاني خالد", type: "سكن خاص", serviceType: "تعديل وإضافة",
      area: "مشرف - حولي", quotation: "S00047", progress: 15, currentPhase: 0,
      createdAt: "2025-01-10", contractId: "CON-2026-001", leadId: "", status: "جديد",
    },
    {
      id: "S00050", name: "تعديل سكن خاص - السالمية", clientId: "C002",
      client: "سالم المطيري", type: "سكن خاص", serviceType: "تعديل",
      area: "السالمية - حولي", quotation: "S00050", progress: 40, currentPhase: 1,
      createdAt: "2024-11-20", contractId: "", leadId: "", status: "جارٍ",
    },
    {
      id: "S00045", name: "فيلا - صباح الأحمد", clientId: "C005",
      client: "خالد الرشيدي", type: "سكن خاص", serviceType: "بناء جديد",
      area: "صباح الأحمد", quotation: "S00045", progress: 90, currentPhase: 4,
      createdAt: "2023-08-01", contractId: "CON-2023-001", leadId: "", status: "إشراف",
    },
  ];
  db.insert(projects).values(seedProjects).run();

  // Phases for S00048
  const s48p1 = db.insert(phases).values({ projectId: "S00048", order: 0, title: "تجهيز الملف" }).returning().get();
  const s48p2 = db.insert(phases).values({ projectId: "S00048", order: 1, title: "التصميم" }).returning().get();
  const s48p3 = db.insert(phases).values({ projectId: "S00048", order: 2, title: "البلدية والاعتماد" }).returning().get();
  const s48p4 = db.insert(phases).values({ projectId: "S00048", order: 3, title: "الكراسة والمخططات", subtitle: "المخططات الإنشائية والخدمات" }).returning().get();
  const s48p5 = db.insert(phases).values({ projectId: "S00048", order: 4, title: "الإشراف" }).returning().get();

  db.insert(tasks).values([
    { phaseId: s48p1.id, order: 0, name: "تصميم الكروكي", status: "done", assignee: "م. مصطفى", estimatedDays: 2 },
    { phaseId: s48p1.id, order: 1, name: "تجميع المستندات", status: "done", assignee: "محمد ثروت", estimatedDays: 3 },
    { phaseId: s48p1.id, order: 2, name: "العقد والدفعة الأولى", status: "done", assignee: "الإدارة", estimatedDays: 1 },
    { phaseId: s48p1.id, order: 3, name: "نماذج البلدية", status: "done", assignee: "محمد ثروت", estimatedDays: 2 },
    { phaseId: s48p1.id, order: 4, name: "تقرير التربة", status: "done", assignee: "م. خالد", estimatedDays: 7 },
    { phaseId: s48p2.id, order: 0, name: "تصميم الأعمدة والحوائل", status: "done", assignee: "م. مصطفى", estimatedDays: 5 },
    { phaseId: s48p2.id, order: 1, name: "تصميم الواجهات", status: "done", assignee: "م. مصطفى", estimatedDays: 5 },
    { phaseId: s48p2.id, order: 2, name: "مخطط البلدية", status: "done", assignee: "م. مصطفى", estimatedDays: 3 },
    { phaseId: s48p3.id, order: 0, name: "تقديم بلدية", status: "done", assignee: "محمد ثروت", estimatedDays: 1 },
    { phaseId: s48p3.id, order: 1, name: "الحصول على موافقة البلدية", status: "done", assignee: "محمد ثروت", estimatedDays: 30 },
    { phaseId: s48p3.id, order: 2, name: "دفع رسوم البلدية", status: "done", assignee: "الإدارة", estimatedDays: 1 },
    { phaseId: s48p4.id, order: 0, name: "التصميم الإنشائي", status: "in_progress", assignee: "م. خالد", description: "حسابات الأحمال والكمرات", estimatedDays: 14 },
    { phaseId: s48p4.id, order: 1, name: "التصميم الصحي", status: "pending", assignee: "م. علي", estimatedDays: 7, autoCreated: 1 },
    { phaseId: s48p4.id, order: 2, name: "التصميم الكهربائي", status: "pending", assignee: "م. أحمد", estimatedDays: 7, autoCreated: 1 },
    { phaseId: s48p4.id, order: 3, name: "تصميم الفراغات الداخلية", status: "pending", assignee: "م. مصطفى", estimatedDays: 10 },
    { phaseId: s48p5.id, order: 0, name: "إصدار خطاب إشراف", status: "pending", assignee: "الإدارة", estimatedDays: 2 },
    { phaseId: s48p5.id, order: 1, name: "الإشراف الميداني", status: "pending", assignee: "م. خالد", estimatedDays: 90 },
    { phaseId: s48p5.id, order: 2, name: "خطابات البنك", status: "pending", assignee: "الإدارة", estimatedDays: 5 },
    { phaseId: s48p5.id, order: 3, name: "شهادة الإنجاز", status: "pending", assignee: "م. مصطفى", estimatedDays: 3 },
  ]).run();

  // Phases for S00047
  const s47p1 = db.insert(phases).values({ projectId: "S00047", order: 0, title: "تجهيز الملف" }).returning().get();
  const s47p2 = db.insert(phases).values({ projectId: "S00047", order: 1, title: "التصميم" }).returning().get();
  db.insert(phases).values({ projectId: "S00047", order: 2, title: "البلدية" }).run();
  db.insert(phases).values({ projectId: "S00047", order: 3, title: "المخططات التفصيلية" }).run();

  db.insert(tasks).values([
    { phaseId: s47p1.id, order: 0, name: "تصميم الكروكي", status: "done", assignee: "م. مصطفى" },
    { phaseId: s47p1.id, order: 1, name: "تجميع المستندات", status: "in_progress", assignee: "محمد ثروت" },
    { phaseId: s47p1.id, order: 2, name: "العقد والدفعة الأولى", status: "pending", assignee: "الإدارة" },
    { phaseId: s47p2.id, order: 0, name: "مخطط التعديل", status: "blocked", assignee: "م. مصطفى" },
    { phaseId: s47p2.id, order: 1, name: "مخطط الإضافة", status: "blocked", assignee: "م. مصطفى" },
  ]).run();

  // Phases for S00045
  const s45p1 = db.insert(phases).values({ projectId: "S00045", order: 0, title: "تجهيز الملف" }).returning().get();
  const s45p2 = db.insert(phases).values({ projectId: "S00045", order: 1, title: "التصميم" }).returning().get();
  const s45p3 = db.insert(phases).values({ projectId: "S00045", order: 2, title: "البلدية" }).returning().get();
  const s45p4 = db.insert(phases).values({ projectId: "S00045", order: 3, title: "المخططات" }).returning().get();
  const s45p5 = db.insert(phases).values({ projectId: "S00045", order: 4, title: "الإشراف" }).returning().get();

  db.insert(tasks).values([
    { phaseId: s45p1.id, order: 0, name: "تصميم الكروكي", status: "done" },
    { phaseId: s45p1.id, order: 1, name: "تجميع المستندات", status: "done" },
    { phaseId: s45p2.id, order: 0, name: "التصميم المعماري", status: "done" },
    { phaseId: s45p2.id, order: 1, name: "تصميم الواجهات", status: "done" },
    { phaseId: s45p3.id, order: 0, name: "تقديم بلدية", status: "done" },
    { phaseId: s45p3.id, order: 1, name: "الاعتماد", status: "done" },
    { phaseId: s45p4.id, order: 0, name: "التصميم الإنشائي", status: "done" },
    { phaseId: s45p4.id, order: 1, name: "مخططات الخدمات", status: "done" },
    { phaseId: s45p5.id, order: 0, name: "الإشراف الميداني", status: "in_progress" },
    { phaseId: s45p5.id, order: 1, name: "شهادة الإنجاز", status: "pending" },
  ]).run();

  // ── Quotations ─────────────────────────────────────────────────────────
  db.insert(quotations).values([
    { id: "S00047", clientId: "C002", client: "تهاني خالد", type: "سكن خاص", service: "تعديل وإضافة", package: "باقة تعديل وإضافة", amount: "500", status: "مقبول", date: "2025-01-08", civilId: "291010101010", governorate: "العاصمة", area: "مشرف", landArea: "400م²", block: "6", suburb: "مشرف", plot: "77", surveyPlan: "م/2024/07", projectId: "S00047", leadId: "", validityDays: 30, expiryDate: "2025-02-08" },
    { id: "S00048", clientId: "C001", client: "فهد العتيبي", type: "سكن خاص", service: "بناء جديد", package: "الباقة الذهبية", amount: "2200", status: "مرسل", date: "2024-09-01", civilId: "291010101010", governorate: "الجهراء", area: "الجهراء", landArea: "400م²", block: "3", suburb: "خيطان", plot: "45", surveyPlan: "م/2024/09", projectId: "S00048", leadId: "L001", validityDays: 30, expiryDate: "2024-10-01" },
    { id: "S00049", clientId: "C004", client: "شركة الخليج", type: "تجاري", service: "بناء جديد", package: "الباقة الأساسية", amount: "2000", status: "مسودة", date: "2024-10-15", civilId: "205050505050", governorate: "حولي", area: "حولي", landArea: "2000م²", block: "1", suburb: "الشويخ", plot: "33", surveyPlan: "م/2024/10", projectId: "S00049", leadId: "L004", validityDays: 45, expiryDate: "2024-11-30" },
    { id: "S00050", clientId: "C002", client: "سالم المطيري", type: "سكن خاص", service: "تعديل", package: "باقة تعديل", amount: "500", status: "مرسل", date: "2024-11-20", civilId: "285030303030", governorate: "حولي", area: "السالمية", landArea: "375م²", block: "7", suburb: "السالمية", plot: "12", surveyPlan: "م/2024/11", projectId: "S00050", leadId: "", validityDays: 30, expiryDate: "2024-12-20" },
    { id: "S00051", clientId: "C001", client: "فهد العتيبي", type: "سكن خاص", service: "بناء جديد", package: "الباقة المميزة", amount: "1600", status: "مرفوض", date: "2025-02-01", civilId: "291010101010", governorate: "الكويت", area: "الروضة", landArea: "300م²", block: "4", suburb: "الروضة", plot: "20", surveyPlan: "م/2025/02", projectId: null, leadId: "", validityDays: 30, expiryDate: "2025-03-01" },
    { id: "S00046", clientId: "C005", client: "عبدالله اليبسلي", type: "سكن خاص", service: "هدم", package: "باقة الهدم", amount: "250", status: "عقد", date: "2023-06-01", civilId: "278060606060", governorate: "مبارك الكبير", area: "صباح السالم", landArea: "450م²", block: "5", suburb: "ضاحية صباح السالم", plot: "101", surveyPlan: "م/2023/06", projectId: "S00045", leadId: "", validityDays: 30, expiryDate: "2023-07-01" },
  ]).run();
}

function seedContractsAndInvoices(db: BetterSQLite3Database<typeof schema>) {
  // ── Contracts ───────────────────────────────────────────────────────────
  db.insert(contracts).values([
    {
      id: "CON-2026-001", quotationId: "S00047", projectId: "S00047", clientId: "C002",
      client: "تهاني خالد", template: "عقد تعديل وإضافة - سكن خاص",
      type: "سكن خاص", service: "تعديل وإضافة", package: "الأساسية",
      status: "موقع", date: "2025-01-10", amount: "500",
      civilId: "285030303030", area: "مشرف", block: "6", plot: "77",
      leadId: "", templateType: "تعديل", termsText: "", signingDate: "2025-01-10",
    },
    {
      id: "CON-2026-002", quotationId: "S00048", projectId: "S00048", clientId: "C001",
      client: "فهد العتيبي", template: "عقد بناء جديد - سكن خاص - الباقة الذهبية",
      type: "سكن خاص", service: "بناء جديد", package: "الذهبية",
      status: "نشط", date: "2024-09-05", amount: "2200",
      civilId: "291010101010", area: "الجهراء", block: "3", plot: "45",
      leadId: "L001", templateType: "بناء جديد", termsText: "", signingDate: "2024-09-05",
    },
    {
      id: "CON-2026-003", quotationId: "S00049", projectId: "S00049", clientId: "C004",
      client: "شركة الخليج", template: "عقد بناء جديد - تجاري",
      type: "تجاري", service: "بناء جديد", package: "-",
      status: "مسودة", date: "2024-10-20", amount: "2000",
      civilId: "205050505050", area: "حولي", block: "1", plot: "33",
      leadId: "L004", templateType: "بناء جديد", termsText: "", signingDate: "",
    },
    {
      id: "CON-2023-001", quotationId: "S00046", projectId: "S00045", clientId: "C005",
      client: "عبدالله اليبسلي", template: "عقد هدم - سكن خاص",
      type: "سكن خاص", service: "هدم", package: "-",
      status: "مكتمل", date: "2023-06-05", amount: "250",
      civilId: "278060606060", area: "صباح السالم", block: "5", plot: "101",
      leadId: "", templateType: "هدم", termsText: "", signingDate: "2023-06-05",
    },
  ]).run();

  // ── Invoices ────────────────────────────────────────────────────────────
  const inv1 = db.insert(invoices).values({
    id: "INV/2025/00001", projectId: "S00047", clientId: "C002",
    client: "تهاني خالد", project: "S00047",
    status: "مرحّلة", date: "2025-01-10", dueDate: "2025-02-10",
    subtotal: 50, taxRate: 15, taxAmount: 7.5, total: 57.5,
    contractId: "CON-2026-001", paymentType: "first", paymentMethod: "transfer",
    invoiceNumber: "DYN-INV-2025-001",
  }).returning().get();
  db.insert(invoiceLines).values({
    invoiceId: inv1.id, product: "رسوم فتح ملف",
    description: "رسوم فتح ملف وتصميم مبدئي", quantity: 1, price: 50, taxPercent: 15, total: 57.5,
  }).run();

  const inv2 = db.insert(invoices).values({
    id: "INV/2024/00001", projectId: "S00045", clientId: "C005",
    client: "عبدالله اليبسلي", project: "S00045",
    status: "مدفوعة", date: "2023-06-10", dueDate: "2023-07-10",
    subtotal: 250, taxRate: 15, taxAmount: 37.5, total: 287.5,
    contractId: "CON-2023-001", paymentType: "first", paymentMethod: "cash",
    invoiceNumber: "DYN-INV-2023-001",
  }).returning().get();
  db.insert(invoiceLines).values({
    invoiceId: inv2.id, product: "باقة الهدم - سكن خاص",
    description: "باقة الهدم - سكن خاص", quantity: 1, price: 250, taxPercent: 15, total: 287.5,
  }).run();

  const inv3 = db.insert(invoices).values({
    id: "INV/2024/00002", projectId: "S00048", clientId: "C001",
    client: "فهد العتيبي", project: "S00048",
    status: "غير مدفوعة", date: "2024-09-10", dueDate: "2024-10-10",
    subtotal: 2200, taxRate: 15, taxAmount: 330, total: 2530,
    contractId: "CON-2026-002", paymentType: "first", paymentMethod: "transfer",
    invoiceNumber: "DYN-INV-2024-001",
  }).returning().get();
  db.insert(invoiceLines).values({
    invoiceId: inv3.id, product: "الباقة الذهبية - سكن خاص",
    description: "الباقة الذهبية - سكن خاص - دفعة أولى", quantity: 1, price: 2200, taxPercent: 15, total: 2530,
  }).run();

  const inv4 = db.insert(invoices).values({
    id: "INV/2024/00003", projectId: "S00049", clientId: "C004",
    client: "شركة الخليج", project: "S00049",
    status: "متأخرة", date: "2024-10-25", dueDate: "2024-11-10",
    subtotal: 1050, taxRate: 15, taxAmount: 157.5, total: 1207.5,
    contractId: "CON-2026-003", paymentType: "first", paymentMethod: "knet",
    invoiceNumber: "DYN-INV-2024-002",
  }).returning().get();
  db.insert(invoiceLines).values([
    { invoiceId: inv4.id, product: "رسوم فتح ملف", description: "رسوم فتح ملف", quantity: 1, price: 50, taxPercent: 15, total: 57.5 },
    { invoiceId: inv4.id, product: "الباقة الأساسية - تجاري", description: "الباقة الأساسية - تجاري - دفعة أولى", quantity: 1, price: 1000, taxPercent: 15, total: 1150 },
  ]).run();
}

function seedCrmLeads(db: BetterSQLite3Database<typeof schema>) {
  const now = "2026-05-11";
  db.insert(crmLeads).values([
    {
      id: "L001", name: "سعود المطيري", phone: "96650011122",
      type: "سكن خاص", source: "واتساب", serviceType: "بناء جديد",
      governorate: "الجهراء", area: "الجهراء",
      likelyContract: "عقد بناء جديد - سكن خاص - الباقة الأساسية",
      expectedRevenue: "1500", probability: 70, priority: 2,
      expectedClosing: "2026-06-01", stage: "عرض سعر مرسل",
      tags: JSON.stringify(["VIP", "سكن خاص"]),
      quotations: 1, date: now, civilId: "291070707070",
      notes: "مهتم بالباقة الأساسية، ينتظر الموافقة",
      plotNumber: "45", landArea: 400, assignedTo: "م. مصطفى",
    },
    {
      id: "L002", name: "خالد الشمري", phone: "96650022233",
      type: "استثماري", source: "إحالة عميل", serviceType: "بناء جديد",
      governorate: "حولي", area: "السالمية",
      likelyContract: "عقد بناء جديد - استثماري",
      expectedRevenue: "2000", probability: 85, priority: 3,
      expectedClosing: "2026-05-20", stage: "بانتظار التعاقد",
      tags: JSON.stringify(["استثماري", "إحالة"]),
      quotations: 1, date: now, civilId: "285080808080",
      notes: "عميل محال من فهد العتيبي — مشروع استثماري في السالمية",
      plotNumber: "12", landArea: 375, assignedTo: "م. خالد",
    },
    {
      id: "L003", name: "نورة العنزي", phone: "96550033344",
      type: "سكن خاص", source: "انستغرام", serviceType: "تعديل وإضافة",
      governorate: "مبارك الكبير", area: "أبو فطيرة",
      likelyContract: "عقد تعديل وإضافة - سكن خاص",
      expectedRevenue: "500", probability: 40, priority: 1,
      expectedClosing: "2026-07-01", stage: "تم التواصل",
      tags: JSON.stringify(["سكن خاص", "تعديل"]),
      quotations: 0, date: now, civilId: "278090909090",
      notes: "تريد إضافة طابق علوي — تنتظر تقدير التكلفة",
      plotNumber: "88", landArea: 500, assignedTo: "م. مصطفى",
    },
    {
      id: "L004", name: "شركة البناء الذهبي", phone: "96522445566",
      type: "تجاري", source: "موقع إلكتروني", serviceType: "بناء جديد",
      governorate: "العاصمة", area: "الشويخ الصناعي",
      likelyContract: "عقد بناء جديد - تجاري",
      expectedRevenue: "2000", probability: 55, priority: 2,
      expectedClosing: "2026-08-15", stage: "استفسار جديد",
      tags: JSON.stringify(["تجاري", "شركة"]),
      quotations: 0, date: now, civilId: "205101010100",
      notes: "شركة تبحث عن مكتب هندسي لمشروع مستودع تجاري",
      plotNumber: "33", landArea: 2000, assignedTo: "م. خالد",
    },
  ]).run();
}

function seedDocuments(db: BetterSQLite3Database<typeof schema>) {
  const now = new Date().toISOString();
  db.insert(documents).values([
    {
      clientId: "C001", projectId: "S00048",
      name: "رخصة بناء - فهد العتيبي",
      category: "نماذج البلدية", status: "received",
      fileName: "license_C001.pdf", fileSize: "1.2 MB",
      uploadedAt: now, url: "",
    },
    {
      clientId: "C001", projectId: "S00048",
      name: "المخططات المعمارية - الدور الأرضي",
      category: "المعماري", status: "received",
      fileName: "arch_ground_S00048.pdf", fileSize: "3.8 MB",
      uploadedAt: now, url: "",
    },
    {
      clientId: "C001", projectId: "S00048",
      name: "المخططات الإنشائية",
      category: "الإنشائي", status: "pending",
      fileName: "", fileSize: "",
      uploadedAt: "", url: "",
    },
    {
      clientId: "C002", projectId: "S00047",
      name: "صك الملكية - الرشيدي",
      category: "العميل", status: "received",
      fileName: "deed_C002.pdf", fileSize: "0.8 MB",
      uploadedAt: now, url: "",
    },
    {
      clientId: "C004", projectId: "S00049",
      name: "مخطط الواجهات - المبنى التجاري",
      category: "الواجهات", status: "received",
      fileName: "facade_S00049.dwg", fileSize: "5.4 MB",
      uploadedAt: now, url: "",
    },
    {
      clientId: "C001", projectId: "S00048",
      name: "مخطط الكهرباء",
      category: "الكهرباء", status: "missing",
      fileName: "", fileSize: "",
      uploadedAt: "", url: "",
    },
  ]).run();
}

function seedContractTemplates(db: BetterSQLite3Database<typeof schema>) {
  const now = new Date().toISOString().slice(0, 10);
  db.insert(contractTemplates).values([
    {
      name: "تصميم+إشراف سكن خاص بناء جديد",
      buildingType: "سكن خاص",
      serviceType: "بناء جديد",
      scopeOfWork: "يشمل هذا العقد خدمات التصميم المعماري والإنشائي وكامل خدمات الإشراف الهندسي على تنفيذ مشروع بناء المنزل الخاص الجديد على القسيمة رقم {القسيمة} في منطقة {المنطقة}، المملوكة للعميل {اسم_العميل} (رقم مدني: {الرقم_المدني}).",
      terms: "١. يسري هذا العقد من تاريخ توقيع الطرفين {تاريخ_التوقيع}.\n٢. أي تعديلات خارج نطاق العمل المتفق عليه تستلزم ملحقاً إضافياً مكتوباً.\n٣. للمكتب حق إيقاف العمل في حال تأخر الدفعات أكثر من ثلاثين يوماً.\n٤. تبقى الملكية الفكرية للمخططات للمكتب حتى إتمام السداد الكامل لقيمة العقد البالغة {قيمة_العقد}.",
      party1Obligations: "١. تقديم كافة المستندات والوثائق اللازمة (سند الملكية، خرائط المساحة) في الوقت المحدد.\n٢. سداد الدفعات وفق الجدول المتفق عليه دون تأخير.\n٣. تسهيل وصول فريق الإشراف لموقع المشروع في منطقة {المنطقة} في أوقات الدوام الرسمي.",
      party2Obligations: "١. إعداد المخططات المعمارية والإنشائية وفق أنظمة البناء الكويتية المعتمدة.\n٢. متابعة إجراءات اعتماد البلدية والجهات الحكومية ذات الصلة.\n٣. الإشراف الميداني خلال جميع مراحل التنفيذ وتقديم تقارير دورية.",
      paymentSchedule: "الدفعة الأولى (٣٠٪): عند توقيع العقد\nالدفعة الثانية (٣٠٪): عند الحصول على اعتماد البلدية\nالدفعة الثالثة (٢٠٪): عند رفع السقف الأخير\nالدفعة الرابعة (٢٠٪): عند إتمام المشروع والتسليم",
      duration: "مدة إنجاز التصميم: خمسة وأربعون (٤٥) يوم عمل من تاريخ توقيع العقد. مدة الإشراف: طوال فترة التنفيذ حتى الاستلام النهائي.",
      notes: "",
      createdAt: now,
      isDefault: 1,
    },
    {
      name: "تصميم سكن خاص",
      buildingType: "سكن خاص",
      serviceType: "تصميم",
      scopeOfWork: "يشمل هذا العقد خدمات التصميم المعماري والإنشائي فقط لمشروع بناء منزل خاص على القطعة {القطعة} - القسيمة رقم {القسيمة} في منطقة {المنطقة}، ولا يشمل خدمات الإشراف على التنفيذ.",
      terms: "١. لا يشمل هذا العقد خدمات الإشراف على التنفيذ الميداني.\n٢. تصبح المخططات ملكاً للعميل بعد اكتمال السداد الكامل لمبلغ {قيمة_العقد}.\n٣. أي تعديل جوهري في التصميم بعد اعتماد الكروكي يُحتسب رسوماً إضافية.\n٤. مدة صلاحية العرض ثلاثون يوماً من تاريخ {تاريخ_التوقيع}.",
      party1Obligations: "١. تقديم المستندات والوثائق المطلوبة (الطابو، رفع مساحي) في الوقت المحدد.\n٢. سداد الدفعات وفق الجدول المتفق عليه.\n٣. الالتزام بمواعيد جلسات التصميم المحددة وحضور جلسة اعتماد الكروكي.",
      party2Obligations: "١. إعداد الكروكي المبدئي وعرضه على العميل {اسم_العميل} خلال أسبوعين.\n٢. إعداد المخططات المعمارية والإنشائية النهائية بعد الاعتماد.\n٣. تقديم ملف بلدية كامل جاهز للتقديم الرسمي.",
      paymentSchedule: "الدفعة الأولى (٥٠٪): عند توقيع العقد\nالدفعة الثانية (٥٠٪): عند تسليم المخططات النهائية للعميل",
      duration: "مدة إنجاز التصميم: ثلاثون (٣٠) يوم عمل من تاريخ اعتماد الكروكي المبدئي.",
      notes: "",
      createdAt: now,
      isDefault: 1,
    },
    {
      name: "إشراف سكن خاص",
      buildingType: "سكن خاص",
      serviceType: "إشراف",
      scopeOfWork: "يشمل هذا العقد خدمات الإشراف الهندسي على تنفيذ مشروع البناء على القسيمة رقم {القسيمة} في منطقة {المنطقة} للعميل {اسم_العميل}، ويبدأ سريانه من تاريخ بدء أعمال الحفر.",
      terms: "١. يقتصر عمل المكتب على الإشراف الهندسي ولا يُعد مقاولاً منفذاً.\n٢. لا يتحمل المكتب مسؤولية التأخير الناجم عن المقاول أو الجهات الحكومية.\n٣. تُسلَّم تقارير الإشراف الدورية نهاية كل مرحلة إنشائية.\n٤. رسوم الإشراف الإجمالية {قيمة_العقد}.",
      party1Obligations: "١. تسهيل وصول فريق الإشراف لموقع المشروع في أي وقت خلال ساعات العمل.\n٢. سداد الدفعات وفق الجدول المتفق عليه دون تأخير.\n٣. إبلاغ المكتب فوراً عن أي تعديلات ميدانية أو تغييرات في خطة التنفيذ.",
      party2Obligations: "١. زيارة الموقع بشكل منتظم وفق خطة الإشراف المعتمدة (حد أدنى زيارة أسبوعية).\n٢. إعداد تقارير الإشراف الدورية وتسليمها للعميل.\n٣. التنسيق مع الجهات الحكومية المختصة عند الحاجة وإخطار العميل بأي مخالفات.",
      paymentSchedule: "الدفعة الأولى (٤٠٪): عند بدء أعمال الحفر\nالدفعة الثانية (٣٠٪): عند رفع السقف الأخير\nالدفعة الثالثة (٣٠٪): عند إتمام المشروع والاستلام النهائي",
      duration: "طوال فترة تنفيذ المشروع في منطقة {المنطقة} حتى الاستلام النهائي من المقاول.",
      notes: "",
      createdAt: now,
      isDefault: 1,
    },
    {
      name: "تصميم+إشراف استثماري",
      buildingType: "استثماري",
      serviceType: "بناء جديد",
      scopeOfWork: "يشمل هذا العقد خدمات التصميم المعماري والإنشائي وكامل خدمات الإشراف الهندسي على المشروع الاستثماري للعميل {اسم_العميل} (رقم مدني: {الرقم_المدني}) على القسيمة رقم {القسيمة} - القطعة {القطعة} في منطقة {المنطقة}، بمساحة {المساحة}.",
      terms: "١. يُطبَّق هذا العقد على المشاريع الاستثمارية والسكنية المتعددة الطوابق.\n٢. يلتزم المكتب بأنظمة البناء الكويتية للمشاريع الاستثمارية الصادرة عن بلدية الكويت.\n٣. أي تعديل في المساحة أو عدد الطوابق بعد التوقيع يستلزم مراجعة قيمة العقد البالغة {قيمة_العقد}.\n٤. يسري هذا العقد من تاريخ {تاريخ_التوقيع}.",
      party1Obligations: "١. تقديم كافة المستندات والموافقات الحكومية المطلوبة لبدء الإجراءات.\n٢. سداد الدفعات وفق الجدول المتفق عليه دون تأخير.\n٣. تعيين مقاول معتمد ومرخص لتنفيذ المشروع وإبلاغ المكتب باسمه قبل بدء التنفيذ.",
      party2Obligations: "١. إعداد المخططات الإنشائية والمعمارية لكافة الطوابق وفق اشتراطات البلدية.\n٢. استخراج التصاريح اللازمة من البلدية والجهات المختصة ومتابعتها حتى الاعتماد.\n٣. الإشراف الفني الكامل على مراحل التنفيذ وتقديم تقارير شهرية مفصلة.",
      paymentSchedule: "الدفعة الأولى (٢٥٪): عند توقيع العقد رقم {رقم_العقد}\nالدفعة الثانية (٢٥٪): عند اعتماد البلدية الرسمي\nالدفعة الثالثة (٢٥٪): عند رفع الهيكل الإنشائي الكامل\nالدفعة الرابعة (٢٥٪): عند إتمام المشروع والتسليم النهائي",
      duration: "مدة التصميم: ستون (٦٠) يوم عمل. مدة الإشراف: طوال فترة التنفيذ حتى الاستلام النهائي.",
      notes: "تُحدَّد قيمة الخدمات الاستشارية الإضافية خارج نطاق العقد بالتراضي بين الطرفين.",
      createdAt: now,
      isDefault: 1,
    },
    {
      name: "خدمات بلدية",
      buildingType: "خدمات بلدية",
      serviceType: "خدمات بلدية",
      scopeOfWork: "يشمل هذا العقد خدمات المتابعة مع بلدية الكويت والجهات الحكومية المختصة لاستخراج التصاريح والموافقات اللازمة للمشروع على القسيمة رقم {القسيمة} في منطقة {المنطقة} للعميل {اسم_العميل}.",
      terms: "١. يقتصر نطاق عمل المكتب على الخدمات البلدية المتفق عليها فقط.\n٢. لا يتحمل المكتب رسوم البلدية والجهات الحكومية وتبقى على عاتق العميل مباشرة.\n٣. مدة الإنجاز تعتمد على سرعة استجابة الجهات الحكومية ولا يُعد التأخير المؤسسي مسؤولية المكتب.\n٤. رسوم الخدمة الإجمالية {قيمة_العقد} وتُسدَّد عند التوقيع بتاريخ {تاريخ_التوقيع}.",
      party1Obligations: "١. توفير كافة المستندات والوثائق المطلوبة كاملة وصحيحة وموثقة رسمياً.\n٢. سداد رسوم البلدية والجهات الحكومية بشكل مباشر عند استحقاقها.\n٣. التعاون الكامل مع فريق المكتب وتقديم أي معلومات إضافية عند الطلب.",
      party2Obligations: "١. تقديم الطلبات اللازمة ومتابعتها مع الجهات المختصة حتى البت فيها.\n٢. إبلاغ العميل {اسم_العميل} بمستجدات الطلبات بشكل دوري.\n٣. تسليم جميع التصاريح والموافقات المستخرجة للعميل فور صدورها.",
      paymentSchedule: "رسوم الخدمة كاملة (١٠٠٪): عند توقيع العقد",
      duration: "تعتمد على سرعة البت من الجهات الحكومية المعنية.",
      notes: "لا تشمل هذه الخدمة أي أعمال تصميم هندسي أو إشراف ميداني.",
      createdAt: now,
      isDefault: 1,
    },
  ]).run();
}
