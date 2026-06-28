/**
 * ResidentialKanban — صفحة Kanban مخصصة لمشاريع السكن الخاص - بناء جديد
 * المراحل الأربع: تجهيز الملف | التصميم المعماري | الواجهات والإنشائي | مخطط البلدية
 * كل مرحلة تفتح popup تفصيلي عند الضغط
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ProjectBriefForm from "@/components/ProjectBriefForm";
import {
  ArrowRight, Users, MapPin, Link2, CheckCircle2, Circle,
  Clock, X, Plus, Calendar, FileText, Banknote, Wrench,
  Building2, Layers, ChevronRight, ClipboardList, MessageSquare,
  Phone, Pencil, Check, AlertCircle, Zap, Upload,
  Eye, Download, File, Image as ImageIcon, ExternalLink, Trash2, Edit2
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useProject, useUpdateTask, useCreateProjectMeeting, useProjectMeetings, useDocuments, useProjectBrief, usePhaseMeta, useUpdatePhaseMeta,
  useMunicipalitySubmission, useUpdateMunicipality,
  useDetailedDrawings, useCreateDrawing, useUpdateDrawing,
  useSupervisionVisits, useCreateSupervisionVisit, useUpdateSupervisionVisit,
  useEmployees } from "@/lib/api";
import type { Document, MunicipalitySubmission, DetailedDrawing, SupervisionVisit, EmployeeRecord } from "@/lib/api";

/* ─── Types ─── */
interface SubTask { name: string; done: boolean; assignee?: string; }
interface Task {
  id: number; name: string;
  status: "done" | "in_progress" | "blocked" | "pending" | "waiting_client" | "cancelled";
  subTasks?: SubTask[]; assignee?: string; description?: string;
  priority?: number; deadline?: string; estimatedDays?: number;
}
interface Phase { id?: number; title: string; subtitle?: string; tasks: Task[]; }
interface ProjectData {
  id: string; name: string; client: string; clientId?: string; type: string; serviceType: string;
  area: string; quotation: string; progress: number; currentPhase: number;
  status?: string; phases: Phase[]; clientPhone?: string; block?: string; plot?: string;
}

/* ─── Phase Colors ─── */
const PHASE_COLORS = [
  "oklch(0.55 0.15 250)",  // تجهيز الملف - أزرق
  "oklch(0.60 0.15 280)",  // التصميم المعماري - بنفسجي
  "oklch(0.60 0.12 30)",   // الواجهات والإنشائي - برتقالي
  "oklch(0.55 0.15 150)",  // مخطط البلدية - أخضر
  "oklch(0.55 0.12 200)",  // التقديم للبلدية - تيل
  "oklch(0.60 0.12 60)",   // المخططات التفصيلية - ذهبي
  "oklch(0.55 0.15 320)",  // الإشراف - وردي
];

const PHASE_ICONS = [ClipboardList, Building2, Layers, FileText, Upload, Wrench, CheckCircle2];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  done:           { label: "مكتملة",         color: "oklch(0.55 0.15 150)", icon: CheckCircle2 },
  in_progress:    { label: "جارية",          color: "oklch(0.55 0.15 250)", icon: Clock        },
  blocked:        { label: "بانتظار مراجعة", color: "oklch(0.60 0.12 30)",  icon: AlertCircle  },
  waiting_client: { label: "بانتظار العميل", color: "oklch(0.60 0.12 45)",  icon: AlertCircle  },
  pending:        { label: "لم تبدأ",        color: "oklch(0.70 0.00 0)",   icon: Circle       },
  cancelled:      { label: "ملغاة",          color: "oklch(0.55 0.15 30)",  icon: X            },
};

/* ═══════════════════════════════════════════════════════════════════
   PHASE POPUP COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Phase 1: تجهيز الملف ─── */

