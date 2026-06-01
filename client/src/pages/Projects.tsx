/**
 * Projects - صفحة كروت المشاريع الرئيسية
 * تبويبات رئيسية: الكل | سكن خاص | صناعي | استثماري | تجاري
 * تبويبات فرعية: بناء جديد | تعديل | إضافة | تعديل وإضافة | هدم | إشراف
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Users, MapPin, Link2, ChevronLeft, Briefcase,
  Home, Factory, TrendingUp, Store,
  Building2, Wrench, PlusSquare, Layers, Trash2, Eye,
  StickyNote, X, MessageSquare
} from "lucide-react";
import { Link, useLocation } from "wouter";
import NewProjectDialog from "@/components/NewProjectDialog";
import { toast } from "sonner";
import { useProjects, useCreateProject } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const PROJECT_STATUSES = [
  { key: "all",    label: "الكل",     color: "oklch(0.50 0.00 0)" },
  { key: "جديد",   label: "جديد",    color: "oklch(0.55 0.15 250)" },
  { key: "جارٍ",   label: "جارٍ",    color: "oklch(0.55 0.15 200)" },
  { key: "بلدية",  label: "بلدية",   color: "oklch(0.55 0.15 60)"  },
  { key: "إشراف",  label: "إشراف",   color: "oklch(0.55 0.15 150)" },
  { key: "معلّق",  label: "معلّق",   color: "oklch(0.55 0.15 30)"  },
  { key: "مكتمل",  label: "مكتمل",   color: "oklch(0.55 0.15 140)" },
  { key: "مُقفل",  label: "مُقفل",   color: "oklch(0.45 0.00 0)"   },
];

const stageLabel = (progress: number) => {
  if (progress >= 90) return { text: "شبه مكتمل", color: "oklch(0.55 0.15 150)" };
  if (progress >= 60) return { text: "متقدم",      color: "oklch(0.60 0.15 280)" };
  if (progress >= 30) return { text: "قيد التنفيذ", color: "oklch(0.55 0.15 250)" };
  return                      { text: "بداية",      color: "oklch(0.72 0.10 60)"  };
};

/* ─── التصنيفات الرئيسية ─── */
const MAIN_CATS = [
  { key: "all",       label: "الكل",      icon: Briefcase,  color: "oklch(0.30 0.05 250)" },
  { key: "سكن خاص",  label: "سكن خاص",  icon: Home,       color: "oklch(0.50 0.15 250)" },
  { key: "صناعي",    label: "صناعي",    icon: Factory,    color: "oklch(0.50 0.15 30)"  },
  { key: "استثماري", label: "استثماري", icon: TrendingUp, color: "oklch(0.50 0.15 150)" },
  { key: "تجاري",    label: "تجاري",    icon: Store,      color: "oklch(0.50 0.15 60)"  },
];

/* ─── التصنيفات الفرعية ─── */
const SUB_CATS = [
  { key: "all",            label: "الكل",           icon: Layers      },
  { key: "بناء جديد",     label: "بناء جديد",      icon: Building2   },
  { key: "تعديل",         label: "تعديل",          icon: Wrench      },
  { key: "إضافة",         label: "إضافة",          icon: PlusSquare  },
  { key: "تعديل وإضافة",  label: "تعديل وإضافة",  icon: Layers      },
  { key: "هدم",           label: "هدم",            icon: Trash2      },
  { key: "إشراف",         label: "إشراف",          icon: Eye         },
];

