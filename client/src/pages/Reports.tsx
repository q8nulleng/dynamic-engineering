/*
 * Reports - التقارير والإحصائيات
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, TrendingUp, Users, FolderKanban, FileText,
  Download, Calendar, ArrowUp, ArrowDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const monthlyRevenue = [
  { month: "يناير", revenue: 3200 },
  { month: "فبراير", revenue: 4100 },
  { month: "مارس", revenue: 3800 },
  { month: "أبريل", revenue: 5200 },
];

const projectsByType = [
  { name: "سكن خاص", value: 8, color: "#1B4965" },
  { name: "تجاري", value: 3, color: "#C4956A" },
  { name: "استثماري", value: 2, color: "#5B8C5A" },
  { name: "صناعي", value: 1, color: "#D4A574" },
];

const quotationConversion = [
  { month: "يناير", sent: 8, converted: 3 },
  { month: "فبراير", sent: 12, converted: 5 },
  { month: "مارس", sent: 10, converted: 4 },
  { month: "أبريل", sent: 15, converted: 7 },
];

const employeePerformance = [
  { name: "م. مصطفى", role: "معماري", completed: 12, pending: 3, late: 1 },
  { name: "م. خالد", role: "إنشائي", completed: 10, pending: 4, late: 0 },
  { name: "عرفان", role: "رسام", completed: 15, pending: 2, late: 2 },
  { name: "محمد ثروت", role: "سكرتارية", completed: 20, pending: 5, late: 1 },
];

const kpis = [
  { label: "إجمالي الإيرادات", value: "16,300", unit: "د.ك", change: "+22%", up: true, icon: TrendingUp },
  { label: "مشاريع مكتملة", value: "6", unit: "مشروع", change: "+2", up: true, icon: FolderKanban },
  { label: "عملاء جدد", value: "14", unit: "عميل", change: "+35%", up: true, icon: Users },
  { label: "نسبة التحويل", value: "42%", unit: "", change: "+5%", up: true, icon: FileText },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع</SelectItem>
              <SelectItem value="year">هذه السنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 ml-1" />
          تصدير التقرير
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk'" }}>
                {kpi.value} <span className="text-xs font-normal text-muted-foreground">{kpi.unit}</span>
              </p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${kpi.up ? "text-green-600" : "text-red-600"}`}>
                {kpi.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {kpi.change} عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1B4965" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
            <div className="flex items-center gap-6">
              <div style={{ height: 200, width: 200 }}>
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
              <div className="space-y-3">
                {projectsByType.map((type, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <span className="text-sm">{type.name}</span>
                    <span className="text-sm font-bold mr-auto" style={{ fontFamily: "'Space Grotesk'" }}>{type.value}</span>
                  </div>
                ))}
              </div>
            </div>
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
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quotationConversion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sent" stroke="#1B4965" strokeWidth={2} name="مرسل" />
                  <Line type="monotone" dataKey="converted" stroke="#C4956A" strokeWidth={2} name="تحول لعقد" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              أداء الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 font-medium text-xs">الموظف</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">الدور</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">مكتملة</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">معلقة</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">متأخرة</th>
                  </tr>
                </thead>
                <tbody>
                  {employeePerformance.map((emp, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 px-3 font-medium">{emp.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">{emp.role}</td>
                      <td className="py-2.5 px-3">
                        <Badge className="text-xs" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{emp.completed}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary" className="text-xs">{emp.pending}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        {emp.late > 0 ? (
                          <Badge variant="destructive" className="text-xs">{emp.late}</Badge>
                        ) : (
                          <span className="text-xs text-green-600">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
