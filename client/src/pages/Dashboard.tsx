/*
 * Dashboard — لوحة التحكم ببيانات حقيقية من API
 * البيانات المالية (الإيرادات، الفواتير) تظهر فقط للأدمن والمحاسب
 */
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban, FileText, CreditCard,
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  FileSignature, Lock,
} from "lucide-react";
import {
  useProjects, useQuotations, useContracts,
  useInvoices, useAllTasks, useClients,
} from "@/lib/api";
import { useEmployee, ROLE_PERMISSIONS } from "@/hooks/useEmployee";

export default function Dashboard() {
  const { employee } = useEmployee();
  const { data: projects = [] }   = useProjects();
  const { data: quotations = [] } = useQuotations();
  const { data: contracts = [] }  = useContracts();
  const { data: invoices = [] }   = useInvoices();
  const { data: tasks = [] }      = useAllTasks();
  const { data: clients = [] }    = useClients();

  const today = new Date().toISOString().slice(0, 10);

  // تحديد ما إذا كان الموظف مخوّلاً برؤية البيانات المالية
  // إذا لم يكن هناك employee (أي الأدمن الرئيسي عبر Manus OAuth) → يرى كل شيء
  const canViewFinance = !employee
    ? true
    : ROLE_PERMISSIONS[employee.role]?.canViewFinance === true;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const activeProjects  = projects.filter((p) => p.status !== "مكتمل" && p.status !== "مُقفل");
  const sentQuotations  = quotations.filter((q) => q.status === "مرسل" || q.status === "مسودة");
  const activeContracts = contracts.filter((c) => c.status === "نشط");
  const collectedRevenue = invoices
    .filter((i) => i.status === "مدفوعة")
    .reduce((s, i) => s + i.total, 0);

  const kpis = [
    {
      label: "المشاريع النشطة",
      value: String(activeProjects.length),
      icon: FolderKanban,
      change: `${clients.length} عميل إجمالاً`,
      color: "oklch(0.30 0.05 250)",
      financeOnly: false,
    },
    {
      label: "عروض الأسعار",
      value: String(sentQuotations.length),
      icon: FileText,
      change: `${quotations.filter((q) => q.status === "مرسل").length} مرسلة`,
      color: "oklch(0.72 0.10 60)",
      financeOnly: false,
    },
    {
      label: "العقود النشطة",
      value: String(activeContracts.length),
      icon: FileSignature,
      change: `${contracts.filter((c) => c.status === "مسودة").length} بانتظار التوقيع`,
      color: "oklch(0.55 0.15 150)",
      financeOnly: false,
    },
    {
      label: "الإيرادات المحصّلة (د.ك)",
      value: collectedRevenue > 0 ? collectedRevenue.toLocaleString() : "0",
      icon: CreditCard,
      change: `${invoices.filter((i) => i.status === "متأخرة" || (i.status === "مُرسلة" && i.dueDate && i.dueDate < today)).length} فاتورة متأخرة`,
      color: "oklch(0.60 0.12 30)",
      financeOnly: true,
    },
  ];

  // تصفية الـ KPIs بناءً على الصلاحيات
  const visibleKpis = kpis.filter((kpi) => !kpi.financeOnly || canViewFinance);

  // ── Active Projects (last 5) ───────────────────────────────────────────────
  const displayProjects = activeProjects.slice(0, 5);

  // ── Pending / In-Progress Tasks ────────────────────────────────────────────
  const pendingTasksList = tasks
    .filter((t) => t.status === "in_progress" || t.status === "blocked")
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    })
    .slice(0, 6);

  // ── Recent Invoices as Activity (للمالية فقط) ─────────────────────────────
  const recentInvoices = invoices.slice(0, 3);
  const overdueInvoices = invoices.filter(
    (i) => i.status === "متأخرة" || (i.status === "مُرسلة" && i.dueDate && i.dueDate < today)
  );

  const statusLabel: Record<string, string> = {
    جديد: "جديد",
    "جارٍ": "قيد التنفيذ",
    بلدية: "مراجعة البلدية",
    إشراف: "مرحلة الإشراف",
    معلّق: "معلّق",
    مكتمل: "مكتمل",
    مُقفل: "مُقفل",
  };

  const statusColor: Record<string, string> = {
    جديد: "bg-gray-100 text-gray-600",
    "جارٍ": "bg-blue-100 text-blue-700",
    بلدية: "bg-amber-100 text-amber-700",
    إشراف: "bg-purple-100 text-purple-700",
    معلّق: "bg-orange-100 text-orange-700",
    مكتمل: "bg-green-100 text-green-700",
    مُقفل: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards — يتكيف عدد الأعمدة مع عدد البطاقات المرئية */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${visibleKpis.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
        {visibleKpis.map((kpi, i) => (
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
        <div className={canViewFinance ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FolderKanban className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                المشاريع النشطة
                <Badge variant="secondary" className="text-xs mr-auto">{activeProjects.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">لا توجد مشاريع نشطة</p>
              ) : (
                <div className="space-y-3">
                  {displayProjects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold truncate">{project.name}</p>
                            <Badge variant="outline" className="text-xs shrink-0">{project.type}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{project.client}</span>
                            {project.status && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor[project.status] || "bg-gray-100 text-gray-600"}`}>
                                {statusLabel[project.status] || project.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-left w-28 shrink-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                              {project.progress}%
                            </span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overdue + Recent Invoices — للمالية فقط */}
        {canViewFinance && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                آخر الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueInvoices.length > 0 && (
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {overdueInvoices.length} فاتورة متأخرة تحتاج متابعة
                </div>
              )}
              <div className="space-y-3">
                {recentInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد فواتير</p>
                ) : recentInvoices.map((inv) => {
                  const isOverdue = inv.status === "متأخرة" || (inv.status === "مُرسلة" && inv.dueDate && inv.dueDate < today);
                  return (
                    <div key={inv.id} className="flex gap-3 items-start">
                      {inv.status === "مدفوعة" ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                      ) : isOverdue ? (
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                      ) : (
                        <FileText className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{inv.invoiceNumber || inv.id}</p>
                        <p className="text-xs text-muted-foreground">{inv.client}</p>
                        <p className="text-xs font-bold" style={{ fontFamily: "'Space Grotesk'" }}>
                          {inv.total.toLocaleString()} د.ك
                        </p>
                      </div>
                      <Badge
                        className="text-[10px] shrink-0"
                        variant={inv.status === "مدفوعة" ? "default" : isOverdue ? "destructive" : "secondary"}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Tasks */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            المهام الجارية والمعلّقة
            <Badge variant="secondary" className="text-xs mr-auto">{pendingTasksList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTasksList.length === 0 ? (
            <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              لا توجد مهام معلّقة — عمل رائع!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">المهمة</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">المشروع</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">المسؤول</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">الموعد</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTasksList.map((task) => {
                    const isOverdue = task.deadline && task.deadline < today;
                    const isBlocked = task.status === "blocked";
                    return (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-3 font-medium">
                          <div className="flex items-center gap-1.5">
                            {isBlocked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                            {task.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{task.projectName}</td>
                        <td className="py-3 px-3 text-xs">{task.assignee || "—"}</td>
                        <td className="py-3 px-3">
                          {task.deadline ? (
                            <Badge
                              variant={isOverdue ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {isOverdue ? "متأخرة" : task.deadline}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isBlocked ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {isBlocked ? "بانتظار مراجعة" : "جارية"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
