/*
 * Design: Desert Oasis Professional
 * Contracts - العقود الهندسية
 */
import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  useContracts, useUpdateContract,
  useContractTemplates, useCreateContractTemplate, useUpdateContractTemplate, useDeleteContractTemplate,
  type ContractTemplate,
} from "@/lib/api";
import { exportContractPdf } from "@/lib/pdf";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, FileSignature, Download, Eye,
  FileText, CheckCircle2, XCircle, Send,
  ChevronDown, ChevronUp, Loader2, ExternalLink,
  Pencil, Copy, Trash2, Save, X,
} from "lucide-react";

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "مسودة":        { icon: FileText,      color: "text-gray-600",    bg: "bg-gray-100"   },
  "مرسل للتوقيع": { icon: Send,          color: "text-blue-600",    bg: "bg-blue-50"    },
  "موقع":         { icon: FileSignature, color: "text-purple-600",  bg: "bg-purple-50"  },
  "نشط":          { icon: CheckCircle2,  color: "text-green-600",   bg: "bg-green-50"   },
  "مكتمل":        { icon: CheckCircle2,  color: "text-emerald-700", bg: "bg-emerald-50" },
  "ملغي":         { icon: XCircle,       color: "text-red-600",     bg: "bg-red-50"     },
};

const stageFlow = ["مسودة", "مرسل للتوقيع", "موقع", "نشط", "مكتمل"];

// ── Template variables available for insertion ────────────────────────────
const TEMPLATE_VARS = [
  "{اسم_العميل}", "{الرقم_المدني}", "{المنطقة}",
  "{القطعة}", "{القسيمة}", "{المساحة}",
  "{قيمة_العقد}", "{تاريخ_التوقيع}", "{رقم_العقد}",
];

const PREVIEW_DATA: Record<string, string> = {
  "{اسم_العميل}": "محمد أحمد الكويتي",
  "{الرقم_المدني}": "289123456789",
  "{المنطقة}": "خيطان",
  "{القطعة}": "5",
  "{القسيمة}": "123",
  "{المساحة}": "400 م²",
  "{قيمة_العقد}": "2٬500 د.ك",
  "{تاريخ_التوقيع}": new Date().toLocaleDateString("ar-KW"),
  "{رقم_العقد}": "CON-2026-001",
};

function applyPreview(text: string): string {
  return Object.entries(PREVIEW_DATA).reduce(
    (t, [k, v]) => t.replace(new RegExp(k.replace(/[{}]/g, "\\$&"), "g"), v),
    text
  );
}

