/**
 * توليد ملف Excel لإدخال بيانات المعاملات الحقيقية للمكتب
 * Run: node scripts/generate-template.mjs
 */
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, "..", "ديناميك-قالب-البيانات.xlsx");

const wb = new ExcelJS.Workbook();
wb.creator = "ديناميك للاستشارات الهندسية";
wb.created = new Date();

/* ── ألوان الثيم ── */
const NAVY   = "FF1B4965";
const GOLD   = "FFC4956A";
const WHITE  = "FFFFFFFF";
const LIGHT  = "FFF5F7FA";
const BORDER = "FFD0D7E2";
const GREEN  = "FFD4EDDA";
const YELLOW = "FFFFF3CD";
const BLUE   = "FFD1ECF1";

/* ── مساعد: تنسيق خلية رأس ── */
function headerCell(ws, row, col, text, bgColor = NAVY) {
  const cell = ws.getCell(row, col);
  cell.value = text;
  cell.font = { name: "Calibri", bold: true, color: { argb: WHITE }, size: 11 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true, readingOrder: "rtl" };
  cell.border = {
    top: { style: "thin", color: { argb: WHITE } },
    bottom: { style: "thin", color: { argb: WHITE } },
    left: { style: "thin", color: { argb: WHITE } },
    right: { style: "thin", color: { argb: WHITE } },
  };
}

