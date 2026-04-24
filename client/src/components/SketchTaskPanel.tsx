/*
 * SketchTaskPanel - كرت تصميم الكروكي
 * - معلومات المشروع الثابتة (قسيمة + أدوار + تصميم) → مختصرة في أعلى الكرت، قابلة للطي
 * - الجزء الرئيسي → سجل الجلسات مع المالك
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X, PenLine, MapPin, ChevronRight, ChevronDown, ChevronUp,
  Calendar, Users, CheckCircle2, Plus, Clock, Edit3,
  Building2, Palette, Layers, Trash2, Save
} from "lucide-react";

/* ─── Types ─── */
interface Meeting {
  id: number;
  date: string;
  attendees: string[];
  agreed: string[];
  changes: string;
  status: "confirmed" | "pending";
}

/* ─── Static project data (filled once) ─── */
const PROJECT_INFO = {
  plot: { area: "400 م²", shape: "زاوية", facing: "شمال", location: "الجهراء - ق12", blocked: ["جنوب", "شرق", "غرب"] },
  floors: ["سرداب", "أرضي", "أول", "ثاني", "سطح"],
  style: "موديرن كلاسيك",
  colors: "بيج + رمادي + أبيض",
  materials: "حجر طبيعي + زجاج",
};

/* ─── Initial meetings ─── */
const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 1, date: "2026-04-10", attendees: ["م. مارك", "فهد العتيبي"],
    agreed: ["مساحة 400م²", "واجهة شمالية", "موديرن كلاسيك", "مدخل رجال شرقي"],
    changes: "جلسة أولى — لا تعديلات", status: "confirmed",
  },
  {
    id: 2, date: "2026-04-14", attendees: ["م. مارك", "م. مصطفى", "فهد العتيبي"],
    agreed: ["مسبح في السطح", "تعديل موقع المطبخ", "دريسنج للماستر"],
    changes: "نقل المطبخ للجهة الغربية", status: "confirmed",
  },
  {
    id: 3, date: "2026-04-20", attendees: ["م. مارك", "فهد العتيبي"],
    agreed: ["مراجعة الكروكي الأول", "تعديل الواجهة", "اعتماد التوزيع"],
    changes: "إضافة أعمدة كلاسيكية للواجهة", status: "pending",
  },
];

/* ─── New meeting form default ─── */
const EMPTY_MEETING = { date: "", attendees: "", agreed: "", changes: "" };

