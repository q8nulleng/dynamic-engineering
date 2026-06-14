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
  workPlans, workPlanPhases, workPlanTasks, projectBriefs, projectMeetings, phaseMeta,
  employees, employeeSessions,
  supervisionVisits, detailedDrawings, municipalitySubmissions,
  employeeNotifications, packages, governorateAreas
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

    // ── 4. إنشاء مراحل العمل حسب نوع المشروع (يُفوّض لـ auto-tasks) ──
    if (Array.isArray(phasesData) && phasesData.length > 0) {
      for (let i = 0; i < phasesData.length; i++) {
        const { tasks: tasksData, ...phaseData } = phasesData[i];
        await db.insert(phases).values({ ...phaseData, projectId: id, order: i });
        const [phase] = await db.select().from(phases)
          .where(eq(phases.projectId, id))
          .orderBy(desc(phases.id))
          .limit(1);
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

// تحديث ملاحظات المشروع
apiRouter.patch("/api/projects/:id/notes", async (req, res) => {
  try {
    const db = getDb();
    const { notes } = req.body;
    await db.update(projects).set({ notes: notes ?? "", notesUpdatedAt: Date.now() }).where(eq(projects.id, req.params.id));
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

    // ── منع التكرار: إذا كانت هناك مهام تلقائية موجودة مسبقاً ──
    for (const ph of existingPhases) {
      const allTasks = await db.select().from(tasks).where(eq(tasks.phaseId, ph.id));
      const autoTasks = allTasks.filter((t: any) => t.autoCreated === 1);
      if (autoTasks.length > 0) {
        return res.status(400).json({ error: "auto tasks already created" });
      }
    }

    // ── حذف المراحل والمهام الحالية وإعادة بناء نظيفة ──
    for (const ep of existingPhases) {
      await db.delete(tasks).where(eq(tasks.phaseId, ep.id));
    }
    await db.delete(phases).where(eq(phases.projectId, projectId));

    // ── تحديد نوع المشروع والخدمة ──
    const projectType = project.type || "سكن خاص";       // سكن خاص | صناعي | تجاري | استثماري
    const serviceType = project.serviceType || "بناء جديد"; // بناء جديد | تعديل وإضافة
    const isModification = serviceType.includes("تعديل") || serviceType.includes("إضافة");
    const isPrivateResidential = projectType === "سكن خاص";
    const needsFireDept = !isPrivateResidential && !isModification; // بناء جديد لغير السكن الخاص
    const needsFullSupervision = needsFireDept; // إشراف كامل لنفس الحالة

    // ── بناء المراحل حسب النوع ──
    const phaseDefs: { title: string; subtitle: string }[] = [];

    if (isModification) {
      phaseDefs.push({ title: "رفع الملفات المرجعية", subtitle: "المخططات السابقة وصور الموقع" });
    }
    phaseDefs.push({ title: "تجهيز الملف",          subtitle: "جمع الوثائق والملفات" });
    phaseDefs.push({ title: "التصميم المعماري",     subtitle: "الكروكي والتصاميم" });
    phaseDefs.push({ title: "التصميم الإنشائي",     subtitle: "الحسابات الإنشائية" });
    phaseDefs.push({ title: "الرسم والإخراج",       subtitle: "إخراج المخططات" });
    phaseDefs.push({ title: "تقديم البلدية",        subtitle: "المراجعة والاعتماد" });
    if (needsFireDept) {
      phaseDefs.push({ title: "المطافي",            subtitle: "رخصة الإطفاء" });
    }
    phaseDefs.push({ title: "المخططات التفصيلية",   subtitle: "صحي وكهربائي" });
    phaseDefs.push({ title: "الإشراف",             subtitle: needsFullSupervision ? "إشراف كامل على المبنى" : "الإشراف على التنفيذ" });

    const phaseMap: Record<string, number> = {};
    let nextOrder = 0;
    for (const pd of phaseDefs) {
      await db.insert(phases).values({ projectId, order: nextOrder++, title: pd.title, subtitle: pd.subtitle });
      const [ph] = await db.select().from(phases)
        .where(eq(phases.projectId, projectId))
        .orderBy(desc(phases.id))
        .limit(1);
      phaseMap[pd.title] = ph.id;
    }

    // ── بناء المهام حسب النوع ──
    const taskDefs: { name: string; phase: string; assignee: string; depIdx: number; estimatedDays: number; status: string }[] = [];

    // مرحلة رفع الملفات المرجعية (تعديل وإضافة فقط)
    if (isModification) {
      taskDefs.push({ name: "رفع المخططات السابقة",     phase: "رفع الملفات المرجعية", assignee: "سكرتير",   depIdx: -1, estimatedDays: 2, status: "in_progress" });
      taskDefs.push({ name: "رفع صور الموقع",           phase: "رفع الملفات المرجعية", assignee: "سكرتير",   depIdx: -1, estimatedDays: 2, status: "in_progress" });
    }

    // مرحلة تجهيز الملف
    const filePhaseStart = taskDefs.length;
    taskDefs.push({ name: "تجميع مستندات العميل",    phase: "تجهيز الملف", assignee: "سكرتير",   depIdx: isModification ? 0 : -1, estimatedDays: 3, status: isModification ? "pending" : "in_progress" });
    if (!isModification) {
      // بناء جديد فقط يحتاج تقرير تربة
      taskDefs.push({ name: "طلب تقرير تربة",        phase: "تجهيز الملف", assignee: "سكرتير",   depIdx: -1, estimatedDays: 5, status: "in_progress" });
    }
    taskDefs.push({ name: "تعبئة نماذج البلدية",     phase: "تجهيز الملف", assignee: "سكرتير",   depIdx: filePhaseStart, estimatedDays: 2, status: "pending" });

    // مرحلة التصميم المعماري
    const archStart = taskDefs.length;
    taskDefs.push({ name: "جلسة كروكي مع المالك",    phase: "التصميم المعماري", assignee: "م. مصطفى", depIdx: filePhaseStart, estimatedDays: 1, status: "pending" });
    taskDefs.push({ name: "إعداد الكروكي المبدئي",   phase: "التصميم المعماري", assignee: "م. مصطفى", depIdx: archStart,     estimatedDays: 5, status: "pending" });
    taskDefs.push({ name: "اعتماد الكروكي من المالك", phase: "التصميم المعماري", assignee: "م. مصطفى", depIdx: archStart + 1, estimatedDays: 3, status: "pending" });
    taskDefs.push({ name: "تصميم الواجهات",          phase: "التصميم المعماري", assignee: "عفيف",     depIdx: archStart + 2, estimatedDays: 5, status: "pending" });

    // مرحلة التصميم الإنشائي
    const structStart = taskDefs.length;
    taskDefs.push({ name: "التصميم الإنشائي",        phase: "التصميم الإنشائي", assignee: "م. أمين",  depIdx: archStart + 2, estimatedDays: 7, status: "pending" });

    // مرحلة الرسم والإخراج
    const drawStart = taskDefs.length;
    taskDefs.push({ name: "رسم مخططات البلدية",      phase: "الرسم والإخراج", assignee: "عرفان",    depIdx: structStart,   estimatedDays: 5, status: "pending" });
    taskDefs.push({ name: "مراجعة المخططات",         phase: "الرسم والإخراج", assignee: "م. مصطفى", depIdx: drawStart,     estimatedDays: 2, status: "pending" });

    // مرحلة تقديم البلدية
    const muniStart = taskDefs.length;
    taskDefs.push({ name: "تقديم للبلدية",           phase: "تقديم البلدية", assignee: "سكرتير",   depIdx: drawStart + 1, estimatedDays: 1,  status: "pending" });
    taskDefs.push({ name: "متابعة البلدية",          phase: "تقديم البلدية", assignee: "سكرتير",   depIdx: muniStart,     estimatedDays: 30, status: "pending" });

    // مرحلة المطافي (بناء جديد لغير السكن الخاص)
    let fireStart = taskDefs.length;
    if (needsFireDept) {
      taskDefs.push({ name: "تجهيز ملف المطافي",      phase: "المطافي", assignee: "سكرتير",   depIdx: drawStart + 1, estimatedDays: 3,  status: "pending" });
      taskDefs.push({ name: "تقديم طلب رخصة إطفاء",   phase: "المطافي", assignee: "سكرتير",   depIdx: fireStart,     estimatedDays: 1,  status: "pending" });
      taskDefs.push({ name: "متابعة المطافي",          phase: "المطافي", assignee: "سكرتير",   depIdx: fireStart + 1, estimatedDays: 21, status: "pending" });
    }

    // مرحلة المخططات التفصيلية
    const detailStart = taskDefs.length;
    taskDefs.push({ name: "رسم مخططات صحي",         phase: "المخططات التفصيلية", assignee: "عرفان", depIdx: drawStart + 1, estimatedDays: 3, status: "pending" });
    taskDefs.push({ name: "رسم مخططات كهربائي",     phase: "المخططات التفصيلية", assignee: "عرفان", depIdx: drawStart + 1, estimatedDays: 3, status: "pending" });

    // مرحلة الإشراف
    const supervisionStart = taskDefs.length;
    if (needsFullSupervision) {
      // إشراف كامل للمباني غير السكن الخاص (بناء جديد)
      taskDefs.push({ name: "الإشراف الكامل على المبنى", phase: "الإشراف", assignee: "م. خالد",  depIdx: muniStart + 1, estimatedDays: 0,  status: "pending" });
      taskDefs.push({ name: "تقرير إشراف دوري",         phase: "الإشراف", assignee: "م. خالد",  depIdx: supervisionStart, estimatedDays: 7, status: "pending" });
      taskDefs.push({ name: "تقرير إنجاز مرحلي",        phase: "الإشراف", assignee: "م. خالد",  depIdx: supervisionStart, estimatedDays: 14, status: "pending" });
      taskDefs.push({ name: "خطاب بنك",                  phase: "الإشراف", assignee: "سكرتير",   depIdx: supervisionStart, estimatedDays: 0, status: "pending" });
    } else {
      // إشراف زيارات للسكن الخاص
      taskDefs.push({ name: "زيارة إشراف",             phase: "الإشراف", assignee: "م. خالد",  depIdx: muniStart + 1, estimatedDays: 0, status: "pending" });
      taskDefs.push({ name: "تقرير زيارة",             phase: "الإشراف", assignee: "م. خالد",  depIdx: supervisionStart, estimatedDays: 1, status: "pending" });
      taskDefs.push({ name: "خطاب بنك",                phase: "الإشراف", assignee: "سكرتير",   depIdx: supervisionStart, estimatedDays: 0, status: "pending" });
    }

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
apiRouter.delete("/api/quotations/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(quotations).where(eq(quotations.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
// ── Contracts ─────────────────────────────────────────────────────────────
apiRouter.get("/api/contracts", async (req, res) => {
  try {
    const db = getDb();
    const { leadId, projectId } = req.query as Record<string, string>;
    const rows = leadId
      ? await db.select().from(contracts).where(eq(contracts.leadId, leadId)).orderBy(desc(contracts.date))
      : projectId
      ? await db.select().from(contracts).where(eq(contracts.projectId, projectId)).orderBy(desc(contracts.date))
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
    // Extract extension robustly: lowercase, handle no-extension case
    const nameParts = req.file.originalname.split(".");
    const ext = nameParts.length > 1 ? (nameParts.pop() || "bin").toLowerCase() : "bin";
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
      mimeType: req.file.mimetype || "",
      fileExtension: ext.toLowerCase() || "",
    });
    const allDocs = await db.select().from(documents).orderBy(desc(documents.id));
    res.status(201).json(allDocs[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Serve uploaded files
apiRouter.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Download file with correct filename ──────────────────────────────────
apiRouter.get("/api/documents/:docId/download", async (req, res) => {
  try {
    const db = getDb();
    const [doc] = await db.select().from(documents).where(eq(documents.id, parseInt(req.params.docId)));
    if (!doc) return res.status(404).json({ error: "Document not found" });

    // Build a human-readable filename: prefer doc.name, append extension if missing
    let fileName = doc.name || doc.fileName || "file";
    const ext = doc.fileExtension ? doc.fileExtension.toLowerCase() : "";
    if (ext && !fileName.toLowerCase().endsWith(`.${ext}`)) {
      fileName = `${fileName}.${ext}`;
    }
    const storageUrl = doc.url || "";

    // For /uploads/ files (legacy), redirect with Content-Disposition
    if (storageUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", storageUrl);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      return res.sendFile(filePath);
    }

    // For /manus-storage/ files, proxy the content through
    if (storageUrl.startsWith("/manus-storage/")) {
      const key = storageUrl.replace("/manus-storage/", "");
      const forgeUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
      const forgeKey = process.env.BUILT_IN_FORGE_API_KEY || "";

      const presignUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
      presignUrl.searchParams.set("path", key);

      const presignResp = await fetch(presignUrl, {
        headers: { Authorization: `Bearer ${forgeKey}` },
      });
      if (!presignResp.ok) return res.status(502).send("Storage error");

      const { url: s3Url } = (await presignResp.json()) as { url: string };
      if (!s3Url) return res.status(502).send("Empty signed URL");

      // Fetch from S3 and pipe to response
      const s3Resp = await fetch(s3Url);
      if (!s3Resp.ok) return res.status(502).send("S3 fetch error");

      const contentType = doc.mimeType || s3Resp.headers.get("content-type") || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

      const buffer = Buffer.from(await s3Resp.arrayBuffer());
      res.send(buffer);
    } else {
      res.status(400).json({ error: "Unknown storage type" });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── View file inline (for PDF preview in iframe) ─────────────────────────
apiRouter.get("/api/documents/:docId/view", async (req, res) => {
  try {
    const db = getDb();
    const [doc] = await db.select().from(documents).where(eq(documents.id, parseInt(req.params.docId)));
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const storageUrl = doc.url || "";
    // Build a human-readable filename: prefer doc.name, append extension if missing
    let viewFileName = doc.name || doc.fileName || "file";
    const viewExt = doc.fileExtension ? doc.fileExtension.toLowerCase() : "";
    if (viewExt && !viewFileName.toLowerCase().endsWith(`.${viewExt}`)) {
      viewFileName = `${viewFileName}.${viewExt}`;
    }

    // For /uploads/ files (legacy)
    if (storageUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", storageUrl);
      const contentType = doc.mimeType || "application/pdf";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(viewFileName)}`);
      return res.sendFile(filePath);
    }

    // For /manus-storage/ files, proxy inline
    if (storageUrl.startsWith("/manus-storage/")) {
      const key = storageUrl.replace("/manus-storage/", "");
      const forgeUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
      const forgeKey = process.env.BUILT_IN_FORGE_API_KEY || "";

      const presignUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
      presignUrl.searchParams.set("path", key);

      const presignResp = await fetch(presignUrl, {
        headers: { Authorization: `Bearer ${forgeKey}` },
      });
      if (!presignResp.ok) return res.status(502).send("Storage error");

      const { url: s3Url } = (await presignResp.json()) as { url: string };
      if (!s3Url) return res.status(502).send("Empty signed URL");

      const s3Resp = await fetch(s3Url);
      if (!s3Resp.ok) return res.status(502).send("S3 fetch error");

      const contentType = doc.mimeType || s3Resp.headers.get("content-type") || "application/pdf";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(viewFileName)}`);
      res.setHeader("Cache-Control", "private, max-age=300");

      const buffer = Buffer.from(await s3Resp.arrayBuffer());
      res.send(buffer);
    } else {
      res.status(400).json({ error: "Unknown storage type" });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE document
apiRouter.delete("/api/documents/:docId", async (req, res) => {
  try {
    const db = getDb();
    const docId = parseInt(req.params.docId);
    if (isNaN(docId)) return res.status(400).json({ error: "Invalid document ID" });
    const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
    if (!doc) return res.status(404).json({ error: "Document not found" });
    await db.delete(documents).where(eq(documents.id, docId));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

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
    const rows = await db.select().from(crmLeads)
      .where(eq(crmLeads.isArchived, 0))
      .orderBy(desc(crmLeads.date));
    res.json(rows.map(parseLead));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Archived leads ──────────────────────────────────────────────────────────
apiRouter.get("/api/crm-leads-archived", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(crmLeads)
      .where(eq(crmLeads.isArchived, 1))
      .orderBy(desc(crmLeads.archivedAt));
    res.json(rows.map(parseLead));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/crm-leads/:id/archive", async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString().slice(0, 10);
    const reason = req.body.reason || "";
    await db.update(crmLeads).set({ isArchived: 1, archivedAt: now, archivedReason: reason }).where(eq(crmLeads.id, req.params.id));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/crm-leads/:id/restore", async (req, res) => {
  try {
    const db = getDb();
    await db.update(crmLeads).set({ isArchived: 0, archivedAt: "", archivedReason: "" }).where(eq(crmLeads.id, req.params.id));
    const [row] = await db.select().from(crmLeads).where(eq(crmLeads.id, req.params.id));
    res.json(parseLead(row));
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

    // ── إشعار للموظف المسند إليه الموعد ──
    if (assignedTo) {
      try {
        const allEmps = await db.select().from(employees);
        const matched = allEmps.find((e: any) => {
          const eName = (e.name || "").trim().toLowerCase();
          const aName = (assignedTo || "").trim().toLowerCase();
          return eName.includes(aName) || aName.includes(eName);
        });
        if (matched) {
          await db.insert(employeeNotifications).values({
            employeeId: (matched as any).id,
            type: "new_appointment",
            title: `موعد جديد: ${clientName}`,
            body: `تاريخ: ${date}${time ? ` - ${time}` : ""}\nالسبب: ${reason || ""}`,
            relatedId: row?.id || null,
            isRead: 0,
          });
        }
      } catch (_) { /* لا نوقف الاستجابة بسبب فشل الإشعار */ }
    }

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
    const { phases: phasesData, ...planData } = req.body;

    // Update plan metadata
    await db.update(workPlans).set({
      name: planData.name,
      projectType: planData.projectType,
      serviceType: planData.serviceType,
      description: planData.description,
    }).where(eq(workPlans.id, id));

    // If phases are provided, replace all phases and tasks
    if (Array.isArray(phasesData)) {
      // Delete existing tasks and phases
      const existingPhases = await db.select().from(workPlanPhases).where(eq(workPlanPhases.workPlanId, id));
      for (const ph of existingPhases) {
        await db.delete(workPlanTasks).where(eq(workPlanTasks.workPlanPhaseId, ph.id));
      }
      await db.delete(workPlanPhases).where(eq(workPlanPhases.workPlanId, id));

      // Insert new phases and tasks
      for (let i = 0; i < phasesData.length; i++) {
        const ph = phasesData[i];
        const [newPhase] = await db.insert(workPlanPhases).values({
          workPlanId: id,
          title: ph.title || '',
          subtitle: ph.subtitle || '',
          order: i,
        }).returning();
        if (Array.isArray(ph.tasks)) {
          for (let j = 0; j < ph.tasks.length; j++) {
            const t = ph.tasks[j];
            await db.insert(workPlanTasks).values({
              workPlanPhaseId: newPhase.id,
              name: t.name || '',
              assignee: t.assignee || '',
              estimatedDays: t.estimatedDays || 1,
              description: t.description || '',
              order: j,
            });
          }
        }
      }
    }

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

    const planPhases = await db.select().from(workPlanPhases)
      .where(eq(workPlanPhases.workPlanId, planId))
      .orderBy(workPlanPhases.order);

    // ── حذف جميع المراحل والمهام الحالية ثم إعادة البناء من خطة العمل ──
    const existingPhases = await db.select().from(phases).where(eq(phases.projectId, projectId));
    for (const ep of existingPhases) {
      await db.delete(tasks).where(eq(tasks.phaseId, ep.id));
    }
    await db.delete(phases).where(eq(phases.projectId, projectId));

    for (let i = 0; i < planPhases.length; i++) {
      const ph = planPhases[i];
      await db.insert(phases).values({
        projectId,
        order: i,
        title: ph.title,
        subtitle: ph.subtitle || "",
      });
      const [newPhase] = await db.select().from(phases)
        .where(eq(phases.projectId, projectId))
        .orderBy(desc(phases.id))
        .limit(1);

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
// Phase Meta API (حالة المراحل الفرعية)
// ══════════════════════════════════════════════════════════════════════════════
apiRouter.get("/api/projects/:projectId/phase-meta/:phaseKey", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(phaseMeta)
      .where(eq(phaseMeta.projectId, req.params.projectId));
    const found = rows.find((r: any) => r.phaseKey === req.params.phaseKey);
    res.json(found ? { ...found, data: JSON.parse(found.data || "{}") } : null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/projects/:projectId/phase-meta/:phaseKey", async (req, res) => {
  try {
    const db = getDb();
    const { data } = req.body;
    const now = new Date().toISOString().split("T")[0];
    const rows = await db.select().from(phaseMeta)
      .where(eq(phaseMeta.projectId, req.params.projectId));
    const existing = rows.find((r: any) => r.phaseKey === req.params.phaseKey);
    if (existing) {
      await db.update(phaseMeta)
        .set({ data: JSON.stringify(data), updatedAt: now })
        .where(eq(phaseMeta.id, existing.id));
    } else {
      await db.insert(phaseMeta).values({
        projectId: req.params.projectId,
        phaseKey: req.params.phaseKey,
        data: JSON.stringify(data),
        updatedAt: now,
      });
    }
    res.json({ success: true, data });
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


// ── Employees API ──────────────────────────────────────────────────────────────
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "dynamic_salt_2026").digest("hex");
}

function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

// تسجيل دخول الموظف
apiRouter.post("/api/employees/login", async (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "البريد وكلمة المرور مطلوبان" });

    const [emp] = await db.select().from(employees).where(eq(employees.email, email.toLowerCase().trim()));
    if (!emp) return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    if (!emp.isActive) return res.status(403).json({ error: "الحساب موقوف، تواصل مع المدير" });

    const hash = hashPassword(password);
    if (hash !== emp.passwordHash) return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });

    // إنشاء جلسة
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم
    await db.insert(employeeSessions).values({ id: sessionId, employeeId: emp.id, expiresAt });

    // تحديث آخر تسجيل دخول
    await db.update(employees).set({ lastLogin: new Date() }).where(eq(employees.id, emp.id));

    // إرسال cookie
    res.cookie("emp_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...empData } = emp;
    res.json({ success: true, employee: empData });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// الحصول على بيانات الموظف الحالي
apiRouter.get("/api/employees/me", async (req, res) => {
  try {
    const db = getDb();
    const sessionId = req.cookies?.emp_session;
    if (!sessionId) return res.status(401).json({ error: "غير مسجل دخول" });

    const [session] = await db.select().from(employeeSessions).where(eq(employeeSessions.id, sessionId));
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "انتهت صلاحية الجلسة" });
    }

    const [emp] = await db.select().from(employees).where(eq(employees.id, session.employeeId));
    if (!emp || !emp.isActive) return res.status(401).json({ error: "الحساب غير موجود أو موقوف" });

    const { passwordHash: _, ...empData } = emp;
    res.json(empData);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// تسجيل خروج الموظف
apiRouter.post("/api/employees/logout", async (req, res) => {
  try {
    const db = getDb();
    const sessionId = req.cookies?.emp_session;
    if (sessionId) {
      await db.delete(employeeSessions).where(eq(employeeSessions.id, sessionId));
    }
    res.clearCookie("emp_session");
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// قائمة الموظفين (للمدير فقط)
apiRouter.get("/api/employees", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      role: employees.role,
      specialty: employees.specialty,
      isActive: employees.isActive,
      lastLogin: employees.lastLogin,
      createdAt: employees.createdAt,
    }).from(employees).orderBy(employees.createdAt);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// إضافة موظف جديد
apiRouter.post("/api/employees", async (req, res) => {
  try {
    const db = getDb();
    const { name, email, password, role, specialty } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "الاسم والبريد وكلمة المرور مطلوبة" });

    const passwordHash = hashPassword(password);
    await db.insert(employees).values({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || "draftsman",
      specialty: specialty || "",
      isActive: 1,
    });
    const [newEmp] = await db.select({
      id: employees.id, name: employees.name, email: employees.email,
      role: employees.role, specialty: employees.specialty, isActive: employees.isActive,
    }).from(employees).where(eq(employees.email, email.toLowerCase().trim()));
    res.status(201).json(newEmp);
  } catch (e: any) {
    if (e.message?.includes("Duplicate")) return res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    res.status(500).json({ error: e.message });
  }
});

// تعديل موظف
apiRouter.put("/api/employees/:id", async (req, res) => {
  try {
    const db = getDb();
    const { password, ...data } = req.body;
    const updateData: any = { ...data };
    if (password) updateData.passwordHash = hashPassword(password);
    await db.update(employees).set(updateData).where(eq(employees.id, parseInt(req.params.id)));
    const [row] = await db.select({
      id: employees.id, name: employees.name, email: employees.email,
      role: employees.role, specialty: employees.specialty, isActive: employees.isActive,
    }).from(employees).where(eq(employees.id, parseInt(req.params.id)));
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// حذف موظف
apiRouter.delete("/api/employees/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(employees).where(eq(employees.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Municipality Submissions ───────────────────────────────────────────────────
apiRouter.get("/api/projects/:projectId/municipality", async (req, res) => {
  try {
    const db = getDb();
    const [row] = await db.select().from(municipalitySubmissions)
      .where(eq(municipalitySubmissions.projectId, req.params.projectId));
    res.json(row || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/projects/:projectId/municipality", async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.select().from(municipalitySubmissions)
      .where(eq(municipalitySubmissions.projectId, req.params.projectId));
    if (existing.length > 0) {
      await db.update(municipalitySubmissions)
        .set({ ...req.body })
        .where(eq(municipalitySubmissions.projectId, req.params.projectId));
      const [row] = await db.select().from(municipalitySubmissions)
        .where(eq(municipalitySubmissions.projectId, req.params.projectId));
      return res.json(row);
    }
    await db.insert(municipalitySubmissions).values({
      projectId: req.params.projectId,
      phaseId: req.body.phaseId || 0,
      ...req.body,
    });
    const [row] = await db.select().from(municipalitySubmissions)
      .where(eq(municipalitySubmissions.projectId, req.params.projectId));
    res.status(201).json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Detailed Drawings ─────────────────────────────────────────────────────────
apiRouter.get("/api/projects/:projectId/drawings", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(detailedDrawings)
      .where(eq(detailedDrawings.projectId, req.params.projectId))
      .orderBy(detailedDrawings.createdAt);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/projects/:projectId/drawings", async (req, res) => {
  try {
    const db = getDb();
    await db.insert(detailedDrawings).values({
      projectId: req.params.projectId,
      phaseId: req.body.phaseId || 0,
      drawingType: req.body.drawingType,
      assignedTo: req.body.assignedTo || "",
      assignedEmployeeId: req.body.assignedEmployeeId || null,
      status: req.body.status || "pending",
      notes: req.body.notes || "",
    });
    const rows = await db.select().from(detailedDrawings)
      .where(eq(detailedDrawings.projectId, req.params.projectId))
      .orderBy(desc(detailedDrawings.createdAt))
      .limit(1);
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/drawings/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.update(detailedDrawings).set(req.body).where(eq(detailedDrawings.id, parseInt(req.params.id)));
    const [row] = await db.select().from(detailedDrawings).where(eq(detailedDrawings.id, parseInt(req.params.id)));
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/api/drawings/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(detailedDrawings).where(eq(detailedDrawings.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Supervision Visits ────────────────────────────────────────────────────────
apiRouter.get("/api/projects/:projectId/supervision", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(supervisionVisits)
      .where(eq(supervisionVisits.projectId, req.params.projectId))
      .orderBy(desc(supervisionVisits.createdAt));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.post("/api/projects/:projectId/supervision", async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString().slice(0, 10);
    // Count existing visits to set visit number
    const existing = await db.select().from(supervisionVisits)
      .where(eq(supervisionVisits.projectId, req.params.projectId));
    const visitNumber = existing.length + 1;
    await db.insert(supervisionVisits).values({
      projectId: req.params.projectId,
      phaseId: req.body.phaseId || 0,
      visitDate: req.body.visitDate || now,
      visitNumber,
      constructionStage: req.body.constructionStage,
      stageKey: req.body.stageKey || "",
      engineerName: req.body.engineerName || "",
      contractorName: req.body.contractorName || "",
      contractorPhone: req.body.contractorPhone || "",
      ownerName: req.body.ownerName || "",
      location: req.body.location || "",
      licenseNumber: req.body.licenseNumber || "",
      generalNotes: req.body.generalNotes || "",
      checklistData: req.body.checklistData || "{}",
      itemNotes: req.body.itemNotes || null,
      photoUrls: req.body.photoUrls || "[]",
      visitStatus: req.body.visitStatus || "in_progress",
      status: "draft",
    });
    const [row] = await db.select().from(supervisionVisits)
      .where(eq(supervisionVisits.projectId, req.params.projectId))
      .orderBy(desc(supervisionVisits.createdAt))
      .limit(1);
    res.status(201).json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.put("/api/supervision/:id", async (req, res) => {
  try {
    const db = getDb();
    // Build safe update object - only include known fields
    const body = req.body;
    const updateData: Record<string, any> = {};
    if (body.checklistData !== undefined) updateData.checklistData = body.checklistData;
    if (body.itemNotes !== undefined) updateData.itemNotes = body.itemNotes;
    if (body.engineerName !== undefined) updateData.engineerName = body.engineerName;
    if (body.contractorName !== undefined) updateData.contractorName = body.contractorName;
    if (body.contractorPhone !== undefined) updateData.contractorPhone = body.contractorPhone;
    if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber;
    if (body.generalNotes !== undefined) updateData.generalNotes = body.generalNotes;
    if (body.photoUrls !== undefined) updateData.photoUrls = body.photoUrls;
    if (body.stageKey !== undefined) updateData.stageKey = body.stageKey;
    if (body.visitStatus !== undefined) updateData.visitStatus = body.visitStatus;
    if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl;
    await db.update(supervisionVisits).set(updateData).where(eq(supervisionVisits.id, parseInt(req.params.id)));
    const [row] = await db.select().from(supervisionVisits).where(eq(supervisionVisits.id, parseInt(req.params.id)));
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

apiRouter.delete("/api/supervision/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(supervisionVisits).where(eq(supervisionVisits.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});



// Stage checklist data for PDF key resolution
const STAGE_CHECKLIST_SERVER: Record<string, { section: string; items: string[] }[]> = {
  excavation: [{ section: "الحفر والمنسوب", items: ["التأكد من أماكن الحفر وحدودها حسب المخطط","التحقق من منسوب الحفر المطلوب","التأكد من استواء قاع الحفر","التحقق من عدم وجود تربة ضعيفة أو طينية","التأكد من حدود القسيمة والأكسات"] }],
  elevator_pit: [{ section: "بير المصعد والجور", items: ["التأكد من أبعاد بير المصعد حسب المخطط","التحقق من منسوب قاع البير","التأكد من أماكن جور المجاري وأبعادها","التحقق من منسوب جور المجاري","التأكد من التسليح حسب المخطط الإنشائي"] }],
  foundations: [{ section: "أبعاد ومواضع القواعد", items: ["التأكد من أماكن القواعد وعددها حسب المخطط","التحقق من مقاسات القواعد (طول × عرض × عمق)","التأكد من أكسات القواعد بالنسبة للحدود"] },{ section: "تسليح القواعد", items: ["الشبكة السفلية: الأقطار والمسافات حسب المخطط","الشبكة العلوية: الأقطار والمسافات حسب المخطط","نهايات التسليح بزاوية 90° في الاتجاهين","التربيط بين الشبكتين منتظم ولا يوجد حديد بدون ربط","كفايات رقاب الأعمدة داخل القاعدة بالطول المطلوب","الغطاء الخرساني (Cover) لا يقل عن 7.5 سم"] }],
  basement_slab: [{ section: "اللبشة المسلحة", items: ["التأكد من مقاسات اللبشة وأماكن القواعد","تحديد مشرب اللبشة حسب المخطط","الشبكة السفلية مستوية وبالأقطار المطلوبة","الشبكة العلوية مستوية وبالأقطار المطلوبة","الغطاء الخرساني السفلي لا يقل عن 7.5 سم","كفايات رقاب الأعمدة خارجة بالطول المطلوب"] }],
  col_necks: [{ section: "رقاب الأعمدة", items: ["أماكن الأعمدة حسب المخطط الإنشائي والأكسات","مقاسات الأعمدة حسب المخطط","تسليح الرقاب (أقطار وعدد) حسب المخطط","الكفايات بالمسافات المطلوبة ومربوطة بزاوية 90°","ارتفاع رقاب الأعمدة بحديد الصب صحيح","أشاير الأعمدة لا تقل عن 75 سم"] }],
  basement_walls: [{ section: "حوائط السرداب", items: ["وجود قاعدة شريطية أسفل الحوائط","تسليح المواطن بالعدد المطلوب من القاعدة","ارتفاع التسليح من اللبشة لا يقل عن 75 سم","أشاير أعلى رقم الحائط لعمل رقم التسليح","التسليح الرأسي والأفقي بالفي المطلوب"] }],
  reinforced_floor: [{ section: "أرضية أرضي (Slab on Grade)", items: ["الدفان أسفل البلاطة مدكوك بشكل جيد","نايلون حماية أسفل التسليح موجود","تسليح البلاطة حسب المخطط ومربوط جيداً","الغطاء الخرساني السفلي لا يقل عن 5 سم"] }],
  beams: [{ section: "الشناجات الإنشائية", items: ["مقاسات الشناجات (عرض × عمق) حسب المخطط","التسليح العلوي: الأقطار والعدد حسب المخطط","التسليح السفلي: الأقطار والعدد حسب المخطط","الكفايات: العدد والمسافات ومربوطة بزاوية 90°","التسليح السفلي مربوط بالكفايات كل 1م على الأقل"] },{ section: "الصحي والكهرباء في الشناجات", items: ["مواضع بايبات الصرف الصحي حسب المخطط","ميول بايبات الصرف صحيحة (لا تقل عن 1%)","أقطار بايبات الصرف حسب المخطط الصحي","مواضع بايبات الكهرباء (Conduit) حسب المخطط","أقطار بايبات الكهرباء مناسبة للكابلات","تثبيت البايبات جيداً قبل الصب"] }],
  basement_cols: [{ section: "أعمدة السرداب", items: ["تسليح الأعمدة حسب المخطط (أقطار وعدد)","أشاير الأعمدة لا تقل عن 75 سم","الكفايات: العدد والمسافات حسب التفصيل","التكفيف في أول وآخر ثلث من العمود","الأعمدة المزروعة مربوطة جيداً بزاوية 90°","قفل الكفايات لا يقل عن 7 سم في الاتجاهين"] }],
  basement_roof: [{ section: "سقف السرداب - الإنشائي", items: ["الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي","التسليح السفلي للجسور مربوط بالكفايات كل 1م","الشبكات السفلية والعلوية للبلاطة حسب المخطط","الكفايات ومربوطة جيداً وبالعدد المطلوب","تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف","تسليح البروزات كافٍ حسب المخطط"] },{ section: "الصحي والكهرباء في السقف", items: ["مواضع بايبات الصرف الصحي حسب المخطط","ميول بايبات الصرف صحيحة","مواضع بايبات الكهرباء (Conduit) حسب المخطط","تثبيت البايبات جيداً قبل الصب"] },{ section: "البروزات", items: ["مطابقة بروزات الواجهات للمخطط المعماري","أبعاد البروزات ومناسيبها صحيحة","تسليح البروزات كافٍ"] }],
  ground_cols: [{ section: "أعمدة الأرضي", items: ["تسليح الأعمدة حسب المخطط (أقطار وعدد)","أشاير الأعمدة لا تقل عن 75 سم","الكفايات: العدد والمسافات حسب التفصيل","التكفيف في أول وآخر ثلث من العمود","الأعمدة المزروعة مربوطة جيداً بزاوية 90°","قفل الكفايات لا يقل عن 7 سم في الاتجاهين"] }],
  ground_roof: [{ section: "سقف الأرضي - الإنشائي", items: ["الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي","التسليح السفلي للجسور مربوط بالكفايات كل 1م","الشبكات السفلية والعلوية للبلاطة حسب المخطط","الكفايات ومربوطة جيداً وبالعدد المطلوب","تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف","تسليح البلاطة الواحدة طولية وعرضية بالمسافات الصحيحة","استمرار تسليح البلاطة إلى البلاطة المجاورة بمسافة المحذور"] },{ section: "الصحي والكهرباء في السقف", items: ["مواضع بايبات الصرف الصحي حسب المخطط","ميول بايبات الصرف صحيحة","مواضع بايبات الكهرباء (Conduit) حسب المخطط","تثبيت البايبات جيداً قبل الصب"] },{ section: "البروزات", items: ["مطابقة بروزات الواجهات للمخطط المعماري","أبعاد البروزات ومناسيبها صحيحة","تسليح البروزات كافٍ"] }],
  first_cols: [{ section: "أعمدة الأول", items: ["تسليح الأعمدة حسب المخطط (أقطار وعدد)","أشاير الأعمدة لا تقل عن 75 سم","الكفايات: العدد والمسافات حسب التفصيل","التكفيف في أول وآخر ثلث من العمود","قفل الكفايات لا يقل عن 7 سم في الاتجاهين"] }],
  first_roof: [{ section: "سقف الأول - الإنشائي", items: ["الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي","التسليح السفلي للجسور مربوط بالكفايات كل 1م","الشبكات السفلية والعلوية للبلاطة حسب المخطط","الكفايات ومربوطة جيداً وبالعدد المطلوب","تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف","تسليح البلاطة الواحدة بالمسافات الصحيحة"] },{ section: "الصحي والكهرباء في السقف", items: ["مواضع بايبات الصرف الصحي حسب المخطط","ميول بايبات الصرف صحيحة","مواضع بايبات الكهرباء (Conduit) حسب المخطط","تثبيت البايبات جيداً قبل الصب"] },{ section: "البروزات", items: ["مطابقة بروزات الواجهات للمخطط المعماري","أبعاد البروزات ومناسيبها صحيحة","تسليح البروزات كافٍ"] }],
  second_cols: [{ section: "أعمدة الثاني", items: ["تسليح الأعمدة حسب المخطط (أقطار وعدد)","أشاير الأعمدة لا تقل عن 75 سم","الكفايات: العدد والمسافات حسب التفصيل","التكفيف في أول وآخر ثلث من العمود","قفل الكفايات لا يقل عن 7 سم في الاتجاهين"] }],
  second_roof: [{ section: "سقف الثاني - الإنشائي", items: ["الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي","التسليح السفلي للجسور مربوط بالكفايات كل 1م","الشبكات السفلية والعلوية للبلاطة حسب المخطط","الكفايات ومربوطة جيداً وبالعدد المطلوب","تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف"] },{ section: "الصحي والكهرباء في السقف", items: ["مواضع بايبات الصرف الصحي حسب المخطط","ميول بايبات الصرف صحيحة","مواضع بايبات الكهرباء (Conduit) حسب المخطط","تثبيت البايبات جيداً قبل الصب"] },{ section: "البروزات", items: ["مطابقة بروزات الواجهات للمخطط المعماري","أبعاد البروزات ومناسيبها صحيحة","تسليح البروزات كافٍ"] }],
  service_cols: [{ section: "أعمدة سطح الخدمات", items: ["تسليح الأعمدة حسب المخطط (أقطار وعدد)","أشاير الأعمدة لا تقل عن 75 سم","الكفايات: العدد والمسافات حسب التفصيل","قفل الكفايات لا يقل عن 7 سم في الاتجاهين"] }],
  service_roof: [{ section: "سقف سطح الخدمات - الإنشائي", items: ["الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي","الشبكات السفلية والعلوية للبلاطة حسب المخطط","الكفايات ومربوطة جيداً وبالعدد المطلوب"] },{ section: "الصحي والكهرباء في السقف", items: ["مواضع بايبات الصرف الصحي حسب المخطط","ميول بايبات الصرف صحيحة","مواضع بايبات الكهرباء (Conduit) حسب المخطط","تثبيت البايبات جيداً قبل الصب"] },{ section: "البروزات", items: ["مطابقة بروزات الواجهات للمخطط المعماري","أبعاد البروزات ومناسيبها صحيحة","تسليح البروزات كافٍ"] }],
};
const DEFAULT_STAGE_CHECKLIST_SERVER = [{ section: "العناصر الإنشائية", items: ["التأكد من مطابقة الأبعاد للمخطط","التأكد من التسليح حسب المخطط الإنشائي","التأكد من الكفايات والتربيط"] }];

// Helper: resolve numeric key "sIdx-iIdx" to item text using stageKey
function resolveChecklistKey(key: string, stageKey: string): string {
  const sections = STAGE_CHECKLIST_SERVER[stageKey] || DEFAULT_STAGE_CHECKLIST_SERVER;
  const parts = key.split("-");
  if (parts.length === 2) {
    const sIdx = parseInt(parts[0]);
    const iIdx = parseInt(parts[1]);
    if (!isNaN(sIdx) && !isNaN(iIdx) && sections[sIdx] && sections[sIdx].items[iIdx]) {
      return sections[sIdx].items[iIdx];
    }
  }
  return key; // fallback to key if not resolvable
}

// PDF Report for Supervision Visit
apiRouter.get("/api/supervision/visits/:id/pdf", async (req, res) => {
  try {
    const db = getDb();
    const [visit] = await db.select().from(supervisionVisits).where(eq(supervisionVisits.id, parseInt(req.params.id)));
    if (!visit) return res.status(404).json({ error: "Visit not found" });

    // Fetch project details for name, address, owner, contract number
    let projectName = visit.projectId || "-";
    let projectAddress = "";
    let ownerName = "";
    let supervisionContractNo = "";

    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, visit.projectId));
      if (project) {
        projectName = project.name || visit.projectId;
        if (project.clientId) {
          const [client] = await db.select().from(clients).where(eq(clients.id, project.clientId));
          if (client) ownerName = client.name || "";
        }
        if (project.contractId) {
          const [contract] = await db.select().from(contracts).where(eq(contracts.id, project.contractId));
          if (contract) {
            supervisionContractNo = contract.id || "";
            const parts = [contract.area, contract.plot ? "قطعة " + contract.plot : ""].filter(Boolean);
            projectAddress = parts.join(" - ");
          }
        }
        if (!supervisionContractNo) {
          const [contractByProject] = await db.select().from(contracts).where(eq(contracts.projectId, project.id));
          if (contractByProject) {
            supervisionContractNo = contractByProject.id || "";
            const parts = [contractByProject.area, contractByProject.plot ? "قطعة " + contractByProject.plot : ""].filter(Boolean);
            if (!projectAddress) projectAddress = parts.join(" - ");
          }
        }
      }
    } catch (_) {}

    // Parse checklist and item notes
    let checklist: Record<string, string> = {};
    let itemNotesMap: Record<string, string> = {};
    try { checklist = JSON.parse(visit.checklistData || "{}"); } catch {}
    try { itemNotesMap = JSON.parse((visit as any).itemNotes || "{}"); } catch {}

    // Resolve numeric keys to item text
    const stageKey = (visit as any).stageKey || "excavation";
    const resolvedChecklist: Record<string, string> = {};
    const resolvedNotes: Record<string, string> = {};
    for (const [k, v] of Object.entries(checklist)) {
      const label = resolveChecklistKey(k, stageKey);
      resolvedChecklist[label] = v;
    }
    for (const [k, v] of Object.entries(itemNotesMap)) {
      const label = resolveChecklistKey(k, stageKey);
      resolvedNotes[label] = v;
    }
    checklist = resolvedChecklist;
    itemNotesMap = resolvedNotes;

    // Status display config
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      accepted:            { label: "مقبول",                       color: "#16a34a", bg: "#dcfce7" },
      rejected:            { label: "مرفوض",                       color: "#dc2626", bg: "#fee2e2" },
      accepted_with_notes: { label: "مقبول بعد استيفاء الملاحظات", color: "#d97706", bg: "#fef3c7" },
      pending:             { label: "لم يُفحص",                    color: "#9ca3af", bg: "#f3f4f6" },
    };

    // Count stats
    const values = Object.values(checklist);
    const stats = {
      total: values.length,
      accepted: values.filter(v => v === "accepted").length,
      rejected: values.filter(v => v === "rejected").length,
      withNotes: values.filter(v => v === "accepted_with_notes").length,
      pending: values.filter(v => v === "pending" || !v).length,
    };

    // Build checklist rows
    const checklistRows = Object.entries(checklist).map(([key, status]) => {
      const cfg = statusConfig[status] || statusConfig["pending"];
      const note = itemNotesMap[key] || "";
      const noteHtml = note
        ? "<div style='margin-top:3px;font-size:10px;color:" + cfg.color + ";background:" + cfg.bg + ";padding:3px 6px;border-radius:4px;border-right:3px solid " + cfg.color + ";'>" + note + "</div>"
        : "";
      return "<tr><td style='padding:6px 8px;border:1px solid #e5e7eb;'>" + key + noteHtml + "</td>" +
        "<td style='padding:6px 8px;border:1px solid #e5e7eb;text-align:center;background:" + cfg.bg + ";color:" + cfg.color + ";font-weight:600;font-size:11px;width:160px;'>" + cfg.label + "</td></tr>";
    }).join("");

    const infoGrid = [
      ["اسم المشروع", projectName],
      ["موقع المشروع", projectAddress || "-"],
      ["رقم تعهد الإشراف", supervisionContractNo || "-"],
      ["مرحلة البناء", visit.constructionStage || "-"],
      ["المهندس المشرف", visit.engineerName || "-"],
      ["المقاول", (visit.contractorName || "-") + ((visit as any).contractorPhone ? " | " + (visit as any).contractorPhone : "")],
      ["رقم الرخصة", visit.licenseNumber || "-"],
      ["تاريخ الزيارة", visit.visitDate || "-"],
    ].map(([label, value]) =>
      "<div class='info-item'><div class='label'>" + label + "</div><div class='value'>" + value + "</div></div>"
    ).join("");

    const notesHtml = visit.generalNotes
      ? "<div style='margin:10px 0;padding:10px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;'><strong style='color:#0369a1;'>ملاحظات الزيارة:</strong> " + visit.generalNotes + "</div>"
      : "";

    const statsHtml = stats.total > 0
      ? "<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0;'>" +
        "<div style='text-align:center;padding:8px;background:#dcfce7;border-radius:6px;'><div style='font-size:18px;font-weight:bold;color:#16a34a;'>" + stats.accepted + "</div><div style='font-size:10px;color:#166534;'>مقبول</div></div>" +
        "<div style='text-align:center;padding:8px;background:#fee2e2;border-radius:6px;'><div style='font-size:18px;font-weight:bold;color:#dc2626;'>" + stats.rejected + "</div><div style='font-size:10px;color:#991b1b;'>مرفوض</div></div>" +
        "<div style='text-align:center;padding:8px;background:#fef3c7;border-radius:6px;'><div style='font-size:18px;font-weight:bold;color:#d97706;'>" + stats.withNotes + "</div><div style='font-size:10px;color:#92400e;'>بملاحظات</div></div>" +
        "<div style='text-align:center;padding:8px;background:#f3f4f6;border-radius:6px;'><div style='font-size:18px;font-weight:bold;color:#6b7280;'>" + stats.pending + "</div><div style='font-size:10px;color:#374151;'>لم يُفحص</div></div>" +
        "</div>"
      : "";

    const tableBody = checklistRows || "<tr><td colspan='2' style='text-align:center;padding:12px;color:#9ca3af;'>لا توجد بنود مسجلة</td></tr>";

    const htmlParts = [
      "<!DOCTYPE html>",
      "<html dir='rtl' lang='ar'>",
      "<head><meta charset='UTF-8'/>",
      "<title>تقرير زيارة إشراف</title>",
      "<style>",
      "@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');",
      "body{font-family:'Cairo',Arial,sans-serif;font-size:12px;margin:24px;color:#1f2937;background:#fff;}",
      ".header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a3a5c;padding-bottom:12px;margin-bottom:16px;}",
      ".company{font-size:20px;font-weight:700;color:#1a3a5c;letter-spacing:1px;}",
      ".project-banner{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:10px 14px;margin:10px 0;display:flex;justify-content:space-between;align-items:center;}",
      ".project-name{font-size:15px;font-weight:700;color:#1a3a5c;}",
      ".project-meta{font-size:11px;color:#4b5563;margin-top:3px;}",
      ".title{font-size:15px;font-weight:700;text-align:center;margin:14px 0;background:linear-gradient(135deg,#1a3a5c,#2563eb);color:white;padding:10px;border-radius:6px;}",
      "table{width:100%;border-collapse:collapse;margin:10px 0;}",
      "th{background:#1a3a5c;color:white;padding:8px 10px;text-align:right;font-size:12px;}",
      "td{padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;}",
      "tr:nth-child(even){background:#f9fafb;}",
      ".info-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin:12px 0;}",
      ".info-item{border:1px solid #e5e7eb;padding:8px 10px;border-radius:6px;background:#f9fafb;}",
      ".label{font-size:10px;color:#6b7280;margin-bottom:2px;}",
      ".value{font-weight:700;font-size:12px;color:#1f2937;}",
      ".footer{margin-top:48px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;text-align:center;}",
      ".sig-box{border-top:2px solid #1a3a5c;padding-top:8px;font-size:11px;color:#374151;}",
      ".stamp-box{border:2px dashed #9ca3af;border-radius:8px;height:60px;margin:8px 0;display:flex;align-items:center;justify-content:center;color:#d1d5db;font-size:10px;}",
      "@media print{body{margin:10px;}@page{size:A4;margin:15mm;}}",
      "</style></head><body>",
      "<div class='header'>",
      "<div><div class='company'>DYNAMIC DESIGN</div>",
      "<div style='font-size:10px;color:#6b7280;margin-top:2px;'>ENGINEERING CONSULTANTS OFFICE</div>",
      "<div style='font-size:10px;color:#6b7280;'>Kuwait City - Al Qiblah - Salhia St. Building No. 18</div>",
      "<div style='font-size:10px;color:#6b7280;'>Tel: 22091228 | Mob: 99674300 - 50855599</div></div>",
      "<div style='text-align:left;'>",
      "<div style='font-size:17px;font-weight:700;color:#1a3a5c;'>ديناميك ديزاين</div>",
      "<div style='font-size:10px;color:#6b7280;'>للاستشارات الهندسية</div>",
      "<div style='font-size:10px;color:#6b7280;'>E-mail: Info@DynamicSaud.com</div></div></div>",
    ];

    const htmlContent = htmlParts.join("") +
      "<div class='title'>قائمة تدقيق الأعمال المدنية — الإشراف الهندسي</div>" +
      "<div class='project-banner'>" +
      "<div><div class='project-name'>" + projectName + "</div>" +
      (projectAddress ? "<div class='project-meta'>موقع المشروع: " + projectAddress + "</div>" : "") +
      "</div>" +
      "<div style='text-align:left;'>" +
      (supervisionContractNo ? "<div style='font-size:11px;color:#4b5563;'>رقم تعهد الإشراف: <strong style='color:#1a3a5c;'>" + supervisionContractNo + "</strong></div>" : "") +
      "<div style='font-size:11px;color:#4b5563;'>رقم الزيارة: <strong>" + (visit.visitNumber || "-") + "</strong> &nbsp;| التاريخ: <strong>" + (visit.visitDate || "-") + "</strong></div>" +
      "</div></div>" +
      "<div class='info-grid'>" + infoGrid + "</div>" +
      notesHtml +
      statsHtml +
      "<table><thead><tr><th>البند</th><th style='width:160px;text-align:center;'>الحالة</th></tr></thead>" +
      "<tbody>" + tableBody + "</tbody></table>" +
      "<div class='footer'>" +
      "<div class='sig-box'><strong>المهندس المشرف</strong><br/><br/>_________________<br/><span style='font-size:10px;'>" + (visit.engineerName || "") + "</span></div>" +
      "<div class='sig-box'><strong>المالك</strong><br/><br/>_________________<br/><span style='font-size:10px;'>" + ownerName + "</span></div>" +
      "<div class='sig-box'><strong>ختم المقاول</strong><div class='stamp-box'>ختم الشركة</div><span style='font-size:10px;'>" + (visit.contractorName || "") + "</span></div>" +
      "</div></body></html>";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(htmlContent);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
;

// ── Employee Notifications (إشعارات الموظفين) ─────────────────────────────────
// GET /api/employee-notifications?employeeId=X  — جلب إشعارات موظف
apiRouter.get("/api/employee-notifications", async (req, res) => {
  try {
    const db = getDb();
    const empId = parseInt(req.query.employeeId as string);
    if (!empId) return res.json([]);
    const rows = await db.select().from(employeeNotifications)
      .where(eq(employeeNotifications.employeeId, empId))
      .orderBy(desc(employeeNotifications.createdAt));
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/employee-notifications/:id/read  — تعليم كمقروء
apiRouter.patch("/api/employee-notifications/:id/read", async (req, res) => {
  try {
    const db = getDb();
    await db.update(employeeNotifications)
      .set({ isRead: 1 })
      .where(eq(employeeNotifications.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/employee-notifications/read-all  — تعليم الكل كمقروء
apiRouter.patch("/api/employee-notifications/read-all", async (req, res) => {
  try {
    const db = getDb();
    const empId = parseInt(req.body.employeeId);
    if (!empId) return res.json({ success: false });
    await db.update(employeeNotifications)
      .set({ isRead: 1 })
      .where(eq(employeeNotifications.employeeId, empId));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Packages (الباقات) ─────────────────────────────────────────────────────────
// GET /api/packages — جلب كل الباقات
apiRouter.get("/api/packages", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(packages).orderBy(packages.buildingType, packages.name);
    // إرجاع الباقات كـ Record<buildingType, Package[]>
    const grouped: Record<string, any[]> = {};
    for (const row of rows) {
      const bt = row.buildingType;
      if (!grouped[bt]) grouped[bt] = [];
      grouped[bt].push({
        ...row,
        features: (() => { try { return JSON.parse(row.features || "[]"); } catch { return []; } })(),
      });
    }
    res.json(grouped);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/packages — إضافة باقة جديدة
apiRouter.post("/api/packages", async (req, res) => {
  try {
    const db = getDb();
    const { name, price, buildingType, serviceType, level, features } = req.body;
    await db.insert(packages).values({
      name,
      price,
      buildingType,
      serviceType,
      level: level || "-",
      features: JSON.stringify(Array.isArray(features) ? features : []),
    });
    const [row] = await db.select().from(packages)
      .where(eq(packages.name, name))
      .orderBy(desc(packages.id))
      .limit(1);
    res.status(201).json({ ...row, features: JSON.parse(row.features || "[]") });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/packages/:id — تعديل باقة
apiRouter.put("/api/packages/:id", async (req, res) => {
  try {
    const db = getDb();
    const { name, price, buildingType, serviceType, level, features } = req.body;
    await db.update(packages).set({
      name,
      price,
      buildingType,
      serviceType,
      level: level || "-",
      features: JSON.stringify(Array.isArray(features) ? features : []),
    }).where(eq(packages.id, parseInt(req.params.id)));
    const [row] = await db.select().from(packages).where(eq(packages.id, parseInt(req.params.id)));
    res.json({ ...row, features: JSON.parse(row.features || "[]") });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/packages/:id — حذف باقة
apiRouter.delete("/api/packages/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(packages).where(eq(packages.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Governorate Areas (المناطق والمحافظات) ─────────────────────────────────────

// GET /api/governorate-areas — جلب كل المناطق مجمّعة حسب المحافظة
apiRouter.get("/api/governorate-areas", async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(governorateAreas)
      .orderBy(governorateAreas.governorate, governorateAreas.sortOrder);
    // تجميع حسب المحافظة
    const grouped: Record<string, string[]> = {};
    for (const row of rows) {
      if (!grouped[row.governorate]) grouped[row.governorate] = [];
      grouped[row.governorate].push(row.area);
    }
    res.json({ grouped, rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/governorate-areas — إضافة منطقة جديدة
apiRouter.post("/api/governorate-areas", async (req, res) => {
  try {
    const db = getDb();
    const { governorate, area, sortOrder } = req.body;
    if (!governorate || !area) return res.status(400).json({ error: "governorate and area are required" });
    // التحقق من عدم التكرار
    const existing = await db.select().from(governorateAreas)
      .where(eq(governorateAreas.governorate, governorate));
    const duplicate = existing.find((r: any) => r.area === area);
    if (duplicate) return res.status(400).json({ error: "المنطقة موجودة بالفعل في هذه المحافظة" });
    await db.insert(governorateAreas).values({
      governorate,
      area,
      sortOrder: sortOrder ?? existing.length + 1,
    });
    const [row] = await db.select().from(governorateAreas)
      .where(eq(governorateAreas.governorate, governorate))
      .orderBy(desc(governorateAreas.id))
      .limit(1);
    res.status(201).json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/governorate-areas/:id — تعديل منطقة
apiRouter.put("/api/governorate-areas/:id", async (req, res) => {
  try {
    const db = getDb();
    const { governorate, area, sortOrder } = req.body;
    await db.update(governorateAreas).set({
      ...(governorate ? { governorate } : {}),
      ...(area ? { area } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    }).where(eq(governorateAreas.id, parseInt(req.params.id)));
    const [row] = await db.select().from(governorateAreas)
      .where(eq(governorateAreas.id, parseInt(req.params.id)));
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/governorate-areas/:id — حذف منطقة
apiRouter.delete("/api/governorate-areas/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(governorateAreas).where(eq(governorateAreas.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/governorate-areas/governorate — إضافة محافظة جديدة كاملة
apiRouter.post("/api/governorate-areas/governorate", async (req, res) => {
  try {
    const db = getDb();
    const { governorate } = req.body;
    if (!governorate) return res.status(400).json({ error: "governorate is required" });
    // التحقق من عدم وجود المحافظة
    const existing = await db.select().from(governorateAreas)
      .where(eq(governorateAreas.governorate, governorate));
    if (existing.length > 0) return res.status(400).json({ error: "المحافظة موجودة بالفعل" });
    // إضافة المحافظة مع منطقة "أخرى" افتراضية
    await db.insert(governorateAreas).values({ governorate, area: "أخرى", sortOrder: 99 });
    res.status(201).json({ success: true, governorate });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/governorate-areas/governorate/:name — حذف محافظة كاملة مع مناطقها
apiRouter.delete("/api/governorate-areas/governorate/:name", async (req, res) => {
  try {
    const db = getDb();
    const name = decodeURIComponent(req.params.name);
    await db.delete(governorateAreas).where(eq(governorateAreas.governorate, name));
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
