/*
 * FormsTaskPanel - كرت تجهيز النماذج والتعهدات
 * يربط نماذج البلدية بالمشروع ويعبّئها تلقائياً من بيانات العميل
 * يعرض قائمة النماذج المطلوبة حسب نوع الخدمة مع حالة كل نموذج
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, FileText, CheckCircle2, Circle, Download, Eye,
  User, MapPin, Calendar, ChevronDown, ChevronUp,
  ClipboardList, Stamp, AlertCircle, RefreshCw, Copy, Check,
  Building2, Printer
} from "lucide-react";
import { toast } from "sonner";
import { clientsDB, type Client } from "@/pages/Clients";

/* ─── Types ─── */
type FormStatus = "pending" | "filled" | "printed" | "signed";

interface MunicipalForm {
  id: string;
  name: string;
  category: "إقرارات" | "تعهدات" | "خاص";
  pages: number;
  requiredFor: string[]; // أنواع الخدمات التي يُطلب فيها هذا النموذج
  description: string;
  fields: string[];      // الحقول المتغيرة في النموذج
  status: FormStatus;
  filledAt?: string;
  printedAt?: string;
}

/* ─── قوالب النماذج الكاملة ─── */
const FORM_TEMPLATES: Omit<MunicipalForm, "status" | "filledAt" | "printedAt">[] = [
  {
    id: "F001",
    name: "إقرار المكتب الهندسي",
    category: "إقرارات",
    pages: 1,
    requiredFor: ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"],
    description: "إقرار المكتب بالمسؤولية الهندسية عن المشروع",
    fields: ["OWNER_NAME", "AREA", "BLOCK", "PLOT", "SERVICE_TYPE", "DATE_TODAY"],
  },
  {
    id: "F002",
    name: "إقرار تصميم إنشائي",
    category: "إقرارات",
    pages: 1,
    requiredFor: ["بناء جديد", "إضافة", "تعديل وإضافة"],
    description: "إقرار المهندس الإنشائي بمسؤولية التصميم الإنشائي",
    fields: ["OWNER_NAME", "AREA", "BLOCK", "PLOT", "DATE_TODAY"],
  },
  {
    id: "F003",
    name: "إقرار عدم المطالبة بالكهرباء",
    category: "إقرارات",
    pages: 1,
    requiredFor: ["بناء جديد"],
    description: "إقرار بعدم المطالبة بتوصيل الكهرباء خلال فترة البناء",
    fields: ["OWNER_NAME", "CIVIL_ID", "AREA", "BLOCK", "PLOT", "DATE_TODAY"],
  },
  {
    id: "F004",
    name: "إقرار مراجع الحساب",
    category: "إقرارات",
    pages: 1,
    requiredFor: ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة"],
    description: "إقرار مراجع الحساب بمطابقة المخططات للمواصفات",
    fields: ["OWNER_NAME", "AREA", "BLOCK", "PLOT", "DATE_TODAY"],
  },
  {
    id: "F005",
    name: "إقرار المساحة والحدود",
    category: "إقرارات",
    pages: 1,
    requiredFor: ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة"],
    description: "إقرار بصحة مساحة وحدود القسيمة",
    fields: ["OWNER_NAME", "AREA", "BLOCK", "PLOT", "PARCEL_AREA", "DATE_TODAY"],
  },
  {
    id: "F006",
    name: "إقرار التزام بالمخطط",
    category: "إقرارات",
    pages: 1,
    requiredFor: ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة"],
    description: "إقرار المالك بالالتزام بالمخطط المعتمد",
    fields: ["OWNER_NAME", "CIVIL_ID", "AREA", "BLOCK", "PLOT", "DATE_TODAY"],
  },
  {
    id: "F007",
    name: "إقرار المقاول",
    category: "إقرارات",
    pages: 1,
    requiredFor: ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة"],
    description: "إقرار المقاول بالالتزام بالمواصفات والمخطط المعتمد",
    fields: ["OWNER_NAME", "AREA", "BLOCK", "PLOT", "DATE_TODAY"],
  },
  {
    id: "F008",
    name: "تعهدات المالك الكاملة",
    category: "تعهدات",
    pages: 4,
    requiredFor: ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"],
    description: "12 تعهد شامل من المالك تجاه بلدية الكويت",
    fields: ["OWNER_NAME", "CIVIL_ID", "SPOUSE_NAME", "SPOUSE_CIVIL_ID", "AREA", "BLOCK", "PLOT", "PARCEL_AREA", "OWNERSHIP_DOC", "OWNERSHIP_DATE", "DATE_TODAY"],
  },
  {
    id: "F009",
    name: "تعهد الاطلاع على شهادة الإسكان",
    category: "تعهدات",
    pages: 2,
    requiredFor: ["بناء جديد"],
    description: "تعهد المالك بالاطلاع على شهادة الإسكان وشروطها",
    fields: ["OWNER_NAME", "CIVIL_ID", "AREA", "BLOCK", "PLOT", "DATE_TODAY"],
  },
  {
    id: "F010",
    name: "تعهد الكشف على العقار وخلوه من المخالفات",
    category: "تعهدات",
    pages: 3,
    requiredFor: ["تعديل", "إضافة", "تعديل وإضافة"],
    description: "تعهد بالكشف على العقار وخلوه من أي مخالفات بناء",
    fields: ["OWNER_NAME", "CIVIL_ID", "AREA", "BLOCK", "PLOT", "OWNERSHIP_DOC", "DATE_TODAY"],
  },
  {
    id: "F011",
    name: "تعهد عدم البناء على الأرصفة",
    category: "تعهدات",
    pages: 1,
    requiredFor: ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة"],
    description: "تعهد المالك بعدم البناء على الأرصفة أو الشوارع",
    fields: ["OWNER_NAME", "CIVIL_ID", "AREA", "BLOCK", "PLOT", "DATE_TODAY"],
  },
];

