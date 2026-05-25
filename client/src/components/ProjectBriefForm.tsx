/**
 * ProjectBriefForm - نموذج طلبات المشروع الرقمي
 * يحتوي على:
 * - بيانات المالك والقسيمة
 * - تفاصيل مكونات كل دور
 * - مساحة Canvas للرسم الحر (سكتش الكروكي) بالقلم على الآيباد
 * - حفظ تلقائي مرتبط بالمشروع
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X, Save, Eraser, Undo2, Trash2, Plus, PenLine,
  ChevronDown, ChevronUp, Compass, Building2, Palette
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */
interface FloorDetail {
  name: string;
  rooms: string;
  notes: string;
}

interface BriefData {
  id?: number;
  projectId: string;
  ownerName: string;
  ownerPhone: string;
  governorate: string;
  area: string;
  block: string;
  plot: string;
  autoNumber: string;
  plotArea: string;
  plotShape: string;
  northDirection: string;
  architecturalStyle: string;
  floorsCount: number;
  floorsDetails: FloorDetail[];
  sketchData: string;
  notes: string;
}

const FLOOR_NAMES = ["سرداب", "الدور الأرضي", "الدور الأول", "الدور الثاني", "الدور الثالث", "السطح", "الملحق"];
const STYLES = ["مودرن", "كلاسيك", "مودرن كلاسيك", "نيو كلاسيك", "عربي", "أخرى"];
const SHAPES = ["مستطيل", "زاوية", "رأس", "مثلث", "غير منتظم"];
const DIRECTIONS = ["شمال", "جنوب", "شرق", "غرب", "شمال شرق", "شمال غرب", "جنوب شرق", "جنوب غرب"];

/* ─── Canvas Drawing Hook ─── */
function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [penColor, setPenColor] = useState("#1a1a1a");
  const [penSize, setPenSize] = useState(3);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory(prev => [...prev, canvas.toDataURL()]);
  }, [canvasRef]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    saveState();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveState();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return { startDraw, draw, stopDraw, undo, clear, penColor, setPenColor, penSize, setPenSize };
}

