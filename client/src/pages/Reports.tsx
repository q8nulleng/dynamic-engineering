/*
 * Reports - التقارير والإحصائيات
 * Section 10 of FULL_SYSTEM_METHODOLOGY.md
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, TrendingUp, Users, FolderKanban, FileText,
  Download, AlertTriangle, Clock, CheckCircle2, Receipt
} from "lucide-react";
import { useReportSummary, useReportCharts, useAllTasks, useInvoices, useProjects } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

export default function Reports() {
  const { data: summary }        = useReportSummary();
  const { data: charts }         = useReportCharts();
  const { data: allTasks  = [] } = useAllTasks();
  const { data: invoices  = [] } = useInvoices();
  const { data: projects  = [] } = useProjects();

  /* ─── KPIs إضافية من البيانات الحية ─── */
  const today = new Date().toISOString().slice(0, 10);

  const activeProjects    = projects.filter(p => !["مكتمل", "مُقفل"].includes(p.status || "")).length;
  const pendingInvoices   = invoices.filter(i => ["مُرسلة", "مدفوعة جزئياً"].includes(i.status));
  const overdueInvoices   = invoices.filter(i => i.status === "متأخرة" || (i.status === "مُرسلة" && i.dueDate && i.dueDate < today));
  const overdueTasks      = allTasks.filter(t => t.status !== "done" && t.status !== "cancelled" && t.deadline && t.deadline < today);

  /* ─── أداء الموظفين من المهام الحقيقية ─── */
  const assigneeMap: Record<string, { done: number; active: number; pending: number }> = {};
  for (const t of allTasks) {
    if (!t.assignee) continue;
    assigneeMap[t.assignee] = assigneeMap[t.assignee] || { done: 0, active: 0, pending: 0 };
    if (t.status === "done")          assigneeMap[t.assignee].done++;
    else if (t.status === "in_progress") assigneeMap[t.assignee].active++;
    else                              assigneeMap[t.assignee].pending++;
  }
  const employeePerformance = Object.entries(assigneeMap)
    .sort(([, a], [, b]) => (b.done + b.active) - (a.done + a.active))
    .map(([name, s]) => ({ name, ...s, total: s.done + s.active + s.pending }));

  /* ─── حمل العمل (workload chart) ─── */
  const workloadData = Object.entries(assigneeMap).map(([name, s]) => ({
    name: name.replace("م. ", ""),
    جارية: s.active,
    مكتملة: s.done,
  })).sort((a, b) => b.جارية - a.جارية);

  /* ─── مصادر CRM ─── */
  const monthlyRevenue      = charts?.monthlyRevenue      ?? [];
  const projectsByType      = charts?.projectsByType      ?? [];
  const quotationConversion = charts?.quotationConversion ?? [];

  /* ─── KPI Cards ─── */
  const kpis = [
    {
      label: "إجمالي الإيرادات",
      value: summary ? summary.totalRevenue.toFixed(3) : "—",
      unit: "د.ك",
      icon: TrendingUp,
      color: "oklch(0.55 0.15 150)",
    },
    {
      label: "مشاريع نشطة",
      value: String(activeProjects),
      unit: "مشروع",
      icon: FolderKanban,
      color: "oklch(0.55 0.15 250)",
    },
    {
      label: "فواتير معلقة",
      value: String(pendingInvoices.length),
      unit: `(${pendingInvoices.reduce((s, i) => s + i.total, 0).toFixed(3)} د.ك)`,
      icon: Receipt,
      color: "oklch(0.72 0.10 60)",
    },
    {
      label: "فواتير متأخرة",
      value: String(overdueInvoices.length),
      unit: `(${overdueInvoices.reduce((s, i) => s + i.total, 0).toFixed(3)} د.ك)`,
      icon: AlertTriangle,
      color: "oklch(0.60 0.12 30)",
    },
    {
      label: "مهام متأخرة",
      value: String(overdueTasks.length),
      unit: "مهمة",
      icon: Clock,
      color: "oklch(0.60 0.12 30)",
    },
    {
      label: "نسبة التحويل",
      value: summary ? `${summary.conversionRate}%` : "—",
      unit: "leads → عقود",
      icon: FileText,
      color: "oklch(0.55 0.15 200)",
    },
    {
      label: "مشاريع مكتملة",
      value: summary ? String(summary.completedProjects) : "—",
      unit: "مشروع",
      icon: CheckCircle2,
      color: "oklch(0.55 0.15 150)",
    },
    {
      label: "عملاء جدد (30 يوم)",
      value: summary ? String(summary.newClients) : "—",
      unit: "عميل",
      icon: Users,
      color: "oklch(0.55 0.15 280)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold text-muted-foreground">لوحة المؤشرات والتقارير</h2>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 ml-1" />تصدير التقرير
        </Button>
      </div>

      {/* KPIs — 4 col grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + "18" }}>
                  <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk'", color: kpi.color }}>
                {kpi.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              الإيرادات الشهرية (د.ك)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">لا توجد بيانات مالية بعد</div>
            ) : (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(3)} د.ك`} />
                    <Bar dataKey="revenue" name="الإيرادات" fill="#1B4965" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects by Type */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              المشاريع حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsByType.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">لا توجد مشاريع بعد</div>
            ) : (
              <div className="flex items-center gap-6">
                <div style={{ height: 200, width: 180, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={projectsByType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={false}>
                        {projectsByType.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {projectsByType.map((type, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                      <span className="text-sm flex-1">{type.name}</span>
                      <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{type.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload per engineer */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              حمل العمل لكل موظف
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workloadData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">لا توجد مهام بعد</div>
            ) : (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="جارية" stackId="a" fill="#1B4965" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="مكتملة" stackId="a" fill="#5B8C5A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quotation Conversion */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              تحويل عروض الأسعار
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotationConversion.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">لا توجد بيانات بعد</div>
            ) : (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quotationConversion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="sent" stroke="#1B4965" strokeWidth={2} name="مُرسل" />
                    <Line type="monotone" dataKey="converted" stroke="#C4956A" strokeWidth={2} name="تحوّل لعقد" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              أداء الفريق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 font-medium text-xs">الموظف</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">مكتملة</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">جارية</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">معلقة</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {employeePerformance.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">لا توجد بيانات</td></tr>
                  ) : employeePerformance.map((emp, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 px-3 font-medium text-xs">{emp.name}</td>
                      <td className="py-2.5 px-3">
                        <Badge className="text-xs" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{emp.done}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge className="text-xs bg-blue-50 text-blue-700">{emp.active}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary" className="text-xs">{emp.pending}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{emp.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              الفواتير المتأخرة
              {overdueInvoices.length > 0 && (
                <Badge className="bg-red-50 text-red-700 mr-auto text-xs">{overdueInvoices.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueInvoices.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                <p className="text-sm">لا توجد فواتير متأخرة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueInvoices.slice(0, 8).map((inv, i) => {
                  const daysDue = inv.dueDate ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{inv.client}</p>
                        <p className="text-[10px] text-muted-foreground">{inv.invoiceNumber || inv.id} • {inv.dueDate}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-xs font-bold text-red-700" style={{ fontFamily: "'Space Grotesk'" }}>{inv.total.toFixed(3)} د.ك</p>
                        {daysDue > 0 && <p className="text-[10px] text-red-500">{daysDue} يوم تأخير</p>}
                      </div>
                    </div>
                  );
                })}
                {overdueInvoices.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+ {overdueInvoices.length - 8} فاتورة أخرى</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