/* ─── حالات النماذج ─── */
const statusConfig: Record<FormStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending:  { label: "لم يُعبأ",  color: "text-gray-500",  bg: "bg-gray-50",   icon: Circle },
  filled:   { label: "تم التعبئة", color: "text-blue-600",  bg: "bg-blue-50",   icon: FileText },
  printed:  { label: "تمت الطباعة", color: "text-amber-600", bg: "bg-amber-50",  icon: Printer },
  signed:   { label: "موقّع",     color: "text-green-600", bg: "bg-green-50",  icon: CheckCircle2 },
};

/* ─── تعبئة الحقول من بيانات العميل ─── */
function fillFormData(client: Client | null): Record<string, string> {
  if (!client) return {};
  const today = new Date().toLocaleDateString("ar-KW", { year: "numeric", month: "long", day: "numeric" });
  return {
    OWNER_NAME:      client.name,
    CIVIL_ID:        client.civilId || "—",
    SPOUSE_NAME:     client.spouseName || "—",
    SPOUSE_CIVIL_ID: client.spouseCivilId || "—",
    AREA:            client.area,
    BLOCK:           client.block,
    PLOT:            client.plot,
    PARCEL_AREA:     `${client.parcelArea} م²`,
    OWNERSHIP_DOC:   client.ownershipDoc || "—",
    OWNERSHIP_DATE:  client.ownershipDate || "—",
    SERVICE_TYPE:    client.serviceType,
    DATE_TODAY:      today,
    OFFICE_NAME:     "ديناميك للاستشارات الهندسية",
  };
}

/* ─── عرض الحقل بالعربي ─── */
const fieldLabels: Record<string, string> = {
  OWNER_NAME:      "اسم المالك",
  CIVIL_ID:        "الرقم المدني",
  SPOUSE_NAME:     "اسم الزوجة",
  SPOUSE_CIVIL_ID: "رقم مدني الزوجة",
  AREA:            "المنطقة",
  BLOCK:           "رقم القطعة",
  PLOT:            "رقم القسيمة",
  PARCEL_AREA:     "مساحة القسيمة",
  OWNERSHIP_DOC:   "رقم وثيقة الملكية",
  OWNERSHIP_DATE:  "تاريخ الوثيقة",
  SERVICE_TYPE:    "نوع الخدمة",
  DATE_TODAY:      "تاريخ اليوم",
  OFFICE_NAME:     "اسم المكتب",
};