/* ─── Main Component ─── */
export default function ProjectBriefForm({
  projectId,
  onClose,
  initialData,
}: {
  projectId: string;
  onClose: () => void;
  initialData?: any;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startDraw, draw, stopDraw, undo, clear, penColor, setPenColor, penSize, setPenSize } = useCanvas(canvasRef);

  const [saving, setSaving] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ owner: true, plot: true, style: true, floors: true, sketch: true });
  const [brief, setBrief] = useState<BriefData>({
    projectId,
    ownerName: initialData?.ownerName || "",
    ownerPhone: initialData?.ownerPhone || "",
    governorate: initialData?.governorate || "",
    area: initialData?.area || "",
    block: initialData?.block || "",
    plot: initialData?.plot || "",
    autoNumber: initialData?.autoNumber || "",
    plotArea: initialData?.plotArea || "",
    plotShape: initialData?.plotShape || "",
    northDirection: initialData?.northDirection || "",
    architecturalStyle: initialData?.architecturalStyle || "",
    floorsCount: initialData?.floorsCount || 3,
    floorsDetails: initialData?.floorsDetails || [
      { name: "سرداب", rooms: "", notes: "" },
      { name: "الدور الأرضي", rooms: "", notes: "" },
      { name: "الدور الأول", rooms: "", notes: "" },
      { name: "السطح", rooms: "", notes: "" },
    ],
    sketchData: initialData?.sketchData || "",
    notes: initialData?.notes || "",
    ...(initialData?.id ? { id: initialData.id } : {}),
  });

  // Load existing sketch on canvas
  useEffect(() => {
    if (brief.sketchData && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = brief.sketchData;
    }
  }, []);

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateFloor = (idx: number, field: keyof FloorDetail, value: string) => {
    setBrief(prev => {
      const floors = [...prev.floorsDetails];
      floors[idx] = { ...floors[idx], [field]: value };
      return { ...prev, floorsDetails: floors };
    });
  };

  const addFloor = () => {
    const nextName = FLOOR_NAMES[brief.floorsDetails.length] || `دور ${brief.floorsDetails.length + 1}`;
    setBrief(prev => ({
      ...prev,
      floorsDetails: [...prev.floorsDetails, { name: nextName, rooms: "", notes: "" }],
      floorsCount: prev.floorsCount + 1,
    }));
  };

  const removeFloor = (idx: number) => {
    setBrief(prev => ({
      ...prev,
      floorsDetails: prev.floorsDetails.filter((_, i) => i !== idx),
      floorsCount: prev.floorsCount - 1,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sketchData = canvasRef.current?.toDataURL("image/png") || "";
      const payload = { ...brief, sketchData, floorsDetails: JSON.stringify(brief.floorsDetails) };
      const method = brief.id ? "PUT" : "POST";
      const url = brief.id
        ? `/api/projects/${projectId}/brief/${brief.id}`
        : `/api/projects/${projectId}/brief`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      const data = await res.json();
      if (data.id) setBrief(prev => ({ ...prev, id: data.id }));
      toast.success("تم حفظ نموذج الطلبات بنجاح");
    } catch (err) {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="w-full max-w-lg bg-background shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-l from-amber-50 to-white">
          <div className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold">نموذج طلبات المشروع</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="w-4 h-4 ml-1" />
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Section: بيانات المالك */}
          <Section title="بيانات المالك" icon={<Building2 className="w-4 h-4" />} open={sectionsOpen.owner} toggle={() => toggleSection("owner")}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم المالك" value={brief.ownerName} onChange={v => setBrief(p => ({ ...p, ownerName: v }))} />
              <Field label="رقم التلفون" value={brief.ownerPhone} onChange={v => setBrief(p => ({ ...p, ownerPhone: v }))} type="tel" />
            </div>
          </Section>

          {/* Section: بيانات القسيمة */}
          <Section title="بيانات القسيمة" icon={<Compass className="w-4 h-4" />} open={sectionsOpen.plot} toggle={() => toggleSection("plot")}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="المنطقة" value={brief.area} onChange={v => setBrief(p => ({ ...p, area: v }))} />
              <Field label="القطعة" value={brief.block} onChange={v => setBrief(p => ({ ...p, block: v }))} />
              <Field label="القسيمة" value={brief.plot} onChange={v => setBrief(p => ({ ...p, plot: v }))} />
              <Field label="الرقم الآلي" value={brief.autoNumber} onChange={v => setBrief(p => ({ ...p, autoNumber: v }))} />
              <Field label="مساحة الأرض" value={brief.plotArea} onChange={v => setBrief(p => ({ ...p, plotArea: v }))} />
              <SelectField label="شكل القسيمة" value={brief.plotShape} options={SHAPES} onChange={v => setBrief(p => ({ ...p, plotShape: v }))} />
              <SelectField label="اتجاه الشمال" value={brief.northDirection} options={DIRECTIONS} onChange={v => setBrief(p => ({ ...p, northDirection: v }))} />
            </div>
          </Section>

          {/* Section: الطابع المعماري */}
          <Section title="الطابع المعماري" icon={<Palette className="w-4 h-4" />} open={sectionsOpen.style} toggle={() => toggleSection("style")}>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="الطابع" value={brief.architecturalStyle} options={STYLES} onChange={v => setBrief(p => ({ ...p, architecturalStyle: v }))} />
              <Field label="عدد الأدوار" value={String(brief.floorsCount)} onChange={v => setBrief(p => ({ ...p, floorsCount: parseInt(v) || 0 }))} type="number" />
            </div>
          </Section>

          {/* Section: تفاصيل الأدوار */}
          <Section title="تفاصيل مكونات المشروع" icon={<Building2 className="w-4 h-4" />} open={sectionsOpen.floors} toggle={() => toggleSection("floors")}>
            <div className="space-y-3">
              {brief.floorsDetails.map((floor, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{floor.name}</span>
                    <button onClick={() => removeFloor(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Textarea
                    placeholder="المكونات: مجلس، صالة، مطبخ..."
                    value={floor.rooms}
                    onChange={e => updateFloor(idx, "rooms", e.target.value)}
                    className="mb-2 text-sm min-h-[60px]"
                  />
                  <Input
                    placeholder="ملاحظات خاصة بهذا الدور..."
                    value={floor.notes}
                    onChange={e => updateFloor(idx, "notes", e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFloor} className="w-full">
                <Plus className="w-4 h-4 ml-1" /> إضافة دور
              </Button>
            </div>
          </Section>

          {/* Section: الكروكي (Canvas) */}
          <Section title="الكروكي / السكتش" icon={<PenLine className="w-4 h-4" />} open={sectionsOpen.sketch} toggle={() => toggleSection("sketch")}>
            <div className="space-y-2">
              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 border rounded px-2 py-1">
                  {["#1a1a1a", "#dc2626", "#2563eb", "#16a34a", "#9333ea"].map(color => (
                    <button
                      key={color}
                      onClick={() => setPenColor(color)}
                      className={`w-5 h-5 rounded-full border-2 ${penColor === color ? "border-amber-500 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 border rounded px-2 py-1">
                  {[2, 4, 6].map(size => (
                    <button
                      key={size}
                      onClick={() => setPenSize(size)}
                      className={`px-2 py-0.5 text-xs rounded ${penSize === size ? "bg-amber-100 font-bold" : ""}`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={undo}><Undo2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={clear}><Eraser className="w-4 h-4" /></Button>
              </div>
              {/* Canvas */}
              <div className="border-2 border-dashed border-amber-300 rounded-lg overflow-hidden bg-white touch-none">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full cursor-crosshair"
                  style={{ touchAction: "none" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">ارسم الكروكي المبدئي بالقلم أو بالإصبع</p>
            </div>
          </Section>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1 block">ملاحظات عامة</label>
            <Textarea
              value={brief.notes}
              onChange={e => setBrief(p => ({ ...p, notes: e.target.value }))}
              placeholder="أي ملاحظات إضافية..."
              className="min-h-[80px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */
function Section({ title, icon, open, toggle, children }: {
  title: string; icon: React.ReactNode; open: boolean; toggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 transition">
        <div className="flex items-center gap-2 font-semibold text-sm">
          {icon} {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-0.5 block">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} className="text-sm h-9" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-0.5 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">اختر...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
