/**
 * Design: Desert Oasis Professional
 * Contracts - العقود الهندسية
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  useContracts, useUpdateContract, useCreateContract, useClients, useProjects,
  useContractTemplates, useCreateContractTemplate, useUpdateContractTemplate, useDeleteContractTemplate,
  useCreateClient,
  type ContractTemplate, type Contract, type Client,
} from "@/lib/api";
import { exportContractPdf, buildPage, contractBody } from "@/lib/pdf";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, FileSignature, Download, Eye,
  FileText, CheckCircle2, XCircle, Send,
  ChevronDown, ChevronUp, Loader2, ExternalLink,
  Pencil, Copy, Trash2, Save,
  Bold, Underline, AlignRight, AlignLeft, AlignCenter,
  Palette, Type, MessageSquare, Building2,
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

function applyPreview(html: string): string {
  return Object.entries(PREVIEW_DATA).reduce(
    (t, [k, v]) => t.replace(new RegExp(k.replace(/[{}]/g, "\\$&"), "g"), v),
    html
  );
}

// Convert old multi-field template to HTML content
function templateToHtml(t: Partial<ContractTemplate>): string {
  if (t.content && t.content.trim()) return t.content;
  // Migrate from old fields
  const sections = [
    { label: "نطاق العمل", value: t.scopeOfWork },
    { label: "الشروط العامة", value: t.terms },
    { label: "التزامات الطرف الأول (العميل)", value: t.party1Obligations },
    { label: "التزامات الطرف الثاني (المكتب)", value: t.party2Obligations },
    { label: "جدول الدفعات", value: t.paymentSchedule },
    { label: "المدة الزمنية", value: t.duration },
    { label: "ملاحظات", value: t.notes },
  ].filter((s) => s.value && s.value.trim());
  if (sections.length === 0) return "";
  return sections
    .map((s) => `<p><strong>${s.label}:</strong></p><p>${s.value!.replace(/\n/g, "<br/>")}</p>`)
    .join("<p><br/></p>");
}

const FONT_SIZES = ["12", "14", "16", "18", "20", "22", "24", "28", "32"];
const TEXT_COLORS = [
  { label: "أسود", value: "#000000" },
  { label: "رمادي", value: "#6b7280" },
  { label: "أزرق", value: "#1d4ed8" },
  { label: "أخضر", value: "#15803d" },
  { label: "أحمر", value: "#b91c1c" },
  { label: "بني", value: "#92400e" },
];

interface TemplateForm {
  name: string;
  buildingType: string;
  serviceType: string;
  content: string;
  // Legacy fields kept for backward compat
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
  content: "",
  scopeOfWork: "", terms: "", party1Obligations: "",
  party2Obligations: "", paymentSchedule: "", duration: "", notes: "",
};

// Count non-empty sections in a template
function countSections(t: ContractTemplate): number {
  if (t.content && t.content.trim()) return 1;
  const SECTIONS = ["scopeOfWork", "terms", "party1Obligations", "party2Obligations", "paymentSchedule", "duration", "notes"] as const;
  return SECTIONS.filter((s) => (t[s] || "").trim().length > 0).length;
}

// ── Rich Text Editor ──────────────────────────────────────────────────────
function RichTextEditor({
  value,
  onChange,
  onInsertVar,
}: {
  value: string;
  onChange: (html: string) => void;
  onInsertVar: (insert: () => void) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState("16");
  const [textColor, setTextColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const savedRangeRef = useRef<Range | null>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, []);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    onChange(editorRef.current?.innerHTML || "");
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  // Expose insert function to parent
  useEffect(() => {
    onInsertVar(() => (varText: string) => {
      restoreRange();
      editorRef.current?.focus();
      document.execCommand("insertText", false, varText);
      onChange(editorRef.current?.innerHTML || "");
    });
  }, []);

  const insertVarInEditor = useCallback((varText: string) => {
    restoreRange();
    editorRef.current?.focus();
    document.execCommand("insertText", false, varText);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  // Expose to parent via ref callback
  useEffect(() => {
    onInsertVar(insertVarInEditor as unknown as () => void);
  }, [insertVarInEditor]);

  return (
    <div className="border rounded-lg overflow-hidden" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
        {/* Bold */}
        <button
          type="button"
          title="غامق"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          title="تسطير"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <Type className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            className="text-xs border rounded px-1 py-0.5 bg-background h-7"
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              exec("fontSize", "7"); // placeholder
              // Use CSS instead
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                const range = sel.getRangeAt(0);
                const span = document.createElement("span");
                span.style.fontSize = e.target.value + "px";
                range.surroundContents(span);
                onChange(editorRef.current?.innerHTML || "");
              }
            }}
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            title="لون النص"
            className="p-1.5 rounded hover:bg-muted transition-colors flex items-center gap-1"
            onMouseDown={(e) => {
              e.preventDefault();
              saveRange();
              setShowColorPicker((v) => !v);
            }}
          >
            <Palette className="w-4 h-4" />
            <div className="w-3 h-1.5 rounded-sm border" style={{ backgroundColor: textColor }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white border rounded-lg shadow-lg p-2 flex flex-wrap gap-1.5 w-36">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className="w-7 h-7 rounded border-2 border-transparent hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: c.value }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    restoreRange();
                    setTextColor(c.value);
                    exec("foreColor", c.value);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Alignment */}
        <button
          type="button"
          title="محاذاة يمين"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="محاذاة وسط"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="محاذاة يسار"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        className="min-h-[320px] p-4 text-sm leading-relaxed focus:outline-none"
        style={{ fontFamily: "inherit", direction: "rtl", textAlign: "right" }}
        onInput={handleInput}
        onMouseUp={saveRange}
        onKeyUp={saveRange}
        onFocus={saveRange}
        data-placeholder="اكتب اشتراطات العقد هنا..."
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
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
  const [form, setForm] = useState<TemplateForm>({
    ...initialData,
    content: initialData.content || templateToHtml(initialData),
  });
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const insertVarFnRef = useRef<((v: string) => void) | null>(null);

  const setField = (key: keyof TemplateForm, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const insertVariable = useCallback((v: string) => {
    if (insertVarFnRef.current) {
      insertVarFnRef.current(v);
    } else {
      toast.info("انقر داخل حقل الكتابة أولاً ثم اختر المتغير");
    }
  }, []);

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
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" style={{ direction: "rtl" }}>
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
            <p className="text-xs font-medium text-muted-foreground">إدراج متغير — ضع المؤشر في مكان الإدراج ثم اضغط على المتغير:</p>
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

          {/* Rich Text Editor - Single field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">اشتراطات العقد</label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setField("content", html)}
              onInsertVar={(fn) => { insertVarFnRef.current = fn as unknown as (v: string) => void; }}
            />
          </div>
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
            <div
              className="text-sm leading-relaxed"
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: applyPreview(form.content) }}
            />
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
  const htmlContent = templateToHtml(template);
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
        <div
          className="text-sm leading-relaxed"
          dir="rtl"
          dangerouslySetInnerHTML={{ __html: htmlContent || "<p class='text-muted-foreground'>لا يوجد محتوى</p>" }}
        />
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
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects();
  const updateContract = useUpdateContract();
  const createContract = useCreateContract();
  const createClient = useCreateClient();
  const createTemplate = useCreateContractTemplate();
  const updateTemplate = useUpdateContractTemplate();
  const deleteTemplate = useDeleteContractTemplate();
  const [view, setView] = useState<"list" | "templates">("list");
  // Preview state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  // Notify state
  const [notifyContract, setNotifyContract] = useState<Contract | null>(null);
  const [showNewContract, setShowNewContract] = useState(false);
  const [newContractForm, setNewContractForm] = useState({
    clientId: "",
    projectId: "",
    selectedTemplateId: 0,
    civilId: "",
    area: "",
    block: "",
    plot: "",
    amount: "",
    signingDate: new Date().toISOString().slice(0, 10),
  });
  const [newContractBusy, setNewContractBusy] = useState(false);
  // New client inline form
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: "", phone: "", civilId: "", area: "", block: "", plot: "",
  });

  const handleCreateContract = async () => {
    if (isNewClient && !newClientForm.name.trim()) { toast.error("يرجى إدخال اسم العميل"); return; }
    if (!newContractForm.civilId.trim() && !newClientForm.civilId.trim()) { toast.error("يرجى إدخال الرقم المدني"); return; }
    if (!newContractForm.selectedTemplateId) { toast.error("يرجى اختيار قالب العقد"); return; }
    setNewContractBusy(true);
    try {
      const selectedTemplate = templates.find(t => t.id === newContractForm.selectedTemplateId);
      // Create new client if needed
      let selectedClient: Client | undefined = clients.find(c => c.id === newContractForm.clientId);
      let finalClientId = newContractForm.clientId;
      if (isNewClient && newClientForm.name.trim()) {
        const created = await createClient.mutateAsync({
          name: newClientForm.name,
          phone: newClientForm.phone,
          civilId: newClientForm.civilId,
          area: newClientForm.area,
          block: newClientForm.block,
          plot: newClientForm.plot,
          status: "active",
        });
        selectedClient = created;
        finalClientId = created.id;
        // Auto-fill contract fields from new client
        if (!newContractForm.civilId && newClientForm.civilId) {
          newContractForm.civilId = newClientForm.civilId;
        }
        if (!newContractForm.area && newClientForm.area) newContractForm.area = newClientForm.area;
        if (!newContractForm.block && newClientForm.block) newContractForm.block = newClientForm.block;
        if (!newContractForm.plot && newClientForm.plot) newContractForm.plot = newClientForm.plot;
      }
      const termsText = selectedTemplate
        ? JSON.stringify({
            scopeOfWork: selectedTemplate.scopeOfWork,
            terms: selectedTemplate.terms,
            party1Obligations: selectedTemplate.party1Obligations,
            party2Obligations: selectedTemplate.party2Obligations,
            paymentSchedule: selectedTemplate.paymentSchedule,
            duration: selectedTemplate.duration,
            notes: selectedTemplate.notes,
            content: (selectedTemplate as any).content,
          })
        : "";
      await createContract.mutateAsync({
        client: selectedClient?.name || (isNewClient ? newClientForm.name : ""),
        clientId: finalClientId || null,
        quotationId: null,
        projectId: newContractForm.projectId || null,
        type: selectedTemplate?.buildingType || "",
        service: selectedTemplate?.serviceType || "",
        package: "",
        template: selectedTemplate?.name || "",
        status: "مسودة",
        date: new Date().toISOString().slice(0, 10),
        amount: newContractForm.amount,
        civilId: newContractForm.civilId,
        area: newContractForm.area,
        block: newContractForm.block,
        plot: newContractForm.plot,
        leadId: "",
        templateType: selectedTemplate?.name || "",
        termsText,
        signingDate: newContractForm.signingDate,
      });
      toast.success("تم إنشاء العقد بنجاح");
      setShowNewContract(false);
      setIsNewClient(false);
      setNewClientForm({ name: "", phone: "", civilId: "", area: "", block: "", plot: "" });
      setNewContractForm({ clientId: "", projectId: "", selectedTemplateId: 0, civilId: "", area: "", block: "", plot: "", amount: "", signingDate: new Date().toISOString().slice(0, 10) });
    } catch {
      toast.error("فشل إنشاء العقد");
    } finally {
      setNewContractBusy(false);
    }
  };
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

  function handlePreviewContract(e: React.MouseEvent, contract: Contract) {
    e.stopPropagation();
    const html = buildPage(contractBody(contract), `عقد ${contract.id}`);
    // Remove auto-print script for preview
    const previewHtmlClean = html.replace(/<script>[\s\S]*?<\/script>/g, '');
    setPreviewHtml(previewHtmlClean);
  }

  function handleNotifyWhatsApp(e: React.MouseEvent, contract: Contract) {
    e.stopPropagation();
    const client = clients.find(cl => cl.id === contract.clientId);
    const phone = client?.phone?.replace(/[^0-9]/g, '') || '';
    const intlPhone = phone.startsWith('965') ? phone : `965${phone}`;
    const msg = encodeURIComponent(
      `السلام عليكم ${contract.client || ''}،\n` +
      `نود إشعاركم بأنه تم إعداد عقد الخدمات الهندسية رقم (${contract.id}) الخاص بكم.\n` +
      `نوع العقد: ${contract.templateType || contract.template || contract.type || ''}\n` +
      `قيمة العقد: ${contract.amount} دينار كويتي\n` +
      `يرجى التواصل معنا لمراجعة العقد والتوقيع.\n` +
      `مكتب ديناميك للاستشارات الهندسية`
    );
    window.open(`https://wa.me/${intlPhone}?text=${msg}`, '_blank');
  }

  function openCreateTemplate() {
    setTemplateEditor({ open: true, mode: "create", id: null, data: emptyForm });
  }

  function openEditTemplate(t: ContractTemplate) {
    setTemplateEditor({
      open: true, mode: "edit", id: t.id,
      data: {
        name: t.name, buildingType: t.buildingType, serviceType: t.serviceType,
        content: t.content || templateToHtml(t),
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
        content: t.content || templateToHtml(t),
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
          <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }} onClick={() => setShowNewContract(true)}>
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
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="معاينة العقد"
                                  onClick={(e) => handlePreviewContract(e, c)}>
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="تصدير PDF"
                                  disabled={exportingId === c.id}
                                  onClick={(e) => handleExportPdf(e, c)}>
                                  {exportingId === c.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Download className="w-3.5 h-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="إشعار واتساب"
                                  onClick={(e) => handleNotifyWhatsApp(e, c)}>
                                  <MessageSquare className="w-3.5 h-3.5" />
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

          {/* Templates Cards Grid */}
          {templatesLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">جاري التحميل...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">لا توجد قوالب مطابقة</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((t) => (
                <Card key={t.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight line-clamp-2">{t.name}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{t.buildingType}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{t.serviceType}</Badge>
                          {t.isDefault === 1 && (
                            <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-600">افتراضي</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                        {(t.content && t.content.trim()) ? "✓" : `${countSections(t)}/7`}
                      </span>
                    </div>

                    {/* Content preview */}
                    <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {t.content
                        ? t.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) + "..."
                        : [t.scopeOfWork, t.terms, t.party1Obligations].filter(Boolean).join(" · ").slice(0, 120) + "..."
                      }
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
                        onClick={() => openEditTemplate(t)}>
                        <Pencil className="w-3 h-3 ml-1" />تعديل
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="عرض"
                        onClick={() => setViewTemplate(t)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="نسخ"
                        onClick={() => openCopyTemplate(t)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="حذف" onClick={() => handleDeleteTemplate(t)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

      {/* New Contract Dialog */}
      {showNewContract && (
        <Dialog open onOpenChange={() => setShowNewContract(false)}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" />
                إنشاء عقد جديد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Client */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">العميل</label>
                <Select
                  value={isNewClient ? "__new__" : newContractForm.clientId}
                  onValueChange={(v) => {
                    if (v === "__new__") {
                      setIsNewClient(true);
                      setNewContractForm(p => ({ ...p, clientId: "", civilId: "", area: "", block: "", plot: "" }));
                    } else {
                      setIsNewClient(false);
                      const cl = clients.find(c => c.id === v);
                      setNewContractForm(p => ({
                        ...p,
                        clientId: v,
                        civilId: cl?.civilId || p.civilId,
                        area: cl?.area || p.area,
                        block: cl?.block || p.block,
                        plot: cl?.plot || p.plot,
                      }));
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="اختر العميل..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__" className="text-primary font-medium">+ عميل جديد</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Inline new client form */}
                {isNewClient && (
                  <div className="border border-primary/30 rounded-lg p-3 space-y-3 bg-primary/5 mt-2">
                    <p className="text-xs font-medium text-primary">بيانات العميل الجديد</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs text-muted-foreground">الاسم <span className="text-red-500">*</span></label>
                        <Input placeholder="اسم العميل" value={newClientForm.name}
                          onChange={e => setNewClientForm(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">رقم الهاتف</label>
                        <Input placeholder="5XXXXXXXX" dir="ltr" value={newClientForm.phone}
                          onChange={e => setNewClientForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">الرقم المدني</label>
                        <Input placeholder="2XXXXXXXXXX" dir="ltr" value={newClientForm.civilId}
                          onChange={e => {
                            const v = e.target.value;
                            setNewClientForm(p => ({ ...p, civilId: v }));
                            setNewContractForm(p => ({ ...p, civilId: v }));
                          }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">المنطقة</label>
                        <Input placeholder="المنطقة" value={newClientForm.area}
                          onChange={e => {
                            const v = e.target.value;
                            setNewClientForm(p => ({ ...p, area: v }));
                            setNewContractForm(p => ({ ...p, area: v }));
                          }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">القطعة</label>
                        <Input placeholder="رقم القطعة" value={newClientForm.block}
                          onChange={e => {
                            const v = e.target.value;
                            setNewClientForm(p => ({ ...p, block: v }));
                            setNewContractForm(p => ({ ...p, block: v }));
                          }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">القسيمة</label>
                        <Input placeholder="رقم القسيمة" value={newClientForm.plot}
                          onChange={e => {
                            const v = e.target.value;
                            setNewClientForm(p => ({ ...p, plot: v }));
                            setNewContractForm(p => ({ ...p, plot: v }));
                          }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Template */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نوع/قالب العقد <span className="text-red-500">*</span></label>
                <Select
                  value={newContractForm.selectedTemplateId ? String(newContractForm.selectedTemplateId) : ""}
                  onValueChange={(v) => setNewContractForm(p => ({ ...p, selectedTemplateId: parseInt(v, 10) }))}
                >
                  <SelectTrigger><SelectValue placeholder={templatesLoading ? "جاري التحميل..." : "اختر قالب العقد..."} /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        <span className="text-muted-foreground text-xs ml-1">{t.id}.</span> {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Project Link */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />ربط بمشروع (اختياري)</label>
                <Select
                  value={newContractForm.projectId || "none"}
                  onValueChange={(v) => setNewContractForm(p => ({ ...p, projectId: v === "none" ? "" : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="اختر مشروعاً (اختياري)..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون مشروع</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="text-muted-foreground text-xs ml-1">{p.id}</span> {p.name || p.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Civil ID + Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الرقم المدني <span className="text-red-500">*</span></label>
                  <Input placeholder="2XXXXXXXXXX" dir="ltr" value={newContractForm.civilId}
                    onChange={(e) => setNewContractForm(p => ({ ...p, civilId: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">قيمة العقد (د.ك)</label>
                  <Input type="number" dir="ltr" value={newContractForm.amount}
                    onChange={(e) => setNewContractForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">المنطقة</label>
                  <Input placeholder="المنطقة" value={newContractForm.area}
                    onChange={(e) => setNewContractForm(p => ({ ...p, area: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">القطعة</label>
                  <Input placeholder="رقم القطعة" value={newContractForm.plot}
                    onChange={(e) => setNewContractForm(p => ({ ...p, plot: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">القسيمة</label>
                  <Input placeholder="رقم القسيمة" value={newContractForm.block}
                    onChange={(e) => setNewContractForm(p => ({ ...p, block: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">تاريخ التوقيع</label>
                  <Input type="date" dir="ltr" value={newContractForm.signingDate}
                    onChange={(e) => setNewContractForm(p => ({ ...p, signingDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowNewContract(false)}>إلغاء</Button>
              <Button disabled={newContractBusy} onClick={handleCreateContract}
                style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                {newContractBusy ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <Save className="w-3.5 h-3.5 ml-1" />}
                إنشاء العقد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Contract Preview Dialog ── */}
      {previewHtml && (
        <Dialog open onOpenChange={() => setPreviewHtml(null)}>
          <DialogContent className="max-w-4xl w-full p-0 overflow-hidden" style={{ height: '90vh' }}>
            <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between">
              <DialogTitle className="text-sm font-semibold">معاينة العقد</DialogTitle>
              <Button variant="outline" size="sm" onClick={() => setPreviewHtml(null)}>إغلاق</Button>
            </DialogHeader>
            <iframe
              srcDoc={previewHtml}
              className="w-full border-0"
              style={{ height: 'calc(90vh - 60px)' }}
              title="معاينة العقد"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
