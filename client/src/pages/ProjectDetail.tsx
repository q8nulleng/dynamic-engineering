/*
 * ProjectDetail - صفحة تفاصيل المشروع الداخلية
 * تعرض مراحل المشروع بنظام Kanban حسب نوع المشروع والخدمة
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, Users, MapPin, Link2, CheckCircle2, Circle,
  Clock, AlertCircle, User, FileText, X, MessageSquare,
  Paperclip, ChevronRight, Flag, Lock, Loader2, Sparkles
} from "lucide-react";
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useProject, useAutoCreateTasks, useUpdateTask } from "@/lib/api";
import { toast } from "sonner";
import SketchTaskPanel from "@/components/SketchTaskPanel";
import DocumentsTaskPanel from "@/components/DocumentsTaskPanel";
import ContractPaymentPanel from "@/components/ContractPaymentPanel";
import FormsTaskPanel from "@/components/FormsTaskPanel";
import SupervisionTaskPanel from "@/components/SupervisionTaskPanel";

/* ===== Types ===== */
interface SubTask { name: string; done: boolean; assignee?: string; }
interface Comment { author: string; text: string; time: string; }
interface Task {
  id: number;
  name: string;
  status: "done" | "in_progress" | "blocked" | "pending" | "waiting_client" | "cancelled";
  subTasks?: SubTask[];
  assignee?: string;
  description?: string;
  priority?: number;
  deadline?: string;
  comments?: Comment[];
  dependsOn?: number;
  estimatedDays?: number;
  autoCreated?: number;
}
interface Phase { title: string; subtitle?: string; tasks: Task[]; }
interface ProjectData {
  id: string; name: string; client: string; type: string; serviceType: string;
  area: string; quotation: string; progress: number; currentPhase: number;
  status?: string; phases: Phase[];
}

/* ========================================================================
   قوالب المراحل حسب نوع المشروع - من Odoo.sh
   ======================================================================== */

/* --- مراحل الصب والأعمدة (مشتركة) --- */
const structuralSubTasks = (done: boolean[]): SubTask[] => [
  { name: "مرحلة الحفر", done: done[0] ?? false },
  { name: "مرحلة القواعد", done: done[1] ?? false },
  { name: "مرحلة أعمدة السرداب", done: done[2] ?? false },
  { name: "مرحلة صب سقف السرداب", done: done[3] ?? false },
  { name: "مرحلة أعمدة الدور الأرضي", done: done[4] ?? false },
  { name: "مرحلة صب سقف الدور الأرضي", done: done[5] ?? false },
  { name: "مرحلة أعمدة الدور الأول", done: done[6] ?? false },
  { name: "مرحلة صب سقف الدور الأول", done: done[7] ?? false },
  { name: "مرحلة أعمدة الدور الثاني", done: done[8] ?? false },
  { name: "مرحلة صب سقف الدور الثاني", done: done[9] ?? false },
  { name: "مرحلة أعمدة السطح", done: done[10] ?? false },
  { name: "مرحلة صب سقف السطح", done: done[11] ?? false },
];


/* ===== Visual Config ===== */
const phaseColors = [
  "oklch(0.55 0.15 250)", "oklch(0.72 0.10 60)", "oklch(0.60 0.15 280)",
  "oklch(0.60 0.12 30)", "oklch(0.55 0.15 150)",
];

