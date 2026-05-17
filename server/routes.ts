/**
 * Dynamic Engineering System — Backend API
 * Architecture: Monolithic → Future: Self-hosted ERP on Synology NAS
 * All API routes are RESTful and stateless for easy migration.
 * Database: SQLite (portable, zero-config) → Future: PostgreSQL on Synology
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { eq, desc, like } from "drizzle-orm";
import { db, initDb } from "./db/index.js";
import { clients, projects, phases, tasks, quotations, contracts, invoices, invoiceLines, documents, crmLeads, contractTemplates } from "./db/schema.js";
import { nanoid } from "nanoid";

export const apiRouter = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));


// File upload config
const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// Init DB on startup
initDb();

// ── Health ────────────────────────────────────────────────────────────────
apiRouter.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Clients ───────────────────────────────────────────────────────────────
apiRouter.get("/api/clients", (_req, res) => {
  const rows = db.select().from(clients).orderBy(desc(clients.createdAt)).all();
  res.json(rows);
});

apiRouter.get("/api/clients/:id", (req, res) => {
  const row = db.select().from(clients).where(eq(clients.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

apiRouter.post("/api/clients", (req, res) => {
  const id = req.body.id || `C${nanoid(6).toUpperCase()}`;
  const now = new Date().toISOString().slice(0, 10);
  const row = db.insert(clients).values({ ...req.body, id, createdAt: req.body.createdAt || now }).returning().get();
  res.status(201).json(row);
});

apiRouter.put("/api/clients/:id", (req, res) => {
  const row = db.update(clients).set(req.body).where(eq(clients.id, req.params.id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

apiRouter.delete("/api/clients/:id", (req, res) => {
  db.delete(clients).where(eq(clients.id, req.params.id)).run();
  res.json({ success: true });
});

// ── Projects ──────────────────────────────────────────────────────────────
apiRouter.get("/api/projects", (_req, res) => {
  const rows = db.select().from(projects).orderBy(desc(projects.createdAt)).all();
  res.json(rows);
});

apiRouter.get("/api/projects/:id", (req, res) => {
  const project = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) return res.status(404).json({ error: "not found" });

  const projectPhases = db.select().from(phases)
    .where(eq(phases.projectId, req.params.id))
    .orderBy(phases.order)
    .all();

  const phasesWithTasks = projectPhases.map((phase) => {
    const phaseTasks = db.select().from(tasks)
      .where(eq(tasks.phaseId, phase.id))
      .orderBy(tasks.order)
      .all();
    return { ...phase, tasks: phaseTasks };
  });

  res.json({ ...project, phases: phasesWithTasks });
});

apiRouter.post("/api/projects", (req, res) => {
  const { phases: phasesData, ...projectData } = req.body;
  const now = new Date().toISOString().slice(0, 10);
  const id = projectData.id || `S${nanoid(5).toUpperCase()}`;

  const project = db.insert(projects)
    .values({ ...projectData, id, createdAt: projectData.createdAt || now })
    .returning().get();

  if (Array.isArray(phasesData)) {
    for (let i = 0; i < phasesData.length; i++) {
      const { tasks: tasksData, ...phaseData } = phasesData[i];
      const phase = db.insert(phases)
        .values({ ...phaseData, projectId: id, order: i })
        .returning().get();

      if (Array.isArray(tasksData)) {
        for (let j = 0; j < tasksData.length; j++) {
          db.insert(tasks).values({ ...tasksData[j], phaseId: phase.id, order: j }).run();
        }
      }
    }
  }

  res.status(201).json(project);
});

apiRouter.put("/api/projects/:id", (req, res) => {
  const { phases: _phases, ...projectData } = req.body;
  const row = db.update(projects).set(projectData).where(eq(projects.id, req.params.id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

apiRouter.delete("/api/projects/:id", (req, res) => {
  db.delete(projects).where(eq(projects.id, req.params.id)).run();
  res.json({ success: true });
});

// ── Tasks ─────────────────────────────────────────────────────────────────
apiRouter.get("/api/tasks", (_req, res) => {
  const rows = db
    .select({
      id: tasks.id,
      name: tasks.name,
      status: tasks.status,
      assignee: tasks.assignee,
      deadline: tasks.deadline,
      priority: tasks.priority,
      phaseId: tasks.phaseId,
      dependsOn: tasks.dependsOn,
      estimatedDays: tasks.estimatedDays,
      autoCreated: tasks.autoCreated,
      projectId: phases.projectId,
      projectName: projects.name,
      projectArea: projects.area,
      phaseTitle: phases.title,
    })
    .from(tasks)
    .innerJoin(phases, eq(tasks.phaseId, phases.id))
    .innerJoin(projects, eq(phases.projectId, projects.id))
    .all();
  res.json(rows);
});

apiRouter.put("/api/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.update(tasks).set(req.body).where(eq(tasks.id, id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });

  // Cascade-activate dependent tasks when this task is marked done
  if (row.status === "done") {
    const dependents = db.select().from(tasks).where(eq(tasks.dependsOn, id)).all();
    for (const dep of dependents) {
      if (dep.status === "pending") {
        db.update(tasks).set({ status: "in_progress" }).where(eq(tasks.id, dep.id)).run();
      }
    }
  }

  // Recompute project progress
  const phase = db.select().from(phases).where(eq(phases.id, row.phaseId)).get();
  if (phase) {
    const projectPhases = db.select().from(phases).where(eq(phases.projectId, phase.projectId)).all();
    let total = 0, done = 0;
    for (const p of projectPhases) {
      const pts = db.select().from(tasks).where(eq(tasks.phaseId, p.id)).all();
      total += pts.length;
      done += pts.filter((t) => t.status === "done").length;
    }
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    db.update(projects).set({ progress }).where(eq(projects.id, phase.projectId)).run();
  }

  res.json(row);
});

// ── Auto-Tasks (17-task standard matrix for سكن خاص بناء جديد) ─────────────
apiRouter.post("/api/projects/:id/auto-tasks", (req, res) => {
  const projectId = req.params.id;
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) return res.status(404).json({ error: "not found" });

  // Check no auto-created tasks exist yet
  const existingPhases = db.select().from(phases).where(eq(phases.projectId, projectId)).all();
  for (const ph of existingPhases) {
    const autoTasks = db.select().from(tasks).where(eq(tasks.phaseId, ph.id)).all().filter((t) => t.autoCreated === 1);
    if (autoTasks.length > 0) {
      return res.status(400).json({ error: "auto tasks already created" });
    }
  }

  // Phase definitions in workflow order
  const phaseDefs = [
    { title: "تجهيز الملف",          subtitle: "جمع الوثائق والملفات" },
    { title: "التصميم المعماري",     subtitle: "الكروكي والتصاميم" },
    { title: "التصميم الإنشائي",     subtitle: "الحسابات الإنشائية" },
    { title: "الرسم والإخراج",       subtitle: "إخراج المخططات" },
    { title: "تقديم البلدية",        subtitle: "المراجعة والاعتماد" },
    { title: "المخططات التفصيلية",   subtitle: "صحي وكهربائي" },
    { title: "الإشراف",             subtitle: "الإشراف على التنفيذ" },
  ];

  // Find or create each phase
  const phaseMap: Record<string, number> = {};
  for (const ep of existingPhases) phaseMap[ep.title] = ep.id;
  let nextOrder = existingPhases.length;
  for (const pd of phaseDefs) {
    if (!phaseMap[pd.title]) {
      const ph = db.insert(phases).values({ projectId, order: nextOrder++, title: pd.title, subtitle: pd.subtitle }).returning().get();
      phaseMap[pd.title] = ph.id;
    }
  }

  // 17-task matrix — depIdx: index in taskIds array (-1 = no dependency → starts in_progress)
  const taskDefs: { name: string; phase: string; assignee: string; depIdx: number; estimatedDays: number; status: string }[] = [
    { name: "تجميع مستندات العميل",    phase: "تجهيز الملف",          assignee: "سكرتير",   depIdx: -1, estimatedDays: 3,  status: "in_progress" },
    { name: "طلب تقرير تربة",          phase: "تجهيز الملف",          assignee: "سكرتير",   depIdx: -1, estimatedDays: 5,  status: "in_progress" },
    { name: "تعبئة نماذج البلدية",     phase: "تجهيز الملف",          assignee: "سكرتير",   depIdx: 0,  estimatedDays: 2,  status: "pending" },
    { name: "جلسة كروكي مع المالك",    phase: "التصميم المعماري",     assignee: "م. مصطفى", depIdx: 0,  estimatedDays: 1,  status: "pending" },
    { name: "إعداد الكروكي المبدئي",   phase: "التصميم المعماري",     assignee: "م. مصطفى", depIdx: 3,  estimatedDays: 5,  status: "pending" },
    { name: "اعتماد الكروكي من المالك",phase: "التصميم المعماري",     assignee: "م. مصطفى", depIdx: 4,  estimatedDays: 3,  status: "pending" },
    { name: "تصميم الواجهات",          phase: "التصميم المعماري",     assignee: "عفيف",     depIdx: 5,  estimatedDays: 5,  status: "pending" },
    { name: "التصميم الإنشائي",        phase: "التصميم الإنشائي",     assignee: "م. أمين",  depIdx: 5,  estimatedDays: 7,  status: "pending" },
    { name: "رسم مخططات البلدية",      phase: "الرسم والإخراج",       assignee: "عرفان",    depIdx: 7,  estimatedDays: 5,  status: "pending" },
    { name: "مراجعة المخططات",         phase: "الرسم والإخراج",       assignee: "م. مصطفى", depIdx: 8,  estimatedDays: 2,  status: "pending" },
    { name: "تقديم للبلدية",           phase: "تقديم البلدية",        assignee: "سكرتير",   depIdx: 9,  estimatedDays: 1,  status: "pending" },
    { name: "متابعة البلدية",          phase: "تقديم البلدية",        assignee: "سكرتير",   depIdx: 10, estimatedDays: 30, status: "pending" },
    { name: "رسم مخططات صحي",         phase: "المخططات التفصيلية",   assignee: "عرفان",    depIdx: 9,  estimatedDays: 3,  status: "pending" },
    { name: "رسم مخططات كهربائي",     phase: "المخططات التفصيلية",   assignee: "عرفان",    depIdx: 9,  estimatedDays: 3,  status: "pending" },
    { name: "زيارة إشراف",             phase: "الإشراف",             assignee: "م. خالد",  depIdx: 11, estimatedDays: 0,  status: "pending" },
    { name: "تقرير زيارة",             phase: "الإشراف",             assignee: "م. خالد",  depIdx: 14, estimatedDays: 1,  status: "pending" },
    { name: "خطاب بنك",                phase: "الإشراف",             assignee: "سكرتير",   depIdx: 14, estimatedDays: 0,  status: "pending" },
  ];

  const taskIds: number[] = [];
  const orderByPhase: Record<string, number> = {};

  for (const td of taskDefs) {
    const phaseId = phaseMap[td.phase];
    const order = orderByPhase[td.phase] ?? 0;
    orderByPhase[td.phase] = order + 1;
    const dependsOn = td.depIdx >= 0 ? (taskIds[td.depIdx] ?? 0) : 0;

    const task = db.insert(tasks).values({
      phaseId,
      name: td.name,
      status: td.status,
      assignee: td.assignee,
      estimatedDays: td.estimatedDays,
      dependsOn,
      autoCreated: 1,
      order,
    }).returning().get();

    taskIds.push(task.id);
  }

  // Set project to active
  db.update(projects).set({ status: "جارٍ" }).where(eq(projects.id, projectId)).run();

  res.status(201).json({ created: taskIds.length, taskIds });
});

// ── Quotations ────────────────────────────────────────────────────────────
apiRouter.get("/api/quotations", (req, res) => {
  const { leadId } = req.query as Record<string, string>;
  const rows = leadId
    ? db.select().from(quotations).where(eq(quotations.leadId, leadId)).orderBy(desc(quotations.date)).all()
    : db.select().from(quotations).orderBy(desc(quotations.date)).all();
  res.json(rows);
});

apiRouter.get("/api/quotations/:id", (req, res) => {
  const row = db.select().from(quotations).where(eq(quotations.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

apiRouter.post("/api/quotations", (req, res) => {
  const id = req.body.id || `S${nanoid(5).toUpperCase()}`;
  const now = new Date().toISOString().slice(0, 10);
  const row = db.insert(quotations).values({ ...req.body, id, date: req.body.date || now }).returning().get();
  res.status(201).json(row);
});

apiRouter.put("/api/quotations/:id", (req, res) => {
  const row = db.update(quotations).set(req.body).where(eq(quotations.id, req.params.id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

// ── Contracts ─────────────────────────────────────────────────────────────
apiRouter.get("/api/contracts", (req, res) => {
  const { leadId } = req.query as Record<string, string>;
  const rows = leadId
    ? db.select().from(contracts).where(eq(contracts.leadId, leadId)).orderBy(desc(contracts.date)).all()
    : db.select().from(contracts).orderBy(desc(contracts.date)).all();
  res.json(rows);
});

apiRouter.get("/api/contracts/:id", (req, res) => {
  const row = db.select().from(contracts).where(eq(contracts.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

apiRouter.post("/api/contracts", (req, res) => {
  const id = req.body.id || `CON-${new Date().getFullYear()}-${nanoid(3).toUpperCase()}`;
  const now = new Date().toISOString().slice(0, 10);
  const row = db.insert(contracts).values({
    ...req.body,
    id,
    date: req.body.date || now,
    leadId: req.body.leadId || "",        // Bug #1: ensure leadId is always persisted
  }).returning().get();
  res.status(201).json(row);
});

apiRouter.put("/api/contracts/:id", (req, res) => {
  const row = db.update(contracts).set(req.body).where(eq(contracts.id, req.params.id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

// ── Invoices ──────────────────────────────────────────────────────────────
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const prefix = `DYN-INV-${year}-`;
  const existing = db.select({ n: invoices.invoiceNumber }).from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`))
    .all();
  const max = existing.reduce((m, r) => {
    const num = parseInt((r.n ?? "").replace(prefix, ""), 10) || 0;
    return Math.max(m, num);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

apiRouter.get("/api/invoices", (_req, res) => {
  const rows = db.select().from(invoices).orderBy(desc(invoices.date)).all();
  const result = rows.map((inv) => ({
    ...inv,
    lines: db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id)).all(),
  }));
  res.json(result);
});

apiRouter.get("/api/invoices/by-contract/:contractId", (req, res) => {
  const rows = db.select().from(invoices)
    .where(eq(invoices.contractId, req.params.contractId))
    .orderBy(desc(invoices.date))
    .all();
  const result = rows.map((inv) => ({
    ...inv,
    lines: db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id)).all(),
  }));
  res.json(result);
});

apiRouter.get("/api/invoices/:id", (req, res) => {
  const inv = db.select().from(invoices).where(eq(invoices.id, req.params.id)).get();
  if (!inv) return res.status(404).json({ error: "not found" });
  const lines = db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id)).all();
  res.json({ ...inv, lines });
});

apiRouter.post("/api/invoices", (req, res) => {
  const { lines, ...invData } = req.body;
  const invoiceNumber = invData.invoiceNumber || generateInvoiceNumber();
  const id = invData.id || `INV/${new Date().getFullYear()}/${nanoid(5).toUpperCase()}`;
  const now = new Date().toISOString().slice(0, 10);

  const inv = db.insert(invoices).values({ ...invData, id, invoiceNumber, date: invData.date || now }).returning().get();

  if (Array.isArray(lines)) {
    for (const line of lines) {
      db.insert(invoiceLines).values({ ...line, invoiceId: id }).run();
    }
  }
  res.status(201).json(inv);
});

apiRouter.put("/api/invoices/:id", (req, res) => {
  const { lines, ...invData } = req.body;
  const row = db.update(invoices).set(invData).where(eq(invoices.id, req.params.id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

// ── Documents ─────────────────────────────────────────────────────────────
apiRouter.get("/api/documents", (req, res) => {
  const { clientId, projectId } = req.query as Record<string, string>;
  let query = db.select().from(documents);
  if (clientId) query = db.select().from(documents).where(eq(documents.clientId, clientId)) as typeof query;
  if (projectId) query = db.select().from(documents).where(eq(documents.projectId, projectId)) as typeof query;
  res.json(query.all());
});

apiRouter.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  const { clientId, projectId, name, category } = req.body;
  const now = new Date().toISOString();
  const doc = db.insert(documents).values({
    clientId: clientId || null,
    projectId: projectId || null,
    name: name || req.file.originalname,
    category: category || "",
    status: "received",
    fileName: req.file.filename,
    fileSize: `${(req.file.size / 1024).toFixed(0)} KB`,
    uploadedAt: now,
    url: `/uploads/${req.file.filename}`,
  }).returning().get();
  res.status(201).json(doc);
});

// Serve uploaded files
apiRouter.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Reports charts ────────────────────────────────────────────────────────
apiRouter.get("/api/reports/charts", (_req, res) => {
  const allInvoices = db.select().from(invoices).all();
  const allProjects = db.select().from(projects).all();
  const allQuotations = db.select().from(quotations).all();

  // Monthly revenue (last 6 months) from paid invoices
  const monthNames: Record<string, string> = {
    "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
    "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
    "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
  };
  const revenueByMonth: Record<string, number> = {};
  for (const inv of allInvoices) {
    if (inv.status === "مدفوعة" && inv.date) {
      const month = inv.date.slice(0, 7); // YYYY-MM
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (inv.total || 0);
    }
  }
  const monthlyRevenue = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, revenue]) => ({ month: monthNames[key.slice(5, 7)] || key, revenue }));

  // Projects by type
  const typeCount: Record<string, number> = {};
  for (const p of allProjects) {
    typeCount[p.type] = (typeCount[p.type] || 0) + 1;
  }
  const typeColors: Record<string, string> = {
    "سكن خاص": "#1B4965", "تجاري": "#C4956A", "استثماري": "#5B8C5A", "صناعي": "#D4A574",
  };
  const projectsByType = Object.entries(typeCount).map(([name, value]) => ({
    name, value, color: typeColors[name] || "#999",
  }));

  // Quotation conversion by month (last 4 months)
  const sentByMonth: Record<string, number> = {};
  const convertedByMonth: Record<string, number> = {};
  for (const q of allQuotations) {
    if (!q.date) continue;
    const month = q.date.slice(0, 7);
    if (q.status !== "مسودة") sentByMonth[month] = (sentByMonth[month] || 0) + 1;
    if (q.status === "مقبول" || q.status === "عقد") convertedByMonth[month] = (convertedByMonth[month] || 0) + 1;
  }
  const allMonths = [...new Set([...Object.keys(sentByMonth), ...Object.keys(convertedByMonth)])].sort().slice(-4);
  const quotationConversion = allMonths.map((m) => ({
    month: monthNames[m.slice(5, 7)] || m,
    sent: sentByMonth[m] || 0,
    converted: convertedByMonth[m] || 0,
  }));

  res.json({ monthlyRevenue, projectsByType, quotationConversion });
});

// ── Reports summary ───────────────────────────────────────────────────────
apiRouter.get("/api/reports/summary", (_req, res) => {
  const allInvoices = db.select().from(invoices).all();
  const allProjects = db.select().from(projects).all();
  const allQuotations = db.select().from(quotations).all();
  const allClients = db.select().from(clients).all();

  const totalRevenue = allInvoices
    .filter((i) => i.status === "مدفوعة")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const completedProjects = allProjects.filter((p) => p.progress >= 100).length;
  const newClients = allClients.filter((c) => c.createdAt >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).length;

  const sentQuotations = allQuotations.filter((q) => q.status !== "مسودة").length;
  const acceptedQuotations = allQuotations.filter((q) => ["مقبول", "عقد"].includes(q.status)).length;
  const conversionRate = sentQuotations > 0 ? Math.round((acceptedQuotations / sentQuotations) * 100) : 0;

  res.json({ totalRevenue, completedProjects, newClients, conversionRate, totalProjects: allProjects.length, totalClients: allClients.length });
});

// ── CRM Leads ─────────────────────────────────────────────────────────────

const parseLead = (r: typeof crmLeads.$inferSelect) => ({ ...r, tags: JSON.parse(r.tags || "[]") });

apiRouter.get("/api/crm-leads", (_req, res) => {
  const rows = db.select().from(crmLeads).orderBy(desc(crmLeads.date)).all();
  res.json(rows.map(parseLead));
});

apiRouter.get("/api/crm-leads/:id", (req, res) => {
  const row = db.select().from(crmLeads).where(eq(crmLeads.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(parseLead(row));
});

apiRouter.post("/api/crm-leads", (req, res) => {
  const id = `L${nanoid(6).toUpperCase()}`;
  const now = new Date().toISOString().slice(0, 10);
  const { tags, ...rest } = req.body;
  const row = db.insert(crmLeads).values({ ...rest, id, tags: JSON.stringify(tags || []), date: rest.date || now }).returning().get();
  res.status(201).json(parseLead(row));
});

apiRouter.put("/api/crm-leads/:id", (req, res) => {
  const { tags, ...rest } = req.body;
  const updateData = tags !== undefined ? { ...rest, tags: JSON.stringify(tags) } : rest;
  const row = db.update(crmLeads).set(updateData).where(eq(crmLeads.id, req.params.id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(parseLead(row));
});

apiRouter.delete("/api/crm-leads/:id", (req, res) => {
  db.delete(crmLeads).where(eq(crmLeads.id, req.params.id)).run();
  res.json({ success: true });
});

// ── Contract Templates — Issue #16 ───────────────────────────────────────
apiRouter.get("/api/contract-templates", (_req, res) => {
  const rows = db.select().from(contractTemplates).orderBy(contractTemplates.id).all();
  res.json(rows);
});

apiRouter.get("/api/contract-templates/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.select().from(contractTemplates).where(eq(contractTemplates.id, id)).get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

apiRouter.post("/api/contract-templates", (req, res) => {
  const now = new Date().toISOString().slice(0, 10);
  const row = db.insert(contractTemplates).values({ ...req.body, createdAt: req.body.createdAt || now, isDefault: 0 }).returning().get();
  res.status(201).json(row);
});

apiRouter.put("/api/contract-templates/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.update(contractTemplates).set(req.body).where(eq(contractTemplates.id, id)).returning().get();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

apiRouter.delete("/api/contract-templates/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.delete(contractTemplates).where(eq(contractTemplates.id, id)).run();
  res.json({ success: true });
});