/* ── مساعد: تنسيق خلية بيانات ── */
function dataStyle(ws, row, col, bgColor = WHITE, locked = false) {
  const cell = ws.getCell(row, col);
  cell.font = { name: "Calibri", size: 10 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
  cell.alignment = { horizontal: "right", vertical: "middle", readingOrder: "rtl" };
  cell.border = {
    top: { style: "hair", color: { argb: BORDER } },
    bottom: { style: "hair", color: { argb: BORDER } },
    left: { style: "hair", color: { argb: BORDER } },
    right: { style: "hair", color: { argb: BORDER } },
  };
  cell.protection = { locked };
  return cell;
}

/* ── مساعد: إضافة تعليق ── */
function addNote(ws, row, col, note) {
  const cell = ws.getCell(row, col);
  cell.note = { texts: [{ text: note }] };
}

/* ── مساعد: إنشاء صف عينة ملون ── */
function sampleRowStyle(ws, rowNum, colCount, color = YELLOW) {
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(rowNum, c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    cell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF555555" } };
    cell.alignment = { horizontal: "right", vertical: "middle", readingOrder: "rtl" };
    cell.border = {
      top: { style: "hair", color: { argb: BORDER } },
      bottom: { style: "hair", color: { argb: BORDER } },
      left: { style: "hair", color: { argb: BORDER } },
      right: { style: "hair", color: { argb: BORDER } },
    };
  }
}

/* ── مساعد: تعريف عمود dropdown ── */
function dropdown(ws, col, startRow, endRow, list) {
  for (let r = startRow; r <= endRow; r++) {
    ws.getCell(r, col).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${list.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "قيمة غير صحيحة",
      error: `الرجاء اختيار قيمة من القائمة: ${list.join(" / ")}`,
    };
  }
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 1: تعليمات الاستخدام
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("📋 تعليمات الاستخدام", { rightToLeft: true });
  ws.views = [{ rightToLeft: true }];

  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 70;

  // عنوان رئيسي
  ws.mergeCells("B1:B1");
  const title = ws.getCell("B1");
  title.value = "ديناميك للاستشارات الهندسية — قالب إدخال البيانات";
  title.font = { name: "Calibri", bold: true, size: 16, color: { argb: WHITE } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  title.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 40;

  const instructions = [
    ["", ""],
    ["📌", "الهدف من هذا الملف"],
    ["", "يُستخدم هذا الملف لإدخال بيانات المعاملات الحقيقية للمكتب بدلاً من البيانات التجريبية الموجودة في النظام."],
    ["", ""],
    ["📂", "الأوراق الموجودة في هذا الملف:"],
    ["", "① العملاء — بيانات أصحاب المعاملات (اسم، هاتف، رقم مدني، بيانات الأرض...)"],
    ["", "② المشاريع — المشاريع الهندسية النشطة والمكتملة"],
    ["", "③ مراحل المشاريع — مراحل كل مشروع (ربط بالمشروع عبر رقمه)"],
    ["", "④ مهام المراحل — المهام داخل كل مرحلة (ربط بالمرحلة عبر رقمها)"],
    ["", "⑤ عروض الأسعار — جميع العروض المقدمة للعملاء"],
    ["", "⑥ العقود — العقود المبرمة مع العملاء"],
    ["", "⑦ الفواتير — الفواتير الصادرة"],
    ["", "⑧ بنود الفواتير — تفاصيل كل فاتورة (ربط بالفاتورة)"],
    ["", ""],
    ["⚠️", "تعليمات مهمة:"],
    ["", "• الخلايا الصفراء = مثال توضيحي، احذفها قبل الرفع للنظام"],
    ["", "• الخلايا الرمادية = حقل اختياري (يمكن تركه فارغاً)"],
    ["", "• الخلايا البيضاء = حقل إلزامي"],
    ["", "• الأعمدة ذات السهم (▼) = قائمة منسدلة، اختر منها فقط"],
    ["", "• لا تغيّر ترتيب الأعمدة أو أسماء الأوراق"],
    ["", "• التاريخ بصيغة: YYYY-MM-DD (مثال: 2026-01-15)"],
    ["", "• المبالغ بالدينار الكويتي بدون رموز عملة"],
    ["", ""],
    ["🔗", "ترتيب الإدخال الصحيح:"],
    ["", "1. أدخل العملاء أولاً"],
    ["", "2. ثم المشاريع (أضف رقم العميل من ورقة العملاء)"],
    ["", "3. ثم مراحل المشاريع (أضف رقم المشروع)"],
    ["", "4. ثم مهام كل مرحلة (أضف رقم المرحلة)"],
    ["", "5. ثم عروض الأسعار والعقود والفواتير"],
  ];

  instructions.forEach(([icon, text], i) => {
    const r = i + 2;
    ws.getRow(r).height = 20;
    ws.getCell(r, 1).value = icon;
    ws.getCell(r, 1).font = { size: 13 };
    ws.getCell(r, 1).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(r, 2).value = text;
    ws.getCell(r, 2).font = {
      name: "Calibri",
      size: 11,
      bold: ["📌", "📂", "⚠️", "🔗"].includes(icon),
      color: { argb: ["📌", "📂", "⚠️", "🔗"].includes(icon) ? NAVY : "FF333333" },
    };
    ws.getCell(r, 2).alignment = { horizontal: "right", vertical: "middle", readingOrder: "rtl", wrapText: true };
    if (["📌", "📂", "⚠️", "🔗"].includes(icon)) {
      ws.getCell(r, 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 2: العملاء
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("① العملاء", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم العميل\n(تلقائي أو يدوي)", key: "id",            width: 18, note: "مثال: C001 — إذا تركته فارغاً يولّده النظام تلقائياً" },
    { header: "الاسم الكامل *",               key: "name",          width: 25, note: "اسم صاحب المعاملة كما في البطاقة المدنية" },
    { header: "الهاتف *",                     key: "phone",         width: 16, note: "رقم الهاتف الأساسي" },
    { header: "هاتف بديل",                    key: "phone2",        width: 16, note: "رقم هاتف إضافي (اختياري)" },
    { header: "الرقم المدني",                 key: "civilId",       width: 16, note: "12 رقم — مثال: 123456789012" },
    { header: "البريد الإلكتروني",            key: "email",         width: 28, note: "البريد الإلكتروني (اختياري)" },
    { header: "نوع العميل *\n(▼)",            key: "type",          width: 16, note: "فردي = individual\nشركة = company\nورثة = heirs" },
    { header: "المحافظة / المنطقة",           key: "area",          width: 18, note: "مثال: الجهراء، حولي، الأحمدي..." },
    { header: "رقم القطعة",                   key: "block",         width: 14, note: "رقم القطعة (بلوك)" },
    { header: "رقم القسيمة",                  key: "plot",          width: 14, note: "رقم القسيمة" },
    { header: "مساحة القسيمة (م²)",           key: "parcelArea",    width: 18, note: "المساحة بالمتر المربع — أرقام فقط" },
    { header: "شكل القسيمة",                  key: "parcelShape",   width: 14, note: "مثال: زاوية، داخلية، قاطعة" },
    { header: "واجهة القسيمة",                key: "parcelFacing",  width: 14, note: "مثال: شمال، جنوب، شرق، غرب" },
    { header: "رقم وثيقة الملكية",            key: "ownershipDoc",  width: 22, note: "رقم الوثيقة كما في السجل" },
    { header: "تاريخ الوثيقة",                key: "ownershipDate", width: 16, note: "صيغة: YYYY-MM-DD" },
    { header: "اسم الزوجة",                   key: "spouseName",    width: 22, note: "اختياري — للمعاملات التي تشترط ذلك" },
    { header: "رقم مدني الزوجة",             key: "spouseCivilId", width: 18, note: "اختياري — 12 رقم" },
    { header: "حالة العميل\n(▼)",             key: "status",        width: 16, note: "active = نشط\ncompleted = مكتمل\npending = معلق" },
    { header: "التقييم\n(1-5)",               key: "rating",        width: 12, note: "1 = ضعيف ... 5 = ممتاز" },
    { header: "نوع المشروع المتوقع\n(▼)",     key: "projectType",   width: 22, note: "سكن خاص / تجاري / استثماري / صناعي" },
    { header: "نوع الخدمة المتوقعة\n(▼)",     key: "serviceType",   width: 22, note: "بناء جديد / تعديل / إضافة / تعديل وإضافة / هدم" },
    { header: "تاريخ الإضافة",                key: "createdAt",     width: 16, note: "صيغة: YYYY-MM-DD — إذا فارغ يُستخدم اليوم" },
    { header: "ملاحظات",                      key: "notes",         width: 35, note: "أي ملاحظات إضافية عن العميل" },
  ];

  // العنوان الرئيسي
  ws.mergeCells(1, 1, 1, cols.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "① العملاء — بيانات أصحاب المعاملات";
  titleCell.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  // رؤوس الأعمدة
  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  // صف المثال
  const example = [
    "C001", "فهد محمد العتيبي", "97012345", "97054321", "281012345678",
    "fahad@email.com", "individual", "الجهراء", "12", "450",
    "400", "زاوية", "شمال", "123456", "2020-05-10",
    "نورة فهد", "281087654321", "active", "5",
    "سكن خاص", "بناء جديد", "2026-01-15", "عميل VIP — مشروع كبير",
  ];
  example.forEach((val, i) => {
    ws.getCell(3, i + 1).value = val;
  });
  sampleRowStyle(ws, 3, cols.length);
  ws.getRow(3).height = 20;

  // صفوف الإدخال (20 صف)
  for (let r = 4; r <= 50; r++) {
    cols.forEach((_, i) => {
      const bg = [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22].includes(i) ? "FFF9F9F9" : WHITE;
      dataStyle(ws, r, i + 1, bg);
    });
    ws.getRow(r).height = 20;
  }

  // القوائم المنسدلة
  dropdown(ws, 7,  4, 50, ["individual", "company", "heirs"]);
  dropdown(ws, 18, 4, 50, ["active", "completed", "pending"]);
  dropdown(ws, 20, 4, 50, ["سكن خاص", "تجاري", "استثماري", "صناعي"]);
  dropdown(ws, 21, 4, 50, ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"]);

  // تجميد الصفوف
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 3: المشاريع
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("② المشاريع", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم المشروع *\n(مثال: S00001)", key: "id",           width: 20, note: "رمز فريد للمشروع — مثال: S00001، S00048\nيجب أن يطابق الرقم المستخدم في ورقة المراحل" },
    { header: "اسم المشروع *",                  key: "name",         width: 35, note: "وصف المشروع — مثال: بناء سكن خاص — الجهراء ق12" },
    { header: "رقم العميل\n(من ورقة العملاء)",  key: "clientId",     width: 22, note: "مثال: C001 — يجب أن يتطابق مع رقم في ورقة العملاء" },
    { header: "اسم العميل *",                   key: "client",       width: 25, note: "اسم العميل — يظهر في الواجهة" },
    { header: "نوع المشروع *\n(▼)",              key: "type",         width: 18, note: "سكن خاص / تجاري / استثماري / صناعي" },
    { header: "نوع الخدمة *\n(▼)",               key: "serviceType",  width: 22, note: "بناء جديد / تعديل / إضافة / تعديل وإضافة / هدم" },
    { header: "المنطقة",                         key: "area",         width: 18, note: "مثال: الجهراء ق12 — العلي ق4" },
    { header: "رقم عرض السعر",                  key: "quotation",    width: 20, note: "مثال: S00048 — يربط المشروع بعرض السعر" },
    { header: "نسبة الإنجاز %\n(0-100)",         key: "progress",     width: 16, note: "نسبة الإنجاز الكلية — أرقام فقط بين 0 و 100" },
    { header: "المرحلة الحالية\n(رقم البداية)",  key: "currentPhase", width: 20, note: "رقم المرحلة الحالية بدءاً من 0\n0 = المرحلة الأولى، 1 = الثانية..." },
    { header: "تاريخ الإنشاء",                   key: "createdAt",    width: 16, note: "صيغة: YYYY-MM-DD" },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "② المشاريع — المشاريع الهندسية";
  titleCell.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  const example = [
    "S00048", "بناء سكن خاص — الجهراء ق12", "C001", "فهد العتيبي",
    "سكن خاص", "بناء جديد", "الجهراء ق12", "S00048", "35", "1", "2026-01-15",
  ];
  example.forEach((val, i) => { ws.getCell(3, i + 1).value = val; });
  sampleRowStyle(ws, 3, cols.length);
  ws.getRow(3).height = 20;

  for (let r = 4; r <= 30; r++) {
    cols.forEach((_, i) => { dataStyle(ws, r, i + 1); });
    ws.getRow(r).height = 20;
  }

  dropdown(ws, 5, 4, 30, ["سكن خاص", "تجاري", "استثماري", "صناعي"]);
  dropdown(ws, 6, 4, 30, ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"]);
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 4: مراحل المشاريع
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("③ مراحل المشاريع", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم المشروع *\n(من ورقة المشاريع)", key: "projectId", width: 22, note: "مثال: S00048 — يجب أن يتطابق مع رقم في ورقة المشاريع" },
    { header: "ترتيب المرحلة *\n(يبدأ من 0)",       key: "order",     width: 20, note: "0 = المرحلة الأولى، 1 = الثانية، 2 = الثالثة..." },
    { header: "عنوان المرحلة *",                    key: "title",     width: 30, note: "مثال: مرحلة التصميم المعماري" },
    { header: "وصف إضافي",                          key: "subtitle",  width: 40, note: "وصف فرعي اختياري — مثال: الرسومات والمخططات الأولية" },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "③ مراحل المشاريع — ربط كل مرحلة بمشروعها";
  titleCell.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  // أمثلة توضيحية لمشروع واحد
  const examples = [
    ["S00048", "0", "التصميم المعماري", "الكروكي والمخططات الأولية"],
    ["S00048", "1", "التصاميم الهندسية", "الإنشائي والكهربائي والصحي"],
    ["S00048", "2", "استخراج الترخيص", "نماذج البلدية وتقديم الملف"],
    ["S00048", "3", "الإشراف على التنفيذ", "متابعة مراحل البناء الميدانية"],
    ["S00048", "4", "شهادة الإنجاز", "الكشف النهائي وإصدار الشهادة"],
  ];
  examples.forEach(([pid, ord, title, sub], i) => {
    const r = i + 3;
    ws.getCell(r, 1).value = pid;
    ws.getCell(r, 2).value = parseInt(ord);
    ws.getCell(r, 3).value = title;
    ws.getCell(r, 4).value = sub;
    sampleRowStyle(ws, r, cols.length);
    ws.getRow(r).height = 20;
  });

  for (let r = 8; r <= 100; r++) {
    cols.forEach((_, i) => { dataStyle(ws, r, i + 1); });
    ws.getRow(r).height = 20;
  }

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 5: مهام المراحل
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("④ مهام المراحل", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم المشروع\n(للمرجعية)",        key: "projectId",  width: 18, note: "للمرجعية فقط — لا يُرفع للنظام مباشرة" },
    { header: "رقم المرحلة *\n(من النظام)",      key: "phaseId",    width: 18, note: "رقم المرحلة من قاعدة البيانات — يُعطى بعد رفع ورقة المراحل" },
    { header: "ترتيب المهمة *\n(يبدأ من 0)",     key: "order",      width: 18, note: "0 = الأولى، 1 = الثانية..." },
    { header: "اسم المهمة *",                    key: "name",       width: 35, note: "مثال: تصميم الكروكي المعماري" },
    { header: "حالة المهمة *\n(▼)",              key: "status",     width: 18, note: "pending = لم تبدأ\nin_progress = قيد التنفيذ\ndone = مكتملة\nblocked = معلقة" },
    { header: "المسؤول",                         key: "assignee",   width: 20, note: "اسم المهندس المسؤول عن المهمة" },
    { header: "الأولوية\n(▼ 0-3)",               key: "priority",   width: 14, note: "0 = عادي\n1 = متوسط\n2 = عالي\n3 = عاجل" },
    { header: "الموعد النهائي",                  key: "deadline",   width: 16, note: "صيغة: YYYY-MM-DD" },
    { header: "وصف المهمة",                      key: "description",width: 40, note: "وصف تفصيلي للمهمة (اختياري)" },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "④ مهام المراحل — تفاصيل كل مهمة في كل مرحلة";
  titleCell.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  // ملاحظة مهمة
  ws.mergeCells(3, 1, 3, cols.length);
  const noteCell = ws.getCell(3, 1);
  noteCell.value = "⚠️  ملاحظة: رقم المرحلة (العمود الثاني) يُعطى بعد رفع ورقة المراحل للنظام. اترك هذا العمود فارغاً أو أضف ملاحظة مؤقتة.";
  noteCell.font = { name: "Calibri", size: 10, color: { argb: "FF856404" } };
  noteCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
  noteCell.alignment = { horizontal: "right", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(3).height = 22;

  const examples = [
    ["S00048", "(يُحدد لاحقاً)", "0", "تصميم الكروكي المعماري", "pending", "م. مارك", "2", "2026-02-01", "رسم الكروكي الأولي وعرضه على العميل"],
    ["S00048", "(يُحدد لاحقاً)", "1", "تجميع مستندات العميل", "done", "محمد ثروت", "1", "2026-01-20", "جمع البطاقات المدنية ووثيقة الملكية"],
    ["S00048", "(يُحدد لاحقاً)", "2", "تعديل الكروكي بعد ملاحظات العميل", "in_progress", "م. مارك", "2", "2026-02-10", ""],
  ];
  examples.forEach((row, i) => {
    const r = i + 4;
    row.forEach((val, c) => {
      ws.getCell(r, c + 1).value = c === 2 || c === 6 ? parseInt(val) || val : val;
    });
    sampleRowStyle(ws, r, cols.length);
    ws.getRow(r).height = 20;
  });

  for (let r = 7; r <= 200; r++) {
    cols.forEach((_, i) => { dataStyle(ws, r, i + 1); });
    ws.getRow(r).height = 20;
  }

  dropdown(ws, 5, 7, 200, ["pending", "in_progress", "done", "blocked"]);
  dropdown(ws, 7, 7, 200, ["0", "1", "2", "3"]);
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 6: عروض الأسعار
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("⑤ عروض الأسعار", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم العرض *",                    key: "id",           width: 18, note: "مثال: S00048 — تلقائي أو يدوي" },
    { header: "رقم العميل",                     key: "clientId",     width: 16, note: "من ورقة العملاء (اختياري)" },
    { header: "اسم العميل *",                   key: "client",       width: 25, note: "اسم صاحب العرض" },
    { header: "الرقم المدني",                   key: "civilId",      width: 16, note: "رقم مدني العميل" },
    { header: "نوع المشروع *\n(▼)",             key: "type",         width: 18, note: "سكن خاص / تجاري / استثماري / صناعي" },
    { header: "نوع الخدمة *\n(▼)",              key: "service",      width: 22, note: "بناء جديد / تعديل / إضافة / تعديل وإضافة / هدم" },
    { header: "الباقة",                         key: "package",      width: 20, note: "مثال: الباقة الفضية / الباقة الذهبية" },
    { header: "المبلغ (د.ك)",                   key: "amount",       width: 16, note: "المبلغ الإجمالي للعرض بالدينار الكويتي" },
    { header: "الحالة *\n(▼)",                  key: "status",       width: 16, note: "مسودة / مرسل / مقبول / مرفوض / عقد" },
    { header: "التاريخ *",                      key: "date",         width: 14, note: "تاريخ العرض — صيغة: YYYY-MM-DD" },
    { header: "المحافظة",                       key: "governorate",  width: 16, note: "مثال: الجهراء، حولي، الفروانية" },
    { header: "المنطقة",                        key: "area",         width: 18, note: "اسم المنطقة السكنية" },
    { header: "مساحة الأرض",                   key: "landArea",     width: 14, note: "مثال: 400 م²" },
    { header: "القطعة",                         key: "block",        width: 12, note: "رقم القطعة" },
    { header: "الحي",                           key: "suburb",       width: 16, note: "اسم الحي أو المنطقة الفرعية" },
    { header: "القسيمة",                        key: "plot",         width: 12, note: "رقم القسيمة" },
    { header: "رقم المخطط",                     key: "surveyPlan",   width: 18, note: "رقم مخطط المساحة" },
    { header: "رقم المشروع المرتبط",            key: "projectId",    width: 20, note: "إذا تحوّل لمشروع — أضف رقم المشروع" },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const tc = ws.getCell(1, 1);
  tc.value = "⑤ عروض الأسعار";
  tc.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  tc.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  const example = [
    "S00048","C001","فهد العتيبي","281012345678","سكن خاص","بناء جديد",
    "الباقة الذهبية","1850","مقبول","2026-01-10",
    "الجهراء","الجهراء ق12","400 م²","12","","450","SUP-2026-001","S00048",
  ];
  example.forEach((val, i) => { ws.getCell(3, i + 1).value = val; });
  sampleRowStyle(ws, 3, cols.length);
  ws.getRow(3).height = 20;

  for (let r = 4; r <= 50; r++) {
    cols.forEach((_, i) => { dataStyle(ws, r, i + 1); });
    ws.getRow(r).height = 20;
  }

  dropdown(ws, 5, 4, 50, ["سكن خاص", "تجاري", "استثماري", "صناعي"]);
  dropdown(ws, 6, 4, 50, ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"]);
  dropdown(ws, 9, 4, 50, ["مسودة", "مرسل", "مقبول", "مرفوض", "عقد"]);
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 7: العقود
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("⑥ العقود", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم العقد *",           key: "id",          width: 22, note: "مثال: CON-2026-001 — تلقائي أو يدوي" },
    { header: "رقم عرض السعر",        key: "quotationId",  width: 18, note: "إذا نشأ من عرض سعر — من ورقة عروض الأسعار" },
    { header: "رقم المشروع",          key: "projectId",    width: 18, note: "من ورقة المشاريع" },
    { header: "رقم العميل",           key: "clientId",     width: 16, note: "من ورقة العملاء" },
    { header: "اسم العميل *",         key: "client",       width: 25, note: "اسم صاحب العقد" },
    { header: "الرقم المدني",         key: "civilId",      width: 16, note: "رقم مدني صاحب العقد" },
    { header: "قالب العقد\n(▼)",      key: "template",     width: 22, note: "نوع القالب المستخدم" },
    { header: "نوع المشروع *\n(▼)",    key: "type",         width: 18, note: "سكن خاص / تجاري / استثماري / صناعي" },
    { header: "نوع الخدمة *\n(▼)",     key: "service",      width: 22, note: "بناء جديد / تعديل / إضافة / تعديل وإضافة / هدم" },
    { header: "الباقة",               key: "package",      width: 20, note: "اسم الباقة" },
    { header: "قيمة العقد (د.ك) *",   key: "amount",       width: 18, note: "المبلغ الإجمالي للعقد بالدينار الكويتي" },
    { header: "حالة العقد *\n(▼)",     key: "status",       width: 18, note: "مسودة / مرسل للتوقيع / موقع / نشط / مكتمل / ملغي" },
    { header: "تاريخ العقد *",        key: "date",         width: 14, note: "صيغة: YYYY-MM-DD" },
    { header: "المنطقة",              key: "area",         width: 18, note: "منطقة المشروع" },
    { header: "القطعة",               key: "block",        width: 12, note: "رقم القطعة" },
    { header: "القسيمة",              key: "plot",         width: 12, note: "رقم القسيمة" },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const tc = ws.getCell(1, 1);
  tc.value = "⑥ العقود الهندسية";
  tc.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  tc.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  const example = [
    "CON-2026-001","S00048","S00048","C001","فهد العتيبي","281012345678",
    "عقد تصميم وإشراف","سكن خاص","بناء جديد","الباقة الذهبية",
    "1850","نشط","2026-01-20","الجهراء ق12","12","450",
  ];
  example.forEach((val, i) => { ws.getCell(3, i + 1).value = val; });
  sampleRowStyle(ws, 3, cols.length);
  ws.getRow(3).height = 20;

  for (let r = 4; r <= 30; r++) {
    cols.forEach((_, i) => { dataStyle(ws, r, i + 1); });
    ws.getRow(r).height = 20;
  }

  dropdown(ws, 7,  4, 30, ["عقد تصميم وإشراف", "عقد تصميم فقط", "عقد إشراف فقط", "عقد شامل"]);
  dropdown(ws, 8,  4, 30, ["سكن خاص", "تجاري", "استثماري", "صناعي"]);
  dropdown(ws, 9,  4, 30, ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"]);
  dropdown(ws, 12, 4, 30, ["مسودة", "مرسل للتوقيع", "موقع", "نشط", "مكتمل", "ملغي"]);
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 8: الفواتير
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("⑦ الفواتير", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم الفاتورة *",              key: "id",       width: 22, note: "مثال: INV/2026/00001 — تلقائي أو يدوي" },
    { header: "رقم المشروع",                key: "projectId", width: 18, note: "من ورقة المشاريع" },
    { header: "رقم العميل",                 key: "clientId",  width: 16, note: "من ورقة العملاء" },
    { header: "اسم العميل *",               key: "client",    width: 25, note: "اسم العميل على الفاتورة" },
    { header: "اسم المشروع",                key: "project",   width: 30, note: "اسم المشروع المرتبط" },
    { header: "حالة الفاتورة *\n(▼)",        key: "status",    width: 18, note: "مسودة / مرسلة / مدفوعة / غير مدفوعة / متأخرة" },
    { header: "تاريخ الفاتورة *",           key: "date",      width: 16, note: "صيغة: YYYY-MM-DD" },
    { header: "تاريخ الاستحقاق",            key: "dueDate",   width: 16, note: "صيغة: YYYY-MM-DD" },
    { header: "المجموع قبل الضريبة (د.ك)", key: "subtotal",  width: 22, note: "المجموع قبل إضافة الضريبة" },
    { header: "نسبة الضريبة %",             key: "taxRate",   width: 14, note: "مثال: 15 (يعني 15%)" },
    { header: "مبلغ الضريبة (د.ك)",        key: "taxAmount",  width: 18, note: "= المجموع × نسبة الضريبة ÷ 100" },
    { header: "الإجمالي الكلي (د.ك)",      key: "total",     width: 20, note: "= المجموع + الضريبة" },
    { header: "ملاحظات",                    key: "notes",     width: 35, note: "أي ملاحظات على الفاتورة" },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const tc = ws.getCell(1, 1);
  tc.value = "⑦ الفواتير";
  tc.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  tc.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  const example = [
    "INV/2026/00001","S00048","C001","فهد العتيبي","بناء سكن خاص — الجهراء",
    "مدفوعة","2026-02-01","2026-03-01","500","15","75","575","دفعة أولى — مرحلة التصميم",
  ];
  example.forEach((val, i) => { ws.getCell(3, i + 1).value = val; });
  sampleRowStyle(ws, 3, cols.length);
  ws.getRow(3).height = 20;

  for (let r = 4; r <= 50; r++) {
    cols.forEach((_, i) => { dataStyle(ws, r, i + 1); });
    ws.getRow(r).height = 20;
  }

  dropdown(ws, 6, 4, 50, ["مسودة", "مرسلة", "مدفوعة", "غير مدفوعة", "متأخرة"]);
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   ورقة 9: بنود الفواتير
   ══════════════════════════════════════════════════════════════════ */
{
  const ws = wb.addWorksheet("⑧ بنود الفواتير", { rightToLeft: true });
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const cols = [
    { header: "رقم الفاتورة *\n(من ورقة الفواتير)", key: "invoiceId",   width: 26, note: "مثال: INV/2026/00001 — يجب أن يتطابق مع رقم في ورقة الفواتير" },
    { header: "المنتج / الخدمة *",                  key: "product",     width: 30, note: "مثال: تصميم معماري — إشراف على التنفيذ" },
    { header: "الوصف التفصيلي",                     key: "description", width: 40, note: "وصف مفصّل للخدمة (اختياري)" },
    { header: "الكمية *",                            key: "quantity",    width: 12, note: "عدد الوحدات — مثال: 1" },
    { header: "سعر الوحدة (د.ك) *",                key: "price",       width: 20, note: "سعر الوحدة الواحدة بالدينار" },
    { header: "نسبة الضريبة %",                     key: "taxPercent",  width: 16, note: "مثال: 15 (يعني 15%)" },
    { header: "الإجمالي (د.ك)",                    key: "total",       width: 16, note: "= الكمية × السعر × (1 + الضريبة÷100)" },
  ];

  ws.mergeCells(1, 1, 1, cols.length);
  const tc = ws.getCell(1, 1);
  tc.value = "⑧ بنود الفواتير — تفاصيل كل سطر في الفاتورة";
  tc.font = { name: "Calibri", bold: true, size: 13, color: { argb: WHITE } };
  tc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  tc.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
  ws.getRow(1).height = 32;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
    headerCell(ws, 2, i + 1, col.header, GOLD);
    addNote(ws, 2, i + 1, col.note);
  });
  ws.getRow(2).height = 40;

  const examples = [
    ["INV/2026/00001", "تصميم معماري", "مخططات الكروكي والتصميم النهائي", "1", "350", "15", "402.5"],
    ["INV/2026/00001", "إشراف هندسي", "متابعة مراحل الإنشاء الأولى", "1", "150", "15", "172.5"],
  ];
  examples.forEach((row, i) => {
    const r = i + 3;
    row.forEach((val, c) => {
      ws.getCell(r, c + 1).value = [3, 4, 5, 6].includes(c) ? parseFloat(val) : val;
    });
    sampleRowStyle(ws, r, cols.length);
    ws.getRow(r).height = 20;
  });

  for (let r = 5; r <= 100; r++) {
    cols.forEach((_, i) => { dataStyle(ws, r, i + 1); });
    ws.getRow(r).height = 20;
  }

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
}

/* ══════════════════════════════════════════════════════════════════
   كتابة الملف
   ══════════════════════════════════════════════════════════════════ */
await wb.xlsx.writeFile(OUTPUT);
console.log(`\n✅ تم إنشاء الملف بنجاح:\n   ${OUTPUT}\n`);
