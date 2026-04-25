/*
 * Projects - صفحة كروت المشاريع الرئيسية
 * تبويبات تصنيف: الكل | سكن خاص | صناعي | استثماري | تجاري
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, MapPin, Link2, ChevronLeft, Briefcase, Home, Factory, TrendingUp, Store } from "lucide-react";
import { Link } from "wouter";
import { projectsDB } from "./ProjectDetail";

const stageLabel = (progress: number) => {
  if (progress >= 90) return { text: "شبه مكتمل", color: "oklch(0.55 0.15 150)" };
  if (progress >= 60) return { text: "متقدم", color: "oklch(0.60 0.15 280)" };
  if (progress >= 30) return { text: "قيد التنفيذ", color: "oklch(0.55 0.15 250)" };
  return { text: "بداية", color: "oklch(0.72 0.10 60)" };
};

/* ─── تعريف التصنيفات ─── */
const CATEGORIES = [
  { key: "all",         label: "الكل",       icon: Briefcase,  color: "oklch(0.30 0.05 250)" },
  { key: "سكن خاص",    label: "سكن خاص",    icon: Home,       color: "oklch(0.50 0.15 250)" },
  { key: "صناعي",      label: "صناعي",      icon: Factory,    color: "oklch(0.50 0.15 30)"  },
  { key: "استثماري",   label: "استثماري",   icon: TrendingUp, color: "oklch(0.50 0.15 150)" },
  { key: "تجاري",      label: "تجاري",      icon: Store,      color: "oklch(0.50 0.15 60)"  },
];

const allProjects = Object.values(projectsDB);

export default function Projects() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? allProjects
    : allProjects.filter(p => p.type === activeTab);

  const activeCategory = CATEGORIES.find(c => c.key === activeTab)!;

  return (
    <div className="space-y-5">
      {/* Header */}
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

      {/* ─── تبويبات التصنيف ─── */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const count = cat.key === "all"
            ? allProjects.length
            : allProjects.filter(p => p.type === cat.key).length;
          const Icon = cat.icon;
          const isActive = activeTab === cat.key;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
              style={{
                backgroundColor: isActive ? `color-mix(in oklch, ${cat.color} 12%, white)` : "transparent",
                borderColor: isActive ? `color-mix(in oklch, ${cat.color} 40%, transparent)` : "hsl(var(--border))",
                color: isActive ? cat.color : "hsl(var(--muted-foreground))",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? `color-mix(in oklch, ${cat.color} 20%, white)` : "hsl(var(--muted))",
                  color: isActive ? cat.color : "hsl(var(--muted-foreground))",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── عدد النتائج ─── */}
      {activeTab !== "all" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCategory.color }} />
          <span>
            يعرض <strong style={{ color: activeCategory.color }}>{filtered.length}</strong> مشروع في تصنيف "{activeCategory.label}"
          </span>
        </div>
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
            const doneTasks = project.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);
            const currentPhaseName = project.phases[project.currentPhase]?.title || "";

            /* أيقونة التصنيف */
            const catInfo = CATEGORIES.find(c => c.key === project.type) || CATEGORIES[0];
            const CatIcon = catInfo.icon;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="p-4 rounded-xl border bg-background hover:shadow-md transition-all cursor-pointer group">
                  {/* Top Row: Name + Type */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{project.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Link2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{project.quotation}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 items-center">
                      {/* أيقونة التصنيف */}
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
                  <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-md" style={{ backgroundColor: `color-mix(in oklch, ${stage.color} 8%, white)` }}>
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

                  {/* Footer: phases dots */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex gap-1.5">
                      {project.phases.map((_, pi) => {
                        const phaseProgress = (() => {
                          const p = project.phases[pi];
                          const done = p.tasks.filter(t => t.status === "done").length;
                          return p.tasks.length > 0 ? (done / p.tasks.length) * 100 : 0;
                        })();
                        return (
                          <div key={pi} className="w-5 h-1.5 rounded-full overflow-hidden bg-gray-100">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${phaseProgress}%`,
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
