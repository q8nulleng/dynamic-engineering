/*
 * Projects - صفحة كروت المشاريع الرئيسية
 * كل كرت يعرض معلومات المشروع الأساسية، والضغط عليه ينتقل لصفحة المراحل
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, MapPin, Link2, ChevronLeft, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { projectsDB } from "./ProjectDetail";

const stageLabel = (progress: number) => {
  if (progress >= 90) return { text: "شبه مكتمل", color: "oklch(0.55 0.15 150)" };
  if (progress >= 60) return { text: "متقدم", color: "oklch(0.60 0.15 280)" };
  if (progress >= 30) return { text: "قيد التنفيذ", color: "oklch(0.55 0.15 250)" };
  return { text: "بداية", color: "oklch(0.72 0.10 60)" };
};

const projects = Object.values(projectsDB);

export default function Projects() {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.progress < 100).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">تتبع المشاريع عبر مراحل سير العمل الهندسي</p>
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              <strong style={{ fontFamily: "'Space Grotesk'" }}>{totalProjects}</strong> مشروع
            </span>
            <span>·</span>
            <span><strong style={{ fontFamily: "'Space Grotesk'" }}>{activeProjects}</strong> نشط</span>
          </div>
        </div>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          مشروع جديد
        </Button>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => {
          const stage = stageLabel(project.progress);
          const totalTasks = project.phases.reduce((s, p) => s + p.tasks.length, 0);
          const doneTasks = project.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);
          const currentPhaseName = project.phases[project.currentPhase]?.title || "";

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
                  <div className="flex gap-1 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{project.type}</Badge>
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
    </div>
  );
}
