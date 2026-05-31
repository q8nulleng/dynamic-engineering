import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit2, ClipboardList, Building2, Factory, TrendingUp, Store,
  CheckSquare, X, Save, GripVertical, ChevronDown, ChevronRight, Pencil, Check
} from "lucide-react";

const PROJECT_TYPES = [
  { key: "سكن خاص", label: "سكن خاص", icon: Building2, color: "oklch(0.50 0.15 250)" },
  { key: "صناعي", label: "صناعي", icon: Factory, color: "oklch(0.50 0.15 30)" },
  { key: "استثماري", label: "استثماري", icon: TrendingUp, color: "oklch(0.50 0.15 150)" },
  { key: "تجاري", label: "تجاري", icon: Store, color: "oklch(0.50 0.15 60)" },
];

const ASSIGNEES = [
  "سكرتير (ثروت)", "المعماري الرئيسي (م. مصطفى)", "المهندس الإنشائي (م. أمين)",
  "رسام الواجهات (عفيف)", "الرسام (عرفان)", "م. الإشراف (خالد)",
  "المعمارية المساعدة (م. ناهد)", "محاسب (محمد)", "مدير المكتب"
];

interface WorkPlanTask {
  id?: number;
  name: string;
  assignee: string;
  estimatedDays: number;
  description?: string;
  order?: number;
}

interface WorkPlanPhase {
  id?: number;
  title: string;
  subtitle: string;
  order?: number;
  tasks: WorkPlanTask[];
}

interface WorkPlan {
  id: number;
  name: string;
  projectType: string;
  serviceType?: string;
  description?: string;
  isDefault?: number;
  phaseCount?: number;
  taskCount?: number;
  phases?: WorkPlanPhase[];
}

