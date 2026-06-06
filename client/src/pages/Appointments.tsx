/**
 * Appointments - صفحة تقويم المواعيد مع آلية حجز كاملة
 */
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, User, ChevronLeft, ChevronRight,
  MessageCircle, Trash2, UserCheck, CalendarDays, Plus,
  X, Search, UserPlus, Users, CheckCircle2, Phone,
} from "lucide-react";
import {
  useAppointments, useDeleteAppointment, useCreateAppointment,
  useClients, useEmployees,
} from "@/lib/api";
import { useEmployee } from "@/hooks/useEmployee";
import { toast } from "sonner";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const MEETING_REASONS = [
  "اجتماع مع العميل",
  "عرض تصميم",
  "توقيع عقد",
  "متابعة مشروع",
  "استلام مستندات",
  "عرض سعر",
  "زيارة موقع",
  "استشارة هندسية",
  "أخرى",
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00",
];

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

/* ─── نموذج حجز الموعد ─── */
function BookingModal({
  onClose,
  preselectedDate,
}: {
  onClose: () => void;
  preselectedDate?: string;
}) {
  const { data: clients = [] } = useClients();
  const { data: employees = [] } = useEmployees();
  const createAppointment = useCreateAppointment();
  const { employee: currentEmployee } = useEmployee();
  // هل المستخدم الحالي سكرتير؟ — تعيين الموظف إلزامي له
  const isSecretary = currentEmployee?.role === "secretary";

  // الخطوات: 1=نوع العميل، 2=اختيار/إدخال العميل، 3=تفاصيل الموعد
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clientType, setClientType] = useState<"existing" | "new" | null>(null);

  // بحث العميل الموجود
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // بيانات العميل الجديد
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // تفاصيل الموعد
  const [apptDate, setApptDate] = useState(preselectedDate || "");
  const [apptTime, setApptTime] = useState("");
  const [apptReason, setApptReason] = useState("اجتماع مع العميل");
  const [apptNotes, setApptNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

  // فلترة العملاء
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return clients.filter((c: any) =>
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).slice(0, 10);
  }, [clients, searchQuery]);

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setStep(3);
  };

  const handleNewClientNext = () => {
    if (!newClientName.trim()) { toast.error("أدخل اسم العميل"); return; }
    if (!newClientPhone.trim()) { toast.error("أدخل رقم الهاتف"); return; }
    setStep(3);
  };

  const handleSave = async () => {
    if (!apptDate) { toast.error("اختر تاريخ الموعد"); return; }
    if (!apptTime) { toast.error("اختر وقت الموعد"); return; }
    if (isSecretary && !assignedTo) { toast.error("يجب تعيين الموعد لموظف معين"); return; }
    setSaving(true);
    try {
      const clientName = clientType === "existing" ? selectedClient?.name : newClientName;
      const clientPhone = clientType === "existing" ? selectedClient?.phone : newClientPhone;
      const clientId = clientType === "existing" ? selectedClient?.id : null;
      await createAppointment.mutateAsync({
        clientName,
        clientPhone: clientPhone || "",
        clientId: clientId || null,
        leadId: selectedClient?.leadId || null,
        date: apptDate,
        time: apptTime,
        reason: apptReason,
        notes: apptNotes || null,
        assignedTo: assignedTo || null,
        status: "scheduled",
      });
      toast.success("✅ تم حجز الموعد بنجاح");
      onClose();
    } catch {
      toast.error("فشل حفظ الموعد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                <CalendarDays className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">حجز موعد جديد</h3>
                <p className="text-[11px] text-muted-foreground">
                  {step === 1 ? "اختر نوع العميل" : step === 2 ? (clientType === "existing" ? "اختر العميل" : "بيانات العميل الجديد") : "تفاصيل الموعد"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* شريط التقدم */}
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: s <= step ? "oklch(0.65 0.18 50)" : "oklch(0.90 0.00 0)" }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">

          {/* الخطوة 1: نوع العميل */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">هل العميل موجود في النظام أم جديد؟</p>
              <button
                className="w-full p-4 rounded-xl border-2 text-right flex items-center gap-3 hover:border-orange-400 hover:bg-orange-50 transition-all"
                onClick={() => { setClientType("existing"); setStep(2); }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">عميل موجود</p>
                  <p className="text-[11px] text-muted-foreground">اختر من قائمة العملاء المسجلين</p>
                </div>
              </button>
              <button
                className="w-full p-4 rounded-xl border-2 text-right flex items-center gap-3 hover:border-orange-400 hover:bg-orange-50 transition-all"
                onClick={() => { setClientType("new"); setStep(2); }}
              >
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">عميل جديد</p>
                  <p className="text-[11px] text-muted-foreground">أدخل بيانات العميل يدوياً</p>
                </div>
              </button>
            </div>
          )}

          {/* الخطوة 2: اختيار أو إدخال العميل */}
          {step === 2 && clientType === "existing" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">لا يوجد عملاء مطابقون</p>
                ) : (
                  filteredClients.map((client: any) => (
                    <button
                      key={client.id}
                      className="w-full p-3 rounded-lg border text-right flex items-center gap-3 hover:border-orange-400 hover:bg-orange-50 transition-all"
                      onClick={() => handleSelectClient(client)}
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{client.name}</p>
                        {client.phone && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />{client.phone}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setStep(1)}>
                رجوع
              </Button>
            </div>
          )}

          {step === 2 && clientType === "new" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">اسم العميل *</label>
                <input
                  type="text"
                  placeholder="أدخل الاسم الكامل"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">رقم الهاتف *</label>
                <input
                  type="tel"
                  placeholder="مثال: 50000000"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setStep(1)}>رجوع</Button>
                <Button size="sm" className="flex-1 text-xs bg-orange-500 hover:bg-orange-600 text-white" onClick={handleNewClientNext}>
                  التالي
                </Button>
              </div>
            </div>
          )}

          {/* الخطوة 3: تفاصيل الموعد */}
          {step === 3 && (
            <div className="space-y-3">
              {/* ملخص العميل */}
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold">
                    {clientType === "existing" ? selectedClient?.name : newClientName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {clientType === "existing" ? selectedClient?.phone : newClientPhone}
                    {clientType === "existing" && <span className="mr-2 text-blue-600">· عميل موجود</span>}
                    {clientType === "new" && <span className="mr-2 text-green-600">· عميل جديد</span>}
                  </p>
                </div>
              </div>

              {/* التاريخ */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">تاريخ الموعد *</label>
                <input
                  type="date"
                  value={apptDate}
                  onChange={e => setApptDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* الوقت */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">وقت الموعد *</label>
                <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1">
                  {TIME_SLOTS.map(t => (
                    <button
                      key={t}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${apptTime === t ? "bg-orange-500 text-white border-orange-500" : "border-border hover:border-orange-300 hover:bg-orange-50"}`}
                      onClick={() => setApptTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* سبب الموعد */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">سبب الموعد</label>
                <div className="flex flex-wrap gap-1.5">
                  {MEETING_REASONS.map(r => (
                    <button
                      key={r}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${apptReason === r ? "bg-orange-500 text-white border-orange-500" : "border-border hover:border-orange-300"}`}
                      onClick={() => setApptReason(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* المسؤول عن الموعد */}
              <div>
                <label className="text-xs font-medium mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                  تعيين الموعد لموظف
                  {isSecretary && <span className="text-red-500 mr-1">*</span>}
                  {!isSecretary && <span className="text-[10px] text-muted-foreground">(اختياري)</span>}
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {!isSecretary && (
                    <button
                      className={`p-2 rounded-lg border text-right transition-all text-xs ${
                        assignedTo === ""
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-border hover:border-orange-300"
                      }`}
                      onClick={() => setAssignedTo("")}
                    >
                      <p className="font-medium">بدون تعيين</p>
                      <p className="text-[10px] text-muted-foreground">اختياري</p>
                    </button>
                  )}
                  {(employees as any[]).filter((e: any) => e.isActive !== 0).map((emp: any) => {
                    const roleLabels: Record<string, string> = {
                      admin: "مدير", secretary: "سكرتير", architect: "م. معماري",
                      accountant: "محاسب", structural: "م. إنشائي",
                      draftsman: "رسام", facade_designer: "رسام واجهات",
                    };
                    const roleLabel = roleLabels[emp.role] || emp.role;
                    const isSelected = assignedTo === emp.name;
                    return (
                      <button
                        key={emp.id}
                        className={`p-2 rounded-lg border text-right transition-all ${
                          isSelected
                            ? "border-orange-400 bg-orange-50"
                            : "border-border hover:border-orange-300 hover:bg-orange-50/50"
                        }`}
                        onClick={() => setAssignedTo(emp.name)}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            {emp.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{emp.name}</p>
                            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {isSecretary && !assignedTo && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠</span> يجب اختيار موظف لتعيين الموعد له
                  </p>
                )}
              </div>

              {/* ملاحظات */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ملاحظات (اختياري)</label>
                <textarea
                  value={apptNotes}
                  onChange={e => setApptNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية..."
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* أزرار */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setStep(2)}>رجوع</Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "جاري الحفظ..." : "✓ تأكيد الحجز"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── الصفحة الرئيسية ─── */
export default function Appointments() {
  const { data: allAppointments = [], isLoading, isError } = useAppointments();
  const deleteAppointment = useDeleteAppointment();
  const { employee } = useEmployee();
  const { data: allEmployees = [] } = useEmployees();

  // صلاحيات عرض المواعيد:
  // - بدون تسجيل (Manus owner): يرى الكل
  // - سكرتير: يرى كل المواعيد (مسؤول عن الجدولة)
  // - أدمن / محاسب: يرى كل المواعيد
  // - باقي الموظفين: يرى فقط مواعيده المعيّنة له
  const canViewAll = !employee || employee.role === "secretary" || employee.role === "admin" || employee.role === "accountant";
  const appointments = canViewAll
    ? allAppointments
    : allAppointments.filter((a: any) => {
        if (!a.assignedTo) return false;
        const empName = employee!.name.trim().toLowerCase();
        const assigned = a.assignedTo.trim().toLowerCase();
        return assigned.includes(empName) || empName.includes(assigned);
      });

  // فلتر حسب الموظف (للأدمن والسكرتير)
  const [filterEmployee, setFilterEmployee] = useState("");

  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | undefined>();
  const [selectedDayAppts, setSelectedDayAppts] = useState<{ date: string; appts: any[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // تطبيق فلتر الموظف (للأدمن والسكرتير فقط)
  const filteredAppointments = canViewAll && filterEmployee
    ? appointments.filter((a: any) => {
        if (!a.assignedTo) return false;
        return a.assignedTo.trim().toLowerCase().includes(filterEmployee.trim().toLowerCase());
      })
    : appointments;

  const apptByDate: Record<string, any[]> = {};
  filteredAppointments.forEach((a: any) => {
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
  const todayAppts = apptByDate[todayKey] || [];

  const sendWhatsApp = (appt: any) => {
    const rawPhone = (appt.clientPhone || "").replace(/\s/g, "").replace(/^0+/, "");
    const phone = rawPhone.startsWith("965") ? rawPhone : `965${rawPhone}`;
    const dateStr = new Date(appt.date).toLocaleDateString("ar-KW", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = appt.time || "";
    const assignedStr = appt.assignedTo ? `\nالمسؤول: ${appt.assignedTo}` : "";
    const msg = `السيد / ${appt.clientName} المحترم،\n\nتحية طيبة وبعد،\n\nيسعدنا في مكتب ديناميك للاستشارات الهندسية تذكيركم بموعدكم المحدد وفق التفاصيل التالية:\n\n📅 التاريخ: ${dateStr}\n⏰ الوقت: ${timeStr}\n📋 نوع الاجتماع: ${appt.reason}${assignedStr}\n\nنتشرف بلقائكم في الموعد المحدد، ونأمل أن يكون اللقاء مثمراً.\n\nللاستفسار أو تعديل الموعد، يرجى التواصل معنا:\n📞 22091228 - 50855599\n📧 Info@DynamicSaud.com\n\nمع خالص التقدير والاحترام،\nمكتب ديناميك للاستشارات الهندسية`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الموعد؟")) return;
    try {
      await deleteAppointment.mutateAsync(id);
      toast.success("تم حذف الموعد");
      if (selectedDayAppts) {
        setSelectedDayAppts(prev => prev ? { ...prev, appts: prev.appts.filter(a => a.id !== id) } : null);
      }
    } catch {
      toast.error("فشل حذف الموعد");
    }
  };

  const openBookingForDate = (dateKey: string) => {
    setBookingDate(dateKey);
    setShowBooking(true);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto" dir="rtl">
      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          onClose={() => { setShowBooking(false); setBookingDate(undefined); }}
          preselectedDate={bookingDate}
        />
      )}

      {/* Day Detail Modal */}
      {selectedDayAppts && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedDayAppts(null)} />
          <div className="relative bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
            <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">مواعيد {selectedDayAppts.date}</h3>
                <p className="text-[11px] text-muted-foreground">{selectedDayAppts.appts.length} موعد</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="text-xs bg-orange-500 hover:bg-orange-600 text-white h-7"
                  onClick={() => { setSelectedDayAppts(null); openBookingForDate(selectedDayAppts.date); }}>
                  <Plus className="w-3 h-3 ml-1" />حجز موعد
                </Button>
                <button onClick={() => setSelectedDayAppts(null)} className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {selectedDayAppts.appts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-3">لا توجد مواعيد في هذا اليوم</p>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                    onClick={() => { setSelectedDayAppts(null); openBookingForDate(selectedDayAppts.date); }}>
                    <Plus className="w-3 h-3 ml-1" />حجز موعد جديد
                  </Button>
                </div>
              ) : (
                selectedDayAppts.appts.map((appt: any) => (
                  <div key={appt.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">{appt.clientName}</span>
                          <Badge variant="outline" className={`text-[10px] ${getStatusColor(appt.status)}`}>
                            {getStatusLabel(appt.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{appt.reason}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {appt.time && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{appt.time}</span>}
                          {appt.assignedTo && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><UserCheck className="w-3 h-3" />{appt.assignedTo}</span>}
                        </div>
                        {appt.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{appt.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200" onClick={() => sendWhatsApp(appt)}>
                          <MessageCircle className="w-3 h-3 ml-1" />تذكير
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(appt.id)}>
                          <Trash2 className="w-3 h-3 ml-1" />حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              تقويم المواعيد
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredAppointments.length} موعد إجمالي · {todayAppts.length} موعد اليوم
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => { setBookingDate(undefined); setShowBooking(true); }}
            >
              <Plus className="w-3.5 h-3.5 ml-1" />حجز موعد
            </Button>
            <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")} className="text-xs">
              <Calendar className="w-3.5 h-3.5 ml-1" />تقويم
            </Button>
            <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} className="text-xs">
              <Clock className="w-3.5 h-3.5 ml-1" />قائمة
            </Button>
          </div>
        </div>

        {/* فلتر حسب الموظف — للأدمن والسكرتير فقط */}
        {canViewAll && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />عرض مواعيد:
            </span>
            <button
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filterEmployee === ""
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-border hover:border-orange-300"
              }`}
              onClick={() => setFilterEmployee("")}
            >
              الجميع
            </button>
            {(allEmployees as any[]).filter((e: any) => e.isActive !== 0).map((emp: any) => (
              <button
                key={emp.id}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filterEmployee === emp.name
                    ? "bg-orange-500 text-white border-orange-500"
                    : "border-border hover:border-orange-300"
                }`}
                onClick={() => setFilterEmployee(filterEmployee === emp.name ? "" : emp.name)}
              >
                {emp.name}
              </button>
            ))}
          </div>
        )}
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
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <Button size="sm" variant="ghost" onClick={prevMonth}><ChevronRight className="w-4 h-4" /></Button>
            <h2 className="text-sm font-bold">{MONTHS_AR[month]} {year}</h2>
            <Button size="sm" variant="ghost" onClick={nextMonth}><ChevronLeft className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-7 border-b">
            {DAYS_AR.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2 border-l last:border-l-0">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-l border-b last:border-l-0 bg-muted/10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayAppts = apptByDate[dateKey] || [];
              const isToday = dateKey === todayKey;
              return (
                <div
                  key={day}
                  className={`min-h-[80px] border-l border-b last:border-l-0 p-1.5 cursor-pointer hover:bg-orange-50/50 transition-colors group ${isToday ? "bg-orange-50" : ""}`}
                  onClick={() => setSelectedDayAppts({ date: dateKey, appts: dayAppts })}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-orange-500 text-white" : "text-foreground"}`}>
                      {day}
                    </div>
                    <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => { e.stopPropagation(); openBookingForDate(dateKey); }} />
                  </div>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 2).map((appt: any) => (
                      <div key={appt.id} className="text-[10px] bg-orange-100 text-orange-800 rounded px-1 py-0.5 truncate"
                        title={`${appt.clientName} - ${appt.reason}${appt.time ? ` - ${appt.time}` : ""}`}>
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
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">لا توجد مواعيد بعد</p>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                onClick={() => setShowBooking(true)}>
                <Plus className="w-3.5 h-3.5 ml-1" />حجز أول موعد
              </Button>
            </div>
          ) : (
            [...filteredAppointments]
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
