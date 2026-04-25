/*
 * Projects - صفحة كروت المشاريع الرئيسية
 * تبويبات رئيسية: الكل | سكن خاص | صناعي | استثماري | تجاري
 * تبويبات فرعية: بناء جديد | تعديل | إضافة | تعديل وإضافة | هدم | إشراف
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Users, MapPin, Link2, ChevronLeft, Briefcase,
  Home, Factory, TrendingUp, Store,
  Building2, Wrench, PlusSquare, Layers, Trash2, Eye
} from "lucide-react";
import { Link } from "wouter";
import { projectsDB } from "./ProjectDetail";

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

const allProjects = Object.values(projectsDB);

export default function Projects() {
  const [mainTab, setMainTab] = useState("all");
  const [subTab,  setSubTab]  = useState("all");

  /* تصفية حسب التصنيف الرئيسي */
  const byMain = mainTab === "all"
    ? allProjects
    : allProjects.filter(p => p.type === mainTab);

  /* تصفية حسب التصنيف الفرعي */
  const filtered = subTab === "all"
    ? byMain
    : byMain.filter(p => p.serviceType === subTab);

  const activeCat = MAIN_CATS.find(c => c.key === mainTab)!;

  /* عداد كل تصنيف فرعي ضمن التصنيف الرئيسي المحدد */
  const subCount = (key: string) =>
    key === "all" ? byMain.length : byMain.filter(p => p.serviceType === key).length;

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
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
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
            const totalTasks = project.phases.reduce((s, p) => s + p.tasks.length, 0);
            const doneTasks  = project.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);
            const currentPhaseName = project.phases[project.currentPhase]?.title || "";
            const catInfo = MAIN_CATS.find(c => c.key === project.type) || MAIN_CATS[0];
            const CatIcon = catInfo.icon;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="p-4 rounded-xl border bg-background hover:shadow-md transition-all cursor-pointer group">
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{project.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Link2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{project.quotation}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 items-center">
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
                      {project.phases.map((_, pi) => {
                        const p = project.phases[pi];
                        const done = p.tasks.filter(t => t.status === "done").length;
                        const pp = p.tasks.length > 0 ? (done / p.tasks.length) * 100 : 0;
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
