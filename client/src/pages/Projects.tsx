/**
 * Projects - صفحة كروت المشاريع الرئيسية
 * تبويبات رئيسية: الكل | سكن خاص | صناعي | استثماري | تجاري
 * تبويبات فرعية: بناء جديد | تعديل | إضافة | تعديل وإضافة | هدم | إشراف
 */
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Users, MapPin, Link2, ChevronLeft, Briefcase,
  Home, Factory, TrendingUp, Store,
  Building2, Wrench, PlusSquare, Layers, Trash2, Eye,
  StickyNote, X, MessageSquare, UserPlus, Search, Phone,
  AlertTriangle, CheckCircle2, Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import NewProjectDialog from "@/components/NewProjectDialog";
import { toast } from "sonner";
import {
  useProjects, useCreateProject, useCreateClient,
  useCrmLeads, useUpdateCrmLead, type CrmLead
} from "@/lib/api";
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

/* ─── مراحل CRM المسموح بها للبدء بدون عقد ─── */
const CRM_ELIGIBLE_STAGES = [
  "استفسار جديد",
  "تم التواصل",
  "جدولة موعد",
  "تم الاجتماع",
  "عرض سعر مُرسل",
  "بانتظار التعاقد",
  "جارٍ العمل - بدون عقد",
];

export default function Projects() {
  const { data: allProjectsData = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const createClient = useCreateClient();
  const updateLead = useUpdateCrmLead();
  const { data: crmLeadsData = [] } = useCrmLeads();
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

  // Dialog اختيار عميل من CRM
  const [showCrmDialog, setShowCrmDialog] = useState(false);
  const [crmSearch, setCrmSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [creatingFromCrm, setCreatingFromCrm] = useState(false);

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

  /* إنشاء مشروع من عميل CRM */
  const handleCreateFromCrm = async () => {
    if (!selectedLead) return;
    setCreatingFromCrm(true);
    try {
      const now = new Date().toISOString().slice(0, 10);
      const clientId = `C${Date.now().toString(36).toUpperCase()}`;

      // إنشاء عميل جديد من بيانات الـ lead
      const client = await createClient.mutateAsync({
        id: clientId,
        name: selectedLead.name,
        phone: selectedLead.phone || "",
        type: "individual" as const,
        governorate: selectedLead.governorate || "",
        area: selectedLead.area || "",
        block: "",
        plot: selectedLead.plotNumber || "",
        parcelArea: selectedLead.landArea || 0,
        status: "active" as const,
        rating: 3,
        createdAt: now,
        projectType: selectedLead.type || "",
        serviceType: selectedLead.serviceType || "",
        leadId: selectedLead.id,
        totalContractsValue: 0,
        totalPaid: 0,
        totalRemaining: 0,
        notes: (selectedLead.notes || "") + (selectedLead.notes ? " | " : "") + "تم بدء العمل قبل إتمام التعاقد",
        civilId: selectedLead.civilId || "",
        email: "",
        ownershipDoc: "",
        ownershipDate: "",
        spouseName: "",
        spouseCivilId: "",
        phone2: "",
        parcelShape: "",
        parcelFacing: "",
      });

      // توليد معرّف المشروع
      const maxSeq = allProjects.reduce((max, p) => {
        const n = parseInt(p.id.replace(/^S/, ""), 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const projectId = `S${String(maxSeq + 1).padStart(5, "0")}`;

      // المراحل الافتراضية
      const defaultPhases = [
        { title: "تجهيز الملف", tasks: [
          { name: "تصميم الكروكي",       status: "pending", order: 0 },
          { name: "تجميع المستندات",     status: "pending", order: 1 },
          { name: "العقد والدفعة الأولى", status: "pending", order: 2 },
          { name: "نماذج البلدية",       status: "pending", order: 3 },
        ]},
        { title: "التصميم", tasks: [
          { name: "التصميم المعماري",  status: "pending", order: 0 },
          { name: "تصميم الواجهات",   status: "pending", order: 1 },
          { name: "مخطط البلدية",     status: "pending", order: 2 },
        ]},
        { title: "البلدية والاعتماد", tasks: [
          { name: "تقديم بلدية",               status: "pending", order: 0 },
          { name: "الحصول على موافقة البلدية", status: "pending", order: 1 },
          { name: "دفع رسوم البلدية",          status: "pending", order: 2 },
        ]},
        { title: "الكراسة والمخططات", tasks: [
          { name: "التصميم الإنشائي", status: "pending", order: 0 },
          { name: "التصميم الصحي",   status: "pending", order: 1 },
          { name: "التصميم الكهربائي", status: "pending", order: 2 },
        ]},
        { title: "الإشراف", tasks: [
          { name: "إصدار خطاب إشراف", status: "pending", order: 0 },
          { name: "الإشراف الميداني", status: "pending", order: 1 },
          { name: "شهادة الإنجاز",   status: "pending", order: 2 },
        ]},
      ];

      await createProject.mutateAsync({
        id: projectId,
        name: `${selectedLead.type || "مشروع"} - ${selectedLead.name}`,
        clientId: client.id,
        client: selectedLead.name,
        type: selectedLead.type || "سكن خاص",
        serviceType: selectedLead.serviceType || "بناء جديد",
        area: selectedLead.area || "",
        contractId: "",
        leadId: selectedLead.id,
        status: "جارٍ العمل - بدون عقد",
        phases: defaultPhases as unknown[],
      });

      // تشغيل المهام التلقائية
      await fetch(`/api/projects/${projectId}/auto-tasks`, { method: "POST" }).catch(() => null);

      // تحديث مرحلة الـ lead في CRM إذا لم تكن مُحدّثة
      if (selectedLead.stage !== "جارٍ العمل - بدون عقد") {
        await updateLead.mutateAsync({ id: selectedLead.id, stage: "جارٍ العمل - بدون عقد" });
      }

      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });

      toast.success(`⚡ تم إنشاء مشروع "${selectedLead.name}" بدون عقد`, {
        description: "المشروع مؤقت — يمكن ربطه بعقد لاحقاً من صفحة المشروع",
      });

      setShowCrmDialog(false);
      setSelectedLead(null);
      setCrmSearch("");
      navigate(`/projects/${projectId}`);
    } catch (err) {
      toast.error("حدث خطأ أثناء إنشاء المشروع — تحقق من البيانات");
      console.error(err);
    } finally {
      setCreatingFromCrm(false);
    }
  };

  /* تصفية عملاء CRM */
  const filteredLeads = crmLeadsData.filter(lead => {
    const q = crmSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      lead.name.toLowerCase().includes(q) ||
      (lead.phone || "").includes(q) ||
      (lead.area || "").toLowerCase().includes(q) ||
      (lead.type || "").toLowerCase().includes(q)
    );
  });

  /* تمييز العملاء الذين لديهم مشروع بالفعل */
  const existingLeadIds = new Set(allProjects.map(p => p.leadId).filter(Boolean));

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
        <div className="flex gap-2">
          {/* زر إنشاء مشروع من CRM */}
          <Button
            variant="outline"
            onClick={() => { setShowCrmDialog(true); setCrmSearch(""); setSelectedLead(null); }}
            className="border-dashed gap-1.5"
            style={{ borderColor: "oklch(0.55 0.15 200)", color: "oklch(0.45 0.15 200)" }}
          >
            <UserPlus className="w-4 h-4" />
            من CRM
          </Button>
          {/* زر مشروع جديد */}
          <Button onClick={() => setShowNewProject(true)} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
            <Plus className="w-4 h-4 ml-2" />
            مشروع جديد
          </Button>
        </div>
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
          <p className="text-xs mt-1">اضغط "مشروع جديد" أو "من CRM" لإضافة مشروع</p>
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
            const isWithoutContract = project.status === "جارٍ العمل - بدون عقد";

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
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: hasNotes ? "oklch(0.95 0.05 60)" : "hsl(var(--muted))",
                      color: hasNotes ? "oklch(0.55 0.15 60)" : "hsl(var(--muted-foreground))",
                    }}
                    title="ملاحظات المشروع"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                  </button>
                  {/* زر الحذف */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget({ id: project.id, name: project.name });
                    }}
                    className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all"
                    title="حذف المشروع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Link href={`/projects/${project.id}`}>
                  <div
                    className="rounded-2xl border p-4 hover:shadow-md transition-all cursor-pointer space-y-3"
                    style={{
                      borderColor: isWithoutContract
                        ? "oklch(0.80 0.12 50)"
                        : `color-mix(in oklch, ${catInfo.color} 20%, transparent)`,
                      backgroundColor: isWithoutContract
                        ? "oklch(0.99 0.02 50)"
                        : `color-mix(in oklch, ${catInfo.color} 3%, white)`,
                    }}
                  >
                    {/* ─── شارة "بدون عقد" ─── */}
                    {isWithoutContract && (
                      <div
                        className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg w-fit"
                        style={{ backgroundColor: "oklch(0.95 0.10 50)", color: "oklch(0.55 0.18 50)" }}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        بدون عقد — يحتاج إتمام التعاقد
                      </div>
                    )}

                    {/* ─── اسم المشروع + حالة ─── */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `color-mix(in oklch, ${catInfo.color} 15%, white)` }}
                        >
                          <CatIcon className="w-4 h-4" style={{ color: catInfo.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate">{project.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{project.client}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${statusInfo.color} 12%, white)`,
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* ─── التصنيف والخدمة ─── */}
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 font-medium"
                        style={{ borderColor: `color-mix(in oklch, ${catInfo.color} 30%, transparent)`, color: catInfo.color }}
                      >
                        {project.type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                        {project.serviceType}
                      </Badge>
                      {currentPhaseName && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5"
                          style={{ backgroundColor: `color-mix(in oklch, ${stage.color} 8%, white)`, borderColor: `color-mix(in oklch, ${stage.color} 25%, transparent)`, color: stage.color }}
                        >
                          {currentPhaseName}
                        </Badge>
                      )}
                    </div>

                    {/* ─── شريط التقدم ─── */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span style={{ color: stage.color }} className="font-medium">{stage.text}</span>
                        <span style={{ fontFamily: "'Space Grotesk'" }}>{project.progress}%</span>
                      </div>
                      <Progress
                        value={project.progress}
                        className="h-1.5 rounded-full"
                        style={{ "--progress-color": stage.color } as React.CSSProperties}
                      />
                    </div>

                    {/* ─── المهام والمنطقة ─── */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t" style={{ borderColor: `color-mix(in oklch, ${catInfo.color} 10%, transparent)` }}>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {doneTasks}/{totalTasks} مهمة
                      </span>
                      {project.area && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {project.area}
                        </span>
                      )}
                      <span
                        className="flex items-center gap-1 font-mono"
                        style={{ color: catInfo.color }}
                      >
                        <Link2 className="w-3 h-3" />
                        {project.id}
                      </span>
                    </div>

                    {/* ─── ملاحظة المشروع ─── */}
                    {hasNotes && (
                      <div
                        className="text-[10px] px-2.5 py-1.5 rounded-lg border-r-2 leading-relaxed"
                        style={{
                          backgroundColor: "oklch(0.98 0.03 60)",
                          borderRightColor: "oklch(0.72 0.10 60)",
                          color: "oklch(0.40 0.05 60)",
                        }}
                      >
                        <span className="font-medium text-amber-600">ملاحظة: </span>
                        {((project as any).notes as string).length > 80
                          ? (project as any).notes.slice(0, 80) + "..."
                          : (project as any).notes}
                        {(project as any).notesUpdatedAt && (
                          <span className="block text-[9px] text-muted-foreground mt-0.5">
                            {new Date((project as any).notesUpdatedAt).toLocaleDateString("ar-KW", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}
                            {new Date((project as any).notesUpdatedAt).toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
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
            <DialogDescription>هل أنت متأكد من حذف هذا المشروع؟</DialogDescription>
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

      {/* ─── Dialog اختيار عميل من CRM ─── */}
      <Dialog open={showCrmDialog} onOpenChange={(open) => { if (!open) { setShowCrmDialog(false); setSelectedLead(null); setCrmSearch(""); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" style={{ color: "oklch(0.55 0.15 200)" }} />
              إنشاء مشروع من CRM
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              اختر عميلاً من قائمة CRM لبدء العمل معه مباشرةً بدون عقد
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* ─── شريط البحث ─── */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الهاتف أو المنطقة..."
                value={crmSearch}
                onChange={e => setCrmSearch(e.target.value)}
                className="pr-9 text-sm"
                dir="rtl"
                autoFocus
              />
            </div>

            {/* ─── قائمة العملاء ─── */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pl-1">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  لا يوجد عملاء مطابقون للبحث
                </div>
              ) : (
                filteredLeads.map(lead => {
                  const hasProject = existingLeadIds.has(lead.id);
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <button
                      key={lead.id}
                      onClick={() => !hasProject && setSelectedLead(isSelected ? null : lead)}
                      disabled={hasProject}
                      className="w-full text-right rounded-xl border p-3 transition-all"
                      style={{
                        backgroundColor: isSelected
                          ? "oklch(0.95 0.06 200)"
                          : hasProject
                            ? "oklch(0.97 0.00 0)"
                            : "transparent",
                        borderColor: isSelected
                          ? "oklch(0.65 0.15 200)"
                          : hasProject
                            ? "hsl(var(--border))"
                            : "hsl(var(--border))",
                        opacity: hasProject ? 0.5 : 1,
                        cursor: hasProject ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* أيقونة الاختيار */}
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{
                              borderColor: isSelected ? "oklch(0.55 0.15 200)" : "hsl(var(--border))",
                              backgroundColor: isSelected ? "oklch(0.55 0.15 200)" : "transparent",
                            }}
                          >
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{lead.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              {lead.phone && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead.area && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {lead.area}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {lead.type && (
                            <span
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: "oklch(0.93 0.05 250)", color: "oklch(0.45 0.15 250)" }}
                            >
                              {lead.type}
                            </span>
                          )}
                          {hasProject ? (
                            <span className="text-[9px] text-muted-foreground">لديه مشروع</span>
                          ) : (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: lead.stage === "جارٍ العمل - بدون عقد"
                                  ? "oklch(0.95 0.08 50)"
                                  : "oklch(0.95 0.05 140)",
                                color: lead.stage === "جارٍ العمل - بدون عقد"
                                  ? "oklch(0.55 0.18 50)"
                                  : "oklch(0.45 0.15 140)",
                              }}
                            >
                              {lead.stage}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* ─── معلومات العميل المختار ─── */}
            {selectedLead && (
              <div
                className="rounded-xl p-3 space-y-1.5 border"
                style={{ backgroundColor: "oklch(0.96 0.05 200)", borderColor: "oklch(0.75 0.12 200)" }}
              >
                <p className="text-xs font-semibold" style={{ color: "oklch(0.40 0.15 200)" }}>
                  سيتم إنشاء:
                </p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>• <strong>مشروع:</strong> {selectedLead.type || "مشروع"} - {selectedLead.name}</p>
                  <p>• <strong>النوع:</strong> {selectedLead.type || "سكن خاص"} · {selectedLead.serviceType || "بناء جديد"}</p>
                  {selectedLead.area && <p>• <strong>المنطقة:</strong> {selectedLead.area}</p>}
                  <p>• <strong>الحالة:</strong> <span style={{ color: "oklch(0.55 0.18 50)" }}>جارٍ العمل - بدون عقد</span></p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 flex-row-reverse pt-2 border-t">
            <Button
              onClick={handleCreateFromCrm}
              disabled={!selectedLead || creatingFromCrm}
              className="flex-1 gap-1.5"
              style={{ backgroundColor: selectedLead ? "oklch(0.45 0.15 200)" : undefined }}
            >
              {creatingFromCrm ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  إنشاء المشروع
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowCrmDialog(false); setSelectedLead(null); setCrmSearch(""); }}
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
