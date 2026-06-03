/**
 * Appointments - صفحة تقويم المواعيد
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, User, ChevronLeft, ChevronRight,
  MessageCircle, Trash2, UserCheck, CalendarDays,
} from "lucide-react";
import { useAppointments, useDeleteAppointment } from "@/lib/api";
import { toast } from "sonner";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getStatusColor(status: string) {
  if (status === "completed") return "bg-green-100 text-green-700 border-green-200";
  if (status === "cancelled") return "bg-red-100 text-red-700 border-red-200";
  return "bg-orange-100 text-orange-700 border-orange-200";
}

function getStatusLabel(status: string) {
  if (status === "completed") return "مكتمل";
  if (status === "cancelled") return "ملغي";
  return "مجدول";
}

export default function Appointments() {
  const { data: appointments = [], isLoading, isError } = useAppointments();
  const deleteAppointment = useDeleteAppointment();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // بناء أيام الشهر
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // تجميع المواعيد حسب التاريخ
  const apptByDate: Record<string, any[]> = {};
  appointments.forEach((a: any) => {
    const key = a.date?.slice(0, 10);
    if (key) {
      if (!apptByDate[key]) apptByDate[key] = [];
      apptByDate[key].push(a);
    }
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const sendWhatsApp = (appt: any) => {
    const rawPhone = (appt.clientPhone || "").replace(/\s/g, "").replace(/^0+/, "");
    const phone = rawPhone.startsWith("965") ? rawPhone : `965${rawPhone}`;
    const dateStr = new Date(appt.date).toLocaleDateString("ar-KW", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = appt.time ? ` الساعة ${appt.time}` : "";
    const assignedStr = appt.assignedTo ? `\nالمسؤول: ${appt.assignedTo}` : "";
    const msg = `السيد / ${appt.clientName} المحترم،\n\nتحية طيبة وبعد،\n\nيسعدنا في مكتب ديناميك للاستشارات الهندسية تذكيركم بموعدكم المحدد وفق التفاصيل التالية:\n\n📅 التاريخ: ${dateStr}\n⏰ الوقت: ${timeStr.replace(" الساعة ", "")}\n📋 نوع الاجتماع: ${appt.reason}${assignedStr}\n\nنتشرف بلقائكم في الموعد المحدد، ونأمل أن يكون اللقاء مثمراً.\n\nللاستفسار أو تعديل الموعد، يرجى التواصل معنا:\n📞 22091228 - 50855599\n📧 Info@DynamicSaud.com\n\nمع خالص التقدير والاحترام،\nمكتب ديناميك للاستشارات الهندسية`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الموعد؟")) return;
    try {
      await deleteAppointment.mutateAsync(id);
      toast.success("تم حذف الموعد");
    } catch {
      toast.error("فشل حذف الموعد");
    }
  };

  // مواعيد اليوم
  const todayAppts = apptByDate[todayKey] || [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              تقويم المواعيد
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {appointments.length} موعد إجمالي · {todayAppts.length} موعد اليوم
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")} className="text-xs">
              <Calendar className="w-3.5 h-3.5 ml-1" />تقويم
            </Button>
            <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} className="text-xs">
              <Clock className="w-3.5 h-3.5 ml-1" />قائمة
            </Button>
          </div>
        </div>

        {/* مواعيد اليوم */}
        {todayAppts.length > 0 && (
          <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
            <h3 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />مواعيد اليوم
            </h3>
            <div className="space-y-2">
              {todayAppts.map((appt: any) => (
                <div key={appt.id} className="flex items-center justify-between gap-2 bg-white rounded p-2 border border-orange-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{appt.clientName}</p>
                    <p className="text-[11px] text-muted-foreground">{appt.reason} {appt.time && `· ${appt.time}`}</p>
                    {appt.assignedTo && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><UserCheck className="w-3 h-3" />{appt.assignedTo}</p>}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 shrink-0"
                    onClick={() => sendWhatsApp(appt)}>
                    <MessageCircle className="w-3 h-3 ml-1" />تذكير
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isError ? (
          <div className="flex justify-center py-12 text-red-500 text-sm">فشل تحميل المواعيد. يرجى تحديث الصفحة.</div>
        ) : isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : view === "calendar" ? (
          /* ── عرض التقويم ── */
          <div className="border rounded-xl overflow-hidden bg-card">
            {/* شريط التنقل */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <Button size="sm" variant="ghost" onClick={prevMonth}><ChevronRight className="w-4 h-4" /></Button>
              <h2 className="text-sm font-bold">{MONTHS_AR[month]} {year}</h2>
              <Button size="sm" variant="ghost" onClick={nextMonth}><ChevronLeft className="w-4 h-4" /></Button>
            </div>
            {/* أيام الأسبوع */}
            <div className="grid grid-cols-7 border-b">
              {DAYS_AR.map(d => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2 border-l last:border-l-0">{d}</div>
              ))}
            </div>
            {/* الأيام */}
            <div className="grid grid-cols-7">
              {/* فراغات قبل أول يوم */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-l border-b last:border-l-0 bg-muted/10" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayAppts = apptByDate[dateKey] || [];
                const isToday = dateKey === todayKey;
                return (
                  <div key={day} className={`min-h-[80px] border-l border-b last:border-l-0 p-1.5 ${isToday ? "bg-orange-50" : ""}`}>
                    <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-orange-500 text-white" : "text-foreground"}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 2).map((appt: any) => (
                        <div key={appt.id} className="text-[10px] bg-orange-100 text-orange-800 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-orange-200"
                          title={`${appt.clientName} - ${appt.reason}${appt.time ? ` - ${appt.time}` : ""}${appt.assignedTo ? ` - ${appt.assignedTo}` : ""}`}>
                          {appt.time && <span className="font-bold">{appt.time} </span>}
                          {appt.clientName}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">+{dayAppts.length - 2} أخرى</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── عرض القائمة ── */
          <div className="space-y-2">
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">لا توجد مواعيد</div>
            ) : (
              [...appointments]
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((appt: any) => (
                  <div key={appt.id} className="p-3 rounded-lg border bg-card flex items-start gap-3">
                    <div className="w-12 text-center shrink-0">
                      <div className="text-lg font-bold text-orange-600 leading-none">
                        {new Date(appt.date).getDate()}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {MONTHS_AR[new Date(appt.date).getMonth()]}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{appt.clientName}</span>
                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(appt.status)}`}>
                          {getStatusLabel(appt.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{appt.reason}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {appt.time && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />{appt.time}
                          </span>
                        )}
                        {appt.assignedTo && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />{appt.assignedTo}
                          </span>
                        )}
                      </div>
                      {appt.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{appt.notes}</p>}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200"
                        onClick={() => sendWhatsApp(appt)}>
                        <MessageCircle className="w-3 h-3 ml-1" />تذكير
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(appt.id)}>
                        <Trash2 className="w-3 h-3 ml-1" />حذف
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
    </div>
  );
}
