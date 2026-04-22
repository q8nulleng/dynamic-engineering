/*
 * Design: Desert Oasis Professional
 * Projects - المشاريع مع Kanban board
 * Updated with sub-tasks, supervision stages from Odoo.sh
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, MapPin, ChevronDown, ChevronUp, CheckCircle2, Circle, FileText, Link2 } from "lucide-react";

interface SubTask {
  name: string;
  done: boolean;
}

interface Task {
  name: string;
  priority: "high" | "medium" | "low";
  subTasks?: SubTask[];
}

interface Project {
  id: string;
  name: string;
  client: string;
  type: string;
  progress: number;
  tasks: string;
  area: string;
  quotation: string;
  taskList: Task[];
}

const stages: { title: string; subtitle: string; color: string; projects: Project[] }[] = [
  {
    title: "المرحلة الأولى",
    subtitle: "تجهيز الملف",
    color: "oklch(0.55 0.15 250)",
    projects: [
      {
        id: "S00047", name: "تعديل وإضافة - مشرف", client: "تهاني خالد محمد بورسلي", type: "سكن خاص",
        progress: 15, tasks: "3/20", area: "مشرف - حولي", quotation: "S00047",
        taskList: [
          { name: "جمع الوثائق والمستندات", priority: "high", subTasks: [
            { name: "الموقع العام", done: true }, { name: "المدنية", done: true }, { name: "الوثيقة", done: false }
          ]},
          { name: "كشف على العقار", priority: "high" },
          { name: "كروكي", priority: "medium" },
          { name: "العقد وتحصيل الدفعة الأولى", priority: "high" },
          { name: "دراسة المخطط الإنشائي القديم", priority: "high", subTasks: [
            { name: "مرحلة الحفر", done: false }, { name: "مرحلة القواعد", done: false },
            { name: "مرحلة أعمدة السرداب", done: false }, { name: "مرحلة صب سقف السرداب", done: false },
            { name: "مرحلة أعمدة الدور الأرضي", done: false }, { name: "مرحلة صب سقف الدور الأرضي", done: false },
            { name: "مرحلة أعمدة الدور الأول", done: false }, { name: "مرحلة صب سقف الدور الأول", done: false },
            { name: "مرحلة أعمدة الدور الثاني", done: false }, { name: "مرحلة صب سقف الدور الثاني", done: false },
            { name: "مرحلة أعمدة الدور السطح", done: false }, { name: "مرحلة صب سقف السطح", done: false },
          ]},
        ],
      },
      {
        id: "S00051", name: "فيلا - الجهراء", client: "عبدالله السعيد", type: "سكن خاص",
        progress: 10, tasks: "2/20", area: "الجهراء", quotation: "S00051",
        taskList: [
          { name: "جمع الوثائق والمستندات", priority: "high", subTasks: [
            { name: "الموقع العام", done: true }, { name: "المدنية", done: true }, { name: "الوثيقة", done: false }
          ]},
          { name: "كشف على العقار", priority: "high" },
        ],
      },
    ],
  },
  {
    title: "المرحلة الثانية",
    subtitle: "التصميم المعماري",
    color: "oklch(0.72 0.10 60)",
    projects: [
      {
        id: "S00046", name: "هدم - السالمية", client: "أحمد الكويتي", type: "سكن خاص",
        progress: 35, tasks: "4/8", area: "السالمية - حولي", quotation: "S00046",
        taskList: [
          { name: "سيستم الأعمدة", priority: "high" },
          { name: "رسم البلدية", priority: "high" },
        ],
      },
      {
        id: "S00050", name: "مجمع - الفحيحيل", client: "محمد العلي", type: "استثماري",
        progress: 20, tasks: "2/10", area: "الفحيحيل - الأحمدي", quotation: "S00050",
        taskList: [
          { name: "سيستم الأعمدة", priority: "medium" },
          { name: "رسم البلدية", priority: "high" },
        ],
      },
    ],
  },
  {
    title: "المرحلة الثالثة",
    subtitle: "البلدية والاعتماد",
    color: "oklch(0.60 0.15 280)",
    projects: [
      {
        id: "S00049", name: "مبنى تجاري - حولي", client: "شركة الخليج", type: "تجاري",
        progress: 55, tasks: "6/10", area: "حولي", quotation: "S00049",
        taskList: [
          { name: "إرسال للبلدية", priority: "high" },
          { name: "اعتماد البلدية", priority: "high" },
          { name: "تحصيل الدفعة الأخيرة من العقد", priority: "medium" },
        ],
      },
    ],
  },
  {
    title: "المرحلة الرابعة",
    subtitle: "الكراسة والإشراف",
    color: "oklch(0.60 0.12 30)",
    projects: [
      {
        id: "S00048", name: "فيلا ذهبية - الجهراء", client: "فهد العتيبي", type: "سكن خاص",
        progress: 70, tasks: "7/10", area: "الجهراء", quotation: "S00048",
        taskList: [
          { name: "مخطط إنشائي كامل", priority: "high" },
          { name: "تجهيز الكراسة النهائية", priority: "high" },
          { name: "مراحل الإشراف الإنشائي", priority: "high", subTasks: [
            { name: "مرحلة الحفر", done: true }, { name: "مرحلة القواعد", done: true },
            { name: "مرحلة أعمدة السرداب", done: true }, { name: "مرحلة صب سقف السرداب", done: true },
            { name: "مرحلة أعمدة الدور الأرضي", done: true }, { name: "مرحلة صب سقف الدور الأرضي", done: true },
            { name: "مرحلة أعمدة الدور الأول", done: false }, { name: "مرحلة صب سقف الدور الأول", done: false },
          ]},
        ],
      },
    ],
  },
  {
    title: "المرحلة الخامسة",
    subtitle: "البلدية والتسليم",
    color: "oklch(0.55 0.15 150)",
    projects: [
      {
        id: "S00045", name: "فيلا - صباح الأحمد", client: "خالد الرشيدي", type: "سكن خاص",
        progress: 90, tasks: "9/10", area: "صباح الأحمد - مبارك الكبير", quotation: "S00045",
        taskList: [
          { name: "تسليم المخططات النهائية", priority: "high" },
        ],
      },
    ],
  },
];

export default function Projects() {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">تتبع المشاريع عبر مراحل سير العمل الهندسي - المشاريع تُنشأ تلقائياً من عروض الأسعار</p>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          مشروع جديد
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {stages.map((stage, si) => (
          <div key={si} className="min-w-[320px] w-[320px] shrink-0">
            <div className="mb-3 px-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <h3 className="text-sm font-bold">{stage.title}</h3>
                <Badge variant="secondary" className="text-xs mr-auto">{stage.projects.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground pr-5">{stage.subtitle}</p>
            </div>

            <div className="space-y-3">
              {stage.projects.map((project) => {
                const isExpanded = expandedProject === project.id;
                return (
                  <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setExpandedProject(isExpanded ? null : project.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold leading-tight">{project.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Link2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{project.quotation}</span>
                          </div>
                        </div>
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

                      {/* Expanded Task List */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">المهام</h5>
                          {project.taskList.map((task, ti) => {
                            const taskKey = `${project.id}-${ti}`;
                            const isTaskExpanded = expandedTask === taskKey;
                            const hasSubTasks = task.subTasks && task.subTasks.length > 0;
                            const doneCount = task.subTasks?.filter(st => st.done).length || 0;
                            const totalSub = task.subTasks?.length || 0;

                            return (
                              <div key={ti} className="text-xs">
                                <div className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/30 rounded px-1"
                                  onClick={() => hasSubTasks && setExpandedTask(isTaskExpanded ? null : taskKey)}>
                                  {hasSubTasks ? (
                                    isTaskExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <Circle className="w-3 h-3 text-muted-foreground" />
                                  )}
                                  <span className="flex-1">{task.name}</span>
                                  <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-[9px] px-1 h-4">
                                    {task.priority === "high" ? "عاجل" : "متوسط"}
                                  </Badge>
                                  {hasSubTasks && (
                                    <span className="text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>
                                      {doneCount}/{totalSub}
                                    </span>
                                  )}
                                </div>
                                {/* Sub-tasks */}
                                {isTaskExpanded && task.subTasks && (
                                  <div className="mr-5 mt-1 space-y-0.5 border-r-2 pr-2" style={{ borderColor: "oklch(0.72 0.10 60 / 0.3)" }}>
                                    {task.subTasks.map((st, sti) => (
                                      <div key={sti} className="flex items-center gap-2 py-0.5 text-[11px]">
                                        {st.done ? (
                                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        ) : (
                                          <Circle className="w-3 h-3 text-gray-300" />
                                        )}
                                        <span className={st.done ? "line-through text-muted-foreground" : ""}>{st.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
