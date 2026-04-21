/*
 * Tasks - المهام مع قائمة المهام وعرض Kanban
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, LayoutGrid, Clock, User, FolderKanban } from "lucide-react";

const tasks = [
  { task: "استلام المستندات من العميل", project: "فيلا - السالمية", assignee: "محمد ثروت", due: "اليوم", priority: "عاجل", status: "قيد التنفيذ", done: false },
  { task: "إعداد المخطط المعماري الأولي", project: "فيلا - السالمية", assignee: "م. مصطفى", due: "غداً", priority: "عالي", status: "قيد التنفيذ", done: false },
  { task: "مراجعة الحسابات الإنشائية", project: "مبنى تجاري - حولي", assignee: "م. خالد", due: "بعد 3 أيام", priority: "متوسط", status: "معلق", done: false },
  { task: "رسم الواجهات ثلاثية الأبعاد", project: "مجمع - الفحيحيل", assignee: "عرفان", due: "بعد 5 أيام", priority: "متوسط", status: "لم يبدأ", done: false },
  { task: "تقديم المعاملة للبلدية", project: "فيلا - صباح الأحمد", assignee: "محمد ثروت", due: "الأسبوع القادم", priority: "عادي", status: "لم يبدأ", done: false },
  { task: "تعبئة نموذج البلدية", project: "مصنع - الشويخ", assignee: "محمد ثروت", due: "بعد يومين", priority: "عالي", status: "قيد التنفيذ", done: false },
  { task: "مراجعة التصميم المعماري النهائي", project: "فيلا - الجهراء", assignee: "م. مصطفى", due: "أمس", priority: "عاجل", status: "متأخر", done: false },
  { task: "إعداد تقرير الإشراف الأسبوعي", project: "فيلا - صباح الأحمد", assignee: "م. خالد", due: "اليوم", priority: "عالي", status: "قيد التنفيذ", done: false },
];

const priorityConfig: Record<string, { color: string; bg: string }> = {
  "عاجل": { color: "text-red-700", bg: "bg-red-50" },
  "عالي": { color: "text-orange-700", bg: "bg-orange-50" },
  "متوسط": { color: "text-blue-700", bg: "bg-blue-50" },
  "عادي": { color: "text-gray-600", bg: "bg-gray-50" },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  "قيد التنفيذ": { color: "text-blue-700", bg: "bg-blue-50" },
  "معلق": { color: "text-amber-700", bg: "bg-amber-50" },
  "لم يبدأ": { color: "text-gray-600", bg: "bg-gray-100" },
  "متأخر": { color: "text-red-700", bg: "bg-red-50" },
  "مكتمل": { color: "text-green-700", bg: "bg-green-50" },
};

export default function Tasks() {
  const [view, setView] = useState<"list" | "kanban">("list");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}
            style={view === "list" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            <ListChecks className="w-4 h-4 ml-1" />
            قائمة
          </Button>
          <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}
            style={view === "kanban" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            <LayoutGrid className="w-4 h-4 ml-1" />
            كانبان
          </Button>
        </div>
        <div className="flex gap-2">
          <Select>
            <SelectTrigger className="w-36"><SelectValue placeholder="المسؤول" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mustafa">م. مصطفى</SelectItem>
              <SelectItem value="khaled">م. خالد</SelectItem>
              <SelectItem value="irfan">عرفان</SelectItem>
              <SelectItem value="therwat">محمد ثروت</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-32"><SelectValue placeholder="الأولوية" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">عاجل</SelectItem>
              <SelectItem value="high">عالي</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="normal">عادي</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === "list" ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="py-3 px-4 w-8"></th>
                    <th className="text-right py-3 px-4 font-medium">المهمة</th>
                    <th className="text-right py-3 px-4 font-medium">المشروع</th>
                    <th className="text-right py-3 px-4 font-medium">المسؤول</th>
                    <th className="text-right py-3 px-4 font-medium">الموعد</th>
                    <th className="text-right py-3 px-4 font-medium">الأولوية</th>
                    <th className="text-right py-3 px-4 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t, i) => {
                    const pr = priorityConfig[t.priority];
                    const st = statusConfig[t.status];
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer">
                        <td className="py-3 px-4"><Checkbox /></td>
                        <td className="py-3 px-4 font-medium">{t.task}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            {t.project}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-xs">
                            <User className="w-3 h-3" />
                            {t.assignee}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            {t.due}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${pr.bg} ${pr.color}`}>{t.priority}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{t.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.keys(statusConfig).map((status) => {
            const st = statusConfig[status];
            const filtered = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="min-w-[280px] w-[280px] shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color} font-medium`}>{status}</span>
                  <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
                </div>
                <div className="space-y-3">
                  {filtered.map((t, i) => {
                    const pr = priorityConfig[t.priority];
                    return (
                      <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium mb-2">{t.task}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <FolderKanban className="w-3 h-3" />{t.project}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-xs"><User className="w-3 h-3" />{t.assignee}</div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pr.bg} ${pr.color}`}>{t.priority}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
