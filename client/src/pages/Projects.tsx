/*
 * Projects - المشاريع مع Kanban board
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, Calendar, MapPin } from "lucide-react";

const stages = [
  {
    title: "المرحلة الأولى",
    subtitle: "تجهيز الملف",
    color: "oklch(0.55 0.15 250)",
    projects: [
      { name: "فيلا - الجهراء", client: "عبدالله السعيد", type: "سكن خاص", progress: 15, tasks: "2/6", area: "الجهراء" },
    ],
  },
  {
    title: "المرحلة الثانية",
    subtitle: "التصميم المعماري",
    color: "oklch(0.72 0.10 60)",
    projects: [
      { name: "فيلا - السالمية", client: "أحمد الكويتي", type: "سكن خاص", progress: 35, tasks: "4/8", area: "حولي" },
      { name: "مجمع - الفحيحيل", client: "محمد العلي", type: "استثماري", progress: 20, tasks: "2/10", area: "الأحمدي" },
    ],
  },
  {
    title: "المرحلة الثالثة",
    subtitle: "التصميم الإنشائي",
    color: "oklch(0.60 0.15 280)",
    projects: [
      { name: "مبنى تجاري - حولي", client: "شركة الخليج", type: "تجاري", progress: 55, tasks: "6/10", area: "حولي" },
    ],
  },
  {
    title: "المرحلة الرابعة",
    subtitle: "الرسم والمراجعة",
    color: "oklch(0.60 0.12 30)",
    projects: [
      { name: "مصنع - الشويخ", client: "مصانع الكويت", type: "صناعي", progress: 70, tasks: "7/10", area: "العاصمة" },
    ],
  },
  {
    title: "المرحلة الخامسة",
    subtitle: "البلدية والتسليم",
    color: "oklch(0.55 0.15 150)",
    projects: [
      { name: "فيلا - صباح الأحمد", client: "خالد الرشيدي", type: "سكن خاص", progress: 90, tasks: "9/10", area: "مبارك الكبير" },
    ],
  },
];

export default function Projects() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">تتبع المشاريع عبر مراحل سير العمل الهندسي</p>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          مشروع جديد
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {stages.map((stage, si) => (
          <div key={si} className="min-w-[280px] w-[280px] shrink-0">
            <div className="mb-3 px-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <h3 className="text-sm font-bold">{stage.title}</h3>
                <Badge variant="secondary" className="text-xs mr-auto">{stage.projects.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground pr-5">{stage.subtitle}</p>
            </div>

            <div className="space-y-3">
              {stage.projects.map((project, pi) => (
                <Card key={pi} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold leading-tight">{project.name}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0">{project.type}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {project.client}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {project.area}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">المهام: {project.tasks}</span>
                          <span className="text-xs font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
