/**
 * Settings - صفحة الإعدادات المركزية
 * تجمع: عروض الأسعار (الباقات) | العقود الهندسية (القوالب) | خطط العمل | المناطق والمحافظات
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Pencil, Save, X, MapPin, FileText, FileSignature, ClipboardList,
  ChevronDown, ChevronUp, CheckCircle, Loader2, Building2,
  Bold, Underline, AlignRight, AlignLeft, AlignCenter, Type, Palette
} from "lucide-react";
import { toast } from "sonner";
import {
  usePackages, useCreatePackage, useUpdatePackage, useDeletePackage,
  useContractTemplates, useCreateContractTemplate, useUpdateContractTemplate, useDeleteContractTemplate,
  useGovernorateAreas, useAddGovernorateArea, useUpdateGovernorateArea, useDeleteGovernorateArea,
  useAddGovernorate, useDeleteGovernorate,
  type DbPackage,
} from "@/lib/api";

// ── نوع الباقة ────────────────────────────────────────────────────────────────
type PkgForm = { name: string; price: string; buildingType: string; serviceType: string; level: string; features: string[] };
const emptyPkg: PkgForm = { name: "", price: "", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "-", features: [] };

// ── تبويب عروض الأسعار (الباقات) ─────────────────────────────────────────────
function PackagesTab() {
  const { data: packages = {} } = usePackages();
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();
  const deletePkg = useDeletePackage();

  const [selectedType, setSelectedType] = useState("الكل");
  const [showAdd, setShowAdd] = useState(false);
  const [editingPkg, setEditingPkg] = useState<(PkgForm & { id?: number }) | null>(null);
  const [form, setForm] = useState<PkgForm>(emptyPkg);
  const [featuresText, setFeaturesText] = useState("");

  const flatPkgs = Object.values(packages).flat();
  const filtered = selectedType === "الكل" ? flatPkgs : (packages[selectedType] || []);

  const openAdd = () => {
    setForm(emptyPkg);
    setFeaturesText("");
    setShowAdd(true);
  };

  const openEdit = (pkg: DbPackage) => {
    setEditingPkg(pkg);
    setForm({ name: pkg.name, price: pkg.price, buildingType: pkg.buildingType, serviceType: pkg.serviceType, level: pkg.level, features: pkg.features });
    setFeaturesText(pkg.features.join("\n"));
  };

  const handleSaveNew = async () => {
    if (!form.name.trim()) { toast.error("يرجى إدخال اسم الباقة"); return; }
    await createPkg.mutateAsync({ ...form, features: featuresText.split("\n").map(f => f.trim()).filter(Boolean) });
    toast.success("تم إضافة الباقة");
    setShowAdd(false);
  };

  const handleSaveEdit = async () => {
    if (!editingPkg?.id) return;
    await updatePkg.mutateAsync({ id: editingPkg.id, ...form, features: featuresText.split("\n").map(f => f.trim()).filter(Boolean) } as DbPackage);
    toast.success("تم تحديث الباقة");
    setEditingPkg(null);
  };

  const handleDelete = async (pkg: DbPackage) => {
    if (!pkg.id) return;
    if (!confirm(`حذف باقة "${pkg.name}"؟`)) return;
    await deletePkg.mutateAsync(pkg.id);
    toast.success("تم حذف الباقة");
  };

  const BUILDING_TYPES = ["سكن خاص", "استثماري", "تجاري", "صناعي"];
  const SERVICE_TYPES = ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم", "إشراف"];

  return (
    <div className="space-y-4">
      {/* فلتر + زر إضافة */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {["الكل", ...BUILDING_TYPES].map(bt => (
            <Button key={bt} size="sm" variant={selectedType === bt ? "default" : "outline"}
              style={selectedType === bt ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}
              onClick={() => setSelectedType(bt)}>
              {bt}
              <Badge variant="secondary" className="mr-1.5 text-[10px] px-1.5">
                {bt === "الكل" ? flatPkgs.length : (packages[bt]?.length || 0)}
              </Badge>
            </Button>
          ))}
        </div>
        <Button size="sm" style={{ backgroundColor: "oklch(0.55 0.15 150)" }} onClick={openAdd}>
          <Plus className="w-4 h-4 ml-1" /> باقة جديدة
        </Button>
      </div>

      {/* شبكة الباقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((pkg, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm leading-tight">{pkg.name}</CardTitle>
                <div className="flex gap-1">
                  {pkg.level !== "-" && (
                    <Badge className="text-[10px] text-white shrink-0" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{pkg.level}</Badge>
                  )}
                  <button onClick={() => openEdit(pkg)} className="text-blue-400 hover:text-blue-600 p-0.5" title="تعديل">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(pkg)} className="text-red-400 hover:text-red-600 p-0.5" title="حذف">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px]">{pkg.buildingType}</Badge>
                <Badge variant="secondary" className="text-[10px]">{pkg.serviceType}</Badge>
              </div>
              <p className="text-2xl font-bold mt-2" style={{ color: "oklch(0.72 0.10 60)", fontFamily: "'Space Grotesk'" }}>
                {pkg.price} <span className="text-sm font-normal">د.ك</span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {pkg.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.55 0.15 150)" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm">لا توجد باقات لهذا النوع</div>
        )}
      </div>

      {/* Dialog إضافة */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>باقة جديدة</DialogTitle></DialogHeader>
          <PkgFormFields form={form} setForm={setForm} featuresText={featuresText} setFeaturesText={setFeaturesText}
            buildingTypes={BUILDING_TYPES} serviceTypes={SERVICE_TYPES} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button onClick={handleSaveNew} disabled={createPkg.isPending}>
              {createPkg.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog تعديل */}
      <Dialog open={!!editingPkg} onOpenChange={() => setEditingPkg(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>تعديل الباقة</DialogTitle></DialogHeader>
          <PkgFormFields form={form} setForm={setForm} featuresText={featuresText} setFeaturesText={setFeaturesText}
            buildingTypes={BUILDING_TYPES} serviceTypes={SERVICE_TYPES} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPkg(null)}>إلغاء</Button>
            <Button onClick={handleSaveEdit} disabled={updatePkg.isPending}>
              {updatePkg.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PkgFormFields({ form, setForm, featuresText, setFeaturesText, buildingTypes, serviceTypes }: {
  form: PkgForm;
  setForm: (f: PkgForm) => void;
  featuresText: string;
  setFeaturesText: (t: string) => void;
  buildingTypes: string[];
  serviceTypes: string[];
}) {
  return (
    <div className="space-y-3 py-2">
      <div>
        <label className="text-sm font-medium mb-1 block">اسم الباقة</label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: الباقة الأساسية - سكن خاص" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">نوع المبنى</label>
          <Select value={form.buildingType} onValueChange={v => setForm({ ...form, buildingType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{buildingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">نوع الخدمة</label>
          <Select value={form.serviceType} onValueChange={v => setForm({ ...form, serviceType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{serviceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">السعر (د.ك)</label>
          <Input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="1500" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">المستوى</label>
          <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["-", "Basic", "Premium", "Gold", "Supervision"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">المميزات (سطر لكل ميزة)</label>
        <Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)}
          placeholder={"التصميم المعماري\nالتصميم الإنشائي\nإصدار رخصة البلدية"} rows={5} />
      </div>
    </div>
  );
}

// ── تبويب العقود الهندسية (القوالب) ──────────────────────────────────────────
function ContractTemplatesTab() {
  const { data: templates = [], isLoading } = useContractTemplates();
  const createTemplate = useCreateContractTemplate();
  const updateTemplate = useUpdateContractTemplate();
  const deleteTemplate = useDeleteContractTemplate();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", buildingType: "سكن خاص", serviceType: "إشراف", content: "" });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const BUILDING_TYPES_T = ["سكن خاص", "استثماري", "تجاري", "صناعي"];
  const SERVICE_TYPES_T = ["إشراف", "تصميم", "تصميم وإشراف", "بناء جديد", "تعديل وإضافة", "استشارة", "أخرى"];

  const handleSaveNew = async () => {
    if (!form.name.trim()) { toast.error("يرجى إدخال اسم القالب"); return; }
    await createTemplate.mutateAsync({ ...form, createdAt: new Date().toISOString().slice(0, 10) });
    toast.success("تم إضافة القالب");
    setShowAdd(false);
    setForm({ name: "", buildingType: "سكن خاص", serviceType: "إشراف", content: "" });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateTemplate.mutateAsync({ id: editingId, ...form });
    toast.success("تم تحديث القالب");
    setEditingId(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`حذف قالب "${name}"؟`)) return;
    await deleteTemplate.mutateAsync(id);
    toast.success("تم حذف القالب");
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({ name: t.name, buildingType: t.buildingType || "سكن خاص", serviceType: t.serviceType || "إشراف", content: t.content || "" });
  };

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" style={{ backgroundColor: "oklch(0.30 0.05 250)" }} onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 ml-1" /> قالب جديد
        </Button>
      </div>

      <div className="space-y-2">
        {templates.map((t: any) => (
          <Card key={t.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="text-muted-foreground">
                    {expandedId === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{t.type || "—"}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {t.content ? `${Math.round(t.content.length / 100) * 100} حرف` : "فارغ"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"
                    onClick={() => handleDelete(t.id, t.name)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {expandedId === t.id && t.content && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground max-h-40 overflow-y-auto leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: t.content.substring(0, 800) + (t.content.length > 800 ? "..." : "") }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">لا توجد قوالب عقود</div>
        )}
      </div>

      {/* Dialog إضافة */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader><DialogTitle>قالب عقد جديد</DialogTitle></DialogHeader>
          <TemplateFormFields form={form} setForm={setForm} buildingTypes={BUILDING_TYPES_T} serviceTypes={SERVICE_TYPES_T} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button onClick={handleSaveNew} disabled={createTemplate.isPending}>
              {createTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog تعديل */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader><DialogTitle>تعديل القالب</DialogTitle></DialogHeader>
          <TemplateFormFields form={form} setForm={setForm} buildingTypes={BUILDING_TYPES_T} serviceTypes={SERVICE_TYPES_T} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>إلغاء</Button>
            <Button onClick={handleSaveEdit} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── محرر نصي غني للقوالب ──────────────────────────────────────────────────────
const TEMPLATE_VARS_SETTINGS = [
  "{اسم_العميل}", "{الرقم_المدني}", "{المنطقة}",
  "{القطعة}", "{القسيمة}", "{المساحة}",
  "{قيمة_العقد}", "{تاريخ_التوقيع}", "{رقم_العقد}",
];

const FONT_SIZES_S = ["12", "14", "16", "18", "20", "22", "24", "28", "32"];
const TEXT_COLORS_S = [
  { label: "أسود", value: "#000000" },
  { label: "رمادي", value: "#6b7280" },
  { label: "أزرق", value: "#1d4ed8" },
  { label: "أخضر", value: "#15803d" },
  { label: "أحمر", value: "#b91c1c" },
  { label: "بني", value: "#92400e" },
];

function SettingsRichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState("16");
  const [textColor, setTextColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const savedRangeRef = useRef<Range | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initializedRef.current) {
      editorRef.current.innerHTML = value || "";
      initializedRef.current = true;
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

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || "");
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const insertVar = useCallback((varText: string) => {
    restoreRange();
    editorRef.current?.focus();
    document.execCommand("insertText", false, varText);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  return (
    <div className="border rounded-lg overflow-hidden" dir="rtl" style={{ overflowX: "hidden", maxWidth: "100%" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
        <button type="button" title="غامق" className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" title="تسطير" className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}>
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <div className="flex items-center gap-1">
          <Type className="w-3.5 h-3.5 text-muted-foreground" />
          <select className="text-xs border rounded px-1 py-0.5 bg-background h-7" value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                const range = sel.getRangeAt(0);
                const span = document.createElement("span");
                span.style.fontSize = e.target.value + "px";
                range.surroundContents(span);
                onChange(editorRef.current?.innerHTML || "");
              }
            }}>
            {FONT_SIZES_S.map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>
        </div>
        <div className="w-px h-5 bg-border mx-0.5" />
        <div className="relative">
          <button type="button" title="لون النص" className="p-1.5 rounded hover:bg-muted transition-colors flex items-center gap-1"
            onMouseDown={(e) => { e.preventDefault(); saveRange(); setShowColorPicker(v => !v); }}>
            <Palette className="w-4 h-4" />
            <div className="w-3 h-1.5 rounded-sm border" style={{ backgroundColor: textColor }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white border rounded-lg shadow-lg p-2 flex flex-wrap gap-1.5 w-36">
              {TEXT_COLORS_S.map((c) => (
                <button key={c.value} type="button" title={c.label}
                  className="w-7 h-7 rounded border-2 border-transparent hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: c.value }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    restoreRange();
                    setTextColor(c.value);
                    exec("foreColor", c.value);
                    setShowColorPicker(false);
                  }} />
              ))}
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-border mx-0.5" />
        <button type="button" title="محاذاة يمين" className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }}>
          <AlignRight className="w-4 h-4" />
        </button>
        <button type="button" title="محاذاة وسط" className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }}>
          <AlignCenter className="w-4 h-4" />
        </button>
        <button type="button" title="محاذاة يسار" className="p-1.5 rounded hover:bg-muted transition-colors"
          onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }}>
          <AlignLeft className="w-4 h-4" />
        </button>
      </div>
      {/* Editable Area */}
      <div ref={editorRef} contentEditable suppressContentEditableWarning dir="rtl"
        className="min-h-[280px] p-4 text-sm leading-relaxed focus:outline-none"
        style={{ fontFamily: "inherit", direction: "rtl", textAlign: "right", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap", overflowX: "hidden" }}
        onInput={handleInput} onMouseUp={saveRange} onKeyUp={saveRange} onFocus={saveRange}
        data-placeholder="اكتب محتوى العقد هنا..."
      />
      <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }`}</style>
    </div>
  );
}

function TemplateFormFields({ form, setForm, buildingTypes, serviceTypes }: {
  form: { name: string; buildingType: string; serviceType: string; content: string };
  setForm: (f: any) => void;
  buildingTypes: string[];
  serviceTypes: string[];
}) {
  return (
    <div className="space-y-3 py-2">
      <div>
        <label className="text-sm font-medium mb-1 block">اسم القالب</label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: عقد إشراف - سكن خاص" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">نوع العقار</label>
          <Select value={form.buildingType} onValueChange={v => setForm({ ...form, buildingType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{buildingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">نوع الخدمة</label>
          <Select value={form.serviceType} onValueChange={v => setForm({ ...form, serviceType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{serviceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {/* متغيرات القالب */}
      <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">إدراج متغير — ضع المؤشر في مكان الإدراج ثم اضغط:</p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARS_SETTINGS.map((v) => (
            <button key={v} type="button"
              className="text-[11px] px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded font-mono hover:bg-blue-100 transition-colors"
              onClick={() => {
                const editor = document.querySelector('[data-template-editor]') as HTMLDivElement;
                if (editor) { editor.focus(); document.execCommand('insertText', false, v); }
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">محتوى القالب</label>
        <SettingsRichTextEditor
          value={form.content}
          onChange={(html) => setForm({ ...form, content: html })}
        />
      </div>
    </div>
  );
}

// ── تبويب خطط العمل ───────────────────────────────────────────────────────────
function WorkPlansTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">لإدارة خطط العمل بشكل كامل، استخدم صفحة خطط العمل المخصصة.</p>
        <Button size="sm" variant="outline" onClick={() => window.location.href = "/work-plans"}>
          <ClipboardList className="w-4 h-4 ml-1" />
          فتح خطط العمل
        </Button>
      </div>
      <WorkPlansSummary />
    </div>
  );
}

function WorkPlansSummary() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/work-plans")
      .then(r => r.json())
      .then(data => { setPlans(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">جاري التحميل...</div>;

  const grouped: Record<string, any[]> = {};
  for (const p of plans) {
    if (!grouped[p.projectType]) grouped[p.projectType] = [];
    grouped[p.projectType].push(p);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(grouped).map(([type, typePlans]) => (
        <Card key={type} className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{type}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk'", color: "oklch(0.30 0.05 250)" }}>
              {typePlans.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">خطة عمل</p>
            <div className="mt-3 space-y-1">
              {typePlans.slice(0, 3).map((p: any) => (
                <p key={p.id} className="text-xs text-muted-foreground truncate">• {p.name}</p>
              ))}
              {typePlans.length > 3 && (
                <p className="text-xs text-muted-foreground">+{typePlans.length - 3} أخرى</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {plans.length === 0 && (
        <div className="col-span-full py-16 text-center text-muted-foreground text-sm">لا توجد خطط عمل</div>
      )}
    </div>
  );
}

// ── تبويب المناطق والمحافظات ──────────────────────────────────────────────────
function GovernorateAreasTab() {
  const { data: { grouped, rows } } = useGovernorateAreas();
  const addArea = useAddGovernorateArea();
  const updateArea = useUpdateGovernorateArea();
  const deleteArea = useDeleteGovernorateArea();
  const addGov = useAddGovernorate();
  const deleteGov = useDeleteGovernorate();

  const [expandedGov, setExpandedGov] = useState<string | null>(null);
  const [addingAreaTo, setAddingAreaTo] = useState<string | null>(null);
  const [newAreaName, setNewAreaName] = useState("");
  const [showAddGov, setShowAddGov] = useState(false);
  const [newGovName, setNewGovName] = useState("");
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [editingAreaName, setEditingAreaName] = useState("");

  const governorates = Object.keys(grouped).sort();

  const handleAddArea = async (gov: string) => {
    if (!newAreaName.trim()) { toast.error("يرجى إدخال اسم المنطقة"); return; }
    try {
      await addArea.mutateAsync({ governorate: gov, area: newAreaName.trim() });
      toast.success(`تم إضافة "${newAreaName}" إلى ${gov}`);
      setNewAreaName("");
      setAddingAreaTo(null);
    } catch (e: any) {
      toast.error(e.message || "فشل الإضافة");
    }
  };

  const handleDeleteArea = async (id: number, area: string) => {
    if (!confirm(`حذف منطقة "${area}"؟`)) return;
    await deleteArea.mutateAsync(id);
    toast.success("تم حذف المنطقة");
  };

  const handleEditArea = async (id: number) => {
    if (!editingAreaName.trim()) { toast.error("يرجى إدخال اسم المنطقة"); return; }
    try {
      await updateArea.mutateAsync({ id, area: editingAreaName.trim() });
      toast.success("تم تحديث اسم المنطقة");
      setEditingAreaId(null);
      setEditingAreaName("");
    } catch (e: any) {
      toast.error(e.message || "فشل التحديث");
    }
  };

  const handleAddGov = async () => {
    if (!newGovName.trim()) { toast.error("يرجى إدخال اسم المحافظة"); return; }
    try {
      await addGov.mutateAsync(newGovName.trim());
      toast.success(`تم إضافة محافظة "${newGovName}"`);
      setNewGovName("");
      setShowAddGov(false);
      setExpandedGov(newGovName.trim());
    } catch (e: any) {
      toast.error(e.message || "فشل الإضافة");
    }
  };

  const handleDeleteGov = async (gov: string) => {
    if (!confirm(`حذف محافظة "${gov}" وجميع مناطقها (${grouped[gov]?.length || 0} منطقة)؟`)) return;
    await deleteGov.mutateAsync(gov);
    toast.success(`تم حذف محافظة "${gov}"`);
    if (expandedGov === gov) setExpandedGov(null);
  };

  return (
    <div className="space-y-4">
      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk'", color: "oklch(0.30 0.05 250)" }}>{governorates.length}</p>
            <p className="text-xs text-muted-foreground mt-1">محافظة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk'", color: "oklch(0.55 0.15 150)" }}>{rows.length}</p>
            <p className="text-xs text-muted-foreground mt-1">منطقة</p>
          </CardContent>
        </Card>
      </div>

      {/* زر إضافة محافظة */}
      <div className="flex justify-end">
        <Button size="sm" style={{ backgroundColor: "oklch(0.30 0.05 250)" }} onClick={() => setShowAddGov(true)}>
          <Building2 className="w-4 h-4 ml-1" /> محافظة جديدة
        </Button>
      </div>

      {/* قائمة المحافظات */}
      <div className="space-y-2">
        {governorates.map(gov => {
          const areas = grouped[gov] || [];
          const areaRows = rows.filter(r => r.governorate === gov);
          const isExpanded = expandedGov === gov;
          return (
            <Card key={gov} className="border-0 shadow-sm">
              <CardContent className="p-0">
                {/* رأس المحافظة */}
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20"
                  onClick={() => setExpandedGov(isExpanded ? null : gov)}>
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    <MapPin className="w-4 h-4" style={{ color: "oklch(0.30 0.05 250)" }} />
                    <span className="font-medium">{gov}</span>
                    <Badge variant="secondary" className="text-xs">{areas.length} منطقة</Badge>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteGov(gov); }}
                    className="text-red-400 hover:text-red-600 p-1 rounded" title="حذف المحافظة">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* مناطق المحافظة */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {areaRows.map(row => (
                        <div key={row.id} className="flex items-center gap-1 bg-muted/40 rounded-full px-3 py-1 text-sm">
                          {editingAreaId === row.id ? (
                            <>
                              <input
                                className="bg-transparent border-b border-primary outline-none text-sm w-24"
                                value={editingAreaName}
                                onChange={e => setEditingAreaName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleEditArea(row.id); if (e.key === "Escape") { setEditingAreaId(null); setEditingAreaName(""); } }}
                                autoFocus
                              />
                              <button onClick={() => handleEditArea(row.id)} className="text-green-500 hover:text-green-700 mr-0.5" title="حفظ">
                                <Save className="w-3 h-3" />
                              </button>
                              <button onClick={() => { setEditingAreaId(null); setEditingAreaName(""); }} className="text-muted-foreground hover:text-foreground" title="إلغاء">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{row.area}</span>
                              <button onClick={() => { setEditingAreaId(row.id); setEditingAreaName(row.area); }}
                                className="text-blue-400 hover:text-blue-600 mr-0.5" title="تعديل">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteArea(row.id, row.area)}
                                className="text-red-400 hover:text-red-600" title="حذف">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                      {areas.length === 0 && (
                        <span className="text-xs text-muted-foreground">لا توجد مناطق</span>
                      )}
                    </div>

                    {/* إضافة منطقة */}
                    {addingAreaTo === gov ? (
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newAreaName}
                          onChange={e => setNewAreaName(e.target.value)}
                          placeholder="اسم المنطقة الجديدة..."
                          className="h-8 text-sm"
                          onKeyDown={e => { if (e.key === "Enter") handleAddArea(gov); if (e.key === "Escape") { setAddingAreaTo(null); setNewAreaName(""); } }}
                          autoFocus
                        />
                        <Button size="sm" className="h-8" onClick={() => handleAddArea(gov)} disabled={addArea.isPending}>
                          {addArea.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAddingAreaTo(null); setNewAreaName(""); }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs mt-1"
                        onClick={() => { setAddingAreaTo(gov); setNewAreaName(""); }}>
                        <Plus className="w-3 h-3 ml-1" /> إضافة منطقة
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {governorates.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">لا توجد محافظات</div>
        )}
      </div>

      {/* Dialog إضافة محافظة */}
      <Dialog open={showAddGov} onOpenChange={setShowAddGov}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>إضافة محافظة جديدة</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1 block">اسم المحافظة</label>
            <Input value={newGovName} onChange={e => setNewGovName(e.target.value)}
              placeholder="مثال: مبارك الكبير"
              onKeyDown={e => { if (e.key === "Enter") handleAddGov(); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGov(false)}>إلغاء</Button>
            <Button onClick={handleAddGov} disabled={addGov.isPending}>
              {addGov.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Plus className="w-4 h-4 ml-1" />}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── الصفحة الرئيسية ───────────────────────────────────────────────────────────
export default function Settings() {
  return (
    <div className="space-y-6" dir="rtl">
      <Tabs defaultValue="areas" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="quotations" className="flex items-center gap-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">عروض الأسعار</span>
            <span className="sm:hidden">الباقات</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2 text-xs sm:text-sm">
            <FileSignature className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">العقود الهندسية</span>
            <span className="sm:hidden">العقود</span>
          </TabsTrigger>
          <TabsTrigger value="workplans" className="flex items-center gap-2 text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">خطط العمل</span>
            <span className="sm:hidden">الخطط</span>
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2 text-xs sm:text-sm">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">المناطق والمحافظات</span>
            <span className="sm:hidden">المناطق</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations">
          <PackagesTab />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractTemplatesTab />
        </TabsContent>
        <TabsContent value="workplans">
          <WorkPlansTab />
        </TabsContent>
        <TabsContent value="areas">
          <GovernorateAreasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
