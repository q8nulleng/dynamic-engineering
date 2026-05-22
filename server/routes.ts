/**
 * Dynamic Engineering System — Backend API
 * Database: MySQL (TiDB Cloud) — persistent, survives deployments
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { eq, desc, like } from "drizzle-orm";
import { getDb } from "./db/mysql.js";
import {
  clients, projects, phases, tasks, quotations, contracts,
  invoices, invoiceLines, documents, crmLeads, contractTemplates, appointments
} from "../drizzle/schema.js";
import { nanoid } from "nanoid";

export const apiRouter = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// File upload config
const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ── Health ────────────────────────────────────────────────────────────────
apiRouter.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Clients ───────────────────────────────────────────────────────────────
apiRouter.get("/api/clients", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    const [row] = await db.select().from(clients).where(eq(clients.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/clients", async (req, res) => {
  try {
    const db = getDb();
    const id = req.body.id || `C${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString().slice(0, 10);
    await db.insert(clients).values({ ...req.body, id, createdAt: req.body.createdAt || now });
    const [row] = await db.select().from(clients).where(eq(clients.id, id));
    res.status(201).json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.update(clients).set(req.body).where(eq(clients.id, req.params.id));
    const [row] = await db.select().from(clients).where(eq(clients.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/api/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(clients).where(eq(clients.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Projects ──────────────────────────────────────────────────────────────
apiRouter.get("/api/projects", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/projects/:id", async (req, res) => {
  try {
    const db = getDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, req.params.id));
    if (!project) return res.status(404).json({ error: "not found" });

    const projectPhases = await db.select().from(phases)
      .where(eq(phases.projectId, req.params.id))
      .orderBy(phases.order);

    const phasesWithTasks = await Promise.all(projectPhases.map(async (phase: any) => {
      const phaseTasks = await db.select().from(tasks)
        .where(eq(tasks.phaseId, phase.id))
        .orderBy(tasks.order);
      return { ...phase, tasks: phaseTasks };
    }));

    res.json({ ...project, phases: phasesWithTasks });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/projects", async (req, res) => {
  try {
    const db = getDb();
    const { phases: phasesData, ...projectData } = req.body;
    const now = new Date().toISOString().slice(0, 10);
    const id = projectData.id || `S${nanoid(5).toUpperCase()}`;

    await db.insert(projects).values({ ...projectData, id, createdAt: projectData.createdAt || now });

    if (Array.isArray(phasesData)) {
      for (let i = 0; i < phasesData.length; i++) {
        const { tasks: tasksData, ...phaseData } = phasesData[i];
        await db.insert(phases).values({ ...phaseData, projectId: id, order: i });
        const [phase] = await db.select().from(phases)
          .where(eq(phases.projectId, id))
          .orderBy(desc(phases.id));

        if (Array.isArray(tasksData)) {
          for (let j = 0; j < tasksData.length; j++) {
            await db.insert(tasks).values({ ...tasksData[j], phaseId: phase.id, order: j });
          }
        }
      }
    }

    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    res.status(201).json(project);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/projects/:id", async (req, res) => {
  try {
    const db = getDb();
    const { phases: _phases, ...projectData } = req.body;
    await db.update(projects).set(projectData).where(eq(projects.id, req.params.id));
    const [row] = await db.select().from(projects).where(eq(projects.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/api/projects/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(projects).where(eq(projects.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Tasks ─────────────────────────────────────────────────────────────────
apiRouter.get("/api/tasks", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db
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
      .innerJoin(projects, eq(phases.projectId, projects.id));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/tasks/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.update(tasks).set(req.body).where(eq(tasks.id, id));
    const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!row) return res.status(404).json({ error: "not found" });

    // Cascade-activate dependent tasks when this task is marked done
    if (row.status === "done") {
      const dependents = await db.select().from(tasks).where(eq(tasks.dependsOn, id));
      for (const dep of dependents as any[]) {
        if (dep.status === "pending") {
          await db.update(tasks).set({ status: "in_progress" }).where(eq(tasks.id, dep.id));
        }
      }
    }

    // Recompute project progress
    const [phase] = await db.select().from(phases).where(eq(phases.id, row.phaseId));
    if (phase) {
      const projectPhases = await db.select().from(phases).where(eq(phases.projectId, phase.projectId));
      let total = 0, done = 0;
      for (const p of projectPhases) {
        const pts = await db.select().from(tasks).where(eq(tasks.phaseId, p.id));
        total += pts.length;
        done += pts.filter((t: any) => t.status === "done").length;
      }
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      await db.update(projects).set({ progress }).where(eq(projects.id, phase.projectId));
    }

    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Auto-Tasks ────────────────────────────────────────────────────────────
apiRouter.post("/api/projects/:id/auto-tasks", async (req, res) => {
  try {
    const db = getDb();
    const projectId = req.params.id;
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return res.status(404).json({ error: "not found" });

    const existingPhases = await db.select().from(phases).where(eq(phases.projectId, projectId));
    for (const ph of existingPhases) {
      const allTasks = await db.select().from(tasks).where(eq(tasks.phaseId, ph.id));
      const autoTasks = allTasks.filter((t: any) => t.autoCreated === 1);
      if (autoTasks.length > 0) {
        return res.status(400).json({ error: "auto tasks already created" });
      }
    }

    const phaseDefs = [
      { title: "تجهيز الملف",          subtitle: "جمع الوثائق والملفات" },
      { title: "التصميم المعماري",     subtitle: "الكروكي والتصاميم" },
      { title: "التصميم الإنشائي",     subtitle: "الحسابات الإنشائية" },
      { title: "الرسم والإخراج",       subtitle: "إخراج المخططات" },
      { title: "تقديم البلدية",        subtitle: "المراجعة والاعتماد" },
      { title: "المخططات التفصيلية",   subtitle: "صحي وكهربائي" },
      { title: "الإشراف",             subtitle: "الإشراف على التنفيذ" },
    ];

    const phaseMap: Record<string, number> = {};
    for (const ep of existingPhases) phaseMap[ep.title] = ep.id;
    let nextOrder = existingPhases.length;
    for (const pd of phaseDefs) {
      if (!phaseMap[pd.title]) {
        await db.insert(phases).values({ projectId, order: nextOrder++, title: pd.title, subtitle: pd.subtitle });
        const [ph] = await db.select().from(phases)
          .where(eq(phases.projectId, projectId))
          .orderBy(desc(phases.id));
        phaseMap[pd.title] = ph.id;
      }
    }

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

      await db.insert(tasks).values({
        phaseId,
        name: td.name,
        status: td.status,
        assignee: td.assignee,
        estimatedDays: td.estimatedDays,
        dependsOn,
        autoCreated: 1,
        order,
      });
      const [task] = await db.select().from(tasks)
        .where(eq(tasks.phaseId, phaseId))
        .orderBy(desc(tasks.id));
      taskIds.push(task.id);
    }

    await db.update(projects).set({ status: "جارٍ" }).where(eq(projects.id, projectId));
    res.status(201).json({ created: taskIds.length, taskIds });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Quotations ────────────────────────────────────────────────────────────
apiRouter.get("/api/quotations", async (req, res) => {
  try {
    const db = getDb();
    const { leadId } = req.query as Record<string, string>;
    const rows = leadId
      ? await db.select().from(quotations).where(eq(quotations.leadId, leadId)).orderBy(desc(quotations.date))
      : await db.select().from(quotations).orderBy(desc(quotations.date));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/quotations/:id", async (req, res) => {
  try {
    const db = getDb();
    const [row] = await db.select().from(quotations).where(eq(quotations.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/quotations", async (req, res) => {
  try {
    const db = getDb();
    const id = req.body.id || `S${nanoid(5).toUpperCase()}`;
    const now = new Date().toISOString().slice(0, 10);
    await db.insert(quotations).values({ ...req.body, id, date: req.body.date || now });
    const [row] = await db.select().from(quotations).where(eq(quotations.id, id));
    res.status(201).json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/quotations/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.update(quotations).set(req.body).where(eq(quotations.id, req.params.id));
    const [row] = await db.select().from(quotations).where(eq(quotations.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Contracts ─────────────────────────────────────────────────────────────
apiRouter.get("/api/contracts", async (req, res) => {
  try {
    const db = getDb();
    const { leadId } = req.query as Record<string, string>;
    const rows = leadId
      ? await db.select().from(contracts).where(eq(contracts.leadId, leadId)).orderBy(desc(contracts.date))
      : await db.select().from(contracts).orderBy(desc(contracts.date));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/contracts/:id", async (req, res) => {
  try {
    const db = getDb();
    const [row] = await db.select().from(contracts).where(eq(contracts.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/contracts", async (req, res) => {
  try {
    const db = getDb();
    const id = req.body.id || `CON-${new Date().getFullYear()}-${nanoid(3).toUpperCase()}`;
    const now = new Date().toISOString().slice(0, 10);
    await db.insert(contracts).values({
      ...req.body,
      id,
      date: req.body.date || now,
      leadId: req.body.leadId || "",
    });
    const [row] = await db.select().from(contracts).where(eq(contracts.id, id));
    res.status(201).json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/contracts/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.update(contracts).set(req.body).where(eq(contracts.id, req.params.id));
    const [row] = await db.select().from(contracts).where(eq(contracts.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Invoices ──────────────────────────────────────────────────────────────
async function generateInvoiceNumber(): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `DYN-INV-${year}-`;
  const existing = await db.select({ n: invoices.invoiceNumber }).from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`));
  const max = existing.reduce((m: number, r: any) => {
    const num = parseInt((r.n ?? "").replace(prefix, ""), 10) || 0;
    return Math.max(m, num);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

apiRouter.get("/api/invoices", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(invoices).orderBy(desc(invoices.date));
    const result = await Promise.all(rows.map(async (inv: any) => ({
      ...inv,
      lines: await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id)),
    })));
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/invoices/by-contract/:contractId", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(invoices)
      .where(eq(invoices.contractId, req.params.contractId))
      .orderBy(desc(invoices.date));
    const result = await Promise.all(rows.map(async (inv: any) => ({
      ...inv,
      lines: await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id)),
    })));
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/invoices/:id", async (req, res) => {
  try {
    const db = getDb();
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
    if (!inv) return res.status(404).json({ error: "not found" });
    const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id));
    res.json({ ...inv, lines });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/invoices", async (req, res) => {
  try {
    const db = getDb();
    const { lines, ...invData } = req.body;
    const invoiceNumber = invData.invoiceNumber || await generateInvoiceNumber();
    const id = invData.id || `INV/${new Date().getFullYear()}/${nanoid(5).toUpperCase()}`;
    const now = new Date().toISOString().slice(0, 10);

    await db.insert(invoices).values({ ...invData, id, invoiceNumber, date: invData.date || now });

    if (Array.isArray(lines)) {
      for (const line of lines) {
        await db.insert(invoiceLines).values({ ...line, invoiceId: id });
      }
    }
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    res.status(201).json(inv);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/invoices/:id", async (req, res) => {
  try {
    const db = getDb();
    const { lines, ...invData } = req.body;
    await db.update(invoices).set(invData).where(eq(invoices.id, req.params.id));
    const [row] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Documents ─────────────────────────────────────────────────────────────
apiRouter.get("/api/documents", async (req, res) => {
  try {
    const db = getDb();
    const { clientId, projectId } = req.query as Record<string, string>;
    let rows;
    if (clientId) rows = await db.select().from(documents).where(eq(documents.clientId, clientId));
    else if (projectId) rows = await db.select().from(documents).where(eq(documents.projectId, projectId));
    else rows = await db.select().from(documents);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const db = getDb();
    if (!req.file) return res.status(400).json({ error: "no file" });
    const { clientId, projectId, name, category } = req.body;
    const now = new Date().toISOString();
    await db.insert(documents).values({
      clientId: clientId || null,
      projectId: projectId || null,
      name: name || req.file.originalname,
      category: category || "",
      status: "received",
      fileName: req.file.filename,
      fileSize: `${(req.file.size / 1024).toFixed(0)} KB`,
      uploadedAt: now,
      url: `/uploads/${req.file.filename}`,
    });
    const allDocs = await db.select().from(documents).orderBy(desc(documents.id));
    res.status(201).json(allDocs[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Serve uploaded files
apiRouter.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Reports charts ────────────────────────────────────────────────────────
apiRouter.get("/api/reports/charts", async (_req, res) => {
  try {
    const db = getDb();
    const allInvoices = await db.select().from(invoices);
    const allProjects = await db.select().from(projects);
    const allQuotations = await db.select().from(quotations);

    const monthNames: Record<string, string> = {
      "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
      "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
      "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
    };
    const revenueByMonth: Record<string, number> = {};
    for (const inv of allInvoices) {
      if (inv.status === "مدفوعة" && inv.date) {
        const month = inv.date.slice(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (inv.total || 0);
      }
    }
    const monthlyRevenue = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, revenue]) => ({ month: monthNames[key.slice(5, 7)] || key, revenue }));

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
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Reports summary ───────────────────────────────────────────────────────
apiRouter.get("/api/reports/summary", async (_req, res) => {
  try {
    const db = getDb();
    const allInvoices = await db.select().from(invoices);
    const allProjects = await db.select().from(projects);
    const allQuotations = await db.select().from(quotations);
    const allClients = await db.select().from(clients);

    const totalRevenue = allInvoices
      .filter((i: any) => i.status === "مدفوعة")
      .reduce((sum: number, i: any) => sum + (i.total || 0), 0);

    const completedProjects = allProjects.filter((p: any) => p.progress >= 100).length;
    const newClients = allClients.filter((c: any) => c.createdAt >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).length;

    const sentQuotations = allQuotations.filter((q: any) => q.status !== "مسودة").length;
    const acceptedQuotations = allQuotations.filter((q: any) => ["مقبول", "عقد"].includes(q.status)).length;
    const conversionRate = sentQuotations > 0 ? Math.round((acceptedQuotations / sentQuotations) * 100) : 0;

    res.json({ totalRevenue, completedProjects, newClients, conversionRate, totalProjects: allProjects.length, totalClients: allClients.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── CRM Leads ─────────────────────────────────────────────────────────────
const parseLead = (r: typeof crmLeads.$inferSelect) => ({ ...r, tags: JSON.parse(r.tags || "[]") });

apiRouter.get("/api/crm-leads", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(crmLeads).orderBy(desc(crmLeads.date));
    res.json(rows.map(parseLead));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/crm-leads/:id", async (req, res) => {
  try {
    const db = getDb();
    const [row] = await db.select().from(crmLeads).where(eq(crmLeads.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(parseLead(row));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/crm-leads", async (req, res) => {
  try {
    const db = getDb();
    const id = `L${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString().slice(0, 10);
    const { tags, ...rest } = req.body;
    await db.insert(crmLeads).values({ ...rest, id, tags: JSON.stringify(tags || []), date: rest.date || now });
    const [row] = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
    res.status(201).json(parseLead(row));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/crm-leads/:id", async (req, res) => {
  try {
    const db = getDb();
    const { tags, ...rest } = req.body;
    const updateData = tags !== undefined ? { ...rest, tags: JSON.stringify(tags) } : rest;
    await db.update(crmLeads).set(updateData).where(eq(crmLeads.id, req.params.id));
    const [row] = await db.select().from(crmLeads).where(eq(crmLeads.id, req.params.id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(parseLead(row));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/api/crm-leads/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(crmLeads).where(eq(crmLeads.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Contract Templates ────────────────────────────────────────────────────
apiRouter.get("/api/contract-templates", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(contractTemplates).orderBy(contractTemplates.id);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/contract-templates/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const [row] = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/contract-templates", async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString().slice(0, 10);
    await db.insert(contractTemplates).values({ ...req.body, createdAt: req.body.createdAt || now, isDefault: 0 });
    const rows = await db.select().from(contractTemplates).orderBy(desc(contractTemplates.id));
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/contract-templates/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.update(contractTemplates).set(req.body).where(eq(contractTemplates.id, id));
    const [row] = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id));
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/api/contract-templates/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.delete(contractTemplates).where(eq(contractTemplates.id, id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Appointments ──────────────────────────────────────────────────────────────
apiRouter.get("/api/appointments", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(appointments).orderBy(desc(appointments.createdAt));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.get("/api/appointments/lead/:leadId", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(appointments)
      .where(eq(appointments.leadId, req.params.leadId))
      .orderBy(desc(appointments.createdAt));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/appointments", async (req, res) => {
  try {
    const db = getDb();
    const { leadId, clientId, clientName, clientPhone, date, time, reason, notes, assignedTo } = req.body;
    const now = new Date().toISOString();
    await db.insert(appointments).values({
      leadId: leadId || null,
      clientId: clientId || null,
      clientName,
      clientPhone: clientPhone || "",
      date,
      time: time || "",
      reason: reason || "",
      notes: notes || "",
      assignedTo: assignedTo || "",
      status: "scheduled",
      createdAt: now,
    });
    const [row] = await db.select().from(appointments)
      .orderBy(desc(appointments.id)).limit(1);
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/appointments/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const { date, time, reason, notes, status, assignedTo } = req.body;
    await db.update(appointments).set({
      ...(date !== undefined && { date }),
      ...(time !== undefined && { time }),
      ...(reason !== undefined && { reason }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
      ...(assignedTo !== undefined && { assignedTo }),
    }).where(eq(appointments.id, id));
    const [row] = await db.select().from(appointments).where(eq(appointments.id, id));
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/api/appointments/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.delete(appointments).where(eq(appointments.id, id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
