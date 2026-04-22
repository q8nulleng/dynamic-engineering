/*
 * Design: Desert Oasis Professional - Dashboard
 * KPI cards + recent activity + project overview
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  PenTool,
} from "lucide-react";

const kpis = [
  { label: "المشاريع النشطة", value: "7", icon: FolderKanban, change: "+2 هذا الشهر", color: "oklch(0.30 0.05 250)" },
  { label: "عروض الأسعار", value: "6", icon: FileText, change: "3 مرسلة", color: "oklch(0.72 0.10 60)" },
  { label: "العقود النشطة", value: "5", icon: FileSignature, change: "1 بانتظار التوقيع", color: "oklch(0.55 0.15 150)" },
  { label: "الإيرادات (د.ك)", value: "4,950", icon: CreditCard, change: "+22% عن الشهر الماضي", color: "oklch(0.60 0.12 30)" },
];

const recentProjects = [
  { name: "فيلا سكنية - السالمية", client: "أحمد الكويتي", status: "قيد التصميم", progress: 35, type: "سكن خاص" },
  { name: "مبنى تجاري - حولي", client: "شركة الخليج", status: "مراجعة البلدية", progress: 75, type: "تجاري" },
  { name: "مجمع استثماري - الفحيحيل", client: "محمد العلي", status: "التصميم المعماري", progress: 20, type: "استثماري" },
  { name: "مصنع - الشويخ الصناعية", client: "مصانع الكويت", status: "التصميم الإنشائي", progress: 50, type: "صناعي" },
];

const recentActivity = [
  { text: "تم توقيع عقد CON-2026-001 - تهاني خالد", time: "منذ 15 دقيقة", icon: CheckCircle2, color: "text-green-600" },
  { text: "عرض سعر S00048 مرسل - فهد العتيبي", time: "منذ ساعة", icon: FileText, color: "text-blue-600" },
  { text: "فاتورة INV/2026/00004 متأخرة - شركة الخليج", time: "منذ ساعتين", icon: AlertTriangle, color: "text-amber-500" },
  { text: "فرصة جديدة: شركة النور - تجاري", time: "منذ 3 ساعات", icon: Users, color: "text-blue-600" },
  { text: "دفعة مستلمة: 250 د.ك - هدم السالمية", time: "أمس", icon: CreditCard, color: "text-green-600" },
];

const pendingTasks = [
  { task: "مراجعة المخطط المعماري", project: "فيلا السالمية", assignee: "م. مصطفى", due: "اليوم" },
  { task: "حسابات إنشائية", project: "مبنى حولي", assignee: "م. خالد", due: "غداً" },
  { task: "تقديم للبلدية", project: "مجمع الفحيحيل", assignee: "محمد ثروت", due: "بعد 3 أيام" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold" style={{ color: kpi.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {kpi.change}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + "15" }}>
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FolderKanban className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                المشاريع النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">{project.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">{project.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{project.client}</p>
                    </div>
                    <div className="text-left w-32 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{project.status}</span>
                        <span className="text-xs font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {project.progress}%
                        </span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              آخر النشاطات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <activity.icon className={`w-4 h-4 mt-0.5 shrink-0 ${activity.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            المهام المطلوبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">المهمة</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">المشروع</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">المسؤول</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">الموعد</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((task, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="py-3 px-3 font-medium">{task.task}</td>
                    <td className="py-3 px-3 text-muted-foreground">{task.project}</td>
                    <td className="py-3 px-3">{task.assignee}</td>
                    <td className="py-3 px-3">
                      <Badge variant={task.due === "اليوم" ? "destructive" : "outline"} className="text-xs">
                        {task.due}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
