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
  db.insert(contractTemplates).values([
    {
      name: `عقد إشراف - سكن خاص`,
      buildingType: `سكن خاص`,
      serviceType: `إشراف`,
      scopeOfWork: `# 01-عقود السكن الخاص/عقد الاشراف ( سكن خاص ).docx

عقـــــــــــــــــــد إشــــــــــــــــــــــراف على الهيكـــــــــــــــــل الأســـــــــــــــــــــــــــود
أنه في يوم  الثلاثاء   الموافق  18  / 3 / 2025  تم الإتفاق بين كلاً من :
الطرف الأول :   مكتب ديناميك ديزاين للإستشارات الهندسية
الطرف الثاني : اسم العميل                              رقم مدني/
العنوان:  قسيمة رقم (40) قطعة (5) منطقة القرين
يحسب مبلغ وقدرة ( 150 دك ) مائة وخمسون دينار كويتي فقط لاغير عن كل شهر وذلك قيمة الإشراف وحتى صدور نهاية الاشراف من بلدية الكويت  .
يقوم الطرف الأول بالإطلاع على نتائج الفحوصات لمكعبات الخرسانة المقدمة من الطرف الثاني .
يقوم الطرف الثاني من خلال المقاول بتنفيذ كافة الأعمال حسب المخططات المرخصة من بلدية الكويت.
لايسمح للطرف الثاني إستخدام الخرسانة التي يتم تجهيزها في الموقع (الخلط الإيراني ) ويلتزم بتوريد الخرسانة من أحد مصانع الخرسانةالمعتمدة في دولة الكويت .
في حال قيام الطرف الثاني أو من يمثله بعمل أي مخالفات للمخططات المرخصة يقوم الطرف الأول بإيقاف الأعمال في الموقع مباشرة .
لا يكون الطرف الأول مسؤولاً عن أي مخالفات يقوم بها الطرف الثاني أو من يمثله بعد الإنتهاء من أعمال الإشراف حسب المخططات المرخصة .
لا يكون الطرف الأول مسؤولاً عن أي تأخير في الأعمال ناتج عن أي خلافات بين الطرف الثاني والمقاول .
يقوم الطرف الثاني بإبلاغ الطرف الأول فور جاهزية الأعمال في الموقع ويقوم الطرف الأول بإستلام الأعمال خلال ثلاثة أيام تبدأ من تاريخ إستلام طلب الكشف على أعمال الحديد الجاهزة .
تبدأ مدة الإشراف من تاريخ صدورتعهد الإشراف وتنتهي بعد إصدار كتاب إنهاء الإشراف من المكتب من قبل البلدية وفك حجز المساحات .
يقوم الطرف الثاني بإستخراج كشف إنهاء الإشراف من البلدية وعلى مسؤوليته بدون أي مخالفات .
لا يفقد الطرف الأول حقه في أي كم من الأتعاب المتفق عليها إذا قام الطرف الثاني بالعدول أو الإمتناع عن إتمام الإتفاقية لأي سبب من الأسباب كما أن أي مبلغ من هذه المبالغ لاتسترد بعد دفعها بأي حال من الأحوال .
الدفع 150 دينار بداية كل شهر والجزء من الشهر يعتبر شهرا كاملا .
رسوم كتب الصب الموجهه الى بنك الاتمان تكون رسومها على المالك .
حرر هذا العقد من نسختين يتم تسليم كل طرف نسخة من العقد .
الطــــــ`,
      terms: ``,
      party1Obligations: ``,
      party2Obligations: ``,
      paymentSchedule: `الأتعاب المتفق عليها إذا قام الطرف الثاني بالعدول أو الإمتناع عن إتمام الإتفاقية لأي سبب من الأسباب كما أن أي مبلغ من هذه المبالغ لاتسترد بعد دفعها بأي حال من الأحوال .
الدفع 150 دينار بداية كل شهر والجزء من الشهر يعتبر شهرا كاملا .
رسوم كتب الصب الموجهه الى بنك الاتمان تكون رسومها على المالك .`,
      duration: `مدة الإشراف من تاريخ صدورتعهد الإشراف وتنتهي بعد إصدار كتاب إنهاء الإشراف من المكتب من قبل البلدية وفك حجز المساحات .
يقوم الطرف الثاني بإستخراج كشف إنهاء الإشراف من البلدية وعلى مسؤوليته بدون أي مخالفات .
لا يفقد الطرف الأول حقه في أي كم من الأتعاب المتفق عليها إذا قام الطرف الثاني بالعدول أو الإمتناع عن إتمام الإتفاقية لأي سبب من الأسباب كما أن أي مبلغ من هذه المبالغ لاتسترد بعد دفعها بأي حال من الأحوال .
الدفع 150 دينار بداية كل شهر والجزء من الشهر يعتبر شهرا كاملا .
رسوم كتب الصب الموجهه الى بنك الاتمان تكون رسومها على المالك .`,
      notes: ``,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد بناء جديد - سكن خاص (الباقة الأساسية)`,
      buildingType: `سكن خاص`,
      serviceType: `تصميم وترخيص وإشراف`,
      scopeOfWork: `المادة (1): نطاق الخدمات وافق الاستشاري على تقديم الخدمات التالية:
التصميم المعماري .
التصميم الانشائي.
فحص التربة.
كتاب إمكانية إيصال تيار كهربائي.
اصدار رخصة بناء من بلدية الكويت.
مخطط صرف صحي.
تصميم عدد ( 1 ) واجهة(3D).
مخطط فرش
اشراف لمدة ثلاثة اشهر ( مجاناً ).`,
      terms: `المادة (6): أحكام عامة
في حال فسخ العقد من قبل المالك، لا يحق له استرداد أي مبالغ تم دفعها.
في حال نشوء أي نزاع، يتم حله وديًا، فإن تعذر، يتم اللجوء إلى التحكيم أو المحاكم الكويتية المختصة.`,
      party1Obligations: `المادة (4): التزامات المالك
تزويد الاستشاري بكافة المستندات المطلوبة والتعاقد مع مقاول معتمد واصدار رخصة سلامة.
الالتزام بسداد دفعات الأتعاب في مواعيدها. لا يجوز حجز أو استقطاع أي جزء من أتعاب الاستشاري.
عند التعديل على المخطط المعتمد بعد اصدار الرخصة يستلزم المالك اصدار رخصة تعديلية برسوم اضافية حسب التعديل.
تحتسب رسوم اضافية عند التعديل على المخططات الانشائية والواجهات بعد اعتمادها والانتهاء من تنفيذها حسب حجم التعديل.`,
      party2Obligations: ``,
      paymentSchedule: `المادة (3): الأتعاب المالية
إجمالي الأتعاب 1300 دينار كويتي( فقط ألف و ثلاثمائة دينار كويتي لا غير).
آلية الدفع:
الدفعة الأولى 50% بقيمة 650 دينار كويتي عند توقيع العقد.
الدفعة الثانية 50% بقيمة  650 دينار كويتي بعد صدور رخصة البناء.`,
      duration: `المادة (2): مراحل التصميم .
المرحلة الأولى (التصميم المعماري):
دراســـــة موقع المشــــــروع والمنطقة المحيطة
دراسة استعمالات ومساحات مكونات المشروع طبقا  لإشتراطات قوانين نظم البناء.
عــرض الفكرة المعمارية على المالـك واستلام الملاحظـات .
تعديلات مفتوحة على المخططات المعمارية .
اعتماد المخطط المعماري مع المالك.
المرحلة الثانية (التصميم الانشائي):
وضع اماكن الاعمدة والتعديل عليها بعد اعتماد التصميم المعماري وتصميم الواجهات.
تصميم المخططات الانشائية  بعد اعتماد المخطط المعماري والواجهات حسب المخطط المعتمد من بلدية الكويت واعتمادها مع المالك .
المرحلة الثانية (تصميم الواجهات):
تصميم الواجهات حسب اختيار المالك من انواع التصميم.
عند اعتماد طابع التصميم يتم التعديل على الواجهات 3 مرات فقط.
يتم اعتماد الواجهات والتعديل عليها حسب اماكن الاعمدة .`,
      notes: `المادة (5): الإشراف على التنفيذ
مدة الإشراف الأساسية:  ثلاثة (3) أشهر، تبدأ من تاريخ إصدار "تعهد الإشراف". وتنتهي بأكتمال المباني ونظافة الموقع وتوقيع المالك نموذج انهاء الاشراف.
تمديد الإشراف: بعد انتهاء المدة الأساسية، يتم تمديد الإشراف تلقائيًا مقابل 150 دينار كويتي عن كل شهر إضافي والجزء من الشهر يحسب شهر وتُدفع مقدمًا الى توقيع المالك انهاء الاشراف.
عدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
أخذ العينات وإرسالها للفحص وارسال النتائج للاستشارى للتأكد من مطابقتها للمواصفات المطلوبة.
ابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
يجب استخدام خرسانه جاهزة من مصنع معتمد و غير مسموح استخدام الخلط الموقعي للخرسانة وان تم استخدامه يعتبر الاشراف ملغي.
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .
لا يكون الطرف الأول مسؤولاً عن أي تأخير في الأعمال ناتج عن أي خلافات داخل الموقع .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد بناء جديد - سكن خاص (الباقة الذهبية)`,
      buildingType: `سكن خاص`,
      serviceType: `تصميم وترخيص وإشراف`,
      scopeOfWork: `المادة (1): نطاق الخدمات وافق الاستشاري على تقديم الخدمات التالية:
التصميم المعماري .
التصميم الانشائي.
فحص التربة.
كتاب إمكانية إيصال تيار كهربائي.
اصدار رخصة بناء من بلدية الكويت.
تصميم عدد ( 1 ) واجهة(3D).
مخطط فرش.
مخطط توزيع الكهرباء.
مخطط توزيع الصحي.
تصميم داخلي ( عدد 3 فراغ ).
مخطط اسقف( عدد 3 فراغ ).
مخطط توزيع انارة.
اشراف لمدة خمسة اشهر ( مجاناً ).`,
      terms: `المادة (6): أحكام عامة
في حال فسخ العقد من قبل المالك، لا يحق له استرداد أي مبالغ تم دفعها.
في حال نشوء أي نزاع، يتم حله وديًا، فإن تعذر، يتم اللجوء إلى التحكيم أو المحاكم الكويتية المختصة.`,
      party1Obligations: `المادة (4): التزامات المالك
تزويد الاستشاري بكافة المستندات المطلوبة والتعاقد مع مقاول معتمد واصدار رخصة سلامة.
الالتزام بسداد دفعات الأتعاب في مواعيدها. لا يجوز حجز أو استقطاع أي جزء من أتعاب الاستشاري.
عند التعديل على المخطط المعتمد بعد اصدار الرخصة يستلزم المالك اصدار رخصة تعديلية برسوم اضافية حسب التعديل.
تحتسب رسوم اضافية عند التعديل على المخططات الانشائية والواجهات بعد اعتمادها والانتهاء من تنفيذها حسب حجم التعديل.`,
      party2Obligations: ``,
      paymentSchedule: `المادة (3): الأتعاب المالية
إجمالي الأتعاب 2200 دينار كويتي( فقط ألفان و مائتان دينار كويتي لا غير).
آلية الدفع:
الدفعة الأولى 50% بقيمة 1100 دينار كويتي عند توقيع العقد.
الدفعة الثانية 50% بقيمة  1100 دينار كويتي بعد صدور رخصة البناء.`,
      duration: `المادة (2): مراحل التصميم .
المرحلة الأولى (التصميم المعماري):
دراســـــة موقع المشــــــروع والمنطقة المحيطة
دراسة استعمالات ومساحات مكونات المشروع طبقا  لإشتراطات قوانين نظم البناء.
عــرض الفكرة المعمارية على المالـك واستلام الملاحظـات .
تعديلات مفتوحة على المخططات المعمارية .
اعتماد المخطط المعماري مع المالك.
المرحلة الثانية (التصميم الانشائي):
وضع اماكن الاعمدة والتعديل عليها بعد اعتماد التصميم المعماري وتصميم الواجهات.
تصميم المخططات الانشائية  بعد اعتماد المخطط المعماري والواجهات حسب المخطط المعتمد من بلدية الكويت واعتمادها مع المالك .
المرحلة الثانية (تصميم الواجهات):
تصميم الواجهات حسب اختيار المالك من انواع التصميم.
عند اعتماد طابع التصميم يتم التعديل على الواجهات 3 مرات فقط.
يتم اعتماد الواجهات والتعديل عليها حسب اماكن الاعمدة .`,
      notes: `المادة (5): الإشراف على التنفيذ
مدة الإشراف الأساسية:  خمسة (5) أشهر، تبدأ من تاريخ إصدار "تعهد الإشراف". وتنتهي بأكتمال المباني ونظافة الموقع وتوقيع المالك نموذج انهاء الاشراف.
تمديد الإشراف: بعد انتهاء المدة الأساسية، يتم تمديد الإشراف تلقائيًا مقابل 150 دينار كويتي عن كل شهر إضافي والجزء من الشهر يحسب شهر وتُدفع مقدمًا الى توقيع المالك انهاء الاشراف.
عدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
أخذ العينات وإرسالها للفحص وارسال النتائج للاستشارى للتأكد من مطابقتها للمواصفات المطلوبة.
ابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
يجب استخدام خرسانه جاهزة من مصنع معتمد و غير مسموح استخدام الخلط الموقعي للخرسانة وان تم استخدامه يعتبر الاشراف ملغي.
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .
لا يكون الطرف الأول مسؤولاً عن أي تأخير في الأعمال ناتج عن أي خلافات داخل الموقع .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد بناء جديد - سكن خاص (الباقة المميزة)`,
      buildingType: `سكن خاص`,
      serviceType: `تصميم وترخيص وإشراف`,
      scopeOfWork: `المادة (1): نطاق الخدمات وافق الاستشاري على تقديم الخدمات التالية:
التصميم المعماري .
التصميم الانشائي.
فحص التربة.
كتاب إمكانية إيصال تيار كهربائي.
اصدار رخصة بناء من بلدية الكويت.
تصميم عدد ( 1 ) واجهة(3D).
مخطط فرش.
مخطط توزيع الكهرباء.
مخطط توزيع الصحي.
اشراف لمدة اربعة اشهر ( مجاناً ).`,
      terms: `المادة (6): أحكام عامة
في حال فسخ العقد من قبل المالك، لا يحق له استرداد أي مبالغ تم دفعها.
في حال نشوء أي نزاع، يتم حله وديًا، فإن تعذر، يتم اللجوء إلى التحكيم أو المحاكم الكويتية المختصة.`,
      party1Obligations: `المادة (4): التزامات المالك
تزويد الاستشاري بكافة المستندات المطلوبة والتعاقد مع مقاول معتمد واصدار رخصة سلامة.
الالتزام بسداد دفعات الأتعاب في مواعيدها. لا يجوز حجز أو استقطاع أي جزء من أتعاب الاستشاري.
عند التعديل على المخطط المعتمد بعد اصدار الرخصة يستلزم المالك اصدار رخصة تعديلية برسوم اضافية حسب التعديل.
تحتسب رسوم اضافية عند التعديل على المخططات الانشائية والواجهات بعد اعتمادها والانتهاء من تنفيذها حسب حجم التعديل.`,
      party2Obligations: ``,
      paymentSchedule: `المادة (3): الأتعاب المالية
إجمالي الأتعاب 1600 دينار كويتي( فقط ألف و ستمائة دينار كويتي لا غير).
آلية الدفع:
الدفعة الأولى 50% بقيمة 800 دينار كويتي عند توقيع العقد.
الدفعة الثانية 50% بقيمة  800 دينار كويتي بعد صدور رخصة البناء.`,
      duration: `المادة (2): مراحل التصميم .
المرحلة الأولى (التصميم المعماري):
دراســـــة موقع المشــــــروع والمنطقة المحيطة
دراسة استعمالات ومساحات مكونات المشروع طبقا  لإشتراطات قوانين نظم البناء.
عــرض الفكرة المعمارية على المالـك واستلام الملاحظـات .
تعديلات مفتوحة على المخططات المعمارية .
اعتماد المخطط المعماري مع المالك.
المرحلة الثانية (التصميم الانشائي):
وضع اماكن الاعمدة والتعديل عليها بعد اعتماد التصميم المعماري وتصميم الواجهات.
تصميم المخططات الانشائية  بعد اعتماد المخطط المعماري والواجهات حسب المخطط المعتمد من بلدية الكويت واعتمادها مع المالك .
المرحلة الثانية (تصميم الواجهات):
تصميم الواجهات حسب اختيار المالك من انواع التصميم.
عند اعتماد طابع التصميم يتم التعديل على الواجهات 3 مرات فقط.
يتم اعتماد الواجهات والتعديل عليها حسب اماكن الاعمدة .`,
      notes: `المادة (5): الإشراف على التنفيذ
مدة الإشراف الأساسية:  اربعة (4) أشهر، تبدأ من تاريخ إصدار "تعهد الإشراف". وتنتهي بأكتمال المباني ونظافة الموقع وتوقيع المالك نموذج انهاء الاشراف.
تمديد الإشراف: بعد انتهاء المدة الأساسية، يتم تمديد الإشراف تلقائيًا مقابل 150 دينار كويتي عن كل شهر إضافي والجزء من الشهر يحسب شهر وتُدفع مقدمًا الى توقيع المالك انهاء الاشراف.
عدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
أخذ العينات وإرسالها للفحص وارسال النتائج للاستشارى للتأكد من مطابقتها للمواصفات المطلوبة.
ابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
يجب استخدام خرسانه جاهزة من مصنع معتمد و غير مسموح استخدام الخلط الموقعي للخرسانة وان تم استخدامه يعتبر الاشراف ملغي.
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .
لا يكون الطرف الأول مسؤولاً عن أي تأخير في الأعمال ناتج عن أي خلافات داخل الموقع .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد تعديل وإضافة - سكن خاص`,
      buildingType: `سكن خاص`,
      serviceType: `تعديل وإضافة`,
      scopeOfWork: `المادة الأولى
يعتبرالتمهيد السابق جزءا  لا يتجزأ من الإتفاقية ويعتبرالعنوان بمثابة المحل المختار للطرفين تتم المراسلات عليه .`,
      terms: ``,
      party1Obligations: ``,
      party2Obligations: ``,
      paymentSchedule: `المادة الثالثة : واجبات المستشار لأعمال التصميم
المرحلة الأولى : الفكرة التصميمية الإبتدائية للمشروع وتشمل الآتى: -
دراســـــة موقع المشــــــروع والمنطقة المحيطة.                 .. ...     .. .. ...     ..
دراسة استعمالات ومساحات مكونات المشروع طبقا  لإشتراطات قوانين نظم البناء.
عــرض الفكرة المعمارية على المالـك واستلام الملاحظـات.
المرحلة الثانية: تطوير التصميم وإعداد المخططات اللازمة لإستخراج التراخيص وتشمل الآتى:
تجهيز المخططات المعمارية بعد اعتمادها من المالك وتقديمها إلى بلدية الكويت لإستخـراج رخصـة البنـاء .
إمكانية تقوية التيار الكهربائي .
تصميم المخططات الانشائية حسب المخطط المعتمد من بلدية الكويت .`,
      duration: `يلتزم الطرف الثاني بدفع مبلغ 100 د.ك رسوم الاشراف الشهري بداية من تاريخ تعهد الاشراف وحتي الانتهاء من الاشراف واعتماد انهاء الاشراف من البلدية ،  والجزء من الشهر يحسب شهر وتُدفع مقدمًا  بداية كل شهر اشراف
يلتزم الطرف الثاني بعدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
يلتزم الطرف الثاني بابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .`,
      notes: `الإشراف على التنفيذ
يلتزم الطرف الثاني بدفع مبلغ 100 د.ك رسوم الاشراف الشهري بداية من تاريخ تعهد الاشراف وحتي الانتهاء من الاشراف واعتماد انهاء الاشراف من البلدية ،  والجزء من الشهر يحسب شهر وتُدفع مقدمًا  بداية كل شهر اشراف
يلتزم الطرف الثاني بعدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
يلتزم الطرف الثاني بأخذ العينات وإرسالها للفحص وارسال النتائج للاستشارى للتأكد من مطابقتها للمواصفات المطلوبة.
يلتزم الطرف الثاني بابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
يجب استخدام خرسانه جاهزة من مصنع معتمد و غير مسموح استخدام الخلط الموقعي للخرسانة وان تم استخدامه يعتبر الاشراف ملغي.
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .
لا يكون الطرف الأول مسؤولاً عن أي تأخير في الأعمال ناتج عن أي خلافات داخل الموقع .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد هدم - سكن خاص`,
      buildingType: `سكن خاص`,
      serviceType: `هدم`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد وتقديم المستندات اللازمة للحصول على رخصة هدم من بلدية الكويت ، وتشمل
إجراء زيارة ميدانية للقسيمة .
تجهيز التعهدات اللازمة للترخيص .
اصدار رخصة الهدم من بلدية الكويت.
الإشراف على أعمال الهدم، وتشمل:
إعداد خطة الهدم بالتنسيق مع المقاول المنفذ.
التأكد من اتباع إجراءات السلامة أثناء الهدم.
التأكد من عدم الإضرار بالمباني المجاورة.
التأكد من التخلص السليم من مخلفات الهدم وفقاً للوائح البيئية.
إجراء زيارات دورية للموقع خلال فترة الهدم .`,
      terms: ``,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
وثيقة التملك.
مدنيات الملاك.
صور القسيمة.
كتاب قطع التيار من وزارة الكهرباء.
كتاب المواصلات من وزارة المواصلات.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
وثيقة التملك.
مدنيات الملاك.
صور القسيمة.
كتاب قطع التيار من وزارة الكهرباء.
كتاب المواصلات من وزارة المواصلات.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.`,
      duration: `إجراء زيارات دورية للموقع خلال فترة الهدم .`,
      notes: ``,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد إضافة وتعديل - استثماري`,
      buildingType: `استثماري`,
      serviceType: `تعديل وإضافة`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
تجهيز المخططات المعمارية واعتمادها من المالك.
إعادة رسم مخططات البلدية والاطفاء بصيفة ( AutoCad  ).
الكشف علي القسيمة واعتماد مطابقة المخططات بواقع المبني.
تجهيز المخططات وتقديمها للإدارة العامه للاطفاء واعتمادها واستخراج رخصة مشاريع.
تجهيز المخططات وتقديمها للإدارة العامة للتنظيم واستخراج راي تنظيمي.
تقديم المخططات حسب نظام البناء المعمول به في بلدية الكويت  لاستخراج رخصة البناء التعديلية.
اصدار تعهد اشراف.
يتم احتساب شهرين اشراف مجاناً ، علي ان يتم احتساب ( 250 د.ك ) رسوم الاشراف الشهري بداية من الشهر الثالث للاشراف وحتي اعتماد انهاء الاشراف من  البلدية.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول ( الإستشاري )                                                                 الطرف الثاني ( المالك )
التوقيع:                                                                                          التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      duration: `مدة العقد
تبدأ مدة هذا العقد من استكمال المتطلبات الخاصة بالترخيص بإستقبال المعاملات حسب القانون الجديد للحصول على رخصة البناء من بلدية الكويت.
المدة المتوقعة لإصدر التراخيص هي (25) يوم عمل من تاريخ التقديم.
المدد المذكورة أعلاه تقديرية وقد تتغير وفقاً لإجراءات الجهات المختصة وملاحظاتها.`,
      notes: `ملاحظاتها.
المادة السادسة: الشروط الخاصة
في حال طلب الطرف الثاني من الطرف الأول إجراء أي تعديلات  بعد اعتماده، فإنه يلتزم بدفع أتعاب إضافية يتم الاتفاق عليها كتابياً.
عند استلزام المعاملة اصدار اي موافقات اخرى غير المذكورة في نطاق الخدمات المقدمة يتم الاتفاق على رسوم اضافية.
يلتزم الطرف الأول بالحفاظ على سرية جميع المعلومات والمستندات المتعلقة بالقسيمة والمشروع.
يلتزم الطرف الأول بتقديم النصح والمشورة الفنية للطرف الثاني فيما يتعلق بالتصميم والتراخيص.
يتم اصدار تعهد اشراف وانهاء اشراف شريطة عدم وجود مخالفات لنظام البناء
يلتزم الطرف الثاني باستخراج ترخيص سلامة من مقاول معتمد لزوم انهاء الاشراف .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد بناء جديد - استثماري`,
      buildingType: `استثماري`,
      serviceType: `تصميم وترخيص وإشراف`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد التصميم المعماري الجديد للقسيمة، ويشمل:
إعداد المخططات المعمارية حسب الأنظمة والمساحات.
الالتزام باشتراطات البناء.
تعديل التصميم وفقاً لملاحظات الطرف الثاني حتى الوصول إلى التصميم النهائي
استخراج ترخيص الإدارة العامة للإطفاء، ويشمل:
إعداد مخططات الاطفاء.
تصميم مخارج الطوارئ وفقاً لاشتراطات السلامة.
تقديم المخططات للإدارة العامة للإطفاء.
متابعة إجراءات الحصول على موافقة الإدارة العامة للإطفاء.
تعديل المخططات وفقاً لملاحظات الإدارة العامة للإطفاء إن وجدت.
استخراج الرأي التنظيمي، ويشمل
إعداد المخططات المطلوبة لإدارة التنظيم.
تقديم المخططات لإدارة التنظيم.
متابعة إجراءات الحصول على الرأي التنظيمي.
تعديل المخططات وفقاً لملاحظات إدارة التنظيم إن وجدت.
استخراج رخصة البناء من بلدية الكويت، ويشمل :-
إعداد المخططات النهائية بعد الحصول على موافقة الإدارة العامة للإطفاء والرأي التنظيمي.
تقديم المخططات لبلدية الكويت
متابعة إجراءات الحصول على رخصة البناء.
تعديل المخططات وفقاً لملاحظات بلدية الكويت إن وجدت.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول (الإستشاري)                                                                                    الطرف الثاني (المالك)
التوقيع:                                                                                                                  التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي
نسخة من الترخيص الصناعي.
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
مراجعة واعتماد التصاميم المقدمة من الطرف الأول خلال مدة أقصاها (10) أيام عمل من تاريخ تقديمها.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي
نسخة من الترخيص الصناعي.
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
مراجعة واعتماد التصاميم المقدمة من الطرف الأول خلال مدة أقصاها (10) أيام عمل من تاريخ تقديمها.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      duration: `مدة العقد
المدة المتوقعة لإعداد التصميم المعماري هي (5) يوم عمل من تاريخ توقيع العقد.
المدة المتوقعة للحصول على موافقة الإدارة العامة للإطفاء هي (15) يوم عمل من تاريخ اعتماد التصميم المعماري.
المدة المتوقعة للحصول على رخصة البناء هي (15) يوم عمل من تاريخ الحصول على موافقة الإدارة العامة للإطفاء.
المدد المذكورة أعلاه تقديرية وقد تتغير وفقاً لإجراءات الجهات المختصة وملاحظاتها.`,
      notes: `ملاحظات الطرف الثاني حتى الوصول إلى التصميم النهائي
استخراج ترخيص الإدارة العامة للإطفاء، ويشمل:
إعداد مخططات الاطفاء.
تصميم مخارج الطوارئ وفقاً لاشتراطات السلامة.
تقديم المخططات للإدارة العامة للإطفاء.
متابعة إجراءات الحصول على موافقة الإدارة العامة للإطفاء.
تعديل المخططات وفقاً لملاحظات الإدارة العامة للإطفاء إن وجدت.
استخراج الرأي التنظيمي، ويشمل
إعداد المخططات المطلوبة لإدارة التنظيم.
تقديم المخططات لإدارة التنظيم.
متابعة إجراءات الحصول على الرأي التنظيمي.
تعديل المخططات وفقاً لملاحظات إدارة التنظيم إن وجدت.
استخراج رخصة البناء من بلدية الكويت، ويشمل :-
إعداد المخططات النهائية بعد الحصول على موافقة الإدارة العامة للإطفاء والرأي التنظيمي.
تقديم المخططات لبلدية الكويت
متابعة إجراءات الحصول على رخصة البناء.
تعديل المخططات وفقاً لملاحظات بلدية الكويت إن وجدت.`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد هدم - استثماري`,
      buildingType: `استثماري`,
      serviceType: `هدم`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد وتقديم المستندات اللازمة للحصول على رخصة هدم من بلدية الكويت والهيئة العامة للصناعة، وتشمل
إجراء زيارة ميدانية للقسيمة وإعداد تقرير عن حالتها الراهنة
إعداد المخططات المطلوبة للهدم وفقاً لاشتراطات بلدية الكويت والهيئة العامة للصناعة
تجهيز التعهدات اللازمة للترخيص (تعهد بمسؤولية الكشف على العقار وخلوه من المخالفات، تعهد رفع كيبل الكهرباء، تعهد تحمل مسؤولية المحلات المؤجرة)
تقديم نموذج وزارة المواصلات للهدم
. الحصول على موافقة وزارة الكهرباء والماء قبل إصدار رخصة الهدم.
متابعة إجراءات الحصول على رخصة الهدم لدى جميع الجهات المختصة.
الإشراف على أعمال الهدم، وتشمل:
إعداد خطة الهدم بالتنسيق مع المقاول المنفذ
التأكد من اتباع إجراءات السلامة أثناء الهدم
التأكد من عدم الإضرار بالمباني المجاورة.
التأكد من التخلص السليم من مخلفات الهدم وفقاً للوائح البيئية.
إجراء زيارات دورية للموقع خلال فترة الهدم (بحد أدنى مرتين أسبوعياً).
إعداد تقارير دورية عن سير أعمال الهدم
إعداد تقرير نهائي بعد الانتهاء من أعمال الهدم.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول (الإستشاري)                                                                        الطرف الثاني (المالك)
التوقيع:                                                                                                التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي.
نسخة من الترخيص الصناعي.
نسخة من المخططات والرخص السابقة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.
سداد جميع الرسوم الحكومية المطلوبة لإصدار رخصة الهدم.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي.
نسخة من الترخيص الصناعي.
نسخة من المخططات والرخص السابقة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.
سداد جميع الرسوم الحكومية المطلوبة لإصدار رخصة الهدم.`,
      duration: `مدة العقد
تبدأ مدة هذا العقد من تاريخ توقيعه وتنتهي بانتهاء أعمال الهدم وتقديم التقرير النهائي.
المدة المتوقعة للحصول على رخصة الهدم هي (30) يوماً من تاريخ تقديم جميع المستندات المطلوبة، ما لم تطرأ ظروف خارجة عن إرادة الطرف الأول.
المدة المتوقعة للإشراف على أعمال الهدم هي (15) يوماً من تاريخ البدء في أعمال الهدم.`,
      notes: ``,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد إضافة وتعديل - تجاري`,
      buildingType: `تجاري`,
      serviceType: `تعديل وإضافة`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
تجهيز المخططات المعمارية واعتمادها من المالك.
إعادة رسم مخططات البلدية والاطفاء بصيفة ( AutoCad  ).
الكشف علي القسيمة واعتماد مطابقة المخططات بواقع المبني.
تجهيز المخططات وتقديمها للإدارة العامه للاطفاء واعتمادها واستخراج رخصة مشاريع.
تجهيز المخططات وتقديمها للإدارة العامة للتنظيم واستخراج راي تنظيمي.
تقديم المخططات حسب نظام البناء المعمول به في بلدية الكويت  لاستخراج رخصة البناء التعديلية.
اصدار تعهد اشراف.
يتم احتساب شهرين اشراف مجاناً ، علي ان يتم احتساب ( 250 د.ك ) رسوم الاشراف الشهري بداية من الشهر الثالث للاشراف وحتي اعتماد انهاء الاشراف من  البلدية.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول ( الإستشاري )                                                                 الطرف الثاني ( المالك )
التوقيع:                                                                                          التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      duration: `مدة العقد
تبدأ مدة هذا العقد من استكمال المتطلبات الخاصة بالترخيص بإستقبال المعاملات حسب القانون الجديد للحصول على رخصة البناء من بلدية الكويت.
المدة المتوقعة لإصدر التراخيص هي (25) يوم عمل من تاريخ التقديم.
المدد المذكورة أعلاه تقديرية وقد تتغير وفقاً لإجراءات الجهات المختصة وملاحظاتها.`,
      notes: `ملاحظاتها.
المادة السادسة: الشروط الخاصة
في حال طلب الطرف الثاني من الطرف الأول إجراء أي تعديلات  بعد اعتماده، فإنه يلتزم بدفع أتعاب إضافية يتم الاتفاق عليها كتابياً.
عند استلزام المعاملة اصدار اي موافقات اخرى غير المذكورة في نطاق الخدمات المقدمة يتم الاتفاق على رسوم اضافية.
يلتزم الطرف الأول بالحفاظ على سرية جميع المعلومات والمستندات المتعلقة بالقسيمة والمشروع.
يلتزم الطرف الأول بتقديم النصح والمشورة الفنية للطرف الثاني فيما يتعلق بالتصميم والتراخيص.
يتم اصدار تعهد اشراف وانهاء اشراف شريطة عدم وجود مخالفات لنظام البناء
يلتزم الطرف الثاني باستخراج ترخيص سلامة من مقاول معتمد لزوم انهاء الاشراف .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد بناء جديد - تجاري`,
      buildingType: `تجاري`,
      serviceType: `تصميم وترخيص وإشراف`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد التصميم المعماري الجديد للقسيمة، ويشمل:
إعداد المخططات المعمارية حسب الأنظمة والمساحات.
الالتزام باشتراطات البناء.
تعديل التصميم وفقاً لملاحظات الطرف الثاني حتى الوصول إلى التصميم النهائي
استخراج ترخيص الإدارة العامة للإطفاء، ويشمل:
إعداد مخططات الاطفاء.
تصميم مخارج الطوارئ وفقاً لاشتراطات السلامة.
تقديم المخططات للإدارة العامة للإطفاء.
متابعة إجراءات الحصول على موافقة الإدارة العامة للإطفاء.
تعديل المخططات وفقاً لملاحظات الإدارة العامة للإطفاء إن وجدت.
استخراج الرأي التنظيمي، ويشمل
إعداد المخططات المطلوبة لإدارة التنظيم.
تقديم المخططات لإدارة التنظيم.
متابعة إجراءات الحصول على الرأي التنظيمي.
تعديل المخططات وفقاً لملاحظات إدارة التنظيم إن وجدت.
استخراج رخصة البناء من بلدية الكويت، ويشمل :-
إعداد المخططات النهائية بعد الحصول على موافقة الإدارة العامة للإطفاء والرأي التنظيمي.
تقديم المخططات لبلدية الكويت
متابعة إجراءات الحصول على رخصة البناء.
تعديل المخططات وفقاً لملاحظات بلدية الكويت إن وجدت.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول (الإستشاري)                                                                                    الطرف الثاني (المالك)
التوقيع:                                                                                                                  التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي
نسخة من الترخيص الصناعي.
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
مراجعة واعتماد التصاميم المقدمة من الطرف الأول خلال مدة أقصاها (10) أيام عمل من تاريخ تقديمها.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي
نسخة من الترخيص الصناعي.
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
مراجعة واعتماد التصاميم المقدمة من الطرف الأول خلال مدة أقصاها (10) أيام عمل من تاريخ تقديمها.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      duration: `مدة العقد
المدة المتوقعة لإعداد التصميم المعماري هي (5) يوم عمل من تاريخ توقيع العقد.
المدة المتوقعة للحصول على موافقة الإدارة العامة للإطفاء هي (15) يوم عمل من تاريخ اعتماد التصميم المعماري.
المدة المتوقعة للحصول على رخصة البناء هي (15) يوم عمل من تاريخ الحصول على موافقة الإدارة العامة للإطفاء.
المدد المذكورة أعلاه تقديرية وقد تتغير وفقاً لإجراءات الجهات المختصة وملاحظاتها.`,
      notes: `ملاحظات الطرف الثاني حتى الوصول إلى التصميم النهائي
استخراج ترخيص الإدارة العامة للإطفاء، ويشمل:
إعداد مخططات الاطفاء.
تصميم مخارج الطوارئ وفقاً لاشتراطات السلامة.
تقديم المخططات للإدارة العامة للإطفاء.
متابعة إجراءات الحصول على موافقة الإدارة العامة للإطفاء.
تعديل المخططات وفقاً لملاحظات الإدارة العامة للإطفاء إن وجدت.
استخراج الرأي التنظيمي، ويشمل
إعداد المخططات المطلوبة لإدارة التنظيم.
تقديم المخططات لإدارة التنظيم.
متابعة إجراءات الحصول على الرأي التنظيمي.
تعديل المخططات وفقاً لملاحظات إدارة التنظيم إن وجدت.
استخراج رخصة البناء من بلدية الكويت، ويشمل :-
إعداد المخططات النهائية بعد الحصول على موافقة الإدارة العامة للإطفاء والرأي التنظيمي.
تقديم المخططات لبلدية الكويت
متابعة إجراءات الحصول على رخصة البناء.
تعديل المخططات وفقاً لملاحظات بلدية الكويت إن وجدت.`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد هدم - تجاري`,
      buildingType: `تجاري`,
      serviceType: `هدم`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد وتقديم المستندات اللازمة للحصول على رخصة هدم من بلدية الكويت والهيئة العامة للصناعة، وتشمل
إجراء زيارة ميدانية للقسيمة وإعداد تقرير عن حالتها الراهنة
إعداد المخططات المطلوبة للهدم وفقاً لاشتراطات بلدية الكويت والهيئة العامة للصناعة
تجهيز التعهدات اللازمة للترخيص (تعهد بمسؤولية الكشف على العقار وخلوه من المخالفات، تعهد رفع كيبل الكهرباء، تعهد تحمل مسؤولية المحلات المؤجرة)
تقديم نموذج وزارة المواصلات للهدم
. الحصول على موافقة وزارة الكهرباء والماء قبل إصدار رخصة الهدم.
متابعة إجراءات الحصول على رخصة الهدم لدى جميع الجهات المختصة.
الإشراف على أعمال الهدم، وتشمل:
إعداد خطة الهدم بالتنسيق مع المقاول المنفذ
التأكد من اتباع إجراءات السلامة أثناء الهدم
التأكد من عدم الإضرار بالمباني المجاورة.
التأكد من التخلص السليم من مخلفات الهدم وفقاً للوائح البيئية.
إجراء زيارات دورية للموقع خلال فترة الهدم (بحد أدنى مرتين أسبوعياً).
إعداد تقارير دورية عن سير أعمال الهدم
إعداد تقرير نهائي بعد الانتهاء من أعمال الهدم.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول (الإستشاري)                                                                        الطرف الثاني (المالك)
التوقيع:                                                                                                التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي.
نسخة من الترخيص الصناعي.
نسخة من المخططات والرخص السابقة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.
سداد جميع الرسوم الحكومية المطلوبة لإصدار رخصة الهدم.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي.
نسخة من الترخيص الصناعي.
نسخة من المخططات والرخص السابقة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.
سداد جميع الرسوم الحكومية المطلوبة لإصدار رخصة الهدم.`,
      duration: `مدة العقد
تبدأ مدة هذا العقد من تاريخ توقيعه وتنتهي بانتهاء أعمال الهدم وتقديم التقرير النهائي.
المدة المتوقعة للحصول على رخصة الهدم هي (30) يوماً من تاريخ تقديم جميع المستندات المطلوبة، ما لم تطرأ ظروف خارجة عن إرادة الطرف الأول.
المدة المتوقعة للإشراف على أعمال الهدم هي (15) يوماً من تاريخ البدء في أعمال الهدم.`,
      notes: ``,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد إضافة وتعديل - صناعي`,
      buildingType: `صناعي`,
      serviceType: `تعديل وإضافة`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
تجهيز المخططات المعمارية واعتمادها من المالك.
إعادة رسم مخططات البلدية والاطفاء بصيفة ( AutoCad  ).
الكشف علي القسيمة واعتماد مطابقة المخططات بواقع المبني.
تجهيز المخططات وتقديمها للإدارة العامه للاطفاء واعتمادها واستخراج رخصة مشاريع.
تجهيز المخططات وتقديمها للإدارة العامة للتنظيم واستخراج راي تنظيمي.
تقديم المخططات حسب نظام البناء المعمول به في بلدية الكويت  لاستخراج رخصة البناء التعديلية.
اصدار تعهد اشراف.
يتم احتساب شهرين اشراف مجاناً ، علي ان يتم احتساب ( 250 د.ك ) رسوم الاشراف الشهري بداية من الشهر الثالث للاشراف وحتي اعتماد انهاء الاشراف من  البلدية.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول (الإستشاري)                                                                    الطرف الثاني
التوقيع:                                                                                            التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      duration: `مدة العقد
تبدأ مدة هذا العقد من استكمال المتطلبات الخاصة بالترخيص بإستقبال المعاملات حسب القانون الجديد للحصول على رخصة البناء من بلدية الكويت.
المدة المتوقعة لإصدر التراخيص هي (25) يوم عمل من تاريخ التقديم.
المدد المذكورة أعلاه تقديرية وقد تتغير وفقاً لإجراءات الجهات المختصة وملاحظاتها.`,
      notes: `ملاحظاتها.
المادة السادسة: الشروط الخاصة
في حال طلب الطرف الثاني من الطرف الأول إجراء أي تعديلات  بعد اعتماده، فإنه يلتزم بدفع أتعاب إضافية يتم الاتفاق عليها كتابياً.
عند استلزام المعاملة اصدار اي موافقات اخرى غير المذكورة في نطاق الخدمات المقدمة يتم الاتفاق على رسوم اضافية.
يلتزم الطرف الأول بالحفاظ على سرية جميع المعلومات والمستندات المتعلقة بالقسيمة والمشروع.
يلتزم الطرف الأول بتقديم النصح والمشورة الفنية للطرف الثاني فيما يتعلق بالتصميم والتراخيص.
يتم اصدار تعهد اشراف وانهاء اشراف شريطة عدم وجود مخالفات لنظام البناء
يلتزم الطرف الثاني باستخراج ترخيص سلامة من مقاول معتمد لزوم انهاء الاشراف .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد بناء جديد - صناعي`,
      buildingType: `صناعي`,
      serviceType: `تصميم وترخيص وإشراف`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد التصميم المعماري الجديد للقسيمة، ويشمل:
إعداد المخططات المعمارية حسب الأنظمة والمساحات.
الالتزام باشتراطات البناء في المناطق الصناعية.
تعديل التصميم وفقاً لملاحظات الطرف الثاني حتى الوصول إلى التصميم النهائي.
استخراج ترخيص الإدارة العامة للإطفاء، ويشمل:
إعداد مخططات الاطفاء.
تصميم مخارج الطوارئ وفقاً لاشتراطات السلامة.
تقديم المخططات للإدارة العامة للإطفاء.
متابعة إجراءات الحصول على موافقة الإدارة العامة للإطفاء.
تعديل المخططات وفقاً لملاحظات الإدارة العامة للإطفاء إن وجدت.
استخراج الرأي التنظيمي، ويشمل
إعداد المخططات المطلوبة لإدارة التنظيم.
تقديم المخططات لإدارة التنظيم.
متابعة إجراءات الحصول على الرأي التنظيمي.
تعديل المخططات وفقاً لملاحظات إدارة التنظيم إن وجدت.
استخراج رخصة البناء من بلدية الكويت، ويشمل :-
إعداد المخططات النهائية بعد الحصول على موافقة الإدارة العامة للإطفاء والرأي التنظيمي.
تقديم المخططات لبلدية الكويت
متابعة إجراءات الحصول على رخصة البناء.
تعديل المخططات وفقاً لملاحظات بلدية الكويت إن وجدت.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول (الإستشاري)                                                                                    الطرف الثاني
التوقيع:                                                                                                                  التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي
نسخة من الترخيص الصناعي.
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
مراجعة واعتماد التصاميم المقدمة من الطرف الأول خلال مدة أقصاها (10) أيام عمل من تاريخ تقديمها.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل:
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي
نسخة من الترخيص الصناعي.
أي مستندات أخرى تطلبها الجهات المختصة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
مراجعة واعتماد التصاميم المقدمة من الطرف الأول خلال مدة أقصاها (10) أيام عمل من تاريخ تقديمها.
سداد جميع الرسوم الحكومية المطلوبة لإصدار التراخيص.
تزويد الطرف الأول بالمتطلبات والاحتياجات الخاصة بالمشروع.`,
      duration: `مدة العقد
تبدأ مدة هذا العقد من تاريخ اصدار رخصة الهدم وتنتهي بالحصول على رخصة البناء من بلدية الكويت.
المدة المتوقعة لإعداد التصميم المعماري هي (5) يوم عمل من تاريخ توقيع العقد.
المدة المتوقعة للحصول على موافقة الإدارة العامة للإطفاء هي (15) يوم عمل من تاريخ اعتماد التصميم المعماري.
المدة المتوقعة للحصول على رخصة البناء هي (15) يوم عمل من تاريخ الحصول على موافقة الإدارة العامة للإطفاء.
المدد المذكورة أعلاه تقديرية وقد تتغير وفقاً لإجراءات الجهات المختصة وملاحظاتها.`,
      notes: `ملاحظات الطرف الثاني حتى الوصول إلى التصميم النهائي.
استخراج ترخيص الإدارة العامة للإطفاء، ويشمل:
إعداد مخططات الاطفاء.
تصميم مخارج الطوارئ وفقاً لاشتراطات السلامة.
تقديم المخططات للإدارة العامة للإطفاء.
متابعة إجراءات الحصول على موافقة الإدارة العامة للإطفاء.
تعديل المخططات وفقاً لملاحظات الإدارة العامة للإطفاء إن وجدت.
استخراج الرأي التنظيمي، ويشمل
إعداد المخططات المطلوبة لإدارة التنظيم.
تقديم المخططات لإدارة التنظيم.
متابعة إجراءات الحصول على الرأي التنظيمي.
تعديل المخططات وفقاً لملاحظات إدارة التنظيم إن وجدت.
استخراج رخصة البناء من بلدية الكويت، ويشمل :-
إعداد المخططات النهائية بعد الحصول على موافقة الإدارة العامة للإطفاء والرأي التنظيمي.
تقديم المخططات لبلدية الكويت
متابعة إجراءات الحصول على رخصة البناء.
تعديل المخططات وفقاً لملاحظات بلدية الكويت إن وجدت.`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد هدم - صناعي`,
      buildingType: `صناعي`,
      serviceType: `هدم`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد وتقديم المستندات اللازمة للحصول على رخصة هدم من بلدية الكويت والهيئة العامة للصناعة، وتشمل
إجراء زيارة ميدانية للقسيمة وإعداد تقرير عن حالتها الراهنة
إعداد المخططات المطلوبة للهدم وفقاً لاشتراطات بلدية الكويت والهيئة العامة للصناعة
تجهيز التعهدات اللازمة للترخيص (تعهد بمسؤولية الكشف على العقار وخلوه من المخالفات، تعهد رفع كيبل الكهرباء، تعهد تحمل مسؤولية المحلات المؤجرة)
تقديم نموذج وزارة المواصلات للهدم
. الحصول على موافقة وزارة الكهرباء والماء قبل إصدار رخصة الهدم.
متابعة إجراءات الحصول على رخصة الهدم لدى جميع الجهات المختصة.
الإشراف على أعمال الهدم، وتشمل:
إعداد خطة الهدم بالتنسيق مع المقاول المنفذ
التأكد من اتباع إجراءات السلامة أثناء الهدم
التأكد من عدم الإضرار بالمباني المجاورة.
التأكد من التخلص السليم من مخلفات الهدم وفقاً للوائح البيئية.
إجراء زيارات دورية للموقع خلال فترة الهدم (بحد أدنى مرتين أسبوعياً).
إعداد تقارير دورية عن سير أعمال الهدم
إعداد تقرير نهائي بعد الانتهاء من أعمال الهدم.`,
      terms: `أحكام عامة
يخضع هذا العقد لأحكام القانون الكويتي.
أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
تعتبر العناوين المذكورة في هذا العقد بمثابة المحل المختار للطرفين وتتم المراسلات عليها.
حررت هذه الاتفاقية من نسختين أصليتين باللغة العربية، بيد كل طرف نسخة للعمل بموجبها.
وإشهاداً على ما تقدم، قام الطرفان بالتوقيع على هذا العقد في التاريخ المذكور أعلاه.
الطرف الأول (الإستشاري)                                                                        الطرف الثاني (مالك حق انتفاع)
التوقيع:                                                                                                التوقيع:`,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي.
نسخة من الترخيص الصناعي.
نسخة من المخططات والرخص السابقة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.
سداد جميع الرسوم الحكومية المطلوبة لإصدار رخصة الهدم.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
نسخة من عقد الهيئة العامة للصناعة.
نسخة من وصل الإيجار ساري المفعول.
نسخة من البطاقة المدنية للمالك أو توكيل رسمي.
نسخة من الترخيص الصناعي.
نسخة من المخططات والرخص السابقة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
الالتزام بإزالة المخالفات إن وجدت قبل البدء في إجراءات الحصول على رخصة الهدم.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.
تعيين مقاول مصنف ومعتمد للقيام بأعمال الهدم.
إصدار رخصة سلامة من بلدية الكويت قبل البدء في أعمال الهدم.
سداد جميع الرسوم الحكومية المطلوبة لإصدار رخصة الهدم.`,
      duration: `مدة العقد
تبدأ مدة هذا العقد من تاريخ توقيعه وتنتهي بانتهاء أعمال الهدم وتقديم التقرير النهائي.
المدة المتوقعة للحصول على رخصة الهدم هي (30) يوماً من تاريخ تقديم جميع المستندات المطلوبة، ما لم تطرأ ظروف خارجة عن إرادة الطرف الأول.
المدة المتوقعة للإشراف على أعمال الهدم هي (15) يوماً من تاريخ البدء في أعمال الهدم.`,
      notes: ``,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد رخصة زراعة - سكن خاص`,
      buildingType: `سكن خاص`,
      serviceType: `رخصة زراعة`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد وتقديم المستندات اللازمة للحصول على رخصة هدم من بلدية الكويت ، وتشمل
إجراء زيارة ميدانية للقسيمة .
تجهيز التعهدات اللازمة للترخيص .
تصميم مخططات الحديقة بما يتناسب مع قوانين البلدية واعتمادها من المالك.
اصدار رخصة الحديقة من البلدية.`,
      terms: ``,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
وثيقة التملك.
مدنيات الملاك.
صور القسيمة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
وثيقة التملك.
مدنيات الملاك.
صور القسيمة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.`,
      duration: ``,
      notes: ``,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد رخصة مظلة - سكن خاص`,
      buildingType: `سكن خاص`,
      serviceType: `رخصة مظلة`,
      scopeOfWork: `المادة الأولى: يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.
المادة الثانية: نطاق الخدمات
يلتزم الطرف الأول (الإستشاري) بتقديم الخدمات التالية:
إعداد وتقديم المستندات اللازمة للحصول على رخصة هدم من بلدية الكويت ، وتشمل
إجراء زيارة ميدانية للقسيمة .
تجهيز التعهدات اللازمة للترخيص .
تصميم مخططات المظلة بما يتناسب مع قوانين البلدية واعتمادها من المالك.
اصدار رخصة المظلة من البلدية.`,
      terms: ``,
      party1Obligations: ``,
      party2Obligations: `التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
وثيقة التملك.
مدنيات الملاك.
صور القسيمة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.`,
      paymentSchedule: `المادة الثالثة: التزامات الطرف الثاني (المالك)
يلتزم الطرف الثاني بما يلي:
تقديم جميع المستندات والوثائق اللازمة للطرف الأول، وتشمل
وثيقة التملك.
مدنيات الملاك.
صور القسيمة.
توقيع جميع المستندات والوثائق المطلوبة من الجهات المختصة.
تقديم الدعم والمتابعة للإجراءات في الجهات المعنية.
تسهيل عملية دخول مهندسي المكتب الاستشاري للقسيمة للكشف ورفع المقاسات.`,
      duration: ``,
      notes: ``,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد بناء جديد - مسك الدار`,
      buildingType: `سكن خاص`,
      serviceType: `تصميم وترخيص وإشراف (مسك)`,
      scopeOfWork: `المادة (1): نطاق الخدمات وافق الاستشاري على تقديم الخدمات التالية:
تعديلات علي التصميم المعماري المقدم من الطرف الثاني ( الشركة ) .
التصميم الانشائي.
فحص التربة.
كتاب إمكانية إيصال تيار كهربائي.
اصدار رخصة بناء من بلدية الكويت.
مخطط صحي.
اشراف لمدة اربعة اشهر ( مجاناً ).`,
      terms: `المادة (6): أحكام عامة
في حال فسخ العقد من قبل المالك، لا يحق له استرداد أي مبالغ تم دفعها.
في حال نشوء أي نزاع، يتم حله وديًا، فإن تعذر، يتم اللجوء إلى التحكيم أو المحاكم الكويتية المختصة.`,
      party1Obligations: `المادة (4): التزامات المالك
تزويد الاستشاري بكافة المستندات المطلوبة والتعاقد مع مقاول معتمد واصدار رخصة سلامة.
الالتزام بسداد دفعات الأتعاب في مواعيدها. لا يجوز حجز أو استقطاع أي جزء من أتعاب الاستشاري.
عند التعديل على المخطط المعتمد بعد اصدار الرخصة يستلزم المالك اصدار رخصة تعديلية برسوم اضافية حسب التعديل.
تحتسب رسوم اضافية عند التعديل على المخططات الانشائية بعد اعتمادها والانتهاء من تنفيذها حسب حجم التعديل.`,
      party2Obligations: ``,
      paymentSchedule: `المادة (3): الأتعاب المالية
إجمالي الأتعاب 800 دينار كويتي( فقط ثمانمائة دينار كويتي لا غير).
آلية الدفع:
الدفعة الأولى 50% بقيمة 400 دينار كويتي عند توقيع العقد.
الدفعة الثانية 50% بقيمة  400 دينار كويتي بعد صدور رخصة البناء.`,
      duration: `المادة (2): مراحل التصميم .
المرحلة الأولى (التصميم المعماري):
دراســـــة موقع المشــــــروع والمنطقة المحيطة
دراسة استعمالات ومساحات مكونات المشروع طبقا  لإشتراطات قوانين نظم البناء.
عــرض الفكرة المعمارية على المالـك واستلام الملاحظـات .
تعديلات مفتوحة على المخططات المعمارية .
اعتماد المخطط المعماري مع المالك.
المرحلة الثانية (التصميم الانشائي):
وضع اماكن الاعمدة والتعديل عليها بعد اعتماد التصميم المعماري وتصميم الواجهات.
تصميم المخططات الانشائية  بعد اعتماد المخطط المعماري والواجهات حسب المخطط المعتمد من بلدية الكويت واعتمادها مع المالك .
المرحلة الثانية (تصميم الواجهات):
تصميم الواجهات حسب اختيار المالك من انواع التصميم.
عند اعتماد طابع التصميم يتم التعديل على الواجهات 3 مرات فقط.
يتم اعتماد الواجهات والتعديل عليها حسب اماكن الاعمدة .`,
      notes: `المادة (5): الإشراف على التنفيذ
مدة الإشراف الأساسية:  اربعة (4) أشهر، تبدأ من تاريخ إصدار "تعهد الإشراف". وتنتهي بأكتمال المباني ونظافة الموقع وتوقيع المالك نموذج انهاء الاشراف.
تمديد الإشراف: بعد انتهاء مدة الاشراف المجانية ، يتم تمديد الإشراف تلقائيًا مقابل  150  دينار كويتي عن كل شهر إضافي والجزء من الشهر يحسب شهر وتُدفع مقدمًا الى توقيع المالك انهاء الاشراف.
عدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
أخذ العينات وإرسالها للفحص وارسال النتائج للاستشارى للتأكد من مطابقتها للمواصفات المطلوبة.
ابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
يجب استخدام خرسانه جاهزة من مصنع معتمد و غير مسموح استخدام الخلط الموقعي للخرسانة وان تم استخدامه يعتبر الاشراف ملغي.
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .
لا يكون الطرف الأول مسؤولاً عن أي تأخير في الأعمال ناتج عن أي خلافات داخل الموقع .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: `عقد تعديل وإضافة - مسك الدار`,
      buildingType: `سكن خاص`,
      serviceType: `تعديل وإضافة (مسك)`,
      scopeOfWork: `المادة الأولى
يعتبرالتمهيد السابق جزءا  لا يتجزأ من الإتفاقية ويعتبرالعنوان بمثابة المحل المختار للطرفين تتم المراسلات عليه .`,
      terms: ``,
      party1Obligations: ``,
      party2Obligations: ``,
      paymentSchedule: `المادة الثالثة : واجبات المستشار لأعمال التصميم
المرحلة الأولى : الفكرة التصميمية الإبتدائية للمشروع وتشمل الآتى: -
دراســـــة موقع المشــــــروع والمنطقة المحيطة.                 .. ...     .. .. ...     ..
دراسة استعمالات ومساحات مكونات المشروع طبقا  لإشتراطات قوانين نظم البناء.
عــرض الفكرة المعمارية على المالـك واستلام الملاحظـات.
المرحلة الثانية: تطوير التصميم وإعداد المخططات اللازمة لإستخراج التراخيص وتشمل الآتى:
تجهيز المخططات المعمارية بعد اعتمادها من المالك وتقديمها إلى بلدية الكويت لإستخـراج رخصـة البنـاء .
إمكانية تقوية التيار الكهربائي .
تصميم المخططات الانشائية حسب المخطط المعتمد من بلدية الكويت .`,
      duration: `اشراف لمدة شهرين (مجاناً).
يلتزم الطرف الثاني بدفع مبلغ 100 د.ك رسوم الاشراف الشهري بداية الشهر الثالث وحتي الانتهاء من الاعمال وارسال صور القسيمة ورفع المعاملة للبلدية.
يلتزم الطرف الثاني بعدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
يلتزم الطرف الثاني بابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .`,
      notes: `الإشراف على التنفيذ
يلتزم الطرف الثاني بدفع مبلغ 100 د.ك رسوم الاشراف الشهري بداية الشهر الثالث وحتي الانتهاء من الاعمال وارسال صور القسيمة ورفع المعاملة للبلدية.
يلتزم الطرف الثاني بعدم إعطاء أي تعليمات فنية مباشرة للمقاول تتعارض مع المخططات المعتمدة.
يلتزم الطرف الثاني بأخذ العينات وإرسالها للفحص وارسال النتائج للاستشارى للتأكد من مطابقتها للمواصفات المطلوبة.
يلتزم الطرف الثاني بابلاغ الاستشاري بموعد جاهزية الاعمال للاستلام بمدة يومين على الاقل .
يجب استخدام خرسانه جاهزة من مصنع معتمد و غير مسموح استخدام الخلط الموقعي للخرسانة وان تم استخدامه يعتبر الاشراف ملغي.
توقف اعمال الاشراف في حالة تم مخالفة انظمة البناء ومخالفة المخططات المعتمدة من البلدية والمكتب الهندسي .
لا يكون الطرف الأول مسؤولاً عن أي تأخير في الأعمال ناتج عن أي خلافات داخل الموقع .`,
      isDefault: 0,
      createdAt: new Date().toISOString(),
    },
  ]).run();
}