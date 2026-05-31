/**
 * WorkPlans - صفحة خطط العمل المركزية
 * تصميم مطابق لـ Projects.tsx: كروت + فلاتر + محرر inline
 */
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Save, Trash2, ChevronDown, ChevronUp, ChevronLeft,
  Briefcase, Home, Factory, TrendingUp, Store,
  Layers, ClipboardList, X, Edit3, ArrowLeft,
  CheckCircle2, Circle, User, Clock, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── أنواع البيانات ──────────────────────────────────────────────────────────
interface WorkPlanTask {
  id?: number;
  name: string;
  assignee: string;
  estimatedDays: number;
  order: number;
}

interface WorkPlanPhase {
  id?: number;
  title: string;
  subtitle: string;
  order: number;
  tasks: WorkPlanTask[];
}

interface WorkPlan {
  id: number;
  name: string;
  projectType: string;
  serviceType: string;
  description?: string;
  phaseCount?: number;
  taskCount?: number;
  phases: WorkPlanPhase[];
}

// ─── التصنيفات الرئيسية ─────────────────────────────────────────────────────
const MAIN_CATS = [
  { key: "all",       label: "الكل",      icon: Briefcase,  color: "oklch(0.30 0.05 250)" },
  { key: "سكن خاص",  label: "سكن خاص",  icon: Home,       color: "oklch(0.50 0.15 250)" },
  { key: "صناعي",    label: "صناعي",    icon: Factory,    color: "oklch(0.50 0.15 30)"  },
  { key: "استثماري", label: "استثماري", icon: TrendingUp, color: "oklch(0.50 0.15 150)" },
  { key: "تجاري",    label: "تجاري",    icon: Store,      color: "oklch(0.50 0.15 60)"  },
];

