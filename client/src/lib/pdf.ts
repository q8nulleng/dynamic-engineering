import type { Contract, Invoice } from "./api";

const NAVY = "#1B4965";
const GOLD = "#C4956A";

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

// ── Official Office Header ────────────────────────────────────────────────
function officialHeader(): string {
  return `
<div style="display:flex;align-items:center;gap:15px;padding-bottom:10px;direction:rtl;">
  <img src="/assets/logo-dynamic.jpeg" style="width:80px;height:auto;object-fit:contain;" alt="Dynamic Logo" />
  <div style="text-align:center;flex:1;">
    <div style="font-size:26px;font-weight:900;color:#000;font-family:'Noto Kufi Arabic',Arial,sans-serif;">ديناميك للإستشارات الهندسية</div>
    <div style="font-size:13px;font-weight:700;color:#000;letter-spacing:2px;margin-top:4px;font-family:'Space Grotesk',sans-serif;">DYNAMIC ENGINEERING CONSULTANTS</div>
  </div>
</div>
<hr style="border:none;border-top:1px solid #000;margin:0 0 5px;" />
<div style="text-align:center;font-size:11px;color:#333;padding:4px 0 16px;">
  إستشاريون (تصميم وإشراف) - معماري - إنشائي - مباني وإنشاءات - تصميم - إدارة مشاريع
</div>`;
}

// ── Official Office Footer ────────────────────────────────────────────────
function officialFooter(): string {
  return `
<div style="position:fixed;bottom:0;left:0;right:0;padding:8px 20px;text-align:center;font-size:9px;border-top:1px solid #000;background:#fff;">
  <div style="font-weight:bold;">
    مدينة الكويت - قبلة - شارع الصالحية - مبنى رقم (18) الدور الاول مكتب رقم (1) موبايل: 22091228 - 50855599
  </div>
  <div style="font-family:'Space Grotesk',sans-serif;">
    Kuwait city – Qiblah – Salihia.st – Building no:18 – First floor no-1 Mobil no: 22091228 – 50855599
  </div>
  <div style="font-family:'Space Grotesk',sans-serif;">Email: info@DynamicSaud.com</div>
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
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700;900&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Noto Kufi Arabic',Arial,sans-serif;direction:rtl;background:#fff;color:#111;}
  .page{padding:32px 40px 100px;max-width:794px;margin:0 auto;}
  table{border-collapse:collapse;}
  img{max-width:100%;}
  .print-btn{
    position:fixed;bottom:20px;left:20px;background:${NAVY};color:#fff;
    border:none;padding:10px 24px;border-radius:8px;font-size:15px;
    cursor:pointer;font-family:'Noto Kufi Arabic',Arial,sans-serif;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
  }
  @page{size:A4;margin:12mm;}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    img{-webkit-print-color-adjust:exact;print-color-adjust:exact;max-width:100%;}
    .no-print{display:none!important;}
  }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
<div class="page">${body}</div>
<script>
  if(document.fonts){document.fonts.ready.then(()=>setTimeout(()=>window.print(),400));}
  else{window.addEventListener('load',()=>setTimeout(()=>window.print(),400));}
</script>
</body>
</html>`;
}

