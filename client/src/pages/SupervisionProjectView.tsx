/**
 * SupervisionProjectView — صفحة مخصصة لمشاريع الإشراف الهندسي
 * مرحلتان فقط:
 *   1. تجهيز الملف: رفع 5 ملفات محددة + checklist
 *   2. الإشراف الفعلي: يفتح PhaseSupervisionPopup
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Users, MapPin, CheckCircle2, Circle,
  Clock, X, Check, AlertCircle, Upload, FileText,
  ClipboardList, ChevronRight, Download, ExternalLink, Trash2,
  Eye, File, Image as ImageIcon,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  useProject, useUpdateTask, useDocuments,
  useSupervisionVisits,
} from "@/lib/api";
import type { Document, SupervisionVisit } from "@/lib/api";
import { PhaseSupervisionPopup } from "@/pages/ResidentialKanban";

/* ─── Types ─── */
interface Task {
  id: number; name: string;
  status: "done" | "in_progress" | "blocked" | "pending" | "waiting_client" | "cancelled";
  assignee?: string; description?: string;
}
interface Phase { id?: number; title: string; tasks: Task[]; }
interface ProjectData {
  id: string; name: string; client: string; clientId?: string; type: string; serviceType: string;
  area: string; quotation: string; progress: number; currentPhase: number;
  status?: string; phases: Phase[]; clientPhone?: string; block?: string; plot?: string;
}

/* ─── الملفات المطلوبة لتجهيز الملف ─── */
const REQUIRED_FILES = [
  { key: "arch_plan",   label: "المخطط المعماري المعتمد", category: "إشراف - مخطط معماري" },
  { key: "struct_plan", label: "المخطط الإنشائي المعتمد", category: "إشراف - مخطط إنشائي" },
  { key: "license",     label: "الرخصة المعتمدة",         category: "إشراف - رخصة" },
  { key: "muni_pledge", label: "تعهد الإشراف (البلدية)",  category: "إشراف - تعهد بلدية" },
  { key: "contract",    label: "عقد الإشراف الموقع",      category: "إشراف - عقد إشراف" },
];

/* ─── Helper: نوع الملف ─── */
function getFileType(doc: { name: string; mimeType?: string; fileExtension?: string }) {
  if (doc.mimeType) {
    if (doc.mimeType.includes("pdf")) return "pdf";
    if (doc.mimeType.startsWith("image/")) return "image";
    if (doc.mimeType.includes("word")) return "word";
  }
  const ext = (doc.fileExtension || doc.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "word";
  return "file";
}

/* ─── FileIcon ─── */
function FileIcon({ doc }: { doc: { name: string; mimeType?: string; fileExtension?: string } }) {
  const t = getFileType(doc);
  if (t === "pdf") return <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded">PDF</span>;
  if (t === "image") return <ImageIcon className="w-3 h-3 text-blue-500" />;
  if (t === "word") return <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded">DOC</span>;
  return <File className="w-3 h-3 text-muted-foreground" />;
}

/* ─── FileUploadButton ─── */
function FileUploadButton({ label, category, projectId, clientId, onUploaded }: {
  label: string; category: string; projectId: string; clientId?: string;
  onUploaded?: () => void;
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
      toast.success(`تم رفع "${label}" بنجاح ✓`);
      onUploaded?.();
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
          <><Upload className="w-3 h-3" /> رفع</>
        )}
      </button>
    </>
  );
}