const PROJECT_TYPES = [
  { key: "سكن خاص",  label: "سكن خاص"  },
  { key: "صناعي",    label: "صناعي"    },
  { key: "استثماري", label: "استثماري" },
  { key: "تجاري",    label: "تجاري"    },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useWorkPlans() {
  return useQuery<WorkPlan[]>({
    queryKey: ["work-plans"],
    queryFn: async () => {
      const res = await fetch("/api/work-plans");
      if (!res.ok) throw new Error("فشل جلب خطط العمل");
      return res.json();
    },
  });
}

function useWorkPlan(id: number | null) {
  return useQuery<WorkPlan>({
    queryKey: ["work-plan", id],
    queryFn: async () => {
      const res = await fetch(`/api/work-plans/${id}`);
      if (!res.ok) throw new Error("فشل جلب الخطة");
      return res.json();
    },
    enabled: id !== null,
  });
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function WorkPlans() {
  const { data: allPlans = [], isLoading } = useWorkPlans();
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState("all");
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96 text-muted-foreground">
        جاري التحميل...
      </div>
    );
  }

  // إذا كان المستخدم يعدّل خطة → عرض المحرر
  if (editingPlanId !== null) {
    return (
      <PlanEditor
        planId={editingPlanId}
        onClose={() => setEditingPlanId(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["work-plans"] });
          setEditingPlanId(null);
        }}
      />
    );
  }

  // تصفية حسب التصنيف الرئيسي
  const filtered = mainTab === "all"
    ? allPlans
    : allPlans.filter(p => p.projectType === mainTab);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("هل تريد حذف هذه الخطة؟")) return;
    try {
      await fetch(`/api/work-plans/${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["work-plans"] });
      toast.success("تم حذف الخطة");
    } catch {
      toast.error("فشل الحذف");
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">إدارة خطط العمل القياسية لكل نوع مشروع</p>
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              <strong style={{ fontFamily: "'Space Grotesk'" }}>{allPlans.length}</strong> خطة إجمالي
            </span>
            <span>·</span>
            <span>
              <strong style={{ fontFamily: "'Space Grotesk'" }}>
                {allPlans.reduce((s, p) => s + (p.phaseCount || p.phases?.length || 0), 0)}
              </strong> مرحلة
            </span>
            <span>·</span>
            <span>
              <strong style={{ fontFamily: "'Space Grotesk'" }}>
                {allPlans.reduce((s, p) => s + (p.taskCount || (p.phases || []).reduce((ss, ph) => ss + (ph.tasks?.length || 0), 0)), 0)}
              </strong> مهمة
            </span>
          </div>
        </div>
        <Button onClick={() => setShowNewPlan(true)} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          خطة جديدة
        </Button>
      </div>

      {/* ─── التصنيفات الرئيسية ─── */}
      <div className="flex gap-2 flex-wrap">
        {MAIN_CATS.map(cat => {
          const count = cat.key === "all"
            ? allPlans.length
            : allPlans.filter(p => p.projectType === cat.key).length;
          const Icon = cat.icon;
          const isActive = mainTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setMainTab(cat.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={{
                backgroundColor: isActive ? `color-mix(in oklch, ${cat.color} 15%, white)` : "transparent",
                borderColor: isActive ? cat.color : "oklch(0.85 0.00 0)",
                color: isActive ? cat.color : "oklch(0.50 0.00 0)",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  backgroundColor: isActive ? `color-mix(in oklch, ${cat.color} 20%, white)` : "oklch(0.93 0.00 0)",
                  color: isActive ? cat.color : "oklch(0.50 0.00 0)",
                  fontFamily: "'Space Grotesk'",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Grid الخطط ─── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا توجد خطط عمل</p>
          <p className="text-xs mt-1">اضغط "خطة جديدة" لإضافة خطة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(plan => {
            const catInfo = MAIN_CATS.find(c => c.key === plan.projectType) || MAIN_CATS[0];
            const CatIcon = catInfo.icon;
            const phasesCount = plan.phaseCount ?? plan.phases?.length ?? 0;
            const tasksCount = plan.taskCount ?? (plan.phases || []).reduce((s, ph) => s + (ph.tasks?.length || 0), 0);
            const totalDays = (plan.phases || []).reduce(
              (s, ph) => s + (ph.tasks || []).reduce((ss, t) => ss + (t.estimatedDays || 0), 0),
              0
            );

            return (
              <div
                key={plan.id}
                onClick={() => setEditingPlanId(plan.id)}
                className="p-4 rounded-xl border bg-background hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">
                      {plan.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{plan.serviceType}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 items-center">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in oklch, ${catInfo.color} 12%, white)` }}
                    >
                      <CatIcon className="w-3.5 h-3.5" style={{ color: catInfo.color }} />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{plan.projectType}</Badge>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                    style={{ backgroundColor: `color-mix(in oklch, ${catInfo.color} 8%, white)` }}
                  >
                    <Layers className="w-3 h-3" style={{ color: catInfo.color }} />
                    <span style={{ color: catInfo.color, fontFamily: "'Space Grotesk'" }}>{phasesCount}</span>
                    <span className="text-muted-foreground">مرحلة</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-muted/50">
                    <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                    <span style={{ fontFamily: "'Space Grotesk'" }}>{tasksCount}</span>
                    <span className="text-muted-foreground">مهمة</span>
                  </div>
                  {totalDays > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span style={{ fontFamily: "'Space Grotesk'" }}>{totalDays}</span>
                      <span>يوم</span>
                    </div>
                  )}
                </div>

                {/* Phase Bars */}
                {phasesCount > 0 && (
                  <div className="mb-3">
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(phasesCount, 10) }).map((_, pi) => (
                        <div
                          key={pi}
                          className="flex-1 h-1.5 rounded-full"
                          style={{ backgroundColor: `color-mix(in oklch, ${catInfo.color} ${25 + pi * 8}%, white)` }}
                        />
                      ))}
                    </div>
                    {plan.phases && plan.phases.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {plan.phases.map(ph => ph.title).join(" · ")}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <button
                    onClick={e => handleDelete(plan.id, e)}
                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف
                  </button>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                    <Edit3 className="w-3 h-3" />
                    تعديل
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog إنشاء خطة جديدة */}
      {showNewPlan && (
        <NewPlanDialog
          onClose={() => setShowNewPlan(false)}
          onSaved={(id) => {
            qc.invalidateQueries({ queryKey: ["work-plans"] });
            setShowNewPlan(false);
            setEditingPlanId(id);
          }}
        />
      )}
    </div>
  );
}

