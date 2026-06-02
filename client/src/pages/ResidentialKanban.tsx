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
  Eye, Download, File, Image as ImageIcon, ExternalLink, Trash2
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

  // جلب جميع مستندات المشروع من قاعدة البيانات
  const { data: allProjectDocs = [], refetch: refetchDocs } = useDocuments({ projectId: project.id });

  // تصفية المستندات حسب الفئة لكل قسم
  const docsDocs = allProjectDocs.filter(d =>
    d.category === "بطاقة مدنية" ||
    d.category === "وثيقة ملكية" ||
    d.category === "خريطة موقع" ||
    d.category === "وثيقة أخرى"
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

  const doneCount = phase.tasks.filter(t => t.status === "done").length;
  const progress = phase.tasks.length > 0 ? Math.round((doneCount / phase.tasks.length) * 100) : 0;

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
            <span className="text-xs font-bold shrink-0" style={{ color, fontFamily: "'Space Grotesk'" }}>{doneCount}/{phase.tasks.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* ══ 1. جمع الوثائق ══ */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: `color-mix(in oklch, ${color} 35%, transparent)` }}>
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              style={{ backgroundColor: `color-mix(in oklch, ${color} 8%, white)` }}
              onClick={() => setExpandedGroup(expandedGroup === "docs" ? null : "docs")}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: `color-mix(in oklch, ${color} 80%, black)` }}>جمع الوثائق</p>
                  <p className="text-[10px] text-muted-foreground">البطاقة المدنية، الوثيقة، خريطة الموقع</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {docsDocs.length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, white)`, color }}>
                    {docsDocs.length} ملف
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedGroup === "docs" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expandedGroup === "docs" && (
              <div className="px-3 pb-4 pt-3 space-y-3 border-t">
                <p className="text-[11px] text-muted-foreground">ارفع الملفات المطلوبة — ستظهر تلقائياً في المستندات</p>
                <div className="flex flex-wrap gap-2">
                  <FileUploadButton label="رفع وثيقة" category="وثائق المشروع" projectId={project.id} clientId={project.clientId} onUploaded={d => handleFileUploaded("docs", d)} />

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
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: `color-mix(in oklch, oklch(0.60 0.12 30) 35%, transparent)` }}>
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              style={{ backgroundColor: `color-mix(in oklch, oklch(0.60 0.12 30) 8%, white)` }}
              onClick={() => setExpandedGroup(expandedGroup === "tech" ? null : "tech")}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.60 0.12 30)" }}>
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "oklch(0.45 0.10 30)" }}>الفحوصات التقنية</p>
                  <p className="text-[10px] text-muted-foreground">فحص التربة وكتاب الكهرباء</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {techDocs.length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "color-mix(in oklch, oklch(0.60 0.12 30) 15%, white)", color: "oklch(0.45 0.10 30)" }}>
                    {techDocs.length} ملف
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedGroup === "tech" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expandedGroup === "tech" && (
              <div className="px-3 pb-4 pt-3 space-y-3 border-t">
                <p className="text-[11px] text-muted-foreground">ارفع نتائج الفحوصات — ستظهر في المستندات</p>
                <div className="flex flex-wrap gap-2">
                  <FileUploadButton label="رفع ملف فحوصات" category="فحوصات تقنية" projectId={project.id} clientId={project.clientId} onUploaded={d => handleFileUploaded("tech", d)} />
                </div>
                <UploadedFilesList docs={techDocs} key={refreshKey + 100} onDeleted={() => { refetchDocs(); setRefreshKey(k => k + 1); }} />
                {/* مهام الفحوصات من قاعدة البيانات */}
                {techTasks.map(task => (
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

          {/* ══ 3. تعبئة نماذج البلدية ══ */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: `color-mix(in oklch, oklch(0.55 0.15 150) 35%, transparent)` }}>
            <div
              className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              style={{ backgroundColor: `color-mix(in oklch, oklch(0.55 0.15 150) 8%, white)` }}
              onClick={() => setExpandedGroup(expandedGroup === "forms" ? null : "forms")}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                  <ClipboardList className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "oklch(0.40 0.12 150)" }}>تعبئة نماذج البلدية</p>
                  <p className="text-[10px] text-muted-foreground">النماذج والتعهدات الرسمية</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {formsDocs.length > 0 && (
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

  // ── حالة المراحل الفرعية ──
  // structuralDone: تم رفع ملف الإنشائي (DWG)
  // facadeDone: تم اعتماد الواجهات من العميل
  const structuralDone = meta.structuralDone === true;
  const facadeDone = meta.facadeDone === true;
  const structuralFile = meta.structuralFile || null; // اسم الملف المرفوع

  const setStructuralDone = (val: boolean, fileName?: string) => {
    updateMeta.mutate({ ...meta, structuralDone: val, structuralFile: fileName || meta.structuralFile });
  };
  const setFacadeDone = (val: boolean) => {
    updateMeta.mutate({ ...meta, facadeDone: val });
  };

  const facadeTasks = phase.tasks.filter(t => t.name.includes("واجهة") || t.name.includes("معماري") || t.name.includes("ثلاثي") || t.name.includes("3D"));
  const structuralTasks = phase.tasks.filter(t => t.name.includes("إنشائ") || t.name.includes("أعمدة") || t.name.includes("حديد") || t.name.includes("خرسان"));
  const mepTasks = phase.tasks.filter(t => t.name.includes("كهرباء") || t.name.includes("صحي") || t.name.includes("ميكانيك") || t.name.includes("MEP"));
  const otherTasks = phase.tasks.filter(t =>
    !facadeTasks.find(x => x.id === t.id) &&
    !structuralTasks.find(x => x.id === t.id) &&
    !mepTasks.find(x => x.id === t.id)
  );
  const doneCount = phase.tasks.filter(t => t.status === "done").length;
  const progress = phase.tasks.length > 0 ? Math.round((doneCount / phase.tasks.length) * 100) : 0;

  // ── تحديد المرحلة الفرعية النشطة ──
  const activeSubStep = !structuralDone ? "structural" : !facadeDone ? "facade" : "municipality";

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
            <span className="text-xs font-bold shrink-0" style={{ color, fontFamily: "'Space Grotesk'" }}>{doneCount}/{phase.tasks.length}</span>
          </div>
          {/* Sub-pipeline indicator */}
          <div className="flex items-center gap-1 mt-2.5">
            {[
              { key: "structural", label: "① الإنشائي", done: structuralDone },
              { key: "facade", label: "② الواجهات", done: facadeDone },
              { key: "municipality", label: "③ البلدية", done: false },
            ].map((step, idx) => {
              const isActive = activeSubStep === step.key;
              const isPast = step.done;
              return (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                    isPast ? "bg-green-100 text-green-700" :
                    isActive ? "text-white" : "bg-muted text-muted-foreground opacity-50"
                  }`} style={isActive ? { backgroundColor: color } : {}}>
                    {isPast ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    {step.label}
                  </div>
                  {idx < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" style={{ transform: "scaleX(-1)" }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* ── المرحلة الفرعية ①: التصميم الإنشائي ── */}
          <div className={`rounded-xl border-2 overflow-hidden transition-all ${
            structuralDone ? "border-green-200 bg-green-50/30" :
            activeSubStep === "structural" ? "border-orange-300" : "border-muted opacity-60"
          }`}>
            <div className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/10"
              onClick={() => setExpandedSection(expandedSection === "structural-card" ? null : "structural-card")}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${structuralDone ? "bg-green-500" : "bg-orange-500"}`}>
                  {structuralDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Building2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">① التصميم الإنشائي</p>
                  <p className="text-[10px] text-muted-foreground">سستم الأعمدة والقواعد والسملات</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {structuralDone
                  ? <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>
                  : <span className="text-[10px] font-medium" style={{ color }}>جارٍ</span>}
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "structural-card" ? "rotate-90" : ""}`} />
              </div>
            </div>
            {expandedSection === "structural-card" && (
              <div className="px-3 pb-3 pt-2 border-t space-y-3">
                {/* إشعار المهندس الإنشائي */}
                {!structuralDone && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-orange-800 mb-1">🔔 تنبيه المهندس الإنشائي</p>
                    <p className="text-[10px] text-orange-700 mb-2">عند رفع الملف المعماري المعتمد، سيصل إشعار تلقائي للمهندس الإنشائي لبدء تصميم سستم الأعمدة.</p>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-orange-300 text-orange-700"
                      onClick={() => {
                        toast.success("تم إرسال إشعار للمهندس الإنشائي ✓");
                        fetch("/api/send-email", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            to: "structural@office.com",
                            subject: `مشروع ${project.name} — يرجى البدء بتصميم سستم الأعمدة`,
                            body: `تم اعتماد التصميم المعماري لمشروع ${project.name}. يرجى البدء بتصميم سستم الأعمدة والقواعد والسملات.`,
                            projectId: project.id,
                            type: "structural_notify",
                          }),
                        });
                      }}>
                      <Phone className="w-3 h-3 ml-1" /> إرسال إشعار للمهندس الإنشائي
                    </Button>
                  </div>
                )}
                {/* رفع ملف الإنشائي DWG */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">ارفع ملف التصميم الإنشائي (DWG)</p>
                  {structuralFile && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                      <File className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-xs text-green-700 flex-1 truncate">{structuralFile}</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    </div>
                  )}
                  <FileUploadButton
                    label={structuralFile ? "استبدال الملف" : "رفع ملف الإنشائي (DWG)"}
                    category="تصميم إنشائي"
                    projectId={project.id}
                    clientId={project.clientId}
                    onUploaded={(doc) => {
                      setStructuralDone(true, doc?.name || "ملف الإنشائي");
                      toast.success("تم رفع ملف الإنشائي ✓ — سيصل إشعار لرسام الواجهات");
                      fetch("/api/send-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          to: "facade@office.com",
                          subject: `مشروع ${project.name} — جاهز لتصميم الواجهات`,
                          body: `تم إنجاز التصميم الإنشائي لمشروع ${project.name}. يرجى البدء بتصميم الواجهات.`,
                          projectId: project.id,
                          type: "facade_notify",
                        }),
                      });
                    }}
                  />
                </div>
                {/* قفل مرن */}
                {!structuralDone && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <input type="checkbox" id="bypass-structural" checked={bypassLock}
                      onChange={e => setBypassLock(e.target.checked)} className="w-3 h-3" />
                    <label htmlFor="bypass-structural" className="text-[10px] text-muted-foreground cursor-pointer">
                      تجاوز القفل (للمدير فقط) — الانتقال للواجهات بدون رفع ملف
                    </label>
                  </div>
                )}
                {bypassLock && !structuralDone && (
                  <Button size="sm" className="w-full h-8 text-xs" variant="outline"
                    onClick={() => { setStructuralDone(true); setBypassLock(false); toast.warning("تم تجاوز القفل — الإنشائي مكتمل"); }}>
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
            {/* قفل إذا لم يكتمل الإنشائي */}
            {!structuralDone && !bypassLock && (
              <div className="px-3 py-2.5 flex items-center gap-2 bg-muted/20">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">② تصميم الواجهات</p>
                  <p className="text-[10px] text-muted-foreground">🔒 ينشط بعد إنجاز التصميم الإنشائي</p>
                </div>
              </div>
            )}
            {(structuralDone || bypassLock) && (
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

          {/* ── المرحلة الفرعية ③: الانتقال للبلدية ── */}
          <div className={`rounded-xl border-2 overflow-hidden transition-all ${
            facadeDone ? "border-green-300 bg-green-50/50" : "border-muted opacity-50"
          }`}>
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${facadeDone ? "bg-green-500" : "bg-muted"}`}>
                  {facadeDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${facadeDone ? "" : "text-muted-foreground"}`}>③ الانتقال لمرحلة البلدية</p>
                  <p className="text-[10px] text-muted-foreground">
                    {facadeDone ? "✅ جاهز — يمكن الانتقال للبلدية" : "🔒 ينشط بعد اعتماد العميل للواجهات"}
                  </p>
                </div>
              </div>
              {facadeDone && (
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
   Phase 7: الإشراف
   ═══════════════════════════════════════════════════════════════════ */
const SUPERVISION_STAGES = [
  { key: "excavation",       label: "الحفر واستلام المنسوب والحدود" },
  { key: "elevator_pit",     label: "بير المصعد والجور المجاري" },
  { key: "basement_slab",    label: "اللبشة (في حالة السرداب)" },
  { key: "foundations",      label: "القواعد (بدون السرداب)" },
  { key: "basement_walls",   label: "حوائط السرداب" },
  { key: "col_necks",        label: "رقاب الأعمدة (بدون السرداب)" },
  { key: "beams",            label: "الشناجات" },
  { key: "reinforced_floor", label: "الأرضية المسلحة" },
  { key: "basement_cols",    label: "أعمدة السرداب" },
  { key: "basement_roof",    label: "سقف السرداب" },
  { key: "ground_cols",      label: "أعمدة الأرضي" },
  { key: "ground_roof",      label: "سقف الأرضي" },
  { key: "first_cols",       label: "أعمدة الأول" },
  { key: "first_roof",       label: "سقف الأول" },
  { key: "second_cols",      label: "أعمدة الثاني" },
  { key: "second_roof",      label: "سقف الثاني" },
  { key: "service_cols",     label: "أعمدة سطح الخدمات" },
  { key: "service_roof",     label: "سقف سطح الخدمات" },
];

// بنود الجك ليست حسب مرحلة الإشراف
const CHECKLIST_ITEMS: Record<string, { section: string; items: string[] }[]> = {
  foundations: [
    { section: "بنود استلام القواعد المنفصلة", items: [
      "التأكد من أماكن القواعد وعددها",
      "استكمال مقاسات القواعد حسب المخطط المعتمد",
      "التأكد من مقاسات القواعد حسب المخطط (سواء في المتر أو الحد الصريح للقاعدة كاملة)",
      "يجب أن تكون نهايات التسليح السفلي بزاوية 1 سواء في الاتجاه الطولي أو القصير",
      "التأكد من الشبكة السفلية والعلوية إذا كانت مرتبة بشكل جيد في المخطط",
      "أن تكون الشبكة السفلية والعلوية مرتبة بزاوية 90 ولا يوجد حديد تسليح بدون تربيط",
      "يجب أن تكون نهايات التسليح العلوي بزاوية 1 سواء في الاتجاه الطولي أو القصير",
      "التأكد من كفايات رقب الأعمدة داخل القاعدة",
    ]},
  ],
  basement_slab: [
    { section: "بنود استلام اللبشة", items: [
      "التأكد من مقاسات القواعد وأماكنها",
      "تحديد مشرب اللبشة حسب المخطط",
      "أن تكون الشبكة العلوية مستوية بشكل جيد ولا يوجد فجوات في الارتفاعات",
      "أن تكون الشبكة السفلية والعلوية مرتبة بشكل جيد",
    ]},
  ],
  col_necks: [
    { section: "بنود استلام رقاب الأعمدة", items: [
      "أن تكون أماكن الأعمدة في أماكنها حسب المخطط الإنشائي والتأكد من أكسات الأعمدة",
      "أن تكون مقاسات الأعمدة قياسية قصص",
      "أن تكون الرقب كما ذكر في المخطط",
      "أن تكون الرقب تسليح كما ذكر في المخطط",
      "أن يتم عقل الكفايات للأعمدة والرقب بالمسافات المطلوبة",
      "أن يتم عمل الكفايات للأعمدة حسب عدد تسليح الأعمدة والرقب بزاوية 90 داخل القاعدة",
      "التأكد من ارتفاع رقاب الأعمدة بحديد الصب",
    ]},
  ],
  basement_walls: [
    { section: "بنود استلام حوائط السرداب", items: [
      "التأكد من وجود قاعدة شريطية أسفل الحوائط",
      "أن تخرج تسليح المواطن بالعدد المطلوب من القاعدة الشريطية في اللبشة المسلحة",
      "ألا يقل ارتفاع التسليح عن خروجها من اللبشة المسلحة عن 75 سم",
      "أن تخرج الأشاير أعلى رقم الحائط لعمل رقم تسليح الحائط",
      "أن يتم تسليح الحوائط بحديد رأسي وأفقي في الفي المطلوب بالمخطط",
    ]},
  ],
  beams: [
    { section: "بنود استلام الشناجات الأرضية", items: [
      "عمل الشناجات الأرضية بالمقاسات المطلوبة بالمخطط حسب طول كل شناج",
      "التأكيد على تسليح الشناجات العلوي والسفلي",
      "أن يكون تسليح الشناجات السفلي مرتبطاً بالكفايات كل 1 متر على الأقل الضمان شلكه في مكانه",
      "التأكد من وجود كفايات بين حديد الشناجات",
      "التأكد من عدد الكفايات وتربيطها بشكل جيد",
    ]},
  ],
  reinforced_floor: [
    { section: "بنود استلام أرضية أرضي (SLAB ON GRADE)", items: [
      "أن يكون الدفان أسفل البلاطة الأرضية مدكوكاً بشكل جيد",
      "أن يتم تغطيلون حماية أسفل تسليح البلاطة",
      "التأكد من تسليح البلاطة الأرضية حسب المخطط وتربيطها بشكل جيد",
    ]},
  ],
  ground_cols: [
    { section: "بنود استلام الأعمدة", items: [
      "التأكد من تسليح الأعمدة حسب المخطط",
      "أن تكون أشاير الأعمدة لا تقل عن 75 سم",
      "أن تكون كفايات الأعمدة متعددة حسب التفصيل",
      "التكفيف في أول ثلث وآخر ثلث من العمود",
      "التأكد من أقل الكفايات",
      "التأكد من مكان المنفيز ومكانه",
      "التأكد من الأعمدة المزروعة وتربيطها بشكل جيد داخل الجسور الدملة",
      "أن تكون نهايات حديد تسليح الأعمدة المزروعة بزاوية 90 وبطول مناسب",
      "لا يقل قفل الكفايات عن 7 سم في الاتجاهين",
    ]},
  ],
  ground_roof: [
    { section: "بنود استلام الأسقف", items: [
      "التأكد من تنفيذ الجسور بالمقاسات المذكورة وتسليحها العلوي والسفلي",
      "التأكد من تسليح الجسور العلوي وعدم تعارضها مع التصميم الإنشائي",
      "أن يكون تسليح الجسور السفلي مرتبطاً بالكفايات كل 1 متر على الأقل الضمان شلكه في مكانه",
      "التأكد من تسليح الشبكات السفلية والعلوية",
      "التأكد من عدد الكفايات وتربيطها بشكل جيد",
      "التأكد من تفصيلة الكفات كما في الكاشف (مزدوجة أو فردية)",
      "لا يقل قفل الكفايات عن 7 سم في الاتجاهين",
      "التأكد من تسليح البلاطات بالبلطات السابقة",
      "التأكد من تسليح البلاطة الواحدة إذا كانت طولية فقط أم طولية وعرضية والمسافة بين الشبكتين",
      "أن يستمر تسليح البلاطة الواحدة إلى البلاطة المجاورة بمسافة المحذور أقل من الأمام",
      "التأكد من طول الشلوف في الزوايا كما هي بالمخطط المحذور أقل علياً من الخلف والأمام",
      "أن يتم تسليح البروزات بشكل كافٍ لتكتمل الأعمال",
    ]},
  ],
};

// الجك ليست الافتراضية لجميع المراحل
const DEFAULT_CHECKLIST = [
  { section: "العناصر الإنشائية", items: ["التأكد من مطابقة الأبعاد للمخطط", "التأكد من التسليح حسب المخطط الإنشائي", "التأكد من الكفايات والتربيط"] },
  { section: "الكهرباء", items: ["التأكد من مواضع البايبات الكهربائية", "التأكد من الأقطار المطلوبة", "التأكد من التثبيت الجيد قبل الصب"] },
  { section: "بايبات الصحي", items: ["التأكد من مواضع بايبات الصرف", "التأكد من الميول الصحيحة", "التأكد من الأقطار المطلوبة"] },
  { section: "بروزات الواجهات", items: ["التأكد من مطابقة بروزات الواجهات للمخطط المعماري", "التأكد من الأبعاد والمناسيب"] },
];

function PhaseSupervisionPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[6];
  const { data: visits = [], refetch: refetchVisits } = useSupervisionVisits(project.id);
  const createVisit = useCreateSupervisionVisit(project.id);
  const updateVisit = useUpdateSupervisionVisit(project.id);
  const { data: allDocs = [], refetch: refetchDocs } = useDocuments({ projectId: project.id });
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [activeVisit, setActiveVisit] = useState<SupervisionVisit | null>(null);
  const [showNewVisit, setShowNewVisit] = useState(false);
  const [newVisitStage, setNewVisitStage] = useState(SUPERVISION_STAGES[0].key);
  const [newVisitNotes, setNewVisitNotes] = useState("");
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const supervisionDocs = allDocs.filter(d => d.category?.includes("إشراف") || d.category?.includes("زيارة"));

  const startNewVisit = () => {
    createVisit.mutate({
      stageKey: newVisitStage,
      stageLabel: SUPERVISION_STAGES.find(s => s.key === newVisitStage)?.label || newVisitStage,
      visitDate: new Date().toISOString().split("T")[0],
      visitNotes: newVisitNotes,
      visitStatus: "in_progress",
      checklistData: "{}",
    }, {
      onSuccess: (visit: unknown) => {
        toast.success("تم إنشاء الزيارة ✓");
        setActiveVisit(visit as SupervisionVisit);
        setShowNewVisit(false);
        setNewVisitNotes("");
        setChecklistState({});
      },
    });
  };

  const toggleCheckItem = (sectionIdx: number, itemIdx: number) => {
    const key = `${sectionIdx}-${itemIdx}`;
    setChecklistState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveChecklist = () => {
    if (!activeVisit) return;
    updateVisit.mutate({ id: activeVisit.id!, checklistData: JSON.stringify(checklistState) }, {
      onSuccess: () => toast.success("تم حفظ الجك ليست ✓"),
    });
  };

  const completeVisit = async () => {
    if (!activeVisit) return;
    setGeneratingPdf(true);
    try {
      await updateVisit.mutateAsync({ id: activeVisit.id!, visitStatus: "completed", checklistData: JSON.stringify(checklistState) });
      toast.success("تم إنهاء الزيارة ✓ — جارٍ توليد PDF...");
      // توليد PDF عبر endpoint
      const res = await fetch(`/api/supervision/visits/${activeVisit.id}/pdf`, { method: "POST" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `تقرير_زيارة_${activeVisit.stageLabel}_${new Date().toLocaleDateString("ar-KW")}.pdf`;
        a.click();
        toast.success("تم تحميل تقرير الزيارة ✓");
      }
      setActiveVisit(null);
      refetchVisits();
    } catch {
      toast.error("حدث خطأ أثناء إنهاء الزيارة");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const stageVisits = (stageKey: string) => visits.filter(v => v.stageKey === stageKey);
  const stageCompleted = (stageKey: string) => stageVisits(stageKey).some(v => v.visitStatus === "completed");

  const checklistItems: { section: string; items: string[] }[] = activeVisit
    ? (CHECKLIST_ITEMS[activeVisit.stageKey ?? ""] || DEFAULT_CHECKLIST)
    : [];
  const totalItems = checklistItems.reduce((sum: number, s: { section: string; items: string[] }) => sum + s.items.length, 0);
  const checkedItems = Object.values(checklistState).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color }}>
                <ClipboardList className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">الإشراف الهندسي</h3>
                <p className="text-[11px] text-muted-foreground">
                  {visits.filter(v => v.visitStatus === "completed").length} زيارة مكتملة من {SUPERVISION_STAGES.length} مرحلة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!activeVisit && (
                <button
                  onClick={() => setShowNewVisit(!showNewVisit)}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border font-medium hover:bg-muted/30 transition-colors"
                >
                  <Plus className="w-3 h-3" /> زيارة جديدة
                </button>
              )}
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* نموذج زيارة جديدة */}
          {showNewVisit && !activeVisit && (
            <div className="rounded-xl border p-3 space-y-2 bg-muted/10">
              <p className="text-xs font-bold">زيارة إشراف جديدة</p>
              <select
                value={newVisitStage}
                onChange={e => setNewVisitStage(e.target.value)}
                className="w-full text-xs border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1"
              >
                {SUPERVISION_STAGES.map(s => (
                  <option key={s.key} value={s.key}>
                    {stageCompleted(s.key) ? "✓ " : ""}{s.label}
                  </option>
                ))}
              </select>
              <textarea
                value={newVisitNotes}
                onChange={e => setNewVisitNotes(e.target.value)}
                placeholder="ملاحظات الزيارة (اختياري)"
                rows={2}
                className="w-full text-xs border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={startNewVisit}
                  disabled={createVisit.isPending}
                  className="flex-1 h-8 rounded-lg text-xs font-semibold text-white"
                  style={{ background: color }}
                >
                  بدء الزيارة
                </button>
                <button onClick={() => setShowNewVisit(false)} className="flex-1 h-8 rounded-lg text-xs font-semibold border hover:bg-muted/30">إلغاء</button>
              </div>
            </div>
          )}

          {/* الجك ليست للزيارة النشطة */}
          {activeVisit && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">{activeVisit.stageLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{checkedItems}/{totalItems} بند مكتمل</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveChecklist} className="text-[11px] px-2.5 py-1.5 rounded-lg border font-medium hover:bg-muted/30">
                    حفظ
                  </button>
                  <button
                    onClick={completeVisit}
                    disabled={generatingPdf}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold text-white"
                    style={{ background: "oklch(0.55 0.15 150)" }}
                  >
                    {generatingPdf ? <><Clock className="w-3 h-3 animate-spin" /> جارٍ...</> : <><CheckCircle2 className="w-3 h-3" /> إنهاء وتوليد PDF</>}
                  </button>
                </div>
              </div>
              {/* شريط التقدم */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%`, background: color }} />
              </div>
              {/* بنود الجك ليست */}
              {checklistItems.map((section: { section: string; items: string[] }, sIdx: number) => (
                <div key={sIdx} className="rounded-xl border overflow-hidden">
                  <div className="px-3 py-2 border-b" style={{ background: `color-mix(in oklch, ${color} 8%, transparent)` }}>
                    <p className="text-[11px] font-bold">{section.section}</p>
                  </div>
                  <div className="divide-y">
                    {section.items.map((item: string, iIdx: number) => {
                      const key = `${sIdx}-${iIdx}`;
                      const checked = checklistState[key] || false;
                      return (
                        <button
                          key={iIdx}
                          onClick={() => toggleCheckItem(sIdx, iIdx)}
                          className="w-full flex items-start gap-2.5 px-3 py-2 text-right hover:bg-muted/20 transition-colors"
                        >
                          <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                            style={{ borderColor: checked ? color : undefined, background: checked ? color : undefined }}>
                            {checked && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <p className="text-[11px] leading-relaxed text-right">{item}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* رفع صور الزيارة */}
              <div className="rounded-xl border-2 border-dashed p-3 space-y-2">
                <p className="text-xs font-bold">صور الزيارة</p>
                <FileUploadButton
                  label="رفع صورة"
                  category="إشراف - صور زيارة"
                  projectId={project.id}
                  clientId={project.clientId}
                  onUploaded={() => refetchDocs()}
                />
              </div>
            </div>
          )}

          {/* قائمة المراحل والزيارات السابقة */}
          {!activeVisit && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">مراحل الإشراف</p>
              {SUPERVISION_STAGES.map(stage => {
                const sv = stageVisits(stage.key);
                const completed = stageCompleted(stage.key);
                return (
                  <div key={stage.key} className="rounded-xl border overflow-hidden">
                    <button
                      onClick={() => setSelectedStage(selectedStage === stage.key ? null : stage.key)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: completed ? "oklch(0.55 0.15 150)" : "oklch(0.85 0.00 0)" }}>
                          {completed ? <Check className="w-3 h-3 text-white" /> : <Circle className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs font-medium">{stage.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sv.length > 0 && <span className="text-[10px] text-muted-foreground">{sv.length} زيارة</span>}
                        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${selectedStage === stage.key ? "rotate-90" : ""}`} />
                      </div>
                    </button>
                    {selectedStage === stage.key && sv.length > 0 && (
                      <div className="border-t divide-y bg-muted/10">
                        {sv.map(visit => (
                          <div key={visit.id} className="px-3 py-2 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-medium">{visit.visitDate}</p>
                              {visit.visitNotes && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{visit.visitNotes}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: visit.visitStatus === "completed" ? "oklch(0.55 0.15 150 / 0.15)" : "oklch(0.55 0.15 250 / 0.15)", color: visit.visitStatus === "completed" ? "oklch(0.45 0.15 150)" : "oklch(0.45 0.15 250)" }}>
                                {visit.visitStatus === "completed" ? "مكتملة" : "جارية"}
                              </span>
                              {visit.visitStatus === "completed" && (
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/supervision/visits/${visit.id}/pdf`, { method: "POST" });
                                    if (res.ok) {
                                      const blob = await res.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = `تقرير_${visit.stageLabel}.pdf`;
                                      a.click();
                                    }
                                  }}
                                  className="text-[10px] flex items-center gap-0.5 text-blue-600 hover:underline"
                                >
                                  <Download className="w-3 h-3" /> PDF
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* الملف الفني */}
          <div className="rounded-xl border p-3 space-y-2">
            <p className="text-xs font-bold">الملف الفني</p>
            <p className="text-[10px] text-muted-foreground">جميع المخططات المعتمدة: معماري، إنشائي، صحي، كهرباء</p>
            <div className="flex flex-wrap gap-2">
              <FileUploadButton label="مخطط معماري معتمد" category="ملف فني - معماري" projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
              <FileUploadButton label="مخطط إنشائي معتمد" category="ملف فني - إنشائي" projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
              <FileUploadButton label="مخطط صحي معتمد" category="ملف فني - صحي" projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
              <FileUploadButton label="مخطط كهرباء معتمد" category="ملف فني - كهرباء" projectId={project.id} clientId={project.clientId} onUploaded={() => refetchDocs()} />
            </div>
            {supervisionDocs.length > 0 && <UploadedFilesList docs={supervisionDocs} onDeleted={() => refetchDocs()} />}
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
  const { data: projectData, isLoading } = useProject(projectId);
  const updateTask = useUpdateTask(projectId);
  const [activePopup, setActivePopup] = useState<number | null>(null);

  const project = projectData as ProjectData | undefined;

  const handleTaskUpdate = (taskId: number, status: Task["status"]) => {
    updateTask.mutate({ id: taskId, status }, {
      onSuccess: () => toast.success("تم تحديث المهمة ✓"),
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

  const getPhaseProgress = (phase: Phase) => {
    const total = phase.tasks.length;
    const done = phase.tasks.filter(t => t.status === "done").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const getPhaseStatus = (phase: Phase, idx: number) => {
    const prog = getPhaseProgress(phase);
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
            const phaseProgress = getPhaseProgress(phase);
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
            const phaseProgress = getPhaseProgress(phase);
            const isCurrent = phaseStatus === "current";
            const isDone = phaseStatus === "done";
            const isUpcoming = phaseStatus === "upcoming";
            const doneCount = phase.tasks.filter(t => t.status === "done").length;
            const inProgressCount = phase.tasks.filter(t => t.status === "in_progress").length;

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
                      {doneCount}/{phase.tasks.length}
                    </span>
                  </div>
                  {inProgressCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-600">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{inProgressCount} جارية</span>
                    </div>
                  )}
                </div>

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