/* ─── Props ─── */
interface Props {
  open: boolean;
  onClose: () => void;
  projectName: string;
  serviceType: string;
  clientId?: string; // ربط بملف العميل
}

export default function FormsTaskPanel({ open, onClose, projectName, serviceType, clientId }: Props) {
  // إيجاد العميل من قاعدة البيانات
  const client = clientId ? clientsDB.find(c => c.id === clientId) || null : null;
  const filledData = fillFormData(client);

  // تصفية النماذج حسب نوع الخدمة
  const relevantForms = FORM_TEMPLATES.filter(f => f.requiredFor.includes(serviceType));

  // حالة كل نموذج
  const [formStatuses, setFormStatuses] = useState<Record<string, FormStatus>>(
    Object.fromEntries(relevantForms.map(f => [f.id, "pending"]))
  );

  const [expandedForm, setExpandedForm] = useState<string | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!open) return null;

  const totalForms = relevantForms.length;
  const signedForms = Object.values(formStatuses).filter(s => s === "signed").length;
  const filledForms = Object.values(formStatuses).filter(s => s === "filled" || s === "printed" || s === "signed").length;

  const handleFillAll = () => {
    const updated: Record<string, FormStatus> = {};
    relevantForms.forEach(f => { updated[f.id] = "filled"; });
    setFormStatuses(updated);
    toast.success(`تم تعبئة ${totalForms} نموذج تلقائياً من بيانات العميل`);
  };

  const handleAdvanceStatus = (formId: string) => {
    const order: FormStatus[] = ["pending", "filled", "printed", "signed"];
    const current = formStatuses[formId];
    const idx = order.indexOf(current);
    if (idx < order.length - 1) {
      const next = order[idx + 1];
      setFormStatuses(prev => ({ ...prev, [formId]: next }));
      const labels: Record<FormStatus, string> = {
        pending: "", filled: "تم تعبئة النموذج", printed: "تمت طباعة النموذج", signed: "تم توقيع النموذج ✅"
      };
      toast.success(labels[next]);
    }
  };

  const handleCopyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
    toast.success(`تم نسخ: ${value}`);
  };

  const accentColor = "oklch(0.35 0.08 250)";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" dir="rtl">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md h-full bg-background shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ background: `linear-gradient(135deg, oklch(0.22 0.04 250) 0%, oklch(0.28 0.06 260) 100%)` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Stamp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">تجهيز النماذج والتعهدات</h3>
                <p className="text-[10px] text-white/70">{projectName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${totalForms > 0 ? (signedForms / totalForms) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white" style={{ fontFamily: "'Space Grotesk'" }}>
              {signedForms}/{totalForms} موقّع
            </span>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px]">
              {serviceType}
            </span>
            {client && (
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {client.name}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-200 text-[10px]">
              المسؤول: محمد ثروت
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">

          {/* بيانات التعبئة التلقائية */}
          <div className="mx-3 mt-3 rounded-xl border border-border/60 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              onClick={() => setShowDataPreview(!showDataPreview)}
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">بيانات التعبئة التلقائية</span>
                {client ? (
                  <Badge className="text-[9px] px-1.5 py-0 bg-green-100 text-green-700 border-0">مرتبط بالعميل</Badge>
                ) : (
                  <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">لا يوجد ربط</Badge>
                )}
              </div>
              {showDataPreview ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>

            {showDataPreview && (
              <div className="p-3 space-y-1.5 bg-background">
                {client ? (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-2">انقر على أي حقل لنسخه</p>
                    {Object.entries(filledData).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleCopyField(key, value)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors text-right"
                      >
                        <span className="text-[10px] text-muted-foreground">{fieldLabels[key] || key}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium" dir={key === "CIVIL_ID" || key === "SPOUSE_CIVIL_ID" ? "ltr" : "rtl"}>{value}</span>
                          {copiedField === key
                            ? <Check className="w-3 h-3 text-green-500" />
                            : <Copy className="w-3 h-3 text-muted-foreground" />
                          }
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-xs text-muted-foreground">لم يتم ربط هذا المشروع بملف عميل</p>
                    <p className="text-[10px] text-muted-foreground mt-1">اربط المشروع بعميل لتفعيل التعبئة التلقائية</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* زر تعبئة الكل */}
          {client && (
            <div className="mx-3 mt-2">
              <Button
                className="w-full text-white text-xs h-9 gap-2"
                style={{ backgroundColor: accentColor }}
                onClick={handleFillAll}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تعبئة جميع النماذج تلقائياً من بيانات العميل
              </Button>
            </div>
          )}

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-3 gap-2 mx-3 mt-3">
            {[
              { label: "إجمالي", value: totalForms, color: "text-foreground" },
              { label: "تم التعبئة", value: filledForms, color: "text-blue-600" },
              { label: "موقّعة", value: signedForms, color: "text-green-600" },
            ].map(stat => (
              <div key={stat.label} className="text-center p-2 rounded-xl bg-muted/20 border border-border/40">
                <p className={`text-xl font-bold ${stat.color}`} style={{ fontFamily: "'Space Grotesk'" }}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* قائمة النماذج */}
          <div className="mx-3 mt-3 mb-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              النماذج المطلوبة لـ «{serviceType}»
            </p>

            {relevantForms.map((form) => {
              const status = formStatuses[form.id];
              const cfg = statusConfig[status];
              const StatusIcon = cfg.icon;
              const isExpanded = expandedForm === form.id;

              return (
                <div key={form.id} className={`rounded-xl border transition-all overflow-hidden ${cfg.bg} border-border/50`}>
                  {/* Row */}
                  <div className="flex items-center gap-2.5 p-3">
                    <StatusIcon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{form.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{form.pages} {form.pages === 1 ? "صفحة" : "صفحات"}</span>
                        <Badge
                          className="text-[9px] px-1.5 py-0 border-0"
                          style={{
                            backgroundColor: form.category === "إقرارات" ? "oklch(0.93 0.05 250)" : "oklch(0.93 0.05 60)",
                            color: form.category === "إقرارات" ? "oklch(0.40 0.10 250)" : "oklch(0.40 0.10 60)",
                          }}
                        >
                          {form.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedForm(isExpanded ? null : form.id)}
                        className="w-6 h-6 rounded-lg bg-background/60 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleAdvanceStatus(form.id)}
                        disabled={status === "signed"}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white transition-all disabled:opacity-40"
                        style={{ backgroundColor: status === "signed" ? "oklch(0.55 0.15 150)" : accentColor }}
                      >
                        {status === "pending" ? "عبّئ" : status === "filled" ? "اطبع" : status === "printed" ? "وقّع" : "✓"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-border/30 bg-background/50">
                      <p className="text-[10px] text-muted-foreground mt-2 mb-2">{form.description}</p>

                      {/* الحقول المتغيرة */}
                      <p className="text-[10px] font-semibold mb-1.5">الحقول التي ستُعبأ تلقائياً:</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {form.fields.map(field => (
                          <div key={field} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border/40">
                            <span className="text-[9px] text-muted-foreground">{fieldLabels[field] || field}</span>
                            {filledData[field] && filledData[field] !== "—" && (
                              <span className="text-[9px] font-semibold text-foreground">← {filledData[field]}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* أزرار الإجراءات */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7 gap-1">
                          <Eye className="w-3 h-3" />
                          معاينة
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7 gap-1">
                          <Download className="w-3 h-3" />
                          تحميل Word
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7 gap-1">
                          <Printer className="w-3 h-3" />
                          طباعة
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/10 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">
              {signedForms === totalForms && totalForms > 0
                ? "✅ جميع النماذج موقّعة — جاهز للتقديم للبلدية"
                : `${totalForms - signedForms} نماذج متبقية للتوقيع`}
            </span>
            <span className="text-[10px] font-bold" style={{ color: accentColor, fontFamily: "'Space Grotesk'" }}>
              {totalForms > 0 ? Math.round((signedForms / totalForms) * 100) : 0}%
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 text-white text-xs h-8"
              style={{ backgroundColor: accentColor }}
              onClick={onClose}
            >
              <Building2 className="w-3.5 h-3.5 ml-1.5" />
              إرسال للبلدية
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
