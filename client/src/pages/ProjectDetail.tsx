/**
 * ProjectDetail - صفحة تفاصيل المشروع
 * تصميم موحد: خط سير المراحل + قوائم منسدلة (Accordion) + كل مهمة تفتح كرت تفاعلي
 */
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  ArrowRight, Users, MapPin, Link2, CheckCircle2, Circle,
  Clock, AlertCircle, User, FileText, X, MessageSquare,
  ChevronRight, Lock, Loader2, Sparkles,
  Plus, ClipboardList, Upload, Mail, Zap, Send,
  Pencil, Building, Layers, Building2, Eye, Hash,
  ClipboardCheck, Calendar, Check
} from "lucide-react";
import { useRoute, Link } from "wouter";
import { useProject, useAutoCreateTasks, useUpdateTask, useWorkPlans, useApplyWorkPlan, useCreatePhaseTask, useUploadDocument, useDocuments, useSendEmail, useProjectMeetings, useCreateProjectMeeting, useApproveTask } from "@/lib/api";
import type { WorkPlan } from "@/lib/api";
import { toast } from "sonner";
import SketchTaskPanel from "@/components/SketchTaskPanel";
import DocumentsTaskPanel from "@/components/DocumentsTaskPanel";
import ContractPaymentPanel from "@/components/ContractPaymentPanel";
import FormsTaskPanel from "@/components/FormsTaskPanel";
import SupervisionTaskPanel from "@/components/SupervisionTaskPanel";
import ProjectBriefForm from "@/components/ProjectBriefForm";
import ResidentialKanban from "@/pages/ResidentialKanban";
import SupervisionProjectView from "@/pages/SupervisionProjectView";

/* ===== Types ===== */
interface SubTask { name: string; done: boolean; assignee?: string; }
interface Task {
  id: number;
  name: string;
  status: "done" | "in_progress" | "blocked" | "pending" | "waiting_client" | "cancelled";
  subTasks?: SubTask[];
  assignee?: string;
  description?: string;
  priority?: number;
  deadline?: string;
  dependsOn?: number;
  estimatedDays?: number;
  autoCreated?: number;
}
interface Phase { id?: number; title: string; subtitle?: string; tasks: Task[]; }
interface ProjectData {
  id: string; name: string; client: string; clientId?: string; type: string; serviceType: string;
  area: string; quotation: string; progress: number; currentPhase: number;
  status?: string; phases: Phase[];
  clientPhone?: string; block?: string; plot?: string;
}

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

const assigneeColors: Record<string, string> = {
  "م. مارك": "oklch(0.55 0.15 280)", "م. أمين": "oklch(0.55 0.15 250)",
  "م. مصطفى": "oklch(0.60 0.12 30)", "م. فداء": "oklch(0.60 0.15 150)",
  "محمد ثروت": "oklch(0.60 0.12 200)", "عرفان": "oklch(0.65 0.10 60)",
};
function getAssigneeColor(name?: string) { return name ? (assigneeColors[name] || "oklch(0.55 0.15 280)") : "oklch(0.70 0.00 0)"; }
function getInitials(name?: string) { if (!name) return "ن"; return name.replace("م. ", "").charAt(0); }

// backward-compat empty export
export const projectsDB: Record<string, ProjectData> = {};

/* ========================================================================
   TaskActionCard — كرت المهمة التفاعلي (يظهر عند الضغط على مهمة)
   ======================================================================== */
interface TaskActionCardProps {
  task: Task;
  phaseTitle: string;
  phaseColor: string;
  projectId: string;
  project: ProjectData;
  onClose: () => void;
}

