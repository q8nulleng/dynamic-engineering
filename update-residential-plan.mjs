import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

// Find the residential plan
const [plans] = await conn.execute("SELECT id FROM work_plans WHERE project_type = 'سكن خاص' LIMIT 1");
if (plans.length === 0) {
  console.log("No residential plan found!");
  process.exit(1);
}
const planId = plans[0].id;
console.log("Plan ID:", planId);

// Delete existing phases and tasks for this plan
const [existingPhases] = await conn.execute("SELECT id FROM work_plan_phases WHERE work_plan_id = ?", [planId]);
for (const phase of existingPhases) {
  await conn.execute("DELETE FROM work_plan_tasks WHERE work_plan_phase_id = ?", [phase.id]);
}
await conn.execute("DELETE FROM work_plan_phases WHERE work_plan_id = ?", [planId]);

// Update plan name
await conn.execute("UPDATE work_plans SET name = ?, description = ? WHERE id = ?", [
  "خطة سكن خاص - بناء جديد (محدّثة)",
  "خطة عمل شاملة لمشاريع السكن الخاص - بناء جديد، تشمل جميع المراحل من تجهيز الملف حتى تسليم الكراسة والإشراف",
  planId,
]);

// Insert new phases
const phasesData = [
  { order: 1, title: "تجهيز الملف", subtitle: "جمع الوثائق والملفات" },
  { order: 2, title: "التصميم المعماري", subtitle: "الكروكي والاعتماد مع العميل" },
  { order: 3, title: "الواجهات والإنشائي", subtitle: "تصميم الواجهات وسيستم الأعمدة" },
  { order: 4, title: "مخطط البلدية", subtitle: "رسم المخطط النهائي للتقديم" },
  { order: 5, title: "التقديم للبلدية", subtitle: "إدخال المعاملة واستخراج الرخصة" },
  { order: 6, title: "المخططات التفصيلية", subtitle: "الإنشائي والصحي والكهرباء والكراسة" },
  { order: 7, title: "الإشراف", subtitle: "متابعة التنفيذ مع المقاول" },
];

const phaseIds = [];
for (const p of phasesData) {
  const [result] = await conn.execute(
    "INSERT INTO work_plan_phases (work_plan_id, `order`, title, subtitle) VALUES (?, ?, ?, ?)",
    [planId, p.order, p.title, p.subtitle]
  );
  phaseIds.push(result.insertId);
  console.log(`Phase ${p.order}: ${p.title} → ID ${result.insertId}`);
}

