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
function buildPage(body: string, title: string): string {
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

// ── Helper: parse template content into articles ─────────────────────────
function parseTemplateContent(text: string): string {
  if (!text) return "";
  // Split by lines and format
  const lines = text.split("\n");
  let html = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      html += "<br/>";
      continue;
    }
    // Detect article headings like "المادة (1):" or "المرحلة الأولى"
    if (/^(المادة|المرحلة)\s*\(/.test(trimmed) || /^(تمهيد|أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً)/.test(trimmed)) {
      html += `<div class="article-heading">${trimmed}</div>`;
    } else if (/^\d+[\.\)]/.test(trimmed) || /^[١٢٣٤٥٦٧٨٩٠]+[\.\)]/.test(trimmed)) {
      // Numbered items
      html += `<div class="article-content">${trimmed}</div>`;
    } else {
      html += `<div class="article-content">${trimmed}</div>`;
    }
  }
  return html;
}

// ── Contract HTML body — formal legal format matching original DOCX ──────
function contractBody(c: Contract): string {
  const amt = parseFloat(c.amount || "0");

  // Build scope of work from template content
  const scopeContent = c.termsText || "";
  
  return `
${officialHeader()}

<!-- Title block — matching original DOCX style -->
<div style="text-align:center;margin:14px 0 18px;padding:14px 16px;border:3px double #000;">
  <div style="font-size:18px;font-weight:900;letter-spacing:2px;font-family:'Noto Kufi Arabic','Simplified Arabic',Arial,sans-serif;">
    إتفاقيــة خدمات هندسية
  </div>
  ${c.templateType ? `<div style="font-size:14px;font-weight:700;margin-top:6px;color:#333;">${c.templateType}</div>` : ""}
  ${c.template ? `<div style="font-size:13px;font-weight:600;margin-top:4px;color:#444;">${c.template}</div>` : ""}
</div>

<!-- Date & Contract Number -->
<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px;">
  <div><strong>رقم العقد:</strong> <span style="font-family:'Space Grotesk',sans-serif;">${c.id}</span></div>
  <div><strong>التاريخ:</strong> ${c.signingDate || c.date}</div>
</div>

<!-- Intro text -->
<div style="font-size:12px;line-height:2;margin-bottom:14px;">
  أنه في يوم <strong>${c.signingDate || c.date || "___/___/______"}</strong> تم الإتفاق بين كلاً من:
</div>

<!-- Section: Parties -->
<div style="margin-bottom:16px;">
  <div class="article-heading">أولاً: المتعاقدان</div>
  
  <div style="font-size:12px;line-height:2.2;margin-bottom:10px;padding:8px 12px;background:#fafafa;border:1px solid #eee;">
    <div class="bold-line" style="font-size:13px;">الطرف الأول (الاستشاري):</div>
    <div>مكتب ديناميك ديزاين للإستشارات الهندسية</div>
    <div style="font-size:11px;color:#555;">مدينة الكويت – قبلة – شارع الصالحية – مبنى رقم (18) – الدور الأول – مكتب رقم (1)</div>
  </div>
  
  <div style="font-size:12px;line-height:2.2;padding:8px 12px;background:#fafafa;border:1px solid #eee;">
    <div class="bold-line" style="font-size:13px;">الطرف الثاني (المالك / العميل):</div>
    <table style="width:100%;font-size:12px;margin-top:4px;">
      <tr>
        <td style="padding:3px 8px;color:#555;width:20%;">الاسم:</td>
        <td style="padding:3px 8px;font-weight:600;">${c.client || "_______________"}</td>
        <td style="padding:3px 8px;color:#555;width:20%;">الرقم المدني:</td>
        <td style="padding:3px 8px;font-weight:600;font-family:'Space Grotesk',sans-serif;">${c.civilId || "_______________"}</td>
      </tr>
      <tr>
        <td style="padding:3px 8px;color:#555;">المنطقة:</td>
        <td style="padding:3px 8px;font-weight:600;">${c.area || "_______________"}</td>
        <td style="padding:3px 8px;color:#555;">القطعة:</td>
        <td style="padding:3px 8px;font-weight:600;">${c.block || "___"}</td>
      </tr>
      <tr>
        <td style="padding:3px 8px;color:#555;">القسيمة:</td>
        <td style="padding:3px 8px;font-weight:600;">${c.plot || "___"}</td>
        <td style="padding:3px 8px;color:#555;">نوع العقار:</td>
        <td style="padding:3px 8px;font-weight:600;">${c.type || "سكن خاص"}</td>
      </tr>
    </table>
  </div>
</div>

<!-- Section: Introduction -->
<div style="margin-bottom:14px;">
  <div class="article-heading">تمهيد</div>
  <div class="article-content">
    حيث أن الطرف الأول مكتب استشاري هندسي مرخص ومتخصص في أعمال التصميم والإشراف الهندسي،
    وحيث أن الطرف الثاني يرغب في الاستعانة بخدمات الطرف الأول لتقديم خدمات
    <strong>${c.service || c.templateType || "هندسية"}</strong>
    لمشروع من نوع <strong>${c.type || "سكن خاص"}</strong>
    ${c.area ? `في منطقة <strong>${c.area}</strong>` : ""}
    ${c.block ? `– القطعة <strong>${c.block}</strong>` : ""}
    ${c.plot ? `– القسيمة <strong>${c.plot}</strong>` : ""}،
    ${c.package ? `الباقة المختارة: <strong>${c.package}</strong>،` : ""}
    فقد اتفق الطرفان على ما يلي:
  </div>
</div>

<!-- Section: Scope of Work / Template Content -->
${scopeContent ? `
<div style="margin-bottom:14px;">
  <div class="article-heading">المادة (1): نطاق الخدمات والشروط</div>
  <div class="article-content">${scopeContent.replace(/\n/g, "<br/>")}</div>
</div>
` : `
<div style="margin-bottom:14px;">
  <div class="article-heading">المادة (1): نطاق الخدمات</div>
  <div class="article-content">
    يتعهد الطرف الأول بتقديم خدمات <strong>${c.service || c.templateType || "هندسية"}</strong> للطرف الثاني
    وفقاً لأعلى المعايير الهندسية المعتمدة في دولة الكويت.
  </div>
</div>
`}

<!-- Section: Payment -->
<div style="margin-bottom:14px;">
  <div class="article-heading">المادة (${scopeContent ? "2" : "2"}): الأتعاب المالية</div>
  <div class="article-content">
    <div class="bold-line">
      إجمالي الأتعاب: <span style="font-size:16px;font-family:'Space Grotesk',sans-serif;">${formatAmount(amt)}</span> دينار كويتي
    </div>
  </div>
  <div class="article-heading" style="font-size:12px;border-bottom:1px solid #999;margin-top:10px;">آلية الدفع:</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;">
    <thead>
      <tr style="background:#f5f5f5;border-bottom:2px solid #000;">
        <th style="padding:8px 10px;text-align:right;font-weight:700;">الدفعة</th>
        <th style="padding:8px 10px;text-align:right;font-weight:700;">الوقت</th>
        <th style="padding:8px 10px;text-align:center;font-weight:700;">النسبة</th>
        <th style="padding:8px 10px;text-align:center;font-weight:700;">المبلغ (د.ك)</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #ddd;">
        <td style="padding:7px 10px;">الدفعة الأولى</td>
        <td style="padding:7px 10px;">عند توقيع العقد</td>
        <td style="padding:7px 10px;text-align:center;font-weight:700;">50%</td>
        <td style="padding:7px 10px;text-align:center;font-weight:700;font-family:'Space Grotesk',sans-serif;">${formatAmount(amt * 0.5)}</td>
      </tr>
      <tr style="border-bottom:1px solid #ddd;">
        <td style="padding:7px 10px;">الدفعة الثانية</td>
        <td style="padding:7px 10px;">بعد صدور الرخصة / الإنجاز</td>
        <td style="padding:7px 10px;text-align:center;font-weight:700;">50%</td>
        <td style="padding:7px 10px;text-align:center;font-weight:700;font-family:'Space Grotesk',sans-serif;">${formatAmount(amt * 0.5)}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Section: General Terms -->
<div style="margin-bottom:14px;">
  <div class="article-heading">أحكام عامة</div>
  <div class="article-content">
    في حال فسخ العقد من قبل المالك، لا يحق له استرداد أي مبالغ تم دفعها.
    <br/>في حال نشوء أي نزاع، يتم حله وديًا، فإن تعذر، يتم اللجوء إلى التحكيم أو المحاكم الكويتية المختصة.
    <br/>حُررت هذه الاتفاقية من نسختين، نسخة لكل طرف للعمل بموجبها.
  </div>
</div>

<!-- Section: Signatures — matching original DOCX -->
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
