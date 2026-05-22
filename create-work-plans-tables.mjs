import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
const conn = await createConnection(url);

console.log("Creating work_plans tables...");

await conn.execute(`
  CREATE TABLE IF NOT EXISTS work_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    project_type VARCHAR(64) NOT NULL DEFAULT '',
    service_type VARCHAR(64) DEFAULT '',
    description TEXT,
    is_default TINYINT DEFAULT 0,
    created_at VARCHAR(32) NOT NULL
  )
`);
console.log("✅ work_plans created");

await conn.execute(`
  CREATE TABLE IF NOT EXISTS work_plan_phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_plan_id INT NOT NULL,
    \`order\` INT NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    subtitle TEXT
  )
`);
console.log("✅ work_plan_phases created");

await conn.execute(`
  CREATE TABLE IF NOT EXISTS work_plan_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_plan_phase_id INT NOT NULL,
    \`order\` INT NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    assignee VARCHAR(128) DEFAULT '',
    estimated_days INT DEFAULT 0,
    description TEXT
  )
`);
console.log("✅ work_plan_tasks created");

// Insert default work plans
const now = new Date().toISOString().slice(0, 10);

// 1. خطة سكن خاص - بناء جديد
const [r1] = await conn.execute(
  `INSERT INTO work_plans (name, project_type, service_type, description, is_default, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
  ["خطة سكن خاص - بناء جديد", "سكن خاص", "بناء جديد", "خطة عمل قياسية لمشاريع السكن الخاص الجديدة", now]
);
const planId1 = r1.insertId;
const phases1 = [
  { title: "تجهيز الملف", subtitle: "جمع الوثائق والملفات", tasks: [
    { name: "تجميع مستندات العميل", assignee: "سكرتير", days: 3 },
    { name: "طلب تقرير تربة", assignee: "سكرتير", days: 5 },
    { name: "تعبئة نماذج البلدية", assignee: "سكرتير", days: 2 },
  ]},
  { title: "التصميم المعماري", subtitle: "الكروكي والواجهات", tasks: [
    { name: "رسم الكروكي المعماري", assignee: "مهندس معماري", days: 7 },
    { name: "تصميم الواجهات", assignee: "مهندس معماري", days: 5 },
    { name: "اعتماد التصميم من العميل", assignee: "مهندس معماري", days: 2 },
  ]},
  { title: "التصميم الإنشائي", subtitle: "الحسابات الإنشائية", tasks: [
    { name: "حسابات الأعمدة والأساسات", assignee: "مهندس إنشائي", days: 7 },
    { name: "تصميم نظام الأعمدة", assignee: "مهندس إنشائي", days: 5 },
  ]},
  { title: "الرسم والإخراج", subtitle: "إخراج المخططات", tasks: [
    { name: "رسم المخططات البلدية", assignee: "رسام", days: 7 },
    { name: "مراجعة المخططات", assignee: "مهندس معماري", days: 2 },
  ]},
  { title: "تقديم البلدية", subtitle: "المراجعة والاعتماد", tasks: [
    { name: "تقديم ملف البلدية", assignee: "سكرتير", days: 1 },
    { name: "متابعة الاعتماد", assignee: "سكرتير", days: 14 },
  ]},
  { title: "المخططات التفصيلية", subtitle: "صحي وكهربائي", tasks: [
    { name: "مخططات الصرف الصحي", assignee: "مهندس صحي", days: 5 },
    { name: "مخططات الكهرباء", assignee: "مهندس كهربائي", days: 5 },
  ]},
  { title: "الإشراف", subtitle: "الإشراف على التنفيذ", tasks: [
    { name: "زيارات الإشراف الدورية", assignee: "مهندس إشراف", days: 90 },
    { name: "تقارير الإشراف الشهرية", assignee: "مهندس إشراف", days: 30 },
  ]},
];

// 2. خطة صناعي - بناء جديد
const [r2] = await conn.execute(
  `INSERT INTO work_plans (name, project_type, service_type, description, is_default, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
  ["خطة مبنى صناعي - بناء جديد", "صناعي", "بناء جديد", "خطة عمل قياسية للمباني الصناعية والمستودعات", now]
);
const planId2 = r2.insertId;
const phases2 = [
  { title: "تجهيز الملف", subtitle: "جمع الوثائق والملفات", tasks: [
    { name: "تجميع مستندات العميل", assignee: "سكرتير", days: 3 },
    { name: "طلب تقرير تربة", assignee: "سكرتير", days: 5 },
    { name: "تعبئة نماذج البلدية", assignee: "سكرتير", days: 2 },
    { name: "تقديم طلب وزارة الصناعة", assignee: "سكرتير", days: 3 },
  ]},
  { title: "التصميم المعماري", subtitle: "الكروكي والواجهات", tasks: [
    { name: "رسم الكروكي المعماري", assignee: "مهندس معماري", days: 5 },
    { name: "تصميم الواجهات الصناعية", assignee: "مهندس معماري", days: 4 },
    { name: "اعتماد التصميم من العميل", assignee: "مهندس معماري", days: 2 },
  ]},
  { title: "التصميم الإنشائي", subtitle: "الحسابات الإنشائية", tasks: [
    { name: "حسابات الهيكل الصناعي", assignee: "مهندس إنشائي", days: 7 },
    { name: "تصميم الأساسات", assignee: "مهندس إنشائي", days: 5 },
  ]},
  { title: "الرسم والإخراج", subtitle: "إخراج المخططات", tasks: [
    { name: "رسم المخططات البلدية", assignee: "رسام", days: 7 },
    { name: "مراجعة المخططات", assignee: "مهندس معماري", days: 2 },
  ]},
  { title: "تقديم البلدية", subtitle: "المراجعة والاعتماد", tasks: [
    { name: "تقديم ملف البلدية", assignee: "سكرتير", days: 1 },
    { name: "متابعة الاعتماد", assignee: "سكرتير", days: 14 },
    { name: "الحصول على رخصة الإطفاء", assignee: "سكرتير", days: 21 },
  ]},
  { title: "الإشراف", subtitle: "الإشراف على التنفيذ", tasks: [
    { name: "زيارات الإشراف الدورية", assignee: "مهندس إشراف", days: 90 },
    { name: "تقارير الإشراف الشهرية", assignee: "مهندس إشراف", days: 30 },
  ]},
];

// 3. خطة استثماري/تجاري
const [r3] = await conn.execute(
  `INSERT INTO work_plans (name, project_type, service_type, description, is_default, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
  ["خطة مبنى استثماري - بناء جديد", "استثماري", "بناء جديد", "خطة عمل قياسية للمباني الاستثمارية والتجارية", now]
);
const planId3 = r3.insertId;
const phases3 = [
  { title: "تجهيز الملف", subtitle: "جمع الوثائق والملفات", tasks: [
    { name: "تجميع مستندات العميل", assignee: "سكرتير", days: 3 },
    { name: "طلب تقرير تربة", assignee: "سكرتير", days: 5 },
    { name: "تعبئة نماذج البلدية", assignee: "سكرتير", days: 2 },
  ]},
  { title: "التصميم المعماري", subtitle: "الكروكي والواجهات", tasks: [
    { name: "رسم الكروكي المعماري", assignee: "مهندس معماري", days: 10 },
    { name: "تصميم الواجهات", assignee: "مهندس معماري", days: 7 },
    { name: "اعتماد التصميم من العميل", assignee: "مهندس معماري", days: 3 },
  ]},
  { title: "التصميم الإنشائي", subtitle: "الحسابات الإنشائية", tasks: [
    { name: "حسابات الأعمدة والأساسات", assignee: "مهندس إنشائي", days: 10 },
    { name: "تصميم نظام الأعمدة", assignee: "مهندس إنشائي", days: 7 },
  ]},
  { title: "الرسم والإخراج", subtitle: "إخراج المخططات", tasks: [
    { name: "رسم المخططات البلدية", assignee: "رسام", days: 10 },
    { name: "مراجعة المخططات", assignee: "مهندس معماري", days: 3 },
  ]},
  { title: "تقديم البلدية", subtitle: "المراجعة والاعتماد", tasks: [
    { name: "تقديم ملف البلدية", assignee: "سكرتير", days: 1 },
    { name: "متابعة الاعتماد", assignee: "سكرتير", days: 21 },
  ]},
  { title: "الإشراف", subtitle: "الإشراف على التنفيذ", tasks: [
    { name: "زيارات الإشراف الدورية", assignee: "مهندس إشراف", days: 120 },
    { name: "تقارير الإشراف الشهرية", assignee: "مهندس إشراف", days: 30 },
  ]},
];

// Insert all phases and tasks
async function insertPlan(planId, phases) {
  for (let i = 0; i < phases.length; i++) {
    const ph = phases[i];
    const [pr] = await conn.execute(
      `INSERT INTO work_plan_phases (work_plan_id, \`order\`, title, subtitle) VALUES (?, ?, ?, ?)`,
      [planId, i, ph.title, ph.subtitle || ""]
    );
    const phaseId = pr.insertId;
    for (let j = 0; j < ph.tasks.length; j++) {
      const t = ph.tasks[j];
      await conn.execute(
        `INSERT INTO work_plan_tasks (work_plan_phase_id, \`order\`, name, assignee, estimated_days) VALUES (?, ?, ?, ?, ?)`,
        [phaseId, j, t.name, t.assignee || "", t.days || 0]
      );
    }
  }
}

await insertPlan(planId1, phases1);
console.log("✅ سكن خاص plan inserted");
await insertPlan(planId2, phases2);
console.log("✅ صناعي plan inserted");
await insertPlan(planId3, phases3);
console.log("✅ استثماري plan inserted");

await conn.end();
console.log("✅ All done!");