// Insert tasks for each phase
const tasksData = {
  // المرحلة 1: تجهيز الملف
  0: [
    { order: 1, name: "جمع البطاقات المدنية", assignee: "سكرتير (ثروت)", days: 3, trigger: "توقيع العقد" },
    { order: 2, name: "جمع سند الملكية (وثيقة/كتاب إسكان)", assignee: "سكرتير (ثروت)", days: 3, trigger: "توقيع العقد" },
    { order: 3, name: "جمع خريطة الموقع العام", assignee: "سكرتير (ثروت)", days: 3, trigger: "توقيع العقد" },
    { order: 4, name: "طلب فحص التربة", assignee: "سكرتير (ثروت)", days: 5, trigger: "توقيع العقد" },
    { order: 5, name: "طلب امكانية الكهرباء", assignee: "سكرتير (ثروت)", days: 5, trigger: "توقيع العقد" },
    { order: 6, name: "تعبئة نماذج البلدية", assignee: "سكرتير (ثروت)", days: 2, trigger: "بعد جمع المستندات" },
    { order: 7, name: "تحصيل الدفعة الأولى", assignee: "محاسب (محمد)", days: 1, trigger: "توقيع العقد" },
  ],
  // المرحلة 2: التصميم المعماري
  1: [
    { order: 1, name: "جلسة الطلبات (نموذج المساحة/الاتجاه/الطابع/الاحتياج)", assignee: "المعماري الرئيسي (م. مصطفى)", days: 1, trigger: "اكتمال تجهيز الملف" },
    { order: 2, name: "تصميم الكروكي المبدئي", assignee: "المعماري الرئيسي (م. مصطفى)", days: 5, trigger: "بعد جلسة الطلبات" },
    { order: 3, name: "جلسة مراجعة مع العميل", assignee: "المعماري الرئيسي (م. مصطفى)", days: 2, trigger: "بعد الكروكي" },
    { order: 4, name: "تعديلات وجلسات إضافية", assignee: "المعماري الرئيسي (م. مصطفى)", days: 5, trigger: "بعد المراجعة" },
    { order: 5, name: "اعتماد الكروكي النهائي من العميل", assignee: "المعماري الرئيسي (م. مصطفى)", days: 1, trigger: "بعد التعديلات" },
  ],
  // المرحلة 3: الواجهات والإنشائي
  2: [
    { order: 1, name: "تصميم الواجهات", assignee: "رسام الواجهات (عفيف) / م. ناهد", days: 7, trigger: "اعتماد الكروكي" },
    { order: 2, name: "تصميم سيستم الأعمدة", assignee: "المهندس الإنشائي (م. أمين)", days: 7, trigger: "اعتماد الكروكي" },
    { order: 3, name: "التنسيق بين الواجهات والأعمدة", assignee: "المعماري الرئيسي (م. مصطفى)", days: 3, trigger: "بعد الواجهات والأعمدة" },
    { order: 4, name: "اعتماد الواجهات والأعمدة من العميل", assignee: "المعماري الرئيسي (م. مصطفى)", days: 2, trigger: "بعد التنسيق" },
  ],
  // المرحلة 4: مخطط البلدية
  3: [
    { order: 1, name: "رسم مخطط البلدية مع البروزات", assignee: "الرسام (عرفان)", days: 5, trigger: "اعتماد الواجهات والأعمدة" },
    { order: 2, name: "مراجعة واعتماد المخطط من م. مصطفى", assignee: "المعماري الرئيسي (م. مصطفى)", days: 2, trigger: "بعد رسم المخطط" },
  ],
  // المرحلة 5: التقديم للبلدية
  4: [
    { order: 1, name: "إدخال المعاملة للبلدية", assignee: "سكرتير (ثروت)", days: 1, trigger: "موافقة م. مصطفى" },
    { order: 2, name: "متابعة ملاحظات البلدية", assignee: "سكرتير (ثروت)", days: 10, trigger: "بعد الإدخال" },
    { order: 3, name: "استخراج الرخصة", assignee: "سكرتير (ثروت)", days: 5, trigger: "بعد الاعتماد" },
    { order: 4, name: "تحصيل دفعة إصدار الرخصة", assignee: "محاسب (محمد)", days: 1, trigger: "صدور الرخصة" },
  ],
  // المرحلة 6: المخططات التفصيلية
  5: [
    { order: 1, name: "المخططات الإنشائية (أساسات/سقف/جسور)", assignee: "المهندس الإنشائي (م. أمين)", days: 10, trigger: "صدور الرخصة" },
    { order: 2, name: "مخططات الصحي", assignee: "الرسام (عرفان)", days: 5, trigger: "بعد الإنشائي" },
    { order: 3, name: "مخططات الكهرباء", assignee: "الرسام (عرفان)", days: 5, trigger: "بعد الصحي" },
    { order: 4, name: "تجهيز الكراسة النهائية", assignee: "المعمارية المساعدة (م. ناهد)", days: 3, trigger: "بعد الكهرباء" },
    { order: 5, name: "مراجعة واعتماد الكراسة من م. مصطفى", assignee: "المعماري الرئيسي (م. مصطفى)", days: 2, trigger: "بعد تجهيز الكراسة" },
    { order: 6, name: "تسليم الكراسة PDF للعميل", assignee: "سكرتير (ثروت)", days: 1, trigger: "اعتماد الكراسة" },
    { order: 7, name: "تحصيل دفعة تسليم الكراسة", assignee: "محاسب (محمد)", days: 1, trigger: "تسليم الكراسة" },
  ],
  // المرحلة 7: الإشراف
  6: [
    { order: 1, name: "إصدار تعهد الإشراف", assignee: "سكرتير (ثروت)", days: 2, trigger: "طلب المالك بعد اختيار مقاول" },
    { order: 2, name: "جمع وثائق المقاول (تصاريح/أمن وسلامة)", assignee: "سكرتير (ثروت)", days: 5, trigger: "بعد التعهد" },
    { order: 3, name: "الموافقة على استلام الحدود بنظام البلدية", assignee: "سكرتير (ثروت)", days: 2, trigger: "بعد جمع الوثائق" },
    { order: 4, name: "استلام الحفر (مقاسات وعمق)", assignee: "م. الإشراف (خالد)", days: 1, trigger: "بعد بدء المقاول" },
    { order: 5, name: "لا مانع صب طبقة النظافة", assignee: "م. الإشراف (خالد)", days: 1, trigger: "بعد استلام الحفر" },
    { order: 6, name: "استلام حديد + سليفات صحي وكهرباء", assignee: "م. الإشراف (خالد)", days: 2, trigger: "بعد الصب" },
    { order: 7, name: "استلام بايبات وصناديق التكييف", assignee: "م. الإشراف (خالد)", days: 2, trigger: "مراحل لاحقة" },
  ],
};

for (let i = 0; i < phaseIds.length; i++) {
  const phaseTasks = tasksData[i] || [];
  for (const task of phaseTasks) {
    await conn.execute(
      "INSERT INTO work_plan_tasks (work_plan_phase_id, `order`, name, assignee, estimated_days, description) VALUES (?, ?, ?, ?, ?, ?)",
      [phaseIds[i], task.order, task.name, task.assignee, task.days, task.trigger]
    );
  }
  console.log(`  → ${phaseTasks.length} tasks added to phase ${i + 1}`);
}

console.log("\n✅ Residential plan updated successfully!");
await conn.end();
