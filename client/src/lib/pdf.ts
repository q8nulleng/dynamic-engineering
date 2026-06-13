import type { Contract, Invoice } from "./api";

const NAVY = "#1B4965";
const GOLD = "#C4956A";

// Logo URL for deployed site
const LOGO_URL = "/manus-storage/logo-dynamic_d0ccb9d7.jpeg";

function formatAmount(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return n.toLocaleString("ar-KW", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function row(label: string, value?: string | null) {
  return `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px dotted #eee;">
    <span style="color:#777;">${label}</span>
    <span style="font-weight:600;color:#111;">${value || "—"}</span>
  </div>`;
}

// ── Official Office Header — matches original DOCX format ────────────────
function officialHeader(): string {
  return `
<table style="width:100%;border-collapse:collapse;margin-bottom:0;">
  <tr>
    <td style="width:25%;vertical-align:middle;text-align:right;">
      <div style="font-size:10px;color:#333;line-height:1.6;">
        إستشاريون (تصميم وإشراف)<br>
        معماري - إنشائي - مباني وإنشاءات<br>
        تصميم - إدارة مشاريع
      </div>
    </td>
    <td style="width:50%;text-align:center;vertical-align:middle;">
      <img src="${LOGO_URL}" style="width:100px;height:auto;display:block;margin:0 auto 6px;" alt="Dynamic Logo" />
      <div style="font-size:18px;font-weight:900;color:#000;font-family:'Noto Kufi Arabic','Simplified Arabic',Arial,sans-serif;letter-spacing:1px;">
        ديـناميـك للإستشارات الهندسية
      </div>
      <div style="font-size:11px;font-weight:700;color:#444;letter-spacing:3px;margin-top:2px;font-family:'Space Grotesk','Arial',sans-serif;">
        DYNAMIC DESIGN
      </div>
    </td>
    <td style="width:25%;vertical-align:middle;text-align:left;">
      <div style="font-size:10px;color:#333;line-height:1.6;font-family:'Space Grotesk','Arial',sans-serif;">
        Consultants (Design & Supervision)<br>
        Architectural - Structural<br>
        Buildings & Construction
      </div>
    </td>
  </tr>
</table>
<hr style="border:none;border-top:2px solid #000;margin:8px 0 4px;" />
<div style="text-align:center;font-size:9px;color:#555;padding:2px 0 12px;">
  إستشاريون (تصميم وإشراف) - معماري - إنشائي - مباني وإنشاءات - تصميم - إدارة مشاريع
</div>`;
}

// ── Official Office Footer — matches original DOCX format ────────────────
function officialFooter(): string {
  return `
<div style="position:fixed;bottom:0;left:0;right:0;padding:6px 20px;text-align:center;font-size:9px;border-top:2px solid #000;background:#fff;">
  <div style="margin-bottom:2px;color:#000;font-weight:600;">
    ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
  </div>
  <div style="font-weight:bold;color:#000;margin-bottom:1px;">
    مدينة الكويت – قبلة – شارع الصالحية – مبنى رقم (18) – الدور الأول – مكتب رقم (1) – موبايل: 22091228 – 50855599
  </div>
  <div style="font-family:'Space Grotesk','Arial',sans-serif;color:#333;margin-bottom:1px;">
    Kuwait city – Qiblah – Salihia.st – Building no:18 – First floor – Office no:1 – Mobile: 22091228 – 50855599
  </div>
  <div style="font-family:'Space Grotesk','Arial',sans-serif;color:#333;">
    Email: info@DynamicSaud.com
  </div>
</div>`;
}

// ── Full A4 page wrapper ──────────────────────────────────────────────────
export function buildPage(body: string, title: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<base href="${origin}/">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700;900&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Noto Naskh Arabic','Noto Kufi Arabic','Simplified Arabic',Arial,sans-serif;direction:rtl;background:#fff;color:#111;font-size:13px;line-height:1.9;}
  .page{padding:30px 35px 100px;max-width:794px;margin:0 auto;}
  table{border-collapse:collapse;}
  img{max-width:100%;}
  .article-heading{
    font-size:14px;font-weight:700;color:#000;
    border-bottom:2px solid #000;padding-bottom:4px;margin:18px 0 10px;
  }
  .article-content{
    font-size:12px;line-height:2.1;color:#222;padding-right:10px;
    white-space:pre-line;
  }
  .article-item{
    font-size:12px;line-height:2.1;color:#222;padding-right:10px;
    position:relative;
  }
  .bold-line{font-weight:700;color:#000;}
  .print-btn{
    position:fixed;bottom:20px;left:20px;background:${NAVY};color:#fff;
    border:none;padding:10px 24px;border-radius:8px;font-size:15px;
    cursor:pointer;font-family:'Noto Kufi Arabic',Arial,sans-serif;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:999;
  }
  @page{size:A4;margin:10mm 8mm 10mm 8mm;}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    img{-webkit-print-color-adjust:exact;print-color-adjust:exact;max-width:100%;}
    .no-print{display:none!important;}
    .page{padding:10px 15px 80px;}
  }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
<div class="page">${body}</div>
<script>
  if(document.fonts){document.fonts.ready.then(()=>setTimeout(()=>window.print(),600));}
  else{window.addEventListener('load',()=>setTimeout(()=>window.print(),600));}
</script>
</body>
</html>`;
}

// ── Helper: format multi-line text content into HTML ───────────────────────
function formatTextContent(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  let html = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Detect sub-headings like "المرحلة الأولى" or "آلية الدفع:"
    if (/^(المرحلة|آلية الدفع|مدة الإشراف|تمديد الإشراف)/.test(trimmed)) {
      html += `<div class="bold-line" style="margin-top:8px;font-size:12px;">${trimmed}</div>`;
    } else {
      html += `<div class="article-item">${trimmed}</div>`;
    }
  }
  return html;
}

// ── Helper: render a single article/section ────────────────────────────────
function renderSection(heading: string, content: string): string {
  if (!content || !content.trim()) return "";
  // The content already contains the heading (e.g., "المادة (1): نطاق الخدمات ...")
  // We need to extract the heading from the first line if it starts with "المادة"
  const lines = content.split("\n");
  const firstLine = lines[0]?.trim() || "";
  
  let sectionHeading = heading;
  let sectionBody = content;
  
  // If the content starts with "المادة (X):", use it as the heading
  if (/^المادة\s*\(\d+\)/.test(firstLine)) {
    sectionHeading = firstLine;
    sectionBody = lines.slice(1).join("\n");
  }
  
  return `
<div style="margin-bottom:16px;">
  <div class="article-heading">${sectionHeading}</div>
  ${formatTextContent(sectionBody)}
</div>`;
}

// ── Parse termsText JSON and render structured sections ─────────────────────
interface TemplateFields {
  content?: string;           // Full HTML content (new templates)
  scopeOfWork?: string;
  duration?: string;
  paymentSchedule?: string;
  party1Obligations?: string;
  party2Obligations?: string;
  notes?: string;
  terms?: string;
}

function parseAndRenderTerms(termsText: string, contractAmount: number): string {
  if (!termsText) return "";
  
  let fields: TemplateFields;
  try {
    fields = JSON.parse(termsText);
  } catch {
    // If not JSON, render as plain text (legacy format)
    return `
<div style="margin-bottom:16px;">
  <div class="article-heading">المادة (1): نطاق الخدمات والشروط</div>
  ${formatTextContent(termsText)}
</div>`;
  }

  // ── NEW: If template has full HTML content, render it directly ──
  if (fields.content && fields.content.trim().length > 0) {
    return `<div style="font-size:12px;line-height:2;direction:rtl;" class="template-content">${fields.content}</div>`;
  }
  
  let html = "";
  
  // المادة (1): نطاق الخدمات — from scopeOfWork
  if (fields.scopeOfWork) {
    html += renderSection("المادة (1): نطاق الخدمات", fields.scopeOfWork);
  }
  
  // المادة (2): مراحل التصميم — from duration
  if (fields.duration) {
    html += renderSection("المادة (2): مراحل التصميم", fields.duration);
  }
  
  // المادة (3): الأتعاب المالية — from paymentSchedule
  if (fields.paymentSchedule) {
    html += renderSection("المادة (3): الأتعاب المالية", fields.paymentSchedule);
  }
  
  // المادة (4): التزامات المالك — from party1Obligations
  if (fields.party1Obligations) {
    html += renderSection("المادة (4): التزامات المالك", fields.party1Obligations);
  }
  
  // المادة (5): الإشراف على التنفيذ / ملاحظات — from notes
  if (fields.notes) {
    html += renderSection("المادة (5): الإشراف على التنفيذ", fields.notes);
  }
  
  // party2Obligations (if present)
  if (fields.party2Obligations) {
    html += renderSection("التزامات الاستشاري", fields.party2Obligations);
  }
  
  // المادة (6): أحكام عامة — from terms
  if (fields.terms) {
    html += renderSection("المادة (6): أحكام عامة", fields.terms);
  }
  
  return html;
}

// ── Contract HTML body — formal legal format matching original DOCX ──────
export function contractBody(c: Contract): string {
  const amt = parseFloat(c.amount || "0");
  const hasTermsJson = (() => {
    try { JSON.parse(c.termsText || ""); return true; } catch { return false; }
  })();

  return `
${officialHeader()}

<!-- Title block — matching original DOCX style -->
<div style="text-align:center;margin:14px 0 18px;padding:14px 16px;border:3px double #000;">
  <div style="font-size:18px;font-weight:900;letter-spacing:2px;font-family:'Noto Kufi Arabic','Simplified Arabic',Arial,sans-serif;">
    إتفاقيــة خدمات هندسية
  </div>
  ${c.template ? `<div style="font-size:14px;font-weight:700;margin-top:6px;color:#333;">${c.template}</div>` : ""}
</div>

<!-- Date & Contract Number -->
<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px;">
  <div><strong>رقم العقد:</strong> <span style="font-family:'Space Grotesk',sans-serif;">${c.id}</span></div>
  <div><strong>التاريخ:</strong> ${c.signingDate || c.date}</div>
</div>

<!-- Intro text — matching original DOCX -->
<div style="font-size:12px;line-height:2;margin-bottom:14px;">
  إنــه فـي يـوم <strong>${c.signingDate || c.date || "___/___/______"}</strong> تم الإتفـــــــــاق بيـن كل من:
</div>

<!-- Parties — matching original DOCX format -->
<div style="font-size:12px;line-height:2.2;margin-bottom:8px;">
  <div><strong>الطرف الاول:</strong> السادة / مكتب دينامك ديزاين للاستشارات الهندسية &nbsp;&nbsp;&nbsp; ويشار اليه بـ <strong>(الاستشاري)</strong></div>
  <div style="font-size:11px;color:#555;padding-right:10px;">العنوان: الكويت – قبلة - قطعة 11 – شارع الصالحية – بناية 18 – الدور الاول</div>
</div>

<div style="font-size:12px;line-height:2.2;margin-bottom:14px;">
  <div><strong>الطرف الثانى:</strong> الســـيد/ <strong>${c.client || "_______________"}</strong> – بطاقة مدنية رقم/ <strong style="font-family:'Space Grotesk',sans-serif;">${c.civilId || "_______________"}</strong> &nbsp;&nbsp;&nbsp; ويشار اليه بـ <strong>(المالك)</strong></div>
  <div style="font-size:11px;color:#555;padding-right:10px;">العنوان: منطقة: ${c.area || "_______________"} – قطعة (${c.block || "___"}) – قسيمة (${c.plot || "___"})</div>
</div>

<!-- تمهيد — matching original DOCX -->
<div style="margin-bottom:16px;">
  <div class="article-heading">تمهيد :-</div>
  <div class="article-content">
    حيث أن المالك يرغب في الحصول على خدمات استشارية لـ${c.service || c.templateType || "تصميم وترخيص"} قسيمته الواقعة في منطقة: ${c.area || "___"} - قطعة: ${c.block || "___"} ، قسيمة: ${c.plot || "___"} .
    <br/>فقد تم الاتفاق مع الاستشاري للقيام بالمهام الموضحة في هذه الاتفاقية، والتي تعتبر جزءًا لا يتجزأ منها.
  </div>
</div>

<!-- Template sections from termsText JSON -->
${parseAndRenderTerms(c.termsText, amt)}

${!hasTermsJson && !c.termsText ? `
<!-- Fallback: basic sections when no template data -->
<div style="margin-bottom:16px;">
  <div class="article-heading">المادة (1): نطاق الخدمات</div>
  <div class="article-content">
    يتعهد الطرف الأول بتقديم خدمات <strong>${c.service || c.templateType || "هندسية"}</strong> للطرف الثاني
    وفقاً لأعلى المعايير الهندسية المعتمدة في دولة الكويت.
  </div>
</div>

<div style="margin-bottom:16px;">
  <div class="article-heading">المادة (2): الأتعاب المالية</div>
  <div class="article-content">
    <div class="bold-line">
      إجمالي الأتعاب: <span style="font-size:16px;font-family:'Space Grotesk',sans-serif;">${formatAmount(amt)}</span> دينار كويتي
    </div>
  </div>
</div>

<div style="margin-bottom:16px;">
  <div class="article-heading">المادة (3): أحكام عامة</div>
  <div class="article-content">
    في حال فسخ العقد من قبل المالك، لا يحق له استرداد أي مبالغ تم دفعها.
    <br/>في حال نشوء أي نزاع، يتم حله وديًا، فإن تعذر، يتم اللجوء إلى التحكيم أو المحاكم الكويتية المختصة.
    <br/>حُررت هذه الاتفاقية من نسختين، نسخة لكل طرف للعمل بموجبها.
  </div>
</div>
` : ""}

<!-- Signatures — matching original DOCX -->
<div style="margin-top:30px;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:48%;text-align:center;padding:0 12px;vertical-align:top;">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px;">الطرف الأول (الاستشاري)</div>
        <div style="font-size:11px;color:#555;margin-bottom:60px;">مكتب ديناميك ديزاين للإستشارات الهندسية</div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:10px;color:#777;">التوقيع: ___________________</div>
      </td>
      <td style="width:4%;">&nbsp;</td>
      <td style="width:48%;text-align:center;padding:0 12px;vertical-align:top;">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px;">الطرف الثاني (المالك)</div>
        <div style="font-size:11px;color:#555;margin-bottom:60px;">${c.client || "_______________"}</div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:10px;color:#777;">التوقيع: ___________________</div>
      </td>
    </tr>
  </table>
</div>

<div style="text-align:center;margin-top:16px;font-size:10px;color:#999;">
  حُرِّر هذا العقد من نسختين أصليتين بتاريخ ${c.signingDate || c.date || new Date().toLocaleDateString("ar-KW")}
</div>

${officialFooter()}`;
}

// ── Invoice HTML body ─────────────────────────────────────────────────────
function invoiceBody(inv: Invoice): string {
  const linesHtml = (inv.lines || []).map(l => `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:8px 12px;">${l.product}</td>
      <td style="padding:8px 12px;color:#555;font-size:12px;">${l.description || "—"}</td>
      <td style="padding:8px 12px;text-align:center;">${l.quantity}</td>
      <td style="padding:8px 12px;text-align:center;">${formatAmount(l.price)}</td>
      <td style="padding:8px 12px;text-align:center;">${l.taxPercent}%</td>
      <td style="padding:8px 12px;text-align:center;font-weight:600;">${formatAmount(l.total)}</td>
    </tr>`).join("");

  return `
${officialHeader()}

<!-- Title -->
<div style="background:${NAVY};color:#fff;padding:10px 20px;border-radius:6px;margin-bottom:24px;text-align:center;">
  <span style="font-size:16px;font-weight:700;">فاتورة ضريبية</span>
  <span style="margin:0 16px;opacity:.5;">|</span>
  <span style="font-size:14px;opacity:.85;">${inv.id}</span>
</div>

<!-- Meta -->
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
  <tr>
    <td style="width:50%;vertical-align:top;padding-left:12px;">
      <div style="background:#f8f9fa;border-radius:6px;padding:16px;">
        <div style="font-size:11px;font-weight:700;color:${NAVY};border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;">بيانات الفاتورة</div>
        ${row("رقم الفاتورة", inv.id)}
        ${row("التاريخ", inv.date)}
        ${row("تاريخ الاستحقاق", inv.dueDate)}
        ${row("الحالة", inv.status)}
      </div>
    </td>
    <td style="width:50%;vertical-align:top;padding-right:12px;">
      <div style="background:#f8f9fa;border-radius:6px;padding:16px;">
        <div style="font-size:11px;font-weight:700;color:${NAVY};border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;">بيانات العميل</div>
        ${row("العميل", inv.client)}
        ${row("المشروع", inv.project)}
      </div>
    </td>
  </tr>
</table>

${(inv.lines || []).length > 0 ? `
<!-- Lines table -->
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
  <thead>
    <tr style="background:${NAVY};color:#fff;">
      <th style="padding:10px 12px;text-align:right;">الخدمة / المنتج</th>
      <th style="padding:10px 12px;text-align:right;">الوصف</th>
      <th style="padding:10px 12px;text-align:center;">الكمية</th>
      <th style="padding:10px 12px;text-align:center;">السعر</th>
      <th style="padding:10px 12px;text-align:center;">الضريبة</th>
      <th style="padding:10px 12px;text-align:center;">الإجمالي</th>
    </tr>
  </thead>
  <tbody>${linesHtml}</tbody>
</table>` : ""}

<!-- Totals -->
<table style="margin-right:auto;margin-bottom:24px;min-width:280px;">
  <tr>
    <td style="padding:7px 0;color:#555;font-size:13px;">المجموع قبل الضريبة</td>
    <td style="padding:7px 0;padding-right:32px;font-weight:600;text-align:left;">${formatAmount(inv.subtotal)} د.ك</td>
  </tr>
  <tr>
    <td style="padding:7px 0;color:#555;font-size:13px;">ضريبة القيمة المضافة (${inv.taxRate}%)</td>
    <td style="padding:7px 0;padding-right:32px;font-weight:600;text-align:left;">${formatAmount(inv.taxAmount)} د.ك</td>
  </tr>
  <tr style="border-top:2px solid ${NAVY};">
    <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:${NAVY};">الإجمالي</td>
    <td style="padding:10px 0 0;padding-right:32px;font-size:20px;font-weight:700;color:${NAVY};text-align:left;">${formatAmount(inv.total)} د.ك</td>
  </tr>
</table>

${inv.notes ? `<div style="background:#fffbf0;border:1px solid #f0e0c0;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#555;"><strong>ملاحظات:</strong> ${inv.notes}</div>` : ""}

<div style="font-size:10px;color:#999;text-align:center;margin-bottom:4px;">
  تم إصدار هذه الوثيقة بتاريخ ${new Date().toLocaleDateString("ar-KW")}
</div>

${officialFooter()}`;
}

// ── Quotation types ───────────────────────────────────────────────────────
export interface QuotationLead {
  name: string;
  phone: string;
  type?: string;
  serviceType?: string;
  governorate?: string;
  area?: string;
}

export interface QuotationPackage {
  name: string;
  price: string;
  level?: string;
  features: string[];
}

// ── Quotation HTML body ───────────────────────────────────────────────────
function quotationBody(lead: QuotationLead, pkg: QuotationPackage): string {
  const today = new Date().toISOString().split("T")[0];
  return `
${officialHeader()}

<!-- Client info -->
<div style="margin-bottom:20px;">
  <div style="font-size:11px;font-weight:700;color:#000;border-bottom:1px solid #000;padding-bottom:6px;margin-bottom:10px;">بيانات العميل</div>
  ${row("الاسم", lead.name)}
  ${row("الهاتف", lead.phone)}
  ${lead.type ? row("نوع المشروع", lead.type) : ""}
  ${lead.serviceType ? row("نوع الخدمة", lead.serviceType) : ""}
  ${lead.governorate ? row("المحافظة", lead.governorate) : ""}
  ${lead.area ? row("المنطقة", lead.area) : ""}
</div>

<!-- Package -->
<div style="border:2px solid #000;padding:16px 20px;margin-bottom:20px;">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div style="font-size:30px;font-weight:900;color:#000;">${pkg.price} <span style="font-size:14px;font-weight:600;">د.ك</span></div>
    <div style="text-align:right;">
      <div style="font-size:15px;font-weight:700;color:#000;">${pkg.name}</div>
      ${pkg.level && pkg.level !== "-" ? `<div style="font-size:11px;color:#555;margin-top:2px;">${pkg.level}</div>` : ""}
    </div>
  </div>
  <div style="border-top:1px solid #ccc;padding-top:12px;">
    ${pkg.features.map(f => `
      <div style="display:flex;gap:8px;margin-bottom:6px;font-size:12px;color:#000;">
        <span style="font-weight:700;flex-shrink:0;">✓</span>
        <span>${f}</span>
      </div>`).join("")}
  </div>
</div>

<!-- Validity note -->
<div style="text-align:center;font-size:11px;color:#555;border:1px solid #ccc;padding:8px;margin-bottom:4px;">
  هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار &nbsp;·&nbsp; ${today}
</div>

${officialFooter()}`;
}

// ── Core: open print window ───────────────────────────────────────────────
function openPrintWindow(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = window.open("", "_blank");
    if (!win) {
      reject(new Error("popup_blocked"));
      return;
    }
    win.document.write(html);
    win.document.close();
    resolve();
  });
}

// ── Public API ────────────────────────────────────────────────────────────
export async function exportContractPdf(contract: Contract): Promise<void> {
  await openPrintWindow(buildPage(contractBody(contract), `عقد ${contract.id}`));
}

export async function exportInvoicePdf(invoice: Invoice): Promise<void> {
  await openPrintWindow(buildPage(invoiceBody(invoice), `فاتورة ${invoice.id}`));
}

export async function exportQuotationPdf(lead: QuotationLead, pkg: QuotationPackage): Promise<void> {
  await openPrintWindow(buildPage(quotationBody(lead, pkg), `عرض سعر — ${lead.name}`));
}

// ── Build page WITHOUT auto-print (for download) ─────────────────────────
function buildPageNoPrint(body: string, title: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<base href="${origin}/">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700;900&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Noto Naskh Arabic','Noto Kufi Arabic','Simplified Arabic',Arial,sans-serif;direction:rtl;background:#fff;color:#111;font-size:13px;line-height:1.9;}
  .page{padding:30px 35px 100px;max-width:794px;margin:0 auto;}
  table{border-collapse:collapse;}
  img{max-width:100%;}
  .article-heading{font-size:14px;font-weight:700;color:#000;border-bottom:2px solid #000;padding-bottom:4px;margin:18px 0 10px;}
  .article-content{font-size:12px;line-height:2.1;color:#222;padding-right:10px;white-space:pre-line;}
  .article-item{font-size:12px;line-height:2.1;color:#222;padding-right:10px;position:relative;}
  .bold-line{font-weight:700;color:#000;}
</style>
</head>
<body>
<div class="page">${body}</div>
</body>
</html>`;
}

// ── Download quotation as actual PDF file ──────────────────────────────────
export async function downloadQuotationPdf(lead: QuotationLead, pkg: QuotationPackage): Promise<string> {
  const fileName = `عرض-سعر-${lead.name.replace(/\s+/g, "-")}.pdf`;
  const body = quotationBody(lead, pkg);

  // Create hidden container in main document (avoids iframe CORS issues)
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.zIndex = "-1";
  container.style.background = "#fff";
  container.style.fontFamily = "'Noto Naskh Arabic','Noto Kufi Arabic','Simplified Arabic',Arial,sans-serif";
  container.style.direction = "rtl";
  container.style.fontSize = "13px";
  container.style.lineHeight = "1.9";
  container.style.color = "#111";
  container.innerHTML = `<div class="page" style="padding:30px 35px 100px;max-width:794px;margin:0 auto;">${body}</div>`;
  document.body.appendChild(container);

  // Wait for images and fonts to load
  await new Promise<void>(resolve => {
    const images = container.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;
    if (total === 0) {
      setTimeout(resolve, 500);
      return;
    }
    images.forEach(img => {
      if (img.complete) {
        loaded++;
        if (loaded >= total) setTimeout(resolve, 300);
      } else {
        img.onload = () => { loaded++; if (loaded >= total) setTimeout(resolve, 300); };
        img.onerror = () => { loaded++; if (loaded >= total) setTimeout(resolve, 300); };
      }
    });
    setTimeout(resolve, 3000); // fallback timeout
  });

  // Use html2canvas + jsPDF to generate real PDF
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const pageEl = container.querySelector(".page") as HTMLElement;

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Handle multi-page if content is longer than one page
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (pdfHeight <= pageHeight) {
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
  } else {
    let position = 0;
    while (position < pdfHeight) {
      pdf.addImage(imgData, "JPEG", 0, -position, pdfWidth, pdfHeight);
      position += pageHeight;
      if (position < pdfHeight) pdf.addPage();
    }
  }

  pdf.save(fileName);
  document.body.removeChild(container);
  return fileName;
}

// ── Print quotation (opens print dialog) ──────────────────────────────────
export async function printQuotationPdf(lead: QuotationLead, pkg: QuotationPackage): Promise<void> {
  await openPrintWindow(buildPage(quotationBody(lead, pkg), `عرض سعر — ${lead.name}`));
}

// ── Download contract as actual PDF file ──────────────────────────────────
export async function downloadContractPdf(contract: Contract): Promise<string> {
  const fileName = `عقد-${contract.id}.pdf`;
  const body = contractBody(contract);

  // Create hidden container in main document (avoids iframe CORS issues)
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.zIndex = "-1";
  container.style.background = "#fff";
  container.style.fontFamily = "'Noto Naskh Arabic','Noto Kufi Arabic','Simplified Arabic',Arial,sans-serif";
  container.style.direction = "rtl";
  container.style.fontSize = "13px";
  container.style.lineHeight = "1.9";
  container.style.color = "#111";
  container.innerHTML = `<div class="page" style="padding:30px 35px 100px;max-width:794px;margin:0 auto;">${body}</div>`;
  document.body.appendChild(container);

  // Wait for images and fonts to load
  await new Promise<void>(resolve => {
    const images = container.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;
    if (total === 0) {
      setTimeout(resolve, 500);
      return;
    }
    images.forEach(img => {
      if (img.complete) {
        loaded++;
        if (loaded >= total) setTimeout(resolve, 300);
      } else {
        img.onload = () => { loaded++; if (loaded >= total) setTimeout(resolve, 300); };
        img.onerror = () => { loaded++; if (loaded >= total) setTimeout(resolve, 300); };
      }
    });
    setTimeout(resolve, 3000); // fallback timeout
  });

  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const pageEl = container.querySelector(".page") as HTMLElement;

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Handle multi-page if content is longer than A4
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (pdfHeight > pageHeight) {
    let position = 0;
    let remaining = pdfHeight;
    let first = true;
    while (remaining > 0) {
      if (!first) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -position, pdfWidth, pdfHeight);
      position += pageHeight;
      remaining -= pageHeight;
      first = false;
    }
  } else {
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
  }

  pdf.save(fileName);
  document.body.removeChild(container);
  return fileName;
}