// ── Contract HTML body — formal legal format ──────────────────────────────
function contractBody(c: Contract): string {
  const amt = parseFloat(c.amount || "0");
  const p1  = amt * 0.30;
  const p2  = amt * 0.40;
  const p3  = amt * 0.30;

  const defaultTerms = `
    1. يلتزم الطرف الأول بتقديم الخدمات المنصوص عليها وفق أعلى المعايير الهندسية المعتمدة في دولة الكويت.
    2. يلتزم الطرف الثاني بتسليم جميع المستندات المطلوبة خلال مدة أقصاها 14 يوماً من تاريخ توقيع العقد.
    3. في حال التأخر في سداد أي دفعة، يحق للطرف الأول تعليق العمل دون تحمل أي مسؤولية تجاه الطرف الثاني.
    4. يخضع هذا العقد لأحكام القانون الكويتي وتختص المحاكم الكويتية بالفصل في أي نزاع ينشأ عنه.
    5. يُعدّ هذا العقد نافذاً من تاريخ توقيع الطرفين عليه ويُحرَّر من نسختين أصليتين بيد كل طرف نسخة.
    6. يحق لأي من الطرفين إنهاء العقد بإشعار خطي مسبق مدته 30 يوماً، على أن يُعوَّض الطرف الأول عن جميع الأعمال المنجزة.
    7. لا يحق للطرف الثاني التنازل عن هذا العقد لطرف ثالث إلا بموافقة خطية مسبقة من الطرف الأول.
  `;

  return `
${officialHeader()}

<!-- Title block -->
<div style="text-align:center;margin:16px 0;padding:12px 16px;border:2px solid #000;">
  <div style="font-size:20px;font-weight:900;letter-spacing:1px;">عقد خدمات هندسية</div>
  ${c.templateType ? `<div style="font-size:14px;font-weight:700;margin-top:6px;">${c.templateType}</div>` : ""}
  <div style="font-size:11px;color:#555;margin-top:6px;font-family:'Space Grotesk',sans-serif;">
    رقم العقد: ${c.id} &nbsp;|&nbsp; التاريخ: ${c.signingDate || c.date}
  </div>
</div>

<!-- Section 1: Parties -->
<div style="margin-bottom:18px;">
  <div style="font-size:13px;font-weight:700;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:12px;">أولاً: المتعاقدان</div>
  <div style="margin-bottom:10px;font-size:12px;line-height:1.9;">
    <strong>الطرف الأول (المكتب):</strong>
    ديناميك للإستشارات الهندسية — مدينة الكويت، قبلة، شارع الصالحية، مبنى 18، الدور الأول، مكتب 1
  </div>
  <div style="font-size:12px;line-height:1.9;">
    <strong>الطرف الثاني (العميل):</strong>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:12px;">
    <tr style="border-bottom:1px dotted #ccc;">
      <td style="padding:5px 8px;color:#555;width:30%;">الاسم</td>
      <td style="padding:5px 8px;font-weight:600;">${c.client || "—"}</td>
      <td style="padding:5px 8px;color:#555;width:30%;">الرقم المدني</td>
      <td style="padding:5px 8px;font-weight:600;font-family:'Space Grotesk',sans-serif;">${c.civilId || "—"}</td>
    </tr>
    <tr style="border-bottom:1px dotted #ccc;">
      <td style="padding:5px 8px;color:#555;">المنطقة</td>
      <td style="padding:5px 8px;font-weight:600;">${c.area || "—"}</td>
      <td style="padding:5px 8px;color:#555;">القطعة / القسيمة</td>
      <td style="padding:5px 8px;font-weight:600;">${[c.block, c.plot].filter(Boolean).join(" / ") || "—"}</td>
    </tr>
  </table>
</div>

<!-- Section 2: Subject -->
<div style="margin-bottom:18px;">
  <div style="font-size:13px;font-weight:700;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:12px;">ثانياً: موضوع العقد</div>
  <div style="font-size:12px;line-height:2;border:1px solid #ddd;padding:10px 14px;background:#fafafa;">
    تعهّد الطرف الأول بتقديم خدمات هندسية للطرف الثاني تتمثل في
    <strong> ${c.service || c.templateType || "خدمات هندسية"}</strong>
    لمشروع من نوع <strong>${c.type || "سكن خاص"}</strong>
    ${c.area ? `، الموقع: <strong>${c.area}</strong>` : ""}
    ${c.block ? `، القطعة: <strong>${c.block}</strong>` : ""}
    ${c.plot ? `، القسيمة: <strong>${c.plot}</strong>` : ""}.
    ${c.package ? `<br>الباقة المختارة: <strong>${c.package}</strong>.` : ""}
  </div>
</div>

<!-- Section 3: Payment -->
<div style="margin-bottom:18px;">
  <div style="font-size:13px;font-weight:700;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:12px;">ثالثاً: قيمة العقد وجدول الدفعات</div>
  <div style="font-size:12px;margin-bottom:10px;">
    القيمة الإجمالية للعقد:
    <strong style="font-size:18px;font-family:'Space Grotesk',sans-serif;"> ${formatAmount(amt)} د.ك</strong>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead>
      <tr style="background:#000;color:#fff;">
        <th style="padding:8px 12px;text-align:right;">الدفعة</th>
        <th style="padding:8px 12px;text-align:right;">الوقت</th>
        <th style="padding:8px 12px;text-align:center;">النسبة</th>
        <th style="padding:8px 12px;text-align:center;font-family:'Space Grotesk',sans-serif;">المبلغ (د.ك)</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:8px 12px;">الدفعة الأولى</td>
        <td style="padding:8px 12px;">عند توقيع العقد</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;">30%</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;font-family:'Space Grotesk',sans-serif;">${formatAmount(p1)}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee;background:#fafafa;">
        <td style="padding:8px 12px;">الدفعة الثانية</td>
        <td style="padding:8px 12px;">عند اعتماد التصاميم</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;">40%</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;font-family:'Space Grotesk',sans-serif;">${formatAmount(p2)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;">الدفعة الثالثة</td>
        <td style="padding:8px 12px;">عند استلام الرخصة / الإنجاز</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;">30%</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;font-family:'Space Grotesk',sans-serif;">${formatAmount(p3)}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Section 4: Terms -->
<div style="margin-bottom:18px;">
  <div style="font-size:13px;font-weight:700;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:12px;">رابعاً: الشروط والأحكام</div>
  <div style="font-size:11px;line-height:2.1;color:#333;white-space:pre-line;">
    ${c.termsText || defaultTerms}
  </div>
</div>

<!-- Section 5: Signatures -->
<div style="margin-top:28px;">
  <div style="font-size:13px;font-weight:700;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:24px;">خامساً: التوقيعات</div>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:48%;text-align:center;padding:0 12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:4px;">الطرف الأول — المكتب</div>
        <div style="font-size:11px;color:#555;margin-bottom:50px;">ديناميك للإستشارات الهندسية</div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:10px;color:#777;">الاسم والتوقيع والتاريخ</div>
      </td>
      <td style="width:4%;">&nbsp;</td>
      <td style="width:48%;text-align:center;padding:0 12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:4px;">الطرف الثاني — العميل</div>
        <div style="font-size:11px;color:#555;margin-bottom:50px;">${c.client}</div>
        <div style="border-top:1px solid #000;padding-top:6px;font-size:10px;color:#777;">الاسم والتوقيع والتاريخ</div>
      </td>
    </tr>
  </table>
</div>

<div style="text-align:center;margin-top:20px;font-size:10px;color:#999;">
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
