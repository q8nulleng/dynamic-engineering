/**
 * ProjectBriefForm - نموذج طلبات المشروع الرقمي
 * - ملء البيانات الرئيسية تلقائياً من بيانات المشروع والعميل
 * - شكل القسيمة: زاوية / سد / بطن وظهر / ثلاث جهات
 * - اتجاه الشمال
 * - تصدير PDF
 * - حفظ في بوابة العميل (كمستند)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X, Save, Eraser, Undo2, Trash2, Plus, PenLine,
  ChevronDown, ChevronUp, Compass, Building2, Palette,
  FileDown, Globe, CheckCircle2
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
  plotDimensions: string;
  plotShape: string;
  plotFacing: string;
  northDirection: string;
  architecturalStyle: string;
  floorsCount: number;
  floorsDetails: FloorDetail[];
  sketchData: string;
  notes: string;
}

interface ProjectInfo {
  id: string;
  name?: string;
  client?: string;
  clientId?: string;
  clientPhone?: string;
  area?: string;
  block?: string;
  plot?: string;
  quotation?: string;
  type?: string;
  serviceType?: string;
}

const FLOOR_NAMES = ["سرداب", "الدور الأرضي", "الدور الأول", "الدور الثاني", "الدور الثالث", "السطح", "الملحق"];
const STYLES = ["مودرن", "كلاسيك", "مودرن كلاسيك", "نيو كلاسيك", "عربي", "أخرى"];

// شكل القسيمة المطلوب
const SHAPES = ["زاوية", "سد", "بطن وظهر", "ثلاث جهات", "مستطيل", "غير منتظم"];

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

/* ─── PDF Export Helper ─── */
async function exportToPDF(brief: BriefData, sketchDataUrl: string, projectInfo?: ProjectInfo) {
  // Build HTML content for PDF
  const floors = brief.floorsDetails.map(f =>
    `<tr><td style="padding:6px 10px;border:1px solid #ddd;font-weight:600">${f.name}</td>
     <td style="padding:6px 10px;border:1px solid #ddd">${f.rooms || "—"}</td>
     <td style="padding:6px 10px;border:1px solid #ddd">${f.notes || "—"}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Arial', sans-serif; direction: rtl; padding: 30px; color: #222; font-size: 13px; }
  h1 { font-size: 20px; color: #1a3a5c; border-bottom: 3px solid #c8a84b; padding-bottom: 8px; margin-bottom: 20px; }
  h2 { font-size: 14px; color: #1a3a5c; background: #f5f0e8; padding: 6px 12px; border-radius: 4px; margin: 20px 0 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field { margin-bottom: 8px; }
  .label { font-size: 11px; color: #888; margin-bottom: 2px; }
  .value { font-size: 13px; font-weight: 600; border-bottom: 1px solid #eee; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1a3a5c; color: white; padding: 7px 10px; text-align: right; }
  .sketch { max-width: 100%; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px; }
  .header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .company { font-size: 12px; color: #888; }
  .badge { display: inline-block; background: #c8a84b; color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px; }
</style>
</head>
<body>
<div class="header-info">
  <div>
    <h1>نموذج طلبات المشروع</h1>
    <span class="badge">${projectInfo?.name || brief.projectId}</span>
  </div>
  <div class="company">
    <strong>ديناميك للاستشارات الهندسية</strong><br>
    تاريخ: ${new Date().toLocaleDateString("ar-KW")}
  </div>
</div>

<h2>📋 بيانات المالك</h2>
<div class="grid">
  <div class="field"><div class="label">اسم المالك</div><div class="value">${brief.ownerName || "—"}</div></div>
  <div class="field"><div class="label">رقم التلفون</div><div class="value">${brief.ownerPhone || "—"}</div></div>
</div>

<h2>📍 بيانات القسيمة</h2>
<div class="grid">
  <div class="field"><div class="label">المنطقة</div><div class="value">${brief.area || "—"}</div></div>
  <div class="field"><div class="label">القطعة</div><div class="value">${brief.block || "—"}</div></div>
  <div class="field"><div class="label">القسيمة</div><div class="value">${brief.plot || "—"}</div></div>
  <div class="field"><div class="label">الرقم الآلي</div><div class="value">${brief.autoNumber || "—"}</div></div>
  <div class="field"><div class="label">مساحة الأرض</div><div class="value">${brief.plotArea || "—"} م²</div></div>
  <div class="field"><div class="label">أبعاد القسيمة</div><div class="value">${(brief as any).plotDimensions || "—"}</div></div>
  <div class="field"><div class="label">شكل القسيمة</div><div class="value">${brief.plotShape || "—"}</div></div>
  <div class="field"><div class="label">واجهة القسيمة</div><div class="value">${(brief as any).plotFacing || "—"}</div></div>
</div>

<h2>🏛️ الطابع المعماري</h2>
<div class="grid">
  <div class="field"><div class="label">الطابع</div><div class="value">${brief.architecturalStyle || "—"}</div></div>
  <div class="field"><div class="label">عدد الأدوار</div><div class="value">${brief.floorsCount}</div></div>
</div>

<h2>🏗️ تفاصيل مكونات المشروع</h2>
<table>
  <thead><tr><th>الدور</th><th>المكونات</th><th>ملاحظات</th></tr></thead>
  <tbody>${floors}</tbody>
</table>

${brief.notes ? `<h2>📝 ملاحظات عامة</h2><p>${brief.notes}</p>` : ""}

${sketchDataUrl && sketchDataUrl !== "data:," ? `<h2>✏️ الكروكي / السكتش</h2><img src="${sketchDataUrl}" class="sketch" />` : ""}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `نموذج_طلبات_${brief.projectId}_${new Date().toISOString().split("T")[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("تم تصدير النموذج — افتح الملف واطبعه كـ PDF من المتصفح");
}

/* ─── Main Component ─── */
export default function ProjectBriefForm({
  projectId,
  onClose,
  initialData,
  projectInfo,
}: {
  projectId: string;
  onClose: () => void;
  initialData?: any;
  projectInfo?: ProjectInfo;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startDraw, draw, stopDraw, undo, clear, penColor, setPenColor, penSize, setPenSize } = useCanvas(canvasRef);

  const [saving, setSaving] = useState(false);
  const [savingPortal, setSavingPortal] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savedToPortal, setSavedToPortal] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ owner: true, plot: true, style: true, floors: true, sketch: false });

  // ملء البيانات تلقائياً من بيانات المشروع والعميل
  const [brief, setBrief] = useState<BriefData>(() => {
    const autoFill = {
      ownerName: initialData?.ownerName || projectInfo?.client || "",
      ownerPhone: initialData?.ownerPhone || projectInfo?.clientPhone || "",
      area: initialData?.area || projectInfo?.area || "",
      block: initialData?.block || projectInfo?.block || "",
      plot: initialData?.plot || projectInfo?.plot || "",
    };
    return {
      projectId,
      ...autoFill,
      governorate: initialData?.governorate || "",
      autoNumber: initialData?.autoNumber || "",
      plotArea: initialData?.plotArea || "",
      plotDimensions: initialData?.plotDimensions || "",
      plotShape: initialData?.plotShape || "",
      plotFacing: initialData?.plotFacing || "",
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
    };
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

  // حفظ النموذج في بوابة العميل كمستند PDF
  const handleSaveToPortal = async () => {
    if (!projectInfo?.clientId) {
      toast.error("لا يوجد عميل مرتبط بهذا المشروع");
      return;
    }
    setSavingPortal(true);
    try {
      // أولاً احفظ النموذج
      await handleSave();

      // ثم أنشئ مستنداً في بوابة العميل يشير إلى النموذج
      const sketchData = canvasRef.current?.toDataURL("image/png") || "";
      const summaryText = [
        `نموذج طلبات المشروع — ${projectInfo?.name || projectId}`,
        `المالك: ${brief.ownerName}`,
        `المنطقة: ${brief.area} | القطعة: ${brief.block} | القسيمة: ${brief.plot}`,
        `شكل القسيمة: ${brief.plotShape} | واجهة القسيمة: ${brief.plotFacing}`,
        `الطابع: ${brief.architecturalStyle} | الأدوار: ${brief.floorsCount}`,
      ].filter(Boolean).join("\n");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `نموذج_طلبات_${projectId}.txt`,
          content: summaryText,
          category: "نموذج طلبات",
          projectId,
          clientId: projectInfo.clientId,
          fileSize: `${summaryText.length} حرف`,
          url: `/api/projects/${projectId}/brief`,
        }),
      });

      // إذا فشل upload، نحاول عبر documents API مباشرة
      if (!res.ok) {
        const docRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `نموذج طلبات المشروع — ${projectInfo?.name || projectId}`,
            category: "نموذج طلبات",
            projectId,
            clientId: projectInfo.clientId,
            fileSize: "نموذج رقمي",
            url: `/api/projects/${projectId}/brief`,
          }),
        });
        if (!docRes.ok) throw new Error("فشل الحفظ في بوابة العميل");
      }

      setSavedToPortal(true);
      toast.success("تم حفظ النموذج في بوابة العميل بنجاح");
    } catch (err) {
      toast.error("حدث خطأ أثناء الحفظ في بوابة العميل");
    } finally {
      setSavingPortal(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      const sketchData = canvasRef.current?.toDataURL("image/png") || "";
      await exportToPDF(brief, sketchData, projectInfo);
    } finally {
      setExportingPdf(false);
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
            <div>
              <h2 className="text-base font-bold">نموذج طلبات المشروع</h2>
              {projectInfo?.name && (
                <p className="text-[11px] text-muted-foreground">{projectInfo.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* تصدير PDF */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              PDF
            </Button>
            {/* حفظ في بوابة العميل */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveToPortal}
              disabled={savingPortal || savedToPortal}
              className={`gap-1 text-xs ${savedToPortal ? "border-green-300 text-green-700 bg-green-50" : "border-blue-300 text-blue-700 hover:bg-blue-50"}`}
            >
              {savedToPortal ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {savingPortal ? "جاري..." : savedToPortal ? "محفوظ" : "بوابة العميل"}
            </Button>
            {/* حفظ */}
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs">
              <Save className="w-3.5 h-3.5" />
              {saving ? "..." : "حفظ"}
            </Button>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auto-fill notice */}
        {(brief.ownerName || brief.area || brief.block) && (
          <div className="px-4 py-2 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <p className="text-[11px] text-green-700">تم ملء البيانات الرئيسية تلقائياً من بيانات المشروع — يمكنك التعديل</p>
          </div>
        )}

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
              <Field label="مساحة الأرض (م²)" value={brief.plotArea} onChange={v => setBrief(p => ({ ...p, plotArea: v }))} />
              <Field label="أبعاد القسيمة (طول × عرض)" value={brief.plotDimensions} onChange={v => setBrief(p => ({ ...p, plotDimensions: v }))} />
              {/* شكل القسيمة - فراغ نصي */}
              <Field label="شكل القسيمة" value={brief.plotShape} onChange={v => setBrief(p => ({ ...p, plotShape: v }))} />
              {/* واجهة القسيمة */}
              <Field label="واجهة القسيمة" value={brief.plotFacing} onChange={v => setBrief(p => ({ ...p, plotFacing: v }))} />
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
