/**
 * DocumentsTaskPanel - بطاقة تجهيز الملف (سكن خاص - بناء جديد)
 *
 * ثلاثة أقسام بالترتيب:
 *  1. جمع الوثائق      → البطاقة المدنية للملاك | الوثيقة | خريطة الموقع العام | أخرى
 *  2. الفحوصات التقنية → فحص التربة | كتاب الكهرباء
 *  3. نماذج البلدية    → رفع النماذج بعد تعبئتها
 *
 * كل رفع يُحفظ في /api/upload ويظهر تلقائياً في صفحة المستندات.
 */
import { useState, useRef, useEffect } from "react";
import {
  X, Upload, FileText, Eye, CheckCircle2, ChevronDown, ChevronUp,
  User, Phone, Folder, FlaskConical, ClipboardList, ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/* ─── أنواع ─────────────────────────────────────────────────────────────── */
interface UploadedFile {
  id: number;
  name: string;
  size: string;
  url: string;
  uploadedAt: string;
}

interface DocSlot {
  id: string;
  label: string;
  category: string;
  files: UploadedFile[];
  uploading: boolean;
}

/* ─── تعريف الأقسام ─────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: "docs",
    title: "جمع الوثائق",
    subtitle: "الوثائق الرسمية للملاك",
    icon: Folder,
    color: "oklch(0.50 0.15 250)",
    bg: "oklch(0.96 0.03 250)",
    slots: [
      { id: "civil_id",  label: "البطاقة المدنية للملاك", category: "وثائق رسمية" },
      { id: "deed",      label: "الوثيقة (سند الملكية)",  category: "وثائق رسمية" },
      { id: "site_map",  label: "خريطة الموقع العام",     category: "وثائق رسمية" },
      { id: "other",     label: "أخرى",                   category: "وثائق رسمية" },
    ],
  },
  {
    id: "tech",
    title: "الفحوصات التقنية",
    subtitle: "طلب الكهرباء وفحص التربة",
    icon: FlaskConical,
    color: "oklch(0.50 0.15 30)",
    bg: "oklch(0.97 0.03 30)",
    slots: [
      { id: "soil_test",    label: "فحص التربة",       category: "فحوصات تقنية" },
      { id: "elec_letter",  label: "كتاب الكهرباء",    category: "فحوصات تقنية" },
    ],
  },
  {
    id: "forms",
    title: "نماذج البلدية",
    subtitle: "تعبئة النماذج والتعهدات",
    icon: ClipboardList,
    color: "oklch(0.50 0.15 150)",
    bg: "oklch(0.97 0.03 150)",
    slots: [
      { id: "municipality_forms", label: "نماذج البلدية (بعد التعبئة)", category: "نماذج بلدية" },
    ],
  },
];

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface Props {
  open: boolean;
  onClose: () => void;
  taskName?: string;
  projectName?: string;
  clientName?: string;
  clientPhone?: string;
  clientId?: string;
  projectId?: string;
}

/* ─── المكوّن الرئيسي ────────────────────────────────────────────────────── */
export default function DocumentsTaskPanel({
  open,
  onClose,
  taskName = "تجهيز الملف",
  projectName = "",
  clientName = "",
  clientPhone = "",
  clientId = "",
  projectId = "",
}: Props) {
  // حالة كل slot: map من slotId → DocSlot
  const [slots, setSlots] = useState<Record<string, DocSlot>>(() => {
    const init: Record<string, DocSlot> = {};
    SECTIONS.forEach(sec => {
      sec.slots.forEach(s => {
        init[s.id] = { id: s.id, label: s.label, category: s.category, files: [], uploading: false };
      });
    });
    return init;
  });

  // أي أقسام مفتوحة (الكل مفتوح افتراضياً)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(SECTIONS.map(s => s.id)));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotId = useRef<string | null>(null);

  // وثائق العقد المنقولة من CRM
  const [contractDocs, setContractDocs] = useState<Array<{ id: number; name: string; url: string; category: string }>>([]);
  const [loadingContractDocs, setLoadingContractDocs] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoadingContractDocs(true);
    fetch(`/api/documents?projectId=${projectId}`)
      .then(r => r.json())
      .then((docs: Array<{ id: number; name: string; url: string; category: string }>) => {
        const filtered = docs.filter(d => d.category === "وثائق العقد");
        setContractDocs(filtered);
      })
      .catch(() => {})
      .finally(() => setLoadingContractDocs(false));
  }, [open, projectId]);

  if (!open) return null;

  /* ─── حساب التقدم الكلي ─── */
  const allSlots = Object.values(slots);
  const doneSlots = allSlots.filter(s => s.files.length > 0).length;
  const totalSlots = allSlots.length;
  const pct = Math.round((doneSlots / totalSlots) * 100);
  const allDone = doneSlots === totalSlots;

  /* ─── فتح/إغلاق قسم ─── */
  const toggleSection = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ─── رفع ملف ─── */
  const handleUploadClick = (slotId: string) => {
    pendingSlotId.current = slotId;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slotId = pendingSlotId.current;
    if (!file || !slotId) return;

    const slot = slots[slotId];
    if (!slot) return;

    // تعيين uploading
    setSlots(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], uploading: true },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", `${slot.label} - ${projectName || "مشروع"}`);
      formData.append("category", slot.category);
      if (clientId) formData.append("clientId", clientId);
      if (projectId) formData.append("projectId", projectId);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("فشل الرفع");
      const doc = await res.json();

      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      setSlots(prev => ({
        ...prev,
        [slotId]: {
          ...prev[slotId],
          uploading: false,
          files: [
            ...prev[slotId].files,
            {
              id: doc.id,
              name: file.name,
              size: sizeStr,
              url: doc.url || "",
              uploadedAt: new Date().toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" }),
            },
          ],
        },
      }));

      toast.success(`تم رفع "${slot.label}"`, {
        description: `📁 تم إضافة الملف في مستندات ${clientName || "العميل"}`,
      });

      // تحقق من اكتمال الكل
      const newDone = Object.values(slots).filter(s => s.id === slotId ? true : s.files.length > 0).length;
      if (newDone === totalSlots) {
        setTimeout(() => toast.success("🎉 اكتملت جميع وثائق تجهيز الملف!"), 500);
      }
    } catch (err) {
      toast.error("فشل رفع الملف، حاول مرة أخرى");
      setSlots(prev => ({
        ...prev,
        [slotId]: { ...prev[slotId], uploading: false },
      }));
    }

    e.target.value = "";
    pendingSlotId.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative mr-auto w-full max-w-md bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: "1px solid hsl(var(--border))" }}
      >
        {/* ─── Header ─── */}
        <div className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: "oklch(0.95 0.04 250)" }}
              >
                📁
              </div>
              <div>
                <h2 className="font-bold text-sm">{taskName}</h2>
                <p className="text-[10px] text-muted-foreground">{projectName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* تاق الحالة */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 h-5 gap-1"
              style={{ borderColor: "oklch(0.55 0.15 250)", color: "oklch(0.45 0.15 250)" }}
            >
              <User className="w-2.5 h-2.5" />
              محمد ثروت
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 h-5"
              style={{
                borderColor: allDone ? "oklch(0.60 0.15 150)" : "oklch(0.60 0.15 60)",
                color: allDone ? "oklch(0.45 0.15 150)" : "oklch(0.50 0.15 60)",
              }}
            >
              {allDone ? "✓ مكتمل" : `${doneSlots}/${totalSlots} مرفوع`}
            </Badge>
          </div>

          {/* شريط التقدم */}
          <div className="mt-2.5">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: allDone ? "oklch(0.55 0.15 150)" : "oklch(0.55 0.15 250)",
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── معلومات العميل ─── */}
        {clientName && (
          <div className="px-4 py-2.5 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: "oklch(0.50 0.15 250)" }}
              >
                {clientName[0]}
              </div>
              <div>
                <p className="text-xs font-semibold">{clientName}</p>
                {clientPhone && <p className="text-[10px] text-muted-foreground">{clientPhone}</p>}
              </div>
            </div>
            {clientPhone && (
              <div className="flex gap-1.5">
                <a
                  href={`https://wa.me/965${clientPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md text-white"
                  style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                >
                  واتساب
                </a>
                <a
                  href={`tel:${clientPhone}`}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border hover:bg-muted transition-colors"
                >
                  <Phone className="w-2.5 h-2.5" />
                  اتصال
                </a>
              </div>
            )}
          </div>
        )}

        {/* ─── وثائق العقد المنقولة من CRM ─── */}
        {(contractDocs.length > 0 || loadingContractDocs) && (
          <div className="border-b">
            <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "oklch(0.96 0.03 150)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.06 150)" }}>
                <ShieldCheck className="w-4 h-4" style={{ color: "oklch(0.45 0.15 150)" }} />
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">وثائق العقد الموقّع</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "oklch(0.93 0.05 150)", color: "oklch(0.45 0.15 150)" }}>
                    {contractDocs.length} ملف
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground text-right">منقولة تلقائياً من العقد</p>
              </div>
            </div>
            <div className="pb-2 px-4 space-y-1">
              {loadingContractDocs && <p className="text-[10px] text-muted-foreground py-2">جاري التحميل...</p>}
              {contractDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 text-[10px] bg-muted/20 rounded-md px-2 py-1.5">
                  <ShieldCheck className="w-3 h-3 shrink-0" style={{ color: "oklch(0.45 0.15 150)" }} />
                  <span className="truncate flex-1 font-medium">{doc.name}</span>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noreferrer" className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors" title="عرض الملف">
                      <Eye className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── الأقسام ─── */}
        <div className="flex-1 overflow-y-auto">
          {SECTIONS.map((section, si) => {
            const SectionIcon = section.icon;
            const isOpen = expanded.has(section.id);
            const sectionSlots = section.slots.map(s => slots[s.id]);
            const sectionDone = sectionSlots.filter(s => s.files.length > 0).length;
            const sectionTotal = sectionSlots.length;
            const sectionComplete = sectionDone === sectionTotal;

            return (
              <div key={section.id} className={si > 0 ? "border-t" : ""}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  style={{ backgroundColor: isOpen ? `color-mix(in oklch, ${section.color} 5%, white)` : undefined }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: section.bg }}
                  >
                    <SectionIcon className="w-4 h-4" style={{ color: section.color }} />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{section.title}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: sectionComplete ? "oklch(0.93 0.05 150)" : section.bg,
                          color: sectionComplete ? "oklch(0.45 0.15 150)" : section.color,
                        }}
                      >
                        {sectionDone}/{sectionTotal}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{section.subtitle}</p>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </button>

                {/* Section Slots */}
                {isOpen && (
                  <div className="pb-2">
                    {section.slots.map(slotDef => {
                      const slot = slots[slotDef.id];
                      const hasFiles = slot.files.length > 0;

                      return (
                        <div key={slotDef.id} className="px-4 py-2.5 hover:bg-muted/10 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* أيقونة الحالة */}
                            <div className="shrink-0 mt-0.5">
                              {hasFiles
                                ? <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(0.50 0.15 150)" }} />
                                : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                              }
                            </div>

                            {/* المحتوى */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{slotDef.label}</span>
                                {/* زر رفع */}
                                <button
                                  onClick={() => handleUploadClick(slotDef.id)}
                                  disabled={slot.uploading}
                                  className="shrink-0 flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                                  style={{
                                    borderColor: section.color,
                                    color: section.color,
                                    backgroundColor: `color-mix(in oklch, ${section.color} 5%, white)`,
                                  }}
                                >
                                  {slot.uploading
                                    ? <span className="animate-spin">⏳</span>
                                    : <Upload className="w-3 h-3" />
                                  }
                                  {slot.uploading ? "جاري الرفع..." : hasFiles ? "رفع آخر" : "رفع ملف"}
                                </button>
                              </div>

                              {/* الملفات المرفوعة */}
                              {slot.files.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  {slot.files.map((f, fi) => (
                                    <div
                                      key={fi}
                                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 rounded-md px-2 py-1"
                                    >
                                      <FileText className="w-3 h-3 shrink-0" style={{ color: section.color }} />
                                      <span className="truncate flex-1">{f.name}</span>
                                      <span className="shrink-0">{f.size}</span>
                                      <span className="text-muted-foreground/50">·</span>
                                      <span className="shrink-0">{f.uploadedAt}</span>
                                      {f.url && (
                                        <a
                                          href={f.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                                          title="عرض الملف"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── تذييل ─── */}
        <div className="px-4 py-2.5 border-t bg-muted/20 shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            📁 الملفات المرفوعة تُضاف تلقائياً في قسم المستندات تحت اسم العميل
          </p>
        </div>
      </div>
    </div>
  );
}