// ─── محرر الخطة الكامل ───────────────────────────────────────────────────────
function PlanEditor({ planId, onClose, onSaved }: {
  planId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: planData, isLoading } = useWorkPlan(planId);
  const [phases, setPhases] = useState<WorkPlanPhase[]>([]);
  const [planName, setPlanName] = useState("");
  const [projectType, setProjectType] = useState("سكن خاص");
  const [serviceType, setServiceType] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (planData) {
      setPlanName(planData.name);
      setProjectType(planData.projectType);
      setServiceType(planData.serviceType || "");
      setPhases(planData.phases || []);
      // فتح أول مرحلة تلقائياً
      setExpandedPhases(new Set([0]));
    }
  }, [planData?.id]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const togglePhase = (idx: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const addPhase = () => {
    const newIdx = phases.length;
    setPhases(prev => [
      ...prev,
      { title: "مرحلة جديدة", subtitle: "", order: prev.length, tasks: [] },
    ]);
    setExpandedPhases(prev => new Set([...prev, newIdx]));
    markChanged();
  };

  const removePhase = (idx: number) => {
    setPhases(prev => prev.filter((_, i) => i !== idx));
    markChanged();
  };

  const updatePhase = (idx: number, field: keyof WorkPlanPhase, value: string) => {
    setPhases(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    markChanged();
  };

  const addTask = (phaseIdx: number) => {
    setPhases(prev => prev.map((p, i) =>
      i === phaseIdx
        ? { ...p, tasks: [...p.tasks, { name: "مهمة جديدة", assignee: "", estimatedDays: 1, order: p.tasks.length }] }
        : p
    ));
    setExpandedPhases(prev => new Set([...prev, phaseIdx]));
    markChanged();
  };

  const removeTask = (phaseIdx: number, taskIdx: number) => {
    setPhases(prev => prev.map((p, i) =>
      i === phaseIdx
        ? { ...p, tasks: p.tasks.filter((_, ti) => ti !== taskIdx) }
        : p
    ));
    markChanged();
  };

  const updateTask = (phaseIdx: number, taskIdx: number, field: keyof WorkPlanTask, value: string | number) => {
    setPhases(prev => prev.map((p, i) =>
      i === phaseIdx
        ? { ...p, tasks: p.tasks.map((t, ti) => ti === taskIdx ? { ...t, [field]: value } : t) }
        : p
    ));
    markChanged();
  };

  const handleSave = async () => {
    if (!planName.trim()) return toast.error("أدخل اسم الخطة");
    setSaving(true);
    try {
      const res = await fetch(`/api/work-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          projectType,
          serviceType,
          phases: phases.map((ph, pi) => ({
            ...ph,
            order: pi,
            tasks: ph.tasks.map((t, ti) => ({ ...t, order: ti })),
          })),
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("تم حفظ الخطة بنجاح");
      setHasChanges(false);
      onSaved();
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const catInfo = MAIN_CATS.find(c => c.key === projectType) || MAIN_CATS[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96 text-muted-foreground">
        جاري تحميل الخطة...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للخطط
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{planName || "خطة بدون اسم"}</span>
        <div className="mr-auto flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              تغييرات غير محفوظة
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            size="sm"
            style={{ backgroundColor: hasChanges ? "oklch(0.30 0.05 250)" : undefined }}
          >
            <Save className="w-3.5 h-3.5 ml-1.5" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </div>

      {/* ─── بيانات الخطة ─── */}
      <div className="p-4 rounded-xl border bg-background">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">بيانات الخطة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">اسم الخطة *</label>
            <Input
              value={planName}
              onChange={e => { setPlanName(e.target.value); markChanged(); }}
              placeholder="مثال: خطة سكن خاص - بناء جديد"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">نوع المشروع</label>
            <Select value={projectType} onValueChange={v => { setProjectType(v); markChanged(); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map(t => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">نوع الخدمة</label>
            <Input
              value={serviceType}
              onChange={e => { setServiceType(e.target.value); markChanged(); }}
              placeholder="بناء جديد"
            />
          </div>
        </div>
      </div>

      {/* ─── إحصائيات ─── */}
      <div className="flex gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: `color-mix(in oklch, ${catInfo.color} 10%, white)` }}
        >
          <Layers className="w-4 h-4" style={{ color: catInfo.color }} />
          <span style={{ color: catInfo.color, fontFamily: "'Space Grotesk'", fontWeight: 700 }}>{phases.length}</span>
          <span className="text-muted-foreground text-xs">مرحلة</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-muted/50">
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700 }}>
            {phases.reduce((s, p) => s + p.tasks.length, 0)}
          </span>
          <span className="text-muted-foreground text-xs">مهمة</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-muted/50">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700 }}>
            {phases.reduce((s, p) => s + p.tasks.reduce((ss, t) => ss + (t.estimatedDays || 0), 0), 0)}
          </span>
          <span className="text-muted-foreground text-xs">يوم تقديري</span>
        </div>
      </div>

      {/* ─── المراحل ─── */}
      <div className="space-y-3">
        {phases.map((phase, pi) => {
          const isExpanded = expandedPhases.has(pi);
          const phaseColor = catInfo.color;
          return (
            <div key={pi} className="border rounded-xl overflow-hidden">
              {/* Phase Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer select-none"
                style={{ backgroundColor: `color-mix(in oklch, ${phaseColor} 6%, white)` }}
                onClick={() => togglePhase(pi)}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: phaseColor, color: "white", fontFamily: "'Space Grotesk'" }}
                >
                  {pi + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {isExpanded ? (
                    <Input
                      value={phase.title}
                      onChange={e => updatePhase(pi, "title", e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="h-7 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="عنوان المرحلة"
                    />
                  ) : (
                    <span className="text-sm font-semibold truncate block">{phase.title || "مرحلة بدون عنوان"}</span>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>
                      {phase.tasks.length} مهمة
                    </span>
                    {phase.subtitle && !isExpanded && (
                      <span className="text-[10px] text-muted-foreground truncate">· {phase.subtitle}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); removePhase(pi); }}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {/* Phase Body */}
              {isExpanded && (
                <div className="p-3 space-y-3 bg-background">
                  {/* Subtitle */}
                  <Input
                    value={phase.subtitle}
                    onChange={e => updatePhase(pi, "subtitle", e.target.value)}
                    className="h-7 text-xs text-muted-foreground"
                    placeholder="وصف المرحلة (اختياري)"
                  />

                  {/* Tasks */}
                  <div className="space-y-2">
                    {phase.tasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">لا توجد مهام — اضغط "إضافة مهمة"</p>
                    )}
                    {phase.tasks.map((task, ti) => (
                      <div key={ti} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 group/task">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <Circle className="w-3.5 h-3.5 shrink-0" style={{ color: phaseColor, opacity: 0.5 }} />
                        <Input
                          value={task.name}
                          onChange={e => updateTask(pi, ti, "name", e.target.value)}
                          className="h-7 text-xs flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="اسم المهمة"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <Input
                            value={task.assignee}
                            onChange={e => updateTask(pi, ti, "assignee", e.target.value)}
                            className="h-6 text-[10px] w-20 border-muted"
                            placeholder="المسؤول"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <Input
                            type="number"
                            value={task.estimatedDays}
                            onChange={e => updateTask(pi, ti, "estimatedDays", Number(e.target.value))}
                            className="h-6 text-[10px] w-12 border-muted text-center"
                            min={1}
                            style={{ fontFamily: "'Space Grotesk'" }}
                          />
                          <span className="text-[10px] text-muted-foreground">يوم</span>
                        </div>
                        <button
                          onClick={() => removeTask(pi, ti)}
                          className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover/task:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Task */}
                  <button
                    onClick={() => addTask(pi)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-primary border border-dashed rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مهمة
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Phase */}
        <button
          onClick={addPhase}
          className="w-full border-2 border-dashed border-border rounded-xl p-4 text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة مرحلة جديدة
        </button>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground rounded-full px-6 py-2.5 shadow-lg flex items-center gap-3">
          <span className="text-sm font-medium">توجد تغييرات غير محفوظة</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSave}
            disabled={saving}
            className="h-7 rounded-full"
          >
            {saving ? "جاري الحفظ..." : "حفظ الآن"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Dialog إنشاء خطة جديدة ──────────────────────────────────────────────────
function NewPlanDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (id: number) => void }) {
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("سكن خاص");
  const [serviceType, setServiceType] = useState("بناء جديد");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("أدخل اسم الخطة");
    setSaving(true);
    try {
      const res = await fetch("/api/work-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, projectType, serviceType, phases: [] }),
      });
      const data = await res.json();
      onSaved(data.id);
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>خطة عمل جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">اسم الخطة *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: خطة سكن خاص - بناء جديد"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">نوع المشروع</label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">نوع الخدمة</label>
              <Input
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                placeholder="بناء جديد"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "جاري الإنشاء..." : "إنشاء الخطة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
