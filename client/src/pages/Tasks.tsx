/*
 * Tasks - المهام مع قائمة المهام وعرض Kanban
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, LayoutGrid, Clock, User, FolderKanban, Lock } from "lucide-react";
import { useAllTasks, useUpdateTaskStatus } from "@/lib/api";
import { toast } from "sonner";

/* ─── تحويل حالة DB إلى عرض عربي ─── */
const statusMap: Record<string, string> = {
  done:           "مكتملة",
  in_progress:    "جارية",
  blocked:        "بانتظار مراجعة",
  waiting_client: "بانتظار العميل",
  pending:        "لم تبدأ",
  cancelled:      "ملغاة",
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  "جارية":             { color: "text-blue-700",   bg: "bg-blue-50"   },
  "بانتظار مراجعة":   { color: "text-amber-700",  bg: "bg-amber-50"  },
  "بانتظار العميل":   { color: "text-orange-700", bg: "bg-orange-50" },
  "لم تبدأ":          { color: "text-gray-600",   bg: "bg-gray-100"  },
  "مكتملة":           { color: "text-green-700",  bg: "bg-green-50"  },
  "ملغاة":            { color: "text-red-700",    bg: "bg-red-50"    },
};

const priorityMap: Record<number, { label: string; color: string; bg: string }> = {
  3: { label: "عاجل",  color: "text-red-700",    bg: "bg-red-50"    },
  2: { label: "عالي",  color: "text-orange-700", bg: "bg-orange-50" },
  1: { label: "متوسط", color: "text-blue-700",   bg: "bg-blue-50"   },
  0: { label: "عادي",  color: "text-gray-600",   bg: "bg-gray-50"   },
};

export default function Tasks() {
  const { data: rawTasks = [], isLoading } = useAllTasks();
  const updateStatus = useUpdateTaskStatus();
  const [view, setView]                     = useState<"list" | "kanban">("list");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("all");

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  /* خريطة id → status لفحص التبعيات */
  const taskStatusById = new Map(rawTasks.map((t) => [t.id, t.status]));

  const isLocked = (t: typeof rawTasks[0]) => {
    if (!t.dependsOn || t.dependsOn === 0) return false;
    const depStatus = taskStatusById.get(t.dependsOn);
    return depStatus !== "done";
  };

  /* تحويل الحالة لعربي */
  const tasks = rawTasks.map((t) => ({
    ...t,
    statusAr:     statusMap[t.status] ?? "لم تبدأ",
    priorityInfo: priorityMap[t.priority] ?? priorityMap[0],
    locked:       isLocked(t),
  }));

  /* قائمة المسؤولين الفريدة */
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))];

  /* تصفية */
  const filtered = tasks.filter((t) => {
    if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
    if (filterStatus !== "all" && t.statusAr !== filterStatus) return false;
    return true;
  });

  const handleToggle = (t: typeof tasks[0]) => {
    if (t.locked) {
      toast.error("هذه المهمة محجوبة — يجب إكمال المهمة السابقة أولاً");
      return;
    }
    const newStatus = t.status === "done" ? "in_progress" : "done";
    updateStatus.mutate(
      { id: t.id, status: newStatus },
      {
        onSuccess: () => toast.success(newStatus === "done" ? `تم إكمال: ${t.name}` : `أُعيد فتح: ${t.name}`),
        onError: () => toast.error("حدث خطأ أثناء تحديث الحالة"),
      }
    );
  };

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
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-36"><SelectValue placeholder="المسؤول" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {assignees.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {Object.keys(statusConfig).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* إحصاء سريع */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(statusConfig).map(([label, cfg]) => {
          const count = tasks.filter((t) => t.statusAr === label).length;
          return count > 0 ? (
            <button
              key={label}
              onClick={() => setFilterStatus(filterStatus === label ? "all" : label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filterStatus === label ? `${cfg.bg} border-current ${cfg.color}` : "border-border text-muted-foreground"
              }`}
            >
              {label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{count}</span>
            </button>
          ) : null;
        })}
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
                    <th className="text-right py-3 px-4 font-medium">المرحلة</th>
                    <th className="text-right py-3 px-4 font-medium">المسؤول</th>
                    <th className="text-right py-3 px-4 font-medium">الموعد</th>
                    <th className="text-right py-3 px-4 font-medium">الأولوية</th>
                    <th className="text-right py-3 px-4 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">لا توجد مهام</td></tr>
                  ) : filtered.map((t) => {
                    const st = statusConfig[t.statusAr] ?? statusConfig["لم تبدأ"];
                    const pr = t.priorityInfo;
                    return (
                      <tr
                        key={t.id}
                        className={`border-b last:border-0 hover:bg-muted/20 ${t.locked ? "opacity-60" : "cursor-pointer"}`}
                      >
                        <td className="py-3 px-4">
                          {t.locked ? (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <Checkbox
                              checked={t.status === "done"}
                              onCheckedChange={() => handleToggle(t)}
                            />
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <span className={t.status === "done" ? "line-through text-muted-foreground" : ""}>{t.name}</span>
                          {t.estimatedDays ? (
                            <span className="text-[10px] text-muted-foreground ms-2">{t.estimatedDays} يوم</span>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            {t.projectName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{t.phaseTitle}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-xs">
                            <User className="w-3 h-3" />
                            {t.assignee || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {t.deadline ? (
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3" />
                              {t.deadline}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${pr.bg} ${pr.color}`}>{pr.label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{t.statusAr}</span>
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
          {Object.entries(statusConfig).map(([label, st]) => {
            const cols = filtered.filter((t) => t.statusAr === label);
            return (
              <div key={label} className="min-w-[260px] w-[260px] shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color} font-medium`}>{label}</span>
                  <Badge variant="secondary" className="text-xs">{cols.length}</Badge>
                </div>
                <div className="space-y-3">
                  {cols.map((t) => {
                    const pr = t.priorityInfo;
                    return (
                      <Card key={t.id} className={`border-0 shadow-sm hover:shadow-md transition-all ${t.locked ? "opacity-60" : "cursor-pointer"}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            {t.locked ? (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            ) : (
                              <Checkbox
                                checked={t.status === "done"}
                                onCheckedChange={() => handleToggle(t)}
                                className="mt-0.5 shrink-0"
                              />
                            )}
                            <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <FolderKanban className="w-3 h-3" />{t.projectName}
                          </div>
                          <div className="text-[11px] text-muted-foreground mb-2">{t.phaseTitle}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs"><User className="w-3 h-3" />{t.assignee || "—"}</div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pr.bg} ${pr.color}`}>{pr.label}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {cols.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed rounded-xl">لا توجد مهام</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