/* ─── UploadedFileRow ─── */
function UploadedFileRow({ doc, onDeleted }: { doc: Document; onDeleted?: () => void }) {
  const [previewing, setPreviewing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("تم حذف الملف");
      setConfirmDelete(false);
      onDeleted?.();
    } catch {
      toast.error("فشل الحذف");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {previewing && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/90" onClick={() => setPreviewing(false)}>
          <div className="flex items-center gap-3 px-4 py-3 bg-card/95 border-b shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewing(false)} className="p-2 rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm font-medium flex-1 truncate">{doc.name}</p>
            <a href={`/api/documents/${doc.id}/download`} className="p-2 rounded-lg hover:bg-muted"><Download className="w-4 h-4" /></a>
            <a href={`/api/documents/${doc.id}/view`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted"><ExternalLink className="w-4 h-4" /></a>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            {getFileType(doc) === "image" ? (
              <img src={`/api/documents/${doc.id}/view`} alt={doc.name} className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <iframe src={`/api/documents/${doc.id}/view`} className="w-full h-full rounded-lg bg-white" title={doc.name} />
            )}
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-sm p-5 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold">تأكيد الحذف</h3>
                <p className="text-xs text-muted-foreground">هذه العملية لا يمكن التراجع عنها</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 mb-4 border">
              <p className="text-xs font-medium truncate">{doc.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>إلغاء</Button>
              <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Clock className="w-3 h-3 animate-spin ml-1" /> : <Trash2 className="w-3 h-3 ml-1" />}
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 py-1.5 border-t first:border-t-0">
        <FileIcon doc={doc} />
        <p className="text-[11px] text-foreground flex-1 truncate">{doc.name}</p>
        <button onClick={() => setPreviewing(true)} className="p-1 rounded hover:bg-muted/50">
          <Eye className="w-3 h-3 text-muted-foreground" />
        </button>
        <a href={`/api/documents/${doc.id}/download`} className="p-1 rounded hover:bg-muted/50">
          <Download className="w-3 h-3 text-muted-foreground" />
        </a>
        <button onClick={() => setConfirmDelete(true)} className="p-1 rounded hover:bg-red-50">
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   كرت تجهيز الملف — Popup
   ═══════════════════════════════════════════════════════════════════ */
function FilePreparationPopup({ project, onClose }: {
  project: ProjectData; onClose: () => void;
}) {
  const color = "oklch(0.55 0.15 250)";
  const { data: allDocs = [], refetch: refetchDocs } = useDocuments({ projectId: project.id });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setTimeout(() => refetchDocs(), 500);
    setRefreshKey(k => k + 1);
  };

  const getDocsForFile = (category: string) =>
    (allDocs as Document[]).filter(d => d.category === category);

  const uploadedCount = REQUIRED_FILES.filter(f => getDocsForFile(f.category).length > 0).length;
  const progress = Math.round((uploadedCount / REQUIRED_FILES.length) * 100);

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
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">تجهيز الملف</h3>
                <p className="text-[11px] text-muted-foreground">رفع الملفات المطلوبة للإشراف</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs font-bold shrink-0" style={{ color, fontFamily: "'Space Grotesk'" }}>
              {uploadedCount}/{REQUIRED_FILES.length} ملف
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3" key={refreshKey}>
          <div className="rounded-xl p-3 text-[11px] text-muted-foreground" style={{ backgroundColor: `color-mix(in oklch, ${color} 6%, white)`, border: `1px solid color-mix(in oklch, ${color} 20%, transparent)` }}>
            ارفع الملفات الخمسة المطلوبة لبدء الإشراف الهندسي. ستظهر الملفات المرفوعة تحت كل بند مع إمكانية المعاينة والحذف.
          </div>

          {REQUIRED_FILES.map((fileReq, idx) => {
            const docs = getDocsForFile(fileReq.category);
            const hasFile = docs.length > 0;

            return (
              <div
                key={fileReq.key}
                className="rounded-xl border-2 overflow-hidden"
                style={{ borderColor: hasFile ? "oklch(0.55 0.15 150)" : `color-mix(in oklch, ${color} 25%, transparent)` }}
              >
                <div
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{ backgroundColor: hasFile ? "oklch(0.97 0.02 150)" : `color-mix(in oklch, ${color} 5%, white)` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
                    style={{ backgroundColor: hasFile ? "oklch(0.55 0.15 150)" : "oklch(0.82 0.00 0)" }}
                  >
                    {hasFile ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: hasFile ? "oklch(0.45 0.12 150)" : "hsl(var(--foreground))" }}>
                      {fileReq.label}
                    </p>
                    {hasFile ? (
                      <p className="text-[10px]" style={{ color: "oklch(0.55 0.15 150)" }}>{docs.length} ملف مرفوع ✓</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">لم يُرفع بعد</p>
                    )}
                  </div>
                  <FileUploadButton
                    label={fileReq.label}
                    category={fileReq.category}
                    projectId={project.id}
                    clientId={project.clientId}
                    onUploaded={() => refresh()}
                  />
                </div>
                {docs.length > 0 && (
                  <div className="px-3 pb-2 pt-1 space-y-0.5 border-t bg-muted/5">
                    {docs.map(doc => (
                      <UploadedFileRow key={doc.id} doc={doc} onDeleted={() => refresh()} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {uploadedCount === REQUIRED_FILES.length && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "oklch(0.97 0.02 150)", border: "1px solid oklch(0.55 0.15 150)" }}>
              <Check className="w-5 h-5 mx-auto mb-1" style={{ color: "oklch(0.55 0.15 150)" }} />
              <p className="text-sm font-bold" style={{ color: "oklch(0.45 0.12 150)" }}>تم رفع جميع الملفات المطلوبة ✓</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">يمكن الآن بدء مرحلة الإشراف الفعلي</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-muted/5">
          <Button size="sm" variant="outline" className="w-full h-9" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN: SupervisionProjectView
   ═══════════════════════════════════════════════════════════════════ */
interface SupervisionProjectViewProps {
  projectId: string;
}

export default function SupervisionProjectView({ projectId }: SupervisionProjectViewProps) {
  const { data: projectData, isLoading } = useProject(projectId);
  const updateTask = useUpdateTask(projectId);
  const { data: supervisionVisitsData = [] } = useSupervisionVisits(projectId);
  const { data: allProjectDocs = [] } = useDocuments({ projectId });

  const project = projectData as ProjectData | undefined;
  const [activePopup, setActivePopup] = useState<"file_prep" | "supervision" | null>(null);

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

  // ── حساب تقدم تجهيز الملف ──
  const uploadedFilesCount = REQUIRED_FILES.filter(f =>
    (allProjectDocs as Document[]).some(d => d.category === f.category)
  ).length;
  const filePreparationProgress = Math.round((uploadedFilesCount / REQUIRED_FILES.length) * 100);
  const filePreparationDone = uploadedFilesCount === REQUIRED_FILES.length;

  // ── حساب تقدم الإشراف ──
  const completedStages = (supervisionVisitsData as SupervisionVisit[])
    .filter(v => v.visitStatus === "completed" || v.visitStatus === "approved")
    .map(v => v.stageKey)
    .filter((k, i, arr) => arr.indexOf(k) === i).length;
  const totalStages = 18;
  const supervisionProgress = Math.round((completedStages / totalStages) * 100);

  // ── المرحلة الحالية ──
  const currentPhaseKey = filePreparationDone ? "supervision" : "file_prep";

  // ── مرحلة الإشراف من phases ──
  const supervisionPhase = project.phases.find(p =>
    p.title?.includes("إشراف")
  ) || project.phases[project.phases.length - 1] || { title: "الإشراف", tasks: [] };

  // ── بيانات الكروت ──
  const phases = [
    {
      key: "file_prep" as const,
      title: "تجهيز الملف",
      subtitle: "رفع الملفات المطلوبة",
      color: "oklch(0.55 0.15 250)",
      Icon: ClipboardList,
      progress: filePreparationProgress,
      done: filePreparationDone,
      doneLabel: `${uploadedFilesCount}/${REQUIRED_FILES.length} ملف`,
      checklist: REQUIRED_FILES.map(f => ({
        label: f.label,
        done: (allProjectDocs as Document[]).some(d => d.category === f.category),
      })),
    },
    {
      key: "supervision" as const,
      title: "الإشراف الفعلي",
      subtitle: "الإشراف على التنفيذ",
      color: "oklch(0.55 0.15 320)",
      Icon: CheckCircle2,
      progress: supervisionProgress,
      done: supervisionProgress === 100,
      doneLabel: `${completedStages}/${totalStages} مرحلة`,
      checklist: [] as { label: string; done: boolean }[],
    },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* ── Popups ── */}
      {activePopup === "file_prep" && (
        <FilePreparationPopup project={project} onClose={() => setActivePopup(null)} />
      )}
      {activePopup === "supervision" && (
        <PhaseSupervisionPopup
          phase={supervisionPhase}
          project={project}
          onClose={() => setActivePopup(null)}
          onTaskUpdate={handleTaskUpdate}
        />
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
            <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk'" }}>
              {uploadedFilesCount + completedStages}/{REQUIRED_FILES.length + totalStages}
            </span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <span className="text-2xl font-bold shrink-0" style={{ fontFamily: "'Space Grotesk'", color: "oklch(0.55 0.15 250)" }}>
          {project.progress}%
        </span>
      </div>

      {/* ── Phase Headers ── */}
      <div className="grid grid-cols-2 gap-2">
        {phases.map(phase => {
          const isCurrent = phase.key === currentPhaseKey;
          const isDone = phase.done;
          const { Icon } = phase;
          return (
            <button
              key={phase.key}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-center"
              style={{
                borderColor: isCurrent ? phase.color : isDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                backgroundColor: isCurrent
                  ? `color-mix(in oklch, ${phase.color} 10%, white)`
                  : isDone ? "oklch(0.97 0.02 150)" : "transparent",
              }}
              onClick={() => setActivePopup(phase.key)}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: isDone ? "oklch(0.55 0.15 150)" : isCurrent ? phase.color : "oklch(0.82 0.00 0)" }}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[10px] font-semibold leading-tight" style={{ color: isCurrent ? phase.color : isDone ? "oklch(0.45 0.12 150)" : "hsl(var(--muted-foreground))" }}>
                {phase.title}
              </span>
              <span className="text-[9px] font-bold" style={{ fontFamily: "'Space Grotesk'", color: isCurrent ? phase.color : "hsl(var(--muted-foreground))" }}>
                {phase.progress}%
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Kanban Cards ── */}
      <div className="grid grid-cols-2 gap-2">
        {phases.map(phase => {
          const isCurrent = phase.key === currentPhaseKey;
          const isDone = phase.done;
          const isUpcoming = !isCurrent && !isDone && phase.key === "supervision";

          return (
            <button
              key={phase.key}
              className="flex flex-col gap-2 p-3 rounded-xl border-2 text-right transition-all hover:shadow-md active:scale-95 w-full"
              style={{
                borderColor: isCurrent ? phase.color : isDone ? "oklch(0.55 0.15 150)" : "hsl(var(--border))",
                backgroundColor: isCurrent
                  ? `color-mix(in oklch, ${phase.color} 6%, white)`
                  : isDone ? "oklch(0.97 0.02 150)"
                  : isUpcoming ? "hsl(var(--muted)/0.3)"
                  : "transparent",
                opacity: isUpcoming ? 0.7 : 1,
              }}
              onClick={() => setActivePopup(phase.key)}
            >
              <div className="flex items-center justify-between">
                {isCurrent && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: phase.color }}>الحالية</span>}
                {isDone && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>مكتملة</span>}
                {isUpcoming && <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-full border">قادمة</span>}
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>

              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${phase.progress}%`, backgroundColor: isDone ? "oklch(0.55 0.15 150)" : phase.color }} />
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">مكتملة</span>
                <span className="font-bold" style={{ fontFamily: "'Space Grotesk'", color: isDone ? "oklch(0.45 0.12 150)" : phase.color }}>
                  {phase.doneLabel}
                </span>
              </div>

              {/* Checklist preview لتجهيز الملف */}
              {phase.key === "file_prep" && phase.checklist.length > 0 && (
                <div className="space-y-0.5">
                  {phase.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {item.done
                        ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" style={{ color: "oklch(0.55 0.15 150)" }} />
                        : <Circle className="w-2.5 h-2.5 shrink-0 text-muted-foreground" />
                      }
                      <span className={`${item.done ? "line-through text-muted-foreground" : "text-foreground"}`} style={{ fontSize: "9px" }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[9px] text-muted-foreground flex items-center gap-0.5 justify-center mt-1">
                <span>اضغط للتفاصيل</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
