import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, ChevronDown, ChevronRight, Trash2, Edit2, ClipboardList,
  Building2, Factory, TrendingUp, Store, CheckSquare, X, Save
} from "lucide-react";

const PROJECT_TYPES = [
  { key: "سكن خاص", label: "سكن خاص", icon: Building2, color: "oklch(0.50 0.15 250)" },
  { key: "صناعي", label: "صناعي", icon: Factory, color: "oklch(0.50 0.15 30)" },
  { key: "استثماري", label: "استثماري", icon: TrendingUp, color: "oklch(0.50 0.15 150)" },
  { key: "تجاري", label: "تجاري", icon: Store, color: "oklch(0.50 0.15 60)" },
];

interface WorkPlanTask {
  id?: number;
  name: string;
  assignee: string;
  estimatedDays: number;
  description?: string;
}

interface WorkPlanPhase {
  id?: number;
  title: string;
  subtitle: string;
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

const ASSIGNEES = ["سكرتير", "مهندس معماري", "مهندس إنشائي", "مهندس صحي", "مهندس كهربائي", "رسام", "مهندس إشراف", "مدير المشروع"];

export default function WorkPlans() {
  const qc = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [showEditPlanDialog, setShowEditPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkPlan | null>(null);
  const [filterType, setFilterType] = useState("all");

  // Fetch all plans
  const { data: plans = [], isLoading } = useQuery<WorkPlan[]>({
    queryKey: ["work-plans"],
    queryFn: () => fetch("/api/work-plans").then(r => r.json()),
  });

  // Fetch selected plan detail
  const { data: planDetail } = useQuery<WorkPlan>({
    queryKey: ["work-plan", selectedPlanId],
    queryFn: () => fetch(`/api/work-plans/${selectedPlanId}`).then(r => r.json()),
    enabled: !!selectedPlanId,
  });

  const deletePlan = useMutation({
    mutationFn: (id: number) => fetch(`/api/work-plans/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-plans"] });
      if (selectedPlanId) setSelectedPlanId(null);
      toast.success("تم حذف الخطة");
    },
  });

  const filteredPlans = filterType === "all" ? plans : plans.filter(p => p.projectType === filterType);

  const typeInfo = (type: string) => PROJECT_TYPES.find(t => t.key === type) || PROJECT_TYPES[0];

  const togglePhase = (idx: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">خطط العمل المركزية</h1>
              <p className="text-xs text-muted-foreground">{plans.length} خطة محفوظة</p>
            </div>
          </div>
          <Button onClick={() => setShowNewPlanDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            خطة جديدة
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            الكل ({plans.length})
          </button>
          {PROJECT_TYPES.map(t => {
            const count = plans.filter(p => p.projectType === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setFilterType(t.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
        {/* Plans List */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-l bg-card overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">جاري التحميل...</div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد خطط عمل</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewPlanDialog(true)}>
                إنشاء خطة جديدة
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPlans.map(plan => {
                const ti = typeInfo(plan.projectType);
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-r-2 border-primary" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ borderColor: ti.color, color: ti.color }}>
                            {plan.projectType}
                          </Badge>
                          {plan.isDefault === 1 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">افتراضية</Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">{plan.name}</p>
                        {plan.serviceType && (
                          <p className="text-xs text-muted-foreground mt-0.5">{plan.serviceType}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{plan.phaseCount} مرحلة</span>
                          <span>{plan.taskCount} مهمة</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingPlan(plan); setShowEditPlanDialog(true); }}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); if (confirm("حذف هذه الخطة؟")) deletePlan.mutate(plan.id); }}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Plan Detail */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedPlanId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ClipboardList className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">اختر خطة عمل من القائمة لعرض تفاصيلها</p>
            </div>
          ) : !planDetail ? (
            <div className="text-center text-muted-foreground p-8">جاري التحميل...</div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold">{planDetail.name}</h2>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline">{planDetail.projectType}</Badge>
                    {planDetail.serviceType && <Badge variant="secondary">{planDetail.serviceType}</Badge>}
                  </div>
                  {planDetail.description && (
                    <p className="text-sm text-muted-foreground mt-2">{planDetail.description}</p>
                  )}
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded">{planDetail.phases?.length} مرحلة</span>
                  <span className="bg-muted px-2 py-1 rounded">
                    {planDetail.phases?.reduce((s, p) => s + (p.tasks?.length || 0), 0)} مهمة
                  </span>
                </div>
              </div>

              {/* Phases */}
              <div className="space-y-3">
                {planDetail.phases?.map((phase, idx) => (
                  <div key={phase.id || idx} className="border rounded-xl overflow-hidden">
                    <button
                      onClick={() => togglePhase(idx)}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-right"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{phase.title}</p>
                          {phase.subtitle && <p className="text-xs text-muted-foreground">{phase.subtitle}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{phase.tasks?.length} مهمة</span>
                        {expandedPhases.has(idx) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>

                    {expandedPhases.has(idx) && (
                      <div className="divide-y">
                        {phase.tasks?.map((task, ti) => (
                          <div key={task.id || ti} className="flex items-center gap-3 px-4 py-2.5">
                            <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{task.name}</p>
                              <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                                {task.assignee && <span>👤 {task.assignee}</span>}
                                {task.estimatedDays ? <span>⏱ {task.estimatedDays} يوم</span> : null}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!phase.tasks || phase.tasks.length === 0) && (
                          <div className="px-4 py-3 text-xs text-muted-foreground text-center">لا توجد مهام في هذه المرحلة</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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

      {/* Edit Plan Dialog */}
      {showEditPlanDialog && editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          onClose={() => { setShowEditPlanDialog(false); setEditingPlan(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["work-plans"] });
            qc.invalidateQueries({ queryKey: ["work-plan", editingPlan.id] });
            setShowEditPlanDialog(false);
            setEditingPlan(null);
            toast.success("تم تحديث الخطة");
          }}
        />
      )}
    </div>
  );
}

// ── New Plan Dialog ──────────────────────────────────────────────────────────
function NewPlanDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (id: number) => void }) {
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("سكن خاص");
  const [serviceType, setServiceType] = useState("بناء جديد");
  const [description, setDescription] = useState("");
  const [phases, setPhases] = useState<WorkPlanPhase[]>([
    { title: "تجهيز الملف", subtitle: "جمع الوثائق والملفات", tasks: [] }
  ]);
  const [saving, setSaving] = useState(false);

  const addPhase = () => setPhases(prev => [...prev, { title: "", subtitle: "", tasks: [] }]);
  const removePhase = (i: number) => setPhases(prev => prev.filter((_, idx) => idx !== i));
  const updatePhase = (i: number, field: string, val: string) =>
    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const addTask = (pi: number) =>
    setPhases(prev => prev.map((p, idx) => idx === pi ? { ...p, tasks: [...p.tasks, { name: "", assignee: "سكرتير", estimatedDays: 1 }] } : p));
  const removeTask = (pi: number, ti: number) =>
    setPhases(prev => prev.map((p, idx) => idx === pi ? { ...p, tasks: p.tasks.filter((_, ti2) => ti2 !== ti) } : p));
  const updateTask = (pi: number, ti: number, field: string, val: any) =>
    setPhases(prev => prev.map((p, idx) => idx === pi ? {
      ...p, tasks: p.tasks.map((t, ti2) => ti2 === ti ? { ...t, [field]: val } : t)
    } : p));

  const handleSave = async () => {
    if (!name.trim()) return toast.error("أدخل اسم الخطة");
    setSaving(true);
    try {
      const res = await fetch("/api/work-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, projectType, serviceType, description, phases }),
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء خطة عمل جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">اسم الخطة *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: خطة سكن خاص - بناء جديد" />
            </div>
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
              <Input value={serviceType} onChange={e => setServiceType(e.target.value)} placeholder="بناء جديد، تعديل، إشراف..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">وصف</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف مختصر للخطة" />
            </div>
          </div>

          {/* Phases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">المراحل والمهام</label>
              <Button variant="outline" size="sm" onClick={addPhase} className="gap-1 text-xs">
                <Plus className="w-3 h-3" /> مرحلة
              </Button>
            </div>
            <div className="space-y-3">
              {phases.map((phase, pi) => (
                <div key={pi} className="border rounded-lg p-3">
                  <div className="flex gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-1">
                      {pi + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input value={phase.title} onChange={e => updatePhase(pi, "title", e.target.value)} placeholder="اسم المرحلة" className="text-sm" />
                      <Input value={phase.subtitle} onChange={e => updatePhase(pi, "subtitle", e.target.value)} placeholder="وصف المرحلة" className="text-sm" />
                    </div>
                    <button onClick={() => removePhase(pi)} className="p-1 text-muted-foreground hover:text-red-500 shrink-0 mt-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tasks */}
                  <div className="mr-8 space-y-1.5">
                    {phase.tasks.map((task, ti) => (
                      <div key={ti} className="flex gap-2 items-center">
                        <Input value={task.name} onChange={e => updateTask(pi, ti, "name", e.target.value)} placeholder="اسم المهمة" className="text-xs h-8 flex-1" />
                        <Select value={task.assignee} onValueChange={v => updateTask(pi, ti, "assignee", v)}>
                          <SelectTrigger className="text-xs h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ASSIGNEES.map(a => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" value={task.estimatedDays} onChange={e => updateTask(pi, ti, "estimatedDays", parseInt(e.target.value) || 0)}
                          className="text-xs h-8 w-16" placeholder="أيام" />
                        <button onClick={() => removeTask(pi, ti)} className="text-muted-foreground hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addTask(pi)} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <Plus className="w-3 h-3" /> إضافة مهمة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ الخطة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Plan Dialog (basic info only) ──────────────────────────────────────
function EditPlanDialog({ plan, onClose, onSaved }: { plan: WorkPlan; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(plan.name);
  const [projectType, setProjectType] = useState(plan.projectType);
  const [serviceType, setServiceType] = useState(plan.serviceType || "");
  const [description, setDescription] = useState(plan.description || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/work-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, projectType, serviceType, description }),
      });
      onSaved();
    } catch {
      toast.error("فشل التحديث");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الخطة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">اسم الخطة</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
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
            <Input value={serviceType} onChange={e => setServiceType(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">وصف</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