export default function SketchTaskPanel({ onClose, phaseColor }: { onClose: () => void; phaseColor: string }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [openMeeting, setOpenMeeting] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_MEETING);

  function addMeeting() {
    if (!form.date || !form.agreed) return;
    const newM: Meeting = {
      id: meetings.length + 1,
      date: form.date,
      attendees: form.attendees.split("،").map(s => s.trim()).filter(Boolean),
      agreed: form.agreed.split("\n").map(s => s.trim()).filter(Boolean),
      changes: form.changes || "—",
      status: "pending",
    };
    setMeetings(prev => [...prev, newM]);
    setForm(EMPTY_MEETING);
    setShowAddForm(false);
    setOpenMeeting(newM.id);
  }

  function confirmMeeting(id: number) {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: "confirmed" } : m));
  }

  function deleteMeeting(id: number) {
    setMeetings(prev => prev.filter(m => m.id !== id));
  }

  const totalAgreed = meetings.reduce((s, m) => s + m.agreed.length, 0);
  const totalChanges = meetings.filter(m => m.changes !== "—" && !m.changes.includes("لا تعديلات")).length;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="w-full max-w-md bg-background shadow-2xl flex flex-col"
        style={{ borderRight: `3px solid ${phaseColor}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* ══ Header ══ */}
        <div className="px-4 pt-3 pb-2 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in oklch, ${phaseColor} 15%, white)` }}>
              <PenLine className="w-4 h-4" style={{ color: phaseColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span>المشاريع</span><ChevronRight className="w-2.5 h-2.5" />
                <span style={{ color: phaseColor }}>المرحلة الأولى</span>
              </div>
              <p className="text-sm font-bold">تصميم الكروكي المعماري</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ══ معلومات المشروع الثابتة (قابلة للطي) ══ */}
        <div className="border-b shrink-0">
          <button
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/20 transition-colors text-right"
            onClick={() => setInfoOpen(!infoOpen)}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: phaseColor }} />
              <span className="text-[11px] font-semibold text-muted-foreground">معلومات المشروع</span>
              {/* Quick summary chips */}
              <div className="flex items-center gap-1 mr-1 overflow-hidden">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground shrink-0">{PROJECT_INFO.plot.area}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground shrink-0">{PROJECT_INFO.plot.facing}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground shrink-0">{PROJECT_INFO.style}</span>
              </div>
            </div>
            {infoOpen
              ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          </button>

          {infoOpen && (
            <div className="px-4 pb-3 space-y-2.5 bg-muted/10">
              {/* Plot */}
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5" />القسيمة
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { l: "الموقع", v: PROJECT_INFO.plot.location },
                    { l: "المساحة", v: PROJECT_INFO.plot.area },
                    { l: "الشكل", v: PROJECT_INFO.plot.shape },
                    { l: "الواجهة", v: PROJECT_INFO.plot.facing },
                  ].map(i => (
                    <div key={i.l} className="flex items-center gap-1.5 bg-background rounded-lg px-2 py-1 border border-border/40">
                      <span className="text-[9px] text-muted-foreground">{i.l}:</span>
                      <span className="text-[10px] font-semibold">{i.v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {["شمال", "جنوب", "شرق", "غرب"].map(d => {
                    const blocked = PROJECT_INFO.plot.blocked.includes(d);
                    return (
                      <span key={d} className={`text-[9px] px-1.5 py-0.5 rounded-full ${blocked ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-600 border border-green-200"}`}>
                        {blocked ? "🔴" : "🟢"} {d}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Floors + Style in one row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background rounded-lg px-2.5 py-2 border border-border/40">
                  <p className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />الأدوار</p>
                  <div className="flex flex-wrap gap-1">
                    {PROJECT_INFO.floors.map(f => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/50">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-background rounded-lg px-2.5 py-2 border border-border/40">
                  <p className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1"><Palette className="w-2.5 h-2.5" />التصميم</p>
                  <p className="text-[10px] font-semibold">{PROJECT_INFO.style}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{PROJECT_INFO.materials}</p>
                  <p className="text-[9px] text-muted-foreground">{PROJECT_INFO.colors}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ سجل الجلسات (الجزء الرئيسي) ══ */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats bar */}
          <div className="flex items-center gap-0 border-b">
            {[
              { v: meetings.length, l: "جلسة", color: phaseColor },
              { v: totalAgreed, l: "بند متفق", color: "oklch(0.55 0.15 150)" },
              { v: totalChanges, l: "تعديل", color: "oklch(0.60 0.12 30)" },
            ].map((s, i) => (
              <div key={i} className="flex-1 text-center py-2 border-l last:border-l-0">
                <p className="text-base font-bold" style={{ color: s.color }}>{s.v}</p>
                <p className="text-[9px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="p-3 space-y-2">
            {/* Add meeting button */}
            {!showAddForm && (
              <button
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed text-[11px] font-medium transition-colors hover:bg-muted/20"
                style={{ borderColor: `color-mix(in oklch, ${phaseColor} 40%, transparent)`, color: phaseColor }}
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                تسجيل جلسة جديدة
              </button>
            )}

            {/* Add meeting form */}
            {showAddForm && (
              <div className="rounded-xl border-2 p-3 space-y-2.5 bg-muted/10"
                style={{ borderColor: `color-mix(in oklch, ${phaseColor} 40%, transparent)` }}>
                <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: phaseColor }}>
                  <Edit3 className="w-3.5 h-3.5" />تسجيل جلسة جديدة
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-muted-foreground block mb-0.5">التاريخ *</label>
                    <input type="date" value={form.date}
                      onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border bg-background focus:outline-none focus:ring-1"
                      style={{ "--tw-ring-color": phaseColor } as React.CSSProperties} />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground block mb-0.5">الحضور</label>
                    <input type="text" value={form.attendees} placeholder="م. مارك، العميل"
                      onChange={e => setForm(p => ({ ...p, attendees: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border bg-background focus:outline-none focus:ring-1" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-muted-foreground block mb-0.5">البنود المتفق عليها * (كل بند في سطر)</label>
                  <textarea value={form.agreed} rows={3} placeholder="بند 1&#10;بند 2&#10;بند 3"
                    onChange={e => setForm(p => ({ ...p, agreed: e.target.value }))}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border bg-background resize-none focus:outline-none focus:ring-1" />
                </div>

                <div>
                  <label className="text-[9px] text-muted-foreground block mb-0.5">التعديلات المطلوبة</label>
                  <input type="text" value={form.changes} placeholder="وصف التعديل أو اكتب: لا تعديلات"
                    onChange={e => setForm(p => ({ ...p, changes: e.target.value }))}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border bg-background focus:outline-none focus:ring-1" />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-xs h-8 text-white gap-1"
                    style={{ backgroundColor: phaseColor }} onClick={addMeeting}>
                    <Save className="w-3 h-3" />حفظ الجلسة
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8"
                    onClick={() => { setShowAddForm(false); setForm(EMPTY_MEETING); }}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            {/* Meeting list */}
            {[...meetings].reverse().map(m => {
              const open = openMeeting === m.id;
              return (
                <div key={m.id} className="rounded-xl border overflow-hidden">
                  {/* Meeting header */}
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right hover:bg-muted/10 transition-colors"
                    onClick={() => setOpenMeeting(open ? null : m.id)}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: phaseColor }}>{m.id}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold">الجلسة {m.id}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${m.status === "confirmed" ? "bg-green-50 text-green-600 border border-green-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"}`}>
                          {m.status === "confirmed" ? "✓ مؤكدة" : "⏳ معلقة"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{m.date}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />{m.agreed.length} بنود</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{m.attendees.length} حضور</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Meeting details */}
                  {open && (
                    <div className="border-t bg-muted/5 px-3 py-2.5 space-y-2.5">
                      {/* Attendees */}
                      <div className="flex gap-1.5 flex-wrap">
                        {m.attendees.map((a, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] bg-background border rounded-full px-2 py-0.5">
                            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                              style={{ backgroundColor: phaseColor }}>
                              {a.replace("م. ", "").charAt(0)}
                            </div>
                            {a}
                          </span>
                        ))}
                      </div>

                      {/* Agreed points */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-semibold text-muted-foreground">البنود المتفق عليها</p>
                        {m.agreed.map((p, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>

                      {/* Changes */}
                      <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2 bg-orange-50 border border-orange-100">
                        <span className="text-xs shrink-0">🔄</span>
                        <div>
                          <p className="text-[9px] font-semibold text-orange-700 mb-0.5">التعديلات</p>
                          <p className="text-[10px] text-orange-600">{m.changes}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        {m.status === "pending" && (
                          <button
                            className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg text-white font-medium"
                            style={{ backgroundColor: phaseColor }}
                            onClick={() => confirmMeeting(m.id)}
                          >
                            <CheckCircle2 className="w-3 h-3" />تأكيد الجلسة
                          </button>
                        )}
                        <button
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors mr-auto"
                          onClick={() => deleteMeeting(m.id)}
                        >
                          <Trash2 className="w-3 h-3" />حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {meetings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">لا توجد جلسات مسجلة بعد</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ Footer ══ */}
        <div className="px-3 py-2.5 border-t bg-muted/10 flex gap-2 shrink-0">
          <Button className="flex-1 text-white text-xs h-8" style={{ backgroundColor: phaseColor }} onClick={onClose}>إغلاق</Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
            onClick={() => { setInfoOpen(true); }}>
            تعديل معلومات المشروع
          </Button>
        </div>
      </div>
    </div>
  );
}