export default function WorkPlans() {
  const qc = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [editingPlanMeta, setEditingPlanMeta] = useState(false);
  const [planNameEdit, setPlanNameEdit] = useState("");
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Fetch all plans
  const { data: plans = [], isLoading } = useQuery<WorkPlan[]>({
    queryKey: ["work-plans"],
    queryFn: () => fetch("/api/work-plans").then(r => r.json()),
  });

  // Fetch selected plan detail
  const { data: planDetail, refetch: refetchPlan } = useQuery<WorkPlan>({
    queryKey: ["work-plan", selectedPlanId],
    queryFn: () => fetch(`/api/work-plans/${selectedPlanId}`).then(r => r.json()),
    enabled: !!selectedPlanId,
  });

  // Auto-select first plan
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans]);

  const deletePlan = useMutation({
    mutationFn: (id: number) => fetch(`/api/work-plans/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-plans"] });
      setSelectedPlanId(null);
      toast.success("تم حذف الخطة");
    },
  });

  const savePlanMeta = async () => {
    if (!planDetail) return;
    setIsSavingPlan(true);
    try {
      await fetch(`/api/work-plans/${planDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: planNameEdit, projectType: planDetail.projectType, serviceType: planDetail.serviceType }),
      });
      qc.invalidateQueries({ queryKey: ["work-plans"] });
      qc.invalidateQueries({ queryKey: ["work-plan", planDetail.id] });
      setEditingPlanMeta(false);
      toast.success("تم تحديث اسم الخطة");
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">خطط العمل</h1>
              <p className="text-xs text-muted-foreground">{plans.length} خطة محفوظة</p>
            </div>
          </div>
          <Button onClick={() => setShowNewPlanDialog(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> خطة جديدة
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-72px)]">
        {/* Plans sidebar */}
        <div className="w-72 border-l bg-card overflow-y-auto shrink-0">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">جاري التحميل...</div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد خطط</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewPlanDialog(true)}>إنشاء خطة</Button>
            </div>
          ) : (
            <div className="divide-y">
              {plans.map(plan => {
                const ti = PROJECT_TYPES.find(t => t.key === plan.projectType) || PROJECT_TYPES[0];
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-r-2 border-primary" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs px-1.5 py-0 mb-1" style={{ borderColor: ti.color, color: ti.color }}>
                          {plan.projectType} · {plan.serviceType}
                        </Badge>
                        <p className="font-medium text-sm leading-tight">{plan.name}</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{plan.phaseCount} مرحلة</span>
                          <span>·</span>
                          <span>{plan.taskCount} مهمة</span>
                        </div>
                      </div>
                      {!plan.isDefault && (
                        <button
                          onClick={e => { e.stopPropagation(); if (confirm("حذف هذه الخطة؟")) deletePlan.mutate(plan.id); }}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Plan Kanban Editor */}
        <div className="flex-1 overflow-y-auto">
          {!selectedPlanId || !planDetail ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ClipboardList className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">اختر خطة عمل من القائمة</p>
            </div>
          ) : (
            <PlanKanbanEditor
              plan={planDetail}
              onRefresh={() => {
                qc.invalidateQueries({ queryKey: ["work-plans"] });
                refetchPlan();
              }}
            />
          )}
        </div>
      </div>

      {/* New Plan Dialog */}
      {showNewPlanDialog && (
        <NewPlanDialog
          onClose={() => setShowNewPlanDialog(false)}
          onSaved={(id) => {
            qc.invalidateQueries({ queryKey: ["work-plans"] });
            setSelectedPlanId(id);
            setShowNewPlanDialog(false);
            toast.success("تم إنشاء الخطة بنجاح");
          }}
        />
      )}
    </div>
  );
}

// ── Kanban Editor Component ──────────────────────────────────────────────────
function PlanKanbanEditor({ plan, onRefresh }: { plan: WorkPlan; onRefresh: () => void }) {
  const [phases, setPhases] = useState<WorkPlanPhase[]>(plan.phases || []);
  const [editingPlanName, setEditingPlanName] = useState(false);
  const [planName, setPlanName] = useState(plan.name);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set(Array.from({ length: 10 }, (_, i) => i)));

  // Reset when plan changes
  useEffect(() => {
    setPhases(plan.phases || []);
    setPlanName(plan.name);
    setHasChanges(false);
    setExpandedPhases(new Set(Array.from({ length: (plan.phases?.length || 0) + 5 }, (_, i) => i)));
  }, [plan.id, plan.phases]);

  const markChanged = () => setHasChanges(true);

  const addPhase = () => {
    setPhases(prev => [...prev, { title: "مرحلة جديدة", subtitle: "", tasks: [], order: prev.length }]);
    markChanged();
  };

  const removePhase = (i: number) => {
    setPhases(prev => prev.filter((_, idx) => idx !== i));
    markChanged();
  };

  const updatePhase = (i: number, field: keyof WorkPlanPhase, val: string) => {
    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
    markChanged();
  };

  const addTask = (pi: number) => {
    setPhases(prev => prev.map((p, idx) => idx === pi ? {
      ...p, tasks: [...p.tasks, { name: "", assignee: ASSIGNEES[0], estimatedDays: 1, order: p.tasks.length }]
    } : p));
    markChanged();
    // Auto-expand
    setExpandedPhases(prev => new Set([...prev, pi]));
  };

  const removeTask = (pi: number, ti: number) => {
    setPhases(prev => prev.map((p, idx) => idx === pi ? { ...p, tasks: p.tasks.filter((_, ti2) => ti2 !== ti) } : p));
    markChanged();
  };

  const updateTask = (pi: number, ti: number, field: keyof WorkPlanTask, val: any) => {
    setPhases(prev => prev.map((p, idx) => idx === pi ? {
      ...p, tasks: p.tasks.map((t, ti2) => ti2 === ti ? { ...t, [field]: val } : t)
    } : p));
    markChanged();
  };

  const togglePhase = (i: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save plan meta + phases + tasks in one PUT
      await fetch(`/api/work-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          projectType: plan.projectType,
          serviceType: plan.serviceType,
          description: plan.description,
          phases: phases.map((ph, i) => ({ ...ph, order: i, tasks: ph.tasks.map((t, j) => ({ ...t, order: j })) })),
        }),
      });
      setHasChanges(false);
      onRefresh();
      toast.success("تم حفظ التغييرات");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const totalTasks = phases.reduce((s, p) => s + p.tasks.length, 0);

  return (
    <div className="p-4">
      {/* Plan Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          {editingPlanName ? (
            <div className="flex items-center gap-2">
              <Input
                value={planName}
                onChange={e => { setPlanName(e.target.value); markChanged(); }}
                className="text-lg font-bold h-9 max-w-xs"
                autoFocus
                onKeyDown={e => e.key === "Enter" && setEditingPlanName(false)}
              />
              <button onClick={() => setEditingPlanName(false)} className="text-primary">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{planName}</h2>
              <button onClick={() => setEditingPlanName(true)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{plan.projectType}</Badge>
            {plan.serviceType && <Badge variant="secondary" className="text-xs">{plan.serviceType}</Badge>}
            <span className="text-xs text-muted-foreground">{phases.length} مرحلة · {totalTasks} مهمة</span>
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              <Save className="w-4 h-4" />
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addPhase} className="gap-1.5">
            <Plus className="w-4 h-4" /> مرحلة جديدة
          </Button>
        </div>
      </div>

      {/* Phases Kanban */}
      <div className="space-y-3">
        {phases.map((phase, pi) => (
          <div key={pi} className="border rounded-xl overflow-hidden bg-card">
            {/* Phase Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30">
              <button onClick={() => togglePhase(pi)} className="text-muted-foreground hover:text-foreground">
                {expandedPhases.has(pi) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {pi + 1}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <Input
                  value={phase.title}
                  onChange={e => updatePhase(pi, "title", e.target.value)}
                  className="h-7 text-sm font-medium bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary px-0 rounded-none w-40"
                  placeholder="اسم المرحلة"
                />
                <Input
                  value={phase.subtitle}
                  onChange={e => updatePhase(pi, "subtitle", e.target.value)}
                  className="h-7 text-xs text-muted-foreground bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary px-0 rounded-none flex-1"
                  placeholder="وصف المرحلة"
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{phase.tasks.length} مهمة</span>
              <button onClick={() => addTask(pi)} className="text-primary hover:text-primary/80 shrink-0" title="إضافة مهمة">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => removePhase(pi)} className="text-muted-foreground hover:text-red-500 shrink-0" title="حذف المرحلة">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tasks */}
            {expandedPhases.has(pi) && (
              <div className="divide-y">
                {phase.tasks.length === 0 ? (
                  <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                    لا توجد مهام —{" "}
                    <button onClick={() => addTask(pi)} className="text-primary hover:underline">إضافة مهمة</button>
                  </div>
                ) : (
                  phase.tasks.map((task, ti) => (
                    <div key={ti} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/20 group">
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      <CheckSquare className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      {/* Task name */}
                      <Input
                        value={task.name}
                        onChange={e => updateTask(pi, ti, "name", e.target.value)}
                        className="h-7 text-sm bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary px-0 rounded-none flex-1 min-w-0"
                        placeholder="اسم المهمة"
                      />
                      {/* Assignee */}
                      <Select value={task.assignee} onValueChange={v => updateTask(pi, ti, "assignee", v)}>
                        <SelectTrigger className="h-7 text-xs w-44 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNEES.map(a => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {/* Days */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          value={task.estimatedDays}
                          onChange={e => updateTask(pi, ti, "estimatedDays", parseInt(e.target.value) || 1)}
                          className="h-7 text-xs w-14 text-center"
                          min={1}
                        />
                        <span className="text-xs text-muted-foreground">يوم</span>
                      </div>
                      {/* Delete */}
                      <button
                        onClick={() => removeTask(pi, ti)}
                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
                {/* Add task row */}
                <div className="px-3 py-2">
                  <button
                    onClick={() => addTask(pi)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مهمة
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Phase Button */}
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

// ── New Plan Dialog ──────────────────────────────────────────────────────────
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
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: خطة سكن خاص - بناء جديد" autoFocus />
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
              <Input value={serviceType} onChange={e => setServiceType(e.target.value)} placeholder="بناء جديد" />
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
