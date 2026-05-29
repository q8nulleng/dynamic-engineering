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
  Phone, Pencil, Check, AlertCircle, Zap, Upload
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useProject, useUpdateTask, useCreateProjectMeeting, useProjectMeetings } from "@/lib/api";

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
];

const PHASE_ICONS = [ClipboardList, Building2, Layers, FileText];

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
function PhaseFilePreparationPopup({ phase, project, onClose, onTaskUpdate }: {
  phase: Phase; project: ProjectData; onClose: () => void;
  onTaskUpdate: (taskId: number, status: Task["status"]) => void;
}) {
  const color = PHASE_COLORS[0];
  const [expandedGroup, setExpandedGroup] = useState<string | null>("payment");

  const getTask = (name: string) => phase.tasks.find(t => t.name.includes(name));
  const paymentTask = phase.tasks.find(t => t.name.includes("تحصيل") || t.name.includes("دفعة"));
  const docTasks = phase.tasks.filter(t =>
    t.name.includes("بطاقات") || t.name.includes("سند") || t.name.includes("ملكية") ||
    t.name.includes("خريطة") || t.name.includes("موقع")
  );
  const techTasks = phase.tasks.filter(t =>
    t.name.includes("كهرباء") || t.name.includes("تربة") || t.name.includes("فحص")
  );
  const formTasks = phase.tasks.filter(t =>
    t.name.includes("نماذج") || t.name.includes("بلدية") || t.name.includes("تعهد") || t.name.includes("تعبئة")
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

          {/* ── تحصيل الدفعة الأولى (في الأعلى دائماً) ── */}
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
                </div>
              )}
            </div>
          )}

          {/* ── الأوراق الرسمية (بطاقات + سند + خريطة) ── */}
          {docTasks.length > 0 && (
            <TaskGroup
              title="الأوراق الرسمية"
              subtitle="بطاقات مدنية، سند الملكية، خريطة الموقع"
              icon={<FileText className="w-3.5 h-3.5 text-white" />}
              color="oklch(0.55 0.15 250)"
              tasks={docTasks}
              expanded={expandedGroup === "docs"}
              onToggle={() => setExpandedGroup(expandedGroup === "docs" ? null : "docs")}
              onTaskUpdate={onTaskUpdate}
            />
          )}

          {/* ── الفحوصات التقنية (كهرباء + تربة) ── */}
          {techTasks.length > 0 && (
            <TaskGroup
              title="الفحوصات التقنية"
              subtitle="طلب إمكانية الكهرباء وفحص التربة"
              icon={<Zap className="w-3.5 h-3.5 text-white" />}
              color="oklch(0.60 0.12 30)"
              tasks={techTasks}
              expanded={expandedGroup === "tech"}
              onToggle={() => setExpandedGroup(expandedGroup === "tech" ? null : "tech")}
              onTaskUpdate={onTaskUpdate}
            />
          )}

          {/* ── نماذج البلدية ── */}
          {formTasks.length > 0 && (
            <TaskGroup
              title="نماذج البلدية"
              subtitle="تعبئة النماذج والتعهدات"
              icon={<ClipboardList className="w-3.5 h-3.5 text-white" />}
              color="oklch(0.55 0.15 150)"
              tasks={formTasks}
              expanded={expandedGroup === "forms"}
              onToggle={() => setExpandedGroup(expandedGroup === "forms" ? null : "forms")}
              onTaskUpdate={onTaskUpdate}
            />
          )}

          {/* ── المهام الأخرى ── */}
          {phase.tasks.filter(t =>
            !paymentTask || t.id !== paymentTask.id
          ).filter(t =>
            !docTasks.find(d => d.id === t.id) &&
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
                !docTasks.find(d => d.id === t.id) &&
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
  const [expandedSection, setExpandedSection] = useState<string | null>("facade");
  const [reviews, setReviews] = useState<{ id: number; title: string; done: boolean }[]>([
    { id: 1, title: "مراجعة الواجهات الأولى", done: false },
  ]);
  const [showAddReview, setShowAddReview] = useState(false);

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
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* الواجهات المعمارية */}
          {facadeTasks.length > 0 && (
            <TaskGroup title="الواجهات المعمارية" subtitle="تصميم الواجهات والمنظور ثلاثي الأبعاد"
              icon={<Building2 className="w-3.5 h-3.5 text-white" />} color={color}
              tasks={facadeTasks} expanded={expandedSection === "facade"}
              onToggle={() => setExpandedSection(expandedSection === "facade" ? null : "facade")}
              onTaskUpdate={onTaskUpdate} />
          )}

          {/* التصميم الإنشائي */}
          {structuralTasks.length > 0 && (
            <TaskGroup title="التصميم الإنشائي" subtitle="حسابات الأعمدة والجسور والأساسات"
              icon={<Wrench className="w-3.5 h-3.5 text-white" />} color="oklch(0.55 0.15 250)"
              tasks={structuralTasks} expanded={expandedSection === "structural"}
              onToggle={() => setExpandedSection(expandedSection === "structural" ? null : "structural")}
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

          {/* مراجعات الواجهات */}
          {reviews.map((review, idx) => (
            <div key={review.id} className="rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/20"
                onClick={() => setExpandedSection(expandedSection === `rev-${idx}` ? null : `rev-${idx}`)}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{review.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {review.done
                    ? <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>
                    : <span className="text-[10px] text-muted-foreground">لم تبدأ</span>}
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === `rev-${idx}` ? "rotate-90" : ""}`} />
                </div>
              </div>
              {expandedSection === `rev-${idx}` && (
                <div className="px-3 pb-3 pt-2 space-y-2 border-t">
                  <textarea className="w-full text-xs border rounded-lg p-2 resize-none bg-background" rows={2} placeholder="ملاحظات التعديلات..." />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => toast.info("تحديد موعد")}>
                      <Calendar className="w-3 h-3 ml-1" /> موعد لاحق
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                      onClick={() => { setReviews(p => p.map((r, i) => i === idx ? { ...r, done: true } : r)); toast.success("تم ✓"); }}>
                      <Check className="w-3 h-3 ml-1" /> إغلاق
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* زر إضافة مراجعة */}
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-muted/20"
            style={{ borderColor: `color-mix(in oklch, ${color} 40%, transparent)`, color }}
            onClick={() => {
              setReviews(p => [...p, { id: p.length + 1, title: `مراجعة وتعديل ${p.length + 1}`, done: false }]);
              toast.success("تمت إضافة مراجعة جديدة");
            }}
          >
            <Plus className="w-4 h-4" />
            إضافة مراجعة وتعديل
          </button>

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
    if (prog === 100) return "done";
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
        {/* Phase Headers Row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {project.phases.slice(0, 4).map((phase, idx) => {
            const color = PHASE_COLORS[idx % PHASE_COLORS.length];
            const phaseStatus = getPhaseStatus(phase, idx);
            const phaseProgress = getPhaseProgress(phase);
            const Icon = PHASE_ICONS[idx];
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

        {/* Kanban Cards Row */}
        <div className="grid grid-cols-4 gap-2">
          {project.phases.slice(0, 4).map((phase, idx) => {
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

      {/* ── Extra phases (if more than 4) ── */}
      {project.phases.length > 4 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">مراحل إضافية</p>
          <div className="grid grid-cols-2 gap-2">
            {project.phases.slice(4).map((phase, idx) => {
              const realIdx = idx + 4;
              const color = PHASE_COLORS[realIdx % PHASE_COLORS.length];
              const phaseProgress = getPhaseProgress(phase);
              return (
                <div key={realIdx} className="p-3 rounded-xl border bg-muted/10">
                  <p className="text-xs font-medium">{phase.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={phaseProgress} className="flex-1 h-1" />
                    <span className="text-[10px]" style={{ fontFamily: "'Space Grotesk'" }}>{phaseProgress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