function TaskActionCard({ task, phaseTitle, phaseColor, projectId, project, onClose }: TaskActionCardProps) {
  const config = statusConfig[task.status] ?? statusConfig["pending"];
  const updateTask = useUpdateTask(projectId);
  const uploadDoc = useUploadDocument();
  const sendEmail = useSendEmail();
  const approveTask = useApproveTask(projectId);
  const { data: docs } = useDocuments({ projectId });
  const { data: meetings } = useProjectMeetings(projectId);
  const createMeeting = useCreateProjectMeeting(projectId);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);

  // Determine task type for smart actions
  const isDocTask = task.name.includes("جمع") || task.name.includes("مستند") || task.name.includes("بطاقة") || task.name.includes("سند") || task.name.includes("خريطة");
  const isSoilTask = task.name.includes("تربة") || task.name.includes("soil");
  const isElecTask = task.name.includes("كهرباء") || task.name.includes("إمكانية");
  const isSketchTask = task.name.includes("كروكي") || task.name.includes("تصميم") && phaseTitle.includes("المعماري");
  const isApprovalTask = task.name.includes("اعتماد") || task.name.includes("موافقة");
  const isUploadTask = task.name.includes("رفع") || task.name.includes("واجه") || task.name.includes("إنشائ") || task.name.includes("مخطط");

  const [statusChanging, setStatusChanging] = useState(false);

  const handleStatusChange = (newStatus: Task["status"]) => {
    setStatusChanging(true);
    updateTask.mutate({ id: task.id, status: newStatus }, {
      onSuccess: () => {
        toast.success("تم تحديث حالة المهمة ✓");
        setTimeout(() => { setStatusChanging(false); onClose(); }, 600);
      },
      onError: () => { setStatusChanging(false); toast.error("حدث خطأ أثناء التحديث"); },
    });
  };

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);

  const handleUploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.doc,.docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", `${task.name} - ${project.client}`);
      formData.append("category", phaseTitle);
      formData.append("projectId", projectId);
      if (project.clientId) formData.append("clientId", project.clientId);
      uploadDoc.mutate(formData, {
        onSuccess: () => {
          setUploadSuccess(true);
          toast.success(`تم رفع الملف بنجاح ✓`, { duration: 3000 });
          setTimeout(() => setUploadSuccess(false), 2500);
        },
        onError: () => toast.error("فشل رفع الملف"),
      });
    };
    input.click();
  };

  const handleSendEmail = () => {
    if (!emailTo) return;
    sendEmail.mutate({
      to: emailTo,
      subject: emailSubject || `طلب — ${project.name}`,
      body: `السادة المحترمين،\n\nنرجو التكرم بالنظر في الطلب المرفق.\n- المشروع: ${project.name}\n- المنطقة: ${project.area || "—"}\n- المالك: ${project.client}\n\nمع التحية,\nمكتب ديناميك للاستشارات الهندسية`,
      attachmentUrls: [],
      projectId,
      type: isSoilTask ? "soil" : isElecTask ? "electricity" : "general",
    }, {
      onSuccess: () => { toast.success("تم إرسال الطلب بنجاح ✓"); setShowEmailForm(false); },
      onError: () => toast.error("فشل إرسال الإيميل"),
    });
  };

  const handleApprove = () => {
    approveTask.mutate(task.id, {
      onSuccess: (data) => {
        setApproveSuccess(true);
        toast.success("تم الاعتماد بنجاح ✓", { duration: 3000 });
        if (data.triggered?.length) {
          setTimeout(() => toast.info(`تم تفعيل: ${data.triggered.join("، ")}`), 500);
        }
        setTimeout(() => onClose(), 1500);
      },
      onError: () => toast.error("فشل الاعتماد"),
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    createMeeting.mutate({
      date: new Date().toISOString().split("T")[0],
      attendees: JSON.stringify(["م. مصطفى", project.client]),
      agreed: JSON.stringify([]),
      notes: noteText,
      status: "completed",
    }, {
      onSuccess: () => { toast.success("تم تسجيل الملاحظة ✓"); setShowNote(false); setNoteText(""); },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="w-full max-w-sm bg-background shadow-2xl overflow-y-auto animate-slide-in-up relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: phaseColor }} />
              <h3 className="text-sm font-bold truncate">{task.name}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted shrink-0"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`text-[10px] ${config.bg}`} variant="secondary">{config.label}</Badge>
            <span className="text-[10px] text-muted-foreground">{phaseTitle}</span>
            {task.assignee && (
              <div className="flex items-center gap-1 mr-auto">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: getAssigneeColor(task.assignee) }}>
                  {getInitials(task.assignee)}
                </div>
                <span className="text-[10px] text-muted-foreground">{task.assignee}</span>
              </div>
            )}
          </div>
          {task.estimatedDays && (
            <p className="text-[10px] text-muted-foreground mt-1">المدة المقدرة: {task.estimatedDays} يوم</p>
          )}
        </div>

        {/* Success Overlay */}
        {(uploadSuccess || approveSuccess) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-slide-in-up">
            <div className="flex flex-col items-center gap-3 animate-success-pop">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-success-glow ${approveSuccess ? 'bg-green-100' : 'bg-blue-100'}`}>
                <CheckCircle2 className={`w-8 h-8 ${approveSuccess ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <p className="text-sm font-bold text-foreground">
                {approveSuccess ? 'تم الاعتماد بنجاح!' : 'تم رفع الملف بنجاح!'}
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Sub-tasks */}
          {task.subTasks && task.subTasks.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-muted-foreground">المهام الفرعية</h4>
              {task.subTasks.map((st, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${st.done ? "bg-green-50 border-green-200" : "bg-background"}`}>
                  {st.done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                  <span className={st.done ? "text-green-700 line-through" : ""}>{st.name}</span>
                  {st.assignee && <span className="text-[10px] text-muted-foreground mr-auto">{st.assignee}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Smart Actions based on task type */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground">الإجراءات</h4>

            {/* Upload action */}
            {(isDocTask || isUploadTask) && (
              <Button
                size="sm"
                variant="outline"
                className={`w-full text-xs h-9 gap-2 justify-start transition-all ${uploadDoc.isPending ? 'animate-upload-pulse border-blue-300 bg-blue-50' : ''}`}
                onClick={handleUploadFile}
                disabled={uploadDoc.isPending}
              >
                {uploadDoc.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-blue-600" /><span className="text-blue-600">جاري الرفع...</span></>
                ) : (
                  <><Upload className="w-4 h-4" />رفع ملف</>
                )}
              </Button>
            )}

            {/* Email action */}
            {(isSoilTask || isElecTask) && !showEmailForm && (
              <Button
                size="sm"
                variant="outline"
                className={`w-full text-xs h-9 gap-2 justify-start ${isSoilTask ? "border-amber-300 text-amber-700" : "border-blue-300 text-blue-700"}`}
                onClick={() => {
                  setShowEmailForm(true);
                  setEmailTo(isSoilTask ? "info@soiltest.com.kw" : "mew@mew.gov.kw");
                  setEmailSubject(isSoilTask ? `طلب فحص تربة — ${project.name}` : `طلب إمكانية كهرباء — ${project.name}`);
                }}
              >
                <Mail className="w-4 h-4" />
                {isSoilTask ? "إرسال طلب تربة" : "إرسال طلب كهرباء"}
              </Button>
            )}

            {/* Email form */}
            {showEmailForm && (
              <div className="border rounded-xl p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold">إرسال طلب</h5>
                  <button onClick={() => setShowEmailForm(false)} className="p-1 rounded hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input className="w-full border rounded-lg px-2 py-1.5 text-xs bg-background" placeholder="البريد الإلكتروني" value={emailTo} onChange={e => setEmailTo(e.target.value)} dir="ltr" />
                <input className="w-full border rounded-lg px-2 py-1.5 text-xs bg-background" placeholder="الموضوع" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                <Button size="sm" className="w-full text-xs h-7 text-white" style={{ backgroundColor: phaseColor }} onClick={handleSendEmail} disabled={sendEmail.isPending}>
                  {sendEmail.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 ml-1" />}
                  إرسال
                </Button>
              </div>
            )}

            {/* Approval action */}
            {isApprovalTask && task.status !== "done" && (
              <Button
                size="sm"
                className={`w-full text-xs h-9 gap-2 text-white transition-all ${approveTask.isPending ? 'animate-upload-pulse' : 'hover:scale-[1.02]'}`}
                style={{ backgroundColor: "#16a34a" }}
                onClick={handleApprove}
                disabled={approveTask.isPending}
              >
                {approveTask.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />جاري الاعتماد...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" />اعتماد — إطلاق المرحلة التالية</>
                )}
              </Button>
            )}

            {/* Note action */}
            {!showNote && (
              <Button size="sm" variant="outline" className="w-full text-xs h-9 gap-2 justify-start" onClick={() => setShowNote(true)}>
                <MessageSquare className="w-4 h-4" />
                إضافة ملاحظة
              </Button>
            )}
            {showNote && (
              <div className="border rounded-xl p-3 space-y-2 bg-muted/20">
                <textarea className="w-full border rounded-lg px-2 py-1.5 text-xs bg-background min-h-[60px]" placeholder="ملاحظة..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-xs h-7 text-white" style={{ backgroundColor: phaseColor }} onClick={handleAddNote} disabled={createMeeting.isPending || !noteText.trim()}>
                    {createMeeting.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "حفظ"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowNote(false)}>إلغاء</Button>
                </div>
              </div>
            )}

            {/* Generic upload for any task */}
            {!isDocTask && !isUploadTask && (
              <Button
                size="sm"
                variant="outline"
                className={`w-full text-xs h-9 gap-2 justify-start transition-all ${uploadDoc.isPending ? 'animate-upload-pulse border-blue-300 bg-blue-50' : ''}`}
                onClick={handleUploadFile}
                disabled={uploadDoc.isPending}
              >
                {uploadDoc.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-blue-600" /><span className="text-blue-600">جاري الرفع...</span></>
                ) : (
                  <><Upload className="w-4 h-4" />إرفاق ملف</>
                )}
              </Button>
            )}
          </div>

          {/* Status Change */}
          <div className={`space-y-2 pt-3 border-t transition-all ${statusChanging ? 'opacity-50 scale-95' : ''}`}>
            <h4 className="text-xs font-bold text-muted-foreground">تغيير الحالة</h4>
            <div className="grid grid-cols-3 gap-1.5">
              {(["pending", "in_progress", "done"] as const).map(s => {
                const isActive = task.status === s;
                return (
                  <button
                    key={s}
                    className={`text-[10px] py-1.5 px-2 rounded-lg border transition-all duration-200 ${isActive ? "ring-2 ring-offset-1 font-bold scale-105" : "hover:bg-muted/50 hover:scale-[1.02]"}`}
                    style={isActive ? { borderColor: statusConfig[s].color, backgroundColor: `color-mix(in oklch, ${statusConfig[s].color} 10%, white)` } : {}}
                    onClick={() => handleStatusChange(s)}
                    disabled={updateTask.isPending || statusChanging}
                  >
                    {updateTask.isPending && statusChanging ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : statusConfig[s].label}
                  </button>
                );
              })}
            </div>
          </div>
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
  const [showBriefForm, setShowBriefForm] = useState(false);

  // Work Plans state
  const [showImportPlan, setShowImportPlan] = useState(false);
  const [showAddTask, setShowAddTask] = useState<{ phaseId: number; phaseTitle: string } | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDays, setNewTaskDays] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const { data: workPlans = [] } = useWorkPlans();
  const applyWorkPlan = useApplyWorkPlan(projectId);
  const createPhaseTask = useCreatePhaseTask(projectId);

  const handleApplyPlan = (plan: WorkPlan) => {
    applyWorkPlan.mutate(plan.id, {
      onSuccess: (data) => {
        toast.success(`تم استيراد خطة "${plan.name}" - ${data.created} مرحلة/مهمة`);
        setShowImportPlan(false);
      },
      onError: () => toast.error("فشل استيراد الخطة"),
    });
  };

  const handleAddTask = () => {
    if (!showAddTask || !newTaskName.trim()) return;
    createPhaseTask.mutate(
      { phaseId: showAddTask.phaseId, name: newTaskName.trim(), estimatedDays: newTaskDays ? parseInt(newTaskDays) : undefined, assignee: newTaskAssignee || undefined },
      {
        onSuccess: () => {
          toast.success("تمت إضافة المهمة");
          setShowAddTask(null);
          setNewTaskName("");
          setNewTaskDays("");
          setNewTaskAssignee("");
        },
        onError: () => toast.error("فشل إضافة المهمة"),
      }
    );
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  // مشاريع الإشراف: عرض مرحلتين فقط (تجهيز الملف + الإشراف)
  if (project && project.serviceType === "\u0625\u0634\u0631\u0627\u0641") {
    return <SupervisionProjectView projectId={projectId} />;
  }

  // تحويل جميع أنواع المشاريع إلى Kanban (سكن خاص، صناعي، تجاري، استثماري)
  if (project && ["\u0633\u0643\u0646 \u062e\u0627\u0635", "\u0635\u0646\u0627\u0639\u064a", "\u062a\u062c\u0627\u0631\u064a", "\u0627\u0633\u062a\u062b\u0645\u0627\u0631\u064a"].includes(project.type)) {
    return <ResidentialKanban projectId={projectId} />;
  }

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

  const allTasks = project.phases.flatMap(p => p.tasks);
  const taskStatusById = new Map(allTasks.map(t => [t.id, t.status]));
  const isTaskLocked = (task: Task) => {
    if (!task.dependsOn || task.dependsOn === 0) return false;
    return taskStatusById.get(task.dependsOn) !== "done";
  };

  const hasAutoTasks = allTasks.some(t => t.autoCreated === 1);
  const canAutoCreate = (project.type === "سكن خاص") && !hasAutoTasks;

  const handleAutoCreate = () => {
    autoCreateTasks.mutate(undefined, {
      onSuccess: (data) => toast.success(`تم إنشاء ${data.created} مهمة تلقائياً`),
      onError: (err) => toast.error(err instanceof Error ? err.message : "فشل الإنشاء التلقائي"),
    });
  };

  // Determine which phase is current for default open accordion
  const currentPhaseValue = `phase-${project.currentPhase}`;

  const handleTaskClick = (task: Task, phase: Phase, color: string) => {
    // Special panels for specific tasks
    if (task.name === "تصميم الكروكي") {
      setSketchPanelColor(color);
      setShowSketchPanel(true);
    } else if (
      task.name === "تجميع المستندات" ||
      task.name.includes("تجميع مستندات") ||
      task.name.includes("جمع الوثائق") ||
      phase.title === "تجهيز الملف"
    ) {
      setShowDocsPanel(true);
    } else if (task.name.includes("العقد وتحصيل") || task.name.includes("تحصيل الدفعة") || task.name.includes("العقد والدفعة")) {
      setShowContractPanel(true);
    } else if (task.name.includes("تجهيز النماذج والتعهدات")) {
      setShowFormsPanel(true);
    } else if (task.name.includes("الإشراف على التنفيذ")) {
      setShowSupervisionPanel(true);
    } else {
      setSelectedTask({ task, phaseTitle: phase.title, phaseColor: color });
    }
  };

  return (
    <div className="space-y-5">
      {/* Task Action Card (side panel) */}
      {selectedTask && (
        <TaskActionCard
          task={selectedTask.task}
          phaseTitle={selectedTask.phaseTitle}
          phaseColor={selectedTask.phaseColor}
          projectId={projectId}
          project={project}
          onClose={() => setSelectedTask(null)}
        />
      )}
      {showSketchPanel && <SketchTaskPanel phaseColor={sketchPanelColor} onClose={() => setShowSketchPanel(false)} />}
      {showDocsPanel && <DocumentsTaskPanel open={showDocsPanel} onClose={() => setShowDocsPanel(false)} taskName="تجهيز الملف" projectName={project.name} clientName={project.client} clientPhone={project.clientPhone} clientId={project.clientId} projectId={project.id} />}
      {showContractPanel && <ContractPaymentPanel open={showContractPanel} onClose={() => setShowContractPanel(false)} projectName={project.name} projectId={project.id} />}
      {showFormsPanel && <FormsTaskPanel open={showFormsPanel} onClose={() => setShowFormsPanel(false)} projectName={project.name} serviceType={project.serviceType} clientId={project.clientId} />}
      {showSupervisionPanel && <SupervisionTaskPanel open={showSupervisionPanel} onClose={() => setShowSupervisionPanel(false)} projectName={project.name} clientName={project.client} />}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0"><ArrowRight className="w-4 h-4" /></Button>
          </Link>
          <h2 className="text-base font-bold flex-1 min-w-0 truncate">{project.name}</h2>
          {canAutoCreate && (
            <Button size="sm" className="text-white text-xs h-8 shrink-0" style={{ backgroundColor: "oklch(0.55 0.15 250)" }} onClick={handleAutoCreate} disabled={autoCreateTasks.isPending}>
              {autoCreateTasks.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span className="hidden sm:inline mr-1">إنشاء مهام</span>
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs h-8 shrink-0" onClick={() => setShowImportPlan(true)}>
            <ClipboardList className="w-3 h-3" />
            <span className="hidden sm:inline mr-1">خطة عمل</span>
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-8 shrink-0" onClick={() => setShowBriefForm(true)}>
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline mr-1">نموذج الطلبات</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{project.client}</span>
          {project.area && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{project.area}</span>}
          <Badge variant="outline" className="text-[10px] h-5">{project.type}</Badge>
          <Badge variant="secondary" className="text-[10px] h-5">{project.serviceType}</Badge>
          {project.quotation && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground" dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>
              <Link2 className="w-3 h-3" />{project.quotation}
            </span>
          )}
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

      {/* Phase Timeline - horizontal strip */}
      <div className="-mx-1">
        <div className="flex items-stretch gap-0 overflow-x-auto pb-1 px-1" style={{ scrollbarWidth: "none" }}>
          {project.phases.map((phase, pi) => {
            const phaseProgress = getPhaseProgress(phase);
            const isCurrent = pi === project.currentPhase;
            const isDone = phaseProgress === 100;
            const color = phaseColors[pi % phaseColors.length];
            return (
              <div key={pi} className="flex items-center shrink-0">
                <button
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-center transition-all ${isCurrent ? "shadow-sm" : "border-transparent"}`}
                  style={{
                    minWidth: "72px",
                    borderColor: isCurrent ? color : isDone ? "oklch(0.55 0.15 150)" : "transparent",
                    backgroundColor: isCurrent ? `color-mix(in oklch, ${color} 10%, white)` : isDone ? "oklch(0.97 0.02 150)" : "transparent",
                  }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: isDone ? "oklch(0.55 0.15 150)" : isCurrent ? color : "oklch(0.82 0.00 0)" }}>
                    {isDone ? "✓" : pi + 1}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight text-center max-w-[64px] ${isDone ? "text-green-700" : isCurrent ? "text-foreground" : "text-muted-foreground"}`} style={{ wordBreak: "keep-all" }}>
                    {phase.title}
                  </span>
                  <span className="text-[9px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{phaseProgress}%</span>
                </button>
                {pi < project.phases.length - 1 && <div className="w-3 h-px bg-border/60 shrink-0 mx-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Phases as Accordion (قوائم منسدلة) ═══ */}
      <Accordion type="multiple" defaultValue={[currentPhaseValue]} className="space-y-2">
        {project.phases.map((phase, pi) => {
          const color = phaseColors[pi % phaseColors.length];
          const phaseProgress = getPhaseProgress(phase);
          const isCurrent = pi === project.currentPhase;
          const phaseDone = phase.tasks.filter(t => t.status === "done").length;

          return (
            <AccordionItem key={pi} value={`phase-${pi}`} className="border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-3 py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, white)` }}>
                    <span className="text-xs font-bold" style={{ color }}>{pi + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{phase.title}</h3>
                      {isCurrent && <Badge className="text-[9px] text-white px-1.5 shrink-0" style={{ backgroundColor: color }}>الحالية</Badge>}
                    </div>
                    {phase.subtitle && <p className="text-[10px] text-muted-foreground truncate">{phase.subtitle}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${phaseProgress}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-center" style={{ fontFamily: "'Space Grotesk'" }}>{phaseDone}/{phase.tasks.length}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                {/* Task list */}
                <div className="space-y-1.5">
                  {phase.tasks.map((task, ti) => {
                    const tConfig = statusConfig[task.status] ?? statusConfig["pending"];
                    const locked = isTaskLocked(task);
                    const hasSubTasks = task.subTasks && task.subTasks.length > 0;
                    const subDone = task.subTasks?.filter(st => st.done).length || 0;
                    const subTotal = task.subTasks?.length || 0;

                    return (
                      <div
                        key={ti}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border bg-background transition-all cursor-pointer hover:border-gray-300 active:scale-[0.98] ${locked ? "opacity-50" : ""}`}
                        onClick={() => !locked && handleTaskClick(task, phase, color)}
                      >
                        {/* Status indicator */}
                        {locked
                          ? <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          : <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${tConfig.dot}`} />
                        }

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{task.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.estimatedDays && <span className="text-[10px] text-muted-foreground">{task.estimatedDays} يوم</span>}
                            {hasSubTasks && (
                              <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{subDone}/{subTotal}</span>
                            )}
                          </div>
                        </div>

                        {/* Assignee */}
                        {task.assignee && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: getAssigneeColor(task.assignee) }} title={task.assignee}>
                            {getInitials(task.assignee)}
                          </div>
                        )}

                        {/* Status badge */}
                        <Badge className={`text-[9px] px-1.5 h-4 shrink-0 ${tConfig.bg}`} variant="secondary">
                          {locked ? "محجوبة" : tConfig.label}
                        </Badge>

                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}

                  {/* Add Task Button */}
                  <button
                    className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border border-dashed"
                    onClick={() => setShowAddTask({ phaseId: (phase as any).id || pi, phaseTitle: phase.title })}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مهمة
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Import Work Plan Modal */}
      {showImportPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl" onClick={() => setShowImportPlan(false)}>
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" style={{ color: "oklch(0.55 0.15 250)" }} />
                <h3 className="text-base font-bold">استيراد خطة عمل</h3>
              </div>
              <button onClick={() => setShowImportPlan(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {workPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد خطط عمل محفوظة</p>
                  <p className="text-xs mt-1">أضف خطط عمل من قسم "خطط العمل" في القائمة الجانبية</p>
                </div>
              ) : (
                workPlans.map(plan => (
                  <div key={plan.id} className="border rounded-xl p-3 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{plan.name}</p>
                        {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px] h-5">{plan.projectType}</Badge>
                          {plan.serviceType && <Badge variant="secondary" className="text-[10px] h-5">{plan.serviceType}</Badge>}
                          <span className="text-[10px] text-muted-foreground">{plan.phases?.length || 0} مرحلة</span>
                        </div>
                      </div>
                      <Button size="sm" className="text-white text-xs h-7 shrink-0" style={{ backgroundColor: "oklch(0.55 0.15 250)" }} onClick={() => handleApplyPlan(plan)} disabled={applyWorkPlan.isPending}>
                        {applyWorkPlan.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "استيراد"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl" onClick={() => setShowAddTask(null)}>
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-bold">إضافة مهمة — {showAddTask.phaseTitle}</h3>
              <button onClick={() => setShowAddTask(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">اسم المهمة *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="مثال: مراجعة المخططات" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">المدة (أيام)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="3" type="number" min="1" value={newTaskDays} onChange={e => setNewTaskDays(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">المسؤول</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="م. أمين" value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button className="flex-1 text-white text-sm" style={{ backgroundColor: "oklch(0.55 0.15 150)" }} onClick={handleAddTask} disabled={!newTaskName.trim() || createPhaseTask.isPending}>
                  {createPhaseTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 ml-1" />}
                  إضافة المهمة
                </Button>
                <Button variant="outline" className="flex-1 text-sm" onClick={() => setShowAddTask(null)}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Brief Form */}
      {showBriefForm && <ProjectBriefForm projectId={projectId} onClose={() => setShowBriefForm(false)} />}
    </div>
  );
}
