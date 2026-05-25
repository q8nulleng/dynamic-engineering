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
  invoices, invoiceLines, documents, crmLeads, contractTemplates, appointments,
  workPlans, workPlanPhases, workPlanTasks, projectBriefs, projectMeetings
} from "../drizzle/schema.js";
import { nanoid } from "nanoid";
import { storagePut } from "./storage.js";

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

    // Fetch client details for phone/block/plot
    let clientData: any = {};
    if ((project as any).clientId) {
      const [clientRow] = await db.select().from(clients).where(eq(clients.id, (project as any).clientId));
      if (clientRow) {
        clientData = {
          clientPhone: clientRow.phone || "",
          block: clientRow.block || "",
          plot: clientRow.plot || "",
        };
      }
    }

    const projectPhases = await db.select().from(phases)
      .where(eq(phases.projectId, req.params.id))
      .orderBy(phases.order);

    const phasesWithTasks = await Promise.all(projectPhases.map(async (phase: any) => {
      const phaseTasks = await db.select().from(tasks)
        .where(eq(tasks.phaseId, phase.id))
        .orderBy(tasks.order);
      return { ...phase, tasks: phaseTasks };
    }));

    res.json({ ...project, ...clientData, phases: phasesWithTasks });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/projects", async (req, res) => {
  try {
    const db = getDb();
    const { phases: phasesData, ...projectData } = req.body;
    const now = new Date().toISOString().slice(0, 10);
    const id = projectData.id || `S${nanoid(5).toUpperCase()}`;

    // ── 1. إنشاء عميل تلقائياً إذا لم يكن مرتبطاً بعميل موجود ──
    let clientId = projectData.clientId || null;
    if (!clientId && projectData.client) {
      const cid = `C${nanoid(6).toUpperCase()}`;
      await db.insert(clients).values({
        id: cid,
        name: projectData.client,
        phone: projectData.clientPhone || "",
        type: "فرد",
        area: projectData.area || "",
        status: "active",
        rating: 5,
        createdAt: now,
        projectType: projectData.type || "",
        serviceType: projectData.serviceType || "",
      });
      clientId = cid;
    }

    // ── 2. إنشاء المشروع ──
    await db.insert(projects).values({ ...projectData, id, clientId, createdAt: projectData.createdAt || now });

    // ── 3. إنشاء عقد فارغ مرتبط بالمشروع ──
    const contractId = `CNT${nanoid(6).toUpperCase()}`;
    await db.insert(contracts).values({
      id: contractId,
      projectId: id,
      clientId: clientId || "",
      client: projectData.client || "",
      type: projectData.type || "",
      service: projectData.serviceType || "",
      status: "مسودة",
      date: now,
      amount: "0",
      area: projectData.area || "",
    });
    await db.update(projects).set({ contractId }).where(eq(projects.id, id));

    // ── 4. إنشاء مراحل العمل حسب نوع المشروع ──
    if (!Array.isArray(phasesData) || phasesData.length === 0) {
      const projectType = projectData.type || "";
      let phaseDefs: { title: string; subtitle?: string }[] = [];

      if (projectType === "مبنى صناعي" || projectType === "صناعي" || projectType === "مستودع" || projectType === "مصنع") {
        phaseDefs = [
          { title: "تجهيز الملف",          subtitle: "جمع الوثائق والملفات" },
          { title: "التصميم المعماري",      subtitle: "الكروكي والواجهات" },
          { title: "التصميم الإنشائي",     subtitle: "الحسابات الإنشائية" },
          { title: "الرسم والإخراج",       subtitle: "إخراج المخططات" },
          { title: "تقديم البلدية",        subtitle: "المراجعة والاعتماد" },
          { title: "الإشراف",             subtitle: "الإشراف على التنفيذ" },
        ];
      } else if (projectType === "سكن خاص") {
        phaseDefs = [
          { title: "تجهيز الملف",          subtitle: "جمع الوثائق والملفات" },
          { title: "التصميم المعماري",      subtitle: "الكروكي والواجهات" },
          { title: "التصميم الإنشائي",     subtitle: "الحسابات الإنشائية" },
          { title: "الرسم والإخراج",       subtitle: "إخراج المخططات" },
          { title: "تقديم البلدية",        subtitle: "المراجعة والاعتماد" },
          { title: "المخططات التفصيلية",   subtitle: "صحي وكهربائي" },
          { title: "الإشراف",             subtitle: "الإشراف على التنفيذ" },
        ];
      } else if (projectType === "سكن استثماري" || projectType === "تجاري") {
        phaseDefs = [
          { title: "تجهيز الملف",          subtitle: "جمع الوثائق والملفات" },
          { title: "التصميم المعماري",      subtitle: "الكروكي والواجهات" },
          { title: "التصميم الإنشائي",     subtitle: "الحسابات الإنشائية" },
          { title: "الرسم والإخراج",       subtitle: "إخراج المخططات" },
          { title: "تقديم البلدية",        subtitle: "المراجعة والاعتماد" },
          { title: "الإشراف",             subtitle: "الإشراف على التنفيذ" },
        ];
      } else {
        phaseDefs = [
          { title: "تجهيز الملف",    subtitle: "جمع الوثائق" },
          { title: "التصميم",        subtitle: "التصميم والرسم" },
          { title: "التقديم",        subtitle: "تقديم الجهات" },
          { title: "الإشراف",       subtitle: "متابعة التنفيذ" },
        ];
      }

      for (let i = 0; i < phaseDefs.length; i++) {
        await db.insert(phases).values({
          projectId: id,
          order: i,
          title: phaseDefs[i].title,
          subtitle: phaseDefs[i].subtitle || "",
        });
      }

      // مهام أولية للمرحلة الأولى
      const [firstPhase] = await db.select().from(phases)
        .where(eq(phases.projectId, id))
        .orderBy(phases.order);
      if (firstPhase) {
        const initialTasks = [
          { name: "تجميع مستندات العميل", assignee: "سكرتير", estimatedDays: 3, status: "in_progress" },
          { name: "طلب تقرير تربة",       assignee: "سكرتير", estimatedDays: 5, status: "in_progress" },
          { name: "تعبئة نماذج البلدية",  assignee: "سكرتير", estimatedDays: 2, status: "pending" },
        ];
        for (let j = 0; j < initialTasks.length; j++) {
          await db.insert(tasks).values({
            phaseId: firstPhase.id,
            name: initialTasks[j].name,
            status: initialTasks[j].status,
            assignee: initialTasks[j].assignee,
            estimatedDays: initialTasks[j].estimatedDays,
            autoCreated: 1,
            order: j,
          });
        }
      }
    } else {
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
    res.status(201).json({ ...project, clientId, contractId });
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

    // Upload to S3 storage
    const fs = await import("fs");
    const fileBuffer = fs.readFileSync(req.file.path);
    const ext = req.file.originalname.split(".").pop() || "bin";
    const storageKey = `docs/${clientId || projectId || "general"}/${nanoid(8)}.${ext}`;
    const { url: storageUrl } = await storagePut(storageKey, fileBuffer, req.file.mimetype);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    await db.insert(documents).values({
      clientId: clientId || null,
      projectId: projectId || null,
      name: name || req.file.originalname,
      category: category || "",
      status: "received",
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024).toFixed(0)} KB`,
      uploadedAt: now,
      url: storageUrl,
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

// ── Work Plans (خطط العمل المركزية) ──────────────────────────────────────────

// GET all work plans (with phase/task counts)
apiRouter.get("/api/work-plans", async (_req, res) => {
  try {
    const db = getDb();
    const plans = await db.select().from(workPlans).orderBy(workPlans.id);
    const result = await Promise.all(plans.map(async (plan: any) => {
      const planPhases = await db.select().from(workPlanPhases)
        .where(eq(workPlanPhases.workPlanId, plan.id))
        .orderBy(workPlanPhases.order);
      let taskCount = 0;
      for (const ph of planPhases) {
        const ts = await db.select().from(workPlanTasks).where(eq(workPlanTasks.workPlanPhaseId, ph.id));
        taskCount += ts.length;
      }
      return { ...plan, phaseCount: planPhases.length, taskCount };
    }));
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET single work plan with full phases and tasks
apiRouter.get("/api/work-plans/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const [plan] = await db.select().from(workPlans).where(eq(workPlans.id, id));
    if (!plan) return res.status(404).json({ error: "not found" });
    const planPhases = await db.select().from(workPlanPhases)
      .where(eq(workPlanPhases.workPlanId, id))
      .orderBy(workPlanPhases.order);
    const phasesWithTasks = await Promise.all(planPhases.map(async (ph: any) => {
      const ts = await db.select().from(workPlanTasks)
        .where(eq(workPlanTasks.workPlanPhaseId, ph.id))
        .orderBy(workPlanTasks.order);
      return { ...ph, tasks: ts };
    }));
    res.json({ ...plan, phases: phasesWithTasks });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST create new work plan
apiRouter.post("/api/work-plans", async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString().slice(0, 10);
    const { phases: phasesData, ...planData } = req.body;
    await db.insert(workPlans).values({ ...planData, createdAt: now });
    const [plan] = await db.select().from(workPlans).orderBy(desc(workPlans.id));
    if (Array.isArray(phasesData)) {
      for (let i = 0; i < phasesData.length; i++) {
        const { tasks: tasksData, ...phaseData } = phasesData[i];
        await db.insert(workPlanPhases).values({ ...phaseData, workPlanId: plan.id, order: i });
        const [ph] = await db.select().from(workPlanPhases)
          .where(eq(workPlanPhases.workPlanId, plan.id))
          .orderBy(desc(workPlanPhases.id));
        if (Array.isArray(tasksData)) {
          for (let j = 0; j < tasksData.length; j++) {
            await db.insert(workPlanTasks).values({ ...tasksData[j], workPlanPhaseId: ph.id, order: j });
          }
        }
      }
    }
    const full = await db.select().from(workPlans).where(eq(workPlans.id, plan.id));
    res.status(201).json(full[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT update work plan
apiRouter.put("/api/work-plans/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const { phases: _phases, ...planData } = req.body;
    await db.update(workPlans).set(planData).where(eq(workPlans.id, id));
    const [row] = await db.select().from(workPlans).where(eq(workPlans.id, id));
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE work plan
apiRouter.delete("/api/work-plans/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    // Delete tasks → phases → plan
    const planPhases = await db.select().from(workPlanPhases).where(eq(workPlanPhases.workPlanId, id));
    for (const ph of planPhases) {
      await db.delete(workPlanTasks).where(eq(workPlanTasks.workPlanPhaseId, ph.id));
    }
    await db.delete(workPlanPhases).where(eq(workPlanPhases.workPlanId, id));
    await db.delete(workPlans).where(eq(workPlans.id, id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST apply work plan to a project (import plan → create phases & tasks)
apiRouter.post("/api/work-plans/:id/apply/:projectId", async (req, res) => {
  try {
    const db = getDb();
    const planId = parseInt(req.params.id);
    const projectId = req.params.projectId;

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return res.status(404).json({ error: "project not found" });

    const [plan] = await db.select().from(workPlans).where(eq(workPlans.id, planId));
    if (!plan) return res.status(404).json({ error: "plan not found" });

    // Get current max order for existing phases
    const existingPhases = await db.select().from(phases).where(eq(phases.projectId, projectId));
    let nextOrder = existingPhases.length;

    const planPhases = await db.select().from(workPlanPhases)
      .where(eq(workPlanPhases.workPlanId, planId))
      .orderBy(workPlanPhases.order);

    for (const ph of planPhases) {
      await db.insert(phases).values({
        projectId,
        order: nextOrder++,
        title: ph.title,
        subtitle: ph.subtitle || "",
      });
      const [newPhase] = await db.select().from(phases)
        .where(eq(phases.projectId, projectId))
        .orderBy(desc(phases.id));

      const planTasks = await db.select().from(workPlanTasks)
        .where(eq(workPlanTasks.workPlanPhaseId, ph.id))
        .orderBy(workPlanTasks.order);

      for (let j = 0; j < planTasks.length; j++) {
        await db.insert(tasks).values({
          phaseId: newPhase.id,
          name: planTasks[j].name,
          assignee: planTasks[j].assignee || "",
          estimatedDays: planTasks[j].estimatedDays || 0,
          status: "pending",
          autoCreated: 1,
          order: j,
        });
      }
    }

    // Recalculate progress
    const allPhases = await db.select().from(phases).where(eq(phases.projectId, projectId));
    let total = 0, done = 0;
    for (const p of allPhases) {
      const pts = await db.select().from(tasks).where(eq(tasks.phaseId, p.id));
      total += pts.length;
      done += pts.filter((t: any) => t.status === "done").length;
    }
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    await db.update(projects).set({ progress }).where(eq(projects.id, projectId));

    res.json({ success: true, created: planPhases.length, phasesAdded: planPhases.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST add a single task to a phase
apiRouter.post("/api/phases/:phaseId/tasks", async (req, res) => {
  try {
    const db = getDb();
    const phaseId = parseInt(req.params.phaseId);
    const { name, assignee, estimatedDays, status, description, deadline } = req.body;
    const existingTasks = await db.select().from(tasks).where(eq(tasks.phaseId, phaseId));
    await db.insert(tasks).values({
      phaseId,
      name: name || "مهمة جديدة",
      assignee: assignee || "",
      estimatedDays: estimatedDays || 0,
      status: status || "pending",
      description: description || "",
      deadline: deadline || "",
      order: existingTasks.length,
      autoCreated: 0,
    });
    const [newTask] = await db.select().from(tasks)
      .where(eq(tasks.phaseId, phaseId))
      .orderBy(desc(tasks.id));
    res.status(201).json(newTask);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ══════════════════════════════════════════════════════════════════════════════
// Project Briefs (نموذج طلبات المشروع)
// ══════════════════════════════════════════════════════════════════════════════

// GET brief for a project
apiRouter.get("/api/projects/:projectId/brief", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.select().from(projectBriefs)
      .where(eq(projectBriefs.projectId, req.params.projectId));
    if (rows.length === 0) return res.json(null);
    const brief = rows[0];
    res.json(brief);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST create brief
apiRouter.post("/api/projects/:projectId/brief", async (req, res) => {
  try {
    const db = await getDb();
    const { ownerName, ownerPhone, governorate, area, block, plot, autoNumber,
      plotArea, plotShape, northDirection, architecturalStyle, floorsCount,
      floorsDetails, sketchData, notes } = req.body;
    await db.insert(projectBriefs).values({
      projectId: req.params.projectId,
      ownerName: ownerName || "",
      ownerPhone: ownerPhone || "",
      governorate: governorate || "",
      area: area || "",
      block: block || "",
      plot: plot || "",
      autoNumber: autoNumber || "",
      plotArea: plotArea || "",
      plotShape: plotShape || "",
      northDirection: northDirection || "",
      architecturalStyle: architecturalStyle || "",
      floorsCount: floorsCount || 0,
      floorsDetails: typeof floorsDetails === "string" ? floorsDetails : JSON.stringify(floorsDetails || []),
      sketchData: sketchData || "",
      notes: notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    });
    const [inserted] = await db.select().from(projectBriefs)
      .where(eq(projectBriefs.projectId, req.params.projectId))
      .orderBy(desc(projectBriefs.id));
    res.status(201).json(inserted);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT update brief
apiRouter.put("/api/projects/:projectId/brief/:id", async (req, res) => {
  try {
    const db = await getDb();
    const { ownerName, ownerPhone, governorate, area, block, plot, autoNumber,
      plotArea, plotShape, northDirection, architecturalStyle, floorsCount,
      floorsDetails, sketchData, notes } = req.body;
    await db.update(projectBriefs)
      .set({
        ownerName: ownerName || "",
        ownerPhone: ownerPhone || "",
        governorate: governorate || "",
        area: area || "",
        block: block || "",
        plot: plot || "",
        autoNumber: autoNumber || "",
        plotArea: plotArea || "",
        plotShape: plotShape || "",
        northDirection: northDirection || "",
        architecturalStyle: architecturalStyle || "",
        floorsCount: floorsCount || 0,
        floorsDetails: typeof floorsDetails === "string" ? floorsDetails : JSON.stringify(floorsDetails || []),
        sketchData: sketchData || "",
        notes: notes || "",
        updatedAt: new Date().toISOString().split("T")[0],
      })
      .where(eq(projectBriefs.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Project Meetings (جلسات التصميم)
// ══════════════════════════════════════════════════════════════════════════════

// GET meetings for a project
apiRouter.get("/api/projects/:projectId/meetings", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, req.params.projectId))
      .orderBy(desc(projectMeetings.id));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST create meeting
apiRouter.post("/api/projects/:projectId/meetings", async (req, res) => {
  try {
    const db = await getDb();
    const { date, attendees, agreed, changes, notes, status } = req.body;
    await db.insert(projectMeetings).values({
      projectId: req.params.projectId,
      date: date || new Date().toISOString().split("T")[0],
      attendees: typeof attendees === "string" ? attendees : JSON.stringify(attendees || []),
      agreed: typeof agreed === "string" ? agreed : JSON.stringify(agreed || []),
      changes: changes || "",
      notes: notes || "",
      status: status || "pending",
      createdAt: new Date().toISOString().split("T")[0],
    });
    const rows = await db.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, req.params.projectId))
      .orderBy(desc(projectMeetings.id));
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT update meeting status
apiRouter.put("/api/projects/:projectId/meetings/:id", async (req, res) => {
  try {
    const db = await getDb();
    const { status, attendees, agreed, changes, notes } = req.body;
    const updates: any = {};
    if (status) updates.status = status;
    if (attendees) updates.attendees = typeof attendees === "string" ? attendees : JSON.stringify(attendees);
    if (agreed) updates.agreed = typeof agreed === "string" ? agreed : JSON.stringify(agreed);
    if (changes !== undefined) updates.changes = changes;
    if (notes !== undefined) updates.notes = notes;
    await db.update(projectMeetings).set(updates)
      .where(eq(projectMeetings.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE meeting
apiRouter.delete("/api/projects/:projectId/meetings/:id", async (req, res) => {
  try {
    const db = await getDb();
    await db.delete(projectMeetings).where(eq(projectMeetings.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Task Auto-Trigger (الإطلاق التلقائي للمهام)
// عند اكتمال مهمة trigger → إنشاء مهام المرحلة التالية تلقائياً
// ══════════════════════════════════════════════════════════════════════════════

apiRouter.post("/api/tasks/:taskId/complete-and-trigger", async (req, res) => {
  try {
    const db = await getDb();
    const taskId = parseInt(req.params.taskId);
    
    // Mark task as completed
    await db.update(tasks).set({ status: "completed" }).where(eq(tasks.id, taskId));
    
    // Get the task details
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    // ═══ Task-level triggers ═══
    // Find tasks that depend on this completed task (dependsOn = taskId)
    const dependentTasks = await db.select().from(tasks).where(eq(tasks.dependsOn, taskId));
    const triggeredTasks: string[] = [];
    
    for (const depTask of dependentTasks) {
      // Activate dependent tasks (change from pending to in-progress)
      if ((depTask as any).status === "pending") {
        await db.update(tasks).set({ status: "in-progress" }).where(eq(tasks.id, depTask.id));
        triggeredTasks.push((depTask as any).name);
      }
    }
    
    // ═══ Phase-level triggers ═══
    // Get the phase this task belongs to
    const [phase] = await db.select().from(phases).where(eq(phases.id, task.phaseId));
    if (!phase) return res.json({ completed: true, triggered: triggeredTasks });
    
    // Check if ALL tasks in this phase are completed
    const phaseTasks = await db.select().from(tasks).where(eq(tasks.phaseId, phase.id));
    const allCompleted = phaseTasks.every((t: any) => t.status === "completed");
    
    if (!allCompleted) {
      return res.json({
        completed: true,
        triggered: triggeredTasks,
        message: triggeredTasks.length > 0
          ? `تم تفعيل ${triggeredTasks.length} مهمة تابعة`
          : "مهام أخرى في المرحلة لم تكتمل بعد",
      });
    }
    
    // All tasks in phase completed → find next phase
    const projectPhases = await db.select().from(phases)
      .where(eq(phases.projectId, phase.projectId));
    projectPhases.sort((a: any, b: any) => a.order - b.order);
    
    const currentIdx = projectPhases.findIndex((p: any) => p.id === phase.id);
    const nextPhase = projectPhases[currentIdx + 1];
    
    if (!nextPhase) {
      await db.update(projects).set({ progress: 100 }).where(eq(projects.id, phase.projectId));
      return res.json({ completed: true, triggered: triggeredTasks, message: "المشروع مكتمل!" });
    }
    
    // Activate first tasks in next phase
    const nextPhaseTasks = await db.select().from(tasks).where(eq(tasks.phaseId, nextPhase.id));
    for (const npt of nextPhaseTasks) {
      // Only activate tasks with no dependencies or dependsOn = 0
      if ((npt as any).dependsOn === 0 || (npt as any).dependsOn === null) {
        if ((npt as any).status === "pending") {
          await db.update(tasks).set({ status: "in-progress" }).where(eq(tasks.id, npt.id));
          triggeredTasks.push((npt as any).name);
        }
      }
    }
    
    // Update project current phase and progress
    await db.update(projects).set({ currentPhase: nextPhase.order }).where(eq(projects.id, phase.projectId));
    const totalPhases = projectPhases.length;
    const completedPhases = currentIdx + 1;
    const progress = Math.round((completedPhases / totalPhases) * 100);
    await db.update(projects).set({ progress }).where(eq(projects.id, phase.projectId));
    
    res.json({
      completed: true,
      triggered: triggeredTasks,
      nextPhase: nextPhase.title,
      progress,
      message: `تم الانتقال إلى مرحلة: ${nextPhase.title}`,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Email Send API (إرسال إيميل — طلب تربة / كهرباء / عام)
// ══════════════════════════════════════════════════════════════════════════════

apiRouter.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, body, attachmentUrls, projectId, type } = req.body;
    if (!to || !subject) return res.status(400).json({ error: "to and subject are required" });

    // For now, we log the email and return success
    // In production, integrate with nodemailer or Manus notification API
    console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Type: ${type || "general"}`);
    console.log(`[EMAIL] Body: ${body?.substring(0, 200)}...`);
    if (attachmentUrls?.length) console.log(`[EMAIL] Attachments: ${attachmentUrls.join(", ")}`);

    // Record the email action in the project's task notes
    if (projectId) {
      const db = getDb();
      // We could log this as a document or meeting note
      await db.insert(projectMeetings).values({
        projectId,
        date: new Date().toISOString().split("T")[0],
        attendees: JSON.stringify([]),
        agreed: JSON.stringify([`تم إرسال ${type === "soil" ? "طلب تربة" : type === "electricity" ? "طلب كهرباء" : "إيميل"} إلى ${to}`]),
        changes: "",
        notes: `الموضوع: ${subject}\nالمحتوى: ${body || ""}`,
        status: "completed",
        createdAt: new Date().toISOString().split("T")[0],
      });
    }

    res.json({
      success: true,
      message: `تم إرسال الإيميل إلى ${to}`,
      emailData: { to, subject, body: body?.substring(0, 100), type },
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Task Approval API (اعتماد المهمة وإطلاق المرحلة التالية)
// ══════════════════════════════════════════════════════════════════════════════

apiRouter.post("/api/tasks/:taskId/approve", async (req, res) => {
  try {
    const db = getDb();
    const taskId = parseInt(req.params.taskId);
    
    // Mark task as done
    await db.update(tasks).set({ status: "done" }).where(eq(tasks.id, taskId));
    
    // Get the task details
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    // Task-level triggers: activate dependent tasks
    const dependentTasks = await db.select().from(tasks).where(eq(tasks.dependsOn, taskId));
    const triggeredTasks: string[] = [];
    
    for (const depTask of dependentTasks) {
      if ((depTask as any).status === "pending") {
        await db.update(tasks).set({ status: "in_progress" }).where(eq(tasks.id, depTask.id));
        triggeredTasks.push((depTask as any).name);
      }
    }
    
    // Phase-level triggers
    const [phase] = await db.select().from(phases).where(eq(phases.id, task.phaseId));
    if (!phase) return res.json({ approved: true, triggered: triggeredTasks });
    
    const phaseTasks = await db.select().from(tasks).where(eq(tasks.phaseId, phase.id));
    const allDone = phaseTasks.every((t: any) => t.status === "done");
    
    if (allDone) {
      // Move to next phase
      const projectPhases = await db.select().from(phases)
        .where(eq(phases.projectId, phase.projectId));
      projectPhases.sort((a: any, b: any) => a.order - b.order);
      
      const currentIdx = projectPhases.findIndex((p: any) => p.id === phase.id);
      const nextPhase = projectPhases[currentIdx + 1];
      
      if (nextPhase) {
        const nextPhaseTasks = await db.select().from(tasks).where(eq(tasks.phaseId, nextPhase.id));
        for (const npt of nextPhaseTasks) {
          if (((npt as any).dependsOn === 0 || (npt as any).dependsOn === null) && (npt as any).status === "pending") {
            await db.update(tasks).set({ status: "in_progress" }).where(eq(tasks.id, npt.id));
            triggeredTasks.push((npt as any).name);
          }
        }
        await db.update(projects).set({ currentPhase: nextPhase.order }).where(eq(projects.id, phase.projectId));
      }
      
      const totalPhases = projectPhases.length;
      const completedPhases = currentIdx + 1;
      const progress = Math.round((completedPhases / totalPhases) * 100);
      await db.update(projects).set({ progress }).where(eq(projects.id, phase.projectId));
    }
    
    res.json({ approved: true, triggered: triggeredTasks });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