export default function Projects() {
  const { data: allProjectsData = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [mainTab,      setMainTab]      = useState("all");
  const [subTab,       setSubTab]       = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewProject, setShowNewProject] = useState(false);

  // حذف المشروع
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ملاحظات المشروع
  const [notesTarget, setNotesTarget] = useState<{ id: string; name: string; notes: string } | null>(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const allProjects = allProjectsData;

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  /* تصفية حسب التصنيف الرئيسي */
  const byMain = mainTab === "all"
    ? allProjects
    : allProjects.filter(p => p.type === mainTab);

  /* تصفية حسب التصنيف الفرعي */
  const bySub = subTab === "all"
    ? byMain
    : byMain.filter(p => p.serviceType === subTab);

  /* تصفية حسب حالة المشروع */
  const filtered = statusFilter === "all"
    ? bySub
    : bySub.filter(p => (p.status || "جديد") === statusFilter);

  const activeCat = MAIN_CATS.find(c => c.key === mainTab)!;

  /* عداد كل تصنيف فرعي ضمن التصنيف الرئيسي المحدد */
  const subCount = (key: string) =>
    key === "all" ? byMain.length : byMain.filter(p => p.serviceType === key).length;

  /* عداد كل حالة */
  const statusCount = (key: string) =>
    key === "all" ? bySub.length : bySub.filter(p => (p.status || "جديد") === key).length;

  /* حذف المشروع */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      toast.success(`تم حذف المشروع: ${deleteTarget.name}`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteTarget(null);
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeleting(false);
    }
  };

  /* حفظ الملاحظات */
  const handleSaveNotes = async () => {
    if (!notesTarget) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/projects/${notesTarget.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("تم حفظ الملاحظات");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNotesTarget(null);
    } catch {
      toast.error("حدث خطأ أثناء حفظ الملاحظات");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">تتبع المشاريع عبر مراحل سير العمل الهندسي</p>
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              <strong style={{ fontFamily: "'Space Grotesk'" }}>{allProjects.length}</strong> مشروع إجمالي
            </span>
            <span>·</span>
            <span>
              <strong style={{ fontFamily: "'Space Grotesk'" }}>
                {allProjects.filter(p => p.progress < 100).length}
              </strong> نشط
            </span>
          </div>
        </div>
        <Button onClick={() => setShowNewProject(true)} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          مشروع جديد
        </Button>
      </div>

      {/* ─── التصنيفات الرئيسية ─── */}
      <div className="flex gap-2 flex-wrap">
        {MAIN_CATS.map(cat => {
          const count = cat.key === "all"
            ? allProjects.length
            : allProjects.filter(p => p.type === cat.key).length;
          const Icon = cat.icon;
          const isActive = mainTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { setMainTab(cat.key); setSubTab("all"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
              style={{
                backgroundColor: isActive ? `color-mix(in oklch, ${cat.color} 12%, white)` : "transparent",
                borderColor:     isActive ? `color-mix(in oklch, ${cat.color} 40%, transparent)` : "hsl(var(--border))",
                color:           isActive ? cat.color : "hsl(var(--muted-foreground))",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? `color-mix(in oklch, ${cat.color} 20%, white)` : "hsl(var(--muted))",
                  color:           isActive ? cat.color : "hsl(var(--muted-foreground))",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── التصنيفات الفرعية (تظهر فقط إذا وُجدت مشاريع) ─── */}
      {byMain.length > 0 && (
        <div
          className="flex gap-1.5 flex-wrap px-3 py-2 rounded-xl border"
          style={{ backgroundColor: `color-mix(in oklch, ${activeCat.color} 4%, white)`, borderColor: `color-mix(in oklch, ${activeCat.color} 15%, transparent)` }}
        >
          {SUB_CATS.map(sub => {
            const cnt = subCount(sub.key);
            if (cnt === 0 && sub.key !== "all") return null; // إخفاء الفارغة
            const Icon = sub.icon;
            const isActive = subTab === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => setSubTab(sub.key)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: isActive ? activeCat.color : "transparent",
                  color:           isActive ? "white" : "hsl(var(--muted-foreground))",
                }}
              >
                <Icon className="w-3 h-3" />
                {sub.label}
                <span
                  className="text-[9px] font-bold px-1 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "hsl(var(--muted))",
                    color:           isActive ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── فلتر الحالة ─── */}
      <div className="flex gap-1.5 flex-wrap">
        {PROJECT_STATUSES.map(st => {
          const cnt = statusCount(st.key);
          const isActive = statusFilter === st.key;
          return (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
              style={{
                backgroundColor: isActive ? `color-mix(in oklch, ${st.color} 12%, white)` : "transparent",
                borderColor:     isActive ? `color-mix(in oklch, ${st.color} 40%, transparent)` : "hsl(var(--border))",
                color:           isActive ? st.color : "hsl(var(--muted-foreground))",
              }}
            >
              {st.label}
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? `color-mix(in oklch, ${st.color} 20%, white)` : "hsl(var(--muted))",
                  color:           isActive ? st.color : "hsl(var(--muted-foreground))",
                }}
              >
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── عدد النتائج ─── */}
      {(mainTab !== "all" || subTab !== "all") && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: activeCat.color }} />
          يعرض <strong style={{ color: activeCat.color }}>{filtered.length}</strong> مشروع
          {mainTab !== "all" && <> في "{activeCat.label}"</>}
          {subTab !== "all"  && <> · "{subTab}"</>}
        </p>
      )}

      {/* ─── كروت المشاريع ─── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 opacity-30" />
          </div>
          <p className="text-sm font-medium">لا توجد مشاريع في هذا التصنيف</p>
          <p className="text-xs mt-1">اضغط "مشروع جديد" لإضافة مشروع</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const stage = stageLabel(project.progress);
            const projectPhases = project.phases || [];
            const totalTasks = projectPhases.reduce((s, p) => s + (p.tasks?.length || 0), 0);
            const doneTasks  = projectPhases.reduce((s, p) => s + (p.tasks?.filter(t => t.status === "done").length || 0), 0);
            const currentPhaseName = projectPhases[project.currentPhase]?.title || "";
            const catInfo = MAIN_CATS.find(c => c.key === project.type) || MAIN_CATS[0];
            const CatIcon = catInfo.icon;
            const statusInfo = PROJECT_STATUSES.find(s => s.key === (project.status || "جديد")) || PROJECT_STATUSES[1];
            const hasNotes = !!(project as any).notes;

            return (
              <div key={project.id} className="relative group">
                {/* ─── أزرار الإجراءات السريعة (تظهر عند hover) ─── */}
                <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {/* زر الملاحظات */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNotesTarget({ id: project.id, name: project.name, notes: (project as any).notes || "" });
                      setNotesText((project as any).notes || "");
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm"
                    style={{
                      backgroundColor: hasNotes ? "oklch(0.55 0.15 60)" : "white",
                      border: `1px solid ${hasNotes ? "oklch(0.55 0.15 60)" : "hsl(var(--border))"}`,
                      color: hasNotes ? "white" : "hsl(var(--muted-foreground))",
                    }}
                    title="ملاحظات المشروع"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* زر الحذف */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget({ id: project.id, name: project.name });
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-400 transition-all shadow-sm"
                    title="حذف المشروع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ─── مؤشر الملاحظات (دائم) ─── */}
                {hasNotes && (
                  <div className="absolute top-2 left-2 z-10 group-hover:opacity-0 transition-opacity">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "oklch(0.55 0.15 60)", color: "white" }}
                      title="يوجد ملاحظات"
                    >
                      <StickyNote className="w-2.5 h-2.5" />
                    </div>
                  </div>
                )}

                <div
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-4 rounded-xl border bg-background hover:shadow-md transition-all cursor-pointer"
                >
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{project.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Link2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{project.quotation}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 items-center">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${statusInfo.color} 12%, white)`,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `color-mix(in oklch, ${catInfo.color} 12%, white)` }}
                        >
                          <CatIcon className="w-3.5 h-3.5" style={{ color: catInfo.color }} />
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{project.serviceType}</Badge>
                      </div>
                    </div>

                    {/* Client + Location */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="truncate">{project.client}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{project.area}</span>
                      </div>
                    </div>

                    {/* ملاحظة مختصرة (إذا وُجدت) */}
                    {hasNotes && (
                      <div
                        className="mb-3 px-2 py-1.5 rounded-md text-[10px] border space-y-1"
                        style={{ backgroundColor: "oklch(0.98 0.02 60)", borderColor: "oklch(0.90 0.05 60)" }}
                      >
                        <div className="flex items-start gap-1 text-muted-foreground">
                          <StickyNote className="w-2.5 h-2.5 shrink-0 mt-0.5 text-amber-500" />
                          <span className="line-clamp-1">{(project as any).notes}</span>
                        </div>
                        {(project as any).notesUpdatedAt && (
                          <div className="flex items-center gap-1 text-[9px]" style={{ color: "oklch(0.65 0.08 60)" }}>
                            <span>آخر تعديل:</span>
                            <span style={{ fontFamily: "'Space Grotesk'" }}>
                              {new Date((project as any).notesUpdatedAt).toLocaleDateString("ar-KW", {
                                year: "numeric", month: "short", day: "numeric"
                              })}
                              {" — "}
                              {new Date((project as any).notesUpdatedAt).toLocaleTimeString("ar-KW", {
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Current Phase */}
                    <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-md"
                      style={{ backgroundColor: `color-mix(in oklch, ${stage.color} 8%, white)` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-[11px] font-medium" style={{ color: stage.color }}>{currentPhaseName}</span>
                      <span className="text-[10px] text-muted-foreground mr-auto">{stage.text}</span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          المهام: <span style={{ fontFamily: "'Space Grotesk'" }}>{doneTasks}/{totalTasks}</span>
                        </span>
                        <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk'", color: stage.color }}>
                          {project.progress}%
                        </span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex gap-1.5">
                        {projectPhases.map((_, pi) => {
                          const p = projectPhases[pi];
                          const done = (p.tasks || []).filter(t => t.status === "done").length;
                          const pp = (p.tasks || []).length > 0 ? (done / (p.tasks || []).length) * 100 : 0;
                          return (
                            <div key={pi} className="w-5 h-1.5 rounded-full overflow-hidden bg-gray-100">
                              <div className="h-full rounded-full transition-all" style={{
                                width: `${pp}%`,
                                backgroundColor: pi === project.currentPhase ? stage.color : "oklch(0.55 0.15 150)",
                              }} />
                            </div>
                          );
                        })}
                      </div>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Dialog حذف المشروع ─── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              حذف المشروع
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المشروع؟
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm font-medium text-red-700">
              {deleteTarget?.name}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              سيتم حذف المشروع وجميع مراحله ومهامه بشكل نهائي. هذه العملية لا يمكن التراجع عنها.
            </p>
          </div>
          <DialogFooter className="flex gap-2 flex-row-reverse">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? "جاري الحذف..." : "تأكيد الحذف"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog ملاحظات المشروع ─── */}
      <Dialog open={!!notesTarget} onOpenChange={(open) => !open && setNotesTarget(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              ملاحظات المشروع
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {notesTarget?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="أضف ملاحظاتك هنا... (مثال: العميل يريد تعديل الواجهة، موعد التسليم 15/7)"
              className="min-h-[120px] text-sm resize-none"
              dir="rtl"
            />
            <p className="text-[10px] text-muted-foreground mt-2">
              الملاحظات تظهر مختصرة على كرت المشروع وتُحفظ في قاعدة البيانات.
            </p>
          </div>
          <DialogFooter className="flex gap-2 flex-row-reverse">
            <Button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="flex-1"
              style={{ backgroundColor: "oklch(0.55 0.15 60)" }}
            >
              {savingNotes ? "جاري الحفظ..." : "حفظ الملاحظات"}
            </Button>
            {notesText && (
              <Button
                variant="outline"
                onClick={() => setNotesText("")}
                className="shrink-0"
                title="مسح الملاحظات"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setNotesTarget(null)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewProjectDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        onAdd={(data) => {
          createProject.mutate(data as Parameters<typeof createProject.mutate>[0], {
            onSuccess: () => {
              toast.success(`تم إنشاء المشروع: ${data.name}`, {
                description: `${data.type} · ${data.serviceType} · ${data.area}`,
              });
              setShowNewProject(false);
            },
          });
        }}
      />
    </div>
  );
}