const statusConfig: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }>; bg: string; dot: string }> = {
  done:           { label: "مكتملة",         color: "oklch(0.55 0.15 150)", icon: CheckCircle2, bg: "bg-green-50 text-green-700",   dot: "bg-green-500"  },
  in_progress:    { label: "جارية",          color: "oklch(0.55 0.15 250)", icon: Clock,        bg: "bg-blue-50 text-blue-700",    dot: "bg-blue-500"   },
  blocked:        { label: "بانتظار مراجعة",  color: "oklch(0.60 0.12 30)",  icon: AlertCircle,  bg: "bg-orange-50 text-orange-700", dot: "bg-orange-400" },
  waiting_client: { label: "بانتظار العميل", color: "oklch(0.60 0.12 45)",  icon: AlertCircle,  bg: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-400" },
  pending:        { label: "لم تبدأ",        color: "oklch(0.70 0.00 0)",   icon: Circle,       bg: "bg-gray-50 text-gray-500",    dot: "bg-gray-300"   },
  cancelled:      { label: "ملغاة",          color: "oklch(0.55 0.15 30)",  icon: X,            bg: "bg-red-50 text-red-700",      dot: "bg-red-400"    },
};

/* ===== Assignee Avatar Colors ===== */
const assigneeColors: Record<string, string> = {
  "م. مارك":     "oklch(0.55 0.15 280)",
  "م. أمين":     "oklch(0.55 0.15 250)",
  "م. مصطفى":   "oklch(0.60 0.12 30)",
  "م. فداء":     "oklch(0.60 0.15 150)",
  "محمد ثروت":  "oklch(0.60 0.12 200)",
  "عرفان":       "oklch(0.65 0.10 60)",
};

function getAssigneeColor(name?: string) {
  if (!name) return "oklch(0.70 0.00 0)";
  return assigneeColors[name] || "oklch(0.55 0.15 280)";
}

function getInitials(name?: string) {
  if (!name) return "ن";
  const cleaned = name.replace("م. ", "");
  return cleaned.charAt(0);
}

// backward-compat empty export
export const projectsDB: Record<string, ProjectData> = {};

/* ========================================================================
   Task Detail Panel - نافذة تفاصيل المهمة الكاملة (مثل Odoo)
   ======================================================================== */
interface TaskPanelProps {
  task: Task;
  phaseTitle: string;
  phaseColor: string;
  projectId: string;
  onClose: () => void;
  onStatusChange?: (taskId: number, newStatus: string) => void;
}

function TaskDetailPanel({ task, phaseTitle, phaseColor, projectId, onClose, onStatusChange }: TaskPanelProps) {
  const config = statusConfig[task.status] ?? statusConfig["pending"];
  const updateTask = useUpdateTask(projectId);
  const StatusIcon = config.icon;
  const subDone = task.subTasks?.filter(s => s.done).length || 0;
  const subTotal = task.subTasks?.length || 0;

  const handleStatusChange = (newStatus: Task["status"]) => {
    updateTask.mutate(
      { id: task.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`تم تحديث حالة المهمة`);
          onStatusChange?.(task.id, newStatus);
          onClose();
        },
        onError: () => toast.error("حدث خطأ أثناء التحديث"),
      }
    );
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex" dir="rtl" onClick={onClose}>
      {/* Dark overlay */}
      <div className="flex-1 bg-black/40" />

      {/* Side Panel */}
      <div
        className="w-full max-w-lg bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderRight: `3px solid ${phaseColor}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="flex items-start gap-3 p-4 border-b bg-muted/20">
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
              <span>المشاريع</span>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: phaseColor }}>{phaseTitle}</span>
            </div>
            {/* Task Name */}
            <h2 className="text-base font-bold leading-tight">{task.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Panel Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Status + Priority Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </div>
            {(task.priority ?? 0) >= 2 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                <Flag className="w-3.5 h-3.5" />
                أولوية عالية
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground"
              style={{ borderColor: phaseColor, border: `1px solid ${phaseColor}`, color: phaseColor }}>
              {phaseTitle}
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: getAssigneeColor(task.assignee) }}
            >
              {getInitials(task.assignee)}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">المسؤول عن المهمة</p>
              <p className="text-sm font-semibold">{task.assignee || "غير محدد"}</p>
            </div>
            <div className="mr-auto">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                وصف المهمة
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 rounded-xl p-3 border border-border/40">
                {task.description}
              </p>
            </div>
          )}

          {/* Sub-tasks */}
          {task.subTasks && task.subTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  المهام الفرعية
                </p>
                <span className="text-xs font-bold" style={{ color: phaseColor, fontFamily: "'Space Grotesk'" }}>
                  {subDone}/{subTotal}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-muted mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${subTotal > 0 ? (subDone / subTotal) * 100 : 0}%`, backgroundColor: phaseColor }}
                />
              </div>
              <div className="space-y-1">
                {task.subTasks.map((st, i) => (
                  <div key={i} className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-colors ${st.done ? "bg-green-50/50" : "bg-muted/20"}`}>
                    {st.done
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                    <span className={`flex-1 ${st.done ? "line-through text-muted-foreground" : ""}`}>{st.name}</span>
                    {st.assignee && (
                      <span className="text-[10px] text-muted-foreground">{st.assignee}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments / Chatter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              السجل والتعليقات
            </p>
            {task.comments && task.comments.length > 0 ? (
              <div className="space-y-2">
                {task.comments.map((c, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: getAssigneeColor(c.author) }}
                    >
                      {getInitials(c.author)}
                    </div>
                    <div className="flex-1 bg-muted/30 rounded-xl p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{c.author}</span>
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-xs text-foreground/80">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                <MessageSquare className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                <p className="text-xs">لا توجد تعليقات بعد</p>
              </div>
            )}
          </div>

          {/* Attachments placeholder */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              المرفقات
            </p>
            <div className="text-center py-4 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
              <Paperclip className="w-5 h-5 mx-auto mb-1.5 opacity-30" />
              <p className="text-xs">لا توجد مرفقات</p>
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="p-4 border-t bg-muted/10 space-y-2">
          {/* Quick status change */}
          <div className="flex gap-2">
            {task.status !== "done" && (
              <Button
                className="flex-1 text-white text-xs"
                size="sm"
                style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                onClick={() => handleStatusChange("done")}
                disabled={updateTask.isPending}
              >
                {updateTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                تم إكمال المهمة
              </Button>
            )}
            {task.status !== "in_progress" && task.status !== "done" && (
              <Button
                variant="outline"
                className="flex-1 text-xs"
                size="sm"
                onClick={() => handleStatusChange("in_progress")}
                disabled={updateTask.isPending}
              >
                <Clock className="w-3.5 h-3.5 ml-1" />
                جارية
              </Button>
            )}
            {task.status !== "blocked" && task.status !== "done" && (
              <Button
                variant="outline"
                className="flex-1 text-xs text-orange-700 border-orange-200"
                size="sm"
                onClick={() => handleStatusChange("blocked")}
                disabled={updateTask.isPending}
              >
                <AlertCircle className="w-3.5 h-3.5 ml-1" />
                انتظار مراجعة
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   Main Component
   ======================================================================== */
export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id || "";
  const { data: projectData, isLoading } = useProject(projectId);
  const project = projectData as ProjectData | undefined;
  const autoCreateTasks = useAutoCreateTasks(projectId);
  const [selectedTask, setSelectedTask] = useState<{ task: Task; phaseTitle: string; phaseColor: string } | null>(null);
  const [showSketchPanel, setShowSketchPanel] = useState(false);
  const [sketchPanelColor, setSketchPanelColor] = useState("");
  const [showDocsPanel, setShowDocsPanel] = useState(false);
  const [showContractPanel, setShowContractPanel] = useState(false);
  const [showFormsPanel, setShowFormsPanel] = useState(false);
  const [showSupervisionPanel, setShowSupervisionPanel] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">المشروع غير موجود</p>
        <Link href="/projects"><Button variant="outline"><ArrowRight className="w-4 h-4 ml-2" />العودة للمشاريع</Button></Link>
      </div>
    );
  }

  const getPhaseProgress = (phase: Phase) => {
    const total = phase.tasks.length;
    const done = phase.tasks.filter(t => t.status === "done").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const totalTasks = project.phases.reduce((s, p) => s + p.tasks.length, 0);
  const doneTasks = project.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);

  /* خريطة id → status لكشف المهام المحجوبة */
  const allTasks = project.phases.flatMap(p => p.tasks);
  const taskStatusById = new Map(allTasks.map(t => [t.id, t.status]));
  const isTaskLocked = (task: Task) => {
    if (!task.dependsOn || task.dependsOn === 0) return false;
    return taskStatusById.get(task.dependsOn) !== "done";
  };

  /* هل يمكن إنشاء المهام التلقائية؟ */
  const hasAutoTasks = allTasks.some(t => t.autoCreated === 1);
  const canAutoCreate = (project.type === "سكن خاص") && !hasAutoTasks;

  const handleAutoCreate = () => {
    autoCreateTasks.mutate(undefined, {
      onSuccess: (data) => toast.success(`تم إنشاء ${data.created} مهمة تلقائياً`),
      onError: (err) => toast.error(err instanceof Error ? err.message : "فشل الإنشاء التلقائي"),
    });
  };

  return (
    <div className="space-y-5">
      {/* Task Detail Panel (Odoo-style) */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask.task}
          phaseTitle={selectedTask.phaseTitle}
          phaseColor={selectedTask.phaseColor}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
        />
      )}
      {showSketchPanel && (
        <SketchTaskPanel
          phaseColor={sketchPanelColor}
          onClose={() => setShowSketchPanel(false)}
        />
      )}
      {showDocsPanel && (
        <DocumentsTaskPanel
          open={showDocsPanel}
          onClose={() => setShowDocsPanel(false)}
          taskName="تجميع المستندات"
          projectName={project.name}
        />
      )}
      {showContractPanel && (
        <ContractPaymentPanel
          open={showContractPanel}
          onClose={() => setShowContractPanel(false)}
          projectName={project.name}
        />
      )}
      {showFormsPanel && (
        <FormsTaskPanel
          open={showFormsPanel}
          onClose={() => setShowFormsPanel(false)}
          projectName={project.name}
          serviceType={project.serviceType}
          clientId={project.client === "فهد العتيبي" ? "C001" : undefined}
        />
      )}
      {showSupervisionPanel && (
        <SupervisionTaskPanel
          open={showSupervisionPanel}
          onClose={() => setShowSupervisionPanel(false)}
          projectName={project.name}
          clientName={project.client}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <Button variant="outline" size="sm" className="shrink-0"><ArrowRight className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{project.name}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.client}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.area}</span>
            <span className="flex items-center gap-1" dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>
              <Link2 className="w-3 h-3" />{project.quotation}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAutoCreate && (
            <Button
              size="sm"
              className="text-white text-xs"
              style={{ backgroundColor: "oklch(0.55 0.15 250)" }}
              onClick={handleAutoCreate}
              disabled={autoCreateTasks.isPending}
            >
              {autoCreateTasks.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
                : <Sparkles className="w-3.5 h-3.5 ml-1" />}
              إنشاء مهام تلقائية
            </Button>
          )}
          <div className="text-left">
            <Badge variant="outline" className="text-xs">{project.type}</Badge>
            <Badge variant="secondary" className="text-xs mr-1">{project.serviceType}</Badge>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">الإنجاز الكلي</span>
            <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{doneTasks}/{totalTasks} مهمة</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk'", color: phaseColors[project.currentPhase] || phaseColors[0] }}>
          {project.progress}%
        </span>
      </div>

      {/* Phase Timeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {project.phases.map((phase, pi) => {
          const phaseProgress = getPhaseProgress(phase);
          const isCurrent = pi === project.currentPhase;
          const isDone = phaseProgress === 100;
          const color = phaseColors[pi % phaseColors.length];
          return (
            <div key={pi} className="flex items-center gap-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs whitespace-nowrap ${isCurrent ? "shadow-sm" : ""}`}
                style={{
                  borderColor: isCurrent ? color : isDone ? "oklch(0.55 0.15 150)" : undefined,
                  backgroundColor: isCurrent ? `color-mix(in oklch, ${color} 8%, white)` : undefined,
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: isDone ? "oklch(0.55 0.15 150)" : isCurrent ? color : "oklch(0.80 0.00 0)" }}>
                  {isDone ? "✓" : pi + 1}
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium ${isDone ? "text-green-700" : isCurrent ? "" : "text-muted-foreground"}`}>{phase.title}</span>
                  {phase.subtitle && <span className="text-[9px] text-muted-foreground">{phase.subtitle}</span>}
                </div>
                <span className="text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{phaseProgress}%</span>
              </div>
              {pi < project.phases.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
        {project.phases.map((phase, pi) => {
          const color = phaseColors[pi % phaseColors.length];
          const phaseProgress = getPhaseProgress(phase);
          const isCurrent = pi === project.currentPhase;
          const phaseDone = phase.tasks.filter(t => t.status === "done").length;

          return (
            <div key={pi} className="min-w-[270px] w-[270px] shrink-0">
              {/* Phase Header */}
              <div className="mb-3 px-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-bold">{phase.title}</h3>
                  {isCurrent && <Badge className="text-[9px] text-white px-1.5" style={{ backgroundColor: color }}>الحالية</Badge>}
                </div>
                {phase.subtitle && <p className="text-[10px] text-muted-foreground mr-5 mb-1">{phase.subtitle}</p>}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${phaseProgress}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{phaseDone}/{phase.tasks.length}</span>
                </div>
              </div>

              {/* Task Cards */}
              <div className="space-y-2">
                {phase.tasks.map((task, ti) => {
                  const config = statusConfig[task.status] ?? statusConfig["pending"];
                  const StatusIcon = config.icon;
                  const hasSubTasks = task.subTasks && task.subTasks.length > 0;
                  const subDone = task.subTasks?.filter(st => st.done).length || 0;
                  const subTotal = task.subTasks?.length || 0;
                  const locked = isTaskLocked(task);

                  return (
                    <div
                      key={ti}
                      className={`p-3 rounded-xl border bg-background transition-all cursor-pointer hover:shadow-md group ${locked ? "opacity-60" : ""}`}
                      style={{ borderColor: "transparent", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                      onClick={() => {
                        if (task.name === "تصميم الكروكي") {
                          setSketchPanelColor(color);
                          setShowSketchPanel(true);
                        } else if (task.name === "تجميع المستندات") {
                           setShowDocsPanel(true);
                         } else if (task.name.includes("العقد وتحصيل") || task.name.includes("تحصيل الدفعة")) {
                           setShowContractPanel(true);
                         } else if (task.name.includes("تجهيز النماذج والتعهدات")) {
                           setShowFormsPanel(true);
                         } else if (task.name.includes("الإشراف على التنفيذ")) {
                           setShowSupervisionPanel(true);
                         } else {
                          setSelectedTask({ task, phaseTitle: phase.title, phaseColor: color });
                        }
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = locked ? "#e5e7eb" : color)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                    >
                      {/* Card Top: Status dot + Name */}
                      <div className="flex items-start gap-2">
                        {locked
                          ? <Lock className="w-3 h-3 mt-1 shrink-0 text-muted-foreground" />
                          : <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${config.dot}`} />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-snug group-hover:text-foreground">{task.name}</p>
                          {task.estimatedDays ? (
                            <p className="text-[10px] text-muted-foreground">{task.estimatedDays} يوم</p>
                          ) : null}

                          {/* Sub-tasks progress bar */}
                          {hasSubTasks && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${subTotal > 0 ? (subDone / subTotal) * 100 : 0}%`, backgroundColor: color }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{subDone}/{subTotal}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom: Status badge + Assignee */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                        <Badge className={`text-[9px] px-1.5 h-4 ${config.bg}`} variant="secondary">
                          {locked ? "محجوبة" : config.label}
                        </Badge>
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                              style={{ backgroundColor: getAssigneeColor(task.assignee) }}
                            >
                              {getInitials(task.assignee)}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{task.assignee}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