const SECTIONS = [
  { key: "scopeOfWork",       label: "نطاق العمل" },
  { key: "terms",             label: "الشروط العامة" },
  { key: "party1Obligations", label: "التزامات الطرف الأول (العميل)" },
  { key: "party2Obligations", label: "التزامات الطرف الثاني (المكتب)" },
  { key: "paymentSchedule",   label: "جدول الدفعات" },
  { key: "duration",          label: "المدة الزمنية" },
  { key: "notes",             label: "ملاحظات" },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

interface TemplateForm {
  name: string;
  buildingType: string;
  serviceType: string;
  scopeOfWork: string;
  terms: string;
  party1Obligations: string;
  party2Obligations: string;
  paymentSchedule: string;
  duration: string;
  notes: string;
}

const emptyForm: TemplateForm = {
  name: "", buildingType: "", serviceType: "",
  scopeOfWork: "", terms: "", party1Obligations: "",
  party2Obligations: "", paymentSchedule: "", duration: "", notes: "",
};

// Count non-empty sections in a template
function countSections(t: ContractTemplate): number {
  return SECTIONS.filter((s) => (t[s.key] || "").trim().length > 0).length;
}

// ── Template Editor Dialog ────────────────────────────────────────────────
function TemplateEditorDialog({
  mode,
  initialData,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initialData: TemplateForm;
  onClose: () => void;
  onSave: (data: TemplateForm) => Promise<void>;
}) {
  const [form, setForm] = useState<TemplateForm>(initialData);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const setField = (key: keyof TemplateForm, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Insert variable at cursor in the focused textarea using onMouseDown+preventDefault
  const insertVariable = useCallback((v: string) => {
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement) || !el.dataset.field) {
      toast.info("انقر داخل أي حقل نصي أولاً ثم اختر المتغير");
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const field = el.dataset.field as keyof TemplateForm;
    const current = form[field] ?? "";
    const next = current.slice(0, start) + v + current.slice(end);
    setForm((p) => ({ ...p, [field]: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + v.length;
      el.setSelectionRange(pos, pos);
    });
  }, [form]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("يرجى إدخال اسم القالب"); return; }
    if (!form.buildingType.trim()) { toast.error("يرجى تحديد نوع العقار"); return; }
    setBusy(true);
    try {
      await onSave(form);
    } catch {
      toast.error("فشل حفظ القالب");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ direction: "rtl" }}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {mode === "create" ? "قالب جديد" : "تعديل القالب"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">اسم القالب *</label>
              <Input
                placeholder="مثال: تصميم+إشراف سكن خاص بناء جديد"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">نوع العقار *</label>
              <Select value={form.buildingType} onValueChange={(v) => setField("buildingType", v)}>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  {["سكن خاص", "استثماري", "تجاري", "صناعي", "خدمات", "خدمات بلدية"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">نوع الخدمة</label>
              <Select value={form.serviceType} onValueChange={(v) => setField("serviceType", v)}>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  {["بناء جديد", "تصميم", "إشراف", "تعديل وإضافة", "هدم", "توصيل كهرباء", "خدمات بلدية"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Variable insertion */}
          <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">إدراج متغير — انقر داخل أي حقل أولاً ثم اختر المتغير:</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="text-[11px] px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded font-mono hover:bg-blue-100 transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); insertVariable(v); }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Content sections */}
          {SECTIONS.map((section) => (
            <div key={section.key} className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{section.label}</label>
              <Textarea
                data-field={section.key}
                placeholder={`اكتب ${section.label} هنا...`}
                className="min-h-[90px] text-sm resize-y leading-relaxed"
                value={form[section.key]}
                onChange={(e) => setField(section.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-3.5 h-3.5 ml-1" />
            معاينة
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" disabled={busy} onClick={handleSave} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <Save className="w-3.5 h-3.5 ml-1" />}
            حفظ القالب
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Preview overlay */}
      {showPreview && (
        <Dialog open onOpenChange={() => setShowPreview(false)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ direction: "rtl" }}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                معاينة: {form.name}
                <Badge variant="outline" className="text-[10px]">{form.buildingType}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              {SECTIONS.map((section) => {
                const text = form[section.key]?.trim();
                if (!text) return null;
                return (
                  <div key={section.key}>
                    <h4 className="font-bold text-xs mb-1.5 pb-1 border-b"
                      style={{ color: "oklch(0.30 0.05 250)" }}>
                      {section.label}
                    </h4>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {applyPreview(text)}
                    </p>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

// ── Template View Dialog ──────────────────────────────────────────────────
function TemplateViewDialog({ template, onClose }: { template: ContractTemplate; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ direction: "rtl" }}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
            {template.name}
            <Badge variant="outline" className="text-[10px]">{template.buildingType}</Badge>
            <Badge variant="secondary" className="text-[10px]">{template.serviceType}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {SECTIONS.map((section) => {
            const text = template[section.key]?.trim();
            if (!text) return null;
            return (
              <div key={section.key}>
                <h4 className="font-bold text-xs mb-1.5 pb-1 border-b"
                  style={{ color: "oklch(0.30 0.05 250)" }}>
                  {section.label}
                </h4>
                <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{text}</p>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Contracts() {
  const { data: contracts = [], isLoading } = useContracts();
  const { data: templates = [], isLoading: templatesLoading } = useContractTemplates();
  const updateContract = useUpdateContract();
  const createTemplate = useCreateContractTemplate();
  const updateTemplate = useUpdateContractTemplate();
  const deleteTemplate = useDeleteContractTemplate();

  const [view, setView] = useState<"list" | "templates">("list");
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");

  // Template states
  const [templateEditor, setTemplateEditor] = useState<{
    open: boolean; mode: "create" | "edit"; id: number | null; data: TemplateForm;
  }>({ open: false, mode: "create", id: null, data: emptyForm });
  const [viewTemplate, setViewTemplate] = useState<ContractTemplate | null>(null);
  const [tSearch, setTSearch] = useState("");
  const [tBuildingFilter, setTBuildingFilter] = useState("الكل");

  const filtered = contracts.filter((c) => {
    const matchSearch = !search || c.client.includes(search) || c.id.includes(search) || (c.civilId || "").includes(search);
    const matchStatus = statusFilter === "الكل" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredTemplates = templates.filter((t) => {
    const matchSearch = !tSearch || t.name.includes(tSearch) || t.buildingType.includes(tSearch);
    const matchBuilding = tBuildingFilter === "الكل" || t.buildingType === tBuildingFilter;
    return matchSearch && matchBuilding;
  });

  const buildingTypes = [...new Set(templates.map((t) => t.buildingType))];

  async function handleExportPdf(e: React.MouseEvent, contract: typeof contracts[0]) {
    e.stopPropagation();
    setExportingId(contract.id);
    const tid = toast.loading("جاري تصدير PDF...");
    try {
      await exportContractPdf(contract);
      toast.success(`تم تحميل عقد ${contract.id}`, { id: tid });
    } catch (err: unknown) {
      const isBlocked = err instanceof Error && err.message === "popup_blocked";
      toast.error(isBlocked ? "السماح بالنوافذ المنبثقة مطلوب" : "فشل تصدير PDF", { id: tid });
    } finally {
      setExportingId(null);
    }
  }

  async function handleActivate(e: React.MouseEvent, contractId: string) {
    e.stopPropagation();
    setActivatingId(contractId);
    try {
      await updateContract.mutateAsync({ id: contractId, status: "نشط" });
      toast.success("تم تفعيل العقد");
    } catch {
      toast.error("فشل تفعيل العقد");
    } finally {
      setActivatingId(null);
    }
  }

  function openCreateTemplate() {
    setTemplateEditor({ open: true, mode: "create", id: null, data: emptyForm });
  }

  function openEditTemplate(t: ContractTemplate) {
    setTemplateEditor({
      open: true, mode: "edit", id: t.id,
      data: {
        name: t.name, buildingType: t.buildingType, serviceType: t.serviceType,
        scopeOfWork: t.scopeOfWork || "", terms: t.terms || "",
        party1Obligations: t.party1Obligations || "", party2Obligations: t.party2Obligations || "",
        paymentSchedule: t.paymentSchedule || "", duration: t.duration || "", notes: t.notes || "",
      },
    });
  }

  function openCopyTemplate(t: ContractTemplate) {
    setTemplateEditor({
      open: true, mode: "create", id: null,
      data: {
        name: `${t.name} (نسخة)`, buildingType: t.buildingType, serviceType: t.serviceType,
        scopeOfWork: t.scopeOfWork || "", terms: t.terms || "",
        party1Obligations: t.party1Obligations || "", party2Obligations: t.party2Obligations || "",
        paymentSchedule: t.paymentSchedule || "", duration: t.duration || "", notes: t.notes || "",
      },
    });
  }

  async function handleDeleteTemplate(t: ContractTemplate) {
    if (!window.confirm(`هل تريد حذف القالب "${t.name}"؟`)) return;
    try {
      await deleteTemplate.mutateAsync(t.id);
      toast.success("تم حذف القالب");
    } catch {
      toast.error("فشل حذف القالب");
    }
  }

  async function handleSaveTemplate(data: TemplateForm) {
    if (templateEditor.mode === "edit" && templateEditor.id) {
      await updateTemplate.mutateAsync({ id: templateEditor.id, ...data });
      toast.success("تم تحديث القالب");
    } else {
      await createTemplate.mutateAsync(data);
      toast.success("تم إنشاء القالب");
    }
    setTemplateEditor({ open: false, mode: "create", id: null, data: emptyForm });
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}
            style={view === "list" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            العقود
          </Button>
          <Button variant={view === "templates" ? "default" : "outline"} size="sm" onClick={() => setView("templates")}
            style={view === "templates" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            قوالب العقود ({templates.length})
          </Button>
        </div>
        {view === "templates" ? (
          <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }} onClick={openCreateTemplate}>
            <Plus className="w-4 h-4 ml-2" />
            قالب جديد
          </Button>
        ) : (
          <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
            <Plus className="w-4 h-4 ml-2" />
            عقد جديد
          </Button>
        )}
      </div>

      {view === "list" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stageFlow.map((stage) => {
              const count = contracts.filter((c) => c.status === stage).length;
              const st = statusConfig[stage];
              return (
                <Card key={stage} className="border-0 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${st.bg}`}>
                      <st.icon className={`w-4 h-4 ${st.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stage}</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{count}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="بحث بالاسم أو الرقم المدني..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">كل الحالات</SelectItem>
                {stageFlow.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                <SelectItem value="ملغي">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contracts Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right py-3 px-4 font-medium w-8"></th>
                      <th className="text-right py-3 px-4 font-medium">رقم العقد</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">نوع العقد</th>
                      <th className="text-right py-3 px-4 font-medium">القيمة (د.ك)</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const st = statusConfig[c.status] ?? { icon: FileText, color: "text-gray-500", bg: "bg-gray-50" };
                      const isExpanded = expandedContract === c.id;
                      return (
                        <>
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setExpandedContract(isExpanded ? null : c.id)}>
                            <td className="py-3 px-4">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                              {c.id}
                              {c.leadId && (
                                <Link href="/crm">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 ms-1 cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-600">CRM</Badge>
                                </Link>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium">{c.client}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate"
                              title={c.templateType || c.template || `${c.type} - ${c.service}`}>
                              {c.templateType || c.template || `${c.type} - ${c.service}`}
                            </td>
                            <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{c.amount}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{c.status}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="تصدير PDF"
                                  disabled={exportingId === c.id}
                                  onClick={(e) => handleExportPdf(e, c)}>
                                  {exportingId === c.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Download className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={c.id + "-detail"} className="bg-muted/10">
                              <td colSpan={7} className="py-4 px-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">معلومات العقد</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">القالب:</span><span className="font-medium text-xs">{c.templateType || c.template}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الإنشاء:</span><span dir="ltr">{c.date}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">تاريخ التوقيع:</span><span dir="ltr">{c.signingDate || "—"}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">الباقة:</span><span>{c.package}</span></div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">بيانات العميل والموقع</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">الرقم المدني:</span><span dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{c.civilId}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">المنطقة:</span><span>{c.area}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">القطعة:</span><span>{c.block}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">رقم القسيمة:</span><span>{c.plot}</span></div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">روابط وإجراءات</h4>
                                    <div className="space-y-2">
                                      {c.quotationId && (
                                        <Link href="/quotations">
                                          <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8">
                                            <ExternalLink className="w-3 h-3" />عرض السعر المرتبط
                                          </Button>
                                        </Link>
                                      )}
                                      {c.projectId && (
                                        <Link href={`/projects/${c.projectId}`}>
                                          <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8">
                                            <ExternalLink className="w-3 h-3" />المشروع: {c.projectId}
                                          </Button>
                                        </Link>
                                      )}
                                      {c.leadId && (
                                        <Link href="/crm">
                                          <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8">
                                            <ExternalLink className="w-3 h-3" />فرصة CRM
                                          </Button>
                                        </Link>
                                      )}
                                      {c.signedFileUrl && (
                                        <a href={c.signedFileUrl} target="_blank" rel="noopener noreferrer">
                                          <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8 border-green-300 text-green-700 hover:bg-green-50">
                                            <Download className="w-3 h-3" />العقد الموقع (PDF)
                                          </Button>
                                        </a>
                                      )}
                                      {c.status === "مسودة" && (
                                        <Button size="sm" className="w-full text-xs h-8 text-white"
                                          style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                                          disabled={activatingId === c.id}
                                          onClick={(e) => handleActivate(e, c.id)}>
                                          {activatingId === c.id
                                            ? <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                                            : <CheckCircle2 className="w-3 h-3 ml-1" />}
                                          تفعيل العقد
                                        </Button>
                                      )}
                                      <div className="mt-2">
                                        <div className="flex items-center gap-0.5">
                                          {stageFlow.map((stage, idx) => {
                                            const currentIdx = stageFlow.indexOf(c.status);
                                            const isCompleted = idx <= currentIdx;
                                            const isCurrent = idx === currentIdx;
                                            return (
                                              <div key={stage} className="flex items-center gap-0.5 flex-1">
                                                <div className="w-full h-2 rounded-full transition-colors"
                                                  style={isCompleted
                                                    ? { backgroundColor: isCurrent ? "oklch(0.72 0.10 60)" : "oklch(0.55 0.15 150)" }
                                                    : { backgroundColor: "#e5e7eb" }} />
                                              </div>
                                            );
                                          })}
                                        </div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-[10px] text-muted-foreground">مسودة</span>
                                          <span className="text-[10px] text-muted-foreground">مكتمل</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                          لا توجد عقود مطابقة للبحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* ── Contract Templates Tab ──────────────────────────────────────── */
        <>
          <p className="text-sm text-muted-foreground">
            {templates.length} قالب عقد هندسي — قابل للتعديل والنسخ
          </p>

          {/* Template Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="بحث بالاسم أو نوع العقار..."
              className="max-w-xs"
              value={tSearch}
              onChange={(e) => setTSearch(e.target.value)}
            />
            <Select value={tBuildingFilter} onValueChange={setTBuildingFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="نوع العقار" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">كل الأنواع</SelectItem>
                {buildingTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {templatesLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">جاري التحميل...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-right py-3 px-4 font-medium">اسم القالب</th>
                        <th className="text-right py-3 px-4 font-medium">نوع العقار</th>
                        <th className="text-right py-3 px-4 font-medium">نوع الخدمة</th>
                        <th className="text-right py-3 px-4 font-medium">البنود</th>
                        <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTemplates.map((t) => (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 font-medium">
                            {t.name}
                            {t.isDefault === 1 && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 ms-2 border-gold text-amber-600">افتراضي</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{t.buildingType}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{t.serviceType}</td>
                          <td className="py-3 px-4 text-xs">
                            <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono">
                              {countSections(t)}/7
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض"
                                onClick={() => setViewTemplate(t)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="تعديل"
                                onClick={() => openEditTemplate(t)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="نسخ"
                                onClick={() => openCopyTemplate(t)}>
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="حذف"
                                onClick={() => handleDeleteTemplate(t)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTemplates.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                            لا توجد قوالب مطابقة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Template Editor Dialog */}
      {templateEditor.open && (
        <TemplateEditorDialog
          mode={templateEditor.mode}
          initialData={templateEditor.data}
          onClose={() => setTemplateEditor({ open: false, mode: "create", id: null, data: emptyForm })}
          onSave={handleSaveTemplate}
        />
      )}

      {/* Template View Dialog */}
      {viewTemplate && (
        <TemplateViewDialog
          template={viewTemplate}
          onClose={() => setViewTemplate(null)}
        />
      )}
    </div>
  );
}
