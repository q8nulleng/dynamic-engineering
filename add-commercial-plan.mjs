import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || "4000"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
});

// Insert commercial work plan
await conn.execute(`
  INSERT INTO work_plans (name, description, project_type, service_type, created_at)
  VALUES ('خطة مبنى تجاري - بناء جديد', 'خطة عمل متكاملة للمباني التجارية والمحلات التجارية', 'تجاري', 'بناء جديد', NOW())
`);
const [[planRow]] = await conn.execute("SELECT id FROM work_plans WHERE project_type = 'تجاري' ORDER BY id DESC LIMIT 1");
const planId = planRow.id;
console.log("Created commercial plan with id:", planId);

// Define phases for commercial plan
const phases = [
  { title: "تجهيز الملف",        subtitle: "جمع الوثائق والملفات",     order: 0 },
  { title: "التصميم المعماري",   subtitle: "الكروكي والواجهات التجارية", order: 1 },
  { title: "التصميم الإنشائي",  subtitle: "الحسابات الإنشائية",        order: 2 },
  { title: "الرسم والإخراج",    subtitle: "إخراج المخططات",            order: 3 },
  { title: "تقديم البلدية",     subtitle: "المراجعة والاعتماد",         order: 4 },
  { title: "الإشراف",          subtitle: "الإشراف على التنفيذ",        order: 5 },
];

for (const phase of phases) {
  await conn.execute(
    "INSERT INTO work_plan_phases (work_plan_id, title, subtitle, `order`) VALUES (?, ?, ?, ?)",
    [planId, phase.title, phase.subtitle, phase.order]
  );
  const [[phaseRow]] = await conn.execute(
    "SELECT id FROM work_plan_phases WHERE work_plan_id = ? ORDER BY id DESC LIMIT 1",
    [planId]
  );
  const phaseId = phaseRow.id;

  // Add initial tasks for first phase
  if (phase.order === 0) {
    const tasks = [
      { name: "تجميع مستندات العميل",    assignee: "سكرتير", days: 3, order: 0 },
      { name: "طلب تقرير تربة",          assignee: "سكرتير", days: 5, order: 1 },
      { name: "تعبئة نماذج البلدية",     assignee: "سكرتير", days: 2, order: 2 },
    ];
    for (const task of tasks) {
      await conn.execute(
        "INSERT INTO work_plan_tasks (work_plan_phase_id, name, assignee, estimated_days, `order`) VALUES (?, ?, ?, ?, ?)",
        [phaseId, task.name, task.assignee, task.days, task.order]
      );
    }
  } else if (phase.order === 1) {
    const tasks = [
      { name: "رسم الكروكي المبدئي",     assignee: "م. مصطفى", days: 5, order: 0 },
      { name: "تصميم الواجهات التجارية", assignee: "م. مصطفى", days: 4, order: 1 },
    ];
    for (const task of tasks) {
      await conn.execute(
        "INSERT INTO work_plan_tasks (work_plan_phase_id, name, assignee, estimated_days, `order`) VALUES (?, ?, ?, ?, ?)",
        [phaseId, task.name, task.assignee, task.days, task.order]
      );
    }
  } else if (phase.order === 4) {
    const tasks = [
      { name: "تقديم ملف البلدية",       assignee: "سكرتير",   days: 3, order: 0 },
      { name: "متابعة الاعتماد",         assignee: "م. نواف",  days: 7, order: 1 },
    ];
    for (const task of tasks) {
      await conn.execute(
        "INSERT INTO work_plan_tasks (work_plan_phase_id, name, assignee, estimated_days, `order`) VALUES (?, ?, ?, ?, ?)",
        [phaseId, task.name, task.assignee, task.days, task.order]
      );
    }
  }
}

console.log("Commercial work plan created successfully with", phases.length, "phases");
await conn.end();