// Helper: تحديد نوع الملف
function getFileType(doc: { name: string; mimeType?: string; fileExtension?: string }) {
  if (doc.mimeType) {
    if (doc.mimeType.includes("pdf")) return "pdf";
    if (doc.mimeType.startsWith("image/")) return "image";
    if (doc.mimeType.includes("word") || doc.mimeType.includes("document")) return "word";
  }
  const ext = (doc.fileExtension || doc.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "word";
  return "file";
}

// Component: قائمة الملفات المرفوعة مسبقاً لقسم معين
function UploadedFilesList({ docs, onDeleted }: {
  docs: Document[];
  onDeleted?: () => void;
}) {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (docs.length === 0) return null;

  const handleDelete = async () => {
    if (!confirmDeleteDoc) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${confirmDeleteDoc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      toast.success(`تم حذف “${confirmDeleteDoc.name}” بنجاح`);
      setConfirmDeleteDoc(null);
      onDeleted?.();
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* نافذة معاينة الملف */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/90"
          onClick={e => { if (e.target === e.currentTarget) setPreviewDoc(null); }}
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-card/95 backdrop-blur border-b shrink-0">
            <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{previewDoc.name}</p>
              <p className="text-xs text-muted-foreground">{previewDoc.category}</p>
            </div>
            <a href={`/api/documents/${previewDoc.id}/download`} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
            </a>
            <a href={`/api/documents/${previewDoc.id}/view`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {getFileType(previewDoc) === "image" ? (
              <img
                src={`/api/documents/${previewDoc.id}/view`}
                alt={previewDoc.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <iframe
                src={`/api/documents/${previewDoc.id}/view`}
                className="w-full h-full rounded-lg bg-white"
                title={previewDoc.name}
              />
            )}
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف */}
      {confirmDeleteDoc && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          dir="rtl"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDeleteDoc(null); }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDeleteDoc(null)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-sm p-5 border">
            {/* أيقونة تحذير */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">تأكيد الحذف</h3>
                <p className="text-xs text-muted-foreground">هذه العملية لا يمكن التراجع عنها</p>
              </div>
            </div>
            {/* اسم الملف */}
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 mb-4 border">
              <p className="text-xs font-medium truncate text-foreground">{confirmDeleteDoc.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{confirmDeleteDoc.category}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              سيتم حذف هذا الملف نهائياً ولن يظهر في المستندات بعد ذلك.
            </p>
            {/* أزرار التأكيد */}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-9 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <><Clock className="w-3.5 h-3.5 animate-spin" /> جاري الحذف...</>
                ) : (
                  <>حذف الملف</>
                )}
              </button>
              <button
                onClick={() => setConfirmDeleteDoc(null)}
                disabled={deleting}
                className="flex-1 h-9 rounded-lg text-xs font-semibold border hover:bg-muted/40 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/20 overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            الملفات المرفوعة ({docs.length})
          </p>
        </div>
        <div className="divide-y">
          {docs.map(doc => {
            const ft = getFileType(doc);
            const FileIcon = ft === "image" ? ImageIcon : ft === "pdf" ? FileText : File;
            return (
              <div key={doc.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors group">
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-muted/40">
                  <FileIcon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("ar-KW", { day: "numeric", month: "short" }) : ""}
                    {doc.fileExtension ? ` • .${doc.fileExtension.toUpperCase()}` : ""}
                  </p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/60 transition-colors"
                    title="معاينة"
                  >
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/60 transition-colors"
                    title="تنزيل"
                  >
                    <Download className="w-3 h-3 text-muted-foreground" />
                  </a>
                  <button
                    onClick={() => setConfirmDeleteDoc(doc)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Upload button component for file sections
function FileUploadButton({ label, category, projectId, clientId, onUploaded }: {
  label: string; category: string; projectId: string; clientId?: string;
  onUploaded?: (doc: { name: string; url: string }) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", label + " - " + file.name);
      formData.append("category", category);
      if (projectId) formData.append("projectId", projectId);
      if (clientId) formData.append("clientId", clientId);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("فشل الرفع");
      const doc = await res.json();
      toast.success(`تم رفع ${label} بنجاح ✓`);
      onUploaded?.(doc);
    } catch {
      toast.error("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={handleUpload}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-dashed transition-colors hover:bg-muted/30 disabled:opacity-50"
      >
        {uploading ? (
          <><Clock className="w-3 h-3 animate-spin" /> جاري الرفع...</>
        ) : (
          <><Upload className="w-3 h-3" /> {label}</>
        )}
      </button>
    </>
  );
}

function PhaseFilePreparationPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[0];
  const [expandedGroup, setExpandedGroup] = useState<string | null>("docs");
  const [refreshKey, setRefreshKey] = useState(0);

  // تواريخ الفحوصات التقنية — محفوظة في phase_meta
  const { data: fileMetaRow } = usePhaseMeta(project.id, "file_preparation");
  const updateFileMeta = useUpdatePhaseMeta(project.id, "file_preparation");
  const fileMeta: Record<string, any> = (fileMetaRow as any)?.data || {};

  // جلب جميع مستندات المشروع من قاعدة البيانات
  const { data: allProjectDocs = [], refetch: refetchDocs } = useDocuments({ projectId: project.id });

  // تصفية المستندات حسب الفئة لكل قسم
  const docsDocs = allProjectDocs.filter(d =>
    d.category === "بطاقة مدنية" ||
    d.category === "وثيقة ملكية" ||
    d.category === "خريطة موقع" ||
    d.category === "وثيقة أخرى" ||
    d.category === "وثائق المشروع" ||
    d.category === "وثائق رسمية"
  );
  const techDocs = allProjectDocs.filter(d =>
    d.category === "فحص تربة" ||
    d.category === "كتاب كهرباء"
  );
  const formsDocs = allProjectDocs.filter(d =>
    d.category === "نماذج بلدية"
  );

  const paymentTask = phase.tasks.find(t => t.name.includes("تحصيل") || t.name.includes("دفعة"));
  const techTasks = phase.tasks.filter(t =>
    t.name.includes("كهرباء") || t.name.includes("تربة") || t.name.includes("فحص")
  );
  const formTasks = phase.tasks.filter(t =>
    t.name.includes("نماذج") || t.name.includes("بلدية") || t.name.includes("تعهد") || t.name.includes("تعبئة")
  );

  // حساب العداد الشامل: مهام + ملفات مرفوعة + خطوات phase_meta
  const tasksDone = phase.tasks.filter(t => t.status === "done").length;
  // الخطوات الإضافية من phase_meta (8 خطوات)
  const metaSteps = [
    fileMeta.soilRequestDone, fileMeta.soilReceiveDone,
    fileMeta.elecRequestDone, fileMeta.elecReceiveDone,
    fileMeta.soilRequestDate, fileMeta.elecRequestDate,
    fileMeta.soilReceiveDate, fileMeta.elecReceiveDate,
  ].filter(Boolean).length;
  // الملفات المرفوعة تُحتسب كخطوة واحدة لكل فئة
  const docsUploaded = docsDocs.length > 0 ? 1 : 0;
  const techUploaded = techDocs.length > 0 ? 1 : 0;
  const formsUploaded = formsDocs.length > 0 ? 1 : 0;
  const extraDone = docsUploaded + techUploaded + formsUploaded;
  const extraTotal = 3; // 3 فئات ملفات
  const totalCount = phase.tasks.length + extraTotal;
  const doneCount = tasksDone + extraDone;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // حالة اكتمال كل قسم فرعي
  const docsComplete = docsDocs.length > 0;
  const techComplete = techDocs.length > 0 && techTasks.every(t => t.status === "done");
  const formsComplete = formsDocs.length > 0 && formTasks.every(t => t.status === "done");

  const handleFileUploaded = (_group: string, _doc: { name: string }) => {
    // إعادة جلب المستندات من قاعدة البيانات لتحديث القائمة فوراً
    setTimeout(() => refetchDocs(), 500);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b" style={{ backgroundColor: `color-mix(in oklch, ${color} 8%, white)` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <ClipboardList className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">تجهيز الملف</h3>
                <p className="text-[11px] text-muted-foreground">جمع الوثائق والملفات</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs font-bold shrink-0" style={{ color, fontFamily: "'Space Grotesk'" }}>{doneCount}/{totalCount}</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* ══ 1. جمع الوثائق ══ */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: docsComplete ? "oklch(0.55 0.15 150)" : `color-mix(in oklch, ${color} 35%, transparent)` }}>
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              style={{ backgroundColor: docsComplete ? "oklch(0.97 0.04 150)" : `color-mix(in oklch, ${color} 8%, white)` }}
              onClick={() => setExpandedGroup(expandedGroup === "docs" ? null : "docs")}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: docsComplete ? "oklch(0.55 0.15 150)" : color }}>
                  {docsComplete ? <Check className="w-3.5 h-3.5 text-white" /> : <FileText className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: docsComplete ? "oklch(0.40 0.12 150)" : `color-mix(in oklch, ${color} 80%, black)` }}>جمع الوثائق</p>
                  <p className="text-[10px] text-muted-foreground">البطاقة المدنية، الوثيقة، خريطة الموقع</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {docsComplete && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">✓ مكتملة</span>
                )}
                {!docsComplete && docsDocs.length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, white)`, color }}>
                    {docsDocs.length} ملف
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedGroup === "docs" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {/* الوثائق المرفوعة تظهر دائماً حتى عند إغلاق القسم */}
            {docsDocs.length > 0 && expandedGroup !== "docs" && (
              <div className="px-3 pb-2 pt-1 border-t bg-muted/5">
                <UploadedFilesList docs={docsDocs} key={refreshKey + 1000} onDeleted={() => { refetchDocs(); setRefreshKey(k => k + 1); }} />
              </div>
            )}
            {expandedGroup === "docs" && (
              <div className="px-3 pb-4 pt-3 space-y-3 border-t">
                <p className="text-[11px] text-muted-foreground">ارفع الملفات المطلوبة — ستظهر تلقائياً في المستندات</p>
                <div className="flex flex-wrap gap-2">
                  <FileUploadButton label="رفع وثيقة" category="بطاقة مدنية" projectId={project.id} clientId={project.clientId} onUploaded={d => handleFileUploaded("docs", d)} />

                </div>
                <UploadedFilesList docs={docsDocs} key={refreshKey} onDeleted={() => { refetchDocs(); setRefreshKey(k => k + 1); }} />
                {/* مهام الوثائق من قاعدة البيانات */}
                {phase.tasks.filter(t =>
                  t.name.includes("بطاقات") || t.name.includes("سند") || t.name.includes("ملكية") ||
                  t.name.includes("خريطة") || t.name.includes("موقع") || t.name.includes("تجميع مستندات") || t.name.includes("وثائق")
                ).map(task => (
                  <div key={task.id} className="flex items-center justify-between py-1.5 border-t">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: task.status === "done" ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                          backgroundColor: task.status === "done" ? "oklch(0.55 0.15 150)" : "transparent",
                        }}
                        onClick={() => onTaskUpdate(task.id, task.status === "done" ? "pending" : "done")}
                      >
                        {task.status === "done" && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <span className={`text-xs ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.name}</span>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ 2. الفحوصات التقنية ══ */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: techComplete ? "oklch(0.55 0.15 150)" : `color-mix(in oklch, oklch(0.60 0.12 30) 35%, transparent)` }}>
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              style={{ backgroundColor: techComplete ? "oklch(0.97 0.04 150)" : `color-mix(in oklch, oklch(0.60 0.12 30) 8%, white)` }}
              onClick={() => setExpandedGroup(expandedGroup === "tech" ? null : "tech")}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: techComplete ? "oklch(0.55 0.15 150)" : "oklch(0.60 0.12 30)" }}>
                  {techComplete ? <Check className="w-3.5 h-3.5 text-white" /> : <Zap className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: techComplete ? "oklch(0.40 0.12 150)" : "oklch(0.45 0.10 30)" }}>الفحوصات التقنية</p>
                  <p className="text-[10px] text-muted-foreground">فحص التربة وكتاب الكهرباء</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {techComplete && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">✓ مكتملة</span>
                )}
                {!techComplete && techDocs.length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "color-mix(in oklch, oklch(0.60 0.12 30) 15%, white)", color: "oklch(0.45 0.10 30)" }}>
                    {techDocs.length} ملف
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedGroup === "tech" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expandedGroup === "tech" && (
              <div className="px-3 pb-4 pt-3 space-y-3 border-t">
                {/* ── صفوف الفحوصات: checkbox + تاريخ تلقائي ── */}
                <div className="space-y-1 py-1">
                  {/* طلب فحص التربة */}
                  <div className="flex items-center justify-between py-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: fileMeta.soilRequestDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                          backgroundColor: fileMeta.soilRequestDone ? "oklch(0.55 0.15 150)" : "transparent",
                        }}
                        onClick={() => {
                          const now = !fileMeta.soilRequestDone;
                          updateFileMeta.mutate({ ...fileMeta, soilRequestDone: now, soilRequestDate: now ? new Date().toISOString().slice(0, 10) : "" });
                        }}
                      >
                        {fileMeta.soilRequestDone && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div>
                        <span className={`text-xs font-medium ${fileMeta.soilRequestDone ? "line-through text-muted-foreground" : ""}`}>طلب فحص التربة</span>
                        {fileMeta.soilRequestDone && fileMeta.soilRequestDate && (
                          <p className="text-[10px] text-green-600">{new Date(fileMeta.soilRequestDate).toLocaleDateString("ar-KW", { day: "numeric", month: "short", year: "numeric" })}</p>
                        )}
                      </div>
                    </div>
                    {fileMeta.soilRequestDone ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">مكتملة</span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">لم تبدأ</span>
                    )}
                  </div>

                  {/* استلام فحص التربة */}
                  <div className="flex items-center justify-between py-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: fileMeta.soilReceiveDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                          backgroundColor: fileMeta.soilReceiveDone ? "oklch(0.55 0.15 150)" : "transparent",
                        }}
                        onClick={() => {
                          const now = !fileMeta.soilReceiveDone;
                          updateFileMeta.mutate({ ...fileMeta, soilReceiveDone: now, soilReceiveDate: now ? new Date().toISOString().slice(0, 10) : "" });
                        }}
                      >
                        {fileMeta.soilReceiveDone && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div>
                        <span className={`text-xs font-medium ${fileMeta.soilReceiveDone ? "line-through text-muted-foreground" : ""}`}>استلام فحص التربة</span>
                        {fileMeta.soilReceiveDone && fileMeta.soilReceiveDate && (
                          <p className="text-[10px] text-green-600">{new Date(fileMeta.soilReceiveDate).toLocaleDateString("ar-KW", { day: "numeric", month: "short", year: "numeric" })}</p>
                        )}
                      </div>
                    </div>
                    {fileMeta.soilReceiveDone ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">مكتملة</span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">لم تبدأ</span>
                    )}
                  </div>

                  {/* طلب إمكانية الكهرباء */}
                  <div className="flex items-center justify-between py-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: fileMeta.elecRequestDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                          backgroundColor: fileMeta.elecRequestDone ? "oklch(0.55 0.15 150)" : "transparent",
                        }}
                        onClick={() => {
                          const now = !fileMeta.elecRequestDone;
                          updateFileMeta.mutate({ ...fileMeta, elecRequestDone: now, elecRequestDate: now ? new Date().toISOString().slice(0, 10) : "" });
                        }}
                      >
                        {fileMeta.elecRequestDone && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div>
                        <span className={`text-xs font-medium ${fileMeta.elecRequestDone ? "line-through text-muted-foreground" : ""}`}>طلب إمكانية الكهرباء</span>
                        {fileMeta.elecRequestDone && fileMeta.elecRequestDate && (
                          <p className="text-[10px] text-green-600">{new Date(fileMeta.elecRequestDate).toLocaleDateString("ar-KW", { day: "numeric", month: "short", year: "numeric" })}</p>
                        )}
                      </div>
                    </div>
                    {fileMeta.elecRequestDone ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">مكتملة</span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">لم تبدأ</span>
                    )}
                  </div>

                  {/* استلام إمكانية الكهرباء */}
                  <div className="flex items-center justify-between py-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: fileMeta.elecReceiveDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                          backgroundColor: fileMeta.elecReceiveDone ? "oklch(0.55 0.15 150)" : "transparent",
                        }}
                        onClick={() => {
                          const now = !fileMeta.elecReceiveDone;
                          updateFileMeta.mutate({ ...fileMeta, elecReceiveDone: now, elecReceiveDate: now ? new Date().toISOString().slice(0, 10) : "" });
                        }}
                      >
                        {fileMeta.elecReceiveDone && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div>
                        <span className={`text-xs font-medium ${fileMeta.elecReceiveDone ? "line-through text-muted-foreground" : ""}`}>استلام إمكانية الكهرباء</span>
                        {fileMeta.elecReceiveDone && fileMeta.elecReceiveDate && (
                          <p className="text-[10px] text-green-600">{new Date(fileMeta.elecReceiveDate).toLocaleDateString("ar-KW", { day: "numeric", month: "short", year: "numeric" })}</p>
                        )}
                      </div>
                    </div>
                    {fileMeta.elecReceiveDone ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">مكتملة</span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">لم تبدأ</span>
                    )}
                  </div>
                </div>

                {/* رفع الملفات */}
                <div className="flex flex-wrap gap-2 pt-1 border-t">
                  <FileUploadButton label="رفع تقرير التربة" category="فحص تربة" projectId={project.id} clientId={project.clientId} onUploaded={d => handleFileUploaded("tech", d)} />
                  <FileUploadButton label="رفع كتاب الكهرباء" category="كتاب كهرباء" projectId={project.id} clientId={project.clientId} onUploaded={d => handleFileUploaded("tech", d)} />
                </div>
                {techDocs.length > 0 && (
                  <UploadedFilesList docs={techDocs} key={refreshKey + 110} onDeleted={() => { refetchDocs(); setRefreshKey(k => k + 1); }} />
                )}
              </div>
            )}
                    </div>

          {/* ══ 3. تعبئة نماذج البلدية ══ */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: formsComplete ? "oklch(0.55 0.15 150)" : `color-mix(in oklch, oklch(0.55 0.15 150) 35%, transparent)` }}>
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              style={{ backgroundColor: formsComplete ? "oklch(0.97 0.04 150)" : `color-mix(in oklch, oklch(0.55 0.15 150) 8%, white)` }}
              onClick={() => setExpandedGroup(expandedGroup === "forms" ? null : "forms")}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: formsComplete ? "oklch(0.55 0.15 150)" : "oklch(0.55 0.15 150)" }}>
                  {formsComplete ? <Check className="w-3.5 h-3.5 text-white" /> : <ClipboardList className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "oklch(0.40 0.12 150)" }}>تعبئة نماذج البلدية</p>
                  <p className="text-[10px] text-muted-foreground">النماذج والتعهدات الرسمية</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {formsComplete && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">✓ مكتملة</span>
                )}
                {!formsComplete && formsDocs.length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "color-mix(in oklch, oklch(0.55 0.15 150) 15%, white)", color: "oklch(0.40 0.12 150)" }}>
                    {formsDocs.length} ملف
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedGroup === "forms" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expandedGroup === "forms" && (
              <div className="px-3 pb-4 pt-3 space-y-3 border-t">
                <p className="text-[11px] text-muted-foreground">ارفع النماذج بعد تعبئتها — ستظهر في المستندات</p>
                <div className="flex flex-wrap gap-2">
                  <FileUploadButton label="رفع نماذج البلدية" category="نماذج بلدية" projectId={project.id} clientId={project.clientId} onUploaded={d => handleFileUploaded("forms", d)} />
                </div>
                <UploadedFilesList docs={formsDocs} key={refreshKey + 200} onDeleted={() => { refetchDocs(); setRefreshKey(k => k + 1); }} />
                {/* مهام النماذج من قاعدة البيانات */}
                {formTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-1.5 border-t">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: task.status === "done" ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                          backgroundColor: task.status === "done" ? "oklch(0.55 0.15 150)" : "transparent",
                        }}
                        onClick={() => onTaskUpdate(task.id, task.status === "done" ? "pending" : "done")}
                      >
                        {task.status === "done" && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <span className={`text-xs ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.name}</span>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ تحصيل الدفعة الأولى (في الأسفل) ══ */}
          {paymentTask && (
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: `color-mix(in oklch, oklch(0.55 0.15 60) 40%, transparent)` }}>
              <div
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                style={{ backgroundColor: `color-mix(in oklch, oklch(0.55 0.15 60) 8%, white)` }}
                onClick={() => setExpandedGroup(expandedGroup === "payment" ? null : "payment")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.55 0.15 60)" }}>
                    <Banknote className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "oklch(0.45 0.12 60)" }}>تحصيل الدفعة الأولى</p>
                    <p className="text-[10px] text-muted-foreground">أولوية قصوى</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={paymentTask.status} />
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedGroup === "payment" ? "rotate-90" : ""}`} />
                </div>
              </div>
              {expandedGroup === "payment" && (
                <div className="px-3 pb-3 pt-2 space-y-2 border-t">
                  <p className="text-xs text-muted-foreground">{paymentTask.name}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                      onClick={() => onTaskUpdate(paymentTask.id, "done")}>
                      <Check className="w-3 h-3 ml-1" /> تم التحصيل
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                      onClick={() => onTaskUpdate(paymentTask.id, "in_progress")}>
                      <Clock className="w-3 h-3 ml-1" /> قيد المتابعة
                    </Button>
                  </div>
                  <div className="pt-2 border-t mt-2">
                    <FileUploadButton label="رفع إيصال" category="إيصال دفعة" projectId={project.id} clientId={project.clientId} onUploaded={() => { toast.success("تم رفع الإيصال — سيظهر في المستندات ✓"); }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── المهام الأخرى (ما لم يُصنَّف) ── */}
          {phase.tasks.filter(t =>
            (!paymentTask || t.id !== paymentTask.id) &&
            !phase.tasks.filter(t2 =>
              t2.name.includes("بطاقات") || t2.name.includes("سند") || t2.name.includes("ملكية") ||
              t2.name.includes("خريطة") || t2.name.includes("موقع") || t2.name.includes("تجميع مستندات") || t2.name.includes("وثائق")
            ).find(d => d.id === t.id) &&
            !techTasks.find(d => d.id === t.id) &&
            !formTasks.find(d => d.id === t.id)
          ).length > 0 && (
            <TaskGroup
              title="مهام أخرى"
              subtitle=""
              icon={<Wrench className="w-3.5 h-3.5 text-white" />}
              color="oklch(0.60 0.00 0)"
              tasks={phase.tasks.filter(t =>
                (!paymentTask || t.id !== paymentTask.id) &&
                !phase.tasks.filter(t2 =>
                  t2.name.includes("بطاقات") || t2.name.includes("سند") || t2.name.includes("ملكية") ||
                  t2.name.includes("خريطة") || t2.name.includes("موقع") || t2.name.includes("تجميع مستندات") || t2.name.includes("وثائق")
                ).find(d => d.id === t.id) &&
                !techTasks.find(d => d.id === t.id) &&
                !formTasks.find(d => d.id === t.id)
              )}
              expanded={expandedGroup === "other"}
              onToggle={() => setExpandedGroup(expandedGroup === "other" ? null : "other")}
              onTaskUpdate={onTaskUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Phase 2: التصميم المعماري ─── */
function PhaseArchitecturalDesignPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[1];
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewNotes, setNewReviewNotes] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("brief");
  const [showBriefForm, setShowBriefForm] = useState(false);
  const createMeeting = useCreateProjectMeeting(project.id);
  const { data: meetings = [] } = useProjectMeetings(project.id);
  // جلب النموذج الموجود مسبقاً من قاعدة البيانات
  const { data: existingBrief } = useProjectBrief(project.id);

  // تصفية محاضر الاجتماعات لتظهر فقط مراجعات الكروكي
  const reviews = meetings
    .filter(m => m.notes && m.notes.includes("مراجعة كروكي"))
    .map((m, idx) => ({
      id: m.id,
      title: `مراجعة وتعديل ${idx + 1}`,
      date: m.date || "",
      notes: m.notes || "",
      done: m.status === "completed",
    }));

  const briefTask = phase.tasks.find(t => t.name.includes("طلبات") || t.name.includes("نموذج") || t.name.includes("جلسة"));
  const sketchTask = phase.tasks.find(t => t.name.includes("كروكي") || t.name.includes("تصميم"));
  const approvalTask = phase.tasks.find(t => t.name.includes("اعتماد") || t.name.includes("موافقة"));

  const doneCount = phase.tasks.filter(t => t.status === "done").length;
  const progress = phase.tasks.length > 0 ? Math.round((doneCount / phase.tasks.length) * 100) : 0;

  const handleAddReview = () => {
    const newIdx = reviews.length + 1;
    createMeeting.mutate({
      date: new Date().toISOString().split("T")[0],
      attendees: JSON.stringify(["م. مصطفى", project.client]),
      agreed: JSON.stringify([]),
      notes: `مراجعة كروكي ${newIdx}: ${newReviewNotes}`,
      status: "completed",
    }, { onSuccess: () => toast.success("تم تسجيل المراجعة ✓") });
    setNewReviewNotes("");
    setShowAddReview(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b" style={{ backgroundColor: `color-mix(in oklch, ${color} 8%, white)` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">التصميم المعماري</h3>
                <p className="text-[11px] text-muted-foreground">الكروكي والاعتماد مع العميل</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs font-bold shrink-0" style={{ color, fontFamily: "'Space Grotesk'" }}>{doneCount}/{phase.tasks.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* ── نموذج طلبات العميل (الجلسة الأولى) ── */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: `color-mix(in oklch, ${color} 40%, transparent)` }}>
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              style={{ backgroundColor: `color-mix(in oklch, ${color} 8%, white)` }}
              onClick={() => setExpandedSection(expandedSection === "brief" ? null : "brief")}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color }}>نموذج طلبات العميل</p>
                  <p className="text-[10px] text-muted-foreground">الجلسة الأولى — تسجيل متطلبات المشروع</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {briefTask && <TaskStatusBadge status={briefTask.status} />}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "brief" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expandedSection === "brief" && (
              <div className="px-3 pb-3 pt-2 space-y-2 border-t">
                <p className="text-xs text-muted-foreground">تسجيل جميع متطلبات العميل: عدد الغرف، الطوابق، المساحات، الرغبات الخاصة</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="h-8 text-xs text-white" style={{ backgroundColor: color }}
                    onClick={() => setShowBriefForm(true)}>
                    <FileText className="w-3 h-3 ml-1" /> فتح النموذج
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => { toast.info("تحديد موعد الجلسة الأولى"); }}>
                    <Calendar className="w-3 h-3 ml-1" /> تحديد موعد
                  </Button>
                </div>
                {briefTask && (
                  <Button size="sm" className="w-full h-8 text-xs text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                    onClick={() => onTaskUpdate(briefTask.id, "done")}>
                    <Check className="w-3 h-3 ml-1" /> تم تسجيل النموذج
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* ── نموذج طلبات العميل ── */}
          {showBriefForm && (
            <ProjectBriefForm
              projectId={project.id}
              onClose={() => setShowBriefForm(false)}
              initialData={existingBrief ? {
                ...existingBrief,
                floorsDetails: typeof existingBrief.floorsDetails === "string"
                  ? JSON.parse(existingBrief.floorsDetails)
                  : existingBrief.floorsDetails,
              } : undefined}
              projectInfo={{
                id: project.id,
                name: project.name,
                client: project.client,
                clientId: project.clientId,
                clientPhone: project.clientPhone,
                area: project.area,
                block: project.block,
                plot: project.plot,
                type: project.type,
                serviceType: project.serviceType,
              }}
            />
          )}

          {/* ── مراجعات الكروكي ── */}
          {reviews.map((review, idx) => (
            <div key={review.id} className="rounded-xl border overflow-hidden">
              <div
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/20"
                onClick={() => setExpandedSection(expandedSection === `review-${idx}` ? null : `review-${idx}`)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.title}</p>
                    <p className="text-[10px] text-muted-foreground">مراجعة مع المالك + توثيق التعديلات</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {review.done
                    ? <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>
                    : <span className="text-[10px] text-muted-foreground">لم تبدأ</span>
                  }
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === `review-${idx}` ? "rotate-90" : ""}`} />
                </div>
              </div>
              {expandedSection === `review-${idx}` && (
                <div className="px-3 pb-3 pt-2 space-y-2 border-t bg-muted/5">
                  <textarea
                    className="w-full text-xs border rounded-lg p-2 resize-none bg-background"
                    rows={3}
                    placeholder="محضر الاجتماع: التعديلات المطلوبة..."
                    defaultValue={review.notes}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs"
                      onClick={() => toast.info("تحديد موعد المراجعة")}>
                      <Calendar className="w-3 h-3 ml-1" /> موعد لاحق
                    </Button>
                    <Button size="sm" className="h-8 text-xs text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                      onClick={() => { toast.success("تم إغلاق المراجعة ✓"); }}>
                      <Check className="w-3 h-3 ml-1" /> إغلاق المراجعة
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ── زر إضافة مراجعة وتعديل ── */}
          {!showAddReview ? (
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-muted/20"
              style={{ borderColor: `color-mix(in oklch, ${color} 40%, transparent)`, color }}
              onClick={() => setShowAddReview(true)}
            >
              <Plus className="w-4 h-4" />
              إضافة مراجعة وتعديل
            </button>
          ) : (
            <div className="rounded-xl border-2 p-3 space-y-2" style={{ borderColor: `color-mix(in oklch, ${color} 40%, transparent)` }}>
              <p className="text-sm font-medium" style={{ color }}>مراجعة وتعديل {reviews.length + 1}</p>
              <textarea
                className="w-full text-xs border rounded-lg p-2 resize-none bg-background"
                rows={3}
                placeholder="ملاحظات التعديلات المطلوبة..."
                value={newReviewNotes}
                onChange={e => setNewReviewNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8 text-xs text-white" style={{ backgroundColor: color }}
                  onClick={handleAddReview}>
                  <Plus className="w-3 h-3 ml-1" /> إضافة
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs"
                  onClick={() => { setShowAddReview(false); setNewReviewNotes(""); }}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {/* ── رفع ملفات التصميم ── */}
          <div className="rounded-xl border-2 border-dashed overflow-hidden" style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)` }}>
            <div className="px-3 py-3 flex items-center gap-2">
              <FileUploadButton label="رفع ملف" category="تصميم معماري" projectId={project.id} clientId={project.clientId} onUploaded={() => { toast.success("تم رفع الملف — سيظهر في المستندات ✓"); }} />
              <span className="text-[10px] text-muted-foreground">ارفع أي ملف مرتبط بالتصميم — سيظهر في المستندات</span>
            </div>
          </div>

          {/* ── اعتماد التصميم ── */}
          {approvalTask && (
            <div className="rounded-xl border overflow-hidden bg-green-50/50">
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">اعتماد التصميم النهائي</p>
                    <p className="text-[10px] text-green-600">توقيع العميل على الكروكي المعتمد</p>
                  </div>
                </div>
                <TaskStatusBadge status={approvalTask.status} />
              </div>
              <div className="px-3 pb-3 border-t border-green-100">
                <Button size="sm" className="w-full h-8 text-xs mt-2 text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                  onClick={() => onTaskUpdate(approvalTask.id, "done")}>
                  <CheckCircle2 className="w-3 h-3 ml-1" /> تم الاعتماد
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Phase 3: الواجهات والإنشائي ─── */
function PhaseFacadeStructuralPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[2];
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [reviews, setReviews] = useState<{ id: number; title: string; done: boolean }[]>([
    { id: 1, title: "مراجعة الواجهات الأولى", done: false },
  ]);
  const [bypassLock, setBypassLock] = useState(false);

  const { data: metaRow } = usePhaseMeta(project.id, "facade_structural");
  const updateMeta = useUpdatePhaseMeta(project.id, "facade_structural");
  const meta: Record<string, any> = metaRow?.data || {};

  // ── حالة المراحل الفرعية الأربع ──
  // columnsDone: تم اعتماد سستم الأعمدة
  // facadeDone: تم اعتماد الواجهات من العميل
  // fullStructuralDone: تم رفع التصميم الإنشائي الكامل
  const columnsDone = meta.columnsDone === true;
  const facadeDone = meta.facadeDone === true;
  const fullStructuralDone = meta.fullStructuralDone === true;
  const columnsFile = meta.columnsFile || null;
  const fullStructuralFile = meta.fullStructuralFile || null;

  const setColumnsDone = (val: boolean, fileName?: string) => {
    updateMeta.mutate({ ...meta, columnsDone: val, columnsFile: fileName || meta.columnsFile });
  };
  const setFacadeDone = (val: boolean) => {
    updateMeta.mutate({ ...meta, facadeDone: val });
  };
  const setFullStructuralDone = (val: boolean, fileName?: string) => {
    updateMeta.mutate({ ...meta, fullStructuralDone: val, fullStructuralFile: fileName || meta.fullStructuralFile });
  };

  const facadeTasks = phase.tasks.filter(t => t.name.includes("واجهة") || t.name.includes("معماري") || t.name.includes("ثلاثي") || t.name.includes("3D"));
  const structuralTasks = phase.tasks.filter(t => t.name.includes("إنشائي") || t.name.includes("أعمدة") || t.name.includes("حديد") || t.name.includes("خرسان"));
  const mepTasks = phase.tasks.filter(t => t.name.includes("كهرباء") || t.name.includes("صحي") || t.name.includes("ميكانيك") || t.name.includes("MEP"));
  const otherTasks = phase.tasks.filter(t =>
    !facadeTasks.find(x => x.id === t.id) &&
    !structuralTasks.find(x => x.id === t.id) &&
    !mepTasks.find(x => x.id === t.id)
  );
  // حساب العداد الشامل
  const extraStepsDone = (columnsDone ? 1 : 0) + (facadeDone ? 1 : 0) + (fullStructuralDone ? 1 : 0);
  const extraStepsTotal = 3;
  const tasksDoneCount = phase.tasks.filter(t => t.status === "done").length;
  const doneCount = tasksDoneCount + extraStepsDone;
  const totalCount = phase.tasks.length + extraStepsTotal;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // ── تحديد المرحلة الفرعية النشطة ──
  const activeSubStep = !columnsDone ? "columns" : !facadeDone ? "facade" : !fullStructuralDone ? "fullstructural" : "municipality";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b" style={{ backgroundColor: `color-mix(in oklch, ${color} 8%, white)` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Layers className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">الواجهات والإنشائي</h3>
                <p className="text-[11px] text-muted-foreground">التصميم الإنشائي وتصميم الواجهات</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs font-bold shrink-0" style={{ color, fontFamily: "'Space Grotesk'" }}>{doneCount}/{totalCount}</span>
          </div>
          {/* Sub-pipeline indicator - 4 مراحل */}
          <div className="flex items-center gap-0.5 mt-2.5 flex-wrap">
            {[
              { key: "columns", label: "① الأعمدة", done: columnsDone },
              { key: "facade", label: "② الواجهات", done: facadeDone },
              { key: "fullstructural", label: "③ الإنشائي", done: fullStructuralDone },
              { key: "municipality", label: "④ البلدية", done: false },
            ].map((step, idx) => {
              const isActive = activeSubStep === step.key;
              const isPast = step.done;
              return (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all ${
                    isPast ? "bg-green-100 text-green-700" :
                    isActive ? "text-white" : "bg-muted text-muted-foreground opacity-50"
                  }`} style={isActive ? { backgroundColor: color } : {}}>
                    {isPast ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
                    {step.label}
                  </div>
                  {idx < 3 && <ChevronRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" style={{ transform: "scaleX(-1)" }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* ── المرحلة الفرعية ①: سستم الأعمدة ── */}
          <div className={`rounded-xl border-2 overflow-hidden transition-all ${
            columnsDone ? "border-green-200 bg-green-50/30" :
            activeSubStep === "columns" ? "border-orange-300" : "border-muted opacity-60"
          }`}>
            <div className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/10"
              onClick={() => setExpandedSection(expandedSection === "columns-card" ? null : "columns-card")}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${columnsDone ? "bg-green-500" : "bg-orange-500"}`}>
                  {columnsDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Building2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">① سستم الأعمدة</p>
                  <p className="text-[10px] text-muted-foreground">تصميم الأعمدة والقواعد والسملات فقط</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {columnsDone
                  ? <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>
                  : <span className="text-[10px] font-medium" style={{ color }}>جارٍ</span>}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "columns-card" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expandedSection === "columns-card" && (
              <div className="px-3 pb-3 pt-2 border-t space-y-3">
                {!columnsDone && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-orange-800 mb-1">🔔 مهندس التصميم الإنشائي</p>
                    <p className="text-[10px] text-orange-700 mb-2">يبدأ بتصميم سستم الأعمدة فقط — بدون التصميم الإنشائي الكامل حتى تعتمد الواجهات.</p>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-orange-300 text-orange-700"
                      onClick={() => {
                        toast.success("تم إرسال إشعار للمهندس الإنشائي ✓");
                      }}>
                      <Phone className="w-3 h-3 ml-1" /> إشعار المهندس الإنشائي
                    </Button>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">ارفع ملف سستم الأعمدة (DWG)</p>
                  {columnsFile && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                      <File className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-xs text-green-700 flex-1 truncate">{columnsFile}</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    </div>
                  )}
                  <FileUploadButton
                    label={columnsFile ? "استبدال الملف" : "رفع ملف سستم الأعمدة (DWG)"}
                    category="سستم أعمدة"
                    projectId={project.id}
                    clientId={project.clientId}
                    onUploaded={(doc) => {
                      setColumnsDone(true, doc?.name || "ملف سستم الأعمدة");
                      toast.success("تم رفع سستم الأعمدة ✓ — يمكن الآن بدء تصميم الواجهات");
                    }}
                  />
                </div>
                {!columnsDone && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <input type="checkbox" id="bypass-columns" checked={bypassLock}
                      onChange={e => setBypassLock(e.target.checked)} className="w-3 h-3" />
                    <label htmlFor="bypass-columns" className="text-[10px] text-muted-foreground cursor-pointer">
                      تجاوز القفل (للمدير فقط)
                    </label>
                  </div>
                )}
                {bypassLock && !columnsDone && (
                  <Button size="sm" className="w-full h-8 text-xs" variant="outline"
                    onClick={() => { setColumnsDone(true); setBypassLock(false); toast.warning("تم تجاوز القفل"); }}>
                    تأكيد التجاوز والانتقال للواجهات
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* ── المرحلة الفرعية ②: تصميم الواجهات ── */}
          <div className={`rounded-xl border-2 overflow-hidden transition-all ${
            facadeDone ? "border-green-200 bg-green-50/30" :
            activeSubStep === "facade" ? "" : "border-muted opacity-60"
          }`} style={activeSubStep === "facade" && !facadeDone ? { borderColor: color } : {}}>
            {/* قفل إذا لم يكتمل سستم الأعمدة */}
            {!columnsDone && !bypassLock && (
              <div className="px-3 py-2.5 flex items-center gap-2 bg-muted/20">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">② تصميم الواجهات</p>
                  <p className="text-[10px] text-muted-foreground">🔒 ينشط بعد اعتماد سستم الأعمدة</p>
                </div>
              </div>
            )}
            {(columnsDone || bypassLock) && (
              <>
                <div className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/10"
                  onClick={() => setExpandedSection(expandedSection === "facade-card" ? null : "facade-card")}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${facadeDone ? "bg-green-500" : ""}`} style={!facadeDone ? { backgroundColor: color } : {}}>
                      {facadeDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Pencil className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">② تصميم الواجهات</p>
                      <p className="text-[10px] text-muted-foreground">الواجهات المعمارية والمنظور ثلاثي الأبعاد</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {facadeDone
                      ? <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> معتمد</span>
                      : <span className="text-[10px] font-medium" style={{ color }}>جارٍ</span>}
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "facade-card" ? "rotate-90" : ""}`} />
                  </div>
                </div>
                {expandedSection === "facade-card" && (
                  <div className="px-3 pb-3 pt-2 border-t space-y-3">
                    {/* مهام الواجهات */}
                    {facadeTasks.length > 0 && (
                      <TaskGroup title="مهام الواجهات" subtitle=""
                        icon={<Building2 className="w-3.5 h-3.5 text-white" />} color={color}
                        tasks={facadeTasks} expanded={expandedSection === ("facade-tasks" as string)}
                        onToggle={() => setExpandedSection((expandedSection as string) === "facade-tasks" ? null : "facade-tasks")}
                        onTaskUpdate={onTaskUpdate} />
                    )}
                    {/* مراجعات الواجهات */}
                    {reviews.map((review, idx) => (
                      <div key={review.id} className="rounded-lg border overflow-hidden">
                        <div className="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-muted/10"
                          onClick={() => setExpandedSection(expandedSection === `rev-${idx}` ? "facade-card" : `rev-${idx}`)}>
                          <p className="text-xs font-medium">{review.title}</p>
                          {review.done
                            ? <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>
                            : <span className="text-[10px] text-muted-foreground">لم تبدأ</span>}
                        </div>
                        {expandedSection === `rev-${idx}` && (
                          <div className="px-2.5 pb-2.5 pt-2 space-y-2 border-t">
                            <textarea className="w-full text-xs border rounded-lg p-2 resize-none bg-background" rows={2} placeholder="ملاحظات التعديلات..." />
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => toast.info("تحديد موعد")}>
                                <Calendar className="w-3 h-3 ml-1" /> موعد لاحق
                              </Button>
                              <Button size="sm" className="flex-1 h-7 text-[10px] text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                                onClick={() => { setReviews(p => p.map((r, i) => i === idx ? { ...r, done: true } : r)); toast.success("تم ✓"); }}>
                                <Check className="w-3 h-3 ml-1" /> إغلاق
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed text-xs font-medium hover:bg-muted/10"
                      style={{ borderColor: `color-mix(in oklch, ${color} 40%, transparent)`, color }}
                      onClick={() => { setReviews(p => [...p, { id: p.length + 1, title: `مراجعة وتعديل ${p.length + 1}`, done: false }]); }}>
                      <Plus className="w-3.5 h-3.5" /> إضافة مراجعة
                    </button>
                    {/* رفع ملف الواجهات */}
                    <FileUploadButton label="رفع ملف الواجهات (DWG)" category="واجهات معمارية"
                      projectId={project.id} clientId={project.clientId}
                      onUploaded={() => toast.success("تم رفع ملف الواجهات ✓")} />
                    {/* اعتماد العميل */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-blue-800 mb-1">🔗 اعتماد العميل عبر البوابة</p>
                      <p className="text-[10px] text-blue-700 mb-2">بعد إرسال الواجهات للعميل، انتظر اعتماده عبر بوابة العميل، ثم أكد الاعتماد هنا.</p>
                      {!facadeDone ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] border-blue-300 text-blue-700"
                            onClick={() => { toast.info("تم إرسال رابط الاعتماد للعميل ✓"); }}>
                            <Link2 className="w-3 h-3 ml-1" /> إرسال للعميل
                          </Button>
                          <Button size="sm" className="flex-1 h-7 text-[10px] text-white bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setFacadeDone(true);
                              toast.success("تم اعتماد الواجهات ✓ — المشروع جاهز للانتقال لمرحلة البلدية");
                            }}>
                            <CheckCircle2 className="w-3 h-3 ml-1" /> تأكيد الاعتماد
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-medium">تم اعتماد الواجهات من العميل</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── المرحلة الفرعية ③: التصميم الإنشائي الكامل ── */}
          <div className={`rounded-xl border-2 overflow-hidden transition-all ${
            fullStructuralDone ? "border-green-200 bg-green-50/30" :
            activeSubStep === "fullstructural" ? "" : "border-muted opacity-60"
          }`} style={activeSubStep === "fullstructural" && !fullStructuralDone ? { borderColor: color } : {}}>
            {/* قفل إذا لم تعتمد الواجهات */}
            {!facadeDone && (
              <div className="px-3 py-2.5 flex items-center gap-2 bg-muted/20">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">③ التصميم الإنشائي الكامل</p>
                  <p className="text-[10px] text-muted-foreground">🔒 ينشط بعد اعتماد الواجهات من العميل</p>
                </div>
              </div>
            )}
            {facadeDone && (
              <>
                <div className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/10"
                  onClick={() => setExpandedSection(expandedSection === "fullstructural-card" ? null : "fullstructural-card")}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${fullStructuralDone ? "bg-green-500" : ""}`} style={!fullStructuralDone ? { backgroundColor: color } : {}}>
                      {fullStructuralDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Building2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">③ التصميم الإنشائي الكامل</p>
                      <p className="text-[10px] text-muted-foreground">بعد اعتماد الواجهات — التصميم الإنشائي الكامل مع جميع التفاصيل</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {fullStructuralDone
                      ? <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>
                      : <span className="text-[10px] font-medium" style={{ color }}>جارٍ</span>}
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "fullstructural-card" ? "rotate-90" : ""}`} />
                  </div>
                </div>
                {expandedSection === "fullstructural-card" && (
                  <div className="px-3 pb-3 pt-2 border-t space-y-3">
                    {!fullStructuralDone && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                        <p className="text-xs font-medium text-blue-800 mb-1">📌 التصميم الإنشائي الكامل</p>
                        <p className="text-[10px] text-blue-700 mb-2">تم اعتماد الواجهات — يمكن الآن إكمال التصميم الإنشائي الكامل بما يتناسب مع الواجهات المعتمدة.</p>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-blue-300 text-blue-700"
                          onClick={() => toast.success("تم إشعار المهندس الإنشائي لإكمال التصميم الكامل ✓")}>
                          <Phone className="w-3 h-3 ml-1" /> إشعار المهندس الإنشائي
                        </Button>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5">ارفع ملف التصميم الإنشائي الكامل (DWG)</p>
                      {fullStructuralFile && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                          <File className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-xs text-green-700 flex-1 truncate">{fullStructuralFile}</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        </div>
                      )}
                      <FileUploadButton
                        label={fullStructuralFile ? "استبدال الملف" : "رفع ملف الإنشائي الكامل (DWG)"}
                        category="تصميم إنشائي كامل"
                        projectId={project.id}
                        clientId={project.clientId}
                        onUploaded={(doc) => {
                          setFullStructuralDone(true, doc?.name || "ملف الإنشائي الكامل");
                          toast.success("تم رفع التصميم الإنشائي الكامل ✓ — جاهز للانتقال للبلدية");
                        }}
                      />
                    </div>
                    {/* مهام الإنشائي */}
                    {structuralTasks.length > 0 && (
                      <TaskGroup title="مهام التصميم الإنشائي" subtitle="من خطة العمل"
                        icon={<Building2 className="w-3.5 h-3.5 text-white" />} color="oklch(0.55 0.15 30)"
                        tasks={structuralTasks} expanded={(expandedSection as string) === "structural-tasks"}
                        onToggle={() => setExpandedSection((expandedSection as string) === "structural-tasks" ? null : "structural-tasks")}
                        onTaskUpdate={onTaskUpdate} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── المرحلة الفرعية ④: الانتقال للبلدية ── */}
          <div className={`rounded-xl border-2 overflow-hidden transition-all ${
            fullStructuralDone ? "border-green-300 bg-green-50/50" : "border-muted opacity-50"
          }`}>
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${fullStructuralDone ? "bg-green-500" : "bg-muted"}`}>
                  {fullStructuralDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${fullStructuralDone ? "" : "text-muted-foreground"}`}>④ الانتقال لمرحلة البلدية</p>
                  <p className="text-[10px] text-muted-foreground">
                    {fullStructuralDone ? "✅ جاهز — يمكن الانتقال للبلدية" : "🔒 ينشط بعد إكمال التصميم الإنشائي الكامل"}
                  </p>
                </div>
              </div>
              {fullStructuralDone && (
                <Button size="sm" className="h-7 text-[10px] text-white" style={{ backgroundColor: color }}
                  onClick={() => {
                    toast.success("تم الانتقال لمرحلة مخطط البلدية ✓");
                    onClose();
                  }}>
                  انتقال للبلدية
                </Button>
              )}
            </div>
          </div>

          {/* مهام الإنشائي (إن وجدت في قاعدة البيانات) */}
          {structuralTasks.length > 0 && (
            <TaskGroup title="مهام التصميم الإنشائي" subtitle="من خطة العمل"
              icon={<Building2 className="w-3.5 h-3.5 text-white" />} color="oklch(0.55 0.15 30)"
              tasks={structuralTasks} expanded={expandedSection === "structural-tasks"}
              onToggle={() => setExpandedSection(expandedSection === "structural-tasks" ? null : "structural-tasks")}
              onTaskUpdate={onTaskUpdate} />
          )}
          {/* الأنظمة الميكانيكية والكهربائية */}
          {mepTasks.length > 0 && (
            <TaskGroup title="الأنظمة الميكانيكية والكهربائية" subtitle="MEP - كهرباء وصحي وميكانيك"
              icon={<Zap className="w-3.5 h-3.5 text-white" />} color="oklch(0.55 0.15 60)"
              tasks={mepTasks} expanded={expandedSection === "mep"}
              onToggle={() => setExpandedSection(expandedSection === "mep" ? null : "mep")}
              onTaskUpdate={onTaskUpdate} />
          )}
          {/* المهام الأخرى */}
          {otherTasks.length > 0 && (
            <TaskGroup title="مهام أخرى" subtitle="" icon={<Wrench className="w-3.5 h-3.5 text-white" />}
              color="oklch(0.60 0.00 0)" tasks={otherTasks} expanded={expandedSection === "other"}
              onToggle={() => setExpandedSection(expandedSection === "other" ? null : "other")}
              onTaskUpdate={onTaskUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}
/* ─── Phase 4: مخطط البلدية ─── */
function PhaseMunicipalityPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[3];
  const [expandedSection, setExpandedSection] = useState<string | null>("drawings");

  const drawingTasks = phase.tasks.filter(t => t.name.includes("مخطط") || t.name.includes("رسم") || t.name.includes("لوحة"));
  const submissionTasks = phase.tasks.filter(t => t.name.includes("تقديم") || t.name.includes("رفع") || t.name.includes("إرسال"));
  const approvalTasks = phase.tasks.filter(t => t.name.includes("اعتماد") || t.name.includes("موافقة") || t.name.includes("رخصة"));
  const otherTasks = phase.tasks.filter(t =>
    !drawingTasks.find(x => x.id === t.id) &&
    !submissionTasks.find(x => x.id === t.id) &&
    !approvalTasks.find(x => x.id === t.id)
  );

  const doneCount = phase.tasks.filter(t => t.status === "done").length;
  const progress = phase.tasks.length > 0 ? Math.round((doneCount / phase.tasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-background w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b" style={{ backgroundColor: `color-mix(in oklch, ${color} 8%, white)` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <FileText className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">مخطط البلدية</h3>
                <p className="text-[11px] text-muted-foreground">إعداد وتقديم مخططات البلدية</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs font-bold shrink-0" style={{ color, fontFamily: "'Space Grotesk'" }}>{doneCount}/{phase.tasks.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {drawingTasks.length > 0 && (
            <TaskGroup title="إعداد المخططات" subtitle="رسم لوحات البلدية بالمعايير المطلوبة"
              icon={<Pencil className="w-3.5 h-3.5 text-white" />} color={color}
              tasks={drawingTasks} expanded={expandedSection === "drawings"}
              onToggle={() => setExpandedSection(expandedSection === "drawings" ? null : "drawings")}
              onTaskUpdate={onTaskUpdate} />
          )}

          {submissionTasks.length > 0 && (
            <TaskGroup title="التقديم للبلدية" subtitle="رفع الملفات وتقديم الطلبات"
              icon={<Upload className="w-3.5 h-3.5 text-white" />} color="oklch(0.55 0.15 250)"
              tasks={submissionTasks} expanded={expandedSection === "submission"}
              onToggle={() => setExpandedSection(expandedSection === "submission" ? null : "submission")}
              onTaskUpdate={onTaskUpdate} />
          )}

          {approvalTasks.length > 0 && (
            <TaskGroup title="الاعتمادات والرخص" subtitle="متابعة الموافقات واستلام الرخصة"
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />} color="oklch(0.55 0.15 150)"
              tasks={approvalTasks} expanded={expandedSection === "approval"}
              onToggle={() => setExpandedSection(expandedSection === "approval" ? null : "approval")}
              onTaskUpdate={onTaskUpdate} />
          )}

          {/* ── رفع ملفات مخطط البلدية ── */}
          <div className="rounded-xl border-2 border-dashed overflow-hidden" style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)` }}>
            <div className="px-3 py-3 flex items-center gap-2">
              <FileUploadButton label="رفع ملف" category="مخطط بلدية" projectId={project.id} clientId={project.clientId} onUploaded={() => { toast.success("تم رفع الملف — سيظهر في المستندات ✓"); }} />
              <span className="text-[10px] text-muted-foreground">ارفع أي ملف مرتبط بمخطط البلدية — سيظهر في المستندات</span>
            </div>
          </div>

          {otherTasks.length > 0 && (
            <TaskGroup title="مهام أخرى" subtitle="" icon={<Wrench className="w-3.5 h-3.5 text-white" />}
              color="oklch(0.60 0.00 0)" tasks={otherTasks} expanded={expandedSection === "other"}
              onToggle={() => setExpandedSection(expandedSection === "other" ? null : "other")}
              onTaskUpdate={onTaskUpdate} />
          )}

          {phase.tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">لا توجد مهام في هذه المرحلة</p>
              <p className="text-xs mt-1">سيتم إنشاء المهام تلقائياً عند الوصول لهذه المرحلة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Phase 5: تقديم البلدية
   ═══════════════════════════════════════════════════════════════════ */
function PhaseMunicipalitySubmissionPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[4];
  const { data: muniData } = useMunicipalitySubmission(project.id);
  const updateMuni = useUpdateMunicipality(project.id);
  const { data: allDocs = [], refetch: refetchDocs } = useDocuments({ projectId: project.id });
  const [notes, setNotes] = useState("");
  const [refNum, setRefNum] = useState("");
  const [licenseNum, setLicenseNum] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  const muniDocs = allDocs.filter(d => d.category?.includes("بلدية") || d.category?.includes("رخصة"));
  const status = muniData?.muniStatus || "not_submitted";
  const statusLabel = status === "license_received" ? "تم استلام الرخصة ✓" : status === "submitted" ? "تم التقديم - قيد المراجعة" : "لم يتم التقديم بعد";
  const statusColor = status === "license_received" ? "oklch(0.55 0.15 150)" : status === "submitted" ? "oklch(0.55 0.15 250)" : "oklch(0.70 0.00 0)";

  const markSubmitted = () => {
    updateMuni.mutate({ muniStatus: "submitted", referenceNumber: refNum, notes }, {
      onSuccess: () => toast.success("تم تسجيل التقديم ✓"),
    });
  };
  const markLicenseReceived = () => {
    updateMuni.mutate({ muniStatus: "license_received", licenseNumber: licenseNum, notes }, {
      onSuccess: () => toast.success("تم تسجيل استلام الرخصة ✓"),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color }}>
                <Upload className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">تقديم البلدية</h3>
                <p className="text-[11px] text-muted-foreground">متابعة التقديم واستلام الرخصة</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* حالة التقديم */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: `color-mix(in oklch, ${statusColor} 30%, transparent)`, background: `color-mix(in oklch, ${statusColor} 8%, transparent)` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
            <span className="text-xs font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* الخطوة 1: تسجيل التقديم */}
          <div className="rounded-xl border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: status !== "not_submitted" ? "oklch(0.55 0.15 150)" : color }}>
                {status !== "not_submitted" ? "✓" : "1"}
              </div>
              <p className="text-xs font-bold">تسجيل التقديم</p>
            </div>
            {status === "not_submitted" && (
              <div className="space-y-2">
                <input
                  value={refNum}
                  onChange={e => setRefNum(e.target.value)}
                  placeholder="رقم المرجع / رقم الطلب (اختياري)"
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-muted/20 focus:outline-none focus:ring-1"
                />
                <button
                  onClick={markSubmitted}
                  disabled={updateMuni.isPending}
                  className="w-full h-9 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: color }}
                >
                  <Check className="w-3.5 h-3.5" /> تم التقديم
                </button>
              </div>
            )}
            {status !== "not_submitted" && muniData?.referenceNumber && (
              <p className="text-[11px] text-muted-foreground">رقم المرجع: <span className="font-medium text-foreground">{muniData.referenceNumber}</span></p>
            )}
          </div>

          {/* الخطوة 2: استلام الرخصة */}
          <div className="rounded-xl border p-3 space-y-3" style={{ opacity: status === "not_submitted" ? 0.5 : 1 }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: status === "license_received" ? "oklch(0.55 0.15 150)" : "oklch(0.70 0.00 0)" }}>
                {status === "license_received" ? "✓" : "2"}
              </div>
              <p className="text-xs font-bold">استلام الرخصة</p>
            </div>
            {status === "submitted" && (
              <div className="space-y-2">
                <input
                  value={licenseNum}
                  onChange={e => setLicenseNum(e.target.value)}
                  placeholder="رقم الرخصة"
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-muted/20 focus:outline-none focus:ring-1"
                />
                <button
                  onClick={markLicenseReceived}
                  disabled={updateMuni.isPending || !licenseNum}
                  className="w-full h-9 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: "oklch(0.55 0.15 150)" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم استلام الرخصة
                </button>
              </div>
            )}
            {status === "license_received" && muniData?.licenseNumber && (
              <p className="text-[11px] text-muted-foreground">رقم الرخصة: <span className="font-medium text-foreground">{muniData.licenseNumber}</span></p>
            )}
          </div>

          {/* رفع الرخصة والمخطط المعتمد */}
          <div className="rounded-xl border-2 border-dashed p-3 space-y-2" style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)` }}>
            <p className="text-xs font-bold">رفع الرخصة والمخطط المعتمد</p>
            <div className="flex flex-wrap gap-2">
              <FileUploadButton label="رفع الرخصة" category="رخصة بلدية" projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
              <FileUploadButton label="رفع المخطط المعتمد" category="مخطط بلدية معتمد" projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
            </div>
            <UploadedFilesList docs={muniDocs} onDeleted={() => refetchDocs()} />
          </div>

          {/* ملاحظات */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold">ملاحظات</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="أي ملاحظات على التقديم أو الرخصة..."
              rows={3}
              className="w-full text-xs border rounded-xl px-3 py-2 bg-muted/20 focus:outline-none focus:ring-1 resize-none"
            />
            {notes && (
              <button
                onClick={() => updateMuni.mutate({ notes }, { onSuccess: () => toast.success("تم حفظ الملاحظات ✓") })}
                className="text-[11px] px-3 py-1.5 rounded-lg border font-medium hover:bg-muted/30 transition-colors"
              >
                حفظ الملاحظات
              </button>
            )}
          </div>

          {/* إضافة مهمة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">مهام إضافية</p>
              <button
                onClick={() => setShowNewTask(!showNewTask)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border font-medium hover:bg-muted/30 transition-colors"
              >
                <Plus className="w-3 h-3" /> إضافة مهمة
              </button>
            </div>
            {showNewTask && (
              <div className="rounded-xl border p-3 space-y-2 bg-muted/10">
                <input
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  placeholder="اسم المهمة"
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1"
                />
                <input
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  placeholder="المسؤول (اختياري)"
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (newTaskName) { toast.success("تم إضافة المهمة ✓"); setNewTaskName(""); setNewTaskAssignee(""); setShowNewTask(false); } }}
                    className="flex-1 h-8 rounded-lg text-xs font-semibold text-white"
                    style={{ background: color }}
                  >
                    إضافة
                  </button>
                  <button onClick={() => setShowNewTask(false)} className="flex-1 h-8 rounded-lg text-xs font-semibold border hover:bg-muted/30">إلغاء</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Phase 6: المخططات التفصيلية
   ═══════════════════════════════════════════════════════════════════ */
const DRAWING_TYPES = [
  { key: "electrical", label: "مخططات الكهرباء", icon: "⚡" },
  { key: "plumbing", label: "مخططات الصرف الصحي", icon: "🔧" },
  { key: "furniture", label: "مخطط الفرش", icon: "🪑" },
  { key: "elec_points", label: "نقاط الكهرباء", icon: "🔌" },
  { key: "lighting", label: "مخطط الإضاءة", icon: "💡" },
  { key: "other", label: "مخطط آخر", icon: "📐" },
];

const DRAWING_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: "لم يبدأ",    color: "oklch(0.70 0.00 0)" },
  in_progress: { label: "جارٍ",       color: "oklch(0.55 0.15 250)" },
  completed:   { label: "منجز",       color: "oklch(0.60 0.12 60)" },
  approved:    { label: "معتمد ✓",    color: "oklch(0.55 0.15 150)" },
};

function PhaseDetailedDrawingsPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[5];
  const { data: drawings = [], refetch: refetchDrawings } = useDetailedDrawings(project.id);
  const createDrawing = useCreateDrawing(project.id);
  const updateDrawing = useUpdateDrawing(project.id);
  const { data: employees = [] } = useEmployees();
  const { data: allDocs = [], refetch: refetchDocs } = useDocuments({ projectId: project.id });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDrawingType, setNewDrawingType] = useState("electrical");
  const [newCustomType, setNewCustomType] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  const drawingDocs = allDocs.filter(d => d.category?.includes("مخطط تفصيلي") || d.category?.includes("كهرباء") || d.category?.includes("صحي"));

  const addDrawing = () => {
    const label = newDrawingType === "other" ? newCustomType : (DRAWING_TYPES.find(t => t.key === newDrawingType)?.label || newDrawingType);
    if (!label) return;
    createDrawing.mutate({
      drawingType: label,
      assignedTo: newAssignee,
      drawingStatus: "pending",
      phaseId: phase.id || 0,
    }, {
      onSuccess: () => {
        toast.success("تم إضافة المخطط ✓");
        setShowAddForm(false);
        setNewCustomType("");
        setNewAssignee("");
      },
    });
  };

  const toggleStatus = (drawing: DetailedDrawing) => {
    const statuses = ["pending", "in_progress", "completed", "approved"] as const;
    const curr = drawing.drawingStatus || "pending";
    const next = statuses[(statuses.indexOf(curr as typeof statuses[number]) + 1) % statuses.length];
    updateDrawing.mutate({ id: drawing.id!, drawingStatus: next }, {
      onSuccess: () => toast.success("تم تحديث الحالة ✓"),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color }}>
                <Pencil className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">المخططات التفصيلية</h3>
                <p className="text-[11px] text-muted-foreground">كهرباء • صحي • فرش • إضاءة</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border font-medium hover:bg-muted/30 transition-colors"
              >
                <Plus className="w-3 h-3" /> إضافة مخطط
              </button>
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* نموذج إضافة مخطط */}
          {showAddForm && (
            <div className="rounded-xl border p-3 space-y-2 bg-muted/10">
              <p className="text-xs font-bold">إضافة مخطط جديد</p>
              <select
                value={newDrawingType}
                onChange={e => setNewDrawingType(e.target.value)}
                className="w-full text-xs border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1"
              >
                {DRAWING_TYPES.map(t => (
                  <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
                ))}
              </select>
              {newDrawingType === "other" && (
                <input
                  value={newCustomType}
                  onChange={e => setNewCustomType(e.target.value)}
                  placeholder="اسم المخطط"
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1"
                />
              )}
              <select
                value={newAssignee}
                onChange={e => setNewAssignee(e.target.value)}
                className="w-full text-xs border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1"
              >
                <option value="">-- تعيين مسؤول (اختياري) --</option>
                {employees.filter(e => e.isActive).map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name} - {emp.role}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={addDrawing}
                  disabled={createDrawing.isPending}
                  className="flex-1 h-8 rounded-lg text-xs font-semibold text-white"
                  style={{ background: color }}
                >
                  إضافة
                </button>
                <button onClick={() => setShowAddForm(false)} className="flex-1 h-8 rounded-lg text-xs font-semibold border hover:bg-muted/30">إلغاء</button>
              </div>
            </div>
          )}

          {/* قائمة المخططات */}
          {drawings.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-muted-foreground">
              <Pencil className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">لا توجد مخططات بعد</p>
              <p className="text-xs mt-1">اضغط "إضافة مخطط" لبدء العمل</p>
            </div>
          )}
          {drawings.map(drawing => {
            const stCfg = DRAWING_STATUS_CONFIG[drawing.drawingStatus || "pending"];
            return (
              <div key={drawing.id} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
                      {DRAWING_TYPES.find(t => t.label === drawing.drawingType)?.icon || "📐"}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{drawing.drawingType}</p>
                      {drawing.assignedTo && <p className="text-[10px] text-muted-foreground">المسؤول: {drawing.assignedTo}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(drawing)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors"
                    style={{ color: stCfg.color, borderColor: `color-mix(in oklch, ${stCfg.color} 30%, transparent)`, background: `color-mix(in oklch, ${stCfg.color} 8%, transparent)` }}
                  >
                    {stCfg.label}
                  </button>
                </div>
                {/* رفع الملف */}
                <div className="flex items-center gap-2">
                  <FileUploadButton
                    label={drawing.fileUrl ? "تحديث الملف" : "رفع الملف"}
                    category={`مخطط تفصيلي - ${drawing.drawingType}`}
                    projectId={project.id}
                    clientId={project.clientId}
                    onUploaded={(doc) => {
                      updateDrawing.mutate({ id: drawing.id!, fileUrl: doc.url, drawingStatus: "completed" }, {
                        onSuccess: () => { toast.success("تم رفع الملف ✓"); refetchDocs(); },
                      });
                    }}
                  />
                  {drawing.fileUrl && (
                    <a href={drawing.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                      <Eye className="w-3 h-3" /> عرض
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {/* ملفات المخططات المرفوعة */}
          {drawingDocs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2">الملفات المرفوعة</p>
              <UploadedFilesList docs={drawingDocs} onDeleted={() => refetchDocs()} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Phase 7: الإشراف الهندسي
   ═══════════════════════════════════════════════════════════════════ */

// مراحل الإشراف - dropdown
const SUPERVISION_STAGES = [
  { key: "excavation",       label: "الحفر واستلام المنسوب والحدود",    group: "أعمال التأسيس" },
  { key: "elevator_pit",     label: "بير المصعد والجور المجاري",         group: "أعمال التأسيس" },
  { key: "foundations",      label: "القواعد",                           group: "أعمال التأسيس" },
  { key: "basement_slab",    label: "اللبشة (السرداب)",                  group: "أعمال التأسيس" },
  { key: "col_necks",        label: "رقاب الأعمدة",                      group: "أعمال التأسيس" },
  { key: "basement_walls",   label: "حوائط السرداب",                     group: "أعمال التأسيس" },
  { key: "reinforced_floor", label: "الأرضية المسلحة (Slab on Grade)",   group: "أعمال التأسيس" },
  { key: "beams",            label: "الشناجات",                          group: "أعمال الهيكل" },
  { key: "basement_cols",    label: "أعمدة السرداب",                     group: "أعمال الهيكل" },
  { key: "basement_roof",    label: "سقف السرداب",                       group: "أعمال الهيكل" },
  { key: "ground_cols",      label: "أعمدة الأرضي",                      group: "أعمال الهيكل" },
  { key: "ground_roof",      label: "سقف الأرضي",                        group: "أعمال الهيكل" },
  { key: "first_cols",       label: "أعمدة الأول",                       group: "أعمال الهيكل" },
  { key: "first_roof",       label: "سقف الأول",                         group: "أعمال الهيكل" },
  { key: "second_cols",      label: "أعمدة الثاني",                      group: "أعمال الهيكل" },
  { key: "second_roof",      label: "سقف الثاني",                        group: "أعمال الهيكل" },
  { key: "service_cols",     label: "أعمدة سطح الخدمات",                group: "أعمال الهيكل" },
  { key: "service_roof",     label: "سقف سطح الخدمات",                  group: "أعمال الهيكل" },
];

// حالات بنود الجك ليست
type ItemStatus = "pending" | "accepted" | "rejected" | "accepted_with_notes";
const ITEM_STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; bg: string; short: string }> = {
  pending:             { label: "لم يُفحص",               color: "#9ca3af", bg: "#f3f4f6", short: "—" },
  accepted:            { label: "مقبول",                   color: "#16a34a", bg: "#dcfce7", short: "✓" },
  rejected:            { label: "مرفوض",                   color: "#dc2626", bg: "#fee2e2", short: "✗" },
  accepted_with_notes: { label: "مقبول بعد استيفاء الملاحظات", color: "#d97706", bg: "#fef3c7", short: "⚠" },
};

// جك ليست مخصصة لكل مرحلة
// الصحي والكهرباء فقط في: الشناجات، الأسقف، والبروزات
const STAGE_CHECKLIST: Record<string, { section: string; items: string[]; hasMEP?: boolean }[]> = {
  excavation: [
    { section: "الحفر والمنسوب", items: [
      "التأكد من أماكن الحفر وحدودها حسب المخطط",
      "التحقق من منسوب الحفر المطلوب",
      "التأكد من استواء قاع الحفر",
      "التحقق من عدم وجود تربة ضعيفة أو طينية",
      "التأكد من حدود القسيمة والأكسات",
    ]},
  ],
  elevator_pit: [
    { section: "بير المصعد والجور", items: [
      "التأكد من أبعاد بير المصعد حسب المخطط",
      "التحقق من منسوب قاع البير",
      "التأكد من أماكن جور المجاري وأبعادها",
      "التحقق من منسوب جور المجاري",
      "التأكد من التسليح حسب المخطط الإنشائي",
    ]},
  ],
  foundations: [
    { section: "أبعاد ومواضع القواعد", items: [
      "التأكد من أماكن القواعد وعددها حسب المخطط",
      "التحقق من مقاسات القواعد (طول × عرض × عمق)",
      "التأكد من أكسات القواعد بالنسبة للحدود",
    ]},
    { section: "تسليح القواعد", items: [
      "الشبكة السفلية: الأقطار والمسافات حسب المخطط",
      "الشبكة العلوية: الأقطار والمسافات حسب المخطط",
      "نهايات التسليح بزاوية 90° في الاتجاهين",
      "التربيط بين الشبكتين منتظم ولا يوجد حديد بدون ربط",
      "كفايات رقاب الأعمدة داخل القاعدة بالطول المطلوب",
      "الغطاء الخرساني (Cover) لا يقل عن 7.5 سم",
    ]},
  ],
  basement_slab: [
    { section: "اللبشة المسلحة", items: [
      "التأكد من مقاسات اللبشة وأماكن القواعد",
      "تحديد مشرب اللبشة حسب المخطط",
      "الشبكة السفلية مستوية وبالأقطار المطلوبة",
      "الشبكة العلوية مستوية وبالأقطار المطلوبة",
      "الغطاء الخرساني السفلي لا يقل عن 7.5 سم",
      "كفايات رقاب الأعمدة خارجة بالطول المطلوب",
    ]},
  ],
  col_necks: [
    { section: "رقاب الأعمدة", items: [
      "أماكن الأعمدة حسب المخطط الإنشائي والأكسات",
      "مقاسات الأعمدة حسب المخطط",
      "تسليح الرقاب (أقطار وعدد) حسب المخطط",
      "الكفايات بالمسافات المطلوبة ومربوطة بزاوية 90°",
      "ارتفاع رقاب الأعمدة بحديد الصب صحيح",
      "أشاير الأعمدة لا تقل عن 75 سم",
    ]},
  ],
  basement_walls: [
    { section: "حوائط السرداب", items: [
      "وجود قاعدة شريطية أسفل الحوائط",
      "تسليح المواطن بالعدد المطلوب من القاعدة",
      "ارتفاع التسليح من اللبشة لا يقل عن 75 سم",
      "أشاير أعلى رقم الحائط لعمل رقم التسليح",
      "التسليح الرأسي والأفقي بالفي المطلوب",
    ]},
  ],
  reinforced_floor: [
    { section: "أرضية أرضي (Slab on Grade)", items: [
      "الدفان أسفل البلاطة مدكوك بشكل جيد",
      "نايلون حماية أسفل التسليح موجود",
      "تسليح البلاطة حسب المخطط ومربوط جيداً",
      "الغطاء الخرساني السفلي لا يقل عن 5 سم",
    ]},
  ],
  beams: [
    { section: "الشناجات الإنشائية", items: [
      "مقاسات الشناجات (عرض × عمق) حسب المخطط",
      "التسليح العلوي: الأقطار والعدد حسب المخطط",
      "التسليح السفلي: الأقطار والعدد حسب المخطط",
      "الكفايات: العدد والمسافات ومربوطة بزاوية 90°",
      "التسليح السفلي مربوط بالكفايات كل 1م على الأقل",
    ], hasMEP: true },
    { section: "الصحي والكهرباء في الشناجات", items: [
      "مواضع بايبات الصرف الصحي حسب المخطط",
      "ميول بايبات الصرف صحيحة (لا تقل عن 1%)",
      "أقطار بايبات الصرف حسب المخطط الصحي",
      "مواضع بايبات الكهرباء (Conduit) حسب المخطط",
      "أقطار بايبات الكهرباء مناسبة للكابلات",
      "تثبيت البايبات جيداً قبل الصب",
    ]},
  ],
  basement_cols: [
    { section: "أعمدة السرداب", items: [
      "تسليح الأعمدة حسب المخطط (أقطار وعدد)",
      "أشاير الأعمدة لا تقل عن 75 سم",
      "الكفايات: العدد والمسافات حسب التفصيل",
      "التكفيف في أول وآخر ثلث من العمود",
      "الأعمدة المزروعة مربوطة جيداً بزاوية 90°",
      "قفل الكفايات لا يقل عن 7 سم في الاتجاهين",
    ]},
  ],
  basement_roof: [
    { section: "سقف السرداب - الإنشائي", items: [
      "الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي",
      "التسليح السفلي للجسور مربوط بالكفايات كل 1م",
      "الشبكات السفلية والعلوية للبلاطة حسب المخطط",
      "الكفايات ومربوطة جيداً وبالعدد المطلوب",
      "تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف",
      "تسليح البروزات كافٍ حسب المخطط",
    ], hasMEP: true },
    { section: "الصحي والكهرباء في السقف", items: [
      "مواضع بايبات الصرف الصحي حسب المخطط",
      "ميول بايبات الصرف صحيحة",
      "مواضع بايبات الكهرباء (Conduit) حسب المخطط",
      "تثبيت البايبات جيداً قبل الصب",
    ]},
    { section: "البروزات", items: [
      "مطابقة بروزات الواجهات للمخطط المعماري",
      "أبعاد البروزات ومناسيبها صحيحة",
      "تسليح البروزات كافٍ",
    ]},
  ],
  ground_cols: [
    { section: "أعمدة الأرضي", items: [
      "تسليح الأعمدة حسب المخطط (أقطار وعدد)",
      "أشاير الأعمدة لا تقل عن 75 سم",
      "الكفايات: العدد والمسافات حسب التفصيل",
      "التكفيف في أول وآخر ثلث من العمود",
      "الأعمدة المزروعة مربوطة جيداً بزاوية 90°",
      "قفل الكفايات لا يقل عن 7 سم في الاتجاهين",
    ]},
  ],
  ground_roof: [
    { section: "سقف الأرضي - الإنشائي", items: [
      "الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي",
      "التسليح السفلي للجسور مربوط بالكفايات كل 1م",
      "الشبكات السفلية والعلوية للبلاطة حسب المخطط",
      "الكفايات ومربوطة جيداً وبالعدد المطلوب",
      "تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف",
      "تسليح البلاطة الواحدة طولية وعرضية بالمسافات الصحيحة",
      "استمرار تسليح البلاطة إلى البلاطة المجاورة بمسافة المحذور",
    ], hasMEP: true },
    { section: "الصحي والكهرباء في السقف", items: [
      "مواضع بايبات الصرف الصحي حسب المخطط",
      "ميول بايبات الصرف صحيحة",
      "مواضع بايبات الكهرباء (Conduit) حسب المخطط",
      "تثبيت البايبات جيداً قبل الصب",
    ]},
    { section: "البروزات", items: [
      "مطابقة بروزات الواجهات للمخطط المعماري",
      "أبعاد البروزات ومناسيبها صحيحة",
      "تسليح البروزات كافٍ",
    ]},
  ],
  first_cols: [
    { section: "أعمدة الأول", items: [
      "تسليح الأعمدة حسب المخطط (أقطار وعدد)",
      "أشاير الأعمدة لا تقل عن 75 سم",
      "الكفايات: العدد والمسافات حسب التفصيل",
      "التكفيف في أول وآخر ثلث من العمود",
      "قفل الكفايات لا يقل عن 7 سم في الاتجاهين",
    ]},
  ],
  first_roof: [
    { section: "سقف الأول - الإنشائي", items: [
      "الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي",
      "التسليح السفلي للجسور مربوط بالكفايات كل 1م",
      "الشبكات السفلية والعلوية للبلاطة حسب المخطط",
      "الكفايات ومربوطة جيداً وبالعدد المطلوب",
      "تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف",
      "تسليح البلاطة الواحدة بالمسافات الصحيحة",
    ], hasMEP: true },
    { section: "الصحي والكهرباء في السقف", items: [
      "مواضع بايبات الصرف الصحي حسب المخطط",
      "ميول بايبات الصرف صحيحة",
      "مواضع بايبات الكهرباء (Conduit) حسب المخطط",
      "تثبيت البايبات جيداً قبل الصب",
    ]},
    { section: "البروزات", items: [
      "مطابقة بروزات الواجهات للمخطط المعماري",
      "أبعاد البروزات ومناسيبها صحيحة",
      "تسليح البروزات كافٍ",
    ]},
  ],
  second_cols: [
    { section: "أعمدة الثاني", items: [
      "تسليح الأعمدة حسب المخطط (أقطار وعدد)",
      "أشاير الأعمدة لا تقل عن 75 سم",
      "الكفايات: العدد والمسافات حسب التفصيل",
      "التكفيف في أول وآخر ثلث من العمود",
      "قفل الكفايات لا يقل عن 7 سم في الاتجاهين",
    ]},
  ],
  second_roof: [
    { section: "سقف الثاني - الإنشائي", items: [
      "الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي",
      "التسليح السفلي للجسور مربوط بالكفايات كل 1م",
      "الشبكات السفلية والعلوية للبلاطة حسب المخطط",
      "الكفايات ومربوطة جيداً وبالعدد المطلوب",
      "تفصيلة الكفات (مزدوجة أو فردية) حسب الكاشف",
    ], hasMEP: true },
    { section: "الصحي والكهرباء في السقف", items: [
      "مواضع بايبات الصرف الصحي حسب المخطط",
      "ميول بايبات الصرف صحيحة",
      "مواضع بايبات الكهرباء (Conduit) حسب المخطط",
      "تثبيت البايبات جيداً قبل الصب",
    ]},
    { section: "البروزات", items: [
      "مطابقة بروزات الواجهات للمخطط المعماري",
      "أبعاد البروزات ومناسيبها صحيحة",
      "تسليح البروزات كافٍ",
    ]},
  ],
  service_cols: [
    { section: "أعمدة سطح الخدمات", items: [
      "تسليح الأعمدة حسب المخطط (أقطار وعدد)",
      "أشاير الأعمدة لا تقل عن 75 سم",
      "الكفايات: العدد والمسافات حسب التفصيل",
      "قفل الكفايات لا يقل عن 7 سم في الاتجاهين",
    ]},
  ],
  service_roof: [
    { section: "سقف سطح الخدمات - الإنشائي", items: [
      "الجسور بالمقاسات المذكورة والتسليح العلوي والسفلي",
      "الشبكات السفلية والعلوية للبلاطة حسب المخطط",
      "الكفايات ومربوطة جيداً وبالعدد المطلوب",
    ], hasMEP: true },
    { section: "الصحي والكهرباء في السقف", items: [
      "مواضع بايبات الصرف الصحي حسب المخطط",
      "ميول بايبات الصرف صحيحة",
      "مواضع بايبات الكهرباء (Conduit) حسب المخطط",
      "تثبيت البايبات جيداً قبل الصب",
    ]},
    { section: "البروزات", items: [
      "مطابقة بروزات الواجهات للمخطط المعماري",
      "أبعاد البروزات ومناسيبها صحيحة",
      "تسليح البروزات كافٍ",
    ]},
  ],
};

// الجك ليست الافتراضية للمراحل غير المعرّفة
const DEFAULT_STAGE_CHECKLIST = [
  { section: "العناصر الإنشائية", items: [
    "التأكد من مطابقة الأبعاد للمخطط",
    "التأكد من التسليح حسب المخطط الإنشائي",
    "التأكد من الكفايات والتربيط",
  ]},
];

// حساب إحصائيات الجك ليست من checklistData JSON
function parseChecklistStats(checklistData: string | undefined) {
  if (!checklistData) return { total: 0, accepted: 0, rejected: 0, withNotes: 0, pending: 0 };
  try {
    const data: Record<string, ItemStatus> = JSON.parse(checklistData);
    const values = Object.values(data);
    return {
      total: values.length,
      accepted: values.filter(v => v === "accepted").length,
      rejected: values.filter(v => v === "rejected").length,
      withNotes: values.filter(v => v === "accepted_with_notes").length,
      pending: values.filter(v => v === "pending" || !v).length,
    };
  } catch { return { total: 0, accepted: 0, rejected: 0, withNotes: 0, pending: 0 }; }
}

export function PhaseSupervisionPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[6];
  const { data: visits = [], refetch: refetchVisits } = useSupervisionVisits(project.id);
  const createVisit = useCreateSupervisionVisit(project.id);
  const updateVisit = useUpdateSupervisionVisit(project.id);
  const { data: allDocs = [], refetch: refetchDocs } = useDocuments({ projectId: project.id });
  // استيراد بيانات الرخصة من كرت البلدية
  const { data: muniData } = useMunicipalitySubmission(project.id);

  // الحالة الرئيسية: اختيار المرحلة من dropdown
  const [selectedStageKey, setSelectedStageKey] = useState<string>(SUPERVISION_STAGES[0].key);
  // الزيارة النشطة (جارية)
  const [activeVisit, setActiveVisit] = useState<SupervisionVisit | null>(null);
  // حالة بنود الجك ليست: Record<"sIdx-iIdx", ItemStatus>
  const [checklistState, setChecklistState] = useState<Record<string, ItemStatus>>({});
  // ملاحظات كل بند: Record<"sIdx-iIdx", string>
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  // ملاحظات الزيارة
  const [visitNotes, setVisitNotes] = useState("");
  // المهندس المشرف: يُستورد من المسؤول عن مهام مرحلة الإشراف
  const autoEngineer = phase.tasks.find(t => t.assignee)?.assignee || "";
  const [engineerName, setEngineerName] = useState(autoEngineer);
  // المقاول: يُحفظ محلياً لكل مشروع (مرة واحدة)
  const contractorKey = `contractor_${project.id}`;
  const [contractorName, setContractorName] = useState(() => localStorage.getItem(contractorKey + "_name") || "");
  const [contractorPhone, setContractorPhone] = useState(() => localStorage.getItem(contractorKey + "_phone") || "");
  // رقم الرخصة: يُستورد من بيانات البلدية المعتمدة
  const autoLicense = muniData?.licenseNumber || "";
  const [licenseNumber, setLicenseNumber] = useState(autoLicense);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);

  // تحديث بيانات المقاول في localStorage عند التغيير
  const saveContractor = (name: string, phone: string) => {
    localStorage.setItem(contractorKey + "_name", name);
    localStorage.setItem(contractorKey + "_phone", phone);
  };

  // تحديث المهندس والرخصة عند تغيير بيانات المشروع
  React.useEffect(() => {
    if (autoEngineer && !engineerName) setEngineerName(autoEngineer);
  }, [autoEngineer]);
  React.useEffect(() => {
    if (autoLicense && !licenseNumber) setLicenseNumber(autoLicense);
  }, [autoLicense]);

  // المخططات المعتمدة (مرفوعة مسبقاً من المعماري)
  const technicalDocs = allDocs.filter(d =>
    d.category?.includes("ملف فني") ||
    d.category?.includes("مخطط معتمد") ||
    d.category?.includes("إشراف")
  );

  // زيارات المرحلة المختارة
  const stageVisits = visits.filter(v => v.stageKey === selectedStageKey);
  const stageCompleted = stageVisits.some(v => v.visitStatus === "completed" || v.visitStatus === "approved");
  const stageInProgress = stageVisits.find(v => v.visitStatus === "in_progress" || v.visitStatus === "draft");

  // بنود الجك ليست للمرحلة المختارة
  const checklistSections = STAGE_CHECKLIST[selectedStageKey] || DEFAULT_STAGE_CHECKLIST;
  const totalItems = checklistSections.reduce((sum, s) => sum + s.items.length, 0);
  const acceptedItems = Object.values(checklistState).filter(v => v === "accepted").length;
  const rejectedItems = Object.values(checklistState).filter(v => v === "rejected").length;
  const withNotesItems = Object.values(checklistState).filter(v => v === "accepted_with_notes").length;

  // عند اختيار مرحلة جديدة: تحميل الزيارة الجارية إن وجدت
  const handleStageChange = (key: string) => {
    setSelectedStageKey(key);
    setActiveVisit(null);
    setChecklistState({});
    setItemNotes({});
    setShowStartForm(false);
    const inProgress = visits.find(v => v.stageKey === key && (v.visitStatus === "in_progress" || v.visitStatus === "draft"));
    if (inProgress) {
      setActiveVisit(inProgress);
      try {
        const parsed: Record<string, ItemStatus> = JSON.parse(inProgress.checklistData || "{}");
        setChecklistState(parsed);
      } catch {}
      try {
        const parsedNotes: Record<string, string> = JSON.parse(inProgress.itemNotes || "{}");
        setItemNotes(parsedNotes);
      } catch {}
      setEngineerName(inProgress.engineerName || autoEngineer);
      setContractorName(inProgress.contractorName || localStorage.getItem(contractorKey + "_name") || "");
      setContractorPhone(inProgress.contractorPhone || localStorage.getItem(contractorKey + "_phone") || "");
      setLicenseNumber(inProgress.licenseNumber || autoLicense);
      setVisitNotes(inProgress.generalNotes || "");
    }
  };

  // بدء زيارة جديدة
  const startVisit = () => {
    const stage = SUPERVISION_STAGES.find(s => s.key === selectedStageKey);
    // تهيئة الجك ليست بـ pending
    const initChecklist: Record<string, ItemStatus> = {};
    checklistSections.forEach((sec, sIdx) => {
      sec.items.forEach((_, iIdx) => {
        initChecklist[`${sIdx}-${iIdx}`] = "pending";
      });
    });
    // حفظ بيانات المقاول محلياً
    saveContractor(contractorName, contractorPhone);
    createVisit.mutate({
      constructionStage: stage?.label || selectedStageKey,
      stageKey: selectedStageKey,
      visitDate: new Date().toISOString().split("T")[0],
      visitStatus: "in_progress",
      engineerName,
      contractorName,
      contractorPhone,
      licenseNumber,
      generalNotes: visitNotes,
      checklistData: JSON.stringify(initChecklist),
      itemNotes: "{}",
    }, {
      onSuccess: (visit: unknown) => {
        toast.success("تم بدء الزيارة ✓");
        const v = visit as SupervisionVisit;
        setActiveVisit(v);
        setChecklistState(initChecklist);
        setItemNotes({});
        setShowStartForm(false);
      },
    });
  };

  // تغيير حالة بند في الجك ليست (دوري: pending → accepted → rejected → accepted_with_notes → pending)
  const cycleItemStatus = (sIdx: number, iIdx: number) => {
    const key = `${sIdx}-${iIdx}`;
    const current = checklistState[key] || "pending";
    const cycle: ItemStatus[] = ["pending", "accepted", "rejected", "accepted_with_notes"];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    setChecklistState(prev => ({ ...prev, [key]: next }));
    // إذا تغيرت الحالة إلى pending أو accepted، امسح الملاحظة
    if (next === "pending" || next === "accepted") {
      setItemNotes(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  // تعيين ملاحظة بند
  const setItemNote = (sIdx: number, iIdx: number, note: string) => {
    const key = `${sIdx}-${iIdx}`;
    setItemNotes(prev => ({ ...prev, [key]: note }));
  };

  // حفظ الجك ليست
  const saveChecklist = () => {
    if (!activeVisit?.id) return;
    saveContractor(contractorName, contractorPhone);
    updateVisit.mutate({
      id: activeVisit.id,
      checklistData: JSON.stringify(checklistState),
      itemNotes: JSON.stringify(itemNotes),
      engineerName,
      contractorName,
      contractorPhone,
      licenseNumber,
      generalNotes: visitNotes,
    }, {
      onSuccess: () => toast.success("تم الحفظ ✓"),
    });
  };

  // إنهاء الزيارة وتوليد PDF
  const completeVisit = async () => {
    if (!activeVisit?.id) return;
    setGeneratingPdf(true);
    try {
      saveContractor(contractorName, contractorPhone);
      await updateVisit.mutateAsync({
        id: activeVisit.id,
        visitStatus: "completed",
        checklistData: JSON.stringify(checklistState),
        itemNotes: JSON.stringify(itemNotes),
        engineerName,
        contractorName,
        contractorPhone,
        licenseNumber,
        generalNotes: visitNotes,
      });
      toast.success("تم إنهاء الزيارة ✓");
      // فتح PDF في نافذة جديدة للطباعة
      const win = window.open(`/api/supervision/visits/${activeVisit.id}/pdf`, "_blank");
      if (win) setTimeout(() => win.print(), 1000);
      setActiveVisit(null);
      setChecklistState({});
      refetchVisits();
    } catch {
      toast.error("حدث خطأ أثناء إنهاء الزيارة");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // إحصائيات عامة
  const completedStages = SUPERVISION_STAGES.filter(s =>
    visits.some(v => v.stageKey === s.key && (v.visitStatus === "completed" || v.visitStatus === "approved"))
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color }}>
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">الإشراف الهندسي</h3>
                <p className="text-[11px] text-muted-foreground">
                  {completedStages} / {SUPERVISION_STAGES.length} مرحلة مكتملة
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* شريط تقدم المراحل */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${(completedStages / SUPERVISION_STAGES.length) * 100}%`, background: color }} />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* ── Dropdown اختيار المرحلة ── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">مرحلة الإشراف</label>
            <select
              value={selectedStageKey}
              onChange={e => handleStageChange(e.target.value)}
              className="w-full text-sm border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 font-medium"
              style={{ borderColor: `color-mix(in oklch, ${color} 40%, transparent)` }}
            >
              {(() => {
                const groups = [...new Set(SUPERVISION_STAGES.map(s => s.group))];
                return groups.map(group => (
                  <optgroup key={group} label={group}>
                    {SUPERVISION_STAGES.filter(s => s.group === group).map(s => {
                      const sv = visits.filter(v => v.stageKey === s.key);
                      const done = sv.some(v => v.visitStatus === "completed" || v.visitStatus === "approved");
                      const inProg = sv.some(v => v.visitStatus === "in_progress" || v.visitStatus === "draft");
                      const prefix = done ? "✓ " : inProg ? "⏳ " : "";
                      return <option key={s.key} value={s.key}>{prefix}{s.label}</option>;
                    })}
                  </optgroup>
                ));
              })()}
            </select>
          </div>

          {/* ── حالة المرحلة المختارة ── */}
          <div className="rounded-xl border overflow-hidden">
            <div className="px-3 py-2.5 flex items-center justify-between border-b"
              style={{ background: `color-mix(in oklch, ${color} 8%, transparent)` }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: stageCompleted ? "oklch(0.55 0.15 150)" : stageInProgress ? color : "oklch(0.75 0 0)" }}>
                  {stageCompleted ? "✓" : stageInProgress ? "⏳" : "○"}
                </div>
                <span className="text-sm font-semibold">
                  {SUPERVISION_STAGES.find(s => s.key === selectedStageKey)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stageCompleted && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "oklch(0.55 0.15 150 / 0.15)", color: "oklch(0.45 0.15 150)" }}>
                      ✓ مكتملة
                    </span>
                    <button
                      onClick={() => {
                        const completedVisit = stageVisits.find(v => v.visitStatus === "completed" || v.visitStatus === "approved");
                        if (completedVisit) {
                          updateVisit.mutate({ id: completedVisit.id!, visitStatus: "in_progress" }, {
                            onSuccess: () => {
                              refetchVisits();
                              setActiveVisit({ ...completedVisit, visitStatus: "in_progress" });
                              try { const parsed: Record<string, ItemStatus> = JSON.parse(completedVisit.checklistData || "{}"); setChecklistState(parsed); } catch {}
                              try { const parsedNotes: Record<string, string> = JSON.parse(completedVisit.itemNotes || "{}"); setItemNotes(parsedNotes); } catch {}
                              setEngineerName(completedVisit.engineerName || autoEngineer);
                              setContractorName(completedVisit.contractorName || "");
                              setContractorPhone(completedVisit.contractorPhone || "");
                              setLicenseNumber(completedVisit.licenseNumber || autoLicense);
                              setVisitNotes(completedVisit.generalNotes || "");
                              toast.success("تم فتح الزيارة للتعديل");
                            }
                          });
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-semibold border hover:bg-muted/30"
                    >
                      <Edit2 className="w-3 h-3" /> تعديل
                    </button>
                  </div>
                )}
                {stageInProgress && !activeVisit && (
                  <button
                    onClick={() => handleStageChange(selectedStageKey)}
                    className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-white"
                    style={{ background: color }}
                  >
                    متابعة الزيارة
                  </button>
                )}
                {!stageInProgress && !stageCompleted && !showStartForm && (
                  <button
                    onClick={() => setShowStartForm(true)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-semibold text-white"
                    style={{ background: color }}
                  >
                    <Plus className="w-3 h-3" /> بدء زيارة
                  </button>
                )}
              </div>
            </div>

            {/* إحصائيات الزيارات السابقة للمرحلة */}
            {stageVisits.length > 0 && (
              <div className="divide-y">
                {stageVisits.map(v => {
                  const stats = parseChecklistStats(v.checklistData);
                  return (
                    <div key={v.id} className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">زيارة #{v.visitNumber}</span>
                        <span className="text-[10px] text-muted-foreground">{v.visitDate}</span>
                        {v.engineerName && <span className="text-[10px] text-muted-foreground">م. {v.engineerName}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {stats.total > 0 && (
                          <div className="flex gap-1 text-[10px]">
                            <span style={{ color: "#16a34a" }}>{stats.accepted}✓</span>
                            <span style={{ color: "#dc2626" }}>{stats.rejected}✗</span>
                            <span style={{ color: "#d97706" }}>{stats.withNotes}⚠</span>
                          </div>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: v.visitStatus === "completed" ? "oklch(0.55 0.15 150 / 0.15)" : "oklch(0.55 0.15 250 / 0.15)",
                            color: v.visitStatus === "completed" ? "oklch(0.45 0.15 150)" : "oklch(0.45 0.15 250)"
                          }}>
                          {v.visitStatus === "completed" ? "مكتملة" : "جارية"}
                        </span>
                        <button
                          onClick={async () => {
                            const win = window.open(`/api/supervision/visits/${v.id}/pdf`, "_blank");
                            if (win) setTimeout(() => win.print(), 1000);
                          }}
                          className="text-[10px] flex items-center gap-0.5 px-2 py-0.5 rounded border hover:bg-muted/30"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── نموذج بدء زيارة جديدة ── */}
          {showStartForm && !activeVisit && (
            <div className="rounded-xl border p-3 space-y-3 bg-muted/10">
              <p className="text-xs font-bold">بيانات الزيارة</p>

              {/* المهندس المشرف - مستورد تلقائياً */}
              <div className="rounded-lg border p-2.5 space-y-1.5" style={{ background: "oklch(0.97 0.02 250 / 0.3)" }}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-muted-foreground">المهندس المشرف</label>
                  {autoEngineer && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.55 0.15 250 / 0.15)", color: "oklch(0.45 0.15 250)" }}>
                      مستورد من المهام
                    </span>
                  )}
                </div>
                <input value={engineerName} onChange={e => setEngineerName(e.target.value)}
                  placeholder="اسم المهندس المشرف"
                  className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
              </div>

              {/* رقم الرخصة - مستورد من البلدية */}
              <div className="rounded-lg border p-2.5 space-y-1.5" style={{ background: "oklch(0.97 0.02 150 / 0.3)" }}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-muted-foreground">رقم الرخصة</label>
                  {autoLicense && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.55 0.15 150 / 0.15)", color: "oklch(0.45 0.15 150)" }}>
                      مستورد من البلدية
                    </span>
                  )}
                </div>
                <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="رقم رخصة البناء"
                  className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
              </div>

              {/* بيانات المقاول - تُحفظ مرة واحدة */}
              <div className="rounded-lg border p-2.5 space-y-1.5" style={{ background: "oklch(0.97 0.02 30 / 0.3)" }}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-muted-foreground">بيانات المقاول</label>
                  {(localStorage.getItem(contractorKey + "_name")) && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.60 0.12 30 / 0.15)", color: "oklch(0.50 0.12 30)" }}>
                      محفوظة
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={contractorName} onChange={e => { setContractorName(e.target.value); saveContractor(e.target.value, contractorPhone); }}
                    placeholder="اسم المقاول"
                    className="text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
                  <input value={contractorPhone} onChange={e => { setContractorPhone(e.target.value); saveContractor(contractorName, e.target.value); }}
                    placeholder="رقم هاتف المقاول"
                    className="text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
                </div>
              </div>

              {/* ملاحظات الزيارة */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">ملاحظات الزيارة</label>
                <input value={visitNotes} onChange={e => setVisitNotes(e.target.value)}
                  placeholder="ملاحظات عامة للزيارة"
                  className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
              </div>

              <div className="flex gap-2">
                <button onClick={startVisit} disabled={createVisit.isPending}
                  className="flex-1 h-9 rounded-lg text-xs font-semibold text-white"
                  style={{ background: color }}>
                  {createVisit.isPending ? "جاري..." : "بدء الزيارة والجك ليست"}
                </button>
                <button onClick={() => setShowStartForm(false)}
                  className="flex-1 h-9 rounded-lg text-xs font-semibold border hover:bg-muted/30">
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* ── الجك ليست للزيارة النشطة ── */}
          {activeVisit && (
            <div className="space-y-3">
              {/* شريط التقدم والإحصائيات */}
              <div className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">قائمة التدقيق</p>
                  <div className="flex gap-3 text-[11px]">
                    <span style={{ color: "#16a34a" }} className="font-semibold">{acceptedItems} مقبول</span>
                    <span style={{ color: "#dc2626" }} className="font-semibold">{rejectedItems} مرفوض</span>
                    <span style={{ color: "#d97706" }} className="font-semibold">{withNotesItems} بملاحظات</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden flex gap-0.5">
                  <div className="h-full transition-all" style={{ width: `${totalItems > 0 ? (acceptedItems / totalItems) * 100 : 0}%`, background: "#16a34a" }} />
                  <div className="h-full transition-all" style={{ width: `${totalItems > 0 ? (withNotesItems / totalItems) * 100 : 0}%`, background: "#d97706" }} />
                  <div className="h-full transition-all" style={{ width: `${totalItems > 0 ? (rejectedItems / totalItems) * 100 : 0}%`, background: "#dc2626" }} />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  اضغط على كل بند لتغيير حالته: مقبول ✓ / مرفوض ✗ / مقبول بعد ملاحظات ⚠
                </p>
              </div>

              {/* بنود الجك ليست */}
              {checklistSections.map((section, sIdx) => (
                <div key={sIdx} className="rounded-xl border overflow-hidden">
                  <div className="px-3 py-2 border-b flex items-center gap-2"
                    style={{ background: `color-mix(in oklch, ${color} 8%, transparent)` }}>
                    <p className="text-[11px] font-bold flex-1">{section.section}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {section.items.filter((_, iIdx) => checklistState[`${sIdx}-${iIdx}`] === "accepted").length}/{section.items.length}
                    </span>
                  </div>
                  <div className="divide-y">
                    {section.items.map((item, iIdx) => {
                      const key = `${sIdx}-${iIdx}`;
                      const status: ItemStatus = checklistState[key] || "pending";
                      const cfg = ITEM_STATUS_CONFIG[status];
                      const needsNote = status === "rejected" || status === "accepted_with_notes";
                      const noteText = itemNotes[key] || "";
                      return (
                        <div key={iIdx} className="border-b last:border-b-0">
                          <button
                            onClick={() => cycleItemStatus(sIdx, iIdx)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-right hover:bg-muted/10 transition-colors"
                          >
                            {/* مؤشر الحالة */}
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-all"
                              style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}` }}>
                              {cfg.short}
                            </div>
                            <p className="text-[11px] leading-relaxed text-right flex-1">{item}</p>
                            {/* شارة الحالة */}
                            {status !== "pending" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                                style={{ background: cfg.bg, color: cfg.color }}>
                                {cfg.label}
                              </span>
                            )}
                          </button>
                          {/* خانة الملاحظات عند الرفض أو مقبول بملاحظات */}
                          {needsNote && (
                            <div className="px-3 pb-2.5" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                                <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
                                  {status === "rejected" ? "سبب الرفض" : "الملاحظات المطلوب استيفاؤها"}
                                </span>
                              </div>
                              <textarea
                                value={noteText}
                                onChange={e => setItemNote(sIdx, iIdx, e.target.value)}
                                placeholder={status === "rejected" ? "اكتب سبب الرفض..." : "اكتب الملاحظات المطلوبة..."}
                                rows={2}
                                className="w-full text-[11px] border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1 resize-none"
                                style={{ borderColor: `color-mix(in oklch, ${cfg.color} 40%, transparent)` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* بيانات الزيارة (قابلة للتعديل) */}
              <div className="rounded-xl border p-3 space-y-2">
                <p className="text-xs font-bold">بيانات الزيارة</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">المهندس المشرف</label>
                    <input value={engineerName} onChange={e => setEngineerName(e.target.value)}
                      placeholder="اسم المهندس"
                      className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">رقم الرخصة</label>
                    <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                      placeholder="رقم رخصة البناء"
                      className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">اسم المقاول</label>
                    <input value={contractorName} onChange={e => { setContractorName(e.target.value); saveContractor(e.target.value, contractorPhone); }}
                      placeholder="اسم المقاول"
                      className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">هاتف المقاول</label>
                    <input value={contractorPhone} onChange={e => { setContractorPhone(e.target.value); saveContractor(contractorName, e.target.value); }}
                      placeholder="رقم هاتف المقاول"
                      className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">ملاحظات الزيارة</label>
                    <input value={visitNotes} onChange={e => setVisitNotes(e.target.value)}
                      placeholder="ملاحظات عامة"
                      className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-1" />
                  </div>
                </div>
              </div>

              {/* رفع صور الزيارة */}
              <div className="rounded-xl border-2 border-dashed p-3 space-y-2">
                <p className="text-xs font-bold">صور الزيارة</p>
                <FileUploadButton label="رفع صورة" category="إشراف - صور زيارة"
                  projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
              </div>

              {/* أزرار الحفظ والإنهاء */}
              <div className="flex gap-2 sticky bottom-0 bg-background pt-2 pb-1">
                <button onClick={saveChecklist} disabled={updateVisit.isPending}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold border hover:bg-muted/30 transition-colors">
                  حفظ التقدم
                </button>
                <button onClick={completeVisit} disabled={generatingPdf}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: "oklch(0.55 0.15 150)" }}>
                  {generatingPdf
                    ? <><Clock className="w-4 h-4 animate-spin" /> جارٍ...</>
                    : <><CheckCircle2 className="w-4 h-4" /> إنهاء وطباعة التقرير</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── الملف الفني (المخططات المعتمدة) ── */}
          <div className="rounded-xl border overflow-hidden">
            <div className="px-3 py-2.5 border-b flex items-center justify-between"
              style={{ background: "oklch(0.97 0 0)" }}>
              <div>
                <p className="text-xs font-bold">الملف الفني المعتمد</p>
                <p className="text-[10px] text-muted-foreground">المخططات يرفعها المهندس المعماري بعد المراجعة</p>
              </div>
              <div className="flex gap-1.5">
                <FileUploadButton label="معماري" category="ملف فني - معماري"
                  projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
                <FileUploadButton label="إنشائي" category="ملف فني - إنشائي"
                  projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
                <FileUploadButton label="صحي/كهرباء" category="ملف فني - صحي وكهرباء"
                  projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
              </div>
            </div>
            {technicalDocs.length > 0
              ? <UploadedFilesList docs={technicalDocs} onDeleted={() => refetchDocs()} />
              : <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">
                  لم يتم رفع مخططات بعد — يرفعها المعماري بعد المراجعة والاعتماد
                </div>
            }
          </div>

        </div>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function TaskStatusBadge({ status }: { status: Task["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["pending"];
  const Icon = cfg.icon;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: `color-mix(in oklch, ${cfg.color} 12%, white)`, color: cfg.color }}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function TaskGroup({ title, subtitle, icon, color, tasks, expanded, onToggle, onTaskUpdate }: {
  title: string; subtitle: string; icon: React.ReactNode; color: string;
  tasks: Task[]; expanded: boolean; onToggle: () => void;
  onTaskUpdate: (id: number, status: Task["status"]) => void;
}) {
  const doneCount = tasks.filter(t => t.status === "done").length;
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/20" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium" style={{ color, fontFamily: "'Space Grotesk'" }}>{doneCount}/{tasks.length}</span>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
      {expanded && (
        <div className="border-t divide-y">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/10">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: task.status === "done" ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                    backgroundColor: task.status === "done" ? "oklch(0.55 0.15 150)" : "transparent",
                  }}
                  onClick={() => onTaskUpdate(task.id, task.status === "done" ? "pending" : "done")}
                >
                  {task.status === "done" && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.name}</p>
                  {task.estimatedDays && <p className="text-[10px] text-muted-foreground">{task.estimatedDays} يوم</p>}
                </div>
              </div>
              <TaskStatusBadge status={task.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN KANBAN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

interface ResidentialKanbanProps {
  projectId: string;
}

export default function ResidentialKanban({ projectId }: ResidentialKanbanProps) {
  const { data: projectData, isLoading, refetch: refetchProject } = useProject(projectId);
  const updateTask = useUpdateTask(projectId);
  const [activePopup, setActivePopup] = useState<number | null>(null);
  // جلب زيارات الإشراف لحساب تقدم مرحلة الإشراف من الخارج
  const { data: supervisionVisitsData = [] } = useSupervisionVisits(projectId);
  // جلب مستندات المشروع لعرضها في كاردات المراحل
  const { data: allProjectDocsMain = [] } = useDocuments({ projectId });
  // جلب تواريخ الفحوصات لمرحلة تجهيز الملف
  const { data: fileMetaMain } = usePhaseMeta(projectId, "file_preparation");
  const fileMetaDataMain: Record<string, any> = (fileMetaMain as any)?.data || {};

  const project = projectData as ProjectData | undefined;

  const handleTaskUpdate = (taskId: number, status: Task["status"]) => {
    updateTask.mutate({ id: taskId, status }, {
      onSuccess: () => {
        toast.success("تم تحديث المهمة ✓");
        // Refetch project data to update counters
        setTimeout(() => refetchProject(), 300);
      },
      onError: () => toast.error("حدث خطأ"),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-96 text-muted-foreground">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        جاري التحميل...
      </div>
    </div>
  );

  if (!project) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-muted-foreground">المشروع غير موجود</p>
      <Link href="/projects"><Button variant="outline"><ArrowRight className="w-4 h-4 ml-2" />العودة للمشاريع</Button></Link>
    </div>
  );

  const totalTasks = project.phases.reduce((s, p) => s + p.tasks.length, 0);
  const doneTasks = project.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);

  const getPhaseProgress = (phase: Phase, idx?: number) => {
    // مرحلة الإشراف (رقم 6): تعتمد على عدد مراحل الإشراف المكتملة فعلياً
    if (idx === 6) {
      const completedStages = supervisionVisitsData.filter(
        v => v.visitStatus === "completed" || v.visitStatus === "approved"
      ).map(v => v.stageKey).filter((k, i, arr) => arr.indexOf(k) === i).length;
      const totalStages = 18;
      return Math.round((completedStages / totalStages) * 100);
    }
    // مرحلة تجهيز الملف (idx 0): تشمل الملفات المرفوعة كخطوات إضافية
    if (idx === 0) {
      const tasksDone = phase.tasks.filter(t => t.status === "done").length;
      const docsUploaded = allProjectDocsMain.filter((d: any) =>
        d.category === "بطاقة مدنية" || d.category === "وثيقة ملكية" ||
        d.category === "خريطة الموقع" || d.category === "وثائق العقد"
      ).length > 0 ? 1 : 0;
      const techUploaded = allProjectDocsMain.filter((d: any) =>
        d.category === "فحص تربة" || d.category === "كتاب كهرباء"
      ).length > 0 ? 1 : 0;
      const formsUploaded = allProjectDocsMain.filter((d: any) =>
        d.category === "نماذج بلدية" || d.category === "نماذج"
      ).length > 0 ? 1 : 0;
      const extraDone = docsUploaded + techUploaded + formsUploaded;
      const extraTotal = 3;
      const total = phase.tasks.length + extraTotal;
      const done = tasksDone + extraDone;
      return total > 0 ? Math.round((done / total) * 100) : 0;
    }
    const total = phase.tasks.length;
    const done = phase.tasks.filter(t => t.status === "done").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const getPhaseStatus = (phase: Phase, idx: number) => {
    const prog = getPhaseProgress(phase, idx);
    // مرحلة الإشراف: مكتملة إذا كانت نسبتها 100%
    if (idx === 6) {
      if (prog === 100) return "done";
      if (prog > 0) return "current";
      if (idx === project.currentPhase) return "current";
      if (idx < project.currentPhase) return "past";
      return "upcoming";
    }
    // المرحلة تعتبر مكتملة فقط إذا كانت تحتوي على مهام ونسبتها 100%
    if (prog === 100 && phase.tasks.length > 0) return "done";
    if (idx === project.currentPhase) return "current";
    if (idx < project.currentPhase) return "past";
    return "upcoming";
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* ── Popups ── */}
      {activePopup === 0 && project.phases[0] && (
        <PhaseFilePreparationPopup
          phase={project.phases[0]} project={project}
          onClose={() => setActivePopup(null)} onTaskUpdate={handleTaskUpdate} />
      )}
      {activePopup === 1 && project.phases[1] && (
        <PhaseArchitecturalDesignPopup
          phase={project.phases[1]} project={project}
          onClose={() => setActivePopup(null)} onTaskUpdate={handleTaskUpdate} />
      )}
      {activePopup === 2 && project.phases[2] && (
        <PhaseFacadeStructuralPopup
          phase={project.phases[2]} project={project}
          onClose={() => setActivePopup(null)} onTaskUpdate={handleTaskUpdate} />
      )}
            {activePopup === 3 && project.phases[3] && (
        <PhaseMunicipalityPopup
          phase={project.phases[3]} project={project}
          onClose={() => setActivePopup(null)} onTaskUpdate={handleTaskUpdate} />
      )}
      {activePopup === 4 && project.phases[4] && (
        <PhaseMunicipalitySubmissionPopup
          phase={project.phases[4]} project={project}
          onClose={() => setActivePopup(null)} onTaskUpdate={handleTaskUpdate} />
      )}
      {activePopup === 5 && project.phases[5] && (
        <PhaseDetailedDrawingsPopup
          phase={project.phases[5]} project={project}
          onClose={() => setActivePopup(null)} onTaskUpdate={handleTaskUpdate} />
      )}
      {activePopup === 6 && project.phases[6] && (
        <PhaseSupervisionPopup
          phase={project.phases[6]} project={project}
          onClose={() => setActivePopup(null)} onTaskUpdate={handleTaskUpdate} />
      )}
      {/* ── Header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{project.name}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{project.client}</span>
              {project.area && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{project.area}</span>}
              <Badge variant="outline" className="text-[10px] h-5">{project.type}</Badge>
              <Badge variant="secondary" className="text-[10px] h-5">{project.serviceType}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Overall Progress ── */}
      <div className="flex items-center gap-4 p-3 rounded-xl border bg-muted/10">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">الإنجاز الكلي</span>
            <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{doneTasks}/{totalTasks} مهمة</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <span className="text-2xl font-bold shrink-0" style={{ fontFamily: "'Space Grotesk'", color: PHASE_COLORS[project.currentPhase] || PHASE_COLORS[0] }}>
          {project.progress}%
        </span>
      </div>

      {/* ── Kanban Board ── */}
      <div>
        {/* Phase Headers Row - all 7 phases */}
        <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: `repeat(${project.phases.length}, minmax(0, 1fr))` }}>
          {project.phases.map((phase, idx) => {
            const color = PHASE_COLORS[idx % PHASE_COLORS.length];
            const phaseStatus = getPhaseStatus(phase, idx);
            const phaseProgress = getPhaseProgress(phase, idx);
            const Icon = PHASE_ICONS[idx % PHASE_ICONS.length];
            const isCurrent = phaseStatus === "current";
            const isDone = phaseStatus === "done";

            return (
              <button
                key={idx}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-center"
                style={{
                  borderColor: isCurrent ? color : isDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                  backgroundColor: isCurrent
                    ? `color-mix(in oklch, ${color} 10%, white)`
                    : isDone ? "oklch(0.97 0.02 150)" : "transparent",
                }}
                onClick={() => setActivePopup(idx)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ backgroundColor: isDone ? "oklch(0.55 0.15 150)" : isCurrent ? color : "oklch(0.82 0.00 0)" }}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-semibold leading-tight" style={{ color: isCurrent ? color : isDone ? "oklch(0.45 0.12 150)" : "hsl(var(--muted-foreground))" }}>
                  {phase.title}
                </span>
                <span className="text-[9px] font-bold" style={{ fontFamily: "'Space Grotesk'", color: isCurrent ? color : "hsl(var(--muted-foreground))" }}>
                  {phaseProgress}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Kanban Cards Row - all 7 phases */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${project.phases.length}, minmax(0, 1fr))` }}>
          {project.phases.map((phase, idx) => {
            const color = PHASE_COLORS[idx % PHASE_COLORS.length];
            const phaseStatus = getPhaseStatus(phase, idx);
            const phaseProgress = getPhaseProgress(phase, idx);
            const isCurrent = phaseStatus === "current";
            const isDone = phaseStatus === "done";
            const isUpcoming = phaseStatus === "upcoming";
            // مرحلة الإشراف: استخدام بيانات الزيارات
            const isSupervisionPhase = idx === 6;
            const supervisionDone = isSupervisionPhase
              ? supervisionVisitsData.filter(v => v.visitStatus === "completed" || v.visitStatus === "approved").map(v => v.stageKey).filter((k, i, arr) => arr.indexOf(k) === i).length
              : phase.tasks.filter(t => t.status === "done").length;
            const supervisionTotal = isSupervisionPhase ? 18 : phase.tasks.length;
            const doneCount = isSupervisionPhase ? supervisionDone : phase.tasks.filter(t => t.status === "done").length;
            const totalCount = isSupervisionPhase ? supervisionTotal : phase.tasks.length;
            const inProgressCount = isSupervisionPhase ? 0 : phase.tasks.filter(t => t.status === "in_progress").length;

            return (
              <button
                key={idx}
                className="flex flex-col gap-2 p-3 rounded-xl border-2 text-right transition-all hover:shadow-md active:scale-95 w-full"
                style={{
                  borderColor: isCurrent ? color : isDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                  backgroundColor: isCurrent
                    ? `color-mix(in oklch, ${color} 6%, white)`
                    : isDone ? "oklch(0.97 0.02 150)"
                    : isUpcoming ? "hsl(var(--muted)/0.3)"
                    : "transparent",
                  opacity: isUpcoming ? 0.7 : 1,
                }}
                onClick={() => setActivePopup(idx)}
              >
                {/* Status indicator */}
                <div className="flex items-center justify-between">
                  {isCurrent && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                      الحالية
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                      مكتملة
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-full border">
                      قادمة
                    </span>
                  )}
                  {phaseStatus === "past" && !isDone && (
                    <span className="text-[9px] text-muted-foreground">سابقة</span>
                  )}
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${phaseProgress}%`,
                      backgroundColor: isDone ? "oklch(0.55 0.15 150)" : color,
                    }}
                  />
                </div>

                {/* Task counts */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">مكتملة</span>
                    <span className="font-bold" style={{ fontFamily: "'Space Grotesk'", color: isDone ? "oklch(0.45 0.12 150)" : color }}>
                      {doneCount}/{totalCount}{isSupervisionPhase ? " مرحلة" : ""}
                    </span>
                  </div>
                  {inProgressCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-600">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{inProgressCount} جارية</span>
                    </div>
                  )}
                </div>

                {/* مؤشرات خاصة بمرحلة تجهيز الملف */}
                {idx === 0 && (() => {
                  const soilDocs = allProjectDocsMain.filter((d: any) => d.category === "فحص تربة");
                  const elecDocs = allProjectDocsMain.filter((d: any) => d.category === "كتاب كهرباء");
                  const totalFileDocs = allProjectDocsMain.filter((d: any) =>
                    d.category === "فحص تربة" || d.category === "كتاب كهرباء" ||
                    d.category === "بطاقة مدنية" || d.category === "وثيقة ملكية" || d.category === "خريطة موقع"
                  ).length;
                  return (
                    <div className="space-y-1">
                      {totalFileDocs > 0 && (
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.45 0.12 150)" }}>
                          <Check className="w-2.5 h-2.5" />
                          <span>{totalFileDocs} ملف مرفوع</span>
                        </div>
                      )}
                      {fileMetaDataMain.soilReceiveDate && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-600">
                          <span>تربة ✓ {fileMetaDataMain.soilReceiveDate}</span>
                        </div>
                      )}
                      {fileMetaDataMain.elecReceiveDate && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600">
                          <span>كهرباء ✓ {fileMetaDataMain.elecReceiveDate}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Tap hint */}
                <div className="text-[9px] text-muted-foreground flex items-center gap-0.5 justify-center mt-1">
                  <span>اضغط للتفاصيل</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* All phases shown in the grid above - no extra section needed */}
    </div>
  );
}
